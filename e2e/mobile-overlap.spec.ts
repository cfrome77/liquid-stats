import { test, expect } from '@playwright/test';

test('no overlap on mobile', async ({ page }) => {
  // Mock the checkins.json request with many long badges
  await page.route('**/checkins.json', async route => {
    const json = {
      "response": {
        "checkins": {
          "items": [
            {
              "checkin_id": 1,
              "created_at": "Feb 18, 2026",
              "checkin_comment": "Overlap test",
              "rating_score": 4,
              "beer": {
                "bid": 101,
                "beer_name": "Test Beer",
                "beer_style": "Test Style",
                "beer_label": "https://label.com",
                "beer_slug": "test-beer"
              },
              "brewery": {
                "brewery_id": 1001,
                "brewery_name": "Test Brewery",
                "brewery_label": "https://brewery.com",
                "contact": {
                  "twitter": "rr",
                  "facebook": "rrfb",
                  "instagram": "rri",
                  "foursquare": "rrfs"
                }
              },
              "badges": {
                "items": [
                  { "badge_name": "Very Very Long Badge Name 1", "badge_image": { "sm": "b1.png" } },
                  { "badge_name": "Very Very Long Badge Name 2", "badge_image": { "sm": "b2.png" } },
                  { "badge_name": "Very Very Long Badge Name 3", "badge_image": { "sm": "b3.png" } }
                ]
              }
            }
          ]
        }
      }
    };
    await route.fulfill({ json });
  });

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/checkins');

  const card = page.locator('app-card').first();
  await expect(card).toBeVisible();

  const badges = card.locator('mat-chip');
  const socialLinks = card.locator('app-social-links');

  await expect(badges.first()).toBeVisible();
  await expect(socialLinks).toBeVisible();

  const badgesCount = await badges.count();
  const socialBox = await socialLinks.boundingBox();

  if (socialBox) {
    for (let i = 0; i < badgesCount; i++) {
      const badgeBox = await badges.nth(i).boundingBox();
      if (badgeBox) {
        // Check for overlap: simple intersection check
        const overlap = !(
          socialBox.x + socialBox.width <= badgeBox.x ||
          badgeBox.x + badgeBox.width <= socialBox.x ||
          socialBox.y + socialBox.height <= badgeBox.y ||
          badgeBox.y + badgeBox.height <= socialBox.y
        );

        if (overlap) {
           console.log(`Overlap detected with badge ${i}!`);
           console.log('Social:', socialBox);
           console.log(`Badge ${i}:`, badgeBox);
        }
        expect(overlap).toBe(false);
      }
    }
  }

  await page.screenshot({ path: 'e2e/screenshots/mobile-checkin-no-overlap.png' });
});

test('inline on mobile if short', async ({ page }) => {
  // Mock checkins with only one short badge
  await page.route('**/checkins.json', async route => {
    const json = {
      "response": {
        "checkins": {
          "items": [
            {
              "checkin_id": 1,
              "created_at": "Feb 18, 2026",
              "rating_score": 4,
              "beer": {
                "bid": 101,
                "beer_name": "Test Beer",
                "beer_style": "Test Style",
                "beer_label": "https://label.com"
              },
              "brewery": {
                "brewery_id": 1001,
                "brewery_name": "Test Brewery",
                "brewery_label": "https://brewery.com",
                "contact": { "facebook": "rrfb" }
              },
              "badges": {
                "items": [
                  { "badge_name": "B1", "badge_image": { "sm": "b1.png" } }
                ]
              }
            }
          ]
        }
      }
    };
    await route.fulfill({ json });
  });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/checkins');

  const card = page.locator('app-card').first();
  const badge = card.locator('mat-chip').first();
  const socialLinks = card.locator('app-social-links');

  const badgeBox = await badge.boundingBox();
  const socialBox = await socialLinks.boundingBox();

  if (badgeBox && socialBox) {
    // Should be on the same line
    expect(Math.abs(badgeBox.y - socialBox.y)).toBeLessThan(20);
    // Social links should be to the right
    expect(socialBox.x).toBeGreaterThan(badgeBox.x);
  }
  await page.screenshot({ path: 'e2e/screenshots/mobile-checkin-short-inline.png' });
});

test('inline on desktop', async ({ page }) => {
  // Mock same data
  await page.route('**/checkins.json', async route => {
    const json = {
      "response": {
        "checkins": {
          "items": [
            {
              "checkin_id": 1,
              "created_at": "Feb 18, 2026",
              "checkin_comment": "Overlap test",
              "rating_score": 4,
              "beer": {
                "bid": 101,
                "beer_name": "Test Beer",
                "beer_style": "Test Style",
                "beer_label": "https://label.com",
                "beer_slug": "test-beer"
              },
              "brewery": {
                "brewery_id": 1001,
                "brewery_name": "Test Brewery",
                "brewery_label": "https://brewery.com",
                "contact": {
                  "twitter": "rr",
                  "facebook": "rrfb"
                }
              },
              "badges": {
                "items": [
                  { "badge_name": "Badge 1", "badge_image": { "sm": "b1.png" } }
                ]
              }
            }
          ]
        }
      }
    };
    await route.fulfill({ json });
  });

  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/checkins');

  const card = page.locator('app-card').first();
  await expect(card).toBeVisible();

  const badge = card.locator('mat-chip').first();
  const socialLinks = card.locator('app-social-links');

  const badgeBox = await badge.boundingBox();
  const socialBox = await socialLinks.boundingBox();

  if (badgeBox && socialBox) {
    // On desktop they should be roughly on the same line if there's space
    expect(Math.abs(badgeBox.y - socialBox.y)).toBeLessThan(20);
    // Social links should be to the right
    expect(socialBox.x).toBeGreaterThan(badgeBox.x);
  }

  await page.screenshot({ path: 'e2e/screenshots/desktop-checkin-inline.png' });
});
