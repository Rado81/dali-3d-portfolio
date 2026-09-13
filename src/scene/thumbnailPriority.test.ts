import { layoutRing, rotationFor } from "./layout";
import { MAX_FLING_RAD } from "./ringPhysics";
import { FULL_RES_REACH, tileDistance, wantsFullRes } from "./thumbnailPriority";

test("a full ring of twelve wraps around; a shorter arc does not", () => {
  expect(tileDistance(0, 11, 12)).toBe(1);
  expect(tileDistance(2, 9, 12)).toBe(5);
  expect(tileDistance(0, 4, 5)).toBe(4); // five tiles form an arc, so the ends are far apart
});

test("the blurred ring behind the title card only ever gets previews", () => {
  for (let i = 0; i < 12; i++) expect(wantsFullRes(i, 0, 12, "intro")).toBe(false);
});

test("browsing upgrades the focused tile and three either side", () => {
  const full = Array.from({ length: 12 }, (_, i) => i).filter((i) => wantsFullRes(i, 0, 12, "browse"));
  expect(full).toEqual([0, 1, 2, 3, 9, 10, 11]);
  expect(Array.from({ length: 5 }, (_, i) => wantsFullRes(i, 4, 5, "browse"))).toEqual([false, true, true, true, true]);
});

test("the reach covers the furthest tile a single fling can land on", () => {
  const slots = layoutRing(12, 1);
  const step = rotationFor(1, slots, 0);
  expect(FULL_RES_REACH).toBeGreaterThanOrEqual(Math.round(MAX_FLING_RAD / step));
});
