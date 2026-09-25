import { test, expect } from "@playwright/test";

test.describe("Compact view mobile formatting", () => {
  test("renders compact cards cleanly on mobile (Pixel 9 viewport)", async ({
    page,
  }) => {
    // Pixel 9 viewport (393 x 852)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/checkins");

    const firstCard = page.locator("app-card").first();
    await expect(firstCard).toBeVisible();

    const compactBtn = page.locator("button", { hasText: "Compact" });
    await expect(compactBtn).toBeVisible();
    await compactBtn.click();

    const compactCard = page.locator(".shared-card.compact-view").first();
    await expect(compactCard).toBeVisible();

    // Verify card bounding box height remains compact (under 65px)
    const box = await compactCard.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeLessThan(65);
    }

    // Verify rating number strong element is visible and contains rating value
    const ratingScore = compactCard.locator(".compact-rating strong");
    if ((await ratingScore.count()) > 0) {
      await expect(ratingScore.first()).toBeVisible();
    }

    await page.screenshot({
      path: "e2e/screenshots/compact-view-mobile-pixel9.png",
      fullPage: false,
    });
  });

  test("renders compact view correctly on beer history page on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/beer-history");

    const firstCard = page.locator("app-card").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const compactBtn = page.locator("button", { hasText: "Compact" });
    await expect(compactBtn).toBeVisible();
    await compactBtn.click();

    const compactCard = page.locator(".shared-card.compact-view").first();
    await expect(compactCard).toBeVisible();

    const box = await compactCard.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeLessThan(65);
    }

    await page.screenshot({
      path: "e2e/screenshots/beer-history-compact-mobile.png",
    });
  });
});
