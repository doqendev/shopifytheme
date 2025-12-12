import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - quick add drawer opens successfully', async ({ page }) => {
  // Navigate to collection
  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  // Wait for products to load
  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  // Switch to Grid 3
  console.log('Switching to Grid 3...');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);

  // Verify grid is active
  await expect(page.locator('.product-grid.three-col')).toBeVisible();
  console.log('✅ Grid 3 is active');

  // Find first product
  const firstProduct = page.locator('.card-wrapper').first();

  // Check if product-card-plus is visible
  const productCardPlus = firstProduct.locator('.product-card-plus');
  const isCardPlusVisible = await productCardPlus.isVisible();
  console.log(`product-card-plus visible: ${isCardPlusVisible}`);

  // Find and click the overlay plus icon
  const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
  await expect(overlayPlusIcon).toBeVisible({ timeout: 2000 });
  console.log('✅ Overlay plus icon is visible');

  // Take screenshot before click
  await page.screenshot({ path: 'test-results/grid3-before-click.png' });

  // Click the overlay plus icon
  console.log('Clicking overlay plus icon...');
  await overlayPlusIcon.click();
  await page.waitForTimeout(1000);

  // Take screenshot after click
  await page.screenshot({ path: 'test-results/grid3-after-click.png' });

  // Check if size drawer is visible
  const sizeDrawer = firstProduct.locator('.size-options');

  // Get computed styles
  const drawerStyles = await sizeDrawer.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      opacity: styles.opacity,
      visibility: styles.visibility,
      position: styles.position,
      zIndex: styles.zIndex,
    };
  });

  console.log('Size drawer computed styles:', JSON.stringify(drawerStyles, null, 2));

  // Check for size options inside drawer
  const sizeButtons = sizeDrawer.locator('.size-option');
  const sizeButtonCount = await sizeButtons.count();
  console.log(`Found ${sizeButtonCount} size buttons in drawer`);

  if (sizeButtonCount > 0) {
    const firstSizeButton = sizeButtons.first();
    const isSizeButtonVisible = await firstSizeButton.isVisible();
    console.log(`First size button visible: ${isSizeButtonVisible}`);

    if (isSizeButtonVisible) {
      console.log('✅ SUCCESS: Size drawer opened in Grid 3!');
      await expect(firstSizeButton).toBeVisible();
    } else {
      console.log('❌ FAIL: Size buttons not visible');
      throw new Error('Size buttons exist but are not visible');
    }
  } else {
    console.log('❌ FAIL: No size buttons found in drawer');
    throw new Error('No size buttons found in drawer');
  }
});

async function bypassPassword(page) {
  const padlock = page.locator('button, [role="button"], a').filter({
    has: page.locator('svg.icon-padlock'),
  }).first();

  if (await padlock.isVisible({ timeout: 2000 }).catch(() => false)) {
    await padlock.click();
    const input = page.locator('input[type="password"], input[type="text"]').first();
    await input.fill(process.env.STORE_PASSWORD || '123');
    await input.press('Enter');
    await page.waitForLoadState('networkidle');
  }
}

async function acceptCookies(page) {
  const acceptButton = page.locator('button:has-text("Aceitar")').first();

  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}
