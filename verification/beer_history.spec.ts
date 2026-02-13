import { test, expect } from '@playwright/test';

test('Beer History Verification', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:4200/beer-history');
  await page.waitForTimeout(3000);

  // 1. Beer History page
  await page.screenshot({ path: 'verification/beer-history-final.png' });

  // 2. Open Brewery Filter
  await page.click('button:has-text("Brewery")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/filter-brewery-final.png' });
  await page.click('.back-button');

  // 3. Open Date Filter
  await page.click('button:has-text("Date Range")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/filter-date-final.png' });
});
