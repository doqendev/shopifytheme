import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://cheyenne.pt';
const STORE_PASSWORD = process.env.STORE_PASSWORD || '123';

test('check if can access collection and find grid', async ({ page }) => {
  console.log('Navigating to collection page...');
  await page.goto(`${BASE_URL}/collections/novidades`);

  console.log('Current URL:', page.url());

  // Take screenshot of initial page
  await page.screenshot({ path: 'test-initial.png', fullPage: true });
  console.log('Screenshot 1 saved');

  // Try to find padlock
  const padlock = page.locator('svg.icon-padlock');
  const hasPadlock = await padlock.isVisible().catch(() => false);
  console.log('Padlock visible:', hasPadlock);

  if (hasPadlock) {
    console.log('Clicking padlock...');
    await padlock.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-after-padlock.png', fullPage: true });
    console.log('Screenshot 2 saved');

    const passwordInput = page.locator('input[type="password"]');
    console.log('Password input visible:', await passwordInput.isVisible().catch(() => false));

    await passwordInput.fill('123');
    await page.keyboard.press('Enter');

    console.log('Waiting for navigation...');
    await page.waitForTimeout(3000);

    console.log('Current URL after password:', page.url());
    await page.screenshot({ path: 'test-after-password.png', fullPage: true });
    console.log('Screenshot 3 saved');
  }

  // Check for product grid
  const grid = page.locator('.product-grid');
  const hasGrid = await grid.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Product grid visible:', hasGrid);

  if (!hasGrid) {
    // Try alternative selectors
    const alternatives = ['#product-grid', '[id*="product"]', '.collection'];
    for (const selector of alternatives) {
      const elem = page.locator(selector);
      const exists = await elem.count();
      console.log(`Selector "${selector}" count:`, exists);
    }
  }

  await page.screenshot({ path: 'test-final.png', fullPage: true });
  console.log('Final screenshot saved');
});
