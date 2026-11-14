import { test, expect } from "@playwright/test";

/**
 * The app animates in ~35 places (hover lifts, carousel transitions, page
 * fades, skeletons). Before the global rule, only the 404 page honoured
 * `prefers-reduced-motion`, so a vestibular-sensitive user still got a
 * 0.3s card transition. These tests measure the computed duration in both
 * modes and assert it actually collapses.
 */
test.describe("prefers-reduced-motion", () => {
  test("collapses transitions when the user asks for less motion", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto("/checkins");
    await page.locator("app-card").first().waitFor();

    const durations = await page.evaluate(() => {
      const read = (sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el ? getComputedStyle(el).transitionDuration : null;
      };
      return {
        card: read(".shared-card"),
        button: read("button"),
      };
    });

    // 0.01ms renders as "1e-05s".
    for (const value of Object.values(durations)) {
      if (value === null) continue;
      for (const part of value.split(",")) {
        expect(parseFloat(part)).toBeLessThan(0.01);
      }
    }

    await ctx.close();
  });

  test("keeps transitions when no preference is set", async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: "no-preference",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto("/checkins");
    await page.locator("app-card").first().waitFor();

    const card = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".shared-card")!)
          .transitionDuration,
    );

    // The card lifts on hover; that transition must still exist.
    expect(card).toContain("0.3s");

    await ctx.close();
  });
});
