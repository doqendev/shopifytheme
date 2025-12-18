import { test, expect } from '@playwright/test';

test.describe('Size Guide Accordion', () => {
  test.beforeEach(async ({ page }) => {
    const productUrl = 'https://cheyenne.pt/products/sweatshirt-cropped-as-riscas-copy';
    const password = '123';

    // Navigate directly to product page
    await page.goto(productUrl);
    await page.waitForLoadState('networkidle');

    // Check if we're on the password page by looking for the padlock button
    const padlockButton = page.locator('button.password-reveal-trigger');
    const isPasswordPage = await padlockButton.isVisible().catch(() => false);

    if (isPasswordPage) {
      console.log('Password page detected, clicking padlock button...');

      // Step 1: Click the padlock button to reveal the password input
      await padlockButton.click();
      await page.waitForTimeout(500);

      // Step 2: Wait for the password input to become visible
      const passwordInput = page.locator('input[type="password"]#Password');
      await passwordInput.waitFor({ state: 'visible', timeout: 3000 });

      console.log('Password input revealed, typing password...');

      // Step 3: Type the password
      await passwordInput.fill(password);

      // Step 4: Press Enter to submit
      await passwordInput.press('Enter');

      // Wait for navigation after password submission
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Extra wait for page to fully load

      console.log('Password submitted successfully');
    }

    // Verify we're now on the actual product page
    await page.waitForSelector('body', { timeout: 5000 });

    // Handle cookie consent if present
    const acceptCookies = page.locator('button:has-text("Aceitar")');
    if (await acceptCookies.isVisible().catch(() => false)) {
      console.log('Cookie dialog detected, clicking Accept...');
      await acceptCookies.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display size guide accordion on product page', async ({ page }) => {
    // Verify we're on the product page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If not on product page, navigate back
    if (!currentUrl.includes('/products/')) {
      console.log('Not on product page, navigating...');
      await page.goto('https://cheyenne.pt/products/sweatshirt-cropped-as-riscas-copy');
      await page.waitForLoadState('networkidle');
    }

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Scroll down to the product info section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);

    // Take screenshot of full page
    await page.screenshot({ path: 'tests/screenshots/size-guide-accordion-full-page.png', fullPage: true });

    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());

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
