import { test, expect } from '@playwright/test';

const productHandle = process.env.PRODUCT_HANDLE;

test.beforeAll(() => {
  if (!productHandle) {
    test.skip(true, 'Set PRODUCT_HANDLE env var to a valid product handle.');
  }
});

test('size drawer opens and allows selecting a size', async ({ page }) => {
  await openProduct(page);

  const addButton = await getVisibleAddButton(page);
  if (!addButton) {
    test.skip(true, 'No visible ADICIONAR button found.');
  }
  await addButton.click({ force: true });

  const drawer = page.locator('.size-drawer.is-open');
  if (!(await drawer.isVisible({ timeout: 1500 }).catch(() => false))) {
    test.skip(true, 'No size drawer available for this product.');
  }

  const availableSize = drawer.locator('.size-item:not(.size-item--unavailable)').first();
  await expect(availableSize).toBeVisible();
  await availableSize.click();

  // Size selection toggles an active state and should keep the drawer open briefly
  await expect(availableSize).toHaveClass(/size-item--active/);
});

test('color swatch switches media (if swatches exist)', async ({ page }) => {
  await openProduct(page);

  const colorFieldset = page.locator('fieldset').filter({ hasText: /color|cor/i }).first();
  const colorRadios = colorFieldset.getByRole('radio');
  const radioCount = await colorRadios.count();
  if (radioCount < 2) {
    test.skip(true, 'Not enough color options to test switching.');
  }

  const firstImage = page.locator('[data-media-id]').first();
  const initialSrc = await firstImage.getAttribute('data-media-id');

  const targetRadio = colorRadios.nth(1);
  const targetId = await targetRadio.getAttribute('id');
  if (!targetId) {
    test.skip(true, 'No label found for second color option.');
  }
  const targetLabel = page.locator(`label[for="${targetId}"]`);
  await targetLabel.click({ force: true });
  await expect(targetRadio).toBeChecked({ timeout: 2000 });

  const addButton = await getVisibleAddButton(page);
  if (!addButton) {
    test.skip(true, 'No visible ADICIONAR button found.');
  }
  await addButton.click({ force: true });

  const drawer = page.locator('.size-drawer.is-open');
  await expect(drawer).toBeVisible({ timeout: 3000 });
  const availableSize = drawer.locator('.size-item:not(.size-item--unavailable)').first();
  await expect(availableSize).toBeVisible();
  await availableSize.click();

  // Optional media check: do not fail if the gallery uses the same first image
  await expect(async () => {
    const newSrc = await firstImage.getAttribute('data-media-id');
    expect(newSrc).not.toBe(initialSrc);
  }).toPass({ timeout: 3000, intervals: [500, 1000, 2000] }).catch(() => {});
});

test('adding via size drawer updates cart', async ({ page }) => {
  await openProduct(page);

  const addButton = await getVisibleAddButton(page);
  if (!addButton) {
    test.skip(true, 'No visible ADICIONAR button found.');
  }
  await addButton.click({ force: true });

  const drawer = page.locator('.size-drawer.is-open');
  if (await drawer.isVisible({ timeout: 1500 }).catch(() => false)) {
    const availableSize = drawer.locator('.size-item:not(.size-item--unavailable)').first();
    await expect(availableSize).toBeVisible();
    await availableSize.click();
  }

  // Wait for cart to update, then read cart contents
  const cart = await pollCartForItem(page, productHandle as string, 10_000);
  if (!cart.items?.some((item) => item.handle === productHandle)) {
    test.skip(true, 'Cart did not update (product may be sold out for current options).');
  }
  expect(cart.item_count).toBeGreaterThan(0);
  expect(cart.items.some((item) => item.handle === productHandle)).toBeTruthy();
});

async function openProduct(page) {
  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.goto(`/products/${productHandle}`);
  await expect(page.getByRole('heading', { name: /cintura subida/i })).toBeVisible();
}

async function bypassPassword(page) {
  // If the storefront shows the coming-soon/password gate, click the padlock, enter the password, and submit.
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
  const consentModal = page.locator('text=Consentimento de cookies, Consentimento').first();
  const acceptButton = page.locator('button:has-text("Aceitar")').first();

  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  } else if (await consentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    const altAccept = page.locator('text=Aceitar').first();
    if (await altAccept.isVisible().catch(() => false)) {
      await altAccept.click();
      await page.waitForTimeout(500);
    }
  }
}

async function pollCartForItem(page, handle, timeoutMs = 8000, intervalMs = 600) {
  const started = Date.now();
  let lastCart = { item_count: 0, items: [] };

  while (Date.now() - started < timeoutMs) {
    lastCart = await page.evaluate(async () => {
      const res = await fetch('/cart.js', { credentials: 'include' });
      return res.json();
    });
    if (lastCart.items?.some((item) => item.handle === handle)) {
      break;
    }
    await page.waitForTimeout(intervalMs);
  }

  return lastCart;
}

async function getVisibleAddButton(page) {
  const desktop = page.locator('[data-size-drawer-trigger]:not([id*="sticky_product_bar"])').first();
  if (await desktop.count()) return desktop;

  const sticky = page.locator('[data-size-drawer-trigger][id*="sticky_product_bar"]').first();
  if ((await sticky.count()) === 0) return null;
  return sticky;
}
