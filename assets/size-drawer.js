(() => {

  const stateBySection = new Map();
  const COLOR_KEYWORDS = ['color', 'cor', 'colour'];
  const SIZE_KEYWORDS = ['size', 'tamanho', 'talla'];
  const DESKTOP_MEDIA_QUERY = '(min-width: 990px)';
  const VIEWPORT_MARGIN = 12;

  // Flag to prevent infinite sync loops
  let isSyncing = false;

  const isDesktopViewport = () => {
    if (window.matchMedia) {
      return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
    }
    return window.innerWidth >= 990;
  };

  const clearDesktopStyles = (content) => {
    if (!content) return;
    ['width', 'left', 'top', 'right', 'bottom', 'max-height'].forEach((property) => {
      content.style.removeProperty(property);
    });
    if (content.dataset && Object.prototype.hasOwnProperty.call(content.dataset, 'drop')) {
      delete content.dataset.drop;
    }
  };

  const cssEscape = (value) => {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  };

  const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

  const getOptionValueString = (optionValue) => {
    if (optionValue == null) return '';
    if (typeof optionValue === 'string') return optionValue;
    if (typeof optionValue === 'object') {
      return optionValue.value || optionValue.name || optionValue.label || '';
    }
    return String(optionValue);
  };

  const getSectionData = (sectionId) => {
    const store = window.themeSizeDrawerData || {};
    const data = store[sectionId];
    if (data) {
      ensureOptionIndexes(data);
    }
    return data;
  };
  const findOptionIndex = (options, keywords) => {
    if (!Array.isArray(options) || !options.length) return -1;
    const normalizedKeywords = keywords
      .map((keyword) => (typeof keyword === 'string' ? keyword.toLowerCase() : ''))
      .filter(Boolean);
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const name = typeof option?.name === 'string' ? option.name.toLowerCase() : '';
      if (!name) continue;
      if (normalizedKeywords.some((keyword) => name.includes(keyword))) {
        return index;
      }
    }
    return -1;
  };

  const ensureOptionIndexes = (data) => {
    if (!data || !Array.isArray(data.options)) return;
    if (typeof data.colorOptionIndex !== 'number' || data.colorOptionIndex < 0) {
      data.colorOptionIndex = findOptionIndex(data.options, COLOR_KEYWORDS);
    }
    if (typeof data.sizeOptionIndex !== 'number' || data.sizeOptionIndex < 0) {
      data.sizeOptionIndex = findOptionIndex(data.options, SIZE_KEYWORDS);
    }
  };
  const hideProductSizeInputs = (root = document) => {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    const wrappers = root.querySelectorAll(
      'variant-selects .product-form__input, variant-radios .product-form__input, .product-form__input'
    );
    wrappers.forEach((wrapper) => {
      if (!wrapper) return;
      const dataOption = (wrapper.getAttribute?.('data-option-name') || wrapper.dataset?.optionName || '').toLowerCase();
      const label = wrapper.querySelector?.('.form__label')?.textContent?.toLowerCase() || '';
      const matchSource = dataOption || label;
      if (!matchSource) return;
      if (SIZE_KEYWORDS.some((keyword) => matchSource.includes(keyword))) {
        wrapper.style.display = 'none';
        wrapper.setAttribute('data-size-hidden', 'true');
      }
    });
  };


  const getVariantRoots = (sectionId) => {
    if (!sectionId) return [];

    const escapedId = cssEscape(sectionId);
    const directRoots = [
      document.getElementById(`variant-selects-${sectionId}`),
      document.getElementById(`variant-radios-${sectionId}`),
    ].filter(Boolean);

    const selectors = [
      `#variant-selects-${escapedId}`,
      `#variant-radios-${escapedId}`,
      `variant-selects[data-section="${escapedId}"]`,
      `variant-radios[data-section="${escapedId}"]`,
    ];

    const roots = new Set(directRoots);
    selectors.forEach((selector) => {
      try {
        const matches = document.querySelectorAll(selector);
        matches.forEach((element) => roots.add(element));
        if (matches.length) {
        }
      } catch (error) {
      }
    });

    return Array.from(roots).filter(Boolean);
  };

  const getVariantSelectRoot = (sectionId) => {
    const roots = getVariantRoots(sectionId);
    if (roots.length) {
      return roots[0];
    }

    const fallback = document.querySelector(
      `variant-selects[data-section="${sectionId}"], variant-radios[data-section="${sectionId}"]`
    );
    return fallback || null;
  };

  const setVariantOptionOnRoot = (root, option, value) => {
    if (!root || !option) return;
    const resolvedValue = getOptionValueString(value);
    if (!resolvedValue) return;

    const optionName = `${option.name}-${option.position}`;
    const radioSelector = `input[name="${cssEscape(optionName)}"]`;
    const radios = root.querySelectorAll(radioSelector);
    if (radios.length) {
      let target = Array.from(radios).find((input) => input.value === resolvedValue);
      if (!target) {
        target = Array.from(radios).find((input) => normalize(input.value) === normalize(resolvedValue));
      }
      if (target && !target.checked) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    const selectName = `options[${option.name}]`;
    const select = root.querySelector(`select[name="${cssEscape(selectName)}"]`);
    if (select) {
      let selectedValue = select.value;
      if (selectedValue === resolvedValue || normalize(selectedValue) === normalize(resolvedValue)) {
        return;
      }

      const matchingOption = Array.from(select.options).find(
        (optionElement) =>
          optionElement.value === resolvedValue || normalize(optionElement.value) === normalize(resolvedValue)
      );

      if (matchingOption) {
        select.value = matchingOption.value;
      } else {
        select.value = resolvedValue;
      }

      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const syncVariantOptionSelections = (sectionId, variant) => {
    if (!sectionId || !variant || !Array.isArray(variant.options)) return;
    const data = getSectionData(sectionId);
    if (!data || !Array.isArray(data.options) || !data.options.length) return;

    let roots = getVariantRoots(sectionId);
    const fallbackRoot = getVariantSelectRoot(sectionId);
    if (fallbackRoot && !roots.includes(fallbackRoot)) {
      roots.push(fallbackRoot);
    }

    if (!roots.length) return;

    roots.forEach((root) => {
      data.options.forEach((option, index) => {
        if (!option) return;
        const optionValue = variant.options[index];
        if (optionValue == null) return;
        setVariantOptionOnRoot(root, option, optionValue);
      });
    });
  };

  function getSelectedOptionValue(sectionId, option) {
    const optionName = typeof option?.name === 'string' ? option.name.trim() : '';
    const normalizedOptionName = optionName.toLowerCase();
    let selectedValue = null;


    const buildPatterns = (contextSectionId) =>
      [
        optionName ? `${optionName}-${option.position}` : '',
        contextSectionId ? `${contextSectionId}-${option.position}-1` : '',
        contextSectionId ? `${contextSectionId}-${option.position}-${option.position}` : '',
        optionName,
        optionName ? `options[${optionName}]` : '',
        optionName ? `options[${normalizedOptionName}]` : '',
      ].filter(Boolean);

    const tryResolveFromRoot = (root, contextSectionId) => {
      if (!root) return null;

      const directMatches = root.querySelectorAll('input[type="radio"]:checked');
      for (const radio of directMatches) {
        const trimmedName = (radio.name || '').trim();
        if (
          trimmedName === `${optionName}-${option.position}` ||
          trimmedName === optionName ||
          trimmedName === `options[${optionName}]` ||
          trimmedName === `options[${normalizedOptionName}]`
        ) {
          return radio.value;
        }
      }

      const patterns = buildPatterns(contextSectionId);
      for (const pattern of patterns) {
        const radio = root.querySelector(`input[name="${cssEscape(pattern)}"]:checked`);
        if (radio) {
          return radio.value;
        }
      }

      if (optionName) {
        const selectSelectors = [
          `select[name="${cssEscape(`options[${optionName}]`)}"]`,
          `select[name="${cssEscape(`options[${normalizedOptionName}]`)}"]`,
        ];
        for (const selector of selectSelectors) {
          const select = root.querySelector(selector);
          if (select && select.value) {
            return select.value;
          }
        }
      }

      const activeSwatch = root.querySelector(
        `[data-option-value][data-option-position="${option.position}"].is-active, [data-option-value].active, [data-option-value].selected`
      );
      if (activeSwatch?.dataset?.optionValue) {
        return activeSwatch.dataset.optionValue;
      }

      const inputWithDataset = root.querySelector(
        `[data-option-index="${option.position - 1}"] input[type="radio"]:checked`
      );
      if (inputWithDataset) {
        return inputWithDataset.value;
      }

      return null;
    };

    const roots = getVariantRoots(sectionId);
    for (const root of roots) {
      selectedValue = tryResolveFromRoot(root, sectionId);
      if (selectedValue) break;
    }

    if (!selectedValue) {
      const allPickers = document.querySelectorAll('variant-selects, variant-radios');
      for (const picker of allPickers) {
        const contextId = picker.dataset.section || '';
        selectedValue = tryResolveFromRoot(picker, contextId);
        if (selectedValue) break;
      }
    }

    if (!selectedValue) {
      selectedValue = getOptionValueString(option.selected_value);
    } else {
    }

    return selectedValue;
  }

  function ensureState(sectionId) {
    let state = stateBySection.get(sectionId);
    if (!state) {
      state = {
        lastFocused: null,
        activeTrigger: null,
        triggers: [],
        triggerData: new Map(),
        positionListeners: [],
      };
      stateBySection.set(sectionId, state);
    }

    const triggers = Array.from(document.querySelectorAll(`[data-size-drawer-trigger="${sectionId}"]`));
    state.triggers = triggers;

    triggers.forEach((trigger) => {
      if (!state.triggerData.has(trigger)) {
        const labelText = trigger.querySelector('span')?.textContent?.trim() || '';
        state.triggerData.set(trigger, {
          originalLabel: labelText,
          resetTimer: null,
        });
      } else {
        const data = state.triggerData.get(trigger);
        if (data && !data.originalLabel) {
          data.originalLabel = trigger.querySelector('span')?.textContent?.trim() || '';
        }
      }
    });

    state.triggerData.forEach((data, trigger) => {
      if (!triggers.includes(trigger)) {
        if (data.resetTimer) {
          clearTimeout(data.resetTimer);
        }
        state.triggerData.delete(trigger);
      }
    });

    if (state.activeTrigger && !triggers.includes(state.activeTrigger)) {
      state.activeTrigger = null;
    }

    return state;
  }

  const getActiveTriggerForSection = (sectionId) => {
    const state = ensureState(sectionId);
    return state.activeTrigger || state.triggers[0] || null;
  };

  function stopDesktopPositioning(sectionId) {
    const state = stateBySection.get(sectionId);
    if (!state || !Array.isArray(state.positionListeners)) return;
    state.positionListeners.forEach(({ target, type, handler, options }) => {
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(type, handler, options);
      }
    });
    state.positionListeners = [];
  }

  function startDesktopPositioning(sectionId) {
    const state = ensureState(sectionId);
    stopDesktopPositioning(sectionId);

    const updatePosition = () => positionDrawer(sectionId);
    const listeners = [
      { target: window, type: 'resize', handler: updatePosition, options: false },
      { target: window, type: 'scroll', handler: updatePosition, options: { passive: true } },
    ];

    listeners.forEach(({ target, type, handler, options }) => {
      if (target && typeof target.addEventListener === 'function') {
        target.addEventListener(type, handler, options);
      }
    });

    state.positionListeners = listeners;
  }

  function positionDrawer(sectionId) {
    updateDisplayedPrice(sectionId);
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (!drawer || !drawer.classList.contains('is-open')) return;

    const content = drawer.querySelector('.size-drawer__content');
    if (!content) return;

    if (content.dataset && Object.prototype.hasOwnProperty.call(content.dataset, 'drop')) {
      delete content.dataset.drop;
    }

    const desktop = isDesktopViewport();
    drawer.classList.toggle('size-drawer--desktop', desktop);

    if (!desktop) {
      clearDesktopStyles(content);
      stopDesktopPositioning(sectionId);
      return;
    }

    const trigger = getActiveTriggerForSection(sectionId);
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    if (!triggerRect || (!triggerRect.width && !triggerRect.height)) return;

    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const margin = VIEWPORT_MARGIN;

    content.style.removeProperty('top');
    content.style.removeProperty('bottom');
    content.style.removeProperty('left');
    content.style.removeProperty('right');

    const width = Math.max(0, Math.round(triggerRect.width));
    if (width > 0) {
      content.style.width = `${width}px`;
    } else {
      content.style.removeProperty('width');
    }

    const maxHeight = Math.max(200, viewportHeight - margin * 2);
    content.style.maxHeight = `${maxHeight}px`;

    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;

    let left = triggerRect.left;
    if (left + contentWidth > viewportWidth - margin) {
      left = viewportWidth - margin - contentWidth;
    }
    if (left < margin) {
      left = margin;
    }

    let top = triggerRect.bottom + margin;
    let drop = 'down';

    if (top + contentHeight > viewportHeight - margin) {
      const above = triggerRect.top - margin - contentHeight;
      if (above >= margin) {
        top = above;
        drop = 'up';
      } else {
        const clamped = Math.max(margin, viewportHeight - margin - contentHeight);
        top = clamped;
        drop = clamped >= triggerRect.bottom ? 'down' : 'up';
      }
    }

    content.style.left = `${Math.round(left)}px`;
    content.style.top = `${Math.round(top)}px`;
    content.dataset.drop = drop;
  }

  function setStatus(sectionId, message) {
    const status = document.getElementById(`size-drawer-status-${sectionId}`);
    if (status) {
      status.textContent = message || '';
    }
  }

  const formatMoney = (cents) => {
    if (cents == null) return '';
    try {
      if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
        const moneyFormat = (window.theme && window.theme.moneyFormat) || Shopify.money_format || '${{amount}}';
        return Shopify.formatMoney(cents, moneyFormat);
      }
    } catch (error) {
    }
    const amount = Number(cents) / 100;
    if (Number.isNaN(amount)) return '';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  function getVariantForSelections(sectionId) {
    const data = getSectionData(sectionId);
    if (!data || !Array.isArray(data.variants)) return null;

    const selections = Array.isArray(data.options)
      ? data.options.map((option) => {
          const value = getSelectedOptionValue(sectionId, option);
          return value ? normalize(value) : '';
        })
      : [];

    if (!selections.length || selections.every((value) => !value)) {
      return data.variants.find((variant) => variant.available) || data.variants[0] || null;
    }

    const match = data.variants.find((variant) => {
      if (!Array.isArray(variant.options)) return false;
      for (let index = 0; index < variant.options.length; index += 1) {
        const selectedValue = selections[index];
        if (!selectedValue) continue;
        if (normalize(variant.options[index]) !== selectedValue) {
          return false;
        }
      }
      return true;
    });

    return match || data.variants.find((variant) => variant.available) || data.variants[0] || null;
  }

  function updateProductBadges(priceElement, variant) {
    if (!priceElement) return;
    const saleBadge = priceElement.querySelector('.price__badge-sale');
    const soldOutBadge = priceElement.querySelector('.price__badge-sold-out');
    const isAvailable = !!(variant && variant.available);
    const compare = variant?.compare_at_price || 0;
    const price = variant?.price || 0;
    const onSale = compare > price;

    priceElement.classList.toggle('price--sold-out', !isAvailable);
    priceElement.classList.toggle('price--on-sale', onSale);

    if (saleBadge && !saleBadge.dataset.defaultText) {
      saleBadge.dataset.defaultText = saleBadge.textContent.trim();
    }

    if (saleBadge) {
      if (onSale && compare) {
        const discount = Math.round(((compare - price) / compare) * 100);
        const label = discount > 0 ? `-${discount}%` : saleBadge.dataset.defaultText || saleBadge.textContent;
        saleBadge.textContent = label;
        saleBadge.classList.remove('hidden');
        saleBadge.style.display = '';
      } else {
        saleBadge.classList.add('hidden');
        saleBadge.style.display = 'none';
      }
    }

    if (soldOutBadge) {
      if (!isAvailable) {
        soldOutBadge.classList.remove('hidden');
        soldOutBadge.style.display = '';
      } else {
        soldOutBadge.classList.add('hidden');
        soldOutBadge.style.display = 'none';
      }
    }
  }

  function getPriceElementsForSection(sectionId) {
    const priceElements = new Set();
    const selectors = [
      `#price-${cssEscape(sectionId)}`,
      `#ProductInfo-${cssEscape(sectionId)}`,
      `[data-section="${cssEscape(sectionId)}"]`,
      `[data-section-id="${cssEscape(sectionId)}"]`,
    ];

    selectors.forEach((selector) => {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((node) => {
        if (!node) return;
        if (node.classList?.contains('price')) {
          priceElements.add(node);
        }
        if (typeof node.querySelectorAll === 'function') {
          node.querySelectorAll('.price').forEach((priceNode) => priceElements.add(priceNode));
        }
      });
    });

    return Array.from(priceElements);
  }

  function updateDisplayedPrice(sectionId, overrideVariant) {
    const priceElements = getPriceElementsForSection(sectionId);
    if (!priceElements.length) {
      return;
    }

    const variant = overrideVariant || getVariantForSelections(sectionId);
    if (!variant) {
      return;
    }

    const priceValue = typeof variant.price === 'number' ? variant.price : Number(variant.price);
    const compareValue =
      typeof variant.compare_at_price === 'number' ? variant.compare_at_price : Number(variant.compare_at_price);

    const isOnSale = compareValue > priceValue;

    priceElements.forEach((priceElement) => {
      if (!priceElement) return;

      // CRITICAL: Update the price--on-sale class on the parent price element
      // This class controls CSS visibility of .price__regular and .price__sale containers
      if (isOnSale) {
        priceElement.classList.add('price--on-sale');
      } else {
        priceElement.classList.remove('price--on-sale');
      }

      const regularPrice = priceElement.querySelector('.price__regular .price-item--regular');
      if (regularPrice && !Number.isNaN(priceValue)) {
        regularPrice.textContent = formatMoney(priceValue);
      }

      const salePrice = priceElement.querySelector('.price__sale .price-item--sale');
      if (salePrice && isOnSale && !Number.isNaN(priceValue)) {
        salePrice.textContent = formatMoney(priceValue);
      }

      const comparePrice = priceElement.querySelector('.price__sale .price-item--regular');
      const saleContainer = priceElement.querySelector('.price__sale');

      if (comparePrice) {
        if (isOnSale && !Number.isNaN(compareValue)) {
          comparePrice.textContent = formatMoney(compareValue);
          if (saleContainer) {
            saleContainer.style.removeProperty('display');
            saleContainer.classList.remove('hidden');
          }
        } else {
          comparePrice.textContent = '';
          if (saleContainer) {
            saleContainer.style.display = 'none';
            saleContainer.classList.add('hidden');
          }
        }
      } else if (saleContainer && !isOnSale) {
        saleContainer.style.display = 'none';
        saleContainer.classList.add('hidden');
      } else if (saleContainer) {
        saleContainer.style.removeProperty('display');
        saleContainer.classList.remove('hidden');
      }

      // Hide sale container entirely if there's nothing meaningful inside
      if (saleContainer) {
        const hasVisibleContent = Array.from(saleContainer.querySelectorAll('.price-item')).some(
          (node) => node.textContent && node.textContent.trim() !== ''
        );
        if (!hasVisibleContent) {
          saleContainer.style.display = 'none';
          saleContainer.classList.add('hidden');
        }
      }

      updateProductBadges(priceElement, variant);
    });
  }


  function findProductForm(sectionId) {
    const data = getSectionData(sectionId);
    let form = null;

    if (data?.productFormId) {
      form = document.getElementById(data.productFormId);
    }

    if (!form) {
      form = document.getElementById(`product-form-${sectionId}`);
    }

    if (!form) {
      const productFormElement = document.querySelector(
        `product-form[data-section-id="${cssEscape(sectionId)}"]`
      );
      if (productFormElement) {
        form = productFormElement.querySelector('form') || productFormElement;
      }
    }

    if (!form && data?.productFormId) {
      const fallback = document.querySelector(
        `form[id="${cssEscape(data.productFormId)}"]`
      );
      if (fallback) {
        form = fallback;
      }
    }

    return form || null;
  }

  function updateProductFormVariant(sectionId, variantId) {
    const form = findProductForm(sectionId);
    if (!form) return;
    const input = form.querySelector?.('input[name="id"]');
    if (!input) return;
    const stringValue = String(variantId);
    if (input.value === stringValue) return;
    input.value = stringValue;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderSizeOptions(sectionId) {
    // The sizes are now rendered in Liquid, so we just need to attach event listeners
    const data = getSectionData(sectionId);
    const sizeItems = document.querySelectorAll(`#size-drawer-${sectionId} .size-item:not(.size-drawer__calculator-button)`);

    if (!data || data.sizeOptionIndex < 0) {
      setStatus(sectionId, 'Tamanhos indisponíveis para este produto.');
      return;
    }

    // Get current selections for color filtering
    const selections = data.options.map((option) => getSelectedOptionValue(sectionId, option) || '');

    let activeColor = '';
    if (data.colorOptionIndex > -1) {
      activeColor = selections[data.colorOptionIndex];
      if (!activeColor) {
        const firstVariant = data.variants.find((variant) => Array.isArray(variant.options));
        if (firstVariant) {
          activeColor = firstVariant.options[data.colorOptionIndex] || '';
        }
      }
    }

    // Create a map of available variants for each size
    const sizeMap = new Map();
    data.variants.forEach((variant) => {
      if (!Array.isArray(variant.options)) return;

      // Filter by selected color if applicable
      if (data.colorOptionIndex > -1 && activeColor) {
        const variantColor = variant.options[data.colorOptionIndex];
        if (normalize(variantColor) !== normalize(activeColor)) return;
      }

      // Filter by other selected options
      for (let index = 0; index < data.options.length; index += 1) {
        if (index === data.sizeOptionIndex) continue;
        if (index === data.colorOptionIndex) continue;
        const selectedValue = selections[index];
        if (!selectedValue) continue;
        const variantValue = variant.options[index];
        if (normalize(variantValue) !== normalize(selectedValue)) {
          return;
        }
      }

      const sizeValue = variant.options[data.sizeOptionIndex];
      if (!sizeValue) return;

      const existing = sizeMap.get(sizeValue);
      if (!existing) {
        sizeMap.set(sizeValue, { variant, available: variant.available });
      } else if (!existing.available && variant.available) {
        existing.available = true;
        existing.variant = variant;
      }
    });

    // Update each size item based on availability and attach event listeners
    let hasAvailableOption = false;
    sizeItems.forEach((sizeItem) => {
      const sizeValue = sizeItem.dataset.size;
      const entry = sizeMap.get(sizeValue);

      // Remove existing event listeners by cloning the element
      const newSizeItem = sizeItem.cloneNode(true);
      sizeItem.parentNode.replaceChild(newSizeItem, sizeItem);

      if (!entry || !entry.available) {
        newSizeItem.classList.add('size-item--unavailable');
        newSizeItem.style.cursor = 'not-allowed';
        newSizeItem.style.pointerEvents = 'auto'; // Allow pointer events to show not-allowed cursor
      } else {
        hasAvailableOption = true;
        newSizeItem.classList.remove('size-item--unavailable');
        newSizeItem.style.cursor = 'pointer';
        newSizeItem.style.pointerEvents = 'auto';

        // Add both touch and click events for mobile compatibility
        const handleSelection = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSizeSelection(sectionId, entry.variant, newSizeItem);
        };

        newSizeItem.addEventListener('touchend', handleSelection, { passive: false });
        newSizeItem.addEventListener('click', handleSelection);
      }
    });

    // Apply recommendation labels if available
    if (typeof window.themeCalculatorDrawer !== 'undefined') {
      const savedMeasurements = window.themeCalculatorDrawer.loadSavedMeasurements();
      if (savedMeasurements) {
        const result = window.themeCalculatorDrawer.calculateSizeForSection(sectionId, savedMeasurements);
        window.themeCalculatorDrawer.applyRecommendationForSection(sectionId, result.recommendedSize);
      }
    }

    if (!hasAvailableOption) {
      setStatus(sectionId, 'Esgotado para a combinação selecionada.');
    } else {
      setStatus(sectionId, '');
    }
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (drawer && drawer.classList.contains('is-open')) {
      requestAnimationFrame(() => positionDrawer(sectionId));
    }
  }

  function resetTriggerLabel(sectionId, targetTrigger) {
    const state = ensureState(sectionId);
    const triggers = targetTrigger ? [targetTrigger] : state.triggers;

    triggers.forEach((trigger) => {
      if (!trigger) return;
      const data = state.triggerData.get(trigger);
      if (!data) return;

      if (data.resetTimer) {
        clearTimeout(data.resetTimer);
        data.resetTimer = null;
      }

      const label = trigger.querySelector('span');
      if (label && data.originalLabel) {
        label.textContent = data.originalLabel;
      }

      trigger.classList.remove('choose-size-btn--added', 'choose-size-btn--loading');
      trigger.removeAttribute('aria-busy');

      if (state.activeTrigger === trigger && !targetTrigger) {
        state.activeTrigger = null;
      }
    });
  }

  function handleSizeSelection(sectionId, variant, sizeItem) {
    if (!variant || !variant.id) return;

    // Remove active state from all size items in this drawer
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (drawer) {
      drawer.querySelectorAll('.size-item').forEach((element) => element.classList.remove('size-item--active'));
    }
    sizeItem.classList.add('size-item--active');

    // Mark that we're processing to prevent drawer refresh
    const state = ensureState(sectionId);
    state.isProcessing = true;

    syncVariantOptionSelections(sectionId, variant);
    updateProductFormVariant(sectionId, variant.id);
    updateDisplayedPrice(sectionId, variant);

    const chooseButton = state.activeTrigger || state.triggers[0] || null;
    const triggerData = chooseButton ? state.triggerData.get(chooseButton) : null;

    // Add loading message inline to the size item
    const stockSpan = sizeItem.querySelector('.size-item__stock');
    let originalStockText = '';
    if (stockSpan) {
      originalStockText = stockSpan.textContent;
      stockSpan.textContent = 'Adicionando...';
    } else {
      const loadingSpan = document.createElement('span');
      loadingSpan.className = 'size-item__stock size-item__loading-message';
      loadingSpan.textContent = 'Adicionando...';
      loadingSpan.style.marginLeft = '8px';
      sizeItem.appendChild(loadingSpan);
    }

    sizeItem.classList.add('size-item--loading');
    sizeItem.style.pointerEvents = 'none';

    if (chooseButton) {
      chooseButton.classList.add('choose-size-btn--loading');
      chooseButton.setAttribute('aria-busy', 'true');
      chooseButton.disabled = true;
    }

    addVariantToCart(sectionId, variant.id)
      .then(() => {
        // Show success message briefly before closing
        const loadingSpan = sizeItem.querySelector('.size-item__loading-message');
        if (loadingSpan) {
          loadingSpan.textContent = 'Adicionado!';
        }

        // Wait a moment so user can see the message, then close drawer
        setTimeout(() => {
          closeDrawer(sectionId);
        }, 800);

        if (chooseButton) {
          const label = chooseButton.querySelector('span');
          if (label) {
            label.textContent = 'Adicionado!';
          }
          chooseButton.classList.add('choose-size-btn--added');
          if (triggerData) {
            if (triggerData.resetTimer) {
              clearTimeout(triggerData.resetTimer);
            }
            triggerData.resetTimer = setTimeout(() => {
              triggerData.resetTimer = null;
              resetTriggerLabel(sectionId, chooseButton);
            }, 2000);
          }
        }
      })
      .catch((error) => {
        const message = error?.message || 'Erro ao adicionar ao carrinho.';

        // Show error inline
        if (stockSpan) {
          stockSpan.textContent = message;
        } else {
          const loadingSpan = sizeItem.querySelector('.size-item__loading-message');
          if (loadingSpan) {
            loadingSpan.textContent = message;
          }
        }
      })
      .finally(() => {
        // Clear processing flag
        state.isProcessing = false;

        sizeItem.classList.remove('size-item--loading');
        if (variant.available) {
          sizeItem.style.pointerEvents = 'auto';
        }
        if (chooseButton) {
          chooseButton.classList.remove('choose-size-btn--loading');
          chooseButton.removeAttribute('aria-busy');
          chooseButton.disabled = false;
        }

        // Restore original stock text or remove loading message after delay
        setTimeout(() => {
          if (stockSpan && originalStockText) {
            stockSpan.textContent = originalStockText;
          } else {
            const loadingSpan = sizeItem.querySelector('.size-item__loading-message');
            if (loadingSpan) {
              loadingSpan.remove();
            }
          }
        }, 1000);
      });
  }

  function addVariantToCart(sectionId, variantId) {
    return new Promise((resolve, reject) => {
      try {
        const cartElement =
          document.querySelector('cart-drawer') || document.querySelector('cart-notification');

        let config;
        if (typeof fetchConfig === 'function') {
          config = fetchConfig('javascript');
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          delete config.headers['Content-Type'];
        } else {
          config = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          };
        }

        if (config.headers && !config.headers['Content-Type']) {
          const body = new FormData();
          body.append('id', variantId);
          body.append('quantity', 1);
          if (cartElement && typeof cartElement.getSectionsToRender === 'function') {
            body.append(
              'sections',
              cartElement
                .getSectionsToRender()
                .map((section) => section.id)
            );
            body.append('sections_url', window.location.pathname);
            cartElement.setActiveElement?.(document.activeElement);
          }
          config.body = body;
        } else {
          config.body = JSON.stringify({ id: variantId, quantity: 1 });
        }

        fetch(`${routes.cart_add_url}`, config)
          .then((response) =>
            response.json().then((json) => ({
              ok: response.ok && !json.status,
              json,
            }))
          )
          .then(({ ok, json }) => {
            if (!ok) {
              const message =
                (json && (json.message || json.description)) ||
                'Erro ao adicionar ao carrinho.';
              throw new Error(message);
            }

            if (cartElement && typeof cartElement.renderContents === 'function') {
              cartElement.renderContents(json);
            } else if (window.routes?.cart_url) {
              window.location = window.routes.cart_url;
            } else {
              window.location = '/cart';
            }

            if (typeof publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
              publish(window.PUB_SUB_EVENTS.cartUpdate, {
                source: 'size-drawer',
                productVariantId: variantId,
                cartData: json,
              });
            }

            resolve(json);
          })
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  function openDrawer(sectionId, triggerElement) {
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (!drawer) {
      return;
    }

    // Debug: Check all variant-selects elements on page
    const allVariantSelects = document.querySelectorAll('variant-selects, variant-radios');
    allVariantSelects.forEach((el, index) => {
    });

    stopDesktopPositioning(sectionId);
    const state = ensureState(sectionId);
    renderSizeOptions(sectionId);

    // Check for saved measurements and auto-calculate recommendation
    if (typeof window.themeCalculatorDrawer !== 'undefined' &&
        typeof window.themeCalculatorDrawer.autoCalculateIfMeasurementsSaved === 'function') {
      window.themeCalculatorDrawer.autoCalculateIfMeasurementsSaved(sectionId);
    }

    state.lastFocused = triggerElement || document.activeElement;
    state.activeTrigger = triggerElement || state.triggers[0] || null;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    positionDrawer(sectionId);
    if (isDesktopViewport()) {
      startDesktopPositioning(sectionId);
      requestAnimationFrame(() => positionDrawer(sectionId));
    } else {
      clearDesktopStyles(drawer.querySelector('.size-drawer__content'));
    }

    const firstAvailable = drawer.querySelector('.size-item:not(.size-item--unavailable)');
    if (firstAvailable) {
      firstAvailable.focus();
    } else {
      const closeButton = drawer.querySelector('.size-drawer__close');
      closeButton?.focus();
    }
  }

  function closeDrawer(sectionId) {
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (!drawer) return;

    // Remove active state from all size items
    drawer.querySelectorAll('.size-item').forEach((element) => {
      element.classList.remove('size-item--active');
    });

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    stopDesktopPositioning(sectionId);
    const content = drawer.querySelector('.size-drawer__content');
    clearDesktopStyles(content);
    drawer.classList.remove('size-drawer--desktop');
    const state = stateBySection.get(sectionId);
    if (state) {
      if (state.lastFocused) {
        state.lastFocused.focus();
      }
      state.activeTrigger = null;
    }
  }

  function handleDocumentClick(event) {

    // IMPORTANT: Check for calculator button first and ignore it
    const calculatorButton = event.target.closest('[data-calculator-drawer-trigger]');
    if (calculatorButton) {
      return; // Let size-calculator-drawer.js handle it
    }

    const trigger = event.target.closest('[data-size-drawer-trigger]');
    if (trigger) {
      const sectionId = trigger.getAttribute('data-size-drawer-trigger');
      if (sectionId) {
        event.preventDefault();
        openDrawer(sectionId, trigger);
      } else {
      }
      return;
    }

    // Check if any drawer is open
    const openDrawerElement = document.querySelector('.size-drawer.is-open');
    if (openDrawerElement) {

      // Check if click is inside drawer content
      const drawerContent = event.target.closest('.size-drawer__content');

      if (!drawerContent) {
        // Click is outside drawer content, close the drawer
        const sectionId = openDrawerElement.dataset.sectionId;
        if (sectionId) {
          // Prevent default action and stop propagation to prevent clicking through to elements behind
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          closeDrawer(sectionId);
        }
        return;
      }
    }

    const closeTrigger = event.target.closest('[data-size-drawer-close]');
    if (closeTrigger) {
      const drawer = closeTrigger.closest('.size-drawer');
      if (drawer?.dataset.sectionId) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer(drawer.dataset.sectionId);
      }
      return;
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key !== 'Escape') return;
    const openDrawerElement = document.querySelector('.size-drawer.is-open');
    if (!openDrawerElement) return;
    event.preventDefault();
    closeDrawer(openDrawerElement.dataset.sectionId);
  }

  // New handler for variant change from pub/sub (after product-info.js updates)
  function handleVariantChangeFromPubSub(event) {
    const sectionId = event.data?.sectionId;
    const variant = event.data?.variant;

    if (!sectionId) return;


    // Use the variant from the event data if available
    updateDisplayedPrice(sectionId, variant);
  }

  // Keep the old handler for backwards compatibility but it's now disabled
  function handleVariantChange(event) {
    const variantElement = event.target.closest('variant-selects, variant-radios');
    if (!variantElement) return;
    const sourceSectionId = variantElement.dataset.section;
    if (!sourceSectionId) return;


    updateDisplayedPrice(sourceSectionId);

    // Only sync if we're not already syncing, and disable aggressive sync for now
    // syncVariantSelectionAcrossSections(event.target, sourceSectionId);

    // Update any open size drawers (but not if we're processing a cart addition)
    const openDrawers = document.querySelectorAll('.size-drawer.is-open');
    openDrawers.forEach(drawer => {
      const drawerSectionId = drawer.dataset.sectionId;
      if (drawerSectionId) {
        const state = stateBySection.get(drawerSectionId);
        if (state && state.isProcessing) {
          return;
        }
        renderSizeOptions(drawerSectionId);
      }
    });
  }

  function syncVariantSelectionAcrossSections(changedInput, sourceSectionId) {
    // Set sync flag to prevent infinite loops
    isSyncing = true;

    try {
      // Get the option name and value from the changed input
      const optionName = changedInput.name.split('-')[0];
      const optionValue = changedInput.value;


      // Find all variant-selects elements except the source
      const allVariantSelects = document.querySelectorAll('variant-selects, variant-radios');

      allVariantSelects.forEach(variantSelect => {
        if (variantSelect.dataset.section === sourceSectionId) return; // Skip source section

        // Find corresponding input in this section
        const targetSectionId = variantSelect.dataset.section;
        const matchingInput = variantSelect.querySelector(`input[name*="${optionName}"][value="${optionValue}"]`);

        if (matchingInput && !matchingInput.checked) {
          matchingInput.checked = true;
          // Dispatch change event but without bubbling to prevent loops
          matchingInput.dispatchEvent(new Event('change', { bubbles: false }));
        }
      });
    } finally {
      // Always reset the sync flag
      setTimeout(() => {
        isSyncing = false;
      }, 100);
    }
  }

  function handleProductInfoLoaded(event) {
    const productInfo = event.target.closest('product-info');
    const sectionId = productInfo?.dataset.section;
    if (!sectionId) return;
    hideProductSizeInputs(productInfo);
    resetTriggerLabel(sectionId);
    updateDisplayedPrice(sectionId);
  }

  function handleSectionLoad(event) {
    const sectionId =
      event.detail?.sectionId ||
      event.target?.id?.replace(/^shopify-section-/, '');
    if (!sectionId) return;
    hideProductSizeInputs(event.target);
    resetTriggerLabel(sectionId);
    updateDisplayedPrice(sectionId);
  }

  function initialize() {
    hideProductSizeInputs();
    document.addEventListener('click', handleDocumentClick, true); // Use capture phase
    document.addEventListener('keydown', handleDocumentKeydown);
    // Commenting out the change event listener - we'll use variantChange pubsub instead
    // document.addEventListener('change', handleVariantChange, true);

    // Subscribe to variant change events after product-info.js has updated
    if (typeof subscribe === 'function' && window.PUB_SUB_EVENTS?.variantChange) {
      subscribe(window.PUB_SUB_EVENTS.variantChange, handleVariantChangeFromPubSub);
    }

    document.addEventListener('product-info:loaded', handleProductInfoLoaded);
    document.addEventListener('shopify:section:load', handleSectionLoad);

    // Debug: Check for size drawer data

    // Debug: Check for size drawer triggers
    const triggers = document.querySelectorAll('[data-size-drawer-trigger]');

    if (window.themeSizeDrawerData && typeof window.themeSizeDrawerData === 'object') {
      Object.keys(window.themeSizeDrawerData).forEach((sectionKey) => {
        updateDisplayedPrice(sectionKey);
      });
    }
  }

  // Initialize with multiple fallbacks to ensure it runs
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Also try initializing after a short delay as fallback
  setTimeout(() => {
    initialize();
  }, 500);

  // Export functions to global scope for integration with other components
  window.themeSizeDrawer = {
    closeDrawer: closeDrawer,
    openDrawer: openDrawer
  };
})();
