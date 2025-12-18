import { test } from '@playwright/test';
import * as fs from 'fs';

test('Inspect product template and blocks', async ({ page }) => {
  const productUrl = 'https://cheyenne.pt/products/sweatshirt-cropped-as-riscas-copy';
  const password = '123';

  // Navigate and handle password
  await page.goto(productUrl);
  await page.waitForLoadState('networkidle');

  const padlockButton = page.locator('button.password-reveal-trigger');
  if (await padlockButton.isVisible().catch(() => false)) {
    await padlockButton.click();
    await page.waitForTimeout(500);
    const passwordInput = page.locator('input[type="password"]#Password');
    await passwordInput.fill(password);
    await passwordInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Handle cookies
  const acceptCookies = page.locator('button:has-text("Aceitar")');
  if (await acceptCookies.isVisible().catch(() => false)) {
    await acceptCookies.click();
    await page.waitForTimeout(500);
  }

  // Navigate to product if needed
  if (!page.url().includes('/products/')) {
    await page.goto(productUrl);
    await page.waitForLoadState('networkidle');
  }

  console.log('\n=== PAGE INFORMATION ===');
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  // Check section IDs
  console.log('\n=== SECTIONS ON PAGE ===');
  const sections = await page.locator('[id*="shopify-section"], section[id]').all();
  for (const section of sections) {
    const id = await section.getAttribute('id');
    console.log('Section ID:', id);
  }

  // Check which product section is being used
  console.log('\n=== PRODUCT SECTION ===');
  const productSection = page.locator('[id*="ProductInfo"]').first();
  if (await productSection.count() > 0) {
    const sectionId = await productSection.getAttribute('id');
    console.log('Product section ID:', sectionId);
  }

  // Get all blocks in the product section
  console.log('\n=== BLOCKS IN PRODUCT SECTION ===');
  const blocks = await page.locator('[class*="product__"], [data-shopify-editor-block]').all();
  console.log('Total blocks found:', blocks.length);

  for (let i = 0; i < Math.min(blocks.length, 20); i++) {
    const block = blocks[i];
    const classes = await block.getAttribute('class');
    const blockId = await block.getAttribute('data-shopify-editor-block');
    const text = await block.textContent();
    console.log(`\nBlock ${i + 1}:`);
    console.log('  Classes:', classes?.substring(0, 100));
    console.log('  Block ID:', blockId);
    console.log('  Text:', text?.trim().substring(0, 80));
  }

  // Look specifically for accordion blocks
  console.log('\n=== ACCORDION BLOCKS ===');
  const accordions = await page.locator('.accordion, .product__accordion').all();
  console.log('Total accordions:', accordions.length);

  for (let i = 0; i < accordions.length; i++) {
    const accordion = accordions[i];
    const classes = await accordion.getAttribute('class');
    const text = await accordion.textContent();
    console.log(`\nAccordion ${i + 1}:`);
    console.log('  Classes:', classes);
    console.log('  Text:', text?.trim().substring(0, 100));
  }

  // Look for size guide references
  console.log('\n=== SIZE GUIDE REFERENCES ===');
  const sizeGuideLinks = await page.locator('text=/guia de tamanhos/i').all();
  console.log('Size guide text occurrences:', sizeGuideLinks.length);

  for (let i = 0; i < sizeGuideLinks.length; i++) {
    const link = sizeGuideLinks[i];
    const html = await link.innerHTML();
    const parent = link.locator('xpath=..');
    const parentClasses = await parent.getAttribute('class');
    console.log(`\nOccurrence ${i + 1}:`);
    console.log('  HTML:', html.substring(0, 100));
    console.log('  Parent classes:', parentClasses);
  }

  // Save full HTML
  const html = await page.content();
  fs.writeFileSync('tests/screenshots/product-page-full.html', html);
  console.log('\n✓ Full HTML saved to tests/screenshots/product-page-full.html');

  await page.screenshot({ path: 'tests/screenshots/product-page-inspect.png', fullPage: true });
});
