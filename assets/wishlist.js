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

  const COLOR_LABEL_PATTERN = /(\bcolor\b|\bcolour\b|\bcor\b)/i;
  const SIZE_LABEL_PATTERN = /(\bsize\b|\btamanho\b|\btalla\b|\btaille\b)/i;

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
      cardMarkup: typeof item.cardMarkup === 'string' ? item.cardMarkup : '',
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


  const getCustomerContext = () => {
    if (typeof window === 'undefined') return {};
    if (!window.wishlistCustomer) {
      window.wishlistCustomer = { loggedIn: false, items: [] };
    }
    return window.wishlistCustomer;
  };

  const shouldSyncWithCustomer = () => Boolean(getCustomerContext().loggedIn);
  let customerHydrated = false;
  let customerSyncTimer = null;
  let lastSavedCustomerJSON = '';

  const readLocalWishlist = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return normalizeWishlistItems(parsed);
      }
    } catch (error) {
      console.warn('Unable to read wishlist from storage', error);
    }
    return [];
  };

  const persistLocalWishlist = (items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('Unable to persist wishlist', error);
    }
  };

  const compactWishlistItems = (items) =>
    items.map((item) => ({
      handle: item.handle,
      url: item.url,
      title: item.title,
      image: item.image,
      price: item.price,
      sizeIndex: item.sizeIndex,
      colorIndex: item.colorIndex,
      colorValue: item.colorValue,
      colorKey: item.colorKey,
      variants: Array.isArray(item.variants)
        ? item.variants.map((variant) => ({
            id: variant.id,
            title: variant.title,
            available: variant.available,
            options: Array.isArray(variant.options) ? variant.options.slice() : [],
            price: variant.price,
          }))
        : [],
    }));

  const getCustomerStoredItems = () => {
    if (!shouldSyncWithCustomer()) return null;
    const context = getCustomerContext();
    let source = context.items;
    if (!source) return [];
    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (!trimmed.length) {
        context.items = [];
        return [];
      }
      try {
        source = JSON.parse(trimmed);
      } catch (error) {
        console.warn('Unable to parse customer wishlist metafield', error);
        context.items = [];
        return [];
      }
    }
    if (!Array.isArray(source)) {
      context.items = [];
      return [];
    }
    const normalized = normalizeWishlistItems(source);
    context.items = compactWishlistItems(normalized);
    return normalized;
  };

  const submitCustomerWishlist = (payloadJSON) => {
    if (!shouldSyncWithCustomer()) return;
    const formData = new FormData();
    formData.append('form_type', 'customer');
    formData.append('utf8', '\u2713');
    formData.append('customer[metafields][wishlist][items]', payloadJSON);

    fetch('/account', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok && response.type !== 'opaqueredirect') {
          throw new Error(`Wishlist sync failed with status ${response.status}`);
        }
        lastSavedCustomerJSON = payloadJSON;
        try {
          getCustomerContext().items = JSON.parse(payloadJSON);
        } catch (error) {
          getCustomerContext().items = payloadJSON;
        }
      })
      .catch((error) => {
        console.warn('Failed to sync wishlist to customer account', error);
      });
  };

  const queueCustomerWishlistSave = (items) => {
    if (!shouldSyncWithCustomer()) return;
    const payloadArray = compactWishlistItems(items);
    const payloadJSON = JSON.stringify(payloadArray);
    if (payloadJSON === lastSavedCustomerJSON) return;
    if (customerSyncTimer) {
      clearTimeout(customerSyncTimer);
    }
    customerSyncTimer = setTimeout(() => {
      customerSyncTimer = null;
      submitCustomerWishlist(payloadJSON);
    }, 400);
  };

  const hydrateWishlistFromCustomer = () => {
    if (customerHydrated) return;
    const customerItems = getCustomerStoredItems();
    if (Array.isArray(customerItems) && customerItems.length) {
      cachedWishlist = customerItems;
      persistLocalWishlist(cachedWishlist);
      lastSavedCustomerJSON = JSON.stringify(compactWishlistItems(cachedWishlist));
      customerHydrated = true;
      return;
    }

    const localItems = readLocalWishlist();
    cachedWishlist = localItems;
    customerHydrated = true;
    if (shouldSyncWithCustomer() && cachedWishlist.length) {
      getCustomerContext().items = compactWishlistItems(cachedWishlist);
      queueCustomerWishlistSave(cachedWishlist);
    }
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
    if (!customerHydrated) {
      hydrateWishlistFromCustomer();
    }
    if (cachedWishlist) return cachedWishlist.slice();
    cachedWishlist = readLocalWishlist();
    return cachedWishlist.slice();
  };

  const saveWishlist = (items) => {
    cachedWishlist = normalizeWishlistItems(items);
    persistLocalWishlist(cachedWishlist);
    if (shouldSyncWithCustomer()) {
      queueCustomerWishlistSave(cachedWishlist);
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
    if (item) addToWishlist(item);
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
      cardWrapperClassName: parsedTemplateRoot?.className || card?.className || '',
      cardClassName: cardShell?.className || '',
      cardInnerClassName: cardInner?.className || '',
      cardInnerStyle: cardInner?.getAttribute?.('style') || '',
      cardMediaClassName: cardMedia?.className || '',
      cardMediaInnerClassName: mediaInner?.className || '',
      cardContentClassName: cardContent?.className || '',
      cardInformationClassName: cardInformation?.className || '',
      cardHeadingClassName: cardHeading?.className || '',
      cardPriceWrapperClassName: priceWrapper?.className || '',
      cardMarkup,
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
      let pickerColorKey = '';

      if (card && handle) {
        const colorIndexValue = Number.parseInt(card.dataset?.colorIndex ?? '', 10);
        const tracksColor = !Number.isNaN(colorIndexValue) && colorIndexValue >= 0;

        if (tracksColor) {
          pickerColorKey = syncCardSelectedColorFromPicker(card);
        }

        const colorKey = pickerColorKey || getCardSelectedColorKey(card);
        const exactKey = buildWishlistKey(handle, colorKey);
        active = wishlistKeys.has(exactKey);

        if (!active && colorKey && !tracksColor) {
          active = wishlistKeys.has(buildWishlistKey(handle, ''));
        }

        if (!active && tracksColor) {
          const storedColorKeys = wishlistItems
            .filter((item) => item.handle === handle)
            .map((item) => item.colorKey)
            .filter(Boolean);

          const comparisonKey = pickerColorKey || colorKey;
          if (comparisonKey && storedColorKeys.includes(comparisonKey)) {
            active = true;
          }
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

  const createSizeButtonsMarkup = (item) =>
    getUniqueSizesForItem(item)
      .map(
        (size) => `
          <button type="button" class="size-option" data-size="${escapeHtml(size)}">
            <span class="size-option__label">${escapeHtml(size)}</span>
            <span class="size-option__low-stock hidden">${escapeHtml(
              window.wishlistStrings?.lowStock || 'Low stock',
            )}</span>
          </button>`,
      )
      .join('');

  const createQuickAddMarkup = (item) => {
    if (!item || typeof item.sizeIndex !== 'number' || item.sizeIndex < 0) return '';

    const sizeButtonsMarkup = createSizeButtonsMarkup(item);
    if (!sizeButtonsMarkup) return '';

    return `
      <div class="product-card-plus">
        <button type="button" class="plus-icon" aria-label="${escapeHtml(
          window.wishlistStrings?.addToCart || 'Add to cart',
        )}">
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

  const createFallbackWishlistMarkup = (item) => {
    const imageMarkup = item.image
      ? `<img class="product-card__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="wishlist-card__placeholder" aria-hidden="true"></div>`;

    const priceMarkup = item.price
      ? `<span class="price price--end">${escapeHtml(item.price)}</span>`
      : '';

    const cardWrapperClassName = escapeHtml(
      item.cardWrapperClassName || 'card-wrapper product-card-wrapper product-card underline-links-hover',
    );
    const cardClassName = escapeHtml(item.cardClassName || 'card card--standard card--media');
    const cardInnerClassName = escapeHtml(item.cardInnerClassName || 'card__inner ratio');
    const cardInnerStyle = item.cardInnerStyle
      ? ` style="${escapeHtml(item.cardInnerStyle)}"`
      : ' style="--ratio-percent: 100%;"';
    const cardMediaClassName = escapeHtml(item.cardMediaClassName || 'card__media');
    const mediaInnerClassName = escapeHtml(item.cardMediaInnerClassName || 'media media--transparent media--hover-effect');
    const cardContentClassName = escapeHtml(item.cardContentClassName || 'card__content');
    const cardInformationClassName = escapeHtml(item.cardInformationClassName || 'card__information');
    const cardHeadingClassName = escapeHtml(item.cardHeadingClassName || 'card__heading');
    const priceWrapperClassName = escapeHtml(item.cardPriceWrapperClassName || 'card-information');

    const quickAddMarkup = createQuickAddMarkup(item);

    return `
      <div class="${cardWrapperClassName}">
        <div class="${cardClassName}">
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
                <a href="${escapeHtml(item.url)}" class="full-unstyled-link">
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
            ${quickAddMarkup}
          </div>
        </div>
      </div>`;
  };

  const createWishlistCardElement = (item) => {
    if (!item) return null;
    let element = null;

    if (item.cardMarkup) {
      const template = document.createElement('template');
      template.innerHTML = item.cardMarkup.trim();
      let candidate = template.content?.querySelector?.('.product-card-wrapper, .card-wrapper');
      if (!candidate) {
        candidate = template.content?.firstElementChild || null;
      }
      if (candidate instanceof HTMLElement) {
        if (!candidate.matches('.product-card-wrapper, .card-wrapper')) {
          const nested = candidate.querySelector?.('.product-card-wrapper, .card-wrapper');
          candidate = nested instanceof HTMLElement ? nested : null;
        }
      } else {
        candidate = null;
      }
      if (candidate) {
        element = candidate.cloneNode(true);
      }
    }

    if (!element) {
      const template = document.createElement('template');
      template.innerHTML = createFallbackWishlistMarkup(item);
      element = template.content.firstElementChild || null;
    }

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
    const fallbackImage =
      storedImage ||
      existingImage?.currentSrc ||
      existingImage?.getAttribute('src') ||
      existingImage?.dataset?.src ||
      cardElement.dataset?.productImage ||
      '';
    const image = existingImage ? existingImage.cloneNode(false) : document.createElement('img');
    image.classList.add('wishlist-card__image');
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
    if (!swatches.length) return;

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

    const quickAddContainer = cardElement.querySelector('.card__content') || cardElement;
    let quickAdd = cardElement.querySelector('.product-card-plus');

    if (typeof item?.sizeIndex !== 'number' || item.sizeIndex < 0) {
      if (quickAdd) {
        quickAdd.remove();
      }
      return;
    }

    const sizeButtonsMarkup = createSizeButtonsMarkup(item);
    if (!sizeButtonsMarkup) {
      if (quickAdd) {
        quickAdd.remove();
      }
      return;
    }

    if (!quickAdd) {
      quickAdd = createQuickAddElement(item);
      if (!quickAdd) return;
      quickAddContainer.appendChild(quickAdd);
    } else {
      const overlay = quickAdd.querySelector('.overlay-sizes');
      if (overlay) {
        overlay.innerHTML = sizeButtonsMarkup;
      }
    }

    const trigger = quickAdd.querySelector('.plus-icon');
    if (trigger) {
      trigger.setAttribute('aria-label', window.wishlistStrings?.addToCart || 'Add to cart');
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

  const prepareWishlistCard = (cardElement, item) => {
    if (!cardElement || !item) return null;

    cardElement = cardElement.cloneNode(true);
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
      console.warn('Unable to serialize wishlist variants', error);
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
      .forEach((plus) => plus.classList.remove('active'));
  };

  const renderWishlist = () => {
    const containers = document.querySelectorAll(WISHLIST_CONTAINER_SELECTOR);
    if (!containers.length) return;
    const items = loadWishlist();

    closeAllWishlistQuickAdds();

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
        console.warn('Unable to initialize product card swipers', error);
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

  const findWishlistCardContext = (element) => {
    const card = element?.closest('[data-wishlist-item]');
    if (!card) return { card: null, item: null };
    const colorKey = card.dataset?.colorKey || '';
    const item = card.wishlistItem || findWishlistItem(card.dataset.handle, colorKey);
    return { card, item };
  };

  const addVariantToCart = (variantId, card) => {
    if (!variantId || !window.routes?.cart_add_url) return Promise.resolve();

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
      })
      .then(() => {
        if (card?.dataset.handle) {
          removeFromWishlist(card.dataset.handle, card.dataset.colorKey || '');
        }
      })
      .then(() => refreshCartDrawer())
      .then(() => setActiveDrawerTab(TAB_CART))
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        closeAllWishlistQuickAdds();
      });
  };

  const handleWishlistPlusClick = (plusIcon) => {
    const { card, item } = findWishlistCardContext(plusIcon);
    if (!card || !item) return;

    if (typeof item.sizeIndex !== 'number' || item.sizeIndex < 0) {
      const variant = getVariantForDirectAdd(item);
      if (variant?.id) {
        addVariantToCart(variant.id, card);
      }
      return;
    }

    const plus = plusIcon.closest('.product-card-plus');
    if (!plus) return;

    updateWishlistSizeButtons(card, item);

    const visibleOption = Array.from(plus.querySelectorAll('.size-option')).find(
      (button) => button.style.display !== 'none' && !button.disabled,
    );

    if (!visibleOption) {
      closeAllWishlistQuickAdds();
      return;
    }

    if (plus.classList.contains('active')) {
      plus.classList.remove('active');
      return;
    }

    closeAllWishlistQuickAdds();
    plus.classList.add('active');
    const sizeOptions = plus.querySelector('.size-options');
    sizeOptions?.focus?.();
  };

  const handleWishlistSizeOptionClick = (button) => {
    const { card, item } = findWishlistCardContext(button);
    if (!card || !item) return;

    const variantId = Number.parseInt(button.dataset.variantId || '', 10);
    if (!variantId) return;

    button.disabled = true;

    addVariantToCart(variantId, card).finally(() => {
      if (!card.isConnected) return;
      button.disabled = false;
    });
  };

  const handleWishlistClicks = (event) => {
    const wishlistCard = event.target.closest('[data-wishlist-item]');
    if (!wishlistCard) return;

    const plusIcon = event.target.closest('.product-card-plus .plus-icon');
    if (plusIcon) {
      event.preventDefault();
      handleWishlistPlusClick(plusIcon);
      return;
    }

    const sizeOption = event.target.closest('.product-card-plus .size-option');
    if (sizeOption) {
      event.preventDefault();
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

  const init = () => {
    const drawer = getDrawer();
    hydrateWishlistFromCustomer();
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
      lowStock: 'Low stock',
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


