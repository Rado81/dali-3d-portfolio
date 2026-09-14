import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { animated, useSpring, type SpringValue } from "@react-spring/three";
import { AdditiveBlending, Matrix3, ShaderMaterial, type Fog, type Mesh, type Texture } from "three";
import { useStore } from "../store";
import { FLOOR_FADE, FLOOR_Y, REFLECTION_BLUR, REFLECTION_FALLOFF, floorVisible } from "./floorParams";
import { TILE_H, TILE_W } from "./layout";

const vertexShader = /* glsl */ `
uniform mat3 uUvTransform;
varying vec2 vUv;
varying float vWorldY;
varying float vDepth;
void main() {
  vUv = (uUvTransform * vec3(uv, 1.0)).xy;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldY = world.y;
  vec4 mv = viewMatrix * world;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uTint;
uniform float uFade;
uniform float uFloorY;
uniform float uFalloff;
uniform float uBlur;
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vUv;
varying float vWorldY;
varying float vDepth;
void main() {
  float below = max(uFloorY - vWorldY, 0.0);
  vec3 color = texture2D(uMap, vUv, below * uBlur).rgb * uTint * exp(-uFalloff * below);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  // additive light: the fog and the fade take it away rather than mixing it toward a colour
  gl_FragColor.rgb *= (1.0 - smoothstep(uFogNear, uFogFar, vDepth)) * uFade;
}`;

interface ReflectionProps {
  texture: Texture;
  scale: SpringValue<number>;
  tint: SpringValue<number>;
  /** The tile's slot height, so the mirror lands on the world floor from inside the tile's group. */
  slotY: number;
}

/**
 * A tile's reflection in the title card's floor: the tile mirrored about the floor plane, dimmer and softer the
 * deeper it goes. Additive, so it lights the floor and the haze behind it and never darkens them; it follows the
 * tile's scale and tint springs and fades with the floor.
 */
export function Reflection({ texture, scale, tint, slotY }: ReflectionProps) {
  const mode = useStore((s) => s.mode);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const { fade } = useSpring({ fade: floorVisible(mode) ? 1 : 0, config: FLOOR_FADE, immediate: reducedMotion });
  const mesh = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: null },
          uUvTransform: { value: new Matrix3() },
          uTint: { value: 0 },
          uFade: { value: 0 },
          uFloorY: { value: FLOOR_Y },
          uFalloff: { value: REFLECTION_FALLOFF },
          uBlur: { value: REFLECTION_BLUR },
          uFogNear: { value: 0 },
          uFogFar: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    texture.updateMatrix(); // a 4:3 fallback thumbnail is cropped through its repeat and offset
    material.uniforms.uMap.value = texture;
    material.uniforms.uUvTransform.value.copy(texture.matrix);
  }, [texture, material]);

  useFrame(({ scene }) => {
    const f = fade.get();
    material.uniforms.uFade.value = f;
    material.uniforms.uTint.value = tint.get();
    const fog = scene.fog as Fog | null;
    if (fog) {
      material.uniforms.uFogNear.value = fog.near;
      material.uniforms.uFogFar.value = fog.far;
    }
    if (mesh.current) mesh.current.visible = f > 0.001;
  });

  // a mirror about the world floor, expressed inside the tile's group: flip y, then lift by twice the gap to the floor
  return (
    <group position-y={2 * (FLOOR_Y - slotY)} scale-y={-1}>
      <animated.mesh ref={mesh} scale={scale} material={material} renderOrder={-2}>
        <planeGeometry args={[TILE_W, TILE_H]} />
      </animated.mesh>
    </group>
  );
}
