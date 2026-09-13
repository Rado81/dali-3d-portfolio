export const RING_RADIUS = 6;
export const ROW_Y = 0.55;
export const TILE_W = 2.2;
export const TILE_H = TILE_W * (9 / 16);
export const TWO_PI = Math.PI * 2;

export interface TileSlot {
  index: number;
  angle: number;
  row: number;
  y: number;
}

export function rowsFor(count: number, wantRows: 1 | 2): 1 | 2 {
  return wantRows === 2 && count > 4 ? 2 : 1;
}

/** Tiles are never spread wider than this: fewer tiles form an arc so the neighbours stay in view. */
export const MIN_SLOTS_PER_RING = 12;

export function layoutRing(count: number, wantRows: 1 | 2): TileSlot[] {
  const rows = rowsFor(count, wantRows);
  const perRow = Math.ceil(count / rows);
  const step = TWO_PI / Math.max(perRow, MIN_SLOTS_PER_RING);
  return Array.from({ length: count }, (_, index) => {
    const row = index % rows;
    const col = Math.floor(index / rows);
    const angle = col * step + (row === 1 ? step / 2 : 0);
    const y = rows === 1 ? 0 : row === 0 ? ROW_Y : -ROW_Y;
    return { index, angle, row, y };
  });
}

export function normalizeAngle(a: number): number {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

export function shortestDelta(from: number, to: number): number {
  let d = normalizeAngle(to - from);
  if (d > Math.PI) d -= TWO_PI;
  return d;
}

export function nearestIndex(rotation: number, slots: TileSlot[], row?: number): number {
  let best = -1;
  let bestDist = Infinity;
  for (const s of slots) {
    if (row !== undefined && s.row !== row) continue;
    const dist = Math.abs(shortestDelta(rotation, s.angle));
    if (dist < bestDist - 1e-9 || (Math.abs(dist - bestDist) < 1e-9 && (best === -1 || s.index < best))) {
      bestDist = dist;
      best = s.index;
    }
  }
  return best;
}

export function rotationFor(index: number, slots: TileSlot[], current: number): number {
  return current + shortestDelta(current, slots[index].angle);
}

export function slotPosition(slot: TileSlot): [number, number, number] {
  return [RING_RADIUS * Math.sin(slot.angle), slot.y, -RING_RADIUS * Math.cos(slot.angle)];
}

export function slotRotationY(slot: TileSlot): number {
  return -slot.angle;
}
