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
 * re-targeting when the focus or the slots change, fling projection and spring settle in browse
 * (an instant cut under reduced motion).
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
    // keep the velocity: a step while the ring is still moving blends instead of braking
    motion = { ...motion, target: rotationFor(focusedIndex, slots, motion.rotation) };
    lastFocused = focusedIndex;
  }

  if (dragging) return { motion, lastFocused, focusToWrite: null };

  const wasSettled = isSettled(motion);
  const snapTargetFor = (r: number) => rotationFor(nearestIndex(r, slots), slots, r);
  if (reducedMotion) {
    const target = motion.target ?? snapTargetFor(motion.rotation);
    motion = { rotation: target, velocity: 0, target };
  } else {
    motion = integrate(motion, dtMs, snapTargetFor);
  }

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
