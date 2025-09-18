(() => {
  const STORAGE_KEY = 'theme-wishlist-cache';
  const HEART_SELECTOR = '.wishlist-toggle';
  const DRAWER_SELECTOR = 'cart-drawer';
  const WISHLIST_CONTAINER_SELECTOR = '[data-wishlist-container]';
  const TAB_CART = 'cart';
  const TAB_WISHLIST = 'wishlist';

  let cachedWishlist = null;
  const htmlDecoder = document.createElement('textarea');

  const decodeHtml = (value) => {
    if (typeof value !== 'string') return '';
    htmlDecoder.innerHTML = value;
    return htmlDecoder.value;
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
        cachedWishlist = parsed;
        return parsed.slice();
      }
    } catch (error) {
      console.warn('Unable to read wishlist from storage', error);
    }

    cachedWishlist = [];
    return [];
  };

  const saveWishlist = (items) => {
    cachedWishlist = items.slice();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedWishlist));
    } catch (error) {
      console.warn('Unable to persist wishlist', error);
    }
    renderWishlist();
    syncHearts();
  };

  const findWishlistItem = (handle) => loadWishlist().find((item) => item.handle === handle);

  const addToWishlist = (product) => {
    if (!product?.handle) return;
    const wishlist = loadWishlist();
    const existingIndex = wishlist.findIndex((item) => item.handle === product.handle);
    if (existingIndex >= 0) {
      wishlist[existingIndex] = product;
      saveWishlist(wishlist);
      return;
    }
    wishlist.push(product);
    saveWishlist(wishlist);
  };

  const removeFromWishlist = (handle) => {
    if (!handle) return;
    const wishlist = loadWishlist().filter((item) => item.handle !== handle);
    saveWishlist(wishlist);
  };

  const getCardFromHeart = (button) => button?.closest('.product-card-wrapper');

  const getProductFromCard = (card) => {
    if (!card) return null;
    const handle = card.dataset.productHandle;
    if (!handle) return null;

    const variants = parseJSONAttribute(card.dataset.variants, []);
    const sizeIndex = Number.parseInt(card.dataset.sizeIndex, 10);

    return {
      handle,
      title: card.dataset.productTitle || '',
      url: card.dataset.productUrl || '',
      image: card.dataset.productImage || '',
      price: card.dataset.productPrice || '',
      sizeIndex: Number.isNaN(sizeIndex) ? -1 : sizeIndex,
      variants: variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        available: variant.available,
        options: variant.options,
        price: variant.price,
      })),
    };
  };

  const handleHeartClick = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const card = getCardFromHeart(button);
    const product = getProductFromCard(card);
    if (!product) return;

    const exists = !!findWishlistItem(product.handle);
    if (exists) {
      removeFromWishlist(product.handle);
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
    const handles = new Set(loadWishlist().map((item) => item.handle));
    document.querySelectorAll(HEART_SELECTOR).forEach((button) => {
      const card = getCardFromHeart(button);
      const handle = card?.dataset.productHandle;
      const active = handle ? handles.has(handle) : false;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('aria-label', active ? window.wishlistStrings?.remove || 'Remove from wishlist' : window.wishlistStrings?.add || 'Add to wishlist');
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

    const heading = drawer.querySelector('.drawer__heading');
    if (heading) {
      const cartTitle = heading.dataset.cartTitle || heading.textContent.trim();
      heading.dataset.cartTitle = cartTitle;
      const wishlistTitle =
        heading.dataset.wishlistTitle || heading.dataset.wishlist || window.wishlistStrings?.wishlist || 'Wishlist';
      heading.dataset.wishlistTitle = wishlistTitle;
      heading.dataset.cartCount = String(cartCount);
      heading.dataset.wishlistCount = String(wishlistCount);
      const isWishlist = activeTab === TAB_WISHLIST;
      const label = isWishlist ? wishlistTitle : cartTitle;
      const count = isWishlist ? wishlistCount : cartCount;
      heading.textContent = formatDrawerLabel(label, count);
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

  const getAvailableVariants = (item) => item.variants.filter((variant) => variant.available);

  const createWishlistRowMarkup = (item) => {
    const imageMarkup = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="wishlist-item__placeholder" aria-hidden="true"></div>`;

    const priceMarkup = item.price
      ? `<span class="price price--end">${escapeHtml(item.price)}</span>`
      : '';

    const availableVariants = getAvailableVariants(item);
    const sizeSelectorId = `WishlistSize-${escapeHtml(item.handle)}`;

    let sizeSelectorMarkup = '';
    if (item.sizeIndex >= 0) {
      if (availableVariants.length) {
        const options = availableVariants
          .map((variant) => {
            const label = variant.options?.[item.sizeIndex] || variant.title;
            return `<option value="${variant.id}">${escapeHtml(label)}</option>`;
          })
          .join('');
        sizeSelectorMarkup = `
          <div class="wishlist-item__size-selector" data-size-selector hidden>
            <label class="wishlist-item__size-label" for="${sizeSelectorId}">${escapeHtml(window.wishlistStrings?.sizeLabel || 'Select a size')}</label>
            <div class="wishlist-item__size-control">
              <select id="${sizeSelectorId}" data-size-select>
                ${options}
              </select>
              <button type="button" class="button button--primary wishlist-item__confirm" data-wishlist-confirm>
                ${escapeHtml(window.wishlistStrings?.confirm || 'Add')}
              </button>
            </div>
          </div>`;
      } else {
        sizeSelectorMarkup = `<p class="wishlist-item__sold-out">${escapeHtml(window.wishlistStrings?.soldOut || 'Sold out')}</p>`;
      }
    }

    const hasAvailableVariant = availableVariants.length > 0;

    return `
      <td class="cart-item__media">
        <a href="${escapeHtml(item.url)}" class="cart-item__link" tabindex="-1" aria-hidden="true"></a>
        ${imageMarkup}
      </td>
      <td class="cart-item__details">
        <a href="${escapeHtml(item.url)}" class="cart-item__name h4 break">${escapeHtml(item.title)}</a>
        <button type="button" class="link wishlist-item__remove" data-wishlist-remove>
          ${escapeHtml(window.wishlistStrings?.remove || 'Remove')}
        </button>
      </td>
      <td class="cart-item__totals right">
        <div class="cart-item__price-wrapper">
          ${priceMarkup}
        </div>
      </td>
      <td class="cart-item__actions">
        <button type="button" class="button button--tertiary wishlist-item__add" data-wishlist-add ${hasAvailableVariant ? '' : 'disabled'}>
          ${escapeHtml(window.wishlistStrings?.addToCart || 'Add to cart')}
        </button>
        ${sizeSelectorMarkup}
      </td>`;
  };

  const renderWishlist = () => {
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    if (!containers.length) return;
    const items = loadWishlist();

    containers.forEach((container) => {
      const table = container.querySelector('[data-wishlist-table]');
      const list = container.querySelector('[data-wishlist-items]');
      const emptyState = container.querySelector('[data-wishlist-empty]');
      if (!list || !table || !emptyState) return;

      list.innerHTML = '';

      if (!items.length) {
        container.classList.add('is-empty');
        table.hidden = true;
        emptyState.hidden = false;
        return;
      }

      container.classList.remove('is-empty');
      table.hidden = false;
      emptyState.hidden = true;

      items.forEach((item) => {
        const row = document.createElement('tr');
        row.className = 'cart-item wishlist-item';
        row.dataset.wishlistItem = 'true';
        row.dataset.handle = item.handle;
        row.wishlistItem = item;
        row.innerHTML = createWishlistRowMarkup(item);
        list.appendChild(row);
      });
    });

    const drawer = getDrawer();
    if (drawer) {
      updateDrawerLabels(drawer, getActiveDrawerTab(drawer));
    }
  };

  const getVariantForDirectAdd = (item) => {
    const available = getAvailableVariants(item);
    if (available.length) return available[0];
    return item.variants[0];
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
      .then(() => refreshCartDrawer())
      .then(() => setActiveDrawerTab(TAB_CART))
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (addButton) addButton.disabled = false;
        const selector = row?.querySelector('[data-size-selector]');
        if (selector) selector.hidden = true;
      });
  };

  const handleRemoveClick = (button) => {
    const row = button.closest('[data-wishlist-item]');
    if (!row) return;
    removeFromWishlist(row.dataset.handle);
  };

  const handleAddClick = (button) => {
    const row = button.closest('[data-wishlist-item]');
    if (!row) return;
    const item = row.wishlistItem || findWishlistItem(row.dataset.handle);
    if (!item) return;

    const availableVariants = getAvailableVariants(item);
    if (!availableVariants.length) return;

    if (item.sizeIndex >= 0) {
      const selector = row.querySelector('[data-size-selector]');
      if (selector) {
        selector.hidden = !selector.hidden;
        if (!selector.hidden) {
          const select = selector.querySelector('[data-size-select]');
          select?.focus();
        }
      }
      return;
    }

    const variant = getVariantForDirectAdd(item);
    addVariantToCart(variant?.id, row);
  };

  const handleConfirmClick = (button) => {
    const row = button.closest('[data-wishlist-item]');
    if (!row) return;
    const item = row.wishlistItem || findWishlistItem(row.dataset.handle);
    if (!item) return;

    const select = row.querySelector('[data-size-select]');
    const variantId = select?.value;
    if (!variantId) return;
    addVariantToCart(variantId, row);
  };

  const handleWishlistClicks = (event) => {
    const removeButton = event.target.closest('[data-wishlist-remove]');
    if (removeButton) {
      event.preventDefault();
      handleRemoveClick(removeButton);
      return;
    }

    const confirmButton = event.target.closest('[data-wishlist-confirm]');
    if (confirmButton) {
      event.preventDefault();
      handleConfirmClick(confirmButton);
      return;
    }

    const addButton = event.target.closest('[data-wishlist-add]');
    if (addButton) {
      event.preventDefault();
      handleAddClick(addButton);
    }
  };

  const registerWishlistContainerListeners = () => {
    document.addEventListener('click', handleWishlistClicks);
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
    const heading = drawer?.querySelector('.drawer__heading');
    const wishlistLabel = heading?.dataset?.wishlistTitle || heading?.dataset?.wishlist;

    window.wishlistStrings = {
      add: 'Add to wishlist',
      remove: 'Remove from wishlist',
      addToCart: 'Add to cart',
      confirm: 'Add',
      sizeLabel: 'Select a size',
      soldOut: 'Sold out',
      wishlist: 'Wishlist',
      ...window.wishlistStrings,
    };

    if (wishlistLabel) {
      window.wishlistStrings.wishlist = wishlistLabel;
    }

    attachHeartListeners();
    syncHearts();
    renderWishlist();
    initDrawerTabs();
    registerWishlistContainerListeners();

    document.addEventListener('shopify:section:load', onSectionLoad);
    observeDomMutations();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
