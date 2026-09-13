import type { Mode } from "../store";
import { MIN_SLOTS_PER_RING } from "./layout";

/**
 * Tiles this many steps either side of the focused one get full-resolution thumbnails.
 * A fling lands at most about three tiles away, so where it lands is already sharp.
 */
export const FULL_RES_REACH = 3;

/** Steps between two tiles: a full ring wraps around, a shorter arc does not. */
export function tileDistance(a: number, b: number, count: number): number {
  const d = Math.abs(a - b);
  return count >= MIN_SLOTS_PER_RING ? Math.min(d, count - d) : d;
}

export function wantsFullRes(index: number, focusedIndex: number, count: number, mode: Mode): boolean {
  if (mode === "intro") return false; // the ring is blurred behind the title card
  return tileDistance(index, focusedIndex, count) <= FULL_RES_REACH;
}
