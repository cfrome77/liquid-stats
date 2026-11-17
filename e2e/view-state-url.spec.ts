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

  test("restores a narrowed filter from the URL", async ({ page }) => {
    const filters = encodeURIComponent(
      JSON.stringify({ brewery: ["Stone Brewing"] }),
    );
    await page.goto(`/beer-history?filters=${filters}`);

    await expect(page.locator("app-card")).toHaveCount(1);
    await expect(
      page.locator("app-card", { hasText: "Stone Brewing" }),
    ).toBeVisible();
  });

  test("writes a filter change back to the URL", async ({ page }) => {
    await page.goto("/beer-history");
    await expect(page.locator("app-card").first()).toBeVisible();

    await page.locator("button", { hasText: "Brewery" }).click();
    const modal = page.locator(".modal-content");
    await expect(modal).toBeVisible();
    // Narrow the selection to a single brewery, then apply.
    await modal.locator('input[type="checkbox"]:checked').first().uncheck();
    await modal.locator("button", { hasText: "Apply" }).click();

    await expect(page).toHaveURL(/filters=/);
  });

  test("falls back to defaults for a malformed filter value", async ({
    page,
  }) => {
    await page.goto("/beer-history?filters=%7Bnot-json");
    // Malformed state is ignored, so the full list still renders.
    await expect(page.locator("app-card").first()).toBeVisible();
    await expect(page.locator(".empty-state, app-empty-state")).toHaveCount(0);
  });

  test("restores filter state when navigating back to the list", async ({
    page,
  }) => {
    const filters = encodeURIComponent(
      JSON.stringify({ brewery: ["Stone Brewing"] }),
    );
    await page.goto(`/beer-history?filters=${filters}`);
    await expect(page.locator("app-card")).toHaveCount(1);

    // Leave the list, then return with the browser's Back button.
    await page.getByRole("button", { name: "Checkins" }).first().click();
    await expect(page).toHaveURL(/\/checkins$/);
    await page.goBack();

    await expect(page).toHaveURL(/filters=/);
    await expect(page.locator("app-card")).toHaveCount(1);
  });

  test("restores the ranking filters on top drinks", async ({ page }) => {
    await page.goto("/top-beers?topX=10&min=2");

    await expect(
      page.locator("h1", { hasText: "Top 10 Drinks" }),
    ).toBeVisible();
  });

  test("restores wishlist view state from the URL", async ({ page }) => {
    await page.goto("/wishlist?view=compact");
    await expect(page.locator("button", { hasText: "Compact" })).toHaveClass(
      /active/,
    );
  });
});
