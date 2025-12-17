import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid transition animation demo', async ({ page }) => {
  await page.goto(`/password`);
  await bypassPassword(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  console.log('\n🎬 Grid Animation Demo\n');
  console.log('This test demonstrates the grid transition animations.');
  console.log('Watch the browser window to see the zoom effects!\n');

  // Start with Grid 1
  console.log('Starting with Grid 1 (1 column)...');
  await page.locator('#layout-one-col').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/grid-anim-1-onecol.png', fullPage: true });

  // Switch to Grid 2
  console.log('Switching to Grid 2 (2 columns) - Watch the zoom out effect!');
  await page.locator('#layout-two-col').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/grid-anim-2-twocol.png', fullPage: true });

  // Switch to Grid 3
  console.log('Switching to Grid 3 (8 columns) - Watch the zoom out effect!');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/grid-anim-3-threecol.png', fullPage: true });

  // Go back to Grid 2
  console.log('Switching back to Grid 2 - Watch the zoom in effect!');
  await page.locator('#layout-two-col').click();
  await page.waitForTimeout(1000);

  // Go back to Grid 1
  console.log('Switching back to Grid 1 - Watch the zoom in effect!');
  await page.locator('#layout-one-col').click();
  await page.waitForTimeout(1000);

  console.log('\n✅ Animation demo complete!');
  console.log('\nScreenshots saved:');
  console.log('  - grid-anim-1-onecol.png');
  console.log('  - grid-anim-2-twocol.png');
  console.log('  - grid-anim-3-threecol.png');

  // Check if transitioning class is being applied
  const hasTransition = await page.evaluate(() => {
    const grid = document.querySelector('.product-grid');
    return {
      hasTransitionCSS: !!window.getComputedStyle(grid as Element).transition,
      gridClasses: (grid as Element).className,
    };
  });

  console.log('\n🔍 Animation Status:');
  console.log(`Grid has CSS transitions: ${hasTransition.hasTransitionCSS ? '✅' : '❌'}`);
  console.log(`Grid classes: ${hasTransition.gridClasses}`);
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
