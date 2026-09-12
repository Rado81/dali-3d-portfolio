import { test, expect } from "@playwright/test";

test("intro, enter, step, play, panel, escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
  await page.getByRole("button", { name: "Enter the Work" }).click();
  await expect(page.getByRole("heading", { name: "Dali Showreel" })).toBeVisible();
  await expect(page).toHaveURL(/#\/work\/dali-showreel$/);

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Lifestyle Mix Commercials" })).toBeVisible();

  await page.getByRole("button", { name: "Play", exact: true }).click();
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
