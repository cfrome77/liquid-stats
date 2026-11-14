import { test, expect } from "@playwright/test";

/**
 * List cards render labels at 38–54 px. Untappd serves a small square
 * (~10 kB) and an "hd" variant (~130 kB) of the same label, so cards must
 * request the small one. These tests assert the rendered `src` rather than
 * pixels, since the payload difference is the whole point.
 */
const HD_PATTERN = /_hd\.(jpe?g|png|webp)/i;

test.describe("Label thumbnails request the small variant", () => {
  for (const path of [
    "/checkins",
    "/top-beers",
    "/beer-history",
    "/wishlist",
  ]) {
    test(`no HD label is requested on ${path}`, async ({ page }) => {
      const labelRequests: string[] = [];
      page.on("request", (req) => {
        if (/beer_logos|brewery_logos/.test(req.url())) {
          labelRequests.push(req.url());
        }
      });

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const labels = page.locator(
        "app-card img.beer-label, app-card img.brewery-label",
      );
      const count = await labels.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const src = await labels.nth(i).getAttribute("src");
          expect(src ?? "", `label ${i} on ${path}`).not.toMatch(HD_PATTERN);
        }
      }

      for (const url of labelRequests) {
        expect(url, `requested label on ${path}`).not.toMatch(HD_PATTERN);
      }
    });
  }

  test("renders a visible label thumbnail on the checkins list", async ({
    page,
  }) => {
    await page.goto("/checkins");
    const label = page.locator("app-card img.beer-label").first();
    await expect(label).toBeVisible();
    const box = await label.boundingBox();
    // The small variant is 100px wide and must cover the 54px slot crisply.
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(38);
    expect(box?.width ?? 0).toBeLessThanOrEqual(54);
  });
});
