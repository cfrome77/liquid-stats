import { test, expect } from '@playwright/test';

test('should display powered by untappd logo', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.untappd-logo');
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning
  await page.screenshot({ path: 'e2e/screenshots/logo-desktop.png' });
});

test('should display logo above bottom nav on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const logo = page.locator('.untappd-logo');
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning on mobile
  await page.screenshot({ path: 'e2e/screenshots/logo-mobile.png' });
});
