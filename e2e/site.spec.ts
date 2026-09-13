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

test("without WebGL the 2D grid is shown and the 3D code is never downloaded", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "script") scripts.push(r.url()); });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Dali Showreel/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((u) => /\/assets\/Stage-/.test(u))).toEqual([]);
  await expect(page.locator('link[rel="modulepreload"][href*="Stage-"]')).toHaveCount(0);
});

test("with WebGL the 3D scene arrives as its own chunk", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "script") scripts.push(r.url()); });
  await page.goto("/#/work");
  await page.waitForSelector("canvas[data-ring-ready]");
  expect(scripts.some((u) => /\/assets\/Stage-/.test(u))).toBe(true);
  // fetched from the page head, in parallel with the entry script, rather than after it has run
  await expect(page.locator('link[rel="modulepreload"][href*="Stage-"]')).toHaveCount(1);
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

test("controls are big enough to hit and keyboard focus never disappears", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/work");
  await page.waitForSelector("canvas[data-ring-ready]");
  const box = async (name: string | RegExp) => (await page.getByRole("button", { name }).first().boundingBox())!;

  for (const name of ["Previous", "Next", "Open menu"]) {
    const b = await box(name);
    expect(b.width, name).toBeGreaterThanOrEqual(44);
    expect(b.height, name).toBeGreaterThanOrEqual(44);
  }
  const dot = await box(/^Go to/);
  expect(dot.height).toBeGreaterThanOrEqual(24);
  expect(dot.width).toBeGreaterThanOrEqual(12); // shrinks on narrow phones; the 44px arrows stay full size

  await page.goto("/#/about");
  const close = await box("Close");
  expect(close.width).toBeGreaterThanOrEqual(44);
  expect(close.height).toBeGreaterThanOrEqual(44);

  // the project index is out of sight until a keyboard reaches it, then it shows itself
  await page.goto("/#/work");
  const link = page.getByRole("link", { name: /Vlaska Teaser/ });
  expect((await link.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  await link.focus();
  expect((await link.boundingBox())!.width).toBeGreaterThan(100);
});

for (const [label, width, height] of [
  ["desktop", 1440, 900],
  ["portrait phone", 390, 844],
  ["landscape phone", 844, 390],
  ["small landscape phone", 667, 375],
] as const) {
  test(`the caption sits clear of the filter and the videos on a ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#/work");
    await page.waitForSelector("canvas[data-ring-ready]");
    const chips = await page.getByRole("button", { name: /^(all|showreel|commercial|narrative|aerial)$/i }).evaluateAll(
      (els) => Math.max(...els.map((e) => e.getBoundingClientRect().bottom)),
    );
    const title = (await page.getByRole("heading", { level: 2 }).boundingBox())!;
    const category = (await page.locator(".caption__category").boundingBox())!;
    const tileTop = height * 0.388; // the focused tile's top edge; see layout.test.ts
    expect(title.y, "title below the filter chips").toBeGreaterThanOrEqual(chips);
    expect(category.y + category.height, "caption above the focused video").toBeLessThanOrEqual(tileTop);
  });
}

