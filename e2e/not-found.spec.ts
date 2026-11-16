import { test, expect } from "@playwright/test";

test("unknown route shows the themed 404 page", async ({ page }) => {
  await page.goto("/definitely-not-a-real-page");

  await expect(page.locator(".nf-container")).toBeVisible();
  await expect(page.locator(".nf-code")).toHaveText("404");
  await expect(page.locator(".nf-title")).toContainText("flat");
  await expect(page.locator(".nf-pint svg")).toBeVisible();

  // Quick links point at real routes.
  await expect(page.locator(".nf-link")).toHaveCount(4);
});

test("404 primary action returns to the taproom", async ({ page }) => {
  await page.goto("/definitely-not-a-real-page");
  await page.locator(".nf-primary").click();
  await expect(page).toHaveURL(/\/home$/);
});

test("404 page renders without overlap on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/definitely-not-a-real-page");

  await expect(page.locator(".nf-container")).toBeVisible();
  await expect(page.locator(".nf-title")).toBeVisible();

  // Primary action is full width and does not overflow the viewport.
  const box = await page.locator(".nf-primary").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});
