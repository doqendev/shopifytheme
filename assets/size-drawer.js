(() => {
  const stateBySection = new Map();
  const COLOR_KEYWORDS = ['color', 'cor', 'colour'];
  const SIZE_KEYWORDS = ['size', 'tamanho', 'talla'];

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


  const getVariantSelectRoot = (sectionId) => document.getElementById(`variant-selects-${sectionId}`);

  function getSelectedOptionValue(sectionId, option) {
    const root = getVariantSelectRoot(sectionId);
    if (!root) {
      return getOptionValueString(option.selected_value);
    }

    const name = `${option.name}-${option.position}`;
    const radio = root.querySelector(`input[name="${cssEscape(name)}"]:checked`);
    if (radio) {
      return radio.value;
    }

    const selectName = `options[${option.name}]`;
    const select = root.querySelector(`select[name="${cssEscape(selectName)}"]`);
    if (select) {
      return select.value;
    }

    return getOptionValueString(option.selected_value);
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

  function updateProductFormVariant(sectionId, variantId) {
    const form = document.getElementById(`product-form-${sectionId}`);
    if (!form) return;
    const input = form.querySelector('input[name="id"]');
    if (!input) return;
    input.value = variantId;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderSizeOptions(sectionId) {
    const data = getSectionData(sectionId);
    const container = document.getElementById(`size-options-${sectionId}`);
    if (!container) return;

    container.innerHTML = '';
    setStatus(sectionId, '');

    if (!data || data.sizeOptionIndex < 0) {
      setStatus(sectionId, 'Tamanhos indisponiveis para este produto.');
      return;
    }

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

    const orderedSizes = [];
    const sizeOption = data.options[data.sizeOptionIndex];
    if (sizeOption && Array.isArray(sizeOption.values)) {
      sizeOption.values.forEach((value) => {
        const label = getOptionValueString(value);
        if (label && !orderedSizes.includes(label)) {
          orderedSizes.push(label);
        }
      });
    }
    if (!orderedSizes.length) {
      data.variants.forEach((variant) => {
        const sizeValue = variant.options?.[data.sizeOptionIndex];
        if (sizeValue && !orderedSizes.includes(sizeValue)) {
          orderedSizes.push(sizeValue);
        }
      });
    }

    const sizeMap = new Map();
    data.variants.forEach((variant) => {
      if (!Array.isArray(variant.options)) return;

      if (data.colorOptionIndex > -1 && activeColor) {
        const variantColor = variant.options[data.colorOptionIndex];
        if (normalize(variantColor) !== normalize(activeColor)) return;
      }

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

    if (!orderedSizes.length) {
      setStatus(sectionId, 'Tamanhos indisponiveis para este produto.');
      return;
    }

    let hasAvailableOption = false;
    orderedSizes.forEach((sizeValue) => {
      if (!sizeValue) return;
      const entry = sizeMap.get(sizeValue);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'size-option';
      button.dataset.size = sizeValue;
      button.setAttribute('role', 'option');
      button.textContent = sizeValue;

      if (!entry) {
        button.disabled = true;
        button.classList.add('size-option--unavailable');
        button.setAttribute('aria-disabled', 'true');
      } else if (!entry.available) {
        button.disabled = true;
        button.classList.add('size-option--unavailable');
        button.setAttribute('aria-disabled', 'true');
      } else {
        hasAvailableOption = true;
        button.dataset.variantId = String(entry.variant.id);
        button.addEventListener('click', () => handleSizeSelection(sectionId, entry.variant, button));
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSizeSelection(sectionId, entry.variant, button);
          }
        });
      }

      container.appendChild(button);
    });

    if (!hasAvailableOption) {
      setStatus(sectionId, 'Esgotado para a combinacao selecionada.');
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

  function handleSizeSelection(sectionId, variant, button) {
    if (!variant || !variant.id) return;

    const container = document.getElementById(`size-options-${sectionId}`);
    if (container) {
      container.querySelectorAll('.size-option').forEach((element) => element.classList.remove('size-option--active'));
    }
    button.classList.add('size-option--active');

    updateProductFormVariant(sectionId, variant.id);

    const state = ensureState(sectionId);
    const chooseButton = state.activeTrigger || state.triggers[0] || null;
    const triggerData = chooseButton ? state.triggerData.get(chooseButton) : null;

    setStatus(sectionId, 'Adicionando ao carrinho...');
    button.classList.add('size-option--loading');
    button.disabled = true;

    if (chooseButton) {
      chooseButton.classList.add('choose-size-btn--loading');
      chooseButton.setAttribute('aria-busy', 'true');
      chooseButton.disabled = true;
    }

    addVariantToCart(sectionId, variant.id)
      .then(() => {
        closeDrawer(sectionId);
        setStatus(sectionId, 'Adicionado ao carrinho.');
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
        setStatus(sectionId, message);
      })
      .finally(() => {
        button.classList.remove('size-option--loading');
        if (variant.available) {
          button.disabled = false;
        }
        if (chooseButton) {
          chooseButton.classList.remove('choose-size-btn--loading');
          chooseButton.removeAttribute('aria-busy');
          chooseButton.disabled = false;
        }
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
    if (!drawer) return;

    const state = ensureState(sectionId);
    renderSizeOptions(sectionId);

    state.lastFocused = triggerElement || document.activeElement;
    state.activeTrigger = triggerElement || state.triggers[0] || null;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');

    const firstAvailable = drawer.querySelector('.size-option:not([disabled])');
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
    const trigger = event.target.closest('[data-size-drawer-trigger]');
    if (trigger) {
      const sectionId = trigger.getAttribute('data-size-drawer-trigger');
      if (sectionId) {
        event.preventDefault();
        openDrawer(sectionId, trigger);
      }
      return;
    }

    const closeTrigger = event.target.closest('[data-size-drawer-close]');
    if (closeTrigger) {
      const drawer = closeTrigger.closest('.size-drawer');
      if (drawer?.dataset.sectionId) {
        closeDrawer(drawer.dataset.sectionId);
      }
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
    const sectionId = variantSelects.dataset.section;
    if (!sectionId) return;
    const drawer = document.getElementById(`size-drawer-${sectionId}`);
    if (!drawer || !drawer.classList.contains('is-open')) return;
    renderSizeOptions(sectionId);
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
    hideProductSizeInputs();
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('change', handleVariantChange, true);
    document.addEventListener('product-info:loaded', handleProductInfoLoaded);
    document.addEventListener('shopify:section:load', handleSectionLoad);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
