import { ClampToEdgeWrapping, DataTexture, LinearFilter, RGBAFormat } from "three";

/** The stage colour at the haze's thinnest, matching the clear colour and the fog. */
export const HAZE_DARK = "#050505";
/**
 * The brightest the haze reaches, in its densest patches at the ring's horizon: warm, and still
 * below --bg-elevated. tokens.test.ts checks every text and control token used over the stage against it.
 */
export const HAZE_PEAK = "#181614";
/** How much of the haze is left at the top and bottom edges of the screen. */
export const HAZE_EDGE = 0.4;
/** Noise cycles across the screen width: the size of the largest shapes. */
export const HAZE_SCALE = 1.6;
/** Sideways drift in noise units per second; with HAZE_SCALE, a shape crosses the screen in about 53 s. */
export const HAZE_DRIFT_PER_S = 0.03;
/** How fast the shapes change, in noise units per second along the noise's time axis. */
export const HAZE_EVOLVE_PER_S = 0.02;
/** A frame longer than this (the tab was hidden) moves the haze on by only this much. */
const MAX_FRAME_S = 0.1;
const PROFILE_SIZE = 256;

/** Vertical weight of the haze: 1 at the ring's horizon (v = 0.5), HAZE_EDGE at the top and bottom, a smooth bell between. */
export function hazeProfile(v: number): number {
  const band = Math.max(0, 1 - Math.abs(v - 0.5) * 2);
  const bell = band * band * (3 - 2 * band);
  return HAZE_EDGE + (1 - HAZE_EDGE) * bell;
}

let profileTexture: DataTexture | null = null;

/** hazeProfile baked into a one-row lookup that the shader samples by screen height. */
export function hazeProfileTexture(): DataTexture {
  if (profileTexture) return profileTexture;
  const data = new Uint8Array(PROFILE_SIZE * 4);
  for (let i = 0; i < PROFILE_SIZE; i++) {
    const value = Math.round(hazeProfile(i / (PROFILE_SIZE - 1)) * 255);
    data.set([value, value, value, 255], i * 4);
  }
  profileTexture = new DataTexture(data, PROFILE_SIZE, 1, RGBAFormat);
  profileTexture.minFilter = LinearFilter;
  profileTexture.magFilter = LinearFilter;
  profileTexture.wrapS = ClampToEdgeWrapping;
  profileTexture.wrapT = ClampToEdgeWrapping;
  profileTexture.needsUpdate = true;
  return profileTexture;
}

/** The haze's clock: advances by the frame, never by a long gap, and stands still under reduced motion. */
export function hazeTime(previous: number, deltaS: number, reducedMotion: boolean): number {
  if (reducedMotion) return previous;
  return previous + Math.min(deltaS, MAX_FRAME_S);
}

/** Noise octaves: the third adds fine detail that a phone's smaller, cheaper frame does not need. */
export function hazeOctaves(isMobile: boolean): number {
  return isMobile ? 2 : 3;
}
