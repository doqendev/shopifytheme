import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://cheyenne.pt';
const STORE_PASSWORD = process.env.STORE_PASSWORD || '123';
const COLLECTION_HANDLE = 'novidades'; // Change if needed

test.describe('Grid Animation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // First check if password is needed
    await page.goto(BASE_URL);

    const passwordRevealButton = page.locator('button.password-reveal-trigger');
    if (await passwordRevealButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Password page detected, bypassing...');
      await passwordRevealButton.click();
      await page.waitForTimeout(300);

      const passwordInput = page.locator('input#Password');
      await passwordInput.fill(STORE_PASSWORD);

      const enterButton = page.locator('button.password-button');
      await enterButton.click();

      await page.waitForLoadState('networkidle');
      console.log('Password bypass complete');
    }

    // Now navigate to collection
    console.log(`Navigating to ${BASE_URL}/collections/${COLLECTION_HANDLE}`);
    await page.goto(`${BASE_URL}/collections/${COLLECTION_HANDLE}`, {
      waitUntil: 'networkidle'
    });

    // Wait for grid to load
    await page.waitForSelector('ul#product-grid', { state: 'visible', timeout: 10000 });
    console.log('Product grid loaded');

    await page.waitForTimeout(1000); // Let everything settle
  });

  test('should show grid layout buttons', async ({ page }) => {
    const oneColButton = page.locator('#layout-one-col');
    const twoColButton = page.locator('#layout-two-col');
    const threeColButton = page.locator('#layout-three-col');

    await expect(oneColButton).toBeVisible();
    await expect(twoColButton).toBeVisible();
    await expect(threeColButton).toBeVisible();

    // Check default active state (should be 2-column)
    const twoColActive = await twoColButton.evaluate(el => el.classList.contains('active'));
    console.log('Two-column button is active:', twoColActive);
  });

  test('should transition from 2-col to 1-col smoothly', async ({ page }) => {
    console.log('\n=== Testing 2-col → 1-col transition ===');

    // Take before screenshot
    await page.screenshot({
      path: 'tests/screenshots/grid-2col-before.png',
      fullPage: false
    });

    // Get initial grid state
    const gridBefore = await page.locator('.product-grid').evaluate(el => ({
      classList: Array.from(el.classList),
      cardCount: el.querySelectorAll('.card-wrapper').length
    }));
    console.log('Grid before:', gridBefore);

    // Click one-column button
    const oneColButton = page.locator('#layout-one-col');
    await oneColButton.click();

    // Wait for animation to start
    await page.waitForTimeout(100);

    // Take during animation screenshot
    await page.screenshot({
      path: 'tests/screenshots/grid-1col-during.png',
      fullPage: false
    });

    // Wait for animation to complete
    await page.waitForTimeout(600);

    // Take after screenshot
    await page.screenshot({
      path: 'tests/screenshots/grid-1col-after.png',
      fullPage: false
    });

    // Verify grid changed
    const gridAfter = await page.locator('.product-grid').evaluate(el => ({
      classList: Array.from(el.classList),
      hasOneCol: el.classList.contains('one-col'),
      hasTwoCol: el.classList.contains('two-col')
    }));
    console.log('Grid after:', gridAfter);

    expect(gridAfter.hasOneCol).toBe(true);
    expect(gridAfter.hasTwoCol).toBe(false);
  });

  test('should transition from 2-col to 3-col smoothly', async ({ page }) => {
    console.log('\n=== Testing 2-col → 3-col transition ===');

    await page.screenshot({
      path: 'tests/screenshots/grid-2col-before-3.png',
      fullPage: false
    });

    const threeColButton = page.locator('#layout-three-col');
    await threeColButton.click();

    await page.waitForTimeout(100);
    await page.screenshot({
      path: 'tests/screenshots/grid-3col-during.png',
      fullPage: false
    });

    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'tests/screenshots/grid-3col-after.png',
      fullPage: false
    });

    const gridAfter = await page.locator('.product-grid').evaluate(el => ({
      hasThreeCol: el.classList.contains('three-col'),
      hasTwoCol: el.classList.contains('two-col')
    }));
    console.log('Grid after:', gridAfter);

    expect(gridAfter.hasThreeCol).toBe(true);
    expect(gridAfter.hasTwoCol).toBe(false);
  });

  test('should capture animation behavior with video', async ({ page }) => {
    console.log('\n=== Recording full animation sequence ===');

    // Start video recording context is automatic in Playwright config

    // Wait for page to be fully ready
    await page.waitForTimeout(1000);

    console.log('Starting animation sequence...');

    // 2-col → 1-col
    console.log('Clicking 1-column...');
    await page.locator('#layout-one-col').click();
    await page.waitForTimeout(800);

    // 1-col → 3-col
    console.log('Clicking 3-column...');
    await page.locator('#layout-three-col').click();
    await page.waitForTimeout(800);

    // 3-col → 2-col
    console.log('Clicking 2-column...');
    await page.locator('#layout-two-col').click();
    await page.waitForTimeout(800);

    // 2-col → 3-col → 1-col (rapid)
    console.log('Rapid transitions...');
    await page.locator('#layout-three-col').click();
    await page.waitForTimeout(300);
    await page.locator('#layout-one-col').click();
    await page.waitForTimeout(800);

    console.log('Animation sequence complete');
  });

  test('should debug card transforms during animation', async ({ page }) => {
    console.log('\n=== Debugging card transforms ===');

    // Get card info before transition
    const cardsBefore = await page.locator('.product-grid .card-wrapper').evaluateAll(cards => {
      return cards.slice(0, 3).map((card, i) => ({
        index: i,
        rect: card.getBoundingClientRect(),
        transform: window.getComputedStyle(card).transform,
        transition: window.getComputedStyle(card).transition
      }));
    });
    console.log('Cards before transition:', JSON.stringify(cardsBefore, null, 2));

    // Click layout button
    await page.locator('#layout-one-col').click();

    // Capture transforms during animation
    await page.waitForTimeout(50);
    const cardsDuring = await page.locator('.product-grid .card-wrapper').evaluateAll(cards => {
      return cards.slice(0, 3).map((card, i) => ({
        index: i,
        transform: card.style.transform,
        transition: card.style.transition,
        willChange: card.style.willChange
      }));
    });
    console.log('Cards during animation:', JSON.stringify(cardsDuring, null, 2));

    // Wait for animation to complete
    await page.waitForTimeout(600);
    const cardsAfter = await page.locator('.product-grid .card-wrapper').evaluateAll(cards => {
      return cards.slice(0, 3).map((card, i) => ({
        index: i,
        rect: card.getBoundingClientRect(),
        transform: card.style.transform,
        transition: card.style.transition,
        willChange: card.style.willChange
      }));
    });
    console.log('Cards after animation:', JSON.stringify(cardsAfter, null, 2));
  });
});
