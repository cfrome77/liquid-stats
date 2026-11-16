import { test, expect } from "@playwright/test";

test.describe("Per-route meta descriptions", () => {
  test("sets a page-specific description and title", async ({ page }) => {
    await page.goto("/stats");

    await expect(page).toHaveTitle("Stats · Liquid Stats");
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /statistics/i);
  });

  test("updates the description on client-side navigation", async ({
    page,
  }) => {
    await page.goto("/stats");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /statistics/i,
    );

    await page.goto("/beer-history");
    await expect(page).toHaveTitle("Beer History · Liquid Stats");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /drinking history/i,
    );
  });

  test("mirrors the description and title into the social tags", async ({
    page,
  }) => {
    await page.goto("/badges");

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Badges · Liquid Stats",
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", /badges/i);
    await expect(
      page.locator('meta[name="twitter:description"]'),
    ).toHaveAttribute("content", /badges/i);
  });

  test("keeps exactly one description tag after navigating", async ({
    page,
  }) => {
    await page.goto("/stats");
    await page.goto("/insights");
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(
      1,
    );
  });
});
