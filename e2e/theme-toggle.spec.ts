import { test, expect } from "@playwright/test";

test("theme toggle works", async ({ page }) => {
  await page.goto("/");

  // Initial theme should be dark (default in ThemeService)
  const body = page.locator("body");
  await expect(body).toHaveClass(/dark-theme/);

  // Find the toggle button
  const toggleButton = page.locator(
    'button[aria-label="Toggle dark/light mode"]',
  );
  await expect(toggleButton).toBeVisible();

  // Toggle to light theme
  await toggleButton.click();
  await expect(body).toHaveClass(/light-theme/);
  await expect(body).not.toHaveClass(/dark-theme/);

  // Verify icon changed (optional, but good)
  // light-theme -> dark_mode icon
  await expect(toggleButton.locator("mat-icon")).toHaveText("dark_mode");

  // Toggle back to dark theme
  await toggleButton.click();
  await expect(body).toHaveClass(/dark-theme/);
  await expect(body).not.toHaveClass(/light-theme/);
  await expect(toggleButton.locator("mat-icon")).toHaveText("light_mode");
});

test("theme preference persists", async ({ page }) => {
  await page.goto("/");

  const toggleButton = page.locator(
    'button[aria-label="Toggle dark/light mode"]',
  );
  const body = page.locator("body");

  // Switch to light theme
  await toggleButton.click();
  await expect(body).toHaveClass(/light-theme/);

  // Reload page
  await page.reload();

  // Should still be light theme
  await expect(body).toHaveClass(/light-theme/);
});
