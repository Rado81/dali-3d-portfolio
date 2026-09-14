import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Data3DTexture, LinearFilter, Matrix4, Mesh, RedFormat,
  RepeatWrapping, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type PerspectiveCamera, type Points,
} from "three";
import { hasPostprocessing } from "../device";
import { useStore } from "../store";
import {
  BEAM_APEX, BEAM_COLOR, BEAM_FADE, BEAM_INTENSITY, BEAM_RESOLUTION, BEAM_TAN, DUST_SIZE, MOTE_BOX_MAX, MOTE_BOX_MIN, MOTE_COLOR, MOTE_COUNT,
  beamAxis, beamFlicker, beamSteps, beamVisible, dustVolume,
} from "./beamParams";
import { COMPOSITE_FRAGMENT, MARCH_FRAGMENT, MOTE_FRAGMENT, MOTE_VERTEX, SCREEN_VERTEX } from "./beamShaders";
import { outputDither } from "./dither";
import { hazeTime } from "./hazeParams";
import { RING_RADIUS } from "./layout";

function screenTriangle(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  return g;
}

function moteGeometry(count: number): BufferGeometry {
  let seed = 911;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const position = new Float32Array(count * 3), phase = new Float32Array(count * 3), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    position.set([random(), random(), random()], i * 3);
    phase.set([random(), random(), random()], i * 3);
    size[i] = 0.01 + 0.022 * random() ** 2;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(position, 3));
  g.setAttribute("phase", new BufferAttribute(phase, 3));
  g.setAttribute("moteSize", new BufferAttribute(size, 1));
  return g;
}

function makeResources() {
  const dust = new Data3DTexture(dustVolume(DUST_SIZE), DUST_SIZE, DUST_SIZE, DUST_SIZE);
  dust.format = RedFormat;
  dust.minFilter = dust.magFilter = LinearFilter;
  dust.wrapS = dust.wrapT = dust.wrapR = RepeatWrapping;
  dust.unpackAlignment = 1;
  dust.needsUpdate = true;

  const cone = { uApex: { value: new Vector3(...BEAM_APEX) }, uAxis: { value: new Vector3(...beamAxis()) }, uTan: { value: BEAM_TAN } };
  const target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  const screen = screenTriangle();
  const march = new ShaderMaterial({
    uniforms: {
      ...cone, uInvViewProj: { value: new Matrix4() }, uCamPos: { value: new Vector3() }, uTime: { value: 0 },
      uRingRadius: { value: RING_RADIUS }, uSteps: { value: beamSteps(false) }, uDust: { value: dust },
    },
    vertexShader: SCREEN_VERTEX, fragmentShader: MARCH_FRAGMENT, depthTest: false, depthWrite: false,
  });
  const marchScene = new Scene();
  const marchQuad = new Mesh(screen, march);
  marchQuad.frustumCulled = false;
  marchScene.add(marchQuad);

  const composite = new ShaderMaterial({
    uniforms: {
      uBeam: { value: target.texture }, uColor: { value: new Color(BEAM_COLOR) }, uIntensity: { value: 0 },
      uDither: { value: 0 }, uTime: { value: 0 },
    },
    vertexShader: SCREEN_VERTEX, fragmentShader: COMPOSITE_FRAGMENT,
    transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
  });
  const motes = new ShaderMaterial({
    uniforms: {
      ...cone, uColor: { value: new Color(MOTE_COLOR) }, uTime: { value: 0 }, uFade: { value: 0 }, uPixelScale: { value: 1 },
      uBoxMin: { value: new Vector3(...MOTE_BOX_MIN) }, uBoxMax: { value: new Vector3(...MOTE_BOX_MAX) },
    },
    vertexShader: MOTE_VERTEX, fragmentShader: MOTE_FRAGMENT,
    transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
  });
  const motesGeometry = moteGeometry(MOTE_COUNT);

  return {
    dust, target, screen, march, marchScene, composite, motes, motesGeometry,
    dispose() {
      for (const d of [dust, target, screen, march, composite, motes, motesGeometry]) d.dispose();
    },
  };
}

/**
 * A projector behind and above the camera throws a soft cone of warm light onto the focused tile, with dust
 * drifting through it. For the ring only: it fades in with the camera and out when the title card, a panel or the
 * player takes over, and draws nothing while it is gone. The cone is ray-marched at quarter resolution before the
 * frame (this callback runs ahead of the composer's) and added over the scene; the motes are points in the scene.
 */
export function ProjectorBeam() {
  const mode = useStore((s) => s.mode);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const size = useThree((s) => s.size);
  const { fade } = useSpring({ fade: beamVisible(mode) ? 1 : 0, config: BEAM_FADE, immediate: reducedMotion });
  const resources = useMemo(() => makeResources(), []);
  useEffect(() => () => resources.dispose(), [resources]);
  useEffect(() => {
    resources.target.setSize(Math.max(1, Math.round(size.width * BEAM_RESOLUTION)), Math.max(1, Math.round(size.height * BEAM_RESOLUTION)));
  }, [resources, size]);

  const composite = useRef<Mesh>(null);
  const motes = useRef<Points>(null);
  const time = useRef(0);
  const buffer = useMemo(() => new Vector2(), []);

  useFrame(({ gl, camera }, delta) => {
    const f = fade.get();
    const on = f > 0.001;
    if (composite.current) composite.current.visible = on;
    if (motes.current) motes.current.visible = on;
    if (!on) return;

    const s = useStore.getState();
    time.current = hazeTime(time.current, delta, s.reducedMotion); // the haze's clock: capped per frame, still under reduced motion
    camera.updateMatrixWorld();
    const m = resources.march.uniforms;
    m.uInvViewProj.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    m.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    m.uTime.value = time.current;
    m.uSteps.value = beamSteps(s.isMobile);
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(resources.target);
    gl.render(resources.marchScene, camera);
    gl.setRenderTarget(previous);

    const c = resources.composite.uniforms;
    c.uIntensity.value = BEAM_INTENSITY * f * beamFlicker(time.current);
    c.uTime.value = time.current;
    c.uDither.value = outputDither(hasPostprocessing(s.isMobile, s.reducedMotion));
    const d = resources.motes.uniforms;
    d.uTime.value = time.current;
    d.uFade.value = f;
    const fov = (camera as PerspectiveCamera).fov ?? 60;
    d.uPixelScale.value = gl.getDrawingBufferSize(buffer).y / 2 / Math.tan((fov * Math.PI) / 360);
  });

  // after the tiles, their spill and the floor; the beam ignores depth because the march already stops at the ring
  return (
    <>
      <mesh ref={composite} geometry={resources.screen} material={resources.composite} frustumCulled={false} renderOrder={10} />
      <points ref={motes} geometry={resources.motesGeometry} material={resources.motes} frustumCulled={false} renderOrder={11} />
    </>
  );
}
