import { idle, dragBy, release, addWheel, integrate, isSettled, isClick, DECAY, SNAP_VELOCITY, FRAME_MS } from "./ringPhysics";

const snapToHalf = (r: number) => Math.round(r * 2) / 2;

test("dragging right decreases rotation and records velocity", () => {
  const m = dragBy(idle(), 100, 0.006);
  expect(m.rotation).toBeCloseTo(-0.6);
  expect(m.velocity).toBeCloseTo(-0.6);
  expect(m.target).toBeNull();
});

test("velocity decays per frame and rotation advances while coasting", () => {
  let m = release({ rotation: 0, velocity: 0.1, target: null });
  m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.rotation).toBeCloseTo(0.1);
  expect(m.velocity).toBeCloseTo(0.1 * DECAY);
  expect(m.target).toBeNull();
});

test("decay is frame-rate independent", () => {
  const one = integrate({ rotation: 0, velocity: 0.1, target: null }, FRAME_MS * 2, snapToHalf);
  const two = integrate(integrate({ rotation: 0, velocity: 0.1, target: null }, FRAME_MS, snapToHalf), FRAME_MS, snapToHalf);
  expect(one.velocity).toBeCloseTo(two.velocity, 5);
});

test("below the snap velocity a target is chosen and approached, then settles", () => {
  let m = { rotation: 0.3, velocity: SNAP_VELOCITY / 2, target: null as number | null };
  m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.target).toBe(0.5);
  expect(m.velocity).toBe(0);
  for (let i = 0; i < 60; i++) m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.rotation).toBe(0.5);
  expect(isSettled(m)).toBe(true);
});

test("wheel adds velocity from both axes and cancels a snap", () => {
  const m = addWheel({ rotation: 0, velocity: 0, target: 0.5 }, 100, 100);
  expect(m.velocity).toBeCloseTo(0.3);
  expect(m.target).toBeNull();
});

test("click detection", () => {
  expect(isClick(3, 100)).toBe(true);
  expect(isClick(10, 100)).toBe(false);
  expect(isClick(3, 300)).toBe(false);
});
