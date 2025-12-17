import { test, expect } from '@playwright/test';

test.describe('Size Guide Accordion', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page first to handle password
    const baseUrl = process.env.BASE_URL || 'https://cheyenne.pt';
    const password = process.env.STORE_PASSWORD || '123';

    await page.goto(baseUrl);

    // Handle password page if present
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Password page detected, filling password...');
      await passwordInput.fill(password);

      // Click the padlock button
      const submitButton = page.locator('button:has(.icon-padlock), button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      console.log('Password submitted, waiting for page load...');
    }

    // Now navigate to the specific product page
    const productUrl = 'https://cheyenne.pt/products/sweatshirt-cropped-as-riscas-copy';
    await page.goto(productUrl);
    await page.waitForLoadState('networkidle');
  });

  test('should display size guide accordion on product page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of full page
    await page.screenshot({ path: 'tests/screenshots/size-guide-accordion-full-page.png', fullPage: true });

    // Look for the size guide accordion
    const sizeGuideAccordion = page.locator('.accordion--size-guide');
    const accordionButton = page.locator('.accordion__trigger[data-sg-open]');
    const accordionWithText = page.locator('text=Guia de tamanhos').first();

    console.log('Checking for size guide accordion...');

    // Check if any of these selectors exist
    const accordionExists = await sizeGuideAccordion.count();
    const buttonExists = await accordionButton.count();
    const textExists = await accordionWithText.count();

    console.log('Size guide accordion count:', accordionExists);
    console.log('Accordion button count:', buttonExists);
    console.log('Guia de tamanhos text count:', textExists);

    // Get all accordions on the page
    const allAccordions = await page.locator('.accordion').all();
    console.log('Total accordions on page:', allAccordions.length);

    for (let i = 0; i < allAccordions.length; i++) {
      const accordion = allAccordions[i];
      const html = await accordion.innerHTML();
      const text = await accordion.textContent();
      console.log(`\nAccordion ${i + 1}:`);
      console.log('Text:', text?.trim().substring(0, 100));
      console.log('Classes:', await accordion.getAttribute('class'));
    }

    // Check all blocks in the product info
    const productInfo = page.locator('#ProductInfo-template--21785467486500__main, [data-section-id], .product__info-wrapper');
    if (await productInfo.count() > 0) {
      console.log('\nProduct info HTML:');
      const html = await productInfo.first().innerHTML();
      console.log(html.substring(0, 1000));
    }

    // Expect at least one to exist
    expect(accordionExists + buttonExists + textExists).toBeGreaterThan(0);
  });

  test('should open size guide drawer when clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Try to find and click the size guide accordion
    const accordionButton = page.locator('.accordion__trigger[data-sg-open]').first();

    if (await accordionButton.count() > 0) {
      console.log('Size guide accordion found! Clicking...');
      await accordionButton.click();

      // Wait for drawer to appear
      await page.waitForTimeout(1000);

      // Check if drawer is visible
      const drawer = page.locator('.sg-root:not([hidden])');
      const drawerVisible = await drawer.isVisible({ timeout: 3000 }).catch(() => false);

      console.log('Drawer visible:', drawerVisible);

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/size-guide-drawer-open.png', fullPage: true });

      expect(drawerVisible).toBe(true);
    } else {
      console.log('Size guide accordion NOT found');
      await page.screenshot({ path: 'tests/screenshots/no-size-guide-accordion.png', fullPage: true });
      throw new Error('Size guide accordion not found on page');
    }
  });
});
