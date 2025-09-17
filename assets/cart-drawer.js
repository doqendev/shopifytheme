class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();

    this.activeTab = 'cart';
    this.handleWishlistUpdate = this.handleWishlistUpdate.bind(this);
    document.addEventListener('theme:wishlist:updated', this.handleWishlistUpdate);
  }

  connectedCallback() {
    this.initializeDrawerUI();
  }

  disconnectedCallback() {
    document.removeEventListener('theme:wishlist:updated', this.handleWishlistUpdate);
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    // Ensure drawer state matches the updated cart item count
    this.classList.toggle('is-empty', parsedState.item_count === 0);
    const inner = this.querySelector('.drawer__inner');
    if (inner && inner.classList.contains('is-empty')) inner.classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    this.initializeDrawerUI();
    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  initializeDrawerUI() {
    this.setupTabs();
    this.setupWishlistPanel();
    this.renderWishlist();
  }

  setupTabs() {
    if (this.tabButtons) {
      this.tabButtons.forEach((button) => button.removeEventListener('click', this.onTabClick));
    }

    this.tabButtons = Array.from(this.querySelectorAll('[data-tab-target]'));
    this.tabPanels = Array.from(this.querySelectorAll('[data-tab-panel]'));

    if (!this.onTabClick) {
      this.onTabClick = (event) => {
        const target = event.currentTarget?.dataset?.tabTarget;
        this.setActiveTab(target);
      };
    }

    if (this.tabButtons) {
      this.tabButtons.forEach((button) => button.addEventListener('click', this.onTabClick));
    }

    if (!this.activeTab) {
      this.activeTab = 'cart';
    }

    this.setActiveTab(this.activeTab, { focus: false });
  }

  setActiveTab(tab, { focus = false } = {}) {
    if (!this.tabButtons || this.tabButtons.length === 0) return;

    const availableTabs = this.tabButtons.map((button) => button.dataset.tabTarget);
    const nextTab = availableTabs.includes(tab) ? tab : availableTabs[0];
    this.activeTab = nextTab;

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tabTarget === nextTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive && focus) {
        button.focus();
      }
    });

    if (this.tabPanels) {
      this.tabPanels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === nextTab;
        panel.classList.toggle('is-active', isActive);
        panel.toggleAttribute('hidden', !isActive);
      });
    }
  }

  setupWishlistPanel() {
    const panel = this.querySelector('[data-tab-panel="wishlist"]');

    if (this.wishlistPanel && this.onWishlistClick) {
      this.wishlistPanel.removeEventListener('click', this.onWishlistClick);
    }

    this.wishlistPanel = panel;

    if (!this.onWishlistClick) {
      this.onWishlistClick = (event) => this.handleWishlistClick(event);
    }

    if (panel) {
      panel.addEventListener('click', this.onWishlistClick);
    }
  }

  handleWishlistClick(event) {
    const target = event.target;
    if (!target) return;

    const removeButton = target.closest('[data-wishlist-remove]');
    if (removeButton) {
      event.preventDefault();
      const productId = removeButton.dataset.productId || removeButton.closest('[data-wishlist-item]')?.dataset.productId;
      if (window.ThemeWishlist && productId) {
        window.ThemeWishlist.removeItem(productId);
      }
      return;
    }

    const addButton = target.closest('[data-wishlist-add]');
    if (addButton) {
      event.preventDefault();
      this.openSizePicker(addButton);
      return;
    }

    const sizeButton = target.closest('[data-wishlist-size]');
    if (sizeButton) {
      event.preventDefault();
      this.onWishlistSize(sizeButton);
    }
  }

  openSizePicker(button) {
    const item = button.closest('[data-wishlist-item]');
    if (!item) return;
    const picker = item.querySelector('[data-wishlist-sizes]');
    if (!picker) return;

    const willOpen = !picker.classList.contains('is-open');
    picker.classList.toggle('is-open', willOpen);
    picker.toggleAttribute('hidden', !willOpen);
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }

  onWishlistSize(button) {
    const variantId = button.dataset.variantId;
    const item = button.closest('[data-wishlist-item]');
    if (!item || !variantId) return;

    const productId = item.dataset.productId;
    this.addWishlistVariantToCart(variantId, productId, item, button);
  }

  async addWishlistVariantToCart(variantId, productId, item, triggerButton) {
    const errorElement = item.querySelector('[data-wishlist-error]');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.hidden = true;
    }

    if (triggerButton) {
      triggerButton.classList.add('is-loading');
      triggerButton.setAttribute('aria-disabled', 'true');
    }

    try {
      const config = fetchConfig();
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.body = JSON.stringify({
        id: variantId,
        quantity: 1,
        sections: this.getSectionsToRender().map((section) => section.id),
        sections_url: window.location.pathname,
      });

      const response = await fetch(`${routes.cart_add_url}`, config);
      const data = await response.json();

      if (data.status) {
        if (errorElement) {
          errorElement.textContent = data.message || data.description || 'Unable to add this item to your cart.';
          errorElement.hidden = false;
        }
        return;
      }

      if (window.ThemeWishlist && productId) {
        window.ThemeWishlist.removeItem(productId);
      }

      this.setActiveTab('cart');
      this.renderContents(data);
    } catch (error) {
      console.error(error);
      if (errorElement) {
        errorElement.textContent = 'Something went wrong. Please try again.';
        errorElement.hidden = false;
      }
    } finally {
      if (triggerButton) {
        triggerButton.classList.remove('is-loading');
        triggerButton.removeAttribute('aria-disabled');
      }
    }
  }

  async renderWishlist() {
    const container = this.querySelector('[data-wishlist-container]');
    const badge = this.querySelector('[data-wishlist-count]');
    const items = this.getWishlistItems();

    if (badge) {
      badge.textContent = items.length;
    }

    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<p class="cart-drawer__wishlist-empty">Your wishlist is empty.</p>';
      return;
    }

    const token = Symbol('wishlist-render');
    this.wishlistRenderToken = token;
    container.innerHTML = '<p class="cart-drawer__wishlist-loading">Loading your wishlist…</p>';

    const fragments = await Promise.all(
      items.map(async (item) => {
        try {
          if (!window.ThemeWishlist || typeof window.ThemeWishlist.fetchProduct !== 'function') {
            return this.buildWishlistItem(item, null);
          }
          const product = await window.ThemeWishlist.fetchProduct(item.handle);
          return this.buildWishlistItem(item, product);
        } catch (error) {
          console.error(error);
          return this.buildWishlistItem(item, null, { unavailable: true });
        }
      })
    );

    if (this.wishlistRenderToken !== token) return;

    container.innerHTML = fragments.join('');
  }

  getWishlistItems() {
    if (!window.ThemeWishlist || typeof window.ThemeWishlist.getItems !== 'function') {
      return [];
    }
    return window.ThemeWishlist.getItems();
  }

  buildWishlistItem(item, product, options = {}) {
    const productTitle = item.title || product?.title || '';
    const title = this.escapeHtml(productTitle);
    const productUrl = item.url || (product?.handle ? `/products/${product.handle}` : '#');
    const url = this.escapeHtml(productUrl);
    const imageSrc = item.image || product?.featured_image || product?.images?.[0] || '';
    const image = this.escapeHtml(imageSrc);
    const price = item.price || this.formatPrice(product?.price);

    const variantOptions = this.getVariantSizeOptions(product);

    if (options.unavailable || variantOptions.variants.length === 0) {
      return `
        <div class="cart-drawer__wishlist-item" data-wishlist-item data-product-id="${this.escapeHtml(item.productId)}" data-handle="${this.escapeHtml(item.handle || '')}">
          <div class="cart-drawer__wishlist-media">
            ${image ? `<a href="${url}" class="cart-drawer__wishlist-image-link"><img class="cart-drawer__wishlist-image" src="${image}" alt="${title}" loading="lazy"></a>` : ''}
            <button type="button" class="button button--tertiary cart-drawer__wishlist-remove" data-wishlist-remove data-product-id="${this.escapeHtml(item.productId)}">Remove</button>
          </div>
          <div class="cart-drawer__wishlist-details">
            <a class="cart-drawer__wishlist-title" href="${url}">${title}</a>
            ${price ? `<p class="cart-drawer__wishlist-price">${price}</p>` : ''}
            <p class="cart-drawer__wishlist-error">This product is currently unavailable.</p>
          </div>
        </div>
      `;
    }

    const sizeButtons = variantOptions.variants
      .map(
        (variant) => `
          <button type="button" class="cart-drawer__wishlist-size-button" data-wishlist-size data-variant-id="${variant.id}" data-product-id="${this.escapeHtml(item.productId)}">
            ${this.escapeHtml(variant.label)}
          </button>
        `
      )
      .join('');

    return `
      <div class="cart-drawer__wishlist-item" data-wishlist-item data-product-id="${this.escapeHtml(item.productId)}" data-handle="${this.escapeHtml(item.handle || '')}">
        <div class="cart-drawer__wishlist-media">
          ${image ? `<a href="${url}" class="cart-drawer__wishlist-image-link"><img class="cart-drawer__wishlist-image" src="${image}" alt="${title}" loading="lazy"></a>` : ''}
          <button type="button" class="button button--tertiary cart-drawer__wishlist-remove" data-wishlist-remove data-product-id="${this.escapeHtml(item.productId)}">Remove</button>
        </div>
        <div class="cart-drawer__wishlist-details">
          <a class="cart-drawer__wishlist-title" href="${url}">${title}</a>
          ${price ? `<p class="cart-drawer__wishlist-price">${price}</p>` : ''}
          <div class="cart-drawer__wishlist-actions">
            <button type="button" class="button button--primary" data-wishlist-add aria-expanded="false" data-product-id="${this.escapeHtml(item.productId)}">
              Add to cart
            </button>
            <div class="cart-drawer__wishlist-sizes" data-wishlist-sizes hidden>
              <p class="cart-drawer__wishlist-size-label">Select a size:</p>
              <div class="cart-drawer__wishlist-size-grid">
                ${sizeButtons}
              </div>
              <p class="cart-drawer__wishlist-error" data-wishlist-error hidden></p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getVariantSizeOptions(product) {
    const result = { variants: [] };
    if (!product || !Array.isArray(product?.variants)) {
      return result;
    }

    const options = Array.isArray(product.options) ? product.options : [];
    const sizeIndex = options.findIndex((option) => /size/i.test(option));
    const seen = new Set();

    product.variants.forEach((variant) => {
      if (!variant.available) return;
      const label = sizeIndex >= 0 ? variant.options[sizeIndex] : variant.title;
      const key = label || variant.id;
      if (seen.has(key)) return;
      seen.add(key);
      result.variants.push({ id: variant.id, label: label || 'Default' });
    });

    if (result.variants.length === 0 && product.variants.length > 0) {
      const variant = product.variants[0];
      result.variants.push({ id: variant.id, label: variant.title || 'Default' });
    }

    return result;
  }

  escapeHtml(value) {
    if (value == null) return '';
    return String(value).replace(/[&<>"']/g, (char) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return map[char] || char;
    });
  }

  formatPrice(cents) {
    if (typeof cents !== 'number') return '';
    if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
      const moneyFormat = window.theme?.moneyFormat || window.shopMoneyFormat || window.moneyFormat;
      if (moneyFormat) {
        return Shopify.formatMoney(cents, moneyFormat);
      }
    }

    const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency,
      }).format(cents / 100);
    } catch (error) {
      return (cents / 100).toFixed(2);
    }
  }

  handleWishlistUpdate() {
    this.renderWishlist();
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
