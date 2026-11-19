import { test, expect } from "@playwright/test";
import {
  expectMotionCollapsed,
  readTransitionDurations,
  settleAnimations,
} from "./support/waits";

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

    // 0.01ms renders as "1e-05s"; both the card lift and the button transition
    // must collapse. A null value means the element is not on the page.
    const durations = await readTransitionDurations(page, [
      ".shared-card",
      "button",
    ]);
    for (const value of durations) {
      if (value === null) continue;
      for (const part of value.split(",")) {
        expect(parseFloat(part)).toBeLessThan(0.01);
      }
    }

    await ctx.close();
  });

  test("collapses decorative animations when the user asks for less motion", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto("/checkins");
    await page.locator("app-card").first().waitFor();

    // The skeleton shimmer and the 404 waves are `animation`s, not
    // `transition`s, so the global rule must cover both properties.
    await expectMotionCollapsed(page, {
      transitions: [".shared-card"],
      animations: [".shimmer"],
    });

    // With every duration collapsed, no finite animation is left running.
    await settleAnimations(page);

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

    const [card] = await readTransitionDurations(page, [".shared-card"]);

    // The card lifts on hover; that transition must still exist.
    expect(card).toContain("0.3s");

    await ctx.close();
  });
});
