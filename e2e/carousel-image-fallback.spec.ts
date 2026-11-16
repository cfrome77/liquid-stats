import { test, expect } from "@playwright/test";

/**
 * Untappd answers 403 for beers that have no HD label variant, even though the
 * standard label exists. The carousel used to drop straight to the bundled
 * placeholder in that case; it must retry the standard label first.
 */
test.describe("carousel image fallback", () => {
  const SMALL_LABEL =
    "https://assets.untappd.com/site/beer_logos/beer-1_abc_sm.jpeg";
  const HD_LABEL =
    "https://assets.untappd.com/site/beer_logos_hd/beer-1_abc_hd.jpeg";
  const PLACEHOLDER = "assets/images/beer-placeholder.svg";

  test.beforeEach(async ({ page }) => {
    await page.route("**/checkins.json", (route) =>
      route.fulfill({
        json: {
          response: {
            checkins: {
              items: [
                {
                  checkin_id: 1,
                  created_at: "Feb 18, 2026",
                  rating_score: 4.25,
                  beer: {
                    bid: 1,
                    beer_name: "Test HD Beer",
                    beer_label: SMALL_LABEL,
                    beer_slug: "x",
                  },
                  brewery: {
                    brewery_id: 1,
                    brewery_name: "Test Brew",
                    brewery_label: "",
                    contact: {},
                  },
                  badges: { items: [] },
                  user: { user_name: "u" },
                },
              ],
            },
          },
        },
      }),
    );

    // The HD variant 403s (no HD image); the standard label succeeds.
    await page.route("**/beer_logos**", (route) =>
      route.request().url().includes("_hd")
        ? route.fulfill({ status: 403 })
        : route.fulfill({
            status: 200,
            contentType: "image/gif",
            body: Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64"),
          }),
    );
  });

  test("uses the standard label when the HD variant is unavailable", async ({
    page,
  }) => {
    await page.goto("/");
    const img = page.locator(".carousel-track img").first();
    await img.waitFor();

    await expect
      .poll(async () => img.getAttribute("src"), { timeout: 5000 })
      .toContain("_sm.jpeg");

    const src = await img.getAttribute("src");
    expect(src).not.toContain(PLACEHOLDER);
  });
});
