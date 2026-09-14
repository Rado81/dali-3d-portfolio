import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, ShaderMaterial } from "three";
import { hasPostprocessing } from "../device";
import { useStore } from "../store";
import { outputDither } from "./dither";
import {
  HAZE_DARK, HAZE_DRIFT_PER_S, HAZE_EVOLVE_PER_S, HAZE_PEAK, HAZE_SCALE,
  hazeOctaves, hazeProfileTexture, hazeTime,
} from "./hazeParams";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform float uDither;
uniform float uScale;
uniform float uDrift;
uniform float uEvolve;
uniform vec3 uDark;
uniform vec3 uPeak;
uniform sampler2D uProfile;
varying vec2 vUv;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// value noise: a smooth blend of the hash at the eight corners of the cell
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  float total = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    sum += amp * noise(p);
    total += amp;
    p = p * 2.03 + 19.19;
    amp *= 0.5;
  }
  return sum / total;
}

void main() {
  vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5) * uScale;
  float n = fbm(vec3(p.x + uTime * uDrift, p.y, uTime * uEvolve));
  n = smoothstep(0.25, 0.85, n);
  float profile = texture2D(uProfile, vec2(vUv.y, 0.5)).r;
  float k = profile * (0.3 + 0.7 * n);
  gl_FragColor = vec4(mix(uDark, uPeak, k), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) * uDither;
}`;

/**
 * The screening room's air: a slow, very dark haze behind the ring, fullest at the ring's horizon and
 * thinning toward the top and bottom of the screen. Drawn first over the whole frame, before depth,
 * so the tiles and their light sit on it. Its shape and pace come from hazeParams.ts.
 */
export function Haze() {
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const composer = hasPostprocessing(isMobile, reducedMotion);
  const time = useRef(0);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uDither: { value: outputDither(composer) },
          uScale: { value: HAZE_SCALE },
          uDrift: { value: HAZE_DRIFT_PER_S },
          uEvolve: { value: HAZE_EVOLVE_PER_S },
          uDark: { value: new Color(HAZE_DARK) },
          uPeak: { value: new Color(HAZE_PEAK) },
          uProfile: { value: hazeProfileTexture() },
        },
        defines: { OCTAVES: hazeOctaves(isMobile) },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [isMobile, composer],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ size }, delta) => {
    time.current = hazeTime(time.current, delta, useStore.getState().reducedMotion);
    material.uniforms.uTime.value = time.current;
    material.uniforms.uAspect.value = size.width / size.height;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
