import { test, expect, Page } from "@playwright/test";

/**
 * Fails every beer data endpoint so the store reports a load error, which is
 * what drives both the global banner and the toast notification.
 */
async function failAllDataRequests(page: Page): Promise<void> {
  const endpoints = [
    "**/assets/data/stats.json",
    "**/assets/data/checkins.json",
    "**/assets/data/beers_all.json",
  ];
  for (const endpoint of endpoints) {
    await page.route(endpoint, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        json: { error: "Internal Server Error" },
      }),
    );
  }
}

test("a failed load raises a toast with a retry action", async ({ page }) => {
  await failAllDataRequests(page);
  await page.goto("/");

  const toast = page.locator(".app-notification--error");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("Unable to load the latest drink data");

  // The toast offers the same recovery path as the persistent banner.
  await expect(toast.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("an uncaught runtime error surfaces the global fallback toast", async ({
  page,
}) => {
  await page.goto("/");

  // Simulate an unhandled error reaching the app's ErrorHandler.
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("boom");
    }, 0);
  });

  await expect(page.locator(".app-notification--error")).toBeVisible();
});
