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

/**
 * Reads a chart's plot area and category band centres from the live Chart.js
 * instance, in canvas coordinates. The charts are canvases, so a hard-coded
 * fraction of the box can land on empty space; the geometry keeps clicks
 * deterministic.
 */
async function readChartGeometry(
  page: Page,
  selector: string,
  orientation: "horizontal" | "vertical",
): Promise<{
  chartArea: { left: number; right: number; top: number; bottom: number };
  labels: string[];
  bandCenters: number[];
}> {
  return page.evaluate(
    ({ selector, orientation }) => {
      const debug = (window as unknown as { ng?: Record<string, unknown> }).ng;
      const canvas = document.querySelector(
        `${selector} canvas`,
      ) as HTMLCanvasElement;
      const dirs = (debug?.["getDirectives"] as (el: Element) => unknown[])(
        canvas,
      );
      const chart = (dirs[0] as Record<string, unknown>)["chart"] as {
        chartArea: { left: number; right: number; top: number; bottom: number };
        scales: Record<string, { getPixelForValue: (v: number) => number }>;
        data: { labels?: string[] };
      };
      const labels = chart.data.labels ?? [];
      const categoryScale = orientation === "horizontal" ? "y" : "x";
      return {
        chartArea: chart.chartArea,
        labels,
        bandCenters: labels.map((_, i) =>
          chart.scales[categoryScale]!.getPixelForValue(i),
        ),
      };
    },
    { selector, orientation },
  );
}

