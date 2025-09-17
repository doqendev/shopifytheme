(() => {
  const STORAGE_KEY = 'theme:wishlist';
  const HEART_SELECTOR = '.il-wishlist-btn';
  const doc = document;
  const subscribers = new Set();
  const productCache = new Map();

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore write errors (private mode, etc.)
    }
  }

  let items = loadState();

  const cloneItems = () => items.map((item) => ({ ...item }));

  function findIndex(productId) {
    const id = String(productId || '');
    return items.findIndex((entry) => String(entry.productId) === id);
  }

  function hasItem(productId) {
    return findIndex(productId) !== -1;
  }

  function persist() {
    saveState(items);
  }

  function setButtonState(button) {
    const active = hasItem(button.dataset.productId);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
  }

  function updateButtons() {
    qsa(HEART_SELECTOR).forEach(setButtonState);
  }

  function notifySubscribers() {
    const detail = { items: cloneItems() };
    subscribers.forEach((callback) => {
      try {
        callback(detail.items);
      } catch (e) {
        console.error(e);
      }
    });
    doc.dispatchEvent(new CustomEvent('theme:wishlist:updated', { detail }));
  }

  function removeItem(productId) {
    const index = findIndex(productId);
    if (index === -1) return;
    items.splice(index, 1);
    persist();
    updateButtons();
    notifySubscribers();
  }

  function addItemFromButton(button) {
    const productId = String(button.dataset.productId || '');
    if (!productId || hasItem(productId)) return;

    const item = {
      productId,
      variantId: button.dataset.variantId ? String(button.dataset.variantId) : '',
      handle: button.dataset.handle || '',
      title: button.dataset.title || '',
      image: button.dataset.image || '',
      url: button.dataset.url || '',
      price: button.dataset.price || '',
    };

    items.push(item);
    persist();
    updateButtons();
    notifySubscribers();
  }

  function toggleFromButton(button) {
    const productId = String(button.dataset.productId || '');
    if (!productId) return;

    if (hasItem(productId)) {
      removeItem(productId);
    } else {
      addItemFromButton(button);
    }
  }

  function heartClickHandler(event) {
    event.preventDefault();
    toggleFromButton(event.currentTarget);
  }

  function initHeartButton(button) {
    if (button.dataset.wishlistInit === '1') return;
    button.dataset.wishlistInit = '1';
    button.addEventListener('click', heartClickHandler);
    setButtonState(button);
  }

  function initHeartButtons() {
    qsa(HEART_SELECTOR).forEach(initHeartButton);
  }

  const observer = new MutationObserver(() => initHeartButtons());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  async function fetchProduct(handle) {
    const key = String(handle || '');
    if (!key) return Promise.reject(new Error('Missing product handle'));
    if (productCache.has(key)) return productCache.get(key);

    const request = fetch(`/products/${key}.js`).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load product: ${key}`);
      }
      return response.json();
    });

    productCache.set(key, request);
    return request;
  }

  function subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  const ThemeWishlist = {
    getItems: () => cloneItems(),
    hasItem: (productId) => hasItem(productId),
    removeItem: (productId) => removeItem(productId),
    addFromButton: (button) => addItemFromButton(button),
    toggleFromButton: (button) => toggleFromButton(button),
    subscribe,
    fetchProduct,
    clearCache: () => productCache.clear(),
  };

  window.ThemeWishlist = ThemeWishlist;

  initHeartButtons();
  updateButtons();

  doc.addEventListener('DOMContentLoaded', () => {
    initHeartButtons();
    updateButtons();
    notifySubscribers();
  });
})();
