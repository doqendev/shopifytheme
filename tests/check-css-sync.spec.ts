import { test } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Check if CSS changes are synced', async ({ page }) => {
  await page.goto(`/password`);
  await bypassPassword(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  // Check inline styles for our CSS marker
  const hasMinWidthRule = await page.evaluate(() => {
    // Check all style tags
    const styleTags = Array.from(document.querySelectorAll('style'));
    for (const style of styleTags) {
      const text = style.textContent || '';
      if (text.includes('.product-grid.three-col .product-card-plus .size-options.size-options--desktop')) {
        return {
          found: true,
          hasMinWidth: text.includes('min-width: 200px'),
          snippet: text.substring(
            Math.max(0, text.indexOf('.product-grid.three-col .product-card-plus .size-options.size-options--desktop') - 50),
            text.indexOf('.product-grid.three-col .product-card-plus .size-options.size-options--desktop') + 300
          )
        };
      }
    }
    return { found: false };
  });

  console.log('\n=== CSS SYNC CHECK ===');
  console.log('Looking for: .product-grid.three-col .product-card-plus .size-options.size-options--desktop');
  console.log(JSON.stringify(hasMinWidthRule, null, 2));

  if (hasMinWidthRule.found && hasMinWidthRule.hasMinWidth) {
    console.log('\n✅ CSS changes ARE synced!');
  } else if (hasMinWidthRule.found) {
    console.log('\n⚠️ Rule found but min-width not present - old version still loaded');
  } else {
    console.log('\n❌ CSS changes NOT synced yet - rule not found');
  }

  // Also check git commit hash if available
  const metaTags = await page.evaluate(() => {
    const tags: any[] = [];
    document.querySelectorAll('meta').forEach((meta) => {
      if (meta.getAttribute('name')?.includes('theme') || meta.getAttribute('name')?.includes('version')) {
        tags.push({
          name: meta.getAttribute('name'),
          content: meta.getAttribute('content'),
        });
      }
    });
    return tags;
  });

  if (metaTags.length > 0) {
    console.log('\n=== VERSION INFO ===');
    console.log(JSON.stringify(metaTags, null, 2));
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
