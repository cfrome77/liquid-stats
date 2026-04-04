import { test, expect } from "@playwright/test";

test.describe("Info FAB positioning", () => {
  test("should be positioned on the right on desktop", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 800 });

    const fabContainer = page.locator("app-info-fab .fab-container");
    await expect(fabContainer).toBeVisible();

    const box = await fabContainer.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      // Should be on the right side
      expect(box.x + box.width).toBeGreaterThan(viewport.width - 50);
      // Should be near the bottom
      expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
    }

    await page.screenshot({ path: "e2e/screenshots/info-fab-desktop.png" });
  });

  test("should be positioned on the right and above bottom nav on mobile", async ({
    page,
  }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 375, height: 667 });

    const fabContainer = page.locator("app-info-fab .fab-container");
    await expect(fabContainer).toBeVisible();

    const box = await fabContainer.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      // Should be on the right side
      expect(box.x + box.width).toBeGreaterThan(viewport.width - 50);
      // Should be above the bottom nav (60px) + some margin
      // 75px bottom was set in CSS
      expect(box.y + box.height).toBeLessThan(viewport.height - 60);
      expect(box.y + box.height).toBeGreaterThan(viewport.height - 150);
    }

    await page.screenshot({ path: "e2e/screenshots/info-fab-mobile.png" });
  });
});
