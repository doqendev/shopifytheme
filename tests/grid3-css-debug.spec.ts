import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - Debug CSS rules being applied', async ({ page }) => {
  // Navigate to collection
  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');

  // Wait for products to load
  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  console.log('\n=== CHECKING CSS FILES LOADED ===');

  // Check which CSS files are loaded
  const cssFiles = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => {
      const href = (link as HTMLLinkElement).href;
      const filename = href.split('/').pop() || href;
      return filename;
    });
  });

  console.log('CSS files loaded:', cssFiles);
  console.log(`quick-add.css loaded: ${cssFiles.some(f => f.includes('quick-add.css'))}`);

  // Check for our CSS marker in quick-add.css
  const quickAddContent = await page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of links) {
      const href = (link as HTMLLinkElement).href;
      if (href.includes('quick-add.css')) {
        try {
          const response = await fetch(href);
          const text = await response.text();
          return {
            hasGridThreeColRule: text.includes('.product-grid.three-col .product-card-plus'),
            hasOldComment: text.includes('IMPORTANT: Your CSS currently hides'),
            hasNewComment: text.includes('Grid 3 fix: Show product-card-plus'),
            snippet: text.substring(text.indexOf('.product-grid.three-col'), text.indexOf('.product-grid.three-col') + 300)
          };
        } catch (e) {
          return { error: String(e) };
        }
      }
    }
    return { notFound: true };
  });

  console.log('\n=== QUICK-ADD.CSS CONTENT ===');
  console.log(JSON.stringify(quickAddContent, null, 2));

  // Switch to Grid 3
  console.log('\n=== SWITCHING TO GRID 3 ===');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1000);

  // Verify grid is active
  await expect(page.locator('.product-grid.three-col')).toBeVisible();
  console.log('✅ Grid 3 is active');

  // Find first product and check all CSS
  const firstProduct = page.locator('.card-wrapper').first();

  const cssDebug = await firstProduct.evaluate((productEl) => {
    const cardContent = productEl.querySelector('.card__content');
    const productCardPlus = productEl.querySelector('.product-card-plus');
    const plusIcon = productEl.querySelector('.plus-icon');
    const overlayPlusIcon = productEl.querySelector('.plus-icon--overlay');
    const sizeOptions = productEl.querySelector('.size-options');

    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        zIndex: styles.zIndex,
        width: styles.width,
        height: styles.height,
        left: styles.left,
        top: styles.top,
        right: styles.right,
        bottom: styles.bottom,
      };
    };

    // Get all CSS rules that match .product-card-plus
    const getAllMatchingRules = (selector: string) => {
      const rules: any[] = [];
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              if (rule instanceof CSSStyleRule) {
                if (rule.selectorText && rule.selectorText.includes(selector)) {
                  rules.push({
                    selector: rule.selectorText,
                    display: rule.style.display,
                    href: sheet.href || 'inline',
                  });
                }
              }
            }
          } catch (e) {
            // CORS error, skip
          }
        }
      } catch (e) {
        rules.push({ error: String(e) });
      }
      return rules;
    };

    return {
      cardContent: {
        exists: !!cardContent,
        styles: getStyles(cardContent),
        classes: cardContent?.className,
      },
      productCardPlus: {
        exists: !!productCardPlus,
        styles: getStyles(productCardPlus),
        classes: productCardPlus?.className,
        matchingRules: getAllMatchingRules('product-card-plus'),
      },
      plusIcon: {
        exists: !!plusIcon,
        styles: getStyles(plusIcon),
        classes: plusIcon?.className,
      },
      overlayPlusIcon: {
        exists: !!overlayPlusIcon,
        styles: getStyles(overlayPlusIcon),
        classes: overlayPlusIcon?.className,
      },
      sizeOptions: {
        exists: !!sizeOptions,
        styles: getStyles(sizeOptions),
        classes: sizeOptions?.className,
      },
      gridClass: productEl.closest('.product-grid')?.className,
    };
  });

  console.log('\n=== COMPUTED STYLES IN GRID 3 ===');
  console.log(JSON.stringify(cssDebug, null, 2));

  // Check for specific CSS rules
  console.log('\n=== CSS RULES MATCHING .product-card-plus ===');
  if (cssDebug.productCardPlus.matchingRules) {
    cssDebug.productCardPlus.matchingRules.forEach((rule: any, i: number) => {
      console.log(`Rule ${i + 1}:`);
      console.log(`  Selector: ${rule.selector}`);
      console.log(`  Display: ${rule.display}`);
      console.log(`  Source: ${rule.href}`);
    });
  }

  // Final verdict
  console.log('\n=== VERDICT ===');
  console.log(`product-card-plus display: ${cssDebug.productCardPlus.styles?.display}`);
  console.log(`product-card-plus visible: ${cssDebug.productCardPlus.styles?.display !== 'none'}`);
  console.log(`size-options display: ${cssDebug.sizeOptions.styles?.display}`);
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
  const acceptButton = page.locator('button:has-text("Aceitar")').first();

  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}
