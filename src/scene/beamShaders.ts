// GLSL for ProjectorBeam.tsx. The cone's cross-section is shared by the ray march and the motes, so dust
// glints exactly where the beam is.

const HASH = /* glsl */ `
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}`;

const CONE = /* glsl */ `
uniform vec3 uApex;
uniform vec3 uAxis;
uniform float uTan;
// full light across most of the cone with a soft edge, so it reads as a shaft, a little brighter at the core.
// Along the beam it is full where it passes over the camera (about 11 units from the lens) and thins with the
// fourth power of the distance beyond, so the shaft carries the top of the frame and the air in front of the
// screen, behind the caption, stays dim.
float beamAt(vec3 p) {
  vec3 v = p - uApex;
  float along = dot(v, uAxis);
  if (along <= 0.0) return 0.0;
  float q = length(v - uAxis * along) / (along * uTan);
  return (1.0 - smoothstep(0.7, 1.05, q)) * (0.6 + 0.4 * exp(-q * q * 1.5)) * min(1.5, pow(11.0 / along, 4.0));
}`;

/** A triangle past the screen's corners, in clip space, so no camera matrices are involved. */
export const SCREEN_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * The beam at quarter resolution: march each view ray through the cone up to the ring, weighting by drifting dust
 * and by fine rays fanning out from the lens. Stored gamma-encoded and scaled down, so eight bits keep the dim
 * edges smooth on every device; the composite pass undoes both.
 */
export const MARCH_FRAGMENT = /* glsl */ `
${CONE}
${HASH}
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform float uTime;
uniform float uRingRadius;
uniform int uSteps;
uniform sampler3D uDust;
varying vec2 vUv;

// how far a view ray travels before it meets the ring's cylinder, where the screens stop the light
float ringExit(vec3 ro, vec3 rd) {
  float a = dot(rd.xz, rd.xz);
  if (a < 1e-5) return 20.0;
  float b = dot(ro.xz, rd.xz);
  float disc = b * b - a * (dot(ro.xz, ro.xz) - uRingRadius * uRingRadius);
  if (disc < 0.0) return 20.0;
  float t = (-b + sqrt(disc)) / a;
  return t > 0.0 ? min(t, 20.0) : 20.0;
}

void main() {
  vec4 far = uInvViewProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 rd = normalize(far.xyz / far.w - uCamPos);
  float dt = ringExit(uCamPos, rd) / float(uSteps);
  float jitter = hash(gl_FragCoord.xy);
  float sum = 0.0;
  for (int i = 0; i < 32; i++) {
    if (i >= uSteps) break;
    vec3 p = uCamPos + rd * ((float(i) + jitter) * dt);
    float b = beamAt(p);
    if (b < 0.002) continue;
    float rays = texture(uDust, normalize(p - uApex) * 9.0).r;
    float dust = texture(uDust, p * 0.23 + vec3(uTime * 0.021, uTime * 0.007, uTime * 0.013)).r * 0.65
               + texture(uDust, p * 0.61 - vec3(0.0, uTime * 0.018, 0.0)).r * 0.35;
    sum += b * (0.45 + 0.9 * dust * dust) * (0.65 + 0.7 * rays) * dt;
  }
  gl_FragColor = vec4(vec3(pow(clamp(sum * 0.125, 0.0, 1.0), 1.0 / 2.2)), 1.0);
}`;

/** Adds the stored beam over the frame in its warm white, with half a level of dither where it shines. */
export const COMPOSITE_FRAGMENT = /* glsl */ `
${HASH}
uniform sampler2D uBeam;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uDither;
uniform float uTime;
varying vec2 vUv;
void main() {
  float light = pow(texture2D(uBeam, vUv).r, 2.2) * 8.0;
  gl_FragColor = vec4(uColor * light * uIntensity, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * uDither * min(1.0, light * 40.0);
}`;

/** Dust in the air: faint in the dark, glinting inside the beam. Each mote's seed rides in the position attribute. */
export const MOTE_VERTEX = /* glsl */ `
${CONE}
attribute vec3 phase;
attribute float moteSize;
uniform float uTime;
uniform float uFade;
uniform float uPixelScale;
uniform vec3 uBoxMin;
uniform vec3 uBoxMax;
varying float vBright;
void main() {
  vec3 span = uBoxMax - uBoxMin;
  vec3 p = uBoxMin + position * span;
  float turn = phase.x * 6.2832;
  p.y = uBoxMin.y + mod(p.y - uBoxMin.y + uTime * (0.018 + 0.03 * phase.y), span.y);
  p.x += sin(uTime * 0.11 + turn) * 0.35 + sin(uTime * 0.043 + turn * 2.0) * 0.2;
  p.z += cos(uTime * 0.09 + turn * 1.3) * 0.35;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, moteSize * uPixelScale / max(depth, 0.1));
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + 1.6 * phase.z) + turn * 3.0);
  vBright = (0.012 + 0.6 * beamAt(p)) * twinkle * smoothstep(0.35, 1.4, depth) * uFade;
}`;

export const MOTE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
varying float vBright;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor, exp(-d * 3.5) * vBright);
  #include <colorspace_fragment>
}`;
