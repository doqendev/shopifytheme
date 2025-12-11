import { test, expect } from '@playwright/test';

const productHandle = 'sweatshirt-basica-com-capuz-copy';

test('audit product page desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
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

  // Navigate to product
  await page.goto(`https://cheyenne.pt/products/${productHandle}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({ path: 'test-results/product-page-desktop-full.png', fullPage: true });

  // Screenshot of accordion area
  const accordion = page.locator('.product-info-accordion').first();
  if (await accordion.isVisible()) {
    await accordion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await accordion.screenshot({ path: 'test-results/product-accordion-desktop.png' });
  }

  // Screenshot of related products
  const relatedProducts = page.locator('.desktop-related-products').first();
  if (await relatedProducts.isVisible()) {
    await relatedProducts.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await relatedProducts.screenshot({ path: 'test-results/related-products-desktop.png' });
  }
});

test('audit product page mobile', async ({ page }) => {
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

  // Navigate to product
  await page.goto(`https://cheyenne.pt/products/${productHandle}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({ path: 'test-results/product-page-mobile-full.png', fullPage: true });

  // Screenshot of accordion area
  const accordion = page.locator('.product-info-accordion').first();
  if (await accordion.isVisible()) {
    await accordion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await accordion.screenshot({ path: 'test-results/product-accordion-mobile.png' });
  }
});
