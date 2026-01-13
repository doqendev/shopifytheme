(() => {
  const STORAGE_KEY = 'theme-wishlist-cache';
  const HEART_SELECTOR = '.wishlist-toggle';
  const DRAWER_SELECTOR = 'cart-drawer';
  const WISHLIST_CONTAINER_SELECTOR = '[data-wishlist-container]';
  const WISHLIST_GRID_SELECTOR = '[data-wishlist-grid]';
  const TAB_CART = 'cart';
  const TAB_WISHLIST = 'wishlist';
  const HEART_ICONS = window.wishlistHeartIcons || {};
  const HEART_ICON_EMPTY = HEART_ICONS.empty || '/assets/empty-heart.svg';
  const HEART_ICON_FULL = HEART_ICONS.full || '/assets/full-heart.svg';


  let cachedWishlist = null;
  const htmlDecoder = document.createElement('textarea');
  let toastTimeout = null;
  let undoTimeout = null;
  let undoData = null;
  let currentSortOption = 'newest'; // newest, oldest, price-asc, price-desc, availability
  const MAX_WISHLIST_ITEMS = 50; // Maximum items allowed in wishlist
  const STORAGE_WARNING_THRESHOLD = 40; // Warn at 40 items (80% capacity)
  let syncDebounceTimer = null;
  let isSyncing = false;

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

  // ============================================================================
  // Account Sync System (Backend API Integration)
  // ============================================================================

  // Update sync status indicator
  const updateSyncStatus = (status, text) => {
    const statusEl = document.getElementById('wishlist-sync-status');
    if (!statusEl) return;

    statusEl.setAttribute('data-status', status);
    const textEl = statusEl.querySelector('.wishlist-sync-status__text');
    if (textEl) {
      textEl.textContent = text || 'Local';
    }
  };

  // Fetch wishlist from server (for logged-in users)
  const fetchServerWishlist = async (retryCount = 0) => {
    if (!window.customerId) return null;

    // Check cache first (valid for 5 minutes)
    const cacheKey = `wishlist_cache_${window.customerId}`;
    const cacheTimeKey = `wishlist_cache_time_${window.customerId}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);

    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) {
      try {
        updateSyncStatus('synced', 'Sincronizado');
        return JSON.parse(cached);
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    try {
      updateSyncStatus('syncing', 'A sincronizar...');

      // Add timeout to prevent long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `/apps/wishlist/proxy/api/wishlist/get?customerId=${window.customerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Got HTML instead of JSON - likely cold start
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchServerWishlist(retryCount + 1);
        }
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      const wishlist = data.wishlist || [];

      // Cache the result
      try {
        localStorage.setItem(cacheKey, JSON.stringify(wishlist));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch (e) {
        // localStorage might be full, ignore
      }

      updateSyncStatus('synced', 'Sincronizado');
      return wishlist;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Timeout - fail gracefully without retry
        updateSyncStatus('error', 'Timeout');
        return cached ? JSON.parse(cached) : null;
      }
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchServerWishlist(retryCount + 1);
      }
      updateSyncStatus('error', 'Erro de sincronização');
      return cached ? JSON.parse(cached) : null;
    }
  };

  // Strip unnecessary data from wishlist items before sending to server
  const stripWishlistData = (items) => {
    return items.map(item => {
      const stripped = {
        handle: item.handle,
        title: item.title,
        url: item.url,
        image: item.image,
        price: item.price,
        addedAt: item.addedAt,
        // Include color data for quick-add functionality
        colorValue: item.colorValue || '',
        colorKey: item.colorKey || '',
      };

      return stripped;
    });
  };

  // Save wishlist to server (for logged-in users)
  const saveServerWishlist = async (items) => {
    if (!window.customerId) return false;

    try {
      updateSyncStatus('syncing', 'A guardar...');

      // Strip heavy data before sending
      const lightweightItems = stripWishlistData(items);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/apps/wishlist/proxy/api/wishlist/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: window.customerId,
          wishlist: lightweightItems,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        updateSyncStatus('synced', 'Sincronizado');
        return true;
      } else {
        throw new Error(data.error || 'Failed to save wishlist');
      }
    } catch (error) {
      updateSyncStatus('error', 'Erro ao guardar');
      return false;
    }
  };

  // Merge local and server wishlists intelligently
  const mergeWishlists = (localItems, serverItems) => {
    const itemMap = new Map();
    const localMap = new Map();

    // Get current time for comparison
    const now = Date.now();
    const RECENT_ADD_THRESHOLD = 10000; // 10 seconds - items added in the last 10 seconds are considered "recent"

    // Build a map of local items for easy lookup
    localItems.forEach(item => {
      const key = getWishlistItemKey(item);
      localMap.set(key, item);
    });

    // Process server items (they're the source of truth for what should exist)
    serverItems.forEach(item => {
      const key = getWishlistItemKey(item);

      // If we have this item locally, prefer the local version (has full data)
      if (localMap.has(key)) {
        const localItem = localMap.get(key);
        itemMap.set(key, localItem);
      } else {
        // Item exists on server but not locally (added on another device)
        // Use the server version, but it won't have full variant/swatch data
        itemMap.set(key, item);
      }
    });

    // Add local items that were added very recently and don't exist on server yet
    // This catches items added just before sync completed
    localItems.forEach(item => {
      const key = getWishlistItemKey(item);
      if (!itemMap.has(key)) {
        // Only add if the item was added recently (within last 10 seconds)
        // This prevents re-adding items that were removed on other devices
        const itemAddedAt = item.addedAt || 0;
        const isRecentlyAdded = (now - itemAddedAt) < RECENT_ADD_THRESHOLD;

        if (isRecentlyAdded) {
          itemMap.set(key, item);
        } else {
        }
      }
    });

    return Array.from(itemMap.values()).slice(0, MAX_WISHLIST_ITEMS);
  };

  // Debounced sync to server (prevents excessive API calls)
  let syncTimeout = null;
  const debouncedSyncToServer = () => {
    if (!window.customerId) {
      return;
    }

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const items = loadWishlist();
      await saveServerWishlist(items);
    }, 2000); // 2 second delay
  };

  // Export wishlist to shareable URL (for guests or manual sharing)
  const exportWishlistToURL = () => {
    const items = loadWishlist();
    if (!items.length) {
      showToast('A lista de favoritos está vazia', { type: 'info', duration: 3000 });
      return;
    }

    // Create minimal data structure (only essential fields)
    const minimalData = items.map(item => ({
      h: item.handle, // handle
      t: item.title, // title
      p: item.price, // price
      c: item.colorKey, // colorKey
      i: item.image, // image
    }));

    // Compress and encode
    const jsonString = JSON.stringify(minimalData);
    const encoded = btoa(jsonString);

    // Create shareable URL
    const shareURL = `${window.location.origin}${window.location.pathname}?wishlist=${encoded}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareURL).then(() => {
      showToast('Link copiado! Partilhe para sincronizar noutro dispositivo.', {
        type: 'success',
        duration: 5000,
      });
    }).catch(() => {
      // Fallback: show URL in toast
      showToast('URL: ' + shareURL, { type: 'info', duration: 10000 });
    });
  };

  // Import wishlist from URL parameter
  const importWishlistFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('wishlist');

    if (!encoded) return false;

    try {
      // Decode and parse
      const jsonString = atob(encoded);
      const minimalData = JSON.parse(jsonString);

      // Expand to full items
      const importedItems = minimalData.map(item => ({
        handle: item.h,
        title: item.t,
        price: item.p,
        colorKey: item.c || '',
        image: item.i,
        addedAt: Date.now(),
      }));

      // Merge with existing wishlist
      const currentItems = loadWishlist();
      const itemMap = new Map();

      // Add current items
      currentItems.forEach(item => {
        const key = getWishlistItemKey(item);
        itemMap.set(key, item);
      });

      // Add imported items (don't override existing)
      importedItems.forEach(item => {
        const key = `${item.handle}:${item.colorKey}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, item);
        }
      });

      const merged = Array.from(itemMap.values()).slice(0, MAX_WISHLIST_ITEMS);

      // Save and update UI
      saveWishlist(merged);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      showToast(`${importedItems.length} itens importados para favoritos!`, {
        type: 'success',
        duration: 4000,
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  // Enrich wishlist items with cardMarkup from products currently on the page
  // Initialize account sync for logged-in users
  const initAccountSync = async () => {

    // Check for wishlist import from URL first (works for all users)
    const importedFromURL = importWishlistFromURL();

    // For logged-in users, sync with server
    if (window.customerId) {
      try {
        const localItems = loadWishlist();

        const serverItems = await fetchServerWishlist();

        if (serverItems !== null) {

          // Merge local and server wishlists
          const merged = mergeWishlists(localItems, serverItems);

          // Check if merged result differs from server
          const serverKeys = new Set(serverItems.map(item => getWishlistItemKey(item)));
          const mergedKeys = new Set(merged.map(item => getWishlistItemKey(item)));

          const hasChanges = merged.length !== serverItems.length ||
                           ![...mergedKeys].every(key => serverKeys.has(key));

          // Save merged list locally (without triggering another sync)
          cachedWishlist = normalizeWishlistItems(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedWishlist));
          } catch (error) {
          }
          renderWishlist();
          syncHearts();

          // Sync to server if there are any changes
          if (hasChanges) {
            await saveServerWishlist(merged);
          } else {
            updateSyncStatus('synced', 'Sincronizado');
          }

          // Force heart sync after server load completes
          setTimeout(() => syncHearts(), 100);
        } else {
          // Server fetch failed, use local only
          updateSyncStatus('synced', 'Local');
        }
      } catch (error) {
        updateSyncStatus('error', 'Erro de sincronização');
      }
    }
  };

  // Toast Notification System
  const createToastContainer = () => {
    let container = document.querySelector('.wishlist-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'wishlist-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  };

  const showToast = (message, options = {}) => {
    const {
      type = 'success',
      duration = 3000,
      showUndo = false,
      onUndo = null,
    } = options;

    // Clear any existing toasts
    const container = createToastContainer();
    container.innerHTML = '';

    // Clear existing timeouts
    if (toastTimeout) clearTimeout(toastTimeout);
    if (undoTimeout) clearTimeout(undoTimeout);

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `wishlist-toast wishlist-toast--${type}`;
    toast.setAttribute('role', 'status');

    // Create message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'wishlist-toast__message';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // Add undo button if needed
    if (showUndo && onUndo) {
      const undoButton = document.createElement('button');
      undoButton.type = 'button';
      undoButton.className = 'wishlist-toast__undo';
      undoButton.textContent = window.wishlistStrings?.undo || 'Undo';
      undoButton.addEventListener('click', () => {
        onUndo();
        hideToast();
      });
      toast.appendChild(undoButton);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'wishlist-toast__close';
    closeButton.setAttribute('aria-label', window.wishlistStrings?.close || 'Close');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', hideToast);
    toast.appendChild(closeButton);

    // Append to container
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('wishlist-toast--visible');
    });

    // Auto-hide after duration
    toastTimeout = setTimeout(() => {
      hideToast();
    }, duration);
  };

  const hideToast = () => {
    const container = document.querySelector('.wishlist-toast-container');
    if (!container) return;

    const toast = container.querySelector('.wishlist-toast');
    if (!toast) return;

    toast.classList.remove('wishlist-toast--visible');

    // Remove from DOM after animation
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);

    // Clear timeouts
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
    undoData = null;
  };

  const getVariantImageSource = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    if (typeof image === 'object') {
      return (
        image.src ||
        image.url ||
        image.currentSrc ||
        image.original_src ||
        image.preview_image?.src ||
        image.preview_image?.url ||
        image.small_url ||
        ''
      );
    }
    return '';
  };

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    // Fix protocol-relative URLs (//domain.com/image.jpg -> https://domain.com/image.jpg)
    if (trimmed.startsWith('//')) {
      return 'https:' + trimmed;
    }
    return trimmed;
  };

  const extractImageFromMarkup = (markup) => {
    if (typeof markup !== 'string' || !markup.trim()) return '';
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    const img =
      template.content.querySelector('img') ||
      template.content.querySelector('[data-src], [data-srcset], [srcset]');
    if (!img) return '';
    const imageUrl = (
      img.currentSrc ||
      img.src ||
      img.getAttribute('src') ||
      img.getAttribute('data-srcset') ||
      img.getAttribute('data-src') ||
      img.getAttribute('srcset') ||
      ''
    );
    return normalizeImageUrl(imageUrl);
  };

  const buildWishlistKey = (handle, colorKey = '') => `${handle || ''}::${normalizeOptionValue(colorKey)}`;

  const COLOR_LABEL_PATTERN = /(\bcolor\b|\bcolour\b|\bcor\b)/i;
  const SIZE_LABEL_PATTERN = /(\bsize\b|\btamanho\b|\btalla\b|\btaille\b)/i;

  const normalizeVariants = (variants) => {
    if (!Array.isArray(variants)) return [];
    return variants.map((variant) => {
      // Build options array from option1, option2, option3 (Shopify JSON API format)
      // or use existing options array (Liquid format)
      let options = [];
      if (Array.isArray(variant.options) && variant.options.length > 0) {
        options = variant.options.slice();
      } else {
        // Build from option1, option2, option3
        if (variant.option1) options.push(variant.option1);
        if (variant.option2) options.push(variant.option2);
        if (variant.option3) options.push(variant.option3);
      }

      return {
        id: variant.id,
        title: variant.title,
        available: !!variant.available,
        options: options,
        price: variant.price,
        image: getVariantImageSource(variant.image || variant.featured_image),
      };
    });
  };

  const normalizeSwatchEntry = (entry, card = null) => {
    if (!entry || typeof entry !== 'object') return null;
    const value = typeof entry.value === 'string' ? entry.value.trim() : '';
    const keySource = typeof entry.key === 'string' ? entry.key : value;
    const key = normalizeOptionValue(keySource);
    if (!value || !key) return null;
    let image = getVariantImageSource(entry.image);
    let color = typeof entry.color === 'string' ? entry.color.trim() : '';

    // If no image/color and we have a card, try to extract from DOM
    if (!image && !color && card instanceof HTMLElement) {
      const swatches = card.querySelectorAll('.swatch');
      for (const swatch of swatches) {
        const swatchColor = swatch.dataset?.color;
        if (normalizeOptionValue(swatchColor) === key) {
          // Try to get image or color from CSS
          const style = window.getComputedStyle(swatch);
          const bgValue = style.getPropertyValue('--swatch--background') || style.backgroundImage;
          const bgColor = style.backgroundColor;

          // Extract URL from url(...) format
          const urlMatch = bgValue?.match(/url\(['"]?([^'")]+)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            image = urlMatch[1];
          } else if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            color = bgColor;
          }
          break;
        }
      }
    }

    return { value, key, image, color };
  };

  const normalizeWishlistSwatches = (swatches, card = null) => {
    if (!Array.isArray(swatches)) return [];
    const seen = new Set();
    return swatches.reduce((accumulator, entry) => {
      const normalized = normalizeSwatchEntry(entry, card);
      if (!normalized) return accumulator;
      if (seen.has(normalized.key)) return accumulator;
      seen.add(normalized.key);
      accumulator.push(normalized);
      return accumulator;
    }, []);
  };

  // ============================================================================
  // Fetch-on-Render System for Wishlist Quick-Add
  // ============================================================================

  const productDataCache = new Map(); // Handle → { data, timestamp }
  const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetches product data from Shopify's product JSON endpoint
   * @param {string} handle - Product handle
   * @returns {Promise<object|null>} Product data or null on error
   */
  const fetchProductData = async (handle) => {
    if (!handle) return null;

    console.log('[wishlist] fetchProductData: fetching', handle);
    try {
      const response = await fetch(`/products/${handle}.json`);
      console.log('[wishlist] fetchProductData: response for', handle, { ok: response.ok, status: response.status });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[wishlist] Product ${handle} not found (may have been deleted)`);
        }
        return null;
      }

      const data = await response.json();
      console.log('[wishlist] fetchProductData: got data for', handle, { hasProduct: !!data.product });
      return data.product || null;
    } catch (error) {
      console.warn(`[wishlist] Failed to fetch product ${handle}:`, error);
      return null;
    }
  };

  /**
   * Enriches a wishlist item with variant data from fetched product
   * @param {object} item - Wishlist item from localStorage
   * @param {object} productData - Full product data from Shopify API
   * @returns {object} Enriched item with variants, colorIndex, sizeIndex
   */
  const enrichItemWithVariants = (item, productData) => {
    if (!productData || !item) return item;

    console.log('[wishlist] enrichItemWithVariants for:', item.handle, {
      hasProductData: !!productData,
      optionsCount: productData.options?.length || 0,
      variantsCount: productData.variants?.length || 0,
      options: productData.options,
      firstVariant: productData.variants?.[0]
    });

    const enriched = { ...item };

    // Extract and normalize variants
    enriched.variants = normalizeVariants(productData.variants || []);

    // Find color and size option indices
    // Note: Shopify's /products/{handle}.json returns options as array of strings
    // e.g., ["Color", "Size"] - not objects with .name property
    enriched.colorIndex = -1;
    enriched.sizeIndex = -1;

    if (Array.isArray(productData.options)) {
      productData.options.forEach((option, index) => {
        if (!option) return; // Skip null/undefined options
        // Handle both string (from JSON API) and object (from Liquid) formats
        const name = typeof option === 'string' ? option : (option.name || '');
        console.log(`[wishlist] Option ${index}:`, { raw: option, extractedName: name, isColorMatch: COLOR_LABEL_PATTERN.test(name), isSizeMatch: SIZE_LABEL_PATTERN.test(name) });
        if (COLOR_LABEL_PATTERN.test(name)) {
          enriched.colorIndex = index;
        }
        if (SIZE_LABEL_PATTERN.test(name)) {
          enriched.sizeIndex = index;
        }
      });
    }

    // If we have a stored colorValue, ensure colorKey is set for matching
    if (item.colorValue && enriched.colorIndex >= 0) {
      enriched.colorKey = normalizeOptionValue(item.colorValue);
    }

    return enriched;
  };

  /**
   * Fetches product data for multiple wishlist items with caching
   * Uses parallel fetching for better performance
   * @param {Array} items - Wishlist items from localStorage
   * @returns {Promise<Array>} Enriched items with variant data
   */
  const fetchProductsForWishlist = async (items) => {
    if (!Array.isArray(items) || !items.length) return items;

    const now = Date.now();

    // Clean up old cache entries to prevent unbounded growth
    if (productDataCache.size > 80) {
      productDataCache.clear(); // Simple cleanup - clear all when oversized
    }

    // Process items in parallel for better performance
    const enrichmentPromises = items.map(async (item) => {
      try {
        // Check cache first
        const cached = productDataCache.get(item.handle);
        if (cached && (now - cached.timestamp) < PRODUCT_CACHE_TTL) {
          return enrichItemWithVariants(item, cached.data);
        }

        // Fetch fresh data
        const productData = await fetchProductData(item.handle);

        if (productData) {
          // Use fresh timestamp when caching
          productDataCache.set(item.handle, { data: productData, timestamp: Date.now() });
          return enrichItemWithVariants(item, productData);
        }

        // Degrade gracefully - return item without variants (no quick-add)
        return item;
      } catch (error) {
        console.warn(`[wishlist] Error enriching item ${item.handle}:`, error);
        // Degrade gracefully for this specific item
        return item;
      }
    });

    return Promise.all(enrichmentPromises);
  };

  /**
   * Clears the product data cache
   * @param {string} handle - Optional specific product handle to clear
   */
  const clearProductCache = (handle = null) => {
    if (handle) {
      productDataCache.delete(handle);
    } else {
      productDataCache.clear();
    }
  };

  const deriveSwatchesFromVariants = (variants, colorIndex) => {
    if (!Array.isArray(variants)) return [];
    if (typeof colorIndex !== 'number' || colorIndex < 0) return [];
    const map = new Map();
    variants.forEach((variant, index) => {
      if (!variant || !Array.isArray(variant.options)) return;
      const colorValue = variant.options[colorIndex];
      if (!colorValue) return;
      const key = normalizeOptionValue(colorValue);
      if (!key || map.has(key)) return;

      // Try multiple image fields
      const variantImage = variant.image ||
                          variant.featured_image?.src ||
                          variant.featured_image ||
                          '';

      if (index === 0) {
      }

      map.set(key, {
        value: colorValue,
        key,
        image: variantImage,
      });
    });
    return Array.from(map.values());
  };

  const WISHLIST_RATIO_VALUE = '150%';
  const WISHLIST_RATIO_DECLARATION = `--ratio-percent: ${WISHLIST_RATIO_VALUE};`;
  const WISHLIST_RATIO_PATTERN = /--ratio-percent\s*:\s*[^;]+;?/i;

  const sanitizeStyleValue = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/^style\s*=\s*/i, '').replace(/^['"]|['"]$/g, '').trim();
  };

  const ensureWishlistRatioStyle = (value) => {
    const sanitized = sanitizeStyleValue(value);
    if (!sanitized) return WISHLIST_RATIO_DECLARATION;
    if (WISHLIST_RATIO_PATTERN.test(sanitized)) {
      return sanitized.replace(WISHLIST_RATIO_PATTERN, WISHLIST_RATIO_DECLARATION).trim();
    }
    const appendSeparator = sanitized.endsWith(';') ? '' : ';';
    return `${sanitized}${appendSeparator} ${WISHLIST_RATIO_DECLARATION}`.trim();
  };

  const normalizeWishlistCardMarkup = (markup) => {
    if (typeof markup !== 'string') return '';
    const trimmed = markup.trim();
    if (!trimmed.length) return '';

    const template = document.createElement('template');
    template.innerHTML = trimmed;
    template.content?.querySelectorAll?.('style, script')?.forEach?.((element) => element.remove());

    const cardInners = template.content?.querySelectorAll?.('.card__inner');
    if (cardInners && cardInners.length) {
      cardInners.forEach((inner) => {
        const normalizedStyle = ensureWishlistRatioStyle(inner.getAttribute('style') || '');
        if (normalizedStyle) {
          inner.setAttribute('style', normalizedStyle);
        } else {
          inner.removeAttribute('style');
        }
      });
    }

    return template.innerHTML;
  };

  const normalizeWishlistItem = (item, card = null) => {
    // Store essential fields + color data for fetch-on-render quick-add
    if (!item || typeof item !== 'object') return null;

    const handle = item.handle;
    if (!handle) return null;

    let normalizedImage = '';
    if (typeof item.image === 'string' && item.image.trim().length) {
      const rawImage = item.image.trim();
      normalizedImage = normalizeImageUrl(rawImage);
    }

    // Extract color value from item or card
    let colorValue = '';
    let colorKey = '';

    if (typeof item.colorValue === 'string' && item.colorValue.trim()) {
      colorValue = item.colorValue.trim();
    } else if (card?.dataset?.selectedColor) {
      colorValue = card.dataset.selectedColor.trim();
    }

    if (typeof item.colorKey === 'string' && item.colorKey.trim()) {
      colorKey = item.colorKey.trim();
    } else if (colorValue) {
      colorKey = normalizeOptionValue(colorValue);
    }

    const normalized = {
      handle,
      title: item.title || '',
      url: item.url || '',
      image: normalizedImage,
      price: item.price || '',
      addedAt: item.addedAt || Date.now(),
    };

    // Only include color data if present (keeps storage minimal)
    if (colorValue) {
      normalized.colorValue = colorValue;
    }
    if (colorKey) {
      normalized.colorKey = colorKey;
    }

    return normalized;
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
    // Simplified: only use handle (no color tracking)
    if (!item) return '';
    return item.handle || '';
  };

  const ensureDefaultCardSwatch = (card) => {
    if (!card) return;
    const colorIndex = normalizeNumber(card.dataset?.colorIndex, -1);
    if (colorIndex < 0) return;

    const swatches = card.querySelectorAll?.('.swatch');
    if (!swatches?.length) return;

    const active = card.querySelector('.swatch.active');
    if (active) return;

    const firstSwatch = swatches[0];
    if (!firstSwatch) return;

    firstSwatch.classList.add('active');
    if (firstSwatch.dataset?.color) {
      card.dataset.selectedColor = firstSwatch.dataset.color;
    }
  };

  const getCardSelectedColorKey = (card) => {
    if (!card) return '';
    ensureDefaultCardSwatch(card);
    const colorIndex = normalizeNumber(card.dataset?.colorIndex, -1);
    if (colorIndex < 0) return '';

    const variantColorKey = getCardVariantColorKey(card);
    if (variantColorKey) {
      return variantColorKey;
    }

    const activeSwatch = card.querySelector?.('.swatch.active');
    if (activeSwatch?.dataset?.color) {
      return normalizeOptionValue(activeSwatch.dataset.color);
    }

    if (card.dataset?.selectedColor) {
      return normalizeOptionValue(card.dataset.selectedColor);
    }

    return '';
  };
  const getCardVariantColorKey = (card) => {
    if (!card) return '';
    const colorIndex = normalizeNumber(card.dataset?.colorIndex, -1);
    if (colorIndex < 0) return '';

    const container =
      card.closest?.('.desktop-product-info, .mobile-product-info, .mobile-product-page, #sticky-product-bar') || card;
    const variantInput =
      container?.querySelector?.('input[name="id"]') ||
      card.querySelector?.('input[name="id"]');
    const variantId = variantInput?.value;
    if (!variantId) return '';

    const variants = parseJSONAttribute(card.dataset?.variants, []);
    if (!Array.isArray(variants) || !variants.length) return '';

    const variant = variants.find((item) => String(item.id) === String(variantId));
    if (!variant) return '';

    const options = Array.isArray(variant.options) ? variant.options : [];
    if (options.length <= colorIndex) return '';

    const colorValueRaw = options[colorIndex];
    if (typeof colorValueRaw !== 'string' || !colorValueRaw.trim()) return '';

    const colorValue = colorValueRaw.trim();
    card.dataset.selectedColor = colorValue;
    return normalizeOptionValue(colorValue);
  };


  const syncCardSelectedColorFromPicker = (card) => {
    if (!card || !card.dataset?.colorIndex) return '';

    const variantColorKey = getCardVariantColorKey(card);
    if (variantColorKey) {
      return variantColorKey;
    }

    const picker = card.closest?.('.desktop-product-info, .mobile-product-info, .mobile-product-page, #sticky-product-bar');
    const checkedInput = picker?.querySelector('.product-form__input--swatch input[type="radio"]:checked');
    const activePickerSwatch = picker?.querySelector('.product-form__input--swatch .swatch.active');

    let selectedColor = checkedInput?.value?.trim() || activePickerSwatch?.dataset?.color || '';
    if (selectedColor) {
      selectedColor = selectedColor.trim();
      card.dataset.selectedColor = selectedColor;
    } else {
      delete card.dataset.selectedColor;
    }

    return normalizeOptionValue(selectedColor);
  };

  const getWishlistCardTemplateMarkup = (card) => {
    if (!card) return '';

    const contexts = [];
    const pushContext = (context) => {
      if (context && !contexts.includes(context)) {
        contexts.push(context);
      }
    };
    if (card instanceof HTMLElement) {
      pushContext(card);
      pushContext(card.parentElement);
      pushContext(card.closest('.desktop-product-info, .mobile-product-info, .mobile-product-page, #sticky-product-bar, .sticky-bar-summary'));
    }

    pushContext(document);

    for (const context of contexts) {
      const templateElement = context?.querySelector?.('[data-wishlist-card-template]');
      if (templateElement) {
        if (templateElement.tagName === 'TEMPLATE') {
          return templateElement.innerHTML || '';
        }
        return templateElement.innerHTML || '';
      }
    }

    return '';
  };

  const parseWishlistCardTemplate = (markup) => {
    if (typeof markup !== 'string') return { markup: '', root: null };
    const trimmed = markup.trim();
    if (!trimmed.length) return { markup: '', root: null };

    const templateElement = document.createElement('template');
    templateElement.innerHTML = trimmed;

    let cardWrapper = templateElement.content?.querySelector?.('.product-card-wrapper, .card-wrapper');
    if (!cardWrapper) {
      cardWrapper = templateElement.content?.firstElementChild || null;
    }

    if (!(cardWrapper instanceof HTMLElement)) {
      return { markup: '', root: null };
    }

    const root = cardWrapper.cloneNode(true);
    return { markup: root.outerHTML, root };
  };


  const parseJSONAttribute = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(decodeHtml(value));
    } catch (error) {
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
      } else {
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      // Handle corrupted data
      if (error instanceof SyntaxError) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (clearError) {
        }
      }
    }

    cachedWishlist = [];
    return [];
  };

  const saveWishlist = (items) => {
    cachedWishlist = normalizeWishlistItems(items);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedWishlist));
    } catch (error) {
      // Show user-facing error
      let errorMessage = window.wishlistStrings?.storageError || 'Não foi possível guardar os favoritos';

      // Specific error messages
      if (error.name === 'QuotaExceededError') {
        errorMessage = window.wishlistStrings?.storageFull || 'Lista de favoritos cheia. Remova alguns itens.';
      }

      showToast(errorMessage, {
        type: 'error',
        duration: 5000,
      });

      return false;
    }
    renderWishlist();
    syncHearts();

    // Trigger debounced sync for logged-in users
    debouncedSyncToServer();

    return true;
  };

  const findWishlistItem = (handleOrItem, colorKey = '') => {
    // Simplified: only match by handle (colorKey parameter ignored)
    const targetItem =
      typeof handleOrItem === 'object' ? normalizeWishlistItem(handleOrItem) : null;
    const handle = targetItem ? targetItem.handle : handleOrItem;
    if (!handle) return undefined;

    const wishlist = loadWishlist();
    return wishlist.find((item) => item.handle === handle);
  };

  // Check if wishlist is approaching limits
  const checkWishlistLimits = (items) => {
    const itemCount = items.length;

    // Hard limit check
    if (itemCount >= MAX_WISHLIST_ITEMS) {
      showToast(`Limite de favoritos atingido (${MAX_WISHLIST_ITEMS} itens). Remova alguns para adicionar mais.`, {
        type: 'error',
        duration: 5000,
      });
      return false;
    }

    // Warning threshold check - show at 40, 45, 48, 49 items
    if (itemCount === STORAGE_WARNING_THRESHOLD) {
      const remaining = MAX_WISHLIST_ITEMS - itemCount;
      showToast(`Tem ${remaining} espaços restantes na sua lista de favoritos.`, {
        type: 'info',
        duration: 4000,
      });
    } else if (itemCount === 45) {
      showToast(`Apenas 5 espaços restantes nos favoritos.`, {
        type: 'info',
        duration: 4000,
      });
    } else if (itemCount === 48) {
      showToast(`Últimos 2 espaços disponíveis nos favoritos.`, {
        type: 'info',
        duration: 4500,
      });
    } else if (itemCount === 49) {
      showToast(`Último espaço disponível nos favoritos!`, {
        type: 'info',
        duration: 5000,
      });
    }

    return true;
  };

  const addToWishlist = (product, showToastNotification = true) => {
    const normalized = normalizeWishlistItem(product, product._card);
    if (!normalized) return false;
    let wishlist = loadWishlist();
    const key = getWishlistItemKey(normalized);
    const fallbackKey = buildWishlistKey(normalized.handle, '');

    if (normalized.colorKey && key !== fallbackKey) {
      wishlist = wishlist.filter((item) => getWishlistItemKey(item) !== fallbackKey);
    }

    const existingIndex = wishlist.findIndex((item) => getWishlistItemKey(item) === key);
    let created = false;
    if (existingIndex >= 0) {
      wishlist[existingIndex] = normalized;
    } else {
      // Check limits before adding new item
      if (!checkWishlistLimits(wishlist)) {
        return false;
      }
      wishlist.push(normalized);
      created = true;
    }
    saveWishlist(wishlist);

    // Show toast notification if requested
    if (showToastNotification && created) {
      const productName = normalized.title || 'Item';
      const message = window.wishlistStrings?.addedToWishlist || `${productName} added to wishlist`;

      showToast(message, {
        type: 'success',
        duration: 3000,
        showUndo: true,
        onUndo: () => {
          removeFromWishlist(normalized, normalized.colorKey);
          const undoMessage = window.wishlistStrings?.removedFromWishlist || `${productName} removed from wishlist`;
          showToast(undoMessage, { type: 'info', duration: 2000 });
        }
      });
    }

    return created;
  };

  const removeFromWishlist = (handleOrItem, colorKey = '', showToastNotification = true) => {
    const normalized =
      typeof handleOrItem === 'object' ? normalizeWishlistItem(handleOrItem) : null;
    const handle = normalized ? normalized.handle : handleOrItem;
    if (!handle) return;

    const key = normalized ? getWishlistItemKey(normalized) : buildWishlistKey(handle, colorKey);

    // Store the item being removed for undo
    const removedItem = loadWishlist().find((item) => getWishlistItemKey(item) === key);

    const wishlist = loadWishlist().filter((item) => getWishlistItemKey(item) !== key);
    saveWishlist(wishlist);

    // Show toast notification if requested
    if (showToastNotification && removedItem) {
      const productName = removedItem.title || 'Item';
      const message = window.wishlistStrings?.removedFromWishlist || `${productName} removed from wishlist`;

      showToast(message, {
        type: 'info',
        duration: 3000,
        showUndo: true,
        onUndo: () => {
          addToWishlist(removedItem, false);
          const undoMessage = window.wishlistStrings?.addedToWishlist || `${productName} added back to wishlist`;
          showToast(undoMessage, { type: 'success', duration: 2000 });
        }
      });
    }
  };

  const normalizeExternalWishlistItems = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload.filter(Boolean);
    if (payload && Array.isArray(payload.items)) return payload.items.filter(Boolean);
    if (payload && payload.item) return [payload.item].filter(Boolean);
    return [payload].filter(Boolean);
  };

  const handleExternalWishlistAdd = (event) => {
    normalizeExternalWishlistItems(event && event.detail).forEach((item) => addToWishlist(item));
  };

  document.addEventListener('theme:wishlist:add', handleExternalWishlistAdd);

  window.themeWishlist = window.themeWishlist || {};
  window.themeWishlist.addItem = (item) => {
    if (!item) return false;
    return addToWishlist(item);
  };
  window.themeWishlist.addItems = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => addToWishlist(item));
  };
  window.themeWishlist.removeItem = (item, colorKey = '') => {
    removeFromWishlist(item, colorKey);
  };

  const getCardFromHeart = (button) => {
    if (!button) return null;

    const wishlistCard = button.closest('[data-wishlist-item]');
    if (wishlistCard) return wishlistCard;

    // Try product card wrapper (collection pages, sticky bar)
    const productCard = button.closest('.product-card-wrapper');
    if (productCard) return productCard;

    // Try product page containers (desktop and mobile product pages)
    const productPageCard = button.closest('.desktop-product-title-wrapper, .mobile-product-info, .sticky-bar-summary');
    if (productPageCard) return productPageCard;

    return null;
  };

  const isProductPageWithHeart = () =>
    document.querySelector(
      '.product-title-heart-row, .mobile-product-info, .desktop-product-title-wrapper, .sticky-bar-summary'
    ) != null;

  let wishlistHeartsLogged = false;

  const logWishlistHearts = (root = document, label = 'attach') => {
    if (wishlistHeartsLogged || !isProductPageWithHeart()) return;
    const buttons = Array.from(root.querySelectorAll(HEART_SELECTOR));
    const productButtons = buttons.filter((button) =>
      button.closest(
        '.product-title-heart-row, .mobile-product-info, .desktop-product-title-wrapper, .sticky-bar-summary',
      ),
    );
    const withHandle = productButtons.filter((button) => {
      const card = getCardFromHeart(button);
      return Boolean(card?.dataset?.productHandle);
    }).length;
    const visible = productButtons.filter(
      (button) => button.offsetParent || button.getClientRects().length > 0,
    ).length;
    const counts = {
      titleRow: productButtons.filter((button) => button.closest('.product-title-heart-row')).length,
      mobileInfo: productButtons.filter((button) => button.closest('.mobile-product-info')).length,
      desktopTitle: productButtons.filter((button) => button.closest('.desktop-product-title-wrapper')).length,
      sticky: productButtons.filter((button) => button.closest('.sticky-bar-summary')).length,
    };
    const details = productButtons.map((button, index) => {
      const rect = button.getBoundingClientRect();
      const styles = window.getComputedStyle(button);
      let container = 'other';
      if (button.closest('.product-title-heart-row')) container = 'titleRow';
      else if (button.closest('.mobile-product-info')) container = 'mobileInfo';
      else if (button.closest('.desktop-product-title-wrapper')) container = 'desktopTitle';
      else if (button.closest('.sticky-bar-summary')) container = 'sticky';
      return {
        index,
        container,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        zIndex: styles.zIndex,
      };
    });

    console.log(`[wishlist] ${label} product hearts`, {
      total: productButtons.length,
      withHandle,
      visible,
      counts,
      details,
    });
    if (productButtons.length && withHandle === 0) {
      console.warn('[wishlist] Product hearts missing data. Check data-product-handle on the wrapper.');
    }
    if (productButtons.length && visible === 0) {
      console.warn('[wishlist] Product hearts exist but are not visible in the layout.');
    }
    wishlistHeartsLogged = true;
  };

  const getProductFromCard = (card) => {
    if (!card) return null;
    const handle = card.dataset.productHandle;
    if (!handle) return null;

    const variants = parseJSONAttribute(card.dataset.variants, []);
    const sizeIndex = Number.parseInt(card.dataset.sizeIndex, 10);
    const colorIndex = Number.parseInt(card.dataset.colorIndex, 10);
    let selectedColor = '';
    let selectedVariantImage = '';
    const normalizedColorIndex = Number.isNaN(colorIndex) ? -1 : colorIndex;

    const templateMarkup = getWishlistCardTemplateMarkup(card);
    let parsedTemplateRoot = null;
    let cardMarkup = '';

    if (templateMarkup && templateMarkup.trim()) {
      const parsedTemplate = parseWishlistCardTemplate(templateMarkup);
      cardMarkup = parsedTemplate.markup;
      parsedTemplateRoot = parsedTemplate.root;
    }

    if (!cardMarkup) {
      cardMarkup = card?.outerHTML || '';
    }

    const sourceElement = parsedTemplateRoot || card;
    const cardShell = sourceElement?.querySelector?.('.card');
    const cardInner = sourceElement?.querySelector?.('.card__inner');
    const cardMedia = sourceElement?.querySelector?.('.card__media');
    const mediaInner = cardMedia?.firstElementChild || null;
    const cardContent = sourceElement?.querySelector?.('.card__content');
    const cardInformation = sourceElement?.querySelector?.('.card__information');
    const cardHeading = sourceElement?.querySelector?.('.card__heading');
    const priceWrapper = sourceElement?.querySelector?.('.card-information');

    const productInfo =
      card.closest?.('.desktop-product-info, .mobile-product-info, .mobile-product-page, #sticky-product-bar') || null;

    if (normalizedColorIndex >= 0) {
      ensureDefaultCardSwatch(card);

      let activeSwatch =
        card.querySelector('.swatch.active') ||
        productInfo?.querySelector('.product-form__input--swatch .swatch.active') ||
        null;

      const checkedInput = productInfo?.querySelector('.product-form__input--swatch input[type="radio"]:checked');

      if (checkedInput) {
        if (!selectedColor) {
          selectedColor = checkedInput.value || '';
        }

        const label = checkedInput.nextElementSibling;
        let labelSwatch = null;

        if (label?.matches?.('.swatch')) {
          labelSwatch = label;
        } else if (label?.querySelector?.('.swatch')) {
          labelSwatch = label.querySelector('.swatch');
        }

        if (!activeSwatch && labelSwatch) {
          activeSwatch = labelSwatch;
        }

        if (!selectedVariantImage && labelSwatch?.dataset?.variantImage) {
          selectedVariantImage = labelSwatch.dataset.variantImage;
        }
      }

      if (activeSwatch && !activeSwatch.classList.contains('swatch')) {
        const nestedSwatch = activeSwatch.querySelector?.('.swatch');
        if (nestedSwatch) {
          activeSwatch = nestedSwatch;
        }
      }

      if (!selectedColor && activeSwatch?.dataset?.color) {
        selectedColor = activeSwatch.dataset.color;
      } else if (!selectedColor && card.dataset.selectedColor) {
        selectedColor = card.dataset.selectedColor;
      }

      if (!selectedVariantImage && activeSwatch?.dataset?.variantImage) {
        selectedVariantImage = activeSwatch.dataset.variantImage;
      }

      if (!selectedVariantImage && selectedColor) {
        const swatchSearchContainer = productInfo || card;
        const matchingSwatch = Array.from(swatchSearchContainer.querySelectorAll('.swatch')).find((swatch) => {
          const swatchColor = normalizeOptionValue(swatch.dataset?.color);
          return swatchColor && swatchColor === normalizeOptionValue(selectedColor);
        });
        if (matchingSwatch?.dataset?.variantImage) {
          selectedVariantImage = matchingSwatch.dataset.variantImage;
        }
      }

      selectedColor = typeof selectedColor === 'string' ? selectedColor.trim() : '';
      if (selectedColor) {
        card.dataset.selectedColor = selectedColor;
      }
    }

    const colorKey = normalizedColorIndex >= 0 ? normalizeOptionValue(selectedColor) : '';

    const activeImage =
      parsedTemplateRoot?.querySelector?.('.swiper-slide-active img, .card__media img') ||
      card.querySelector('.swiper-slide-active img, .card__media img');

    let variantSpecificImage = selectedVariantImage;
    if (!variantSpecificImage && selectedColor && normalizedColorIndex >= 0 && variants.length > 0) {
      const matchingVariant = variants.find((variant) => {
        if (!Array.isArray(variant.options) || variant.options.length <= normalizedColorIndex) return false;
        return normalizeOptionValue(variant.options[normalizedColorIndex]) === normalizeOptionValue(selectedColor);
      });
      if (matchingVariant?.featured_image) {
        variantSpecificImage = matchingVariant.featured_image;
      } else if (matchingVariant?.featured_media?.preview_image?.src) {
        variantSpecificImage = matchingVariant.featured_media.preview_image.src;
      }
    }

    const productImage =
      variantSpecificImage ||
      activeImage?.currentSrc ||
      activeImage?.src ||
      activeImage?.dataset?.src ||
      card.dataset.productImage ||
      '';

    // Include color data for fetch-on-render quick-add (variants fetched on render)
    return {
      handle,
      title: card.dataset.productTitle || '',
      url: card.dataset.productUrl || '',
      image: productImage,
      price: card.dataset.productPrice || '',
      colorValue: selectedColor,  // Selected color (human-readable)
      colorKey: colorKey,          // Normalized color key for matching
      _card: card,  // Store card reference for normalization
    };
  };


  const handleHeartClick = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const card = getCardFromHeart(button);
    const product = getProductFromCard(card);
    if (!product) {
      if (isProductPageWithHeart()) {
        console.warn('[wishlist] Heart click missing product data', { button, card });
      }
      return;
    }

    const existingItem = findWishlistItem(product.handle);
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
    logWishlistHearts(root, 'attach');
  };

  const syncHearts = () => {
    const wishlistItems = loadWishlist();
    // Create set of product handles (simplified - no color tracking)
    const wishlistHandles = new Set(wishlistItems.map((item) => item.handle).filter(Boolean));

    document.querySelectorAll(HEART_SELECTOR).forEach((button) => {
      const card = getCardFromHeart(button);
      const handle = card?.dataset?.productHandle;
      const active = handle && wishlistHandles.has(handle);

      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');

      // Get product name for better screen reader context
      const productTitle = card?.dataset?.productTitle || '';
      const addLabel = window.wishlistStrings?.add || 'Adicionar aos favoritos';
      const removeLabel = window.wishlistStrings?.remove || 'Remover dos favoritos';

      // Include product name if available
      let ariaLabel;
      if (productTitle) {
        ariaLabel = active
          ? `${removeLabel}: ${productTitle}`
          : `${addLabel}: ${productTitle}`;
      } else {
        ariaLabel = active ? removeLabel : addLabel;
      }

      button.setAttribute('aria-label', ariaLabel);
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
      const baseLabel = button.dataset.baseLabel || button.querySelector('.drawer__tab-label')?.textContent?.trim() || button.textContent.trim();
      button.dataset.baseLabel = baseLabel;
      const count = button.dataset.tabTarget === TAB_WISHLIST ? wishlistCount : cartCount;
      button.dataset.count = String(count);

      // Update count badge if it exists, otherwise fallback to old format
      const countBadge = button.querySelector('.drawer__tab-count');
      if (countBadge) {
        countBadge.textContent = String(count);
      } else {
        button.textContent = formatDrawerLabel(baseLabel, count);
      }
    });
  };

  const setActiveDrawerTab = (tab) => {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.dataset.activeTab = tab;
    drawer.classList.toggle('drawer--wishlist-active', tab === TAB_WISHLIST);

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

    if (tab === TAB_WISHLIST) {
      renderWishlist();
    }

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

  const getUniqueSizesForItem = (item) => {
    if (!item || typeof item.sizeIndex !== 'number' || item.sizeIndex < 0) return [];
    const sizeIndex = item.sizeIndex;
    const sizes = [];
    getMatchingVariants(item).forEach((variant) => {
      const option = variant.options?.[sizeIndex];
      if (!option) return;
      if (!sizes.includes(option)) {
        sizes.push(option);
      }
    });
    return sizes;
  };

  const createSizeButtonsMarkup = (item) => {
    const productName = item?.title || '';
    const addToCartLabel = window.wishlistStrings?.addToCart || 'Adicionar ao carrinho';

    const sizes = getUniqueSizesForItem(item);

    return sizes
      .map(
        (size) => {
          // Create accessible label with product name and size
          const ariaLabel = productName
            ? `${addToCartLabel}: ${productName}, tamanho ${size}`
            : `${addToCartLabel}, tamanho ${size}`;

          return `
            <button type="button" class="size-option" data-size="${escapeHtml(size)}" aria-label="${escapeHtml(ariaLabel)}">
              <span class="size-option__label">${escapeHtml(size)}</span>
              <span class="size-option__low-stock hidden">${escapeHtml(
                window.wishlistStrings?.lowStock || 'Pouco stock',
              )}</span>
            </button>`;
        }
      )
      .join('');
  };

  const createQuickAddMarkup = (item) => {
    if (!item || typeof item.sizeIndex !== 'number' || item.sizeIndex < 0) return '';

    const sizeButtonsMarkup = createSizeButtonsMarkup(item);
    if (!sizeButtonsMarkup) return '';

    // Create accessible label for plus button with product name
    const productName = item?.title || '';
    const addToCartLabel = window.wishlistStrings?.addToCart || 'Adicionar ao carrinho';
    const selectSizeLabel = window.wishlistStrings?.sizeLabel || 'Selecione um tamanho';

    const plusAriaLabel = productName
      ? `${selectSizeLabel}: ${productName}`
      : selectSizeLabel;

    return `
      <div class="product-card-plus">
        <button type="button" class="plus-icon" aria-label="${escapeHtml(plusAriaLabel)}" aria-expanded="false">
          +
        </button>
        <div class="size-options" tabindex="-1">
          <div class="size-options-header">
            <span class="size-options-title">${escapeHtml(
              window.wishlistStrings?.sizeLabel || 'Select a size',
            )}</span>
          </div>
          <div class="overlay-sizes">
            ${sizeButtonsMarkup}
          </div>
        </div>
      </div>`;
  };

  const createQuickAddElement = (item) => {
    const markup = createQuickAddMarkup(item);
    if (!markup) return null;
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
  };

  const createFallbackSwatchAndQuickAddMarkup = (item, quickAddMarkup) => {
    const swatches = Array.isArray(item?.swatches) ? item.swatches : [];

    const visibleLimit = 3;
    const visibleSwatches = swatches.slice(0, visibleLimit);
    const overflowCount = swatches.length > visibleLimit ? swatches.length - visibleLimit : 0;

    const swatchMarkup = visibleSwatches
      .map((swatch, index) => {
        if (!swatch || typeof swatch !== 'object') return '';
        const hasImage = typeof swatch.image === 'string' && swatch.image.trim().length;
        const hasColor = typeof swatch.color === 'string' && swatch.color.trim().length;

        const classes = ['swatch'];
        if (!hasImage && !hasColor) classes.push('swatch--unavailable');
        if (index === 0) classes.push('active');
        const attributes = [`class="${classes.join(' ')}"`];

        if (swatch.value) {
          attributes.push(`data-color="${escapeHtml(swatch.value)}"`);
        }

        // Build style attribute
        let styleValue = '';
        if (hasImage) {
          const imageValue = escapeHtml(swatch.image.trim());
          attributes.push(`data-variant-image="${imageValue}"`);
          styleValue = `--swatch--background: url(${imageValue});`;
        } else if (hasColor) {
          styleValue = `background-color: ${escapeHtml(swatch.color)};`;
        }

        if (styleValue) {
          attributes.push(`style="${styleValue}"`);
        }

        return `<span ${attributes.join(' ')}></span>`;
      })
      .join('');

    const overflowMarkup =
      overflowCount > 0 ? `<span class="additional-swatch-count">+${overflowCount}</span>` : '';

    const quickAddContent = quickAddMarkup || '';

    if (!swatchMarkup && !overflowMarkup && !quickAddContent) return '';

    return `<div class="product-card__swatch-indicator">${swatchMarkup}${overflowMarkup}${quickAddContent}</div>`;
  };

  /**
   * Builds a product card matching the theme's card-product.liquid structure
   * This eliminates the need to store full HTML markup
   */
  const buildProductCard = (item) => {
    // Calculate ratio for aspect ratio (2:3 portrait = 0.667)
    const ratio = 2 / 3; // Portrait ratio matching theme's product cards
    const ratioPercent = (1 / ratio * 100).toFixed(2);

    // Build simple price HTML
    let priceHTML = '';
    if (item.price) {
      priceHTML = `
        <div class="price">
          <div class="price__container">
            <div class="price__regular">
              <span class="price-item price-item--regular">${escapeHtml(item.price)}</span>
            </div>
          </div>
        </div>`;
    }

    // Build simple card HTML - just image, title, price
    return `
      <div class="card-wrapper product-card-wrapper product-card underline-links-hover"
           data-product-handle="${escapeHtml(item.handle)}">
        <div class="card card--standard card--media" style="--ratio-percent: ${ratioPercent}%;">
          <button class="wishlist-toggle is-active" type="button" aria-pressed="true" aria-label="Remove from wishlist">
            <img class="wishlist-toggle__icon wishlist-toggle__icon--empty" src="${HEART_ICON_EMPTY}" alt="">
            <img class="wishlist-toggle__icon wishlist-toggle__icon--full" src="${HEART_ICON_FULL}" alt="">
          </button>
          <div class="card__inner ratio" style="--ratio-percent: ${ratioPercent}%;">
            <div class="card__media">
              <div class="media media--transparent">
                <a href="${escapeHtml(item.url)}" class="full-unstyled-link">
                  ${item.image ? `
                    <img src="${escapeHtml(item.image)}"
                         alt="${escapeHtml(item.title)}"
                         loading="lazy"
                         class="motion-reduce"
                         width="533"
                         height="533">
                  ` : `
                    <div class="card__placeholder" aria-hidden="true"></div>
                  `}
                </a>
              </div>
            </div>
          </div>
          <div class="card__content">
            <div class="card__information">
              <div class="card-information">
                <a href="${escapeHtml(item.url)}" class="title-cheyenne">
                  ${escapeHtml(item.title)}
                </a>
                ${priceHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const createFallbackWishlistMarkup = (item) => {
    // Use the new builder function instead of old fallback
    return buildProductCard(item);
  };

  const createWishlistCardElement = (item) => {
    if (!item) return null;


    const template = document.createElement('template');
    const cardMarkup = buildProductCard(item);
    template.innerHTML = cardMarkup;
    const element = template.content.firstElementChild || null;

    if (!element) return null;

    return element;
  };

  const ensureWishlistCardMedia = (cardElement, item) => {
    if (!cardElement) return;
    const media = cardElement.querySelector('.card__media');
    if (!media) return;

    media
      .querySelectorAll(
        '.swiper-pagination, .swiper-button-next, .swiper-button-prev, .swiper-scrollbar',
      )
      .forEach((element) => element.remove());

    media.classList.remove(
      'swiper-container',
      'swiper-initialized',
      'swiper-initialized-autoheight',
      'swiper-container-initialized',
    );

    const productLink =
      cardElement.querySelector('.card__heading a')?.getAttribute('href') ||
      cardElement.dataset?.productUrl ||
      '#';

    const existingImage = media.querySelector('img');
    const wrapperTarget =
      media.querySelector('.wishlist-card__image-wrapper') ||
      media.querySelector('.swiper-wrapper') ||
      media.querySelector('.card__media-inner') ||
      media.querySelector('.media') ||
      media.querySelector('figure') ||
      media.querySelector('picture') ||
      existingImage?.closest('.swiper-slide, .media, figure, picture, .card__media > :not(script)');

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'wishlist-card__image-wrapper';
    imageWrapper.style.setProperty('aspect-ratio', '2 / 3');
    imageWrapper.style.height = 'auto';
    imageWrapper.style.maxHeight = 'none';
    imageWrapper.style.position = 'relative';

    const imageLink = document.createElement('a');
    imageLink.className = 'full-unstyled-link wishlist-card__image-link';
    imageLink.setAttribute('href', productLink);
    imageLink.style.display = 'block';
    imageLink.style.width = '100%';
    imageLink.style.height = '100%';
    const storedImage = item?.image || '';
    const fallbackImage = normalizeImageUrl(
      storedImage ||
      existingImage?.currentSrc ||
      existingImage?.getAttribute('src') ||
      existingImage?.dataset?.src ||
      cardElement.dataset?.productImage ||
      ''
    );
    const image = existingImage ? existingImage.cloneNode(false) : document.createElement('img');
    image.classList.add('wishlist-card__image');
    image.removeAttribute('style');
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';

    if (fallbackImage) {
      image.src = fallbackImage;
      image.setAttribute('srcset', fallbackImage);
      image.setAttribute('sizes', '100vw');
      if (image.dataset) {
        image.dataset.src = fallbackImage;
        image.dataset.srcset = fallbackImage;
      }
    } else {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }

    if (!image.hasAttribute('loading')) {
      image.setAttribute('loading', 'lazy');
    }

    if (!image.getAttribute('alt')) {
      const fallbackAlt = item?.title || cardElement.dataset?.productTitle || '';
      if (fallbackAlt) {
        image.setAttribute('alt', fallbackAlt);
      }
    }

    Array.from(image.attributes)
      .filter((attr) => attr.name.startsWith('data-swiper'))
      .forEach((attr) => image.removeAttribute(attr.name));

    image.removeAttribute('style');

    imageLink.appendChild(image);
    imageWrapper.appendChild(imageLink);

    if (wrapperTarget) {
      wrapperTarget.replaceWith(imageWrapper);
    } else {
      media.insertBefore(imageWrapper, media.firstChild);
    }

    media
      .querySelectorAll('.swiper-slide, .swiper-wrapper, .swiper-container, [class*="swiper-"]')
      .forEach((element) => {
        if (element === media) return;
        if (element.closest('.wishlist-card__image-wrapper')) return;
        if (element.matches('img')) return;
        element.remove();
      });

    media.querySelectorAll('img').forEach((imgElement) => {
      if (imgElement.closest('.card__badge')) return;
      if (!imageWrapper.contains(imgElement)) {
        imgElement.remove();
      }
    });
  };

  const ensureWishlistCardSwatch = (cardElement, item) => {
    if (!cardElement) return;


    const overflowBadge = cardElement.querySelector('.additional-swatch-count');
    if (overflowBadge) {
      overflowBadge.remove();
    }
    const swatches = cardElement.querySelectorAll('.swatch');

    if (!swatches.length) {
      return;
    }

    if (!item?.colorKey) {
      const active = cardElement.querySelector('.swatch.active');
      if (!active) {
        swatches[0].classList.add('active');
      }
      return;
    }

    const matching = Array.from(swatches).filter((swatch) => {
      const swatchKey = normalizeOptionValue(swatch.dataset?.color);
      return swatchKey === item.colorKey;
    });

    if (!matching.length) {
      const active = cardElement.querySelector('.swatch.active');
      if (!active && swatches[0]) {
        swatches[0].classList.add('active');
      }
      return;
    }

    swatches.forEach((swatch) => {
      if (!matching.includes(swatch)) {
        swatch.remove();
      }
    });

    matching.forEach((swatch, index) => {
      if (index === 0) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });
  };

  const sanitizeWishlistVariantInputs = (cardElement) => {
    if (!cardElement) return;

    const isColorContainer = (element) => {
      if (!element) return false;
      const labelText = element.querySelector('legend, .form__label')?.textContent || '';
      if (COLOR_LABEL_PATTERN.test(labelText)) return true;
      if (element.querySelector('.swatch')) return true;
      return false;
    };

    const isSizeContainer = (element) => {
      if (!element) return false;
      const labelText = element.querySelector('legend, .form__label')?.textContent || '';
      return SIZE_LABEL_PATTERN.test(labelText);
    };

    cardElement.querySelectorAll('.product-form__input--dropdown').forEach((wrapper) => {
      if (isColorContainer(wrapper)) {
        wrapper.querySelectorAll('select').forEach((select) => select.remove());
        return;
      }
      wrapper.remove();
    });

    cardElement
      .querySelectorAll('.product-form__input--swatch, .product-form__input--pill, .product-form__input--block')
      .forEach((wrapper) => {
        if (isColorContainer(wrapper)) {
          wrapper.querySelectorAll('input').forEach((input) => {
            input.setAttribute('disabled', 'disabled');
            input.setAttribute('tabindex', '-1');
          });
          return;
        }
        wrapper.remove();
      });

    cardElement.querySelectorAll('variant-selects').forEach((variantSelects) => {
      const hasColorInput = Array.from(variantSelects.querySelectorAll('.product-form__input')).some(
        (input) => isColorContainer(input),
      );
      if (!hasColorInput) {
        variantSelects.remove();
      }
    });

    cardElement
      .querySelectorAll('.quick-add, .card__quick-add, .quick-add__form, .quick-add__buttons')
      .forEach((element) => {
        if (!element.closest('.product-card-plus')) {
          element.remove();
        }
      });

    cardElement
      .querySelectorAll('form[action*="/cart/add"], button[name="add"], .quick-add__submit')
      .forEach((element) => {
        if (!element.closest('.product-card-plus')) {
          element.remove();
        }
      });

    cardElement.querySelectorAll('select').forEach((select) => {
      const name = (select.getAttribute('name') || '').toLowerCase();
      if (!name.includes('option')) return;
      const wrapper = select.closest('.product-form__input');
      if (wrapper && isColorContainer(wrapper)) {
        select.remove();
        return;
      }
      if (wrapper) {
        wrapper.remove();
      } else {
        select.remove();
      }
    });

    cardElement.querySelectorAll('.product-form__input').forEach((wrapper) => {
      if (isSizeContainer(wrapper)) {
        wrapper.remove();
      }
    });
  };

  const ensureWishlistQuickAdd = (cardElement, item) => {
    if (!cardElement) return;

    console.log('[wishlist] ensureWishlistQuickAdd called for:', item?.handle, {
      sizeIndex: item?.sizeIndex,
      colorIndex: item?.colorIndex,
      variantsCount: item?.variants?.length || 0
    });

    // Place quick-add directly on the .card element for reliable positioning
    const quickAddContainer = cardElement.querySelector('.card') || cardElement;
    // FORCE position relative with !important inline style
    if (quickAddContainer) {
      quickAddContainer.style.setProperty('position', 'relative', 'important');
    }
    let quickAdd = cardElement.querySelector('.product-card-plus');


    if (typeof item?.sizeIndex !== 'number' || item.sizeIndex < 0) {
      console.log('[wishlist] No sizeIndex, skipping quick-add for:', item?.handle);
      if (quickAdd) {
        quickAdd.remove();
      }
      return;
    }

    const sizeButtonsMarkup = createSizeButtonsMarkup(item);
    console.log('[wishlist] sizeButtonsMarkup length:', sizeButtonsMarkup?.length || 0);

    if (!sizeButtonsMarkup) {
      console.log('[wishlist] No size buttons markup, skipping quick-add for:', item?.handle);
      if (quickAdd) {
        quickAdd.remove();
      }
      return;
    }

    if (!quickAdd) {
      quickAdd = createQuickAddElement(item);
      console.log('[wishlist] createQuickAddElement returned:', !!quickAdd, 'container:', quickAddContainer?.className);
      if (!quickAdd) return;

      // Position at top-right of card (working position)
      quickAdd.style.cssText = 'position: absolute !important; right: 8px !important; top: 8px !important; z-index: 9999 !important; display: block !important; visibility: visible !important; opacity: 1 !important;';

      quickAddContainer.appendChild(quickAdd);
      console.log('[wishlist] Quick-add appended to container. Card now has .product-card-plus:', !!cardElement.querySelector('.product-card-plus'));
    } else {
      console.log('[wishlist] Quick-add already exists, updating overlay');
      const overlay = quickAdd.querySelector('.overlay-sizes');
      if (overlay) {
        overlay.innerHTML = sizeButtonsMarkup;
      }
    }

    const trigger = quickAdd.querySelector('.plus-icon');
    if (trigger) {
      trigger.setAttribute('aria-label', window.wishlistStrings?.addToCart || 'Add to cart');
      // Force inline styles on the plus icon
      trigger.style.cssText = 'display: flex !important; align-items: center; justify-content: center; width: 32px !important; height: 32px !important; min-width: 32px !important; min-height: 32px !important; background: red !important; color: white !important; visibility: visible !important; opacity: 1 !important; border: none; cursor: pointer;';
    }

    const title = quickAdd.querySelector('.size-options-title');
    if (title) {
      title.textContent = window.wishlistStrings?.sizeLabel || 'Select a size';
    }
  };

  const updateWishlistSizeButtons = (cardElement, item) => {
    if (!cardElement) return;
    const quickAdd = cardElement.querySelector('.product-card-plus');
    if (!quickAdd) return;

    if (typeof item?.sizeIndex !== 'number' || item.sizeIndex < 0) {
      quickAdd.classList.remove('active');
      return;
    }

    const buttons = quickAdd.querySelectorAll('.size-option');
    const matchingVariants = getMatchingVariants(item);
    const sizeIndex = item.sizeIndex;

    buttons.forEach((button) => {
      const sizeValue = button.dataset?.size || button.textContent?.trim();
      if (!sizeValue) {
        button.dataset.variantId = '';
        button.disabled = true;
        return;
      }

      const variant = matchingVariants.find((candidate) => {
        const optionValue = candidate.options?.[sizeIndex];
        return normalizeOptionValue(optionValue) === normalizeOptionValue(sizeValue);
      });

      if (!variant) {
        button.style.display = 'none';
        button.dataset.variantId = '';
        button.disabled = true;
        button.classList.add('sold-out');
        const lowStock = button.querySelector('.size-option__low-stock');
        lowStock?.classList?.add?.('hidden');
        return;
      }

      button.style.display = '';
      button.dataset.variantId = String(variant.id);
      if (variant.available) {
        button.disabled = false;
        button.classList.remove('sold-out');
      } else {
        button.disabled = true;
        button.classList.add('sold-out');
      }

      const lowStock = button.querySelector('.size-option__low-stock');
      if (lowStock) {
        lowStock.classList.add('hidden');
      }
    });

    const visibleButtons = Array.from(buttons).filter((button) => button.style.display !== 'none');
    if (!visibleButtons.length) {
      quickAdd.classList.remove('active');
    }
  };

  // Add price change badge if price has changed
  const addPriceChangeBadge = (cardElement, item) => {
    if (!cardElement || !item) return;

    const currentPrice = parseFloat(item.price) || 0;
    const originalPrice = parseFloat(item.originalPrice) || currentPrice;

    // Only show badge if price has changed
    if (currentPrice === originalPrice || originalPrice === 0) return;

    const priceChange = currentPrice - originalPrice;
    const isDecrease = priceChange < 0;
    const percentChange = Math.abs((priceChange / originalPrice) * 100).toFixed(0);

    // Find the card badge container (usually card__badge)
    let badgeContainer = cardElement.querySelector('.card__badge');

    if (!badgeContainer) {
      // If no badge container exists, create one
      const mediaWrapper = cardElement.querySelector('.card__media, .card__inner, .media');
      if (mediaWrapper) {
        badgeContainer = document.createElement('div');
        badgeContainer.className = 'card__badge';
        mediaWrapper.appendChild(badgeContainer);
      }
    }

    if (badgeContainer) {
      const badge = document.createElement('span');
      badge.className = `badge badge--bottom-left wishlist-price-change ${isDecrease ? 'wishlist-price-decrease' : 'wishlist-price-increase'}`;
      badge.textContent = `${isDecrease ? '' : '+'}${percentChange}%`;
      badge.setAttribute('title', isDecrease ? 'Preço desceu' : 'Preço subiu');
      badgeContainer.appendChild(badge);
    }
  };

  const prepareWishlistCard = (cardElement, item) => {
    if (!cardElement || !item) return null;

    cardElement = cardElement.cloneNode(true);
    cardElement.querySelectorAll('script, style').forEach((node) => node.remove());
    cardElement.classList.add('wishlist-card');
    cardElement.dataset.wishlistItem = 'true';
    cardElement.dataset.handle = item.handle;
    cardElement.dataset.productHandle = item.handle;
    cardElement.dataset.productTitle = item.title || '';
    cardElement.dataset.productUrl = item.url || '';
    cardElement.dataset.productImage = item.image || '';
    cardElement.dataset.productPrice = item.price || '';

    if (typeof item.sizeIndex === 'number' && item.sizeIndex >= 0) {
      cardElement.dataset.sizeIndex = String(item.sizeIndex);
    } else {
      delete cardElement.dataset.sizeIndex;
    }

    if (typeof item.colorIndex === 'number' && item.colorIndex >= 0) {
      cardElement.dataset.colorIndex = String(item.colorIndex);
    } else {
      delete cardElement.dataset.colorIndex;
    }

    if (item.colorValue) {
      cardElement.dataset.selectedColor = item.colorValue;
    } else {
      delete cardElement.dataset.selectedColor;
    }

    try {
      cardElement.dataset.variants = JSON.stringify(item.variants || []);
    } catch (error) {
      cardElement.dataset.variants = '[]';
    }

    if (item.colorKey) {
      cardElement.dataset.colorKey = item.colorKey;
    } else {
      delete cardElement.dataset.colorKey;
    }

    cardElement.querySelectorAll(HEART_SELECTOR).forEach((button) => {
      if (!button) return;
      if (button.dataset?.wishlistBound) {
        delete button.dataset.wishlistBound;
      }
      button.removeAttribute('data-wishlist-bound');
    });

    cardElement.wishlistItem = item;

    sanitizeWishlistVariantInputs(cardElement);
    ensureWishlistCardMedia(cardElement, item);
    ensureWishlistQuickAdd(cardElement, item);
    ensureWishlistCardSwatch(cardElement, item);
    updateWishlistSizeButtons(cardElement, item);
    addPriceChangeBadge(cardElement, item);

    return cardElement;
  };

  const createWishlistCard = (item) => {
    const rawElement = createWishlistCardElement(item);
    if (!rawElement) return null;
    return prepareWishlistCard(rawElement, item);
  };

  const closeAllWishlistQuickAdds = () => {
    document
      .querySelectorAll(`${WISHLIST_CONTAINER_SELECTOR} .product-card-plus.active`)
      .forEach((plus) => {
        plus.classList.remove('active');
        // Update aria-expanded for accessibility
        const plusIcon = plus.querySelector('.plus-icon');
        if (plusIcon) {
          plusIcon.setAttribute('aria-expanded', 'false');
        }
      });
  };

  // Sort wishlist items based on current sort option
  const sortWishlistItems = (items) => {
    if (!Array.isArray(items) || !items.length) return items;

    const sorted = [...items]; // Create a copy to avoid mutating original

    switch (currentSortOption) {
      case 'oldest':
        // Oldest first (reverse order - items added earlier appear first)
        sorted.reverse();
        break;

      case 'price-asc':
        // Price: Low to High
        sorted.sort((a, b) => {
          // Try multiple price fields and clean the string
          let priceA = a.price || a.price_min || a.minPrice || 0;
          let priceB = b.price || b.price_min || b.minPrice || 0;

          // Remove currency symbols, spaces, and convert to number
          if (typeof priceA === 'string') {
            priceA = parseFloat(priceA.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          }
          if (typeof priceB === 'string') {
            priceB = parseFloat(priceB.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          }

          return priceA - priceB;
        });
        break;

      case 'price-desc':
        // Price: High to Low
        sorted.sort((a, b) => {
          // Try multiple price fields and clean the string
          let priceA = a.price || a.price_min || a.minPrice || 0;
          let priceB = b.price || b.price_min || b.minPrice || 0;

          // Remove currency symbols, spaces, and convert to number
          if (typeof priceA === 'string') {
            priceA = parseFloat(priceA.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          }
          if (typeof priceB === 'string') {
            priceB = parseFloat(priceB.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          }

          return priceB - priceA;
        });
        break;

      case 'availability':
        // Available items first, then sold out
        sorted.sort((a, b) => {
          const availableA = a.available ? 1 : 0;
          const availableB = b.available ? 1 : 0;
          return availableB - availableA;
        });
        break;

      case 'newest':
      default:
        // Newest first (default - items added recently appear first)
        // No sorting needed, items are already in newest-first order
        break;
    }

    return sorted;
  };

  // Loading state flag to prevent concurrent renderWishlist calls
  let isWishlistLoading = false;

  // Show loading overlay (works for both wishlist page and drawer)
  const showWishlistLoading = () => {
    isWishlistLoading = true;

    // Handle wishlist page overlay (by ID)
    const pageOverlay = document.getElementById('wishlist-loading-overlay');
    const pageGrid = document.getElementById('wishlist-product-grid');
    if (pageOverlay) pageOverlay.classList.add('active');
    if (pageGrid) pageGrid.classList.add('wishlist-grid-loading');

    // Handle drawer containers (by selector)
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    containers.forEach((container) => {
      container.classList.add('is-loading');
      // Create dynamic overlay if needed (for drawer)
      let loader = container.querySelector('.wishlist-loading-overlay');
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'wishlist-loading-overlay';
        loader.innerHTML = '<div class="wishlist-loading-spinner"></div>';
        container.appendChild(loader);
      }
      loader.hidden = false;
    });
  };

  // Hide loading overlay (works for both wishlist page and drawer)
  const hideWishlistLoading = () => {
    isWishlistLoading = false;

    // Handle wishlist page overlay (by ID)
    const pageOverlay = document.getElementById('wishlist-loading-overlay');
    const pageGrid = document.getElementById('wishlist-product-grid');
    if (pageOverlay) pageOverlay.classList.remove('active');
    if (pageGrid) pageGrid.classList.remove('wishlist-grid-loading');

    // Handle drawer containers (by selector)
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    containers.forEach((container) => {
      container.classList.remove('is-loading');
      const loader = container.querySelector('.wishlist-loading-overlay');
      if (loader) loader.hidden = true;
    });
  };

  // Update sort option and re-render
  const setSortOption = (option) => {
    currentSortOption = option;

    // Show loading state
    showWishlistLoading();

    // Use setTimeout to allow loading UI to render before heavy operation
    setTimeout(() => {
      renderWishlist();

      // Update active state on sort pills (using is-active class like collection pages)
      document.querySelectorAll('[data-wishlist-sort]').forEach((button) => {
        if (button.dataset.wishlistSort === option) {
          button.classList.add('is-active');
        } else {
          button.classList.remove('is-active');
        }
      });

      // Close the drawer after selection
      const drawer = document.getElementById('wishlist-sort-drawer');
      if (drawer) {
        drawer.classList.remove('active');
      }

      // Hide loading state after a brief moment
      setTimeout(() => {
        hideWishlistLoading();
      }, 200);
    }, 50);
  };

  // Open/close sort drawer
  const toggleSortDrawer = () => {
    const drawer = document.getElementById('wishlist-sort-drawer');
    if (drawer) {
      drawer.classList.toggle('active');
    }
  };

  const closeSortDrawer = () => {
    const drawer = document.getElementById('wishlist-sort-drawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  };

  const renderWishlist = async () => {
    // Prevent concurrent executions
    if (isWishlistLoading) return;
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    if (!containers.length) return;
    let items = loadWishlist();

    console.log('[wishlist] renderWishlist called, items from localStorage:', items);

    closeAllWishlistQuickAdds();

    // Show loading state if we have items to fetch
    if (items.length) {
      showWishlistLoading();

      // Fetch variant data for all items (with caching)
      try {
        console.log('[wishlist] Fetching variant data for', items.length, 'items...');
        items = await fetchProductsForWishlist(items);
        console.log('[wishlist] After enrichment, items:', items);
        // Log first item details for debugging
        if (items[0]) {
          console.log('[wishlist] First item details:', {
            handle: items[0].handle,
            colorValue: items[0].colorValue,
            colorKey: items[0].colorKey,
            colorIndex: items[0].colorIndex,
            sizeIndex: items[0].sizeIndex,
            variantsCount: items[0].variants?.length || 0
          });
        }
      } catch (error) {
        console.warn('[wishlist] Error fetching product data:', error);
        // Continue with un-enriched items (graceful degradation)
      }

      hideWishlistLoading();

      // Apply sorting after enrichment
      items = sortWishlistItems(items);
    }

    containers.forEach((container) => {
      const grid = container.querySelector(WISHLIST_GRID_SELECTOR);
      const emptyState = container.querySelector('[data-wishlist-empty]');
      if (!grid || !emptyState) return;

      grid.innerHTML = '';

      // Also hide/show the FILTROS button
      const gridControls = document.querySelector('[data-wishlist-controls]');

      if (!items.length) {
        container.classList.add('is-empty');
        grid.hidden = true;
        emptyState.hidden = false;
        if (gridControls) gridControls.hidden = true;
        return;
      }

      container.classList.remove('is-empty');
      grid.hidden = false;
      emptyState.hidden = true;
      if (gridControls) gridControls.hidden = false;

      items.forEach((item) => {
        const cardElement = createWishlistCard(item);
        if (!cardElement) return;
        grid.appendChild(cardElement);
      });

      attachHeartListeners(container);
    });

    if (typeof window.initializeProductCardSwipers === 'function') {
      try {
        window.initializeProductCardSwipers();
      } catch (error) {
        // Swipers are optional, continue without them
      }
    }

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
        const selectors = [
          '#CartDrawer-CartPanel .drawer__empty-state',
          'cart-drawer-items',
          '#CartDrawer-CartErrors',
          '.drawer__footer',
        ];
        selectors.forEach((selector) => {
          const target = document.querySelector(selector);
          const source = html.querySelector(selector);
          if (target && source) {
            target.replaceWith(source);
          }
        });
        const drawer = getDrawer();
        if (drawer) {
          drawer.classList.toggle('is-empty', getCartItemCount(drawer) === 0);
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
      .catch(() => {});
  };

  const findWishlistCardContext = (element) => {
    const card = element?.closest('[data-wishlist-item]');
    if (!card) return { card: null, item: null };
    const colorKey = card.dataset?.colorKey || '';
    const item = card.wishlistItem || findWishlistItem(card.dataset.handle, colorKey);
    return { card, item };
  };

  const addVariantToCart = (variantId, card) => {
    if (!variantId || !window.routes?.cart_add_url) return Promise.resolve();

    const productName = card?.dataset?.productTitle || 'Item';

    const body = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }],
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname,
    });

    return fetch(`${window.routes.cart_add_url}`, { ...fetchConfig(), body })
      .then((response) => response.json())
      .then((data) => {
        if (data.status && data.status !== 200) {
          throw new Error(data.description || 'Unable to add to cart');
        }
        return data;
      })
      .then(() => {
        if (card?.dataset.handle) {
          removeFromWishlist(card.dataset.handle, card.dataset.colorKey || '', false);
        }
      })
      .then(() => refreshCartDrawer())
      .then(() => setActiveDrawerTab(TAB_CART))
      .then(() => {
        // Show success toast
        const message = window.wishlistStrings?.addedToCart || `${productName} added to cart`;
        showToast(message, {
          type: 'success',
          duration: 3000,
        });
      })
      .catch((error) => {

        // Determine specific error message
        let errorMessage = window.wishlistStrings?.addToCartError || 'Não foi possível adicionar ao carrinho';

        if (error.message) {
          // Check for specific error types
          if (error.message.includes('sold out') || error.message.includes('esgotado')) {
            errorMessage = window.wishlistStrings?.productSoldOut || `${productName} está esgotado`;
          } else if (error.message.includes('inventory') || error.message.includes('stock')) {
            errorMessage = window.wishlistStrings?.insufficientStock || 'Stock insuficiente';
          } else if (error.message.includes('network') || error.name === 'TypeError') {
            errorMessage = window.wishlistStrings?.networkError || 'Erro de conexão. Tente novamente.';
          }
        }

        showToast(errorMessage, {
          type: 'error',
          duration: 5000,
        });
      })
      .finally(() => {
        closeAllWishlistQuickAdds();
      });
  };

  const handleWishlistPlusClick = (plusIcon) => {
    console.log('[wishlist] handleWishlistPlusClick called');
    const { card, item } = findWishlistCardContext(plusIcon);
    console.log('[wishlist] findWishlistCardContext result:', { card: !!card, item: item });
    if (!card || !item) {
      console.log('[wishlist] No card or item found, returning');
      return;
    }

    console.log('[wishlist] item.sizeIndex:', item.sizeIndex, 'type:', typeof item.sizeIndex);
    if (typeof item.sizeIndex !== 'number' || item.sizeIndex < 0) {
      console.log('[wishlist] No sizeIndex, trying direct add to cart');
      const variant = getVariantForDirectAdd(item);
      if (variant?.id) {
        addVariantToCart(variant.id, card);
      }
      return;
    }

    const plus = plusIcon.closest('.product-card-plus');
    if (!plus) {
      console.log('[wishlist] No .product-card-plus found');
      return;
    }

    updateWishlistSizeButtons(card, item);

    const visibleOption = Array.from(plus.querySelectorAll('.size-option')).find(
      (button) => button.style.display !== 'none' && !button.disabled,
    );
    console.log('[wishlist] visibleOption found:', !!visibleOption);

    if (!visibleOption) {
      console.log('[wishlist] No visible options, closing');
      closeAllWishlistQuickAdds();
      return;
    }

    if (plus.classList.contains('active')) {
      console.log('[wishlist] Already active, closing');
      plus.classList.remove('active');
      plusIcon.setAttribute('aria-expanded', 'false');
      return;
    }

    console.log('[wishlist] Opening size options panel');
    closeAllWishlistQuickAdds();
    plus.classList.add('active');
    plusIcon.setAttribute('aria-expanded', 'true');
    const sizeOptions = plus.querySelector('.size-options');
    console.log('[wishlist] sizeOptions element:', sizeOptions);
    sizeOptions?.focus?.();
  };

  const handleWishlistSizeOptionClick = (button) => {
    const { card, item } = findWishlistCardContext(button);
    if (!card || !item) return;

    const variantId = Number.parseInt(button.dataset.variantId || '', 10);
    if (!variantId) return;

    // Save original button content
    const originalContent = button.innerHTML;

    // Add loading state
    button.disabled = true;
    button.classList.add('size-option--loading');
    button.innerHTML = `
      <span class="size-option__spinner"></span>
      <span class="size-option__label">${button.dataset.size || ''}</span>
    `;

    addVariantToCart(variantId, card)
      .then(() => {
        // Success - button will be removed when card is removed from wishlist
      })
      .catch(() => {
        // On error, restore button
        if (!card.isConnected) return;
        button.disabled = false;
        button.classList.remove('size-option--loading');
        button.innerHTML = originalContent;
      })
      .finally(() => {
        // Final cleanup if card still exists
        if (card.isConnected && button.isConnected) {
          button.disabled = false;
          button.classList.remove('size-option--loading');
        }
      });
  };

  const handleWishlistClicks = (event) => {
    console.log('[wishlist] handleWishlistClicks - target:', event.target);

    const wishlistCard = event.target.closest('[data-wishlist-item]');
    console.log('[wishlist] handleWishlistClicks - wishlistCard found:', !!wishlistCard);
    if (!wishlistCard) return;

    const plusIcon = event.target.closest('.product-card-plus .plus-icon');
    console.log('[wishlist] handleWishlistClicks - plusIcon found:', !!plusIcon);
    if (plusIcon) {
      console.log('[wishlist] Plus icon clicked! Preventing default and handling...');
      event.preventDefault();
      event.stopPropagation();
      handleWishlistPlusClick(plusIcon);
      return;
    }

    const sizeOption = event.target.closest('.product-card-plus .size-option');
    if (sizeOption) {
      console.log('[wishlist] Size option clicked!');
      event.preventDefault();
      event.stopPropagation();
      handleWishlistSizeOptionClick(sizeOption);
    }
  };

  const handleWishlistOutsideClick = (event) => {
    const openPlus = document.querySelector(`${WISHLIST_CONTAINER_SELECTOR} .product-card-plus.active`);
    if (!openPlus) return;

    if (event.target.closest('[data-wishlist-item] .product-card-plus')) return;

    const openCard = openPlus.closest('[data-wishlist-item]');

    if (!event.target.closest(WISHLIST_CONTAINER_SELECTOR)) {
      closeAllWishlistQuickAdds();
      return;
    }

    const card = event.target.closest('[data-wishlist-item]');
    if (card && card === openCard) {
      if (event.target.closest('.swatch')) return;
      closeAllWishlistQuickAdds();
      return;
    }

    if (!card || !card.contains(openPlus)) {
      closeAllWishlistQuickAdds();
    }
  };

  const handleWishlistKeydown = (event) => {
    if (event.key !== 'Escape') return;
    if (!event.target.closest?.(WISHLIST_CONTAINER_SELECTOR)) return;
    closeAllWishlistQuickAdds();
  };

  let wishlistListenersBound = false;

  const registerWishlistContainerListeners = () => {
    if (wishlistListenersBound) return;
    document.addEventListener('click', handleWishlistClicks);
    document.addEventListener('click', handleWishlistOutsideClick);
    document.addEventListener('keydown', handleWishlistKeydown);
    wishlistListenersBound = true;
  };

  let swatchSyncBound = false;

  const registerSwatchSyncListener = () => {
    if (swatchSyncBound) return;
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('.swatch')) {
        requestAnimationFrame(() => syncHearts());
      }
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches?.('.product-form__input--swatch input[type="radio"]')) {
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

  // Handle wishlist grid layout switching
  const setWishlistLayout = (layout) => {
    const grid = document.getElementById('wishlist-product-grid');
    if (!grid) return;

    // Show loading state
    showWishlistLoading();

    // Use setTimeout to allow loading UI to render
    setTimeout(() => {
      // Remove all layout classes
      grid.classList.remove('one-col', 'two-col', 'three-col');

      // Add new layout class
      grid.classList.add(layout);

      // Update button active states
      document.querySelectorAll('.wishlist-layout-option-button').forEach((btn) => {
        btn.classList.remove('active');
      });

      const activeButton = document.getElementById(`wishlist-layout-${layout}`);
      if (activeButton) {
        activeButton.classList.add('active');
      }

      // Save preference to localStorage
      try {
        localStorage.setItem('wishlist-layout-preference', layout);
      } catch (error) {
        // Silent fail if localStorage unavailable
      }

      // Hide loading state
      setTimeout(() => {
        hideWishlistLoading();
      }, 150);
    }, 50);
  };

  // Register layout button listeners
  const registerLayoutListeners = () => {
    const layoutButtons = [
      { id: 'wishlist-layout-one-col', layout: 'one-col' },
      { id: 'wishlist-layout-two-col', layout: 'two-col' },
      { id: 'wishlist-layout-three-col', layout: 'three-col' },
    ];

    layoutButtons.forEach(({ id, layout }) => {
      const button = document.getElementById(id);
      if (button && !button.dataset.layoutBound) {
        button.dataset.layoutBound = 'true';
        button.addEventListener('click', () => setWishlistLayout(layout));
      }
    });

    // Load saved layout preference
    try {
      const savedLayout = localStorage.getItem('wishlist-layout-preference');
      if (savedLayout && ['one-col', 'two-col', 'three-col'].includes(savedLayout)) {
        setWishlistLayout(savedLayout);
      }
    } catch (error) {
      // Use default (two-col) if can't read localStorage
    }
  };

  // Register sort button listeners
  const registerSortListeners = () => {
    // Register sort pill clicks
    document.querySelectorAll('[data-wishlist-sort]').forEach((button) => {
      if (button.dataset.sortBound) return;
      button.dataset.sortBound = 'true';

      button.addEventListener('click', () => {
        const sortOption = button.dataset.wishlistSort;
        if (sortOption) {
          setSortOption(sortOption);
        }
      });

      // Set initial active state
      if (button.dataset.wishlistSort === currentSortOption) {
        button.classList.add('is-active');
      }
    });

    // Register FILTROS button click
    const toggleButton = document.getElementById('wishlist-facets-toggle-button');
    if (toggleButton && !toggleButton.dataset.drawerBound) {
      toggleButton.dataset.drawerBound = 'true';
      toggleButton.addEventListener('click', toggleSortDrawer);
    }

    // Register drawer close button
    const closeButton = document.getElementById('wishlist-sort-drawer-close');
    if (closeButton && !closeButton.dataset.closeBound) {
      closeButton.dataset.closeBound = 'true';
      closeButton.addEventListener('click', closeSortDrawer);
    }

    // Register clicking outside drawer to close
    const drawer = document.getElementById('wishlist-sort-drawer');
    if (drawer && !drawer.dataset.overlayBound) {
      drawer.dataset.overlayBound = 'true';
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) {
          closeSortDrawer();
        }
      });
    }
  };

  // Cross-tab synchronization using storage events
  const handleStorageChange = (event) => {
    // Only respond to changes to our wishlist storage key
    if (event.key !== STORAGE_KEY) return;

    // Skip if the change originated from this tab
    if (event.storageArea !== localStorage) return;

    // Clear the cache so loadWishlist() fetches fresh data
    cachedWishlist = null;

    // Re-render wishlist and sync all hearts across the page
    renderWishlist();
    syncHearts();

    // Update drawer labels if drawer is open
    const drawer = getDrawer();
    if (drawer) {
      updateDrawerLabels(drawer, getActiveDrawerTab(drawer));
    }
  };

  const init = () => {
    const drawer = getDrawer();
    const labelSource = drawer?.querySelector('[data-cart-title][data-wishlist]');
    const wishlistLabel = labelSource?.dataset?.wishlistTitle || labelSource?.dataset?.wishlist;
    const closeLabel = drawer?.querySelector('.drawer__close')?.getAttribute('aria-label');

    window.wishlistStrings = {
      add: 'Adicionar aos favoritos',
      remove: 'Remover dos favoritos',
      addToCart: 'Adicionar ao carrinho',
      sizeLabel: 'Selecione um tamanho',
      soldOut: 'Esgotado',
      close: 'Fechar',
      wishlist: 'Favoritos',
      lowStock: 'Pouco stock',
      undo: 'Desfazer',
      addedToWishlist: 'Adicionado aos favoritos',
      removedFromWishlist: 'Removido dos favoritos',
      addedToCart: 'Adicionado ao carrinho',
      addToCartError: 'Não foi possível adicionar ao carrinho',
      productSoldOut: 'Produto esgotado',
      insufficientStock: 'Stock insuficiente',
      networkError: 'Erro de conexão. Tente novamente.',
      storageError: 'Não foi possível guardar os favoritos',
      storageFull: 'Lista de favoritos cheia. Remova alguns itens.',
      storageDisabled: 'Favoritos não disponíveis em modo privado',
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
    registerSortListeners();
    registerLayoutListeners();

    // Register share button for all users
    const shareButton = document.getElementById('wishlist-share-button');
    if (shareButton && !shareButton.dataset.shareBound) {
      shareButton.dataset.shareBound = 'true';
      shareButton.addEventListener('click', exportWishlistToURL);
    }

    // Initialize account sync and check for URL imports (for all users)
    initAccountSync();

    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);

    document.addEventListener('shopify:section:load', onSectionLoad);
    observeDomMutations();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
