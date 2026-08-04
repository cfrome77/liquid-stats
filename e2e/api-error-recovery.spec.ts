import { test, expect } from "@playwright/test";

test("API failure displays error banner and retry recovers successfully", async ({ page }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("request", (req) => console.log(">> REQ:", req.method(), req.url()));
  page.on("response", (res) => console.log("<< RES:", res.status(), res.url()));

  let failRequest = true;

  // Intercept the stats API calls
  await page.route("**/stats.json", async (route) => {
    if (failRequest) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        json: {
          totalCheckins: 120,
          averageRating: 4.25,
          countriesTried: 15,
          breweriesVisited: 42,
          lastUpdated: "2026-02-19T12:00:00Z",
        },
      });
    }
  });

  // Intercept other essential requests
  await page.route("**/checkins.json", async (route) => {
    if (failRequest) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        json: { response: { checkins: { items: [] } } },
      });
    }
  });

  await page.route("**/beers_all.json", async (route) => {
    if (failRequest) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        json: {
          beers: [
            {
              count: 120,
              rating_score: 4.25,
              first_created_at: "2026-02-19T12:00:00Z",
              recent_created_at: "2026-02-19T12:00:00Z",
              beer: {
                bid: 101,
                beer_name: "Mock Beer",
                beer_style: "Mock Style",
                beer_label: "https://label.com",
              },
              brewery: {
                brewery_id: 1001,
                brewery_name: "Mock Brewery",
                country_name: "Mock Country",
                brewery_label: "https://brewery.com",
                location: {
                  lat: 10,
                  lng: 20,
                },
              },
            },
          ],
        },
      });
    }
  });

  // Load the page
  await page.goto("/");

  // Verify that the global error banner is visible
  const errorBanner = page.locator(".global-error-banner");
  await expect(errorBanner).toBeVisible();
  await expect(errorBanner.locator(".error-banner-message")).toContainText(
    "Unable to load the latest beer data",
  );

  // Take screenshot of failure state
  await page.screenshot({ path: "e2e/screenshots/api-failure-banner.png" });

  // Let the next request succeed
  failRequest = false;

  // Click the retry button
  const retryBtn = errorBanner.locator(".retry-button");
  await retryBtn.click();

  // Verify that the global error banner disappears
  await expect(errorBanner).not.toBeVisible();

  // Verify that the stats card values are updated
  const checkinsStat = page.locator(".stat-card").first();
  await expect(checkinsStat.locator(".stat-number")).toHaveText("120");

  // Take screenshot of recovery state
  await page.screenshot({ path: "e2e/screenshots/api-recovery-success.png" });
});
