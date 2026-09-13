import { test, expect } from "@playwright/test";

// Development runs React's StrictMode, which re-runs effects on components it has just mounted.
// When the lazily loaded scene met that re-run after its renderer existed, the WebGL context was
// torn down and the site switched itself to the 2D grid. The ring has to survive it.
test("in development the 3D ring survives strict mode instead of falling back to the grid", async ({ page }) => {
  const lost: string[] = [];
  page.on("console", (m) => {
    if (m.text().includes("Context Lost")) lost.push(m.text());
  });
  await page.goto("/");
  await page.waitForSelector("canvas[data-ring-ready]", { timeout: 30_000 });
  // the teardown lands half a second after the re-run and the fallback two seconds later; in the
  // software renderer the re-run itself can take several seconds, so watch a generous window
  await page.waitForTimeout(12_000);
  expect(lost).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".grid2d")).toHaveCount(0);
});
