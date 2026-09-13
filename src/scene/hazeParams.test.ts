import {
  HAZE_DARK,
  HAZE_DRIFT_PER_S,
  HAZE_EDGE,
  HAZE_PEAK,
  HAZE_SCALE,
  hazeOctaves,
  hazeProfile,
  hazeProfileTexture,
  hazeTime,
} from "./hazeParams";

test("the haze is fullest at the ring's horizon and thins to its floor at the top and bottom edges", () => {
  expect(hazeProfile(0.5)).toBe(1);
  expect(hazeProfile(0)).toBeCloseTo(HAZE_EDGE, 6);
  expect(hazeProfile(1)).toBeCloseTo(HAZE_EDGE, 6);
});

test("the profile is symmetric about the horizon and never brightens toward an edge", () => {
  let prev = hazeProfile(0.5);
  for (let d = 0.05; d <= 0.5; d += 0.05) {
    const up = hazeProfile(0.5 + d);
    expect(up).toBeCloseTo(hazeProfile(0.5 - d), 9);
    expect(up).toBeLessThanOrEqual(prev);
    prev = up;
  }
});

test("the profile lookup the shader samples holds the same curve and is built once", () => {
  const texture = hazeProfileTexture();
  const { data, width } = texture.image as { data: Uint8Array; width: number };
  expect(data[(width >> 1) * 4]).toBe(255);
  expect(data[0] / 255).toBeCloseTo(HAZE_EDGE, 1);
  expect(data[(width - 1) * 4] / 255).toBeCloseTo(HAZE_EDGE, 1);
  expect(hazeProfileTexture()).toBe(texture);
});

test("a shape takes most of a minute to cross the screen, so the haze reads as still air rather than scrolling", () => {
  expect(HAZE_SCALE / HAZE_DRIFT_PER_S).toBeGreaterThanOrEqual(40);
});

test("the haze runs from the stage colour up to a warm peak that stays very dark", () => {
  expect(HAZE_DARK).toBe("#050505");
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(HAZE_PEAK.slice(i, i + 2), 16));
  expect(r).toBeGreaterThanOrEqual(g);
  expect(g).toBeGreaterThanOrEqual(b);
  expect(r).toBeLessThanOrEqual(0x1a); // never above the elevated surface tone
});

test("time advances by the frame, ignores a long gap after the tab was hidden, and freezes under reduced motion", () => {
  expect(hazeTime(10, 0.016, false)).toBeCloseTo(10.016);
  expect(hazeTime(10, 5, false)).toBeCloseTo(10.1);
  expect(hazeTime(10, 0.016, true)).toBe(10);
});

test("phones get fewer noise octaves", () => {
  expect(hazeOctaves(true)).toBeLessThan(hazeOctaves(false));
  expect(hazeOctaves(true)).toBeGreaterThanOrEqual(2);
});
