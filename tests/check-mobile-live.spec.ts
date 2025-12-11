import { test, expect } from '@playwright/test';

test('check live mobile product card with wishlist', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  // Go directly to collections page
  await page.goto(`https://cheyenne.pt/password`);

  // Bypass password
  const padlock = page.locator('button, [role="button"], a').filter({
    has: page.locator('svg.icon-padlock'),
  }).first();

  if (await padlock.isVisible({ timeout: 2000 }).catch(() => false)) {
    await padlock.click();
    const input = page.locator('input[type="password"], input[type="text"]').first();
    await input.fill('123');
    await input.press('Enter');
    await page.waitForLoadState('networkidle');
  }

  // Accept cookies
  const acceptButton = page.locator('button:has-text("Aceitar")').first();
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }

  // Navigate to all products
  await page.goto(`https://cheyenne.pt/collections/all`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: 'test-results/mobile-live-collection.png',
    fullPage: false
  });

  // Find and screenshot first few product cards
  const productCards = page.locator('.card-wrapper, .product-card-wrapper').first();

  if (await productCards.isVisible()) {
    await productCards.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Screenshot first card with detailed view
    await productCards.screenshot({
      path: 'test-results/mobile-live-first-card.png'
    });

    // Get the card information section specifically
    const cardInfo = productCards.locator('.card__information, .card-information').first();
    if (await cardInfo.isVisible()) {
      await cardInfo.screenshot({
        path: 'test-results/mobile-live-card-info.png'
      });
    }
  }

  // Scroll and capture more cards
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'test-results/mobile-live-scrolled.png',
    fullPage: false
  });
});
