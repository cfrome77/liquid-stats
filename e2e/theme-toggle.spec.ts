import { test, expect } from "@playwright/test";

test("follows a light OS preference on first visit", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/light-theme/);
  await context.close();
});

test("theme toggle works", async ({ page }) => {
  await page.goto("/");

  // Initial theme follows the emulated OS preference (dark in the config).
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

  // light-theme -> dark_mode icon
  await expect(toggleButton.locator("mat-icon")).toHaveText("dark_mode");

  // Toggle back to dark theme
  await toggleButton.click();
  await expect(body).toHaveClass(/dark-theme/);
  await expect(body).not.toHaveClass(/light-theme/);
  await expect(toggleButton.locator("mat-icon")).toHaveText("light_mode");
});

test("theme preference persists across reload and route navigation", async ({
  page,
}) => {
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

  // Navigate to /stats page
  await page.goto("/stats");
  await expect(body).toHaveClass(/light-theme/);
});
