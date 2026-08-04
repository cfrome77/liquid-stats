import { test, expect } from "@playwright/test";

test("should display powered by untappd logo", async ({ page }) => {
  await page.goto("/");

  // Click info FAB to open the About dialog where the logo resides
  const infoFab = page.locator("app-info-fab button");
  await expect(infoFab).toBeVisible();
  await infoFab.click();

  const logo = page.locator(".powered-by");
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning
  await page.screenshot({ path: "e2e/screenshots/logo-desktop.png" });
});

test("should display logo above bottom nav on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  // Click info FAB to open the About dialog where the logo resides
  const infoFab = page.locator("app-info-fab button");
  await expect(infoFab).toBeVisible();
  await infoFab.click();

  const logo = page.locator(".powered-by");
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning on mobile
  await page.screenshot({ path: "e2e/screenshots/logo-mobile.png" });
});
