import { test, expect } from '@playwright/test';

test('check accordion on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`https://cheyenne.pt/password`);

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

  const acceptButton = page.locator('button:has-text("Aceitar")').first();
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
  }

  await page.goto(`https://cheyenne.pt/products/sweatshirt-basica-com-capuz-copy`);
  await page.waitForLoadState('networkidle');

  // Scroll to product info section
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(1000);

  // Take screenshot of upper part
  await page.screenshot({ path: 'test-results/product-upper-section.png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });

  // Click on first accordion to open it
  const firstAccordion = page.locator('.accordion-button').first();
  if (await firstAccordion.isVisible()) {
    await firstAccordion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await firstAccordion.click();
    await page.waitForTimeout(500);

    // Take screenshot with accordion open
    const accordionSection = page.locator('.product-info-accordion').first();
    await accordionSection.screenshot({ path: 'test-results/accordion-section.png' });
  }

  // Open the share accordion
  const shareAccordion = page.locator('.accordion-button:has-text("Partilhar")').first();
  if (await shareAccordion.isVisible()) {
    await shareAccordion.click();
    await page.waitForTimeout(500);
    await shareAccordion.screenshot({ path: 'test-results/share-accordion.png' });
  }
});
