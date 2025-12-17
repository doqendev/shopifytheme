import { test, expect } from '@playwright/test';

const collectionHandle = process.env.COLLECTION_HANDLE || 'novidades';

test('Grid 3 - Complete diagnostic test', async ({ page }) => {
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  await page.goto(`/password`);
  await bypassPassword(page);
  await acceptCookies(page);

  console.log('\n🌐 Navigating to collection...');
  await page.goto(`/collections/${collectionHandle}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.product-grid .card-wrapper').first()).toBeVisible({ timeout: 5000 });

  // === STEP 1: Check CSS sync ===
  console.log('\n\n=== STEP 1: CHECKING CSS SYNC ===');
  const cssCheck = await page.evaluate(() => {
    const styleTags = Array.from(document.querySelectorAll('style'));
    for (const style of styleTags) {
      const text = style.textContent || '';
      if (text.includes('.product-grid.three-col .product-card-plus .size-options.size-options--desktop')) {
        const hasMinWidth = text.includes('min-width: 200px');
        const snippet = text.substring(
          Math.max(0, text.indexOf('.product-grid.three-col .product-card-plus') - 100),
          text.indexOf('.product-grid.three-col .product-card-plus') + 500
        );
        return { found: true, hasMinWidth, snippet };
      }
    }
    return { found: false };
  });

  if (cssCheck.found && cssCheck.hasMinWidth) {
    console.log('✅ CSS IS SYNCED - min-width rule found');
    console.log('CSS snippet:', cssCheck.snippet);
  } else if (cssCheck.found) {
    console.log('⚠️  CSS rule found but NO min-width - old version');
  } else {
    console.log('❌ CSS NOT SYNCED - rule not found at all');
  }

  // === STEP 2: Switch to Grid 3 ===
  console.log('\n\n=== STEP 2: SWITCHING TO GRID 3 ===');
  await page.locator('#layout-three-col').click();
  await page.waitForTimeout(1500);

  const gridActive = await page.locator('.product-grid.three-col').isVisible();
  console.log(gridActive ? '✅ Grid 3 active' : '❌ Grid 3 NOT active');

  await page.screenshot({ path: 'test-results/step2-grid3-active.png', fullPage: true });

  // === STEP 3: Inspect first product BEFORE click ===
  console.log('\n\n=== STEP 3: INSPECTING FIRST PRODUCT (BEFORE CLICK) ===');
  const firstProduct = page.locator('.card-wrapper').first();

  const beforeClick = await firstProduct.evaluate((productEl) => {
    const overlayPlus = productEl.querySelector('.plus-icon--overlay');
    const productCardPlus = productEl.querySelector('.product-card-plus');
    const plusIcon = productEl.querySelector('.plus-icon');
    const sizeOptions = productEl.querySelector('.size-options');

    const getFullStyles = (el: Element | null) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        width: `${rect.width}px (${styles.width})`,
        height: `${rect.height}px (${styles.height})`,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        classes: el.className,
      };
    };

    return {
      overlayPlus: {
        exists: !!overlayPlus,
        styles: getFullStyles(overlayPlus),
      },
      productCardPlus: {
        exists: !!productCardPlus,
        styles: getFullStyles(productCardPlus),
        hasActiveClass: productCardPlus?.classList.contains('active'),
      },
      plusIcon: {
        exists: !!plusIcon,
        styles: getFullStyles(plusIcon),
      },
      sizeOptions: {
        exists: !!sizeOptions,
        styles: getFullStyles(sizeOptions),
        buttonCount: sizeOptions?.querySelectorAll('.size-option').length || 0,
      },
    };
  });

  console.log('BEFORE CLICK STATE:');
  console.log(JSON.stringify(beforeClick, null, 2));

  // === STEP 4: Setup monitoring ===
  console.log('\n\n=== STEP 4: SETTING UP MONITORING ===');
  await page.evaluate(() => {
    (window as any).debugLog = [];
    (window as any).log = (msg: string) => {
      (window as any).debugLog.push({ time: Date.now(), msg });
      console.log('[DEBUG]', msg);
    };

    // Monitor clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      (window as any).log(`Click on: ${target.tagName}.${target.className}`);
    }, true);

    // Monitor class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          (window as any).log(`Class changed on ${target.className}`);
        }
      });
    });

    document.querySelectorAll('.product-card-plus, .size-options').forEach((el) => {
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });

    (window as any).log('Monitoring setup complete');
  });

  // === STEP 5: Click the overlay plus icon ===
  console.log('\n\n=== STEP 5: CLICKING OVERLAY PLUS ICON ===');

  const overlayPlusIcon = firstProduct.locator('.plus-icon--overlay');
  const isOverlayVisible = await overlayPlusIcon.isVisible();
  console.log(`Overlay plus icon visible: ${isOverlayVisible}`);

  if (!isOverlayVisible) {
    console.log('❌ CRITICAL: Overlay plus icon not visible!');
    await page.screenshot({ path: 'test-results/step5-no-overlay.png', fullPage: true });
    throw new Error('Overlay plus icon not visible');
  }

  await page.screenshot({ path: 'test-results/step5-before-click.png', fullPage: true });

  console.log('Clicking now...');
  await overlayPlusIcon.click({ force: true });

  console.log('Waiting 2 seconds...');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/step5-after-click.png', fullPage: true });

  // === STEP 6: Check state AFTER click ===
  console.log('\n\n=== STEP 6: CHECKING STATE AFTER CLICK ===');

  const afterClick = await firstProduct.evaluate((productEl) => {
    const productCardPlus = productEl.querySelector('.product-card-plus');
    const sizeOptions = productEl.querySelector('.size-options');
    const sizeButtons = productEl.querySelectorAll('.size-option');

    const getFullStyles = (el: Element | null) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        width: `${rect.width}px (${styles.width})`,
        height: `${rect.height}px (${styles.height})`,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        top: `${rect.top}px (${styles.top})`,
        left: `${rect.left}px (${styles.left})`,
        classes: el.className,
      };
    };

    const buttonStates = Array.from(sizeButtons).map((btn) => {
      const rect = btn.getBoundingClientRect();
      const styles = window.getComputedStyle(btn);
      return {
        text: btn.textContent?.trim(),
        dataSize: btn.getAttribute('data-size'),
        display: styles.display,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
      };
    });

    return {
      productCardPlus: {
        exists: !!productCardPlus,
        hasActiveClass: productCardPlus?.classList.contains('active'),
        styles: getFullStyles(productCardPlus),
      },
      sizeOptions: {
        exists: !!sizeOptions,
        styles: getFullStyles(sizeOptions),
        buttonCount: sizeButtons.length,
      },
      buttons: buttonStates,
    };
  });

  console.log('AFTER CLICK STATE:');
  console.log(JSON.stringify(afterClick, null, 2));

  // === STEP 7: Get debug log ===
  console.log('\n\n=== STEP 7: DEBUG LOG FROM PAGE ===');
  const debugLog = await page.evaluate(() => (window as any).debugLog || []);
  debugLog.forEach((entry: any) => {
    console.log(`  ${entry.msg}`);
  });

  // === STEP 8: Final verdict ===
  console.log('\n\n=== STEP 8: VERDICT ===');

  const hasActive = afterClick.productCardPlus.hasActiveClass;
  const drawerVisible = afterClick.sizeOptions.styles &&
                        afterClick.sizeOptions.styles.display !== 'none';
  const hasSize = afterClick.sizeOptions.styles &&
                  parseFloat(afterClick.sizeOptions.styles.width) > 0;
  const visibleButtons = afterClick.buttons.filter(b => b.visible).length;

  console.log(`Active class added: ${hasActive ? '✅' : '❌'}`);
  console.log(`Drawer display !== none: ${drawerVisible ? '✅' : '❌'}`);
  console.log(`Drawer has size (width > 0): ${hasSize ? '✅' : '❌'}`);
  console.log(`Visible size buttons: ${visibleButtons}/${afterClick.buttons.length}`);

  if (hasActive && drawerVisible && hasSize && visibleButtons > 0) {
    console.log('\n🎉 SUCCESS! Drawer should be working!');
  } else {
    console.log('\n❌ FAILED - Drawer not working');
    console.log('\nIssues found:');
    if (!hasActive) console.log('  - Active class not added (JS not running)');
    if (!drawerVisible) console.log('  - Drawer display is none (CSS hiding it)');
    if (!hasSize) console.log('  - Drawer has no size (CSS width issue)');
    if (visibleButtons === 0) console.log('  - No visible size buttons');
  }

  console.log('\n📸 Screenshots saved to test-results/');
  console.log('  - step2-grid3-active.png');
  console.log('  - step5-before-click.png');
  console.log('  - step5-after-click.png');
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
