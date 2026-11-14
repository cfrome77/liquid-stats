import { test, expect } from "@playwright/test";

const checkin = (
  id: number,
  breweryName: string,
  beerStyle: string,
  beerName = "Beer",
) => ({
  checkin_id: id,
  created_at: "Feb 18, 2026",
  rating_score: 4.25,
  beer: {
    bid: 101,
    beer_name: beerName,
    beer_style: beerStyle,
    beer_label: "https://label.com/l.png",
    beer_slug: "x",
  },
  brewery: {
    brewery_id: 1,
    brewery_name: breweryName,
    brewery_label: "https://b.com/b.png",
    contact: { facebook: "fb" },
  },
  badges: { items: [] },
  user: { user_name: "u" },
});

/**
 * At 320 px the compact subtitle row previously squeezed the style down to
 * ~57 px (~6 characters) because the brewery was capped at 50% and would not
 * shrink. These tests measure the rendered widths of both fields.
 */
test.describe("compact subtitle legibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/checkins.json", (route) =>
      route.fulfill({
        json: {
          response: {
            checkins: {
              items: [
                checkin(
                  1,
                  "The Ridiculously Long Brewing Company Name LLC",
                  "Imperial Double Dry-Hopped New England IPA",
                ),
                checkin(2, "Trillium", "IPA"),
                checkin(3, "Other Half Brewing", "New England IPA"),
              ],
            },
          },
        },
      }),
    );
  });

  test("gives each subtitle field a readable share on a 320px screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/checkins");
    await page.locator("button", { hasText: "Compact" }).first().click();
    await page.locator(".shared-card.compact-view").first().waitFor();

    const fields = await page
      .locator(".shared-card.compact-view")
      .first()
      .evaluate((el) => {
        const width = (sel: string) => {
          const node = el.querySelector(sel) as HTMLElement | null;
          return node ? node.getBoundingClientRect().width : 0;
        };
        return {
          brewery: width(".brewery-name.inline"),
          style: width(".subtitle.inline"),
        };
      });

    // Both were previously ~57-73 px. Each now owns a full line.
    expect(fields.brewery).toBeGreaterThan(120);
    expect(fields.style).toBeGreaterThan(120);
  });

  test("keeps short rows at the compact height", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/checkins");
    await page.locator("button", { hasText: "Compact" }).first().click();
    await page.locator(".shared-card.compact-view").nth(1).waitFor();

    // The "Trillium · IPA" row shares one line, so it must not grow.
    const height = await page
      .locator(".shared-card.compact-view")
      .nth(1)
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(70);
  });
});
