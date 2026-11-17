import { test, expect, Page } from "@playwright/test";

/**
 * The Insights charts are interactive: clicking a bar opens the matching
 * check-in list and mirrors the selection into the URL (`?style=`/`?rating=`)
 * with `queryParamsHandling: "merge"`. A shared URL with those params reopens
 * the same list, matching how the stats page behaves.
 */

/** Clicks a bar in the ranked style chart and returns the clicked label. */
async function clickFirstStyleBar(page: Page): Promise<string> {
  const canvas = page.locator(".style-bar-chart-container canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();

  const box = (await canvas.boundingBox())!;
  // The top-ranked style sits in the first row of the horizontal bar chart.
  await page.mouse.click(box.x + box.width * 0.6, box.y + 20);

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  const title = (await dialog.locator("h2").textContent()) ?? "";
  return title.trim();
}

test("clicking a style bar opens the filtered list and writes ?style=", async ({
  page,
}) => {
  await page.goto("/insights");
  const title = await clickFirstStyleBar(page);

  expect(title).toMatch(/ Drinks$/);
  const style = title.replace(/ Drinks$/, "");
  await expect(page).toHaveURL(
    new RegExp(`style=${encodeURIComponent(style)}`),
  );
});

test("a shared ?style= URL reopens the filtered list", async ({ page }) => {
  await page.goto("/insights?style=IPA");

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText("IPA Drinks");
});

test("a shared ?rating= URL reopens the rating bin list", async ({ page }) => {
  await page.goto("/insights?rating=4.25");

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toContainText("4.25");
});

test("clicking a style bar does not open the dialog twice", async ({
  page,
}) => {
  await page.goto("/insights");
  await clickFirstStyleBar(page);

  // Give the query-param echo a chance to fire a second time.
  await page.waitForTimeout(500);
  await expect(page.locator("mat-dialog-container")).toHaveCount(1);
});

test("the charts advertise their interactivity", async ({ page }) => {
  await page.goto("/insights");
  await expect(page.locator(".chart-interaction-hint")).toHaveCount(2);
  await expect(page.locator("canvas.interactive-chart")).toHaveCount(2);
});
