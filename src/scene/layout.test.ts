import {
  layoutRing, rowsFor, nearestIndex, rotationFor, shortestDelta, normalizeAngle, slotPosition, slotRotationY, RING_RADIUS,
} from "./layout";

test("12 tiles on 2 rows: 6 per row, lower row offset by half a step", () => {
  const slots = layoutRing(12, 2);
  expect(slots).toHaveLength(12);
  expect(slots.filter((s) => s.row === 0)).toHaveLength(6);
  expect(slots[0]).toMatchObject({ index: 0, angle: 0, row: 0, y: 0.55 });
  expect(slots[1].row).toBe(1);
  expect(slots[1].y).toBe(-0.55);
  expect(slots[1].angle).toBeCloseTo(Math.PI / 6);
  expect(slots[2].angle).toBeCloseTo(Math.PI / 3);
});

test("small counts collapse to one row; one row is evenly spaced at y 0", () => {
  expect(rowsFor(3, 2)).toBe(1);
  expect(rowsFor(5, 2)).toBe(2);
  const slots = layoutRing(3, 2);
  expect(slots.every((s) => s.row === 0 && s.y === 0)).toBe(true);
  expect(slots[1].angle).toBeCloseTo((2 * Math.PI) / 3);
});

test("angle helpers", () => {
  expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  expect(shortestDelta(0, 6.2)).toBeCloseTo(6.2 - 2 * Math.PI);
  expect(shortestDelta(0, Math.PI)).toBeCloseTo(Math.PI);
});

test("nearestIndex picks the tile whose angle matches the rotation, with wraparound and row filter", () => {
  const slots = layoutRing(12, 2);
  expect(nearestIndex(0, slots)).toBe(0);
  expect(nearestIndex(2 * Math.PI + 0.1, slots)).toBe(0);
  expect(nearestIndex(Math.PI / 6, slots)).toBe(1);
  expect(nearestIndex(0, slots, 1)).toBe(1);
  expect(nearestIndex(-Math.PI / 6 + 0.01, slots, 1)).toBe(11);
});

test("rotationFor takes the shortest path", () => {
  const slots = layoutRing(12, 2);
  expect(rotationFor(11, slots, 0)).toBeCloseTo(-Math.PI / 6);
  expect(rotationFor(0, slots, 2 * Math.PI - 0.1)).toBeCloseTo(2 * Math.PI);
});

test("slot position and facing", () => {
  const [x, y, z] = slotPosition({ index: 0, angle: 0, row: 0, y: 0.55 });
  expect([x, y, z]).toEqual([0, 0.55, -RING_RADIUS]);
  expect(slotRotationY({ index: 3, angle: Math.PI / 2, row: 0, y: 0 })).toBeCloseTo(-Math.PI / 2);
});
