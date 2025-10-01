(() => {
  const stateBySection = new Map();
  const COLOR_KEYWORDS = ['color', 'cor', 'colour'];
  const SIZE_KEYWORDS = ['size', 'tamanho', 'talla'];

  // Flag to prevent infinite sync loops
  let isSyncing = false;

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
    const wrappers = root.querySelectorAll('variant-selects .product-form__input, .product-form__input');
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


  const getVariantSelectRoot = (sectionId) => {
    const root = document.getElementById(`variant-selects-${sectionId}`);
    console.log(`Looking for variant-selects-${sectionId}:`, root);

    // Also try to find by data-section attribute as fallback
    if (!root) {
      const fallback = document.querySelector(`variant-selects[data-section="${sectionId}"]`);
      console.log(`Fallback search for variant-selects with data-section="${sectionId}":`, fallback);
      return fallback;
    }

    return root;
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

    const escapedSectionId = cssEscape(sectionId);
    let roots = Array.from(document.querySelectorAll(`variant-selects[data-section="${escapedSectionId}"]`));
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
    // First try the specific section
    const root = getVariantSelectRoot(sectionId);
    console.log(`Getting selected value for option "${option.name}" in section "${sectionId}"`);
    console.log('Variant select root:', root);

    let selectedValue = null;

    if (root) {
      // Debug: Show all inputs in this section
      const allInputs = root.querySelectorAll('input');
      console.log('All inputs in this section:', allInputs);
      allInputs.forEach((input, index) => {
        console.log(`  Input ${index + 1}: name="${input.name}", value="${input.value}", checked=${input.checked}, type=${input.type}`);
      });

      // Try multiple naming patterns for the inputs
      const patterns = [
        `${option.name}-${option.position}`, // Original pattern: Color-1
        `${sectionId}-${option.position}-1`, // Section-based pattern: template--...-1-1
        `${sectionId}-${option.position}-${option.position}`, // Section-based pattern alt
        `${option.name}` // Simple name: Color
      ];

      // Also try finding by checking all radios and matching name (handling newlines)
      const allRadios = root.querySelectorAll('input[type="radio"]:checked');
      console.log('All checked radios in section:', allRadios);
      for (const radio of allRadios) {
        const trimmedName = radio.name.trim();
        console.log(`Checking radio: name="${radio.name}" (trimmed: "${trimmedName}"), value="${radio.value}"`);
        if (trimmedName === `${option.name}-${option.position}`) {
          selectedValue = radio.value;
          console.log(`Found checked radio with trimmed name match: ${selectedValue}`);
          break;
        }
      }

      // If still no match, try the original pattern matching
      if (!selectedValue) {
        for (const pattern of patterns) {
          const radio = root.querySelector(`input[name="${cssEscape(pattern)}"]:checked`);
          console.log(`Looking for radio with pattern "${pattern}":`, radio);
          if (radio) {
            selectedValue = radio.value;
            console.log(`Radio value found with pattern ${pattern}: ${selectedValue}`);
            break;
          }
        }
      }

      // If no radio found, try select
      if (!selectedValue) {
        const selectName = `options[${option.name}]`;
        const select = root.querySelector(`select[name="${cssEscape(selectName)}"]`);
        console.log(`Looking for select with name "${selectName}":`, select);
        if (select) {
          selectedValue = select.value;
          console.log(`Select value found in section ${sectionId}: ${selectedValue}`);
        }
      }
    }

    // If no value found in specific section, search across ALL variant-selects elements
    if (!selectedValue) {
      console.log('No value found in specific section, searching all variant-selects...');
      const allVariantSelects = document.querySelectorAll('variant-selects');

      for (const variantSelect of allVariantSelects) {
        const targetSectionId = variantSelect.dataset.section;

        // First try checking all radios for trimmed name match
        const allRadios = variantSelect.querySelectorAll('input[type="radio"]:checked');
        for (const radio of allRadios) {
          const trimmedName = radio.name.trim();
          if (trimmedName === `${option.name}-${option.position}`) {
            selectedValue = radio.value;
            console.log(`Found checked radio in section ${targetSectionId} with trimmed name match: ${selectedValue}`);
            break;
          }
        }

        if (selectedValue) break;

        // If no match, try multiple naming patterns for each section
        const patterns = [
          `${option.name}-${option.position}`, // Original pattern: Color-1
          `${targetSectionId}-${option.position}-1`, // Section-based pattern: template--...-1-1
          `${targetSectionId}-${option.position}-${option.position}`, // Section-based pattern alt
          `${option.name}` // Simple name: Color
        ];

        for (const pattern of patterns) {
          const radio = variantSelect.querySelector(`input[name="${cssEscape(pattern)}"]:checked`);
          if (radio) {
            selectedValue = radio.value;
            console.log(`Found radio value in section ${targetSectionId} with pattern ${pattern}: ${selectedValue}`);
            break;
          }
        }

        if (selectedValue) break;

        const selectName = `options[${option.name}]`;
        const select = variantSelect.querySelector(`select[name="${cssEscape(selectName)}"]`);
        if (select && select.value) {
          selectedValue = select.value;
          console.log(`Found select value in section ${targetSectionId}: ${selectedValue}`);
          break;
        }
      }
    }

    // Final fallback to default value
    if (!selectedValue) {
      selectedValue = getOptionValueString(option.selected_value);
      console.log(`Using fallback default value: ${selectedValue}`);
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

  function setStatus(sectionId, message) {
    const status = document.getElementById(`size-drawer-status-${sectionId}`);
    if (status) {
      status.textContent = message || '';
    }
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
    const sizeItems = document.querySelectorAll(`#size-drawer-${sectionId} .size-item`);

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

    if (!hasAvailableOption) {
      setStatus(sectionId, 'Esgotado para a combinação selecionada.');
    } else {
      setStatus(sectionId, '');
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
    console.log('handleSizeSelection called:', sectionId, variant, sizeItem);
    if (!variant || !variant.id) return;

    // Remove active state from all size items in this drawer
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (drawer) {
      drawer.querySelectorAll('.size-item').forEach((element) => element.classList.remove('size-item--active'));
    }
    sizeItem.classList.add('size-item--active');

    syncVariantOptionSelections(sectionId, variant);
    updateProductFormVariant(sectionId, variant.id);

    const state = ensureState(sectionId);
    const chooseButton = state.activeTrigger || state.triggers[0] || null;
    const triggerData = chooseButton ? state.triggerData.get(chooseButton) : null;

    // Add loading message inline to the size item
    const stockSpan = sizeItem.querySelector('.size-item__stock');
    console.log('stockSpan found:', stockSpan);
    let originalStockText = '';
    if (stockSpan) {
      originalStockText = stockSpan.textContent;
      console.log('Setting stockSpan to Adicionando...');
      stockSpan.textContent = 'Adicionando...';
    } else {
      console.log('Creating new loading span');
      const loadingSpan = document.createElement('span');
      loadingSpan.className = 'size-item__stock size-item__loading-message';
      loadingSpan.textContent = 'Adicionando...';
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
        closeDrawer(sectionId);
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
        console.error('Size drawer add to cart failed', error);
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
    console.log('openDrawer called for section:', sectionId);
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    console.log('Drawer element found:', drawer);
    if (!drawer) {
      console.error('No drawer found for section:', sectionId);
      return;
    }

    // Debug: Check all variant-selects elements on page
    const allVariantSelects = document.querySelectorAll('variant-selects');
    console.log('All variant-selects elements on page:', allVariantSelects);
    allVariantSelects.forEach((el, index) => {
      console.log(`  ${index + 1}. ID: ${el.id}, data-section: ${el.dataset.section}`);
    });

    const state = ensureState(sectionId);
    console.log('State ensured for section:', sectionId, state);
    renderSizeOptions(sectionId);

    state.lastFocused = triggerElement || document.activeElement;
    state.activeTrigger = triggerElement || state.triggers[0] || null;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');

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
    const state = stateBySection.get(sectionId);
    if (state) {
      if (state.lastFocused) {
        state.lastFocused.focus();
      }
      state.activeTrigger = null;
    }
  }

  function handleDocumentClick(event) {
    console.log('Document click detected:', event.target);

    const trigger = event.target.closest('[data-size-drawer-trigger]');
    if (trigger) {
      const sectionId = trigger.getAttribute('data-size-drawer-trigger');
      console.log('Size drawer clicked! Section ID:', sectionId);
      if (sectionId) {
        event.preventDefault();
        console.log('Opening drawer for section:', sectionId);
        openDrawer(sectionId, trigger);
      } else {
        console.error('No section ID found on trigger:', trigger);
      }
      return;
    }

    // Check if any drawer is open
    const openDrawerElement = document.querySelector('.size-drawer.is-open');
    if (openDrawerElement) {
      console.log('Open drawer detected:', openDrawerElement);

      // Check if click is inside drawer content
      const drawerContent = event.target.closest('.size-drawer__content');
      console.log('Click inside drawer content?:', !!drawerContent);

      if (!drawerContent) {
        // Click is outside drawer content, close the drawer
        const sectionId = openDrawerElement.dataset.sectionId;
        console.log('Closing drawer (clicked outside) for section:', sectionId);
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
    console.log('Close trigger found:', closeTrigger);
    if (closeTrigger) {
      const drawer = closeTrigger.closest('.size-drawer');
      console.log('Drawer found from close trigger:', drawer);
      console.log('Drawer sectionId:', drawer?.dataset.sectionId);
      if (drawer?.dataset.sectionId) {
        console.log('Closing drawer for section:', drawer.dataset.sectionId);
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

  function handleVariantChange(event) {
    const variantSelects = event.target.closest('variant-selects');
    if (!variantSelects) return;
    const sourceSectionId = variantSelects.dataset.section;
    if (!sourceSectionId) return;

    console.log('Variant change detected in section:', sourceSectionId);

    // Only sync if we're not already syncing, and disable aggressive sync for now
    // syncVariantSelectionAcrossSections(event.target, sourceSectionId);

    // Update any open size drawers
    const openDrawers = document.querySelectorAll('.size-drawer.is-open');
    openDrawers.forEach(drawer => {
      const drawerSectionId = drawer.dataset.sectionId;
      if (drawerSectionId) {
        console.log('Refreshing size options for open drawer:', drawerSectionId);
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

      console.log(`Syncing ${optionName} = ${optionValue} from section ${sourceSectionId} to all sections`);

      // Find all variant-selects elements except the source
      const allVariantSelects = document.querySelectorAll('variant-selects');

      allVariantSelects.forEach(variantSelect => {
        if (variantSelect.dataset.section === sourceSectionId) return; // Skip source section

        // Find corresponding input in this section
        const targetSectionId = variantSelect.dataset.section;
        const matchingInput = variantSelect.querySelector(`input[name*="${optionName}"][value="${optionValue}"]`);

        if (matchingInput && !matchingInput.checked) {
          console.log(`Syncing to section ${targetSectionId}: setting ${optionName} to ${optionValue}`);
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
  }

  function handleSectionLoad(event) {
    const sectionId =
      event.detail?.sectionId ||
      event.target?.id?.replace(/^shopify-section-/, '');
    if (!sectionId) return;
    hideProductSizeInputs(event.target);
    resetTriggerLabel(sectionId);
  }

  function initialize() {
    console.log('Size drawer initializing...');
    hideProductSizeInputs();
    document.addEventListener('click', handleDocumentClick, true); // Use capture phase
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('change', handleVariantChange, true);
    document.addEventListener('product-info:loaded', handleProductInfoLoaded);
    document.addEventListener('shopify:section:load', handleSectionLoad);
    console.log('Size drawer initialized. Event listeners attached.');

    // Debug: Check for size drawer data
    console.log('Size drawer data:', window.themeSizeDrawerData);

    // Debug: Check for size drawer triggers
    const triggers = document.querySelectorAll('[data-size-drawer-trigger]');
    console.log('Found size drawer triggers:', triggers.length, triggers);
  }

  // Initialize with multiple fallbacks to ensure it runs
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Also try initializing after a short delay as fallback
  setTimeout(() => {
    console.log('Size drawer delayed initialization attempt...');
    initialize();
  }, 500);
})();
