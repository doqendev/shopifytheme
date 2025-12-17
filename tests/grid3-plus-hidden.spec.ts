import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - Plus icon should be hidden', async ({ page }) => {
  await page.goto(`/password`);
  await bypassPassword(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  console.log('\n=== Testing Grid 1 ===');
  await page.locator('#layout-one-col').click();
  await page.waitForTimeout(500);

  let overlayPlus = page.locator('.card-wrapper').first().locator('.plus-icon--overlay');
  let isVisible = await overlayPlus.isVisible();
  console.log(`Grid 1 - Plus icon visible: ${isVisible ? '✅ YES' : '❌ NO'}`);

  console.log('\n=== Testing Grid 2 ===');
  await page.locator('#layout-two-col').click();
  await page.waitForTimeout(500);

  overlayPlus = page.locator('.card-wrapper').first().locator('.plus-icon--overlay');
  isVisible = await overlayPlus.isVisible();
  console.log(`Grid 2 - Plus icon visible: ${isVisible ? '✅ YES' : '❌ NO'}`);

  console.log('\n=== Testing Grid 3 ===');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(500);

  overlayPlus = page.locator('.card-wrapper').first().locator('.plus-icon--overlay');
  isVisible = await overlayPlus.isVisible();
  console.log(`Grid 3 - Plus icon visible: ${isVisible ? '❌ YES (SHOULD BE HIDDEN)' : '✅ NO (CORRECTLY HIDDEN)'}`);

  await page.screenshot({ path: 'test-results/grid3-plus-hidden.png', fullPage: true });

  if (!isVisible) {
    console.log('\n🎉 SUCCESS! Plus icon is correctly hidden in Grid 3');
  } else {
    console.log('\n⚠️  CSS not synced yet - plus icon still visible in Grid 3');
  }

  expect(isVisible).toBe(false);
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
