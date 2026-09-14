import { TILE_H } from "./layout";
import { FLOOR_COLOR, FLOOR_Y, REFLECTION_BLUR, REFLECTION_FALLOFF, floorVisible } from "./floorParams";
import { HAZE_PEAK } from "./hazeParams";

test("the floor is on the title card and nowhere else", () => {
  expect(floorVisible("intro")).toBe(true);
  for (const mode of ["browse", "panel", "watching"] as const) expect(floorVisible(mode)).toBe(false);
});

test("the floor clears the lowest edge of a focused tile and its shadow, so nothing cuts through it", () => {
  const FOCUSED_SCALE = 1.25; // Tile.tsx
  const SHADOW_DROP = 0.08; // Tile.tsx: the shadow sits this far below the tile per unit of scale
  const SHADOW_GROWTH = 1.04; // Tile.tsx: and this much larger
  const lowest = -(TILE_H / 2) * FOCUSED_SCALE * SHADOW_GROWTH - SHADOW_DROP * FOCUSED_SCALE;
  expect(FLOOR_Y).toBeLessThan(lowest);
});

test("a reflection is faint and soft by the time it is a tile's height below the floor", () => {
  expect(Math.exp(-REFLECTION_FALLOFF * TILE_H)).toBeLessThan(0.2);
  expect(REFLECTION_BLUR * TILE_H).toBeGreaterThanOrEqual(2); // mip levels of blur
});

test("the floor is never lighter than the haze at its brightest, so the text contrast guard still holds over it", () => {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const floor = channels(FLOOR_COLOR);
  const peak = channels(HAZE_PEAK);
  floor.forEach((c, i) => expect(c).toBeLessThanOrEqual(peak[i]));
});
