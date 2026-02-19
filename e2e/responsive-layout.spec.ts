import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Liquid Stats/);
});

test("responsive navigation", async ({ page }) => {
  await page.goto("/");

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  // Wait for the element to be attached and visible
  const navItems = page.locator(".desktop-nav");
  await expect(navItems).toBeVisible();

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(navItems).not.toBeVisible();

  const menuButton = page.locator('button:has(mat-icon:text("menu"))');
  await expect(menuButton).toBeVisible();
});

test("beer history layout", async ({ page }) => {
  await page.goto("/beer-history");

  // Check if main-content-container is used
  const container = page.locator(".main-content-container");
  await expect(container).toBeVisible();

  // Check layout on desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: "e2e/screenshots/beer-history-desktop.png" });

  // Check layout on mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: "e2e/screenshots/beer-history-mobile.png" });
});
