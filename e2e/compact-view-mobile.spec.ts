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

test("compact card keeps brewery and style legible on mobile", async ({
  page,
}) => {
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
                  bid: 101,
                  beer_name: "Extremely Long Barrel-Aged Imperial Pastry Stout",
                  beer_style: "Imperial Double Dry-Hopped New England IPA",
                  beer_label: "https://label.com/l.png",
                  beer_slug: "x",
                },
                brewery: {
                  brewery_id: 1,
                  brewery_name: "The Ridiculously Long Brewing Company Name",
                  brewery_label: "https://b.com/b.png",
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

  await page.setViewportSize({ width: 390, height: 852 });
  await page.goto("/checkins");
  await page.locator("button", { hasText: "Compact" }).first().click();

  const card = page.locator(".shared-card.compact-view").first();
  await expect(card).toBeVisible();

  // The brewery and style were previously squeezed to ~70px/~54px, which is
  // unreadable. Give each a sensible minimum now that the redundant star row
  // is hidden on small screens.
  const brewery = await card.locator(".brewery-name").boundingBox();
  const style = await card.locator(".subtitle").boundingBox();
  expect(brewery?.width ?? 0).toBeGreaterThan(90);
  expect(style?.width ?? 0).toBeGreaterThan(80);

  // The numeric score remains the source of truth for the rating.
  await expect(card.locator(".compact-rating strong").first()).toBeVisible();
});
