import { layoutRing, rotationFor } from "./layout";
import { FRAME_MS, SNAP_VELOCITY, type RingMotion } from "./ringPhysics";
import { stepRing, IDLE_RAD_PER_SEC, type RingStepInput } from "./ringStep";

const slots = layoutRing(12, 2);

function input(over: Partial<RingStepInput> = {}): RingStepInput {
  return {
    mode: "browse",
    focusedIndex: 0,
    lastFocused: 0,
    slots,
    slotsChanged: false,
    motion: { rotation: 0, velocity: 0, target: null },
    dragging: false,
    reducedMotion: false,
    dtMs: FRAME_MS,
    ...over,
  };
}

test("intro and panel idle-rotate the ring and forget the focused tile", () => {
  const intro = stepRing(input({ mode: "intro", dtMs: 1000 }));
  expect(intro.motion.rotation).toBeCloseTo(IDLE_RAD_PER_SEC);
  expect(intro.motion.target).toBeNull();
  expect(intro.lastFocused).toBe(-1);
  expect(intro.focusToWrite).toBeNull();

  const panel = stepRing(input({ mode: "panel", dtMs: 1000, motion: { rotation: 1, velocity: 0, target: null } }));
  expect(panel.motion.rotation).toBeCloseTo(1 + IDLE_RAD_PER_SEC);
});

test("reduced motion holds the ring still in intro", () => {
  const motion: RingMotion = { rotation: 0.7, velocity: 0, target: null };
  const out = stepRing(input({ mode: "intro", dtMs: 1000, reducedMotion: true, motion }));
  expect(out.motion).toBe(motion);
  expect(out.lastFocused).toBe(-1);
});

test("a new focusedIndex re-targets the ring to that slot", () => {
  const out = stepRing(input({ focusedIndex: 3, lastFocused: -1 }));
  expect(out.motion.target).toBeCloseTo(slots[3].angle);
  expect(out.lastFocused).toBe(3);
  expect(out.motion.rotation).toBeGreaterThan(0);
});

test("changed slots force a re-target even when focusedIndex is unchanged", () => {
  const motion: RingMotion = { rotation: 2, velocity: 0, target: null };
  const changed = stepRing(input({ motion, slotsChanged: true }));
  expect(changed.motion.target).toBeCloseTo(rotationFor(0, slots, 2));
  expect(changed.lastFocused).toBe(0);

  const unchanged = stepRing(input({ motion }));
  expect(unchanged.motion.target).toBeCloseTo(slots[4].angle); // snapped to the nearest slot in the row instead
});

test("a focusedIndex past the end of the slots leaves the motion untouched", () => {
  const motion: RingMotion = { rotation: 0.4, velocity: 0.3, target: null };
  const out = stepRing(input({ focusedIndex: 12, lastFocused: 5, motion }));
  expect(out.motion).toBe(motion);
  expect(out.lastFocused).toBe(5);
  expect(out.focusToWrite).toBeNull();
});

test("dragging skips integration and the write-back", () => {
  const motion: RingMotion = { rotation: 0.4, velocity: 0.3, target: null };
  const out = stepRing(input({ motion, dragging: true }));
  expect(out.motion).toBe(motion);
  expect(out.focusToWrite).toBeNull();
});

test("settling on another tile writes its index exactly once", () => {
  let focusedIndex = 0;
  let lastFocused = 0;
  let motion: RingMotion = { rotation: slots[2].angle - 0.02, velocity: SNAP_VELOCITY / 2, target: null };
  const writes: number[] = [];

  for (let i = 0; i < 200; i++) {
    const out = stepRing(input({ focusedIndex, lastFocused, motion }));
    motion = out.motion;
    lastFocused = out.lastFocused;
    if (out.focusToWrite !== null) {
      writes.push(out.focusToWrite);
      focusedIndex = out.focusToWrite; // the store applies it synchronously
    }
  }

  expect(writes).toEqual([2]);
  expect(motion.rotation).toBeCloseTo(slots[2].angle);
});
