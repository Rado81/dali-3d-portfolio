import {
  idle, dragBy, release, integrate, isSettled, isClick, project, dragGain, horizontalFov, wheelKind,
  FRAME_MS, MAX_FLING_RAD, WHEEL_NOTCH_PX, type RingMotion,
} from "./ringPhysics";

const snapToHalf = (r: number) => Math.round(r * 2) / 2;

test("dragging right decreases rotation and estimates velocity in rad/s", () => {
  const m = dragBy(idle(), 10, 0.001, FRAME_MS);
  expect(m.rotation).toBeCloseTo(-0.01);
  expect(m.velocity).toBeLessThan(0);
  expect(m.target).toBeNull();
  // a steady drag converges on the true velocity: 0.01 rad per frame = 0.6 rad/s
  let steady = idle();
  for (let i = 0; i < 30; i++) steady = dragBy(steady, -10, 0.001, FRAME_MS);
  expect(steady.velocity).toBeCloseTo(0.6, 2);
});

test("a zero-length interval keeps the previous velocity estimate", () => {
  const m = dragBy({ rotation: 0, velocity: 2, target: null }, 5, 0.001, 0);
  expect(m.velocity).toBe(2);
  expect(m.rotation).toBeCloseTo(-0.005);
});

test("momentum projection uses exponential scroll decay and is clamped", () => {
  expect(project(1)).toBeCloseTo(0.499, 3);
  expect(project(-1)).toBeCloseTo(-0.499, 3);
  expect(project(100)).toBe(MAX_FLING_RAD);
  expect(project(-100)).toBe(-MAX_FLING_RAD);
});

test("release with no target picks the snap point nearest the projected landing, not the current position", () => {
  // at 0.2 moving fast forward: projection ~1.2 -> nearest half is 1.0, not 0.0
  let m = release({ rotation: 0.2, velocity: 2, target: null });
  expect(m.target).toBeNull();
  m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.target).toBe(1);
  expect(m.velocity).toBeGreaterThan(0); // the spring inherits the release velocity
});

test("the spring settles on the target without overshooting from rest", () => {
  let m = { rotation: 0.3, velocity: 0, target: null as number | null };
  let max = -Infinity;
  for (let i = 0; i < 90; i++) {
    m = integrate(m, FRAME_MS, snapToHalf);
    max = Math.max(max, m.rotation);
  }
  expect(m.target).toBe(0.5);
  expect(m.rotation).toBe(0.5);
  expect(max).toBeLessThanOrEqual(0.5);
  expect(isSettled(m)).toBe(true);
});

test("the spring is frame-rate independent", () => {
  const start: RingMotion = { rotation: 0, velocity: 0, target: 1 };
  const one = integrate(start, 100, snapToHalf);
  let many = start;
  for (let i = 0; i < 10; i++) many = integrate(many, 10, snapToHalf);
  expect(one.rotation).toBeCloseTo(many.rotation, 3);
});

test("a large dt is clamped so a background tab does not explode the spring", () => {
  const m = integrate({ rotation: 0, velocity: 0, target: 1 }, 5000, snapToHalf);
  expect(m.rotation).toBeGreaterThanOrEqual(0);
  expect(m.rotation).toBeLessThanOrEqual(1);
});

test("drag gain makes the tile under the pointer track it 1:1", () => {
  const hfov = horizontalFov(60, 16 / 9);
  expect(hfov).toBeCloseTo(1.5969, 3); // ~91.5 degrees
  const gain = dragGain(2000, hfov);
  // at the screen centre, 1000 px reach the edge at hfov/2 => tan(hfov/2) rad of view per 1000 px
  expect(gain).toBeCloseTo(Math.tan(hfov / 2) / 1000, 6);
  expect(dragGain(0, hfov)).toBe(0);
});

test("a mouse notch is a step and trackpad deltas are continuous scrolling", () => {
  expect(wheelKind(100)).toBe("notch");
  expect(wheelKind(-WHEEL_NOTCH_PX)).toBe("notch");
  expect(wheelKind(12)).toBe("scroll");
  expect(wheelKind(-3)).toBe("scroll");
});

test("click detection", () => {
  expect(isClick(3, 100)).toBe(true);
  expect(isClick(10, 100)).toBe(false);
  expect(isClick(3, 300)).toBe(false);
});
