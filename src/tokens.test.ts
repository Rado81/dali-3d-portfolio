import tokens from "./tokens.css?raw";
import { HAZE_PEAK } from "./scene/hazeParams";

// WCAG 2.x relative luminance and contrast ratio
function token(name: string): string {
  const m = tokens.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-fA-F]{6})\b`));
  if (!m) throw new Error(`token --${name} not found in tokens.css`);
  return m[1];
}
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ["bg-deep", "bg-base"]; // the stage, and the panels and player

test.each(["text-primary", "text-secondary", "text-muted", "gold"])("--%s reads as text on every surface (4.5:1)", (name) => {
  for (const surface of SURFACES) expect(contrast(token(name), token(surface))).toBeGreaterThanOrEqual(4.5);
});

test("--control-idle outlines resting controls visibly on every surface (3:1)", () => {
  for (const surface of SURFACES) expect(contrast(token("control-idle"), token(surface))).toBeGreaterThanOrEqual(3);
});

// The haze behind the ring lifts the stage above --bg-deep, and the overlays sit on it directly.
// Its brightest patches are HAZE_PEAK, so every token used over the stage is checked against that too.
test.each(["text-primary", "text-secondary", "text-muted", "gold"])("--%s stays readable over the haze at its brightest (4.5:1)", (name) => {
  expect(contrast(token(name), HAZE_PEAK)).toBeGreaterThanOrEqual(4.5);
});

test("--control-idle still outlines resting controls over the haze at its brightest (3:1)", () => {
  expect(contrast(token("control-idle"), HAZE_PEAK)).toBeGreaterThanOrEqual(3);
});

test("the contrast maths matches known WCAG values", () => {
  expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 1);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
});
