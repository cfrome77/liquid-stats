import { test, expect } from "@playwright/test";

test.describe("URL-driven list view state", () => {
  test("restores view mode from a shared URL", async ({ page }) => {
    await page.goto("/checkins?view=compact");
    const compactCard = page.locator(".shared-card.compact-view").first();
    await expect(compactCard).toBeVisible();
    await expect(page.locator("button", { hasText: "Compact" })).toHaveClass(
      /active/,
    );
  });

  test("writes view mode to the URL when toggled", async ({ page }) => {
    await page.goto("/checkins");
    await expect(page.locator("app-card").first()).toBeVisible();

    await page.locator("button", { hasText: "Compact" }).click();
    await expect(page).toHaveURL(/view=compact/);
    await expect(
      page.locator(".shared-card.compact-view").first(),
    ).toBeVisible();

    await page.locator("button", { hasText: "Cards" }).click();
    // Default view is omitted so the canonical URL stays clean.
    await expect(page).not.toHaveURL(/view=compact/);
  });

  test("restores page size and page number from the URL", async ({ page }) => {
    await page.goto("/checkins?perPage=20&page=2");
    await expect(page.locator("#itemsPerPage")).toHaveValue("20");
    await expect(page.locator("app-card").first()).toBeVisible();
    await expect(page).toHaveURL(/page=2/);
  });

  test("restores the search term on beer history", async ({ page }) => {
    await page.goto("/beer-history?q=ipa");
    await expect(page.locator('input[type="text"]').first()).toHaveValue("ipa");
  });

  test("clamps an out-of-range page instead of showing an empty list", async ({
    page,
  }) => {
    await page.goto("/checkins?page=9999");
    await expect(page.locator("app-card").first()).toBeVisible();
    await expect(page.locator(".empty-state, app-empty-state")).toHaveCount(0);
  });
});
