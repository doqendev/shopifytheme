(() => {
  const STORAGE_KEY = 'theme-wishlist-cache';
  const HEART_SELECTOR = '.wishlist-toggle';
  const DRAWER_SELECTOR = 'cart-drawer';
  const WISHLIST_CONTAINER_SELECTOR = '[data-wishlist-container]';
  const WISHLIST_GRID_SELECTOR = '[data-wishlist-grid]';
  const TAB_CART = 'cart';
  const TAB_WISHLIST = 'wishlist';

  let cachedWishlist = null;
  const htmlDecoder = document.createElement('textarea');

  const decodeHtml = (value) => {
    if (typeof value !== 'string') return '';
    htmlDecoder.innerHTML = value;
    return htmlDecoder.value;
  };

  const normalizeNumber = (value, fallback = -1) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const normalizeOptionValue = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  };

  const buildWishlistKey = (handle, colorKey = '') => `${handle || ''}::${normalizeOptionValue(colorKey)}`;

  const normalizeVariants = (variants) => {
    if (!Array.isArray(variants)) return [];
    return variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      available: !!variant.available,
      options: Array.isArray(variant.options) ? variant.options.slice() : [],
      price: variant.price,
    }));
  };

  const normalizeWishlistItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    const handle = item.handle;
    if (!handle) return null;

    const sizeIndex = normalizeNumber(item.sizeIndex, -1);
    const colorIndex = normalizeNumber(item.colorIndex ?? item.colourIndex, -1);

    let colorValue = '';
    if (typeof item.colorValue === 'string' && item.colorValue.trim().length) {
      colorValue = item.colorValue;
    } else if (typeof item.selectedColor === 'string' && item.selectedColor.trim().length) {
      colorValue = item.selectedColor;
    } else if (typeof item.color === 'string' && item.color.trim().length) {
      colorValue = item.color;
    }

    const colorKey = colorIndex >= 0 ? normalizeOptionValue(item.colorKey ?? colorValue) : '';

    return {
      ...item,
      handle,
      sizeIndex,
      colorIndex,
      colorValue,
      colorKey,
      variants: normalizeVariants(item.variants),
    };
  };

  const normalizeWishlistItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.reduce((accumulator, item) => {
      const normalized = normalizeWishlistItem(item);
      if (normalized) {
        accumulator.push(normalized);
      }
      return accumulator;
    }, []);
  };

  const getWishlistItemKey = (item) => {
    if (!item) return buildWishlistKey('', '');
    return buildWishlistKey(item.handle, item.colorKey);
  };

  const getCardSelectedColorKey = (card) => {
    if (!card) return '';
    const colorIndex = normalizeNumber(card.dataset?.colorIndex, -1);
    if (colorIndex < 0) return '';

    const activeSwatch = card.querySelector?.('.swatch.active');
    if (activeSwatch?.dataset?.color) {
      return normalizeOptionValue(activeSwatch.dataset.color);
    }

    if (card.dataset?.selectedColor) {
      return normalizeOptionValue(card.dataset.selectedColor);
    }

    return '';
  };

  const parseJSONAttribute = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(decodeHtml(value));
    } catch (error) {
      console.warn('Failed to parse JSON attribute', error);
      return fallback;
    }
  };

  const escapeHtml = (value) => {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const normalizeClassList = (...classNames) =>
    classNames
      .filter((value) => typeof value === 'string' && value.trim().length)
      .map((value) => value.trim())
      .join(' ');

  const loadWishlist = () => {
    if (cachedWishlist) return cachedWishlist.slice();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        cachedWishlist = [];
        return [];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        cachedWishlist = normalizeWishlistItems(parsed);
        return cachedWishlist.slice();
      }
    } catch (error) {
      console.warn('Unable to read wishlist from storage', error);
    }

    cachedWishlist = [];
    return [];
  };

  const saveWishlist = (items) => {
    cachedWishlist = normalizeWishlistItems(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedWishlist));
    } catch (error) {
      console.warn('Unable to persist wishlist', error);
    }
    renderWishlist();
    syncHearts();
  };

  const findWishlistItem = (handleOrItem, colorKey = '') => {
    const targetItem =
      typeof handleOrItem === 'object' ? normalizeWishlistItem(handleOrItem) : null;
    const handle = targetItem ? targetItem.handle : handleOrItem;
    if (!handle) return undefined;

    const normalizedColorKey = targetItem ? targetItem.colorKey : normalizeOptionValue(colorKey);
    const targetKey = targetItem
      ? getWishlistItemKey(targetItem)
      : buildWishlistKey(handle, normalizedColorKey);

    const wishlist = loadWishlist();
    let match = wishlist.find((item) => getWishlistItemKey(item) === targetKey);

    if (!match && normalizedColorKey) {
      const fallbackKey = buildWishlistKey(handle, '');
      match = wishlist.find((item) => getWishlistItemKey(item) === fallbackKey);
    }

    return match;
  };

  const addToWishlist = (product) => {
    const normalized = normalizeWishlistItem(product);
    if (!normalized) return;
    let wishlist = loadWishlist();
    const key = getWishlistItemKey(normalized);
    const fallbackKey = buildWishlistKey(normalized.handle, '');

    if (normalized.colorKey && key !== fallbackKey) {
      wishlist = wishlist.filter((item) => getWishlistItemKey(item) !== fallbackKey);
    }

    const existingIndex = wishlist.findIndex((item) => getWishlistItemKey(item) === key);
    if (existingIndex >= 0) {
      wishlist[existingIndex] = normalized;
    } else {
      wishlist.push(normalized);
    }
    saveWishlist(wishlist);
  };

  const removeFromWishlist = (handleOrItem, colorKey = '') => {
    const normalized =
      typeof handleOrItem === 'object' ? normalizeWishlistItem(handleOrItem) : null;
    const handle = normalized ? normalized.handle : handleOrItem;
    if (!handle) return;

    const key = normalized ? getWishlistItemKey(normalized) : buildWishlistKey(handle, colorKey);
    const wishlist = loadWishlist().filter((item) => getWishlistItemKey(item) !== key);
    saveWishlist(wishlist);
  };

  const getCardFromHeart = (button) => button?.closest('.product-card-wrapper');

  const getProductFromCard = (card) => {
    if (!card) return null;
    const handle = card.dataset.productHandle;
    if (!handle) return null;

    const variants = parseJSONAttribute(card.dataset.variants, []);
    const sizeIndex = Number.parseInt(card.dataset.sizeIndex, 10);
    const colorIndex = Number.parseInt(card.dataset.colorIndex, 10);
    let selectedColor = '';
    const normalizedColorIndex = Number.isNaN(colorIndex) ? -1 : colorIndex;
    if (normalizedColorIndex >= 0) {
      const activeSwatch = card.querySelector('.swatch.active');
      if (activeSwatch?.dataset?.color) {
        selectedColor = activeSwatch.dataset.color;
      } else if (card.dataset.selectedColor) {
        selectedColor = card.dataset.selectedColor;
      }
      if (selectedColor) {
        card.dataset.selectedColor = selectedColor;
      }
    }
    const colorKey = normalizedColorIndex >= 0 ? normalizeOptionValue(selectedColor) : '';
    const cardShell = card?.querySelector('.card');
    const cardInner = card?.querySelector('.card__inner');
    const cardMedia = card?.querySelector('.card__media');
    const mediaInner = cardMedia?.firstElementChild;
    const cardContent = card?.querySelector('.card__content');
    const cardInformation = card?.querySelector('.card__information');
    const cardHeading = card?.querySelector('.card__heading');
    const priceWrapper = card?.querySelector('.card-information');
    const activeImage = card.querySelector('.swiper-slide-active img, .card__media img');
    const productImage =
      activeImage?.currentSrc || activeImage?.src || card.dataset.productImage || '';

    return {
      handle,
      title: card.dataset.productTitle || '',
      url: card.dataset.productUrl || '',
      image: productImage,
      price: card.dataset.productPrice || '',
      sizeIndex: Number.isNaN(sizeIndex) ? -1 : sizeIndex,
      colorIndex: normalizedColorIndex,
      colorValue: selectedColor,
      colorKey,
      variants: variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        available: variant.available,
        options: variant.options,
        price: variant.price,
      })),
      cardWrapperClassName: card?.className || '',
      cardClassName: cardShell?.className || '',
      cardInnerClassName: cardInner?.className || '',
      cardInnerStyle: cardInner?.getAttribute('style') || '',
      cardMediaClassName: cardMedia?.className || '',
      cardMediaInnerClassName: mediaInner?.className || '',
      cardContentClassName: cardContent?.className || '',
      cardInformationClassName: cardInformation?.className || '',
      cardHeadingClassName: cardHeading?.className || '',
      cardPriceWrapperClassName: priceWrapper?.className || '',
    };
  };

  const handleHeartClick = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const card = getCardFromHeart(button);
    const product = getProductFromCard(card);
    if (!product) return;

    const existingItem = findWishlistItem(product.handle, product.colorKey);
    if (existingItem) {
      removeFromWishlist(existingItem);
    } else {
      addToWishlist(product);
    }
  };

  const attachHeartListeners = (root = document) => {
    root.querySelectorAll(HEART_SELECTOR).forEach((button) => {
      if (button.dataset.wishlistBound) return;
      button.dataset.wishlistBound = 'true';
      button.addEventListener('click', handleHeartClick);
    });
  };

  const syncHearts = () => {
    const wishlistItems = loadWishlist();
    const wishlistKeys = new Set(wishlistItems.map((item) => getWishlistItemKey(item)));

    document.querySelectorAll(HEART_SELECTOR).forEach((button) => {
      const card = getCardFromHeart(button);
      const handle = card?.dataset?.productHandle;
      let active = false;

      if (card && handle) {
        const colorKey = getCardSelectedColorKey(card);
        const exactKey = buildWishlistKey(handle, colorKey);
        active = wishlistKeys.has(exactKey);

        if (!active && colorKey) {
          active = wishlistKeys.has(buildWishlistKey(handle, ''));
        }
      }

      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        active
          ? window.wishlistStrings?.remove || 'Remove from wishlist'
          : window.wishlistStrings?.add || 'Add to wishlist',
      );
    });
  };

  const getDrawer = () => document.querySelector(DRAWER_SELECTOR);

  const getActiveDrawerTab = (drawer) =>
    drawer?.querySelector('[data-tab-target].is-active')?.dataset.tabTarget || TAB_CART;

  const formatDrawerLabel = (label, count) => {
    const normalizedLabel = label || '';
    const parsedCount = Number.parseInt(count, 10);
    const normalizedCount = Number.isNaN(parsedCount) ? 0 : parsedCount;
    return `${normalizedLabel} (${normalizedCount})`;
  };

  const getCartItemCount = (drawer) => {
    const cartItemsElement = drawer?.querySelector('cart-drawer-items');
    if (!cartItemsElement) return 0;

    const attributeValue = Number.parseInt(cartItemsElement.dataset.cartCount || '', 10);
    if (!Number.isNaN(attributeValue)) return attributeValue;

    let total = 0;
    cartItemsElement.querySelectorAll('input[name="updates[]"]').forEach((input) => {
      const value = Number.parseInt(input.value, 10);
      if (!Number.isNaN(value)) {
        total += value;
      }
    });

    return total;
  };

  const getWishlistCount = () => loadWishlist().length;

  const updateDrawerLabels = (drawer, activeTab = TAB_CART) => {
    if (!drawer) return;

    const cartCount = getCartItemCount(drawer);
    const wishlistCount = getWishlistCount();

    const labelSource = drawer.querySelector('[data-cart-title][data-wishlist]');
    if (labelSource) {
      const cartTitle = labelSource.dataset.cartTitle || labelSource.dataset.cart || 'Cart';
      const wishlistTitle =
        labelSource.dataset.wishlistTitle || labelSource.dataset.wishlist || window.wishlistStrings?.wishlist || 'Wishlist';
      labelSource.dataset.cartTitle = cartTitle;
      labelSource.dataset.wishlistTitle = wishlistTitle;
      labelSource.dataset.cartCount = String(cartCount);
      labelSource.dataset.wishlistCount = String(wishlistCount);
    }

    drawer.querySelectorAll('[data-tab-target]').forEach((button) => {
      const baseLabel = button.dataset.baseLabel || button.textContent.trim();
      button.dataset.baseLabel = baseLabel;
      const count = button.dataset.tabTarget === TAB_WISHLIST ? wishlistCount : cartCount;
      button.dataset.count = String(count);
      button.textContent = formatDrawerLabel(baseLabel, count);
    });
  };

  const setActiveDrawerTab = (tab) => {
    const drawer = getDrawer();
    if (!drawer) return;

    const tabs = drawer.querySelectorAll('[data-tab-target]');
    const panels = drawer.querySelectorAll('[data-tab-panel]');

    tabs.forEach((button) => {
      const isActive = button.dataset.tabTarget === tab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === tab;
      panel.classList.toggle('drawer__panel--active', isActive);
      panel.toggleAttribute('hidden', !isActive);
    });

    updateDrawerLabels(drawer, tab);
  };

  const initDrawerTabs = () => {
    const drawer = getDrawer();
    if (!drawer) return;

    const tabs = drawer.querySelectorAll('[data-tab-target]');
    tabs.forEach((tab) => {
      if (tab.dataset.wishlistBound) return;
      tab.dataset.wishlistBound = 'true';
      tab.addEventListener('click', () => setActiveDrawerTab(tab.dataset.tabTarget));
    });

    const activeTabButton = Array.from(tabs).find((tab) => tab.classList.contains('is-active'));
    setActiveDrawerTab(activeTabButton?.dataset.tabTarget || TAB_CART);
  };

  const getMatchingVariants = (item) => {
    if (!item || !Array.isArray(item.variants)) return [];
    const colorIndex = typeof item.colorIndex === 'number' ? item.colorIndex : -1;
    if (colorIndex == null || Number.isNaN(colorIndex) || colorIndex < 0) {
      return item.variants.slice();
    }

    const colorKey = item.colorKey;
    if (!colorKey) {
      return item.variants.slice();
    }

    return item.variants.filter((variant) => {
      if (!Array.isArray(variant.options)) return false;
      const value = variant.options[colorIndex];
      return normalizeOptionValue(value) === colorKey;
    });
  };

  const getAvailableVariants = (item) => getMatchingVariants(item).filter((variant) => variant.available);

  const createWishlistCardMarkup = (item) => {
    const imageMarkup = item.image
      ? `<img class="wishlist-card__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="wishlist-card__placeholder" aria-hidden="true"></div>`;

    const priceMarkup = item.price
      ? `<span class="price price--end">${escapeHtml(item.price)}</span>`
      : '';

    const availableVariants = getAvailableVariants(item);
    let sizeDrawerMarkup = '';
    let soldOutMarkup = '';
    if (item.sizeIndex >= 0) {
      if (availableVariants.length) {
        const optionButtons = availableVariants
          .map((variant) => {
            const label = variant.options?.[item.sizeIndex] || variant.title;
            return `
              <button type="button" class="wishlist-item__size-option" data-size-option data-variant-id="${escapeHtml(
                String(variant.id),
              )}">
                ${escapeHtml(label)}
              </button>`;
          })
          .join('');

        sizeDrawerMarkup = `
          <div class="wishlist-item__size-drawer" data-size-drawer hidden>
            <div class="wishlist-item__size-drawer-inner">
              <div class="wishlist-item__size-header">
                <p class="wishlist-item__size-label">${escapeHtml(window.wishlistStrings?.sizeLabel || 'Select a size')}</p>
                <button
                  type="button"
                  class="wishlist-item__size-close"
                  data-size-close
                  aria-label="${escapeHtml(window.wishlistStrings?.close || 'Close')}"
                >
                  &times;
                </button>
              </div>
              <div class="wishlist-item__size-options">
                ${optionButtons}
              </div>
            </div>
          </div>`;
      } else {
        soldOutMarkup = `<p class="wishlist-item__sold-out">${escapeHtml(window.wishlistStrings?.soldOut || 'Sold out')}</p>`;
      }
    }

    const hasAvailableVariant = availableVariants.length > 0;

    const cardShellClassName = escapeHtml(item.cardClassName || 'card card--standard card--media');
    const cardInnerClassName = escapeHtml(item.cardInnerClassName || 'card__inner ratio');
    const cardInnerStyle = item.cardInnerStyle
      ? ` style="${escapeHtml(item.cardInnerStyle)}"`
      : ' style="--ratio-percent: 100%;"';
    const cardMediaClassName = escapeHtml(item.cardMediaClassName || 'card__media');
    const mediaInnerClassName = escapeHtml(item.cardMediaInnerClassName || 'media media--transparent media--hover-effect');
    const cardContentClassName = escapeHtml(normalizeClassList(item.cardContentClassName || 'card__content', 'wishlist-card__content'));
    const cardInformationClassName = escapeHtml(item.cardInformationClassName || 'card__information');
    const cardHeadingClassName = escapeHtml(item.cardHeadingClassName || 'card__heading');
    const priceWrapperClassName = escapeHtml(item.cardPriceWrapperClassName || 'card-information');

    return `
      <div class="${cardShellClassName}">
        <button
          class="wishlist-toggle is-active"
          type="button"
          aria-pressed="true"
          aria-label="${escapeHtml(window.wishlistStrings?.remove || 'Remove from wishlist')}"
        >
          <svg class="wishlist-toggle__icon" viewBox="0 0 24 24" role="presentation" focusable="false">
            <path d="M12 21.35 10.55 20.03C6.2 15.99 3 12.99 3 9.31 3 6.28 5.42 4 8.4 4A5.2 5.2 0 0 1 12 5.86 5.2 5.2 0 0 1 15.6 4C18.58 4 21 6.28 21 9.31c0 3.68-3.2 6.68-7.55 10.72z" />
          </svg>
        </button>
        <div class="${cardInnerClassName}"${cardInnerStyle}>
          <div class="${cardMediaClassName}">
            <div class="${mediaInnerClassName}">
              <a href="${escapeHtml(item.url)}" class="wishlist-card__image-link full-unstyled-link">
                ${imageMarkup}
              </a>
            </div>
          </div>
        </div>
        <div class="${cardContentClassName}">
          <div class="${cardInformationClassName}">
            <h3 class="${cardHeadingClassName}">
              <a href="${escapeHtml(item.url)}" class="full-unstyled-link">${escapeHtml(item.title)}</a>
            </h3>
            <div class="${priceWrapperClassName}">
              ${priceMarkup}
            </div>
          </div>
          <div class="wishlist-card__actions">
            <button type="button" class="button button--primary wishlist-item__add" data-wishlist-add ${hasAvailableVariant ? '' : 'disabled'}>
              ${escapeHtml(window.wishlistStrings?.addToCart || 'Add to cart')}
            </button>
            ${soldOutMarkup}
          </div>
        </div>
        ${sizeDrawerMarkup}
      </div>`;
  };

  const renderWishlist = () => {
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    if (!containers.length) return;
    const items = loadWishlist();

    containers.forEach((container) => {
      const grid = container.querySelector(WISHLIST_GRID_SELECTOR);
      const emptyState = container.querySelector('[data-wishlist-empty]');
      if (!grid || !emptyState) return;

      grid.innerHTML = '';

      if (!items.length) {
        container.classList.add('is-empty');
        grid.hidden = true;
        emptyState.hidden = false;
        return;
      }

      container.classList.remove('is-empty');
      grid.hidden = false;
      emptyState.hidden = true;

      items.forEach((item) => {
        const cardWrapper = document.createElement('article');
        const wrapperClassName = normalizeClassList(
          item.cardWrapperClassName || 'card-wrapper product-card-wrapper product-card underline-links-hover',
          'wishlist-card',
        );
        cardWrapper.className = wrapperClassName;
        cardWrapper.dataset.wishlistItem = 'true';
        cardWrapper.dataset.handle = item.handle;
        cardWrapper.dataset.productHandle = item.handle;
        cardWrapper.dataset.productTitle = item.title || '';
        cardWrapper.dataset.productUrl = item.url || '';
        cardWrapper.dataset.productImage = item.image || '';
        cardWrapper.dataset.productPrice = item.price || '';
        if (typeof item.sizeIndex === 'number' && item.sizeIndex >= 0) {
          cardWrapper.dataset.sizeIndex = String(item.sizeIndex);
        } else {
          delete cardWrapper.dataset.sizeIndex;
        }
        if (typeof item.colorIndex === 'number' && item.colorIndex >= 0) {
          cardWrapper.dataset.colorIndex = String(item.colorIndex);
        } else {
          delete cardWrapper.dataset.colorIndex;
        }
        if (item.colorValue) {
          cardWrapper.dataset.selectedColor = item.colorValue;
        } else {
          delete cardWrapper.dataset.selectedColor;
        }
        try {
          cardWrapper.dataset.variants = JSON.stringify(item.variants || []);
        } catch (error) {
          console.warn('Unable to serialize wishlist variants', error);
          cardWrapper.dataset.variants = '[]';
        }
        if (item.colorKey) {
          cardWrapper.dataset.colorKey = item.colorKey;
        } else {
          delete cardWrapper.dataset.colorKey;
        }
        cardWrapper.wishlistItem = item;
        cardWrapper.innerHTML = createWishlistCardMarkup(item);
        grid.appendChild(cardWrapper);
      });

      attachHeartListeners(container);
    });

    const drawer = getDrawer();
    if (drawer) {
      updateDrawerLabels(drawer, getActiveDrawerTab(drawer));
    }

    syncHearts();
  };

  const getVariantForDirectAdd = (item) => {
    const available = getAvailableVariants(item);
    if (available.length) return available[0];
    const matching = getMatchingVariants(item);
    if (matching.length) return matching[0];
    return Array.isArray(item.variants) ? item.variants[0] : undefined;
  };

  const refreshCartDrawer = () => {
    if (!window.routes?.cart_url) return Promise.resolve();
    return fetch(`${window.routes.cart_url}?section_id=cart-drawer`)
      .then((response) => response.text())
      .then((responseText) => {
        const parser = new DOMParser();
        const html = parser.parseFromString(responseText, 'text/html');
        const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
        selectors.forEach((selector) => {
          const target = document.querySelector(selector);
          const source = html.querySelector(selector);
          if (target && source) {
            target.replaceWith(source);
          }
        });
        const drawer = getDrawer();
        if (drawer) {
          drawer.classList.remove('is-empty');
          if (!drawer.classList.contains('active')) {
            drawer.open();
          }
          updateDrawerLabels(drawer, getActiveDrawerTab(drawer));
        } else {
          const fallbackDrawer = getDrawer();
          if (fallbackDrawer) {
            updateDrawerLabels(fallbackDrawer, getActiveDrawerTab(fallbackDrawer));
          }
        }
        if (typeof publish === 'function') {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'wishlist' });
        }
      })
      .catch((error) => console.error('Failed to refresh cart drawer', error));
  };

  const getSizeDrawer = (row) => row?.querySelector('[data-size-drawer]');

  const closeSizeDrawer = (target) => {
    if (!target) return;
    const drawer = target.matches?.('[data-size-drawer]') ? target : getSizeDrawer(target);
    if (!drawer || drawer.dataset.animating === 'closing') return;

    const hide = () => {
      drawer.hidden = true;
      drawer.classList.remove('is-open');
      drawer.dataset.animating = '';
    };

    if (!drawer.classList.contains('is-open')) {
      hide();
      return;
    }

    if (!drawer.isConnected) {
      hide();
      return;
    }

    drawer.dataset.animating = 'closing';
    drawer.addEventListener('transitionend', hide, { once: true });
    drawer.classList.remove('is-open');
  };

  const openSizeDrawer = (row) => {
    const drawer = getSizeDrawer(row);
    if (!drawer || drawer.dataset.animating === 'opening') return;

    drawer.hidden = false;
    drawer.dataset.animating = 'opening';
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      drawer.dataset.animating = '';
      const firstOption = drawer.querySelector('[data-size-option]');
      firstOption?.focus();
    });
  };

  const addVariantToCart = (variantId, row) => {
    if (!variantId || !window.routes?.cart_add_url) return;
    const addButton = row?.querySelector('[data-wishlist-add]');
    if (addButton) addButton.disabled = true;

    const body = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }],
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname,
    });

    fetch(`${window.routes.cart_add_url}`, { ...fetchConfig(), body })
      .then((response) => response.json())
      .then((data) => {
        if (data.status && data.status !== 200) {
          throw new Error(data.description || 'Unable to add to cart');
        }
      })
      .then(() => {
        if (row?.dataset.handle) {
          removeFromWishlist(row.dataset.handle, row.dataset.colorKey || '');
        }
      })
      .then(() => refreshCartDrawer())
      .then(() => setActiveDrawerTab(TAB_CART))
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (addButton) addButton.disabled = false;
        const drawer = getSizeDrawer(row);
        if (drawer) {
          closeSizeDrawer(drawer);
        }
      });
  };

  const handleAddClick = (button) => {
    const row = button.closest('[data-wishlist-item]');
    if (!row) return;
    const colorKey = row.dataset?.colorKey || '';
    const item = row.wishlistItem || findWishlistItem(row.dataset.handle, colorKey);
    if (!item) return;

    const availableVariants = getAvailableVariants(item);
    if (!availableVariants.length) return;

    if (item.sizeIndex >= 0) {
      const drawer = getSizeDrawer(row);
      if (drawer) {
        if (drawer.hidden || !drawer.classList.contains('is-open')) {
          openSizeDrawer(row);
        } else {
          closeSizeDrawer(drawer);
        }
      }
      return;
    }

    const variant = getVariantForDirectAdd(item);
    addVariantToCart(variant?.id, row);
  };

  const handleSizeOptionClick = (button) => {
    const row = button.closest('[data-wishlist-item]');
    if (!row) return;
    const colorKey = row.dataset?.colorKey || '';
    const item = row.wishlistItem || findWishlistItem(row.dataset.handle, colorKey);
    if (!item) return;

    const variantId = Number.parseInt(button.dataset.variantId || '', 10);
    if (!variantId) return;
    addVariantToCart(variantId, row);
  };

  const handleSizeCloseClick = (button) => {
    const drawer = button.closest('[data-size-drawer]');
    if (!drawer) return;
    const row = drawer.closest('[data-wishlist-item]');
    closeSizeDrawer(drawer);
    const addButton = row?.querySelector('[data-wishlist-add]');
    addButton?.focus();
  };

  const handleWishlistClicks = (event) => {
    const addButton = event.target.closest('[data-wishlist-add]');
    if (addButton) {
      event.preventDefault();
      handleAddClick(addButton);
      return;
    }

    const sizeOption = event.target.closest('[data-size-option]');
    if (sizeOption) {
      event.preventDefault();
      handleSizeOptionClick(sizeOption);
      return;
    }

    const closeButton = event.target.closest('[data-size-close]');
    if (closeButton) {
      event.preventDefault();
      handleSizeCloseClick(closeButton);
    }
  };

  const registerWishlistContainerListeners = () => {
    document.addEventListener('click', handleWishlistClicks);
  };

  let swatchSyncBound = false;

  const registerSwatchSyncListener = () => {
    if (swatchSyncBound) return;
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('.swatch')) {
        requestAnimationFrame(() => syncHearts());
      }
    });
    swatchSyncBound = true;
  };

  const onSectionLoad = (event) => {
    const container = event.target || event.detail?.target;
    if (!(container instanceof HTMLElement)) return;
    if (container.querySelector?.(WISHLIST_CONTAINER_SELECTOR) || container.matches?.(WISHLIST_CONTAINER_SELECTOR)) {
      renderWishlist();
    }
    if (container.querySelector?.(HEART_SELECTOR) || container.matches?.(HEART_SELECTOR)) {
      attachHeartListeners(container);
      syncHearts();
    }
    if (container.querySelector?.(DRAWER_SELECTOR) || container.matches?.(DRAWER_SELECTOR)) {
      initDrawerTabs();
    }
  };

  const observeDomMutations = () => {
    const observer = new MutationObserver((mutations) => {
      let heartsUpdated = false;
      let wishlistUpdated = false;
      let tabsUpdated = false;
      let cartItemsUpdated = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(HEART_SELECTOR) || node.querySelector?.(HEART_SELECTOR)) {
            heartsUpdated = true;
          }
          if (node.matches?.(WISHLIST_CONTAINER_SELECTOR) || node.querySelector?.(WISHLIST_CONTAINER_SELECTOR)) {
            wishlistUpdated = true;
          }
          if (
            node.matches?.(DRAWER_SELECTOR) ||
            node.querySelector?.(DRAWER_SELECTOR) ||
            node.matches?.('[data-tab-target]') ||
            node.querySelector?.('[data-tab-target]')
          ) {
            tabsUpdated = true;
          }
          if (node.matches?.('cart-drawer-items') || node.querySelector?.('cart-drawer-items')) {
            cartItemsUpdated = true;
          }
        });
      });

      if (heartsUpdated) {
        attachHeartListeners();
        syncHearts();
      }
      if (wishlistUpdated) {
        renderWishlist();
      }
      if (tabsUpdated) {
        initDrawerTabs();
      }
      if (cartItemsUpdated) {
        const drawer = getDrawer();
        if (drawer) {
          updateDrawerLabels(drawer, getActiveDrawerTab(drawer));
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  const init = () => {
    const drawer = getDrawer();
    const labelSource = drawer?.querySelector('[data-cart-title][data-wishlist]');
    const wishlistLabel = labelSource?.dataset?.wishlistTitle || labelSource?.dataset?.wishlist;
    const closeLabel = drawer?.querySelector('.drawer__close')?.getAttribute('aria-label');

    window.wishlistStrings = {
      add: 'Add to wishlist',
      remove: 'Remove from wishlist',
      addToCart: 'Add to cart',
      sizeLabel: 'Select a size',
      soldOut: 'Sold out',
      close: 'Close',
      wishlist: 'Wishlist',
      ...window.wishlistStrings,
    };

    if (wishlistLabel) {
      window.wishlistStrings.wishlist = wishlistLabel;
    }
    if (closeLabel) {
      window.wishlistStrings.close = closeLabel;
    }

    attachHeartListeners();
    syncHearts();
    renderWishlist();
    initDrawerTabs();
    registerWishlistContainerListeners();
    registerSwatchSyncListener();

    document.addEventListener('shopify:section:load', onSectionLoad);
    observeDomMutations();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
