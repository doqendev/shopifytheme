import { test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://cheyenne.pt';

test('find password page elements', async ({ page }) => {
  await page.goto(`${BASE_URL}/collections/novidades`);

  console.log('Current URL:', page.url());

  // Get all buttons
  const buttons = await page.locator('button').evaluateAll(btns =>
    btns.map((btn, i) => ({
      index: i,
      text: btn.textContent?.trim(),
      classes: btn.className,
      type: btn.type
    }))
  );
  console.log('Buttons found:', JSON.stringify(buttons, null, 2));

  // Get all SVGs
  const svgs = await page.locator('svg').evaluateAll(svgs =>
    svgs.map((svg, i) => ({
      index: i,
      classes: svg.className.baseVal || svg.className,
      viewBox: svg.getAttribute('viewBox')
    }))
  );
  console.log('SVGs found:', JSON.stringify(svgs, null, 2));

  // Get all inputs
  const inputs = await page.locator('input').evaluateAll(inputs =>
    inputs.map((input, i) => ({
      index: i,
      type: input.type,
      name: input.name,
      id: input.id
    }))
  );
  console.log('Inputs found:', JSON.stringify(inputs, null, 2));

  // Get page HTML structure
  const bodyHTML = await page.locator('body').evaluate(el => el.innerHTML);
  console.log('Body HTML length:', bodyHTML.length);

  await page.screenshot({ path: 'password-page-elements.png', fullPage: true });
});
