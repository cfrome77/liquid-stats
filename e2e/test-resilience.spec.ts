import { test, expect } from "@playwright/test";
import {
  gotoRoute,
  gotoWithData,
  setViewport,
  settleAnimations,
  VIEWPORTS,
} from "./support/waits";

/**
 * Regression cover for the flakiness the suite used to paper over with
 * `waitForTimeout` and `waitForLoadState("networkidle")`:
 *
 *   - a fixture that has not arrived yet when the first assertion runs,
 *   - a CSS transition still running while a box is measured,
 *   - a reduced-motion context whose global rule must collapse both
 *     `transition` and `animation` durations,
 *   - a mobile viewport read one frame before the media queries reflowed.
 *
 * Each test asserts the condition directly, so it waits as long as a slow CI
 * runner needs instead of failing on a fixed interval.
 */

test.describe("network waits", () => {
  test("gotoRoute resolves only after the page's fixtures have loaded", async ({
    page,
  }) => {
    // Delay the check-ins payload; gotoRoute must still wait for it and the
    // first card must be present the moment it resolves.
    await page.route("**/checkins.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });

    await gotoRoute(page, "/checkins");
    await expect(page.locator("app-card").first()).toBeVisible();
  });

  test("gotoWithData waits for every requested fixture", async ({ page }) => {
    await gotoWithData(page, "/", [
      "stats.json",
      "beers_all.json",
      "checkins.json",
    ]);
    // The home page renders once the store has all three feeds.
    await expect(page.locator(".stat-card").first()).toBeVisible();
  });
});

test.describe("CSS animation waits", () => {
  test("settleAnimations waits for finite transitions to finish", async ({
    page,
  }) => {
    await gotoRoute(page, "/checkins");
    await page.locator("app-card").first().waitFor();

    // The card has a 0.3s lift transition; after settling, none is running.
    await settleAnimations(page);

    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .filter((a) => {
          const timing = a.effect?.getComputedTiming();
          return timing ? timing.iterations !== Infinity : false;
        })
        .map((a) => a.constructor.name),
    );
    expect(running).toEqual([]);
  });
});

test.describe("reduced-motion states", () => {
  test("collapses both transitions and animations under reduce", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await gotoRoute(page, "/checkins");
    await page.locator("app-card").first().waitFor();

    const durations = await page.evaluate(() => {
      const read = (selector: string, property: "transition" | "animation") => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const style = getComputedStyle(el);
        return property === "transition"
          ? style.transitionDuration
          : style.animationDuration;
      };
      return {
        cardTransition: read(".shared-card", "transition"),
        shimmerAnimation: read(".shimmer", "animation"),
      };
    });

    for (const value of Object.values(durations)) {
      if (value === null) continue;
      for (const part of value.split(",")) {
        expect(parseFloat(part)).toBeLessThan(0.01);
      }
    }

    await ctx.close();
  });
});

test.describe("mobile viewport reliability", () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`list renders without horizontal overflow at ${name}`, async ({
      page,
    }) => {
      await setViewport(page, viewport);
      await gotoRoute(page, "/checkins");
      await expect(page.locator("app-card").first()).toBeVisible();

      // After the reflow settles, the page must not scroll sideways.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("setViewport reflows before assertions read the layout", async ({
    page,
  }) => {
    await page.goto("/");
    await setViewport(page, VIEWPORTS.mobile);

    // The mobile bottom nav only exists below the mobile breakpoint, so its
    // presence proves the resize has been applied to layout, not just the
    // browser's reported viewport size.
    await expect(page.locator(".mobile-bottom-nav")).toBeVisible();

    await setViewport(page, VIEWPORTS.desktop);
    await expect(page.locator(".mobile-bottom-nav")).not.toBeVisible();
    await expect(page.locator(".desktop-nav")).toBeVisible();
  });
});
