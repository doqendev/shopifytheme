(function () {
  const STORAGE_KEY = 'shopify-wishlist';
  const TAB_STORAGE_KEY = 'shopify-wishlist-active-tab';
  const productCache = new Map();
  let handlesSet = loadHandles();

  function loadHandles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((value) => typeof value === 'string' && value.trim() !== ''));
      }
    } catch (error) {
      console.warn('Unable to load wishlist from storage', error);
    }
    return new Set();
  }

  function persistHandles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(handlesSet)));
    } catch (error) {
      console.warn('Unable to save wishlist to storage', error);
    }
  }

  function getHandles() {
    return Array.from(handlesSet);
  }

  function escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return value.replace(/([\0-\x1F\x7F"#%&'()*+,./:;<=>?@\[\]`{|}~])/g, '\\$1');
  }

  function updateHeartForHandle(handle) {
    document
      .querySelectorAll(`.wishlist-toggle[data-product-handle="${escapeSelector(handle)}"]`)
      .forEach((button) => {
        const isActive = handlesSet.has(handle);
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.setAttribute(
          'aria-label',
          isActive
            ? button.getAttribute('data-label-remove') || 'Remove from wishlist'
            : button.getAttribute('data-label-add') || 'Add to wishlist'
        );
      });
  }

  function updateAllHearts(root = document) {
    root.querySelectorAll('.wishlist-toggle[data-product-handle]').forEach((button) => {
      if (!button.hasAttribute('data-label-add')) {
        button.setAttribute('data-label-add', button.getAttribute('aria-label') || 'Add to wishlist');
      }
      if (!button.hasAttribute('data-label-remove')) {
        button.setAttribute('data-label-remove', 'Remove from wishlist');
      }
      const handle = button.dataset.productHandle;
      if (!handle) return;
      const isActive = handlesSet.has(handle);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.setAttribute('aria-label', isActive ? button.dataset.labelRemove : button.dataset.labelAdd);
    });
  }

  async function fetchProduct(handle) {
    if (productCache.has(handle)) {
      return productCache.get(handle);
    }
    try {
      const encodedHandle = encodeURIComponent(handle);
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}products/${encodedHandle}.js`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      productCache.set(handle, data);
      return data;
    } catch (error) {
      console.error('Unable to fetch product for wishlist', error);
      return null;
    }
  }

  function getCurrency() {
    const drawer = document.querySelector('cart-drawer');
    return (
      drawer?.dataset?.currency ||
      window.Shopify?.currency?.active ||
      document.documentElement.getAttribute('data-shopify-currency') ||
      'USD'
    );
  }

  function formatPrice(cents) {
    if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
      try {
        if (window.theme && (window.theme.moneyFormat || window.theme.money_format)) {
          return Shopify.formatMoney(cents, window.theme.moneyFormat || window.theme.money_format);
        }
        return Shopify.formatMoney(cents);
      } catch (error) {
        console.warn('Shopify.formatMoney failed, falling back to Intl', error);
      }
    }
    const currency = getCurrency();
    const amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(document.documentElement.lang || undefined, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  function getPanelStrings() {
    const panel = document.querySelector('[data-wishlist-panel]');
    return {
      addLabel: panel?.dataset?.wishlistAddLabel || 'Add to cart',
      selectSizeLabel: panel?.dataset?.wishlistSelectSizeLabel || 'Select a size',
      outOfStockLabel: panel?.dataset?.wishlistOutOfStockLabel || 'Out of stock',
      removeLabel: panel?.dataset?.wishlistRemoveLabel || 'Remove from wishlist',
    };
  }

  function createSizeButton(label, variantId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wishlist-size-button';
    button.dataset.wishlistVariant = String(variantId);
    button.textContent = label;
    return button;
  }

  function buildWishlistItem(product) {
    const item = document.createElement('li');
    item.className = 'wishlist-item';
    item.dataset.handle = product.handle;

    const media = document.createElement('div');
    media.className = 'wishlist-item__media';

    if (product.featured_image) {
      const image = document.createElement('img');
      image.src = product.featured_image;
      image.alt = product.title;
      image.loading = 'lazy';
      media.appendChild(image);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'wishlist-item__remove';
    removeButton.dataset.wishlistRemove = product.handle;
    removeButton.setAttribute('aria-label', getPanelStrings().removeLabel);
    removeButton.textContent = '×';
    media.appendChild(removeButton);

    const details = document.createElement('div');
    details.className = 'wishlist-item__details';

    const nameLink = document.createElement('a');
    nameLink.className = 'wishlist-item__name';
    nameLink.href = product.url || `/products/${product.handle}`;
    nameLink.textContent = product.title;
    details.appendChild(nameLink);

    const priceEl = document.createElement('div');
    priceEl.className = 'wishlist-item__price';
    const priceCents = product.price_min ?? product.price ?? 0;
    priceEl.textContent = formatPrice(priceCents);
    details.appendChild(priceEl);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'button button--primary wishlist-item__add';
    addButton.dataset.wishlistAdd = product.handle;
    addButton.textContent = getPanelStrings().addLabel;
    details.appendChild(addButton);

    const sizesWrapper = document.createElement('div');
    sizesWrapper.className = 'wishlist-item__sizes';
    sizesWrapper.dataset.wishlistSizes = '';
    sizesWrapper.hidden = true;

    const instruction = document.createElement('p');
    instruction.className = 'wishlist-item__sizes-label';
    instruction.textContent = getPanelStrings().selectSizeLabel;
    sizesWrapper.appendChild(instruction);

    const sizeOptions = document.createElement('div');
    sizeOptions.className = 'wishlist-item__size-options';

    const sizeIndex = Array.isArray(product.options)
      ? product.options.findIndex((option) => /size/i.test(option))
      : -1;
    const seenSizes = new Set();

    const availableVariants = Array.isArray(product.variants)
      ? product.variants.filter((variant) => variant.available)
      : [];

    if (sizeIndex !== -1) {
      availableVariants.forEach((variant) => {
        const label = variant.options?.[sizeIndex] || variant.title;
        if (!label || seenSizes.has(label)) return;
        seenSizes.add(label);
        sizeOptions.appendChild(createSizeButton(label, variant.id));
      });
    } else {
      availableVariants.forEach((variant) => {
        sizeOptions.appendChild(createSizeButton(variant.title, variant.id));
      });
    }

    const hasAvailableVariant = sizeOptions.querySelector('[data-wishlist-variant]');

    if (!sizeOptions.children.length) {
      const outOfStock = document.createElement('p');
      outOfStock.className = 'wishlist-item__sizes-empty';
      outOfStock.textContent = getPanelStrings().outOfStockLabel;
      sizeOptions.appendChild(outOfStock);
    }

    sizesWrapper.appendChild(sizeOptions);
    details.appendChild(sizesWrapper);

    if (!hasAvailableVariant) {
      addButton.disabled = true;
    }

    const error = document.createElement('p');
    error.className = 'wishlist-item__error';
    error.hidden = true;
    details.appendChild(error);

    item.appendChild(media);
    item.appendChild(details);

    return item;
  }

  function clearWishlistList(listElement) {
    while (listElement.firstChild) {
      listElement.removeChild(listElement.firstChild);
    }
  }

  async function renderWishlistDrawer() {
    const drawer = document.querySelector('cart-drawer');
    if (!drawer) return;
    const panel = drawer.querySelector('[data-wishlist-panel]');
    const listElement = panel?.querySelector('[data-wishlist-items]');
    const emptyElement = panel?.querySelector('[data-wishlist-empty]');

    if (!panel || !listElement || !emptyElement) return;

    const handles = getHandles();
    if (!handles.length) {
      clearWishlistList(listElement);
      emptyElement.hidden = false;
      panel.setAttribute('data-count', '0');
      return;
    }

    emptyElement.hidden = true;
    clearWishlistList(listElement);

    const products = await Promise.all(handles.map((handle) => fetchProduct(handle)));
    products.forEach((product) => {
      if (!product) return;
      const item = buildWishlistItem(product);
      listElement.appendChild(item);
    });

    if (!listElement.children.length) {
      emptyElement.hidden = false;
      panel.setAttribute('data-count', '0');
    } else {
      panel.setAttribute('data-count', String(listElement.children.length));
    }
  }

  function toggleWishlist(handle) {
    if (handlesSet.has(handle)) {
      handlesSet.delete(handle);
    } else {
      handlesSet.add(handle);
    }
    persistHandles();
    updateHeartForHandle(handle);
    renderWishlistDrawer();
  }

  function removeFromWishlist(handle) {
    if (!handlesSet.has(handle)) return;
    handlesSet.delete(handle);
    persistHandles();
    updateHeartForHandle(handle);
    renderWishlistDrawer();
  }

  function setActiveTab(tabName) {
    const drawer = document.querySelector('cart-drawer');
    if (!drawer) return;
    const buttons = drawer.querySelectorAll('[data-drawer-tab]');
    const panels = drawer.querySelectorAll('[data-drawer-panel]');
    let targetName = tabName;
    if (!Array.from(buttons).some((btn) => btn.dataset.drawerTab === targetName)) {
      targetName = 'cart';
    }
    buttons.forEach((button) => {
      const isActive = button.dataset.drawerTab === targetName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.drawerPanel === targetName;
      panel.classList.toggle('is-active', isActive);
      panel.toggleAttribute('hidden', !isActive);
    });
    try {
      localStorage.setItem(TAB_STORAGE_KEY, targetName);
    } catch (error) {
      console.warn('Unable to persist cart drawer tab selection', error);
    }
  }

  function restoreActiveTab() {
    try {
      const stored = localStorage.getItem(TAB_STORAGE_KEY);
      if (stored) {
        setActiveTab(stored);
        return;
      }
    } catch (error) {
      console.warn('Unable to read cart drawer tab state', error);
    }
    setActiveTab('cart');
  }

  function showSizeSelector(item) {
    if (!item) return;
    document.querySelectorAll('.wishlist-item.show-sizes').forEach((active) => {
      if (active !== item) {
        active.classList.remove('show-sizes');
        const sizes = active.querySelector('[data-wishlist-sizes]');
        if (sizes) sizes.hidden = true;
      }
    });
    item.classList.toggle('show-sizes');
    const sizes = item.querySelector('[data-wishlist-sizes]');
    if (sizes) {
      sizes.hidden = !item.classList.contains('show-sizes');
    }
  }

  function setWishlistError(item, message) {
    const error = item?.querySelector('.wishlist-item__error');
    if (!error) return;
    if (message) {
      error.textContent = message;
      error.hidden = false;
    } else {
      error.textContent = '';
      error.hidden = true;
    }
  }

  async function addVariantToCart(variantId, item) {
    const cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);

    if (cart && typeof cart.getSectionsToRender === 'function') {
      const sections = cart.getSectionsToRender();
      formData.append('sections', sections.map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      if (typeof cart.setActiveElement === 'function') {
        cart.setActiveElement(document.activeElement);
      }
    }

    config.body = formData;

    try {
      const response = await fetch(`${routes.cart_add_url}`, config);
      const data = await response.json();
      if (data.status && data.status !== 200) {
        throw new Error(data.description || 'Unable to add to cart');
      }
      if (cart && typeof cart.renderContents === 'function') {
        cart.renderContents(data);
      } else {
        window.location = window.routes.cart_url;
      }
      publish(PUB_SUB_EVENTS.cartUpdate, { source: 'wishlist', cartData: data, productVariantId: variantId });
      restoreActiveTab();
      renderWishlistDrawer();
      if (item) {
        item.classList.remove('show-sizes');
        const sizes = item.querySelector('[data-wishlist-sizes]');
        if (sizes) sizes.hidden = true;
        setWishlistError(item, '');
      }
    } catch (error) {
      console.error('Unable to add wishlist variant to cart', error);
      if (item) {
        setWishlistError(item, error.message || 'Unable to add to cart.');
      }
    }
  }

  function handleDocumentClick(event) {
    const heartButton = event.target.closest('.wishlist-toggle');
    if (heartButton) {
      event.preventDefault();
      const handle = heartButton.dataset.productHandle;
      if (handle) {
        toggleWishlist(handle);
      }
      return;
    }

    const tabButton = event.target.closest('[data-drawer-tab]');
    if (tabButton) {
      event.preventDefault();
      setActiveTab(tabButton.dataset.drawerTab);
      return;
    }

    const removeButton = event.target.closest('[data-wishlist-remove]');
    if (removeButton) {
      event.preventDefault();
      const handle = removeButton.dataset.wishlistRemove;
      if (handle) {
        removeFromWishlist(handle);
      }
      return;
    }

    const addButton = event.target.closest('[data-wishlist-add]');
    if (addButton) {
      event.preventDefault();
      const item = addButton.closest('.wishlist-item');
      showSizeSelector(item);
      return;
    }

    const variantButton = event.target.closest('[data-wishlist-variant]');
    if (variantButton) {
      event.preventDefault();
      const variantId = variantButton.dataset.wishlistVariant;
      if (!variantId) return;
      const item = variantButton.closest('.wishlist-item');
      setWishlistError(item, '');
      variantButton.disabled = true;
      addVariantToCart(variantId, item).finally(() => {
        variantButton.disabled = false;
      });
    }
  }

  function handleSectionLoad(event) {
    updateAllHearts(event.target);
    renderWishlistDrawer();
    restoreActiveTab();
  }

  function init() {
    updateAllHearts();
    restoreActiveTab();
    renderWishlistDrawer();
  }

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('shopify:section:load', handleSectionLoad);
})();

