import type { Mode } from "../store";
import { nearestIndex, rotationFor, type TileSlot } from "./layout";
import { integrate, isSettled, type RingMotion } from "./ringPhysics";

export const IDLE_RAD_PER_SEC = 0.05;

export interface RingStepInput {
  mode: Mode;
  focusedIndex: number;
  lastFocused: number;
  slots: TileSlot[];
  slotsChanged: boolean;
  motion: RingMotion;
  dragging: boolean;
  reducedMotion: boolean;
  dtMs: number;
}

export interface RingStepOutput {
  motion: RingMotion;
  lastFocused: number;
  /** Index to write back to the store, or null when the store already agrees. */
  focusToWrite: number | null;
}

/**
 * One frame of ring motion, as a pure function: idle rotation in intro and panel,
 * re-targeting when the focus or the slots change, inertia and snap in browse.
 * `useRingDrag` owns the refs and the listeners; this owns the decisions.
 */
export function stepRing(input: RingStepInput): RingStepOutput {
  const { mode, focusedIndex, slots, dragging, reducedMotion, dtMs } = input;
  let lastFocused = input.slotsChanged ? -1 : input.lastFocused; // slots changed (e.g. filter) — force re-target
  let motion = input.motion;

  if (mode === "intro" || mode === "panel") {
    if (!reducedMotion) {
      motion = { rotation: motion.rotation + (IDLE_RAD_PER_SEC * dtMs) / 1000, velocity: 0, target: null };
    }
    return { motion, lastFocused: -1, focusToWrite: null }; // force re-snap when we come back
  }

  // stale index against these slots; wait for the store to settle
  if (focusedIndex >= slots.length) return { motion, lastFocused, focusToWrite: null };

  if (focusedIndex !== lastFocused) {
    motion = { ...motion, velocity: 0, target: rotationFor(focusedIndex, slots, motion.rotation) };
    lastFocused = focusedIndex;
  }

  if (dragging) return { motion, lastFocused, focusToWrite: null };

  const wasSettled = isSettled(motion);
  motion = integrate(motion, dtMs, (r) => {
    const idx = nearestIndex(r, slots, slots[focusedIndex]?.row);
    return rotationFor(idx, slots, r);
  });

  let focusToWrite: number | null = null;
  if (!wasSettled && isSettled(motion)) {
    const idx = nearestIndex(motion.rotation, slots);
    if (idx !== focusedIndex) {
      lastFocused = idx;
      focusToWrite = idx;
    }
  }

  return { motion, lastFocused, focusToWrite };
}
