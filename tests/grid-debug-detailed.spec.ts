import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://cheyenne.pt';
const STORE_PASSWORD = process.env.STORE_PASSWORD || '123';

test('detailed grid animation debug', async ({ page }) => {
  // Navigate and bypass password
  await page.goto(BASE_URL);

  const passwordRevealButton = page.locator('button.password-reveal-trigger');
  if (await passwordRevealButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passwordRevealButton.click();
    await page.waitForTimeout(300);
    await page.locator('input#Password').fill(STORE_PASSWORD);
    await page.locator('button.password-button').click();
    await page.waitForLoadState('networkidle');
  }

  await page.goto(`${BASE_URL}/collections/novidades`, { waitUntil: 'networkidle' });
  await page.waitForSelector('ul#product-grid', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);

  console.log('\n=== BEFORE CLICK ===');

  // Get initial state
  const beforeState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-grid .card-wrapper')).slice(0, 3);
    return cards.map((card, i) => {
      const img = card.querySelector('.card__media, .media, img');
      return {
        index: i,
        card: {
          transform: (card as HTMLElement).style.transform || 'none',
          rect: card.getBoundingClientRect()
        },
        image: img ? {
          transform: (img as HTMLElement).style.transform || 'none',
          rect: img.getBoundingClientRect()
        } : null
      };
    });
  });
  console.log(JSON.stringify(beforeState, null, 2));

  // Click button and capture at 10ms
  console.log('\n=== CLICKING 1-COL BUTTON ===');
  await page.locator('#layout-one-col').click();
  await page.waitForTimeout(10);

  const during10ms = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-grid .card-wrapper')).slice(0, 3);
    return cards.map((card, i) => {
      const img = card.querySelector('.card__media, .media, img');
      return {
        index: i,
        card: {
          transform: (card as HTMLElement).style.transform || 'none',
          transition: (card as HTMLElement).style.transition || 'none'
        },
        image: img ? {
          transform: (img as HTMLElement).style.transform || 'none',
          transition: (img as HTMLElement).style.transition || 'none'
        } : null
      };
    });
  });
  console.log('\n=== AT 10ms ===');
  console.log(JSON.stringify(during10ms, null, 2));

  await page.waitForTimeout(40); // Total 50ms

  const during50ms = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-grid .card-wrapper')).slice(0, 3);
    return cards.map((card, i) => {
      const img = card.querySelector('.card__media, .media, img');
      return {
        index: i,
        card: {
          transform: (card as HTMLElement).style.transform || 'none',
          transition: (card as HTMLElement).style.transition || 'none'
        },
        image: img ? {
          transform: (img as HTMLElement).style.transform || 'none',
          transition: (img as HTMLElement).style.transition || 'none'
        } : null
      };
    });
  });
  console.log('\n=== AT 50ms ===');
  console.log(JSON.stringify(during50ms, null, 2));

  await page.waitForTimeout(150); // Total 200ms

  const during200ms = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-grid .card-wrapper')).slice(0, 3);
    return cards.map((card, i) => {
      const img = card.querySelector('.card__media, .media, img');
      return {
        index: i,
        card: {
          transform: (card as HTMLElement).style.transform || 'none',
          rect: card.getBoundingClientRect()
        },
        image: img ? {
          transform: (img as HTMLElement).style.transform || 'none',
          rect: img.getBoundingClientRect()
        } : null
      };
    });
  });
  console.log('\n=== AT 200ms (mid-animation) ===');
  console.log(JSON.stringify(during200ms, null, 2));

  await page.waitForTimeout(200); // Total 400ms - animation complete

  const afterState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-grid .card-wrapper')).slice(0, 3);
    return cards.map((card, i) => {
      const img = card.querySelector('.card__media, .media, img');
      return {
        index: i,
        card: {
          transform: (card as HTMLElement).style.transform || 'none',
          rect: card.getBoundingClientRect()
        },
        image: img ? {
          transform: (img as HTMLElement).style.transform || 'none',
          rect: img.getBoundingClientRect()
        } : null
      };
    });
  });
  console.log('\n=== AFTER ANIMATION (400ms) ===');
  console.log(JSON.stringify(afterState, null, 2));
});
