import {
  layoutRing, rowsFor, nearestIndex, rotationFor, shortestDelta, normalizeAngle, slotPosition, slotRotationY, RING_RADIUS, TILE_H,
} from "./layout";

test("12 tiles on one row: 30 degrees apart at y 0", () => {
  const slots = layoutRing(12, 1);
  expect(slots).toHaveLength(12);
  expect(slots.every((s) => s.row === 0 && s.y === 0)).toBe(true);
  expect(slots[0]).toMatchObject({ index: 0, angle: 0 });
  expect(slots[1].angle).toBeCloseTo(Math.PI / 6);
  expect(slots[11].angle).toBeCloseTo((11 * Math.PI) / 6);
});

test("two rows are still laid out alternately with the lower row offset by half a step", () => {
  const slots = layoutRing(12, 2);
  expect(slots.filter((s) => s.row === 0)).toHaveLength(6);
  expect(slots[0].y).toBe(0.55);
  expect(slots[1]).toMatchObject({ row: 1, y: -0.55 });
  expect(slots[1].angle).toBeCloseTo(slots[2].angle / 2);
});

test("small counts collapse to one row; one row is evenly spaced at y 0", () => {
  expect(rowsFor(3, 2)).toBe(1);
  expect(rowsFor(5, 2)).toBe(2);
  const slots = layoutRing(3, 2);
  expect(slots.every((s) => s.row === 0 && s.y === 0)).toBe(true);
  expect(slots[1].angle).toBeCloseTo(Math.PI / 6);
});

test("fewer than 12 tiles keep the 30 degree spacing as an arc so the neighbours stay in view", () => {
  const five = layoutRing(5, 1);
  expect(five.map((s) => s.angle)).toEqual([0, 1, 2, 3, 4].map((i) => (i * Math.PI) / 6));
  const twenty = layoutRing(20, 1);
  expect(twenty[1].angle).toBeCloseTo(Math.PI / 10);
  // the far end of the arc is still reached by the shortest path back through the tiles
  expect(rotationFor(4, five, 0)).toBeCloseTo((4 * Math.PI) / 6);
  expect(nearestIndex(Math.PI, five)).toBe(4); // a fling into the empty half snaps to the last tile
});

test("angle helpers", () => {
  expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  expect(shortestDelta(0, 6.2)).toBeCloseTo(6.2 - 2 * Math.PI);
  expect(shortestDelta(0, Math.PI)).toBeCloseTo(Math.PI);
});

test("nearestIndex picks the tile whose angle matches the rotation, with wraparound and row filter", () => {
  const slots = layoutRing(12, 1);
  expect(nearestIndex(0, slots)).toBe(0);
  expect(nearestIndex(2 * Math.PI + 0.1, slots)).toBe(0);
  expect(nearestIndex(Math.PI / 6, slots)).toBe(1);
  expect(nearestIndex(-Math.PI / 6 + 0.01, slots)).toBe(11);
  const rows = layoutRing(12, 2);
  expect(nearestIndex(0, rows, 1)).toBe(1);
});

test("rotationFor takes the shortest path", () => {
  const slots = layoutRing(12, 1);
  expect(rotationFor(11, slots, 0)).toBeCloseTo(-Math.PI / 6);
  expect(rotationFor(0, slots, 2 * Math.PI - 0.1)).toBeCloseTo(2 * Math.PI);
});

test("slot position and facing", () => {
  const [x, y, z] = slotPosition({ index: 0, angle: 0, row: 0, y: 0.55 });
  expect([x, y, z]).toEqual([0, 0.55, -RING_RADIUS]);
  expect(slotRotationY({ index: 3, angle: Math.PI / 2, row: 0, y: 0 })).toBeCloseTo(-Math.PI / 2);
});

test("the focused tile's top edge is where the caption CSS centres against", () => {
  // `--tiles-top` in overlay.css positions the caption in the gap above the ring. It is derived
  // from these numbers, so if a tile or the camera changes, this fails and the CSS needs the new value.
  const FOCUSED_SCALE = 1.25; // Tile.tsx
  const FOV_DEG = 60; // Stage.tsx
  const visibleHeight = 2 * RING_RADIUS * Math.tan((FOV_DEG * Math.PI) / 360);
  const topFraction = (1 - (TILE_H * FOCUSED_SCALE) / visibleHeight) / 2;
  expect(topFraction * 100).toBeCloseTo(38.8, 1);
});
