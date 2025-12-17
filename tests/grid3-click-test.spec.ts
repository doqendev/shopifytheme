import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - Test if click handler is working', async ({ page }) => {
  // Navigate to collection
  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  // Wait for products to load
  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  // Switch to Grid 3
  console.log('\n=== SWITCHING TO GRID 3 ===');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);

  const firstProduct = page.locator('.card-wrapper').first();

  // Inject debugging to monitor clicks and class changes
  await page.evaluate(() => {
    (window as any).clickLog = [];
    (window as any).classLog = [];

    // Monitor all clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      (window as any).clickLog.push({
        tag: target.tagName,
        classes: target.className,
        id: target.id,
        closest: {
          plusIcon: !!target.closest('.plus-icon'),
          plusIconOverlay: !!target.closest('.plus-icon--overlay'),
          productCardPlus: !!target.closest('.product-card-plus'),
        }
      });
    }, true);

    // Monitor class changes on product-card-plus elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          (window as any).classLog.push({
            element: target.className,
            timestamp: Date.now()
          });
        }
      });
    });

    document.querySelectorAll('.product-card-plus').forEach((el) => {
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  });

  // Check initial state
  const productCardPlus = firstProduct.locator('.product-card-plus');
  const hasActiveBefore = await productCardPlus.evaluate((el) => el.classList.contains('active'));
  console.log(`\nBEFORE CLICK: .product-card-plus has 'active' class: ${hasActiveBefore}`);

  // Click the overlay plus icon
  const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
  await expect(overlayPlusIcon).toBeVisible();
  console.log('\nClicking overlay plus icon...');

  await overlayPlusIcon.click();
  await page.waitForTimeout(1000);

  // Check if active class was added
  const hasActiveAfter = await productCardPlus.evaluate((el) => el.classList.contains('active'));
  console.log(`\nAFTER CLICK: .product-card-plus has 'active' class: ${hasActiveAfter}`);

  // Get logs
  const clickLog = await page.evaluate(() => (window as any).clickLog);
  const classLog = await page.evaluate(() => (window as any).classLog);

  console.log('\n=== CLICK EVENTS ===');
  console.log(JSON.stringify(clickLog, null, 2));

  console.log('\n=== CLASS CHANGES ===');
  console.log(JSON.stringify(classLog, null, 2));

  // Check if size drawer opened
  const sizeDrawer = firstProduct.locator('.size-options');
  const drawerClasses = await sizeDrawer.evaluate((el) => el.className);
  console.log(`\n.size-options classes: ${drawerClasses}`);

  // Check for active state on parent
  const productCardPlusClasses = await productCardPlus.evaluate((el) => el.className);
  console.log(`.product-card-plus classes: ${productCardPlusClasses}`);

  if (hasActiveAfter) {
    console.log('\n✅ SUCCESS: Active class was added!');

    // Now check if drawer is visible
    const sizeButtons = sizeDrawer.locator('.size-option');
    const firstSizeButton = sizeButtons.first();
    const isVisible = await firstSizeButton.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✅ Size drawer opened successfully!');
    } else {
      console.log('❌ Active class added but drawer not visible');
      const drawerStyles = await sizeDrawer.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          opacity: styles.opacity,
          visibility: styles.visibility,
        };
      });
      console.log('Drawer styles:', drawerStyles);
    }
  } else {
    console.log('\n❌ FAIL: Active class was NOT added');
    console.log('This means the JavaScript click handler did not execute');
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
