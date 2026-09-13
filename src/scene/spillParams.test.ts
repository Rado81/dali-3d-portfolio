import { SPILL_MAX_OPACITY, SPILL_TEXTURE_SIZE, spillAlpha, spillFalloff, spillOpacity, spillTexture } from "./spillParams";

test("the spill is full at the screen and gone at the halo's edge, fading smoothly with no rim", () => {
  expect(spillFalloff(0)).toBe(1);
  expect(spillFalloff(1)).toBe(0);
  expect(spillFalloff(1.5)).toBe(0);
  let prev = 1;
  for (let d = 0.1; d <= 1; d += 0.1) {
    const f = spillFalloff(d);
    expect(f).toBeLessThanOrEqual(prev);
    prev = f;
  }
  expect(spillFalloff(0.9)).toBeLessThan(0.05);
});

test("a focused tile spills the most light, an idle one less, a dimmed one under half", () => {
  expect(spillOpacity(1)).toBeCloseTo(SPILL_MAX_OPACITY);
  expect(spillOpacity(0.75)).toBeLessThan(spillOpacity(1));
  expect(spillOpacity(0.45)).toBeLessThan(SPILL_MAX_OPACITY / 2);
  expect(spillOpacity(0.45)).toBeGreaterThan(0);
});

test("the halo texture is white with the falloff as alpha, centred and symmetric", () => {
  const n = 9;
  const px = spillAlpha(n);
  expect(px.length).toBe(n * n * 4);
  const alpha = (x: number, y: number) => px[(y * n + x) * 4 + 3];
  expect([px[0], px[1], px[2]]).toEqual([255, 255, 255]);
  expect(alpha(4, 4)).toBe(255);
  expect(alpha(0, 0)).toBe(0);
  expect(alpha(1, 4)).toBe(alpha(7, 4));
  expect(alpha(4, 1)).toBe(alpha(4, 7));
  expect(alpha(2, 4)).toBeGreaterThan(alpha(1, 4));
});

test("the halo texture is built once at its full size", () => {
  const texture = spillTexture();
  expect(texture.image.width).toBe(SPILL_TEXTURE_SIZE);
  expect(spillTexture()).toBe(texture);
});
