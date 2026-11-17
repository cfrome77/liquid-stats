import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Keyboard accessibility for modals and overlays.
 *
 * Angular Material dialogs (command palette, badge dialog, beer style dialog,
 * about dialog) trap focus and close on Escape out of the box. The custom CDK
 * overlays rendered by the filter component and the map component did not, so
 * these tests pin down that Tab cycles inside the overlay and that Escape
 * dismisses it.
 */

/** Returns true when the currently focused element is inside `container`. */
async function activeElementIsInside(
  page: Page,
  container: Locator,
): Promise<boolean> {
  return container.evaluate((node) => node.contains(document.activeElement));
}

/**
 * Waits until the overlay has moved focus into itself. Angular Material dialogs
 * enable their trap only after the enter animation finishes, so tabbing before
 * then would legitimately land on the page behind.
 */
async function waitForFocusInside(
  page: Page,
  container: Locator,
): Promise<void> {
  await expect
    .poll(() => activeElementIsInside(page, container), { timeout: 5000 })
    .toBe(true);
}

/**
 * Tabs `times` and asserts focus never leaves `container`. The first Tab is
 * included because a focus trap must also recover from a stray tab stop.
 */
async function expectFocusStaysInside(
  page: Page,
  container: Locator,
  times: number,
): Promise<void> {
  await waitForFocusInside(page, container);
  for (let i = 0; i < times; i++) {
    await page.keyboard.press("Tab");
    expect(await activeElementIsInside(page, container)).toBe(true);
  }
}

test.describe("focus trapping in modals and overlays", () => {
  test("command palette keeps Tab inside and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    await expectFocusStaysInside(page, dialog, 12);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("badge dialog keeps Tab inside and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/checkins");

    const badgeChip = page.locator("mat-chip.clickable-chip").first();
    await expect(badgeChip).toBeVisible();
    await badgeChip.click();

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    await expectFocusStaysInside(page, dialog, 8);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("beer style dialog keeps Tab inside and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/insights");

    const stylesCard = page
      .locator('.clickable-card[aria-label="Explore unique styles"]')
      .first();
    await expect(stylesCard).toBeVisible();
    await stylesCard.click();

    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toBeVisible();

    await expectFocusStaysInside(page, dialog, 12);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("filter modal keeps Tab inside and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/beer-history");

    const filterButton = page
      .locator("app-filter button.stats-filter-button")
      .first();
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const modal = page.locator(".modal-content");
    await expect(modal).toBeVisible();

    await expectFocusStaysInside(page, modal, 12);

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("map brewery overlay keeps Tab inside and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/map");

    // Leaflet positions markers absolutely and they can sit outside the
    // viewport, so dispatch the click directly instead of using a pointer click.
    const marker = page.locator(".leaflet-marker-icon").first();
    await marker.waitFor({ state: "visible" });
    await marker.dispatchEvent("click");

    const panel = page.locator(".map-info-panel");
    await expect(panel).toBeVisible();

    await expectFocusStaysInside(page, panel, 12);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
