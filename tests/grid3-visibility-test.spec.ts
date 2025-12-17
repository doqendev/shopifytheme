import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - Check drawer size and position', async ({ page }) => {
  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  // Switch to Grid 3
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);

  const firstProduct = page.locator('.card-wrapper').first();

  // Click overlay plus
  const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
  await overlayPlusIcon.click();
  await page.waitForTimeout(1000);

  // Get detailed info about drawer
  const drawerInfo = await firstProduct.evaluate((productEl) => {
    const sizeDrawer = productEl.querySelector('.size-options');
    const sizeButtons = productEl.querySelectorAll('.size-option');

    if (!sizeDrawer) return { error: 'Drawer not found' };

    const rect = sizeDrawer.getBoundingClientRect();
    const styles = window.getComputedStyle(sizeDrawer);

    const buttonInfo = Array.from(sizeButtons).slice(0, 3).map((btn) => {
      const btnRect = btn.getBoundingClientRect();
      const btnStyles = window.getComputedStyle(btn);
      return {
        classes: btn.className,
        rect: {
          width: btnRect.width,
          height: btnRect.height,
          top: btnRect.top,
          left: btnRect.left,
        },
        styles: {
          display: btnStyles.display,
          visibility: btnStyles.visibility,
          opacity: btnStyles.opacity,
        },
      };
    });

    return {
      rect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
      },
      styles: {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        zIndex: styles.zIndex,
        overflow: styles.overflow,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      isInViewport: rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0,
      hasSize: rect.width > 0 && rect.height > 0,
      buttonCount: sizeButtons.length,
      buttons: buttonInfo,
    };
  });

  console.log('\n=== DRAWER INFO ===');
  console.log(JSON.stringify(drawerInfo, null, 2));

  // Take a screenshot
  await page.screenshot({ path: 'test-results/grid3-drawer-opened.png', fullPage: true });
  console.log('\n📸 Screenshot saved to test-results/grid3-drawer-opened.png');

  // Try to manually check if buttons have content
  const sizeDrawer = firstProduct.locator('.size-options');
  const sizeButtons = sizeDrawer.locator('.size-option');
  const buttonCount = await sizeButtons.count();
  console.log(`\nFound ${buttonCount} size buttons`);

  if (buttonCount > 0) {
    // Try different ways to detect visibility
    const firstButton = sizeButtons.first();

    const pwVisible = await firstButton.isVisible().catch(() => false);
    console.log(`Playwright isVisible(): ${pwVisible}`);

    const boundingBox = await firstButton.boundingBox().catch(() => null);
    console.log(`Bounding box:`, boundingBox);

    // Try clicking a size button
    try {
      console.log('\nTrying to click first size button...');
      await firstButton.click({ timeout: 2000, force: true });
      console.log('✅ Click succeeded!');

      // Check if cart was updated
      await page.waitForTimeout(1000);
      console.log('Checking cart...');
    } catch (e) {
      console.log(`❌ Click failed: ${e}`);
    }
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