/** Clicks a canvas position given in canvas coordinates. */
async function clickCanvasAt(
  page: Page,
  selector: string,
  x: number,
  y: number,
): Promise<void> {
  const canvas = page.locator(`${selector} canvas`);
  const box = (await canvas.boundingBox())!;
  const scaleX = box.width / (await canvas.evaluate((c) => c.clientWidth));
  const scaleY = box.height / (await canvas.evaluate((c) => c.clientHeight));
  await page.mouse.click(box.x + x * scaleX, box.y + y * scaleY);
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

/**
 * Chart.js only fires onClick inside the plot area, so the style names, which
 * are drawn to its left, are dead without the label-tap plugin. A name is the
 * largest and easiest target, so it is the common way to pick a style.
 */
test("clicking a style name selects that style", async ({ page }) => {
  await page.goto("/insights");
  const canvas = page.locator(".style-bar-chart-container canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();

  const geo = await readChartGeometry(
    page,
    ".style-bar-chart-container",
    "horizontal",
  );
  const row = 1;
  // Style names sit left of the plot area.
  await clickCanvasAt(
    page,
    ".style-bar-chart-container",
    geo.chartArea.left / 2,
    geo.bandCenters[row]!,
  );

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText(`${geo.labels[row]} Drinks`);
  await expect(page).toHaveURL(
    new RegExp(`style=${encodeURIComponent(geo.labels[row]!)}`),
  );
});

/** The rating ticks below the histogram are clickable in the same way. */
test("clicking a rating tick selects that rating bin", async ({ page }) => {
  await page.goto("/insights");
  const canvas = page.locator(".histogram-chart-container canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();

  const geo = await readChartGeometry(
    page,
    ".histogram-chart-container",
    "vertical",
  );
  const counts = await page.evaluate(() => {
    const debug = (window as unknown as { ng?: Record<string, unknown> }).ng;
    const canvas = document.querySelector(
      ".histogram-chart-container canvas",
    ) as HTMLCanvasElement;
    const dirs = (debug?.["getDirectives"] as (el: Element) => unknown[])(
      canvas,
    );
    const chart = (dirs[0] as Record<string, unknown>)["chart"] as {
      data: { datasets: { data: number[] }[] };
    };
    return chart.data.datasets[0]!.data;
  });
  const filled = counts.findIndex((c) => c > 0);
  expect(filled).toBeGreaterThanOrEqual(0);

  // Rating ticks sit below the plot area.
  await clickCanvasAt(
    page,
    ".histogram-chart-container",
    geo.bandCenters[filled]!,
    geo.chartArea.bottom + 12,
  );

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toContainText(geo.labels[filled]!);
  await expect(page).toHaveURL(/rating=/);
});

/**
 * A touch tap must behave like a click. Chart.js maps a touch to a synthetic
 * click, so the label strip stays tappable on a phone-sized viewport.
 */
test.describe("touch viewport", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("a tap on a style name selects that style", async ({ page }) => {
    await page.goto("/insights");
    const canvas = page.locator(".style-bar-chart-container canvas");
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();

    const geo = await readChartGeometry(
      page,
      ".style-bar-chart-container",
      "horizontal",
    );
    const row = 0;
    const box = (await canvas.boundingBox())!;
    const scaleX = box.width / (await canvas.evaluate((c) => c.clientWidth));
    const scaleY = box.height / (await canvas.evaluate((c) => c.clientHeight));
    await page.touchscreen.tap(
      box.x + (geo.chartArea.left / 2) * scaleX,
      box.y + geo.bandCenters[row]! * scaleY,
    );

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("h2")).toHaveText(`${geo.labels[row]} Drinks`);
    await expect(page).toHaveURL(/style=/);
  });
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

/**
 * The prebuilt Material theme paints the dialog surface a fixed dark grey and
 * its text fixed white. In light mode that left dark text on a grey/black
 * surface. The surface and its text must follow the active app theme instead.
 */
test.describe("dialog theme contrast", () => {
  /**
   * Reads the dialog surface and body-text colours and returns the WCAG
   * relative-luminance contrast ratio between them. Runs in the page.
   */
  async function readDialogContrast(page: Page) {
    return page.evaluate(() => {
      const channel = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      const luminance = (rgb: number[]) =>
        0.2126 * channel(rgb[0]!) +
        0.7152 * channel(rgb[1]!) +
        0.0722 * channel(rgb[2]!);
      const toRgb = (value: string) =>
        value.match(/\d+/g)!.slice(0, 3).map(Number);

      const surface = document.querySelector(
        ".mat-mdc-dialog-surface",
      ) as HTMLElement;
      // The brewery line is plain theme text (the drink name is the brand
      // accent, which has its own colour).
      const body = document.querySelector(
        ".beer-item-link strong:last-of-type",
      ) as HTMLElement;

      const surfaceRgb = toRgb(getComputedStyle(surface).backgroundColor);
      const textRgb = toRgb(getComputedStyle(body).color);
      const a = luminance(textRgb);
      const b = luminance(surfaceRgb);
      return {
        surfaceRgb,
        textRgb,
        contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
  }

  test("popup surface and text follow the light theme", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/insights?style=IPA");
    await expect(page.locator("body")).toHaveClass(/light-theme/);

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    const { surfaceRgb, contrast } = await readDialogContrast(page);

    // A light surface, not the theme's fixed #424242 grey.
    expect(surfaceRgb[0]).toBeGreaterThan(200);
    // Body text is dark enough to read on it (WCAG AA).
    expect(contrast).toBeGreaterThan(4.5);

    await context.close();
  });

  test("popup surface and text follow the dark theme", async ({ page }) => {
    await page.goto("/insights?style=IPA");
    await expect(page.locator("body")).toHaveClass(/dark-theme/);

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    const { surfaceRgb, contrast } = await readDialogContrast(page);

    // A dark surface, matching the dark card colour (#171f2e).
    expect(surfaceRgb[0]).toBeLessThan(60);
    expect(contrast).toBeGreaterThan(4.5);
  });
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

  // The click echoes the selection into the URL, and that echo is what used to
  // reopen the dialog a second time. Wait for the URL to reflect it (the echo
  // has fired) and then assert the dialog did not stack.
  await expect(page).toHaveURL(/style=/);
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

/**
 * Closing a dialog leaves its query param in the URL. Clicking the other chart
 * must replace that param, not stack a second dialog: the echo of the merged
 * URL was read as a deep link for the stale param and reopened the first
 * chart's list on top of the second one.
 */
test("clicking a rating column after a style does not reopen the style list", async ({
  page,
}) => {
  await page.goto("/insights");
  const dialog = page.locator("mat-dialog-container");

  // Pick a style, then close its list. `?style=` stays behind in the URL.
  await clickFirstStyleBar(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/style=/);

  // Now pick a rating bin from the histogram.
  const canvas = page.locator(".histogram-chart-container canvas");
  await canvas.scrollIntoViewIfNeeded();
  const geo = await readChartGeometry(
    page,
    ".histogram-chart-container",
    "vertical",
  );
  const counts = await page.evaluate(() => {
    const debug = (window as unknown as { ng?: Record<string, unknown> }).ng;
    const canvas = document.querySelector(
      ".histogram-chart-container canvas",
    ) as HTMLCanvasElement;
    const dirs = (debug?.["getDirectives"] as (el: Element) => unknown[])(
      canvas,
    );
    const chart = (dirs[0] as Record<string, unknown>)["chart"] as {
      data: { datasets: { data: number[] }[] };
    };
    return chart.data.datasets[0]!.data;
  });
  const filled = counts.findIndex((c) => c > 0);
  expect(filled).toBeGreaterThanOrEqual(0);

  await clickCanvasAt(
    page,
    ".histogram-chart-container",
    geo.bandCenters[filled]!,
    (geo.chartArea.top + geo.chartArea.bottom) / 2,
  );

  // Only the rating list opens, and only once.
  await expect(dialog).toHaveCount(1);
  await expect(dialog.locator("h2")).toContainText(geo.labels[filled]!);
  // The merged URL echo (`?rating=`) is what used to reopen the dialog; wait
  // for it to settle rather than for an arbitrary interval.
  await expect(page).toHaveURL(/rating=/);
  await expect(dialog).toHaveCount(1);

  // The stale style param is gone, so the rating param stands alone.
  await expect(page).not.toHaveURL(/style=/);
});

/**
 * A filtered list can hold hundreds of check-ins, so the dialog renders one
 * page at a time and reveals the rest on demand. This keeps a long list quick
 * to open and scroll while the search box stays available.
 */
test.describe("long drink lists", () => {
  /** Builds `count` check-ins that all classify as IPA. */
  function manyIpas(count: number) {
    return {
      beers: Array.from({ length: count }, (_, i) => ({
        first_created_at: "Mon, 06 Apr 2026 21:00:00 +0000",
        recent_created_at: "Mon, 06 Apr 2026 21:00:00 +0000",
        rating_score: 4,
        beer: {
          beer_abv: 6.5,
          bid: 1000 + i,
          beer_label:
            "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
          beer_name: `Hop Test ${i}`,
          beer_style: "IPA",
        },
        brewery: {
          brewery_name: `Brewery ${i}`,
          country_name: "USA",
        },
      })),
    };
  }

  test("renders one page and reveals the rest on Load more", async ({
    page,
  }) => {
    await page.route("**/beers_all.json", (route) =>
      route.fulfill({ json: manyIpas(60) }),
    );
    await page.goto("/insights?style=IPA");

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    // Only the first page is rendered, and the footer reports the total.
    await expect(dialog.locator("li")).toHaveCount(25);
    await expect(dialog.locator(".dialog-list-count")).toContainText(
      "Showing 25 of 60",
    );

    await dialog.getByRole("button", { name: "Load more" }).click();

    await expect(dialog.locator("li")).toHaveCount(50);
    await expect(dialog.locator(".dialog-list-count")).toContainText(
      "Showing 50 of 60",
    );

    await dialog.getByRole("button", { name: "Load more" }).click();

    await expect(dialog.locator("li")).toHaveCount(60);
    // Everything is shown, so the button is gone.
    await expect(dialog.getByRole("button", { name: "Load more" })).toHaveCount(
      0,
    );
  });

  test("a short list shows no Load more button", async ({ page }) => {
    await page.route("**/beers_all.json", (route) =>
      route.fulfill({ json: manyIpas(8) }),
    );
    await page.goto("/insights?style=IPA");

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    await expect(dialog.locator("li")).toHaveCount(8);
    await expect(dialog.getByRole("button", { name: "Load more" })).toHaveCount(
      0,
    );
    await expect(dialog.locator(".dialog-list-count")).toContainText(
      "Showing 8 of 8",
    );
  });

  test("searching resets the list to its first page", async ({ page }) => {
    await page.route("**/beers_all.json", (route) =>
      route.fulfill({ json: manyIpas(60) }),
    );
    await page.goto("/insights?style=IPA");

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Load more" }).click();
    await expect(dialog.locator("li")).toHaveCount(50);

    // "Brewery 1" matches Brewery 1 and Brewery 10-19, so 11 drinks. A search
    // narrows the list and starts from the top of its own results.
    await dialog.locator("input").fill("Brewery 1");

    await expect(dialog.locator("li")).toHaveCount(11);
    await expect(dialog.locator(".dialog-list-count")).toContainText(
      "Showing 11 of 11",
    );
  });
});
