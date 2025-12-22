import { test, expect } from '@playwright/test';

const PRODUCT_URL = '/products/blusa-folhos-1';

test('snapshot cart drawer layout', async ({ page }) => {
  page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text()));

  await page.goto(PRODUCT_URL);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.waitForLoadState('networkidle');

  // If there's a size drawer trigger (e.g., "Seleciona o tamanho"), open and pick the first enabled size.
  const sizeTrigger = page.locator('button:has-text("Seleciona"), button:has-text("Tamanho"), button:has-text("Size")').first();
  if (await sizeTrigger.isVisible().catch(() => false)) {
    await sizeTrigger.click({ delay: 50 });
  }

  const sizeOption = page.locator('[data-size]:not(.sold-out):not([disabled])').first();
  if (await sizeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sizeOption.click({ delay: 30 });
  }

  // Fallback: select from a select element if present
  const select = page.locator('select[name*="id"], select[data-product-select]');
  if (await select.isVisible().catch(() => false)) {
    const options = await select.locator('option:not([disabled])').all();
    if (options.length) {
      const value = await options[0].getAttribute('value');
      if (value) await select.selectOption(value);
    }
  }

  // add to cart
  const addBtn = page.locator('form[action*="/cart/add"] button[type="submit"]').first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // open cart drawer if not opened automatically
  const drawer = page.locator('cart-drawer');
  if (!(await drawer.isVisible().catch(() => false))) {
    const cartIcon = page.locator('button, a').filter({ hasText: /Cesto|Carrinho|Cart/i }).first();
    if (await cartIcon.isVisible().catch(() => false)) {
      await cartIcon.click();
      await page.waitForTimeout(800);
    }
  }

  await expect(drawer).toBeVisible({ timeout: 8000 });

  await page.screenshot({ path: 'playwright-screenshots/cart-drawer-full.png', fullPage: true });
  await drawer.screenshot({ path: 'playwright-screenshots/cart-drawer.png' });
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
  const acceptButton = page.locator('button:has-text("Aceitar"), button:has-text("Accept")').first();
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(300);
  }
}
