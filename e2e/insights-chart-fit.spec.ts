import { test, expect } from "@playwright/test";

/**
 * `.charts-row-grid` is a one-column grid, but a grid item defaults to
 * `min-width: auto`, so the `1fr` track could not shrink below its content's
 * min-content size. The Chart.js canvas has a 300px intrinsic width, which
 * forced the track to ~350px (canvas + 24px card padding each side) and pushed
 * the card ~46px past its 304px container at 320px. The card is now allowed to
 * shrink (`min-width: 0`), so the canvas resizes to fit instead of overflowing.
 *
 * These tests measure the rendered boxes, so a future style change cannot
 * quietly reintroduce the overflow.
 */
const WIDTHS = [320, 375];

for (const width of WIDTHS) {
  test(`insights chart cards stay inside their container at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/insights");
    await page.locator(".chart-card").first().waitFor();

    const measured = await page.evaluate(() => {
      const grid = document.querySelector(".charts-row-grid") as HTMLElement;
      const gridRight = grid.getBoundingClientRect().right;
      return Array.from(document.querySelectorAll(".chart-card")).map(
        (card) => {
          const r = card.getBoundingClientRect();
          const canvas = card.querySelector(
            "canvas",
          ) as HTMLCanvasElement | null;
          const canvasWidth = canvas ? canvas.getBoundingClientRect().width : 0;
          return {
            right: r.right,
            width: r.width,
            canvasWidth,
            gridRight,
          };
        },
      );
    });

    expect(measured.length).toBeGreaterThan(0);
    for (const card of measured) {
      // No card may extend past the grid's right edge.
      expect(card.right).toBeLessThanOrEqual(card.gridRight + 1);
      // The canvas must fit inside the card, not stick out.
      expect(card.canvasWidth).toBeLessThanOrEqual(card.width);
    }
  });
}

test("insights charts do not widen the page at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/insights");
  await page.locator(".chart-card").first().waitFor();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("insights shows a ranked style bar chart above the milestones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1200 });
  await page.goto("/insights");
  await page.locator(".chart-card").first().waitFor();

  const chart = page.locator(".style-bar-chart-container");
  await expect(chart).toBeVisible();
  await expect(chart.locator("canvas")).toHaveCount(1);

  // The radar chart was removed.
  await expect(page.getByText("Style Radar Distribution")).toHaveCount(0);

  // Milestones stay below the chart, as required.
  const chartBottom = await chart.evaluate(
    (el) => el.getBoundingClientRect().bottom,
  );
  const milestonesTop = await page
    .locator(".milestones-grid")
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(milestonesTop).toBeGreaterThanOrEqual(chartBottom);
});
