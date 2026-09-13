import { test, expect, type Page } from "@playwright/test";
import { decodePng, meanAbsDiff, meanLuma, type Region } from "./png";

// The bands above and below the ring, kept clear of the nav, chips, caption, pager and the tiles,
// which sit between 41% and 59% of the height in browse mode. Fractions of the viewport.
const ABOVE: Region = { x0: 0.05, y0: 0.15, x1: 0.25, y1: 0.35 };
const BELOW: Region = { x0: 0.05, y0: 0.65, x1: 0.25, y1: 0.85 };
const STAGE_IN_MS = 2000; // the stage fades in over 0.8 s once its chunk has arrived

const shoot = async (page: Page) => decodePng(await page.screenshot());

test("the void above and below the ring is lit haze rather than flat black", async ({ page }) => {
  await page.goto("/#/work");
  await page.waitForSelector("canvas[data-ring-ready]");
  await page.waitForTimeout(STAGE_IN_MS);
  const shot = await shoot(page);
  for (const [where, region] of [["above", ABOVE], ["below", BELOW]] as const) {
    const luma = meanLuma(shot, region);
    expect(luma, `${where} the ring is lit`).toBeGreaterThanOrEqual(8);
    expect(luma, `${where} the ring stays dark`).toBeLessThanOrEqual(40);
  }
});

test("the title card sits in the same haze", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
  await page.waitForSelector("canvas");
  await page.waitForTimeout(STAGE_IN_MS);
  expect(meanLuma(await shoot(page), ABOVE)).toBeGreaterThanOrEqual(8);
});

test("the haze drifts, and holds still under reduced motion", async ({ page }) => {
  await page.goto("/#/work");
  await page.waitForSelector("canvas[data-ring-ready]");
  await page.waitForTimeout(STAGE_IN_MS);
  const before = await shoot(page);
  await page.waitForTimeout(3000);
  expect(meanAbsDiff(before, await shoot(page), ABOVE)).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForSelector("canvas[data-ring-ready]");
  await page.waitForTimeout(STAGE_IN_MS);
  const still = await shoot(page);
  await page.waitForTimeout(3000);
  expect(meanAbsDiff(still, await shoot(page), ABOVE)).toBe(0);
});
