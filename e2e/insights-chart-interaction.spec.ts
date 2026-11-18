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

test("hides the search box when the list has a single drink", async ({
  page,
}) => {
  // Wheat matches exactly one check-in, so there is nothing to search.
  await page.goto("/insights?style=Wheat");

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText("Wheat Drinks");
  await expect(dialog.locator("li")).toHaveCount(1);
  await expect(dialog.locator(".dialog-search-wrapper")).toHaveCount(0);
});

test("shows the search box when the list has several drinks", async ({
  page,
}) => {
  // IPA matches more than one check-in, so the search box is useful.
  await page.goto("/insights?style=IPA");

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  expect(await dialog.locator("li").count()).toBeGreaterThan(1);
  await expect(dialog.locator(".dialog-search-wrapper")).toHaveCount(1);
});

test("does not focus the search box on open, so no keyboard pops up", async ({
  page,
}) => {
  await page.goto("/insights?style=IPA");
  await expect(page.locator("mat-dialog-container")).toBeVisible();

  // Material moves focus once the open animation finishes. Wait for focus to
  // land inside the dialog so we assert on the settled state, not mid-animation.
  const focused = () =>
    page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return {
        insideDialog: !!active?.closest("mat-dialog-container"),
        tag: active?.tagName ?? null,
      };
    });
  await expect.poll(async () => (await focused()).insideDialog).toBe(true);

  // Focusing the first tabbable element (the search input) raises the
  // on-screen keyboard on mobile, so focus must stay off the input.
  expect((await focused()).tag).not.toBe("INPUT");
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

/**
 * Rows in the ranked chart are one bar each, so a click anywhere along a row
 * should select that row's style. Distance was previously measured to each
 * bar's centre, so a click far along a short row resolved to a longer bar in
 * another row.
 */
test("a click selects the row it lands on, even far from a short bar", async ({
  page,
}) => {
  const canvas = page.locator(".style-bar-chart-container canvas");
  const dialog = page.locator("mat-dialog-container");

  async function styleAtRow(fraction: number): Promise<string> {
    await page.goto("/insights");
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(
      box.x + box.width * 0.95,
      box.y + box.height * fraction,
    );
    await expect(dialog).toBeVisible();
    const title = ((await dialog.locator("h2").textContent()) ?? "").trim();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    return title.replace(/ Drinks$/, "");
  }

  const top = await styleAtRow(0.15);
  const bottom = await styleAtRow(0.85);

  // Distinct rows must resolve to distinct styles.
  expect(top).not.toBe(bottom);
  expect(top.length).toBeGreaterThan(0);
  expect(bottom.length).toBeGreaterThan(0);
});

/**
 * The histogram is vertical, so a click resolves to the nearest column. A
 * column with check-ins opens that bin's list and mirrors it into the URL,
 * while an empty column must stay inert rather than open an empty list.
 */
test("clicking a rating column opens that column's list", async ({ page }) => {
  await page.goto("/insights");
  const canvas = page.locator(".histogram-chart-container canvas");
  const dialog = page.locator("mat-dialog-container");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;

  const clickAt = async (fraction: number): Promise<boolean> => {
    await page.mouse.click(
      box.x + box.width * fraction,
      box.y + box.height / 2,
    );
    return dialog
      .waitFor({ state: "visible", timeout: 800 })
      .then(() => true)
      .catch(() => false);
  };

  // The fixture only rates a middle slice of the 0.25–5.00 axis, so the far
  // edges are empty columns: clicking them must not open a dialog.
  expect(await clickAt(0.02)).toBe(false);

  // Scan inwards for a populated column, then assert it opened its own bin.
  let title: string | null = null;
  for (const fraction of [0.7, 0.75, 0.8, 0.65, 0.6, 0.85, 0.55]) {
    if (await clickAt(fraction)) {
      title = ((await dialog.locator("h2").textContent()) ?? "").trim();
      break;
    }
  }

  expect(title).toMatch(/★ Drinks$/);
  await expect(page).toHaveURL(/rating=/);
});
