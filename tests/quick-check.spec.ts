import { test } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Quick check - is Grid 3 drawer working?', async ({ page }) => {
  await page.goto(`/password`);
  await bypassPassword(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  await page.locator('.product-grid .card-wrapper').first().waitFor({ timeout: 5000 });

  // Switch to Grid 3
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);

  // Click first plus icon
  const firstProduct = page.locator('.card-wrapper').first();
  await firstProduct.locator('.plus-icon--overlay').click();
  await page.waitForTimeout(1500);

  // Check result
  const result = await firstProduct.evaluate((productEl) => {
    const sizeOptions = productEl.querySelector('.size-options');
    if (!sizeOptions) return { error: 'Size options not found' };

    const rect = sizeOptions.getBoundingClientRect();
    const styles = window.getComputedStyle(sizeOptions);
    const visibleButtons = Array.from(productEl.querySelectorAll('.size-option')).filter(btn => {
      const r = btn.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }).length;

    return {
      width: rect.width,
      height: rect.height,
      display: styles.display,
      minWidth: styles.minWidth,
      visibleButtons,
      totalButtons: productEl.querySelectorAll('.size-option').length,
    };
  });

  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  if (result.width > 0 && result.visibleButtons > 0) {
    console.log('\n✅ SUCCESS! Grid 3 drawer is working!');
    console.log(`   Drawer width: ${result.width}px`);
    console.log(`   Visible buttons: ${result.visibleButtons}/${result.totalButtons}`);
  } else {
    console.log('\n❌ NOT YET WORKING');
    if (result.width === 0) {
      console.log(`   Issue: Drawer width is still 0 (min-width set to ${result.minWidth})`);
      console.log('   → CSS changes not synced yet. Wait and try again.');
    }
    if (result.visibleButtons === 0) {
      console.log('   Issue: No visible size buttons');
    }
  }

  await page.screenshot({ path: 'test-results/quick-check.png', fullPage: true });
  console.log('\n📸 Screenshot: test-results/quick-check.png');
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
