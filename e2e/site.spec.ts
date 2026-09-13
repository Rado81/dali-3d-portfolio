import { test, expect } from "@playwright/test";

test("intro, enter, step, play, panel, escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
  await page.getByRole("button", { name: "Enter the Work" }).click();
  await expect(page.getByRole("heading", { name: "Dali Showreel" })).toBeVisible();
  await expect(page).toHaveURL(/#\/work\/dali-showreel$/);

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Lifestyle Mix Commercials" })).toBeVisible();
  await expect(page.getByText("Piece 2 of 12")).toBeAttached(); // the position counter, as announced

  await page.keyboard.press("Enter");
  await expect(page.locator("iframe[title='Lifestyle Mix Commercials']")).toBeVisible();
  await expect(page).toHaveURL(/#\/play\/lifestyle-mix-commercials$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("iframe")).toHaveCount(0);

  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("dialog", { name: "About" })).toBeVisible();
  await expect(page).toHaveURL(/#\/about$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/work\/lifestyle-mix-commercials$/);
});

test("deep link opens a panel without the intro", async ({ page }) => {
  await page.goto("/#/services");
  await expect(page.getByRole("dialog", { name: "Services" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter the Work" })).toHaveCount(0);
});

test("without WebGL the 2D grid is shown", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Dali Showreel/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("a slow drag moves one tile and a flick throws the ring further", async ({ page }) => {
  await page.goto("/#/work");
  await expect(page.getByRole("heading", { name: "Dali Showreel" })).toBeVisible();
  await page.waitForSelector("canvas[data-ring-ready]"); // the ring has attached its pointer listeners
  const cx = 640, cy = 300;

  // slow: 200 px leftwards over ~600 ms, then resting before lift-off, lands on the next tile
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(cx - i * 20, cy);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/work\/lifestyle-mix-commercials$/);

  // flick: the same distance in a few milliseconds projects past the next tile
  // (dispatched synthetically because the headless software renderer throttles real pointer events)
  await page.evaluate(([x, y]) => {
    const canvas = document.querySelector("canvas")!;
    const fire = (type: string, clientX: number) =>
      canvas.dispatchEvent(new PointerEvent(type, { clientX, clientY: y, pointerId: 7, bubbles: true, isPrimary: true }));
    fire("pointerdown", x);
    for (let i = 1; i <= 5; i++) fire("pointermove", x - i * 40);
    fire("pointerup", x - 200);
  }, [cx, cy]);
  await expect.poll(() => new URL(page.url()).hash, { timeout: 5000 }).not.toMatch(
    /dali-showreel$|lifestyle-mix-commercials$|carlsberg-vuvuzela$/,
  );
});

test("the wordmark returns to the title card from a panel and from the ring", async ({ page }) => {
  await page.goto("/#/about");
  await expect(page.getByRole("dialog", { name: "About" })).toBeVisible();
  await page.getByRole("link", { name: /sandic/i }).click();
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
  await expect(page).toHaveURL(/#\/$/);

  await page.getByRole("button", { name: "Enter the Work" }).click();
  await expect(page.getByRole("heading", { name: "Dali Showreel" })).toBeVisible();
  await page.getByRole("link", { name: /sandic/i }).click();
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
});
