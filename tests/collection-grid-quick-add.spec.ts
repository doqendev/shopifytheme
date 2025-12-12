import { test, expect } from '@playwright/test';

// Set collection handle - you can override with env var
const collectionHandle = process.env.COLLECTION_HANDLE || 'all';

test.describe('Collection Grid Quick Add', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/password`);
    await bypassPassword(page);
    await acceptCookies(page);
    await page.goto(`/collections/${collectionHandle}`);
    await page.waitForLoadState('networkidle');

    // Wait for products to load
    await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });
  });

  test('Grid 1 (one-col) - quick add opens size drawer', async ({ page }) => {
    // Switch to Grid 1
    await page.locator('#layout-one-col').click();
    await page.waitForTimeout(500);

    // Verify grid is active
    await expect(page.locator('.product-grid.one-col')).toBeVisible();

    // Find first product with plus icon
    const firstProduct = page.locator('.card-wrapper').first();
    const plusIcon = firstProduct.locator('.plus-icon').first();

    console.log('Grid 1: Clicking plus icon...');
    await plusIcon.click({ force: true });

    // Check if size drawer opens
    const sizeDrawer = firstProduct.locator('.size-options[tabindex="-1"]');
    await expect(sizeDrawer).toBeVisible({ timeout: 3000 });

    console.log('Grid 1: ✅ Size drawer opened successfully');
  });

  test('Grid 2 (two-col) - quick add opens size drawer', async ({ page }) => {
    // Grid 2 is default, but let's click it to be sure
    await page.locator('#layout-two-col').click();
    await page.waitForTimeout(500);

    // Verify grid is active
    await expect(page.locator('.product-grid.two-col')).toBeVisible();

    // Find first product with plus icon
    const firstProduct = page.locator('.card-wrapper').first();
    const plusIcon = firstProduct.locator('.plus-icon').first();

    console.log('Grid 2: Clicking plus icon...');
    await plusIcon.click({ force: true });

    // Check if size drawer opens
    const sizeDrawer = firstProduct.locator('.size-options[tabindex="-1"]');
    await expect(sizeDrawer).toBeVisible({ timeout: 3000 });

    console.log('Grid 2: ✅ Size drawer opened successfully');
  });

  test('Grid 3 (three-col) - quick add opens size drawer', async ({ page }) => {
    // Switch to Grid 3 (images only)
    await page.locator('#layout-three-col').click();
    await page.waitForTimeout(500);

    // Verify grid is active
    await expect(page.locator('.product-grid.three-col')).toBeVisible();

    // Find first product
    const firstProduct = page.locator('.card-wrapper').first();

    // Debug: Check what plus icons are visible
    const allPlusIcons = await firstProduct.locator('.plus-icon').all();
    console.log(`Grid 3: Found ${allPlusIcons.length} plus icons`);

    // Check overlay plus icon
    const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
    const isOverlayVisible = await overlayPlusIcon.isVisible().catch(() => false);
    console.log(`Grid 3: Overlay plus icon visible: ${isOverlayVisible}`);

    // Check inline plus icon
    const inlinePlusIcon = firstProduct.locator('.product-card-plus .plus-icon');
    const isInlineVisible = await inlinePlusIcon.isVisible().catch(() => false);
    console.log(`Grid 3: Inline plus icon visible: ${isInlineVisible}`);

    // Check if product-card-plus is hidden by CSS
    const productCardPlus = firstProduct.locator('.product-card-plus');
    const displayStyle = await productCardPlus.evaluate((el) => window.getComputedStyle(el).display);
    console.log(`Grid 3: .product-card-plus display style: ${displayStyle}`);

    // Try clicking the overlay icon first
    if (isOverlayVisible) {
      console.log('Grid 3: Clicking overlay plus icon...');
      await overlayPlusIcon.click({ force: true });
    } else if (allPlusIcons.length > 0) {
      console.log('Grid 3: Clicking first available plus icon...');
      await allPlusIcons[0].click({ force: true });
    } else {
      console.log('Grid 3: ❌ No plus icons found!');
      test.fail(true, 'No plus icons found in Grid 3');
    }

    await page.waitForTimeout(500);

    // Check if size drawer opens
    const sizeDrawer = firstProduct.locator('.size-options[tabindex="-1"]');
    const isDrawerVisible = await sizeDrawer.isVisible({ timeout: 3000 }).catch(() => false);

    if (isDrawerVisible) {
      console.log('Grid 3: ✅ Size drawer opened successfully');
      await expect(sizeDrawer).toBeVisible();
    } else {
      console.log('Grid 3: ❌ Size drawer did not open');

      // Additional debugging
      const sizeDrawerExists = await sizeDrawer.count();
      console.log(`Grid 3: Size drawer exists in DOM: ${sizeDrawerExists > 0}`);

      if (sizeDrawerExists > 0) {
        const drawerDisplay = await sizeDrawer.evaluate((el) => window.getComputedStyle(el).display);
        const drawerOpacity = await sizeDrawer.evaluate((el) => window.getComputedStyle(el).opacity);
        const drawerVisibility = await sizeDrawer.evaluate((el) => window.getComputedStyle(el).visibility);
        console.log(`Grid 3: Size drawer styles - display: ${drawerDisplay}, opacity: ${drawerOpacity}, visibility: ${drawerVisibility}`);
      }

      test.fail(true, 'Size drawer did not open in Grid 3');
    }
  });

  test('Grid 3 (three-col) - debug click event handlers', async ({ page }) => {
    // Switch to Grid 3
    await page.locator('#layout-three-col').click();
    await page.waitForTimeout(500);

    const firstProduct = page.locator('.card-wrapper').first();

    // Inject debugging script to monitor click events
    await page.evaluate(() => {
      (window as any).clickDebug = [];

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        (window as any).clickDebug.push({
          tag: target.tagName,
          classes: target.className,
          id: target.id,
          timestamp: Date.now()
        });
      }, true);
    });

    // Try clicking various elements
    const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
    if (await overlayPlusIcon.isVisible().catch(() => false)) {
      console.log('Debug: Clicking overlay plus icon...');
      await overlayPlusIcon.click({ force: true });
      await page.waitForTimeout(500);
    }

    const inlinePlusIcon = firstProduct.locator('.product-card-plus .plus-icon');
    if (await inlinePlusIcon.count() > 0) {
      console.log('Debug: Clicking inline plus icon...');
      await inlinePlusIcon.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Get click debug info
    const clickInfo = await page.evaluate(() => (window as any).clickDebug);
    console.log('Click events captured:', JSON.stringify(clickInfo, null, 2));

    // Check if drawer opened
    const sizeDrawer = firstProduct.locator('.size-options[tabindex="-1"]');
    const isDrawerVisible = await sizeDrawer.isVisible().catch(() => false);
    console.log(`Debug: Drawer visible after clicks: ${isDrawerVisible}`);
  });

  test('Grid 3 (three-col) - test with screenshot and trace', async ({ page }) => {
    // Switch to Grid 3
    await page.locator('#layout-three-col').click();
    await page.waitForTimeout(500);

    // Take screenshot before click
    await page.screenshot({ path: 'playwright-screenshots/grid3-before-click.png', fullPage: true });

    const firstProduct = page.locator('.card-wrapper').first();
    await firstProduct.screenshot({ path: 'playwright-screenshots/grid3-product-before-click.png' });

    // Highlight the element we're about to click
    const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
    await overlayPlusIcon.evaluate((el) => {
      el.style.border = '3px solid red';
      el.style.backgroundColor = 'yellow';
    }).catch(() => {});

    await page.screenshot({ path: 'playwright-screenshots/grid3-highlighted-plus.png', fullPage: true });

    // Click and wait
    if (await overlayPlusIcon.isVisible().catch(() => false)) {
      await overlayPlusIcon.click({ force: true });
    } else {
      const anyPlusIcon = firstProduct.locator('.plus-icon').first();
      await anyPlusIcon.click({ force: true });
    }

    await page.waitForTimeout(1000);

    // Take screenshot after click
    await page.screenshot({ path: 'playwright-screenshots/grid3-after-click.png', fullPage: true });
    await firstProduct.screenshot({ path: 'playwright-screenshots/grid3-product-after-click.png' });

    // Check drawer state
    const sizeDrawer = firstProduct.locator('.size-options[tabindex="-1"]');
    const isDrawerVisible = await sizeDrawer.isVisible().catch(() => false);

    console.log(`Screenshot test: Drawer opened: ${isDrawerVisible}`);
    console.log('Screenshots saved to playwright-screenshots/ directory');
  });
});

// Helper functions
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
