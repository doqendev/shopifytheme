import { test, expect } from '@playwright/test';

test('check mobile product card wishlist heart position', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
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

  // Go to homepage or collection page to see product cards
  await page.goto(`https://cheyenne.pt/collections/all`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of product grid
  await page.screenshot({ path: 'test-results/mobile-product-grid.png', fullPage: false });

  // Find first product card
  const firstCard = page.locator('.card-wrapper, .product-card-wrapper').first();
  if (await firstCard.isVisible()) {
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of first product card
    await firstCard.screenshot({ path: 'test-results/mobile-product-card.png' });

    // Check if wishlist heart is visible in card information area
    const inlineWishlist = firstCard.locator('.wishlist-toggle--mobile-inline');
    const isInlineVisible = await inlineWishlist.isVisible();
    console.log('Inline wishlist heart visible:', isInlineVisible);

    // Check if plus icon is visible
    const plusIcon = firstCard.locator('.plus-icon');
    const isPlusVisible = await plusIcon.isVisible();
    console.log('Plus icon visible:', isPlusVisible);

    // Check if original wishlist (on image) is hidden
    const originalWishlist = firstCard.locator('.wishlist-toggle').not(page.locator('.wishlist-toggle--mobile-inline'));
    const isOriginalVisible = await originalWishlist.isVisible();
    console.log('Original wishlist heart visible:', isOriginalVisible);

    // Get bounding boxes to check positioning
    if (isInlineVisible && isPlusVisible) {
      const wishlistBox = await inlineWishlist.boundingBox();
      const plusBox = await plusIcon.boundingBox();

      if (wishlistBox && plusBox) {
        console.log('Wishlist position:', wishlistBox);
        console.log('Plus icon position:', plusBox);
        console.log('Wishlist is to the left of plus icon:', wishlistBox.x < plusBox.x);
      }
    }
  }

  // Scroll down to see more cards
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/mobile-product-grid-scrolled.png', fullPage: false });
});
