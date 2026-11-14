import { test, expect, Page } from "@playwright/test";

/**
 * The shared card stacks three layers of horizontal padding: the global
 * .mat-mdc-card (15px), Material's .mat-mdc-card-content (16px), and the
 * header's own (12px). On a 320px screen that left the text column about
 * 116px between the two 50px label columns, and long brewery names were
 * clipped (scrollWidth 97 > clientWidth 92).
 *
 * These tests measure the rendered column and assert the padding stays
 * reclaimed, so a future style change cannot quietly re-squeeze the text.
 */
const LONG_CHECKIN = {
  response: {
    checkins: {
      items: [
        {
          checkin_id: 1,
          created_at: "Feb 18, 2026",
          checkin_comment:
            "A really long comment that goes on and on about the beer and the venue and the weather.",
          rating_score: 4.25,
          beer: {
            bid: 101,
            beer_name:
              "Extremely Long Barrel-Aged Imperial Pastry Stout With Coconut",
            beer_style: "Imperial Double Dry-Hopped New England IPA",
            beer_label: "https://label.com/l.png",
            beer_slug: "x",
          },
          brewery: {
            brewery_id: 1,
            brewery_name: "The Ridiculously Long Brewing Company Name LLC",
            brewery_label: "https://b.com/b.png",
            contact: { facebook: "fb", twitter: "t", instagram: "i" },
          },
          badges: { items: [] },
        },
      ],
    },
  },
};

async function openLongCard(page: Page, width: number): Promise<void> {
  await page.route("**/checkins.json", (route) =>
    route.fulfill({ json: LONG_CHECKIN }),
  );
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/checkins");
  await page.locator("app-card").first().waitFor();
  await page.waitForTimeout(300);
}

test.describe("Card text column on narrow screens", () => {
  test("gives the text most of the card at 320px", async ({ page }) => {
    await openLongCard(page, 320);

    const { card, info } = await page.evaluate(() => {
      const c = document.querySelector("app-card")!;
      return {
        card: c.getBoundingClientRect().width,
        info: c.querySelector(".beer-info")!.getBoundingClientRect().width,
      };
    });

    // Before the padding was reclaimed this was ~116px of a 304px card (38%).
    // It should now hold well over half the card.
    expect(info / card).toBeGreaterThan(0.5);
  });

  test("does not clip the brewery name at 320px", async ({ page }) => {
    await openLongCard(page, 320);

    const clipped = await page.evaluate(() =>
      Array.from(document.querySelectorAll("app-card .beer-info .brewery-name"))
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => (el.textContent ?? "").trim()),
    );

    expect(clipped).toEqual([]);
  });

  test("keeps the label thumbnail visible beside the text", async ({
    page,
  }) => {
    await openLongCard(page, 320);

    const label = page.locator("app-card img.beer-label").first();
    await expect(label).toBeVisible();
    const box = await label.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(38);

    // The label and the text column must not overlap.
    const info = await page
      .locator("app-card .beer-info")
      .first()
      .boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      (info?.x ?? 0) + 1,
    );
  });
});
