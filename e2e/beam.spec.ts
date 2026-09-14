import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { decodePng, luminanceAt, meanLuma, type Region } from "./png";

// Read with the nav, chips, caption and pager hidden, so only the scene is measured. The top band sits above
// the reach of the focused tile's spill; the edge band is the same height at the left edge, off the beam's axis.
const BEAM_BAND: Region = { x0: 0.4, y0: 0.05, x1: 0.6, y1: 0.14 };
const EDGE_BAND: Region = { x0: 0.02, y0: 0.05, x1: 0.12, y1: 0.14 };
const SETTLE_MS = 3500; // the stage fades in over 0.8 s once loaded, and the beam arrives with the camera
const HIDE_TEXT = ".nav, .topstack, .pager { visibility: hidden !important; }";

const tokens = readFileSync("src/tokens.css", "utf8");
function tokenLuminance(name: string): number {
  const hex = tokens.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-fA-F]{6})`))![1];
  return [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

async function openRing(page: Page) {
  await page.goto("/#/work");
  await page.waitForSelector("canvas[data-ring-ready]");
  await page.waitForTimeout(SETTLE_MS);
}

/** The screen area a set of elements covers, as fractions of the viewport. */
async function regionOf(page: Page, selector: string): Promise<Region> {
  const { width, height } = page.viewportSize()!;
  const [left, top, right, bottom] = await page.locator(selector).evaluateAll((els) => {
    const rects = els.map((e) => e.getBoundingClientRect());
    return [
      Math.min(...rects.map((r) => r.left)), Math.min(...rects.map((r) => r.top)),
      Math.max(...rects.map((r) => r.right)), Math.max(...rects.map((r) => r.bottom)),
    ];
  });
  return { x0: left / width, y0: top / height, x1: right / width, y1: bottom / height };
}

test("a projector beam comes down onto the ring from above", async ({ page }) => {
  await openRing(page);
  await page.addStyleTag({ content: HIDE_TEXT });
  const shot = decodePng(await page.screenshot());
  expect(meanLuma(shot, BEAM_BAND) - meanLuma(shot, EDGE_BAND)).toBeGreaterThanOrEqual(12);
});

test("the beam leaves the chips and the caption readable against the scene behind each of them", async ({ page }) => {
  await openRing(page);
  const texts = [
    { selector: ".filter__chip", colors: ["text-secondary", "gold"] }, // resting chips, and the active one
    { selector: ".caption__title", colors: ["text-primary"] },
    { selector: ".caption__category", colors: ["gold"] },
  ];
  const regions = await Promise.all(texts.map((t) => regionOf(page, t.selector)));
  await page.addStyleTag({ content: HIDE_TEXT });
  const shot = decodePng(await page.screenshot());
  texts.forEach((t, i) => {
    const background = luminanceAt(shot, regions[i], 0.99);
    for (const name of t.colors) {
      const ratio = (tokenLuminance(name) + 0.05) / (background + 0.05);
      expect(ratio, `--${name} on ${t.selector}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
