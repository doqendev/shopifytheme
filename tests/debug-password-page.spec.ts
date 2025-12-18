import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('Debug password page', async ({ page }) => {
  const productUrl = 'https://cheyenne.pt/products/sweatshirt-cropped-as-riscas-copy';

  await page.goto(productUrl);
  await page.waitForLoadState('networkidle');

  // Take screenshot before password
  await page.screenshot({ path: 'tests/screenshots/debug-before-password.png', fullPage: true });

  // Save HTML
  const htmlBefore = await page.content();
  fs.writeFileSync('tests/screenshots/debug-before-password.html', htmlBefore);

  console.log('=== PAGE TITLE ===');
  console.log(await page.title());

  console.log('\n=== LOOKING FOR PASSWORD INPUT ===');
  const passwordInput = page.locator('input[type="password"]');
  const count = await passwordInput.count();
  console.log('Password inputs found:', count);

  if (count > 0) {
    console.log('\n=== FILLING PASSWORD ===');
    await passwordInput.first().fill('123');
    await page.waitForTimeout(500);

    console.log('\n=== LOOKING FOR SUBMIT BUTTON ===');
    // Try multiple selectors
    const allButtons = await page.locator('button').all();
    console.log('Total buttons on page:', allButtons.length);

    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const html = await btn.innerHTML();
      const text = await btn.textContent();
      console.log(`\nButton ${i + 1}:`);
      console.log('Text:', text);
      console.log('HTML:', html.substring(0, 200));
    }

    console.log('\n=== TRYING TO SUBMIT ===');

    // Method 1: Press Enter
    console.log('Method 1: Pressing Enter...');
    await passwordInput.first().press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/debug-after-enter.png', fullPage: true });

    // Check if still on password page
    const stillPasswordPage = await passwordInput.isVisible().catch(() => false);
    console.log('Still on password page after Enter:', stillPasswordPage);

    if (stillPasswordPage) {
      // Method 2: Click first button
      console.log('\nMethod 2: Clicking first button...');
      await allButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/debug-after-button-click.png', fullPage: true });
    }

    // Final check
    const finalPasswordCheck = await passwordInput.isVisible().catch(() => false);
    console.log('\nFinal password page check:', finalPasswordCheck);

    // Save final HTML
    const htmlAfter = await page.content();
    fs.writeFileSync('tests/screenshots/debug-after-password.html', htmlAfter);
  }
});
