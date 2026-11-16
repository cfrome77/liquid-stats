import { test, expect } from "@playwright/test";

test("should display powered by untappd logo", async ({ page }) => {
  await page.goto("/");

  // Click info FAB to open the About dialog where the logo resides
  const infoFab = page.locator("app-info-fab button");
  await expect(infoFab).toBeVisible();
  await infoFab.click();

  const logo = page.locator(".powered-by");
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning
  await page.screenshot({ path: "e2e/screenshots/logo-desktop.png" });
});

test("should display logo above bottom nav on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  // Click info FAB to open the About dialog where the logo resides
  const infoFab = page.locator("app-info-fab button");
  await expect(infoFab).toBeVisible();
  await infoFab.click();

  const logo = page.locator(".powered-by");
  await expect(logo).toBeVisible();

  // Take a screenshot to verify positioning on mobile
  await page.screenshot({ path: "e2e/screenshots/logo-mobile.png" });
});

test("missing images fall back to the local beer placeholder", async ({
  page,
}) => {
  // Point the card at a label that cannot load, so the (error) handler runs.
  await page.route("**/checkins.json", (route) =>
    route.fulfill({
      json: {
        response: {
          checkins: {
            items: [
              {
                checkin_id: 1,
                created_at: "Feb 18, 2026",
                rating_score: 4,
                beer: {
                  bid: 101,
                  beer_name: "Fallback Beer",
                  beer_style: "Test Style",
                  beer_label: "/definitely-missing-label.png",
                  beer_slug: "fallback-beer",
                },
                brewery: {
                  brewery_id: 1,
                  brewery_name: "Test Brewery",
                  brewery_label: "/definitely-missing-brewery.png",
                  contact: { facebook: "fb" },
                },
                badges: { items: [] },
              },
            ],
          },
        },
      },
    }),
  );

  await page.goto("/checkins");
  const img = page.locator("app-card img").first();
  await expect(img).toBeVisible();

  // After the load error the src is rewritten to the bundled placeholder.
  await expect
    .poll(async () => img.getAttribute("src"))
    .toContain("beer-placeholder.svg");
});
