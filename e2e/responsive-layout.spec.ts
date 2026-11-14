import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Liquid Stats/);
});

test("responsive navigation", async ({ page }) => {
  await page.goto("/");

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  const navItems = page.locator(".desktop-nav");
  await expect(navItems).toBeVisible();

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(navItems).not.toBeVisible();

  // Menu button is hidden on mobile in favor of bottom nav
  const menuButton = page.locator('button:has(mat-icon:text("menu"))');
  await expect(menuButton).not.toBeVisible();

  const bottomNav = page.locator(".mobile-bottom-nav");
  await expect(bottomNav).toBeVisible();
});

test("beer history layout", async ({ page }) => {
  await page.goto("/beer-history");

  const container = page.locator(".main-content-container");
  await expect(container).toBeVisible();

  // Check layout on desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: "e2e/screenshots/beer-history-desktop.png" });

  // Check layout on mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: "e2e/screenshots/beer-history-mobile.png" });
});

test("routes render on mobile and desktop", async ({ page }) => {
  const routes = ["/stats", "/badges", "/wishlist"];

  for (const r of routes) {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(r);
    const containerDesktop = page.locator(".main-content-container");
    await expect(containerDesktop).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(r);
    const containerMobile = page.locator(".main-content-container");
    await expect(containerMobile).toBeVisible();
  }
});

test("skip link is reachable by keyboard and targets main content", async ({
  page,
}) => {
  await page.goto("/home");
  await page.keyboard.press("Tab");
  const skipLink = page.locator("a.skip-link");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await expect(page.locator("main#main-content")).toHaveCount(1);
});
