import type { Mode } from "../store";

/** The floor's height: below the lowest edge of a focused tile and its shadow. */
export const FLOOR_Y = -1.05;
/** Wide enough that its edge is always past the fog. */
export const FLOOR_SIZE = 60;
/** A near-black glossy floor, a touch above the stage colour. floorParams.test.ts keeps it under the haze peak. */
export const FLOOR_COLOR = "#080808";
/** Schlick's reflectance looking straight down at a glossy dielectric; it rises to 1 at grazing angles. */
export const FLOOR_F0 = 0.04;
/** Reflections dim by e^-k for every unit below the floor... */
export const REFLECTION_FALLOFF = 1.55;
/** ...and soften by this many mip levels per unit, so they read as a gloss rather than a mirror. */
export const REFLECTION_BLUR = 2.6;
/** The floor fades in and out faster than the camera flies, so it is gone before the camera is inside the ring. */
export const FLOOR_FADE = { tension: 170, friction: 26 };

/** The studio floor belongs to the title card only; the ring, the panels and the player keep the plain haze. */
export function floorVisible(mode: Mode): boolean {
  return mode === "intro";
}
