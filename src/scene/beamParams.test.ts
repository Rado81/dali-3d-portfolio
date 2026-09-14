import { RING_RADIUS, TILE_H, TILE_W } from "./layout";
import { BEAM_APEX, BEAM_TAN, BEAM_TARGET, beamAxis, beamFlicker, beamSteps, beamVisible, dustVolume } from "./beamParams";

const FOCUSED_SCALE = 1.25; // Tile.tsx

test("the beam is on the ring and nowhere else", () => {
  expect(beamVisible("browse")).toBe(true);
  for (const mode of ["intro", "panel", "watching"] as const) expect(beamVisible(mode)).toBe(false);
});

test("the projector sits behind and above the camera, and its beam lands on the focused tile", () => {
  // the browse camera sits at the origin looking down -z, so behind it is +z
  expect(BEAM_APEX[2]).toBeGreaterThan(0);
  expect(BEAM_APEX[1]).toBeGreaterThan(0);
  const axis = beamAxis();
  const t = (-RING_RADIUS - BEAM_APEX[2]) / axis[2];
  const hit = BEAM_APEX.map((v, i) => v + axis[i] * t);
  expect(Math.abs(hit[0])).toBeLessThan((TILE_W * FOCUSED_SCALE) / 2);
  expect(Math.abs(hit[1])).toBeLessThan((TILE_H * FOCUSED_SCALE) / 2);
});

test("the camera stays outside the cone, so the beam reads as a shaft rather than a wash over the view", () => {
  const axis = beamAxis();
  const v = BEAM_APEX.map((a) => -a); // the camera at the origin, seen from the projector
  const along = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
  const radial = Math.hypot(...v.map((c, i) => c - axis[i] * along));
  expect(radial / (along * BEAM_TAN)).toBeGreaterThan(1.2); // past the cone's soft edge, which ends at 1.05 radii
});

test("the cone is wide enough where it lands to light the whole focused tile", () => {
  const throwDistance = Math.hypot(...BEAM_TARGET.map((v, i) => v - BEAM_APEX[i]));
  expect((TILE_W * FOCUSED_SCALE) / 2 / (throwDistance * BEAM_TAN)).toBeLessThanOrEqual(0.8); // inside the full-light core, give or take its soft start
});

test("phones march fewer steps through the beam", () => {
  expect(beamSteps(true)).toBeLessThan(beamSteps(false));
  expect(beamSteps(true)).toBeGreaterThanOrEqual(12);
});

test("the projector flickers by a hair and holds each level for a film frame", () => {
  for (let t = 0; t < 5; t += 0.013) {
    expect(beamFlicker(t)).toBeGreaterThanOrEqual(0.985);
    expect(beamFlicker(t)).toBeLessThanOrEqual(1.015);
  }
  expect(beamFlicker(1.001)).toBe(beamFlicker(1.04)); // both inside the 24th frame of the second second
  expect(new Set([0, 1, 2, 3, 4].map((f) => beamFlicker(f / 24 + 0.01))).size).toBeGreaterThan(1);
});

test("the dust volume is the same on every load, fills its size and uses the whole range", () => {
  const a = dustVolume(16);
  expect(a).toHaveLength(16 ** 3);
  expect(dustVolume(16)).toEqual(a);
  expect(Math.min(...a)).toBeLessThan(16);
  expect(Math.max(...a)).toBeGreaterThan(239);
});
