import { expect, Page } from "@playwright/test";

/**
 * Explicit, deterministic wait primitives shared by the e2e suite.
 *
 * The suite used to lean on `waitForTimeout` and `waitForLoadState("networkidle")`
 * to paper over two races: data fixtures arriving after the first paint, and CSS
 * transitions still running while an assertion measured the DOM. Both are timing
 * guesses that behave differently on a loaded CI runner. These helpers replace
 * them with conditions Playwright can observe directly, so a slow machine waits
 * longer instead of failing.
 */

/** Named viewport sizes used across the suite, so tests agree on what "mobile" means. */
export const VIEWPORTS = {
  /** Narrowest supported layout. */
  mobileSmall: { width: 320, height: 900 },
  /** Common phone portrait (iPhone SE / 8). */
  mobile: { width: 375, height: 667 },
  /** Large phone portrait (Pixel 9). */
  mobileLarge: { width: 393, height: 852 },
  /** Desktop reference width. */
  desktop: { width: 1280, height: 800 },
} as const;

/** A viewport size; matches Playwright's `setViewportSize` argument. */
export type Viewport = { width: number; height: number };

/**
 * The data fixture each list route waits on. The home page loads the whole
 * store (stats, beers, checkins), so it waits on all three.
 */
export const ROUTE_ENDPOINTS: Record<string, readonly string[]> = {
  "/": ["stats.json", "beers_all.json", "checkins.json"],
  "/checkins": ["checkins.json"],
  "/top-beers": ["beers_all.json"],
  "/beer-history": ["beers_all.json"],
  "/wishlist": ["wishlist.json"],
  "/badges": ["badges.json"],
};

/**
 * Navigates to an app route and waits for the fixtures it renders from. Prefer
 * this over `waitForLoadState("networkidle")`, which Playwright discourages
 * because a background request can keep the network from ever going idle.
 */
export async function gotoRoute(page: Page, route: string): Promise<void> {
  const endpoints = ROUTE_ENDPOINTS[route.split("?")[0] ?? route] ?? [];
  await gotoWithData(page, route, endpoints);
}

/**
 * Resizes the viewport and waits for the resulting layout to settle.
 *
 * `setViewportSize` resolves as soon as the browser has been told the new size,
 * which can be one frame before media queries and `ResizeObserver` handlers have
 * reflowed. Reading a bounding box in that window measures the previous layout,
 * so wait for two animation frames first.
 */
export async function setViewport(page: Page, size: Viewport): Promise<void> {
  await page.setViewportSize(size);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/**
 * Navigates to `url` and resolves once a response has arrived for every entry in
 * `endpoints` (matched as a substring of the response URL).
 *
 * The listeners are registered before `goto` on purpose: a fixture served from
 * memory can respond before the test starts listening, and a missed response
 * would hang until the timeout. Use the fixture filenames the page actually
 * fetches, e.g. `["checkins.json", "beers_all.json"]`.
 */
export async function gotoWithData(
  page: Page,
  url: string,
  endpoints: readonly string[] = [],
): Promise<void> {
  const responses = endpoints.map((endpoint) =>
    page.waitForResponse((res) => res.url().includes(endpoint), {
      timeout: 15_000,
    }),
  );
  await page.goto(url);
  await Promise.all(responses);
}

/**
 * Waits until no finite animation or transition is still running inside `scope`.
 *
 * Infinite animations (the skeleton shimmer, the map pulse, the 404 waves) are
 * ignored: they never finish, so waiting on them would always time out. Under
 * `prefers-reduced-motion: reduce` every duration collapses to 0.01ms, so this
 * resolves on the next frame instead of the next transition.
 */
export async function settleAnimations(
  scope: Page,
  { timeout = 5_000 }: { timeout?: number } = {},
): Promise<void> {
  await expect
    .poll(
      () =>
        scope.evaluate(() => {
          const animations = document.getAnimations();
          return animations.filter((animation) => {
            if (animation.playState !== "running") return false;
            const timing = animation.effect?.getComputedTiming();
            // `iterations` is `Infinity` for the looping decorative animations.
            return timing ? timing.iterations !== Infinity : false;
          }).length;
        }),
      { timeout },
    )
    .toBe(0);
}

/** Reads the computed `transitionDuration` of the first match for each selector. */
export async function readTransitionDurations(
  page: Page,
  selectors: readonly string[],
): Promise<(string | null)[]> {
  return page.evaluate(
    (sels) =>
      sels.map((selector) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).transitionDuration : null;
      }),
    selectors,
  );
}

/** Reads the computed `animationDuration` of the first match for each selector. */
export async function readAnimationDurations(
  page: Page,
  selectors: readonly string[],
): Promise<(string | null)[]> {
  return page.evaluate(
    (sels) =>
      sels.map((selector) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).animationDuration : null;
      }),
    selectors,
  );
}

/** The largest duration in a computed `"a, b, c"` duration list, in seconds. */
export function maxDurationSeconds(value: string | null): number {
  if (!value) return 0;
  return value
    .split(",")
    .map((part) => Number.parseFloat(part))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
}

/**
 * Asserts that a page honouring `prefers-reduced-motion: reduce` has collapsed
 * the given transitions and animations. `0.01ms` renders as `"1e-05s"`, so the
 * check is "under a frame", not "exactly zero".
 */
export async function expectMotionCollapsed(
  page: Page,
  {
    transitions = [],
    animations = [],
  }: { transitions?: string[]; animations?: string[] },
): Promise<void> {
  for (const duration of await readTransitionDurations(page, transitions)) {
    expect(maxDurationSeconds(duration)).toBeLessThan(0.01);
  }
  for (const duration of await readAnimationDurations(page, animations)) {
    expect(maxDurationSeconds(duration)).toBeLessThan(0.01);
  }
}
