import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { Color, ShaderMaterial, type Fog, type Mesh } from "three";
import { hasPostprocessing } from "../device";
import { useStore } from "../store";
import { outputDither } from "./dither";
import { FLOOR_COLOR, FLOOR_F0, FLOOR_FADE, FLOOR_SIZE, FLOOR_Y, floorVisible } from "./floorParams";

const vertexShader = /* glsl */ `
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mv = viewMatrix * world;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uF0;
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
uniform float uDither;
varying vec3 vWorld;
varying float vDepth;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  // Schlick: looking down at the floor near the camera it barely reflects; toward the horizon it mostly does
  float cosTheta = clamp(normalize(cameraPosition - vWorld).y, 0.0, 1.0);
  float reflectance = uF0 + (1.0 - uF0) * pow(1.0 - cosTheta, 5.0);
  reflectance = clamp(reflectance * (0.7 + 0.4 * noise(vWorld.xz * 3.5)), 0.0, 0.9); // faint smudges break up the sheen
  // the far floor thins out with the fog, so it dissolves into the haze instead of ending in a hard band
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(uColor, (1.0 - reflectance) * (1.0 - fog) * uFade);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) * uDither;
}`;

/**
 * The studio floor under the title card: near-black gloss over the haze, showing the tiles' reflections
 * (Reflection.tsx) through it, most toward the horizon. It fades out as the camera flies into the ring and
 * back in on the way out, and draws nothing while it is gone.
 */
export function Floor() {
  const mode = useStore((s) => s.mode);
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const composer = hasPostprocessing(isMobile, reducedMotion);
  const { fade } = useSpring({ fade: floorVisible(mode) ? 1 : 0, config: FLOOR_FADE, immediate: reducedMotion });
  const mesh = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(FLOOR_COLOR) },
          uF0: { value: FLOOR_F0 },
          uFade: { value: 0 },
          uFogNear: { value: 0 },
          uFogFar: { value: 1 },
          uDither: { value: outputDither(composer) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        toneMapped: false,
      }),
    [composer],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ scene }) => {
    const f = fade.get();
    material.uniforms.uFade.value = f;
    const fog = scene.fog as Fog | null;
    if (fog) {
      material.uniforms.uFogNear.value = fog.near;
      material.uniforms.uFogFar.value = fog.far;
    }
    if (mesh.current) mesh.current.visible = f > 0.001;
  });

  // after the reflections (renderOrder -2) and before the tiles' spill, shadows and edges (0)
  return (
    <mesh ref={mesh} position-y={FLOOR_Y} rotation-x={-Math.PI / 2} renderOrder={-1} material={material}>
      <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
    </mesh>
  );
}
