/**
 * SIZE CALCULATOR DRAWER
 * Handles size recommendation based on user measurements
 */

(() => {
  'use strict';


  // ============================================
  // CONFIGURATION
  // ============================================

  const CONFIG = {
    STORAGE_KEY: 'sizeCalculatorMeasurements',
    MEASUREMENT_EXPIRY_DAYS: 30,
    Z_INDEX: 10001,
  };

  const RECOMMENDED_PREFIX = 'Recomendado';
  const SIZE_ORDER = ['xxxs', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];
  const SIZE_ALIAS_MAP = {
    pp: 'xs',
    p: 's',
    m: 'm',
    g: 'l',
    gg: 'xl',
    xg: 'xl',
    xgg: 'xxl',
    xggg: 'xxxl',
  };

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const calculatorState = new Map();

  function ensureState(sectionId) {
    let state = calculatorState.get(sectionId);
    if (!state) {
      state = {
        lastFocused: null,
        isProcessing: false,
        currentStep: 1,
        selectedValues: {
          belly: null,
          shoulders: null,
        },
      };
      calculatorState.set(sectionId, state);
    }
    return state;
  }

  // ============================================
  // PRODUCT DATA + SIZE NORMALIZATION
  // ============================================

  function normalizeSizeValue(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getSectionData(sectionId) {
    if (!sectionId || !window.themeCalculatorDrawerData) return null;
    return window.themeCalculatorDrawerData[sectionId] || null;
  }

  function collectAvailableSizes(sectionId) {
    const data = getSectionData(sectionId);
    if (data && Array.isArray(data.availableSizes) && data.availableSizes.length) {
      return data.availableSizes.slice();
    }

    const sizesFromDrawer = [];
    const sizeDrawer = document.getElementById(`size-drawer-${sectionId}`);
    if (sizeDrawer) {
      sizeDrawer.querySelectorAll('.size-item[data-size]').forEach((item) => {
        const size = item.dataset.size;
        if (size) sizesFromDrawer.push(size);
      });
    }

    if (sizesFromDrawer.length) {
      return sizesFromDrawer;
    }

    const sizesFromCards = [];
    const triggers = document.querySelectorAll(`[data-calculator-drawer-trigger="${sectionId}"]`);
    triggers.forEach((trigger) => {
      const container = trigger.closest('.size-options');
      if (!container) return;
      container.querySelectorAll('.size-option[data-size]').forEach((option) => {
        const size = option.dataset.size;
        if (size) sizesFromCards.push(size);
      });
    });

    return sizesFromCards;
  }

  function parseSizeLabel(label) {
    const raw = String(label || '').trim();
    if (!raw) return null;

    const normalized = raw.toLowerCase();

    if (
      normalized === 'tu' ||
      normalized === 'u' ||
      normalized === 'unico' ||
      normalized === 'único' ||
      normalized.includes('one size') ||
      normalized.includes('tamanho unico') ||
      normalized.includes('tamanho único')
    ) {
      return { raw, type: 'onesize' };
    }

    const numericMatches = normalized.match(/\d+(?:[.,]\d+)?/g);
    if (numericMatches && numericMatches.length) {
      const values = numericMatches
        .map((match) => parseFloat(match.replace(',', '.')))
        .filter((value) => !Number.isNaN(value));
      if (values.length) {
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        return { raw, type: 'numeric', value: average };
      }
    }

    const letterMatches = normalized.match(/xxxxl|xxxl|xxl|xl|xxxs|xxs|xs|s|m|l/g);
    if (letterMatches && letterMatches.length) {
      const indices = letterMatches
        .map((match) => SIZE_ORDER.indexOf(match))
        .filter((index) => index >= 0);
      if (indices.length) {
        const averageIndex = indices.reduce((sum, index) => sum + index, 0) / indices.length;
        return { raw, type: 'letter', valueIndex: averageIndex };
      }
    }

    const compact = normalized.replace(/[^a-z]/g, '');
    if (SIZE_ALIAS_MAP[compact]) {
      const mapped = SIZE_ALIAS_MAP[compact];
      const mappedIndex = SIZE_ORDER.indexOf(mapped);
      return { raw, type: 'letter', valueIndex: mappedIndex };
    }

    return { raw, type: 'unknown' };
  }

  function selectBestSize(availableSizes, baseIndex, baseScore) {
    if (!availableSizes || !availableSizes.length) return null;

    const parsed = availableSizes.map(parseSizeLabel).filter(Boolean);

    const oneSize = parsed.find((entry) => entry.type === 'onesize');
    if (oneSize) return oneSize.raw;

    const letterSizes = parsed.filter((entry) => entry.type === 'letter' && typeof entry.valueIndex === 'number');
    if (letterSizes.length) {
      const targetIndex = typeof baseIndex === 'number'
        ? baseIndex
        : (typeof baseScore === 'number' ? baseScore * (SIZE_ORDER.length - 1) : letterSizes[0].valueIndex);

      let best = letterSizes[0];
      letterSizes.forEach((entry) => {
        if (Math.abs(entry.valueIndex - targetIndex) < Math.abs(best.valueIndex - targetIndex)) {
          best = entry;
        }
      });
      return best.raw;
    }

    const numericSizes = parsed.filter((entry) => entry.type === 'numeric' && typeof entry.value === 'number');
    if (numericSizes.length) {
      numericSizes.sort((a, b) => a.value - b.value);
      const rawIndex = typeof baseScore === 'number' ? Math.round(baseScore * (numericSizes.length - 1)) : Math.floor((numericSizes.length - 1) / 2);
      const index = Math.min(Math.max(rawIndex, 0), numericSizes.length - 1);
      return numericSizes[index].raw;
    }

    return availableSizes[0];
  }

  function setRecommendedLabel(labelElement, isRecommended) {
    if (!labelElement) return;
    if (!labelElement.dataset.originalLabel) {
      labelElement.dataset.originalLabel = labelElement.textContent.trim();
    }
    const original = labelElement.dataset.originalLabel;
    labelElement.textContent = isRecommended ? `${RECOMMENDED_PREFIX} ${original}` : original;
  }

  // ============================================
  // STEP NAVIGATION
  // ============================================

  function goToStep(drawer, stepNumber) {
    const sectionId = drawer.dataset.sectionId;
    const state = ensureState(sectionId);


    // Hide all step contents
    const stepContents = drawer.querySelectorAll('[data-step-content]');
    stepContents.forEach(content => {
      content.hidden = true;
    });

    // Show target step content
    const targetContent = drawer.querySelector(`[data-step-content="${stepNumber}"]`);
    if (targetContent) {
      targetContent.hidden = false;
    }

    // Update step indicators
    const stepIndicators = drawer.querySelectorAll('[data-step-indicator]');
    stepIndicators.forEach((indicator, index) => {
      const indicatorStep = parseInt(indicator.dataset.stepIndicator, 10);
      indicator.classList.remove('calculator-step--active', 'calculator-step--completed');

      if (indicatorStep < stepNumber) {
        indicator.classList.add('calculator-step--completed');
      } else if (indicatorStep === stepNumber) {
        indicator.classList.add('calculator-step--active');
      }
    });

    // Update drawer data attribute
    drawer.dataset.currentStep = stepNumber;
    state.currentStep = stepNumber;
  }

  function validateStep1(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      return false;
    }

    const idade = form.querySelector('[name="idade"]');
    const altura = form.querySelector('[name="altura"]');
    const peso = form.querySelector('[name="peso"]');


    // Check if all fields are filled and valid
    if (!idade || !idade.value || !idade.checkValidity()) {
      return false;
    }
    if (!altura || !altura.value || !altura.checkValidity()) {
      return false;
    }
    if (!peso || !peso.value || !peso.checkValidity()) {
      return false;
    }

    return true;
  }

  function validateStep2(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      return false;
    }

    const belly = form.querySelector('[name="belly"]');
    const shoulders = form.querySelector('[name="shoulders"]');


    if (!belly || !belly.value) {
      return false;
    }

    if (!shoulders || !shoulders.value) {
      return false;
    }

    return true;
  }

  function handleNextStep(drawer) {
    const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);

    // Validate step 1 before proceeding to step 2
    if (currentStep === 1) {
      if (!validateStep1(drawer)) {
        showStatus(drawer, 'Por favor, preencha todos os campos corretamente.', 'error');
        return;
      }
      // ALWAYS go to step 2 from step 1
      goToStep(drawer, 2);
      return;
    }

    // For other steps, advance normally
    const targetStep = currentStep + 1;
    goToStep(drawer, targetStep);

    // Verify the step was changed
    setTimeout(() => {
    }, 100);
  }

  function handlePrevStep(drawer) {
    const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);
    if (currentStep > 1) {
      goToStep(drawer, currentStep - 1);
    }
  }

  // ============================================
  // LOCALSTORAGE MANAGEMENT
  // ============================================

  function saveMeasurements(measurements) {
    try {
      const data = {
        ...measurements,
        timestamp: Date.now(),
      };
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadSavedMeasurements() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!data) return null;

      const measurements = JSON.parse(data);

      // Check if measurements are still valid (within expiry period)
      const expiryTime = CONFIG.MEASUREMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - measurements.timestamp > expiryTime) {
        // Measurements are too old, remove them
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        return null;
      }

      return measurements;
    } catch (error) {
      return null;
    }
  }

  function clearSavedMeasurements() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // SIZE CALCULATION ALGORITHM
  // ============================================

  function calculateBaseSize(measurements) {
    const { altura, peso, belly, shoulders } = measurements;

    const heightInMeters = altura / 100;
    const bmi = peso / (heightInMeters * heightInMeters);

    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    let baseSize = 'M';

    if (bmi < 18.5) {
      baseSize = 'XS';
    } else if (bmi < 22) {
      baseSize = 'S';
    } else if (bmi < 25) {
      baseSize = 'M';
    } else if (bmi < 28) {
      baseSize = 'L';
    } else if (bmi < 32) {
      baseSize = 'XL';
    } else {
      baseSize = 'XXL';
    }

    let baseIndex = SIZE_ORDER.indexOf(baseSize.toLowerCase());
    if (baseIndex === -1) {
      baseIndex = SIZE_ORDER.indexOf('m');
    }

    if (belly === 'broad' || shoulders === 'broad') {
      if (baseIndex < SIZE_ORDER.length - 1) {
        baseIndex += 1;
      }
    } else if (belly === 'slim' && shoulders === 'narrow') {
      if (baseIndex > 0) {
        baseIndex -= 1;
      }
    }

    const adjustedBaseSize = SIZE_ORDER[baseIndex]
      ? SIZE_ORDER[baseIndex].toUpperCase()
      : baseSize;

    const baseScore = baseIndex / Math.max(1, SIZE_ORDER.length - 1);

    return {
      baseSize: adjustedBaseSize,
      baseIndex,
      baseScore,
      bmi: bmi.toFixed(1),
    };
  }

  function calculateSize(measurements, sectionId) {
    const base = calculateBaseSize(measurements);
    const availableSizes = sectionId ? collectAvailableSizes(sectionId) : [];
    const recommendedSize = selectBestSize(availableSizes, base.baseIndex, base.baseScore) || base.baseSize;

    return {
      recommendedSize,
      confidence: 'high',
      message: `Com base nas tuas medidas, recomendamos o tamanho ${recommendedSize}.`,
      bmi: base.bmi,
      baseSize: base.baseSize,
    };
  }

  function calculateSizeForSection(sectionId, measurements) {
    return calculateSize(measurements, sectionId);
  }

  // ============================================
  // DRAWER CONTROLS
  // ============================================

  function openCalculatorDrawer(sectionId) {
    const drawerId = `size-calculator-drawer-${sectionId}`;

    const drawer = document.getElementById(drawerId);

    if (!drawer) {
      document.querySelectorAll('.size-calculator-drawer').forEach(d => {
      });
      document.querySelectorAll('[data-calculator-drawer-trigger]').forEach(btn => {
      });
      return;
    }

    // Close any open size drawer before opening calculator drawer
    const openSizeDrawer = document.querySelector('.size-drawer.is-open');
    if (openSizeDrawer && openSizeDrawer.dataset.sectionId) {
      // Call the size drawer's close function if available
      if (window.themeSizeDrawer && typeof window.themeSizeDrawer.closeDrawer === 'function') {
        window.themeSizeDrawer.closeDrawer(openSizeDrawer.dataset.sectionId);
      } else {
        // Fallback: manually close the drawer
        openSizeDrawer.classList.remove('is-open');
        openSizeDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    const state = ensureState(sectionId);

    // Store last focused element
    state.lastFocused = document.activeElement;

    // Reset form if exists
    const form = drawer.querySelector('[data-calculator-form]');
    if (form) {
      form.reset();

      // Load saved measurements if available
      const savedMeasurements = loadSavedMeasurements();
      if (savedMeasurements) {
        form.querySelector('[name="idade"]').value = savedMeasurements.idade || '';
        form.querySelector('[name="altura"]').value = savedMeasurements.altura || '';
        form.querySelector('[name="peso"]').value = savedMeasurements.peso || '';

        // Pre-select body types
        if (savedMeasurements.belly) {
          const bellyOption = drawer.querySelector(`[data-selector-group="belly"] [data-value="${savedMeasurements.belly}"]`);
          if (bellyOption) bellyOption.click();
        }
        if (savedMeasurements.shoulders) {
          const shouldersOption = drawer.querySelector(`[data-selector-group="shoulders"] [data-value="${savedMeasurements.shoulders}"]`);
          if (shouldersOption) shouldersOption.click();
        }
      }
    }

    // Reset to step 1
    goToStep(drawer, 1);

    // Open drawer
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');

    // Check computed styles
    const computedStyle = window.getComputedStyle(drawer);

    // Check drawer content element
    const drawerContent = drawer.querySelector('.size-calculator-drawer__content');
    if (drawerContent) {
      const contentStyle = window.getComputedStyle(drawerContent);
    } else {
    }

    // Check if drawer is in viewport
    const rect = drawer.getBoundingClientRect();

    // Check parent elements for ALL potential issues
    let parent = drawer.parentElement;
    let depth = 0;
    while (parent && depth < 8) {
      const parentStyle = window.getComputedStyle(parent);
      const parentRect = parent.getBoundingClientRect();


      parent = parent.parentElement;
      depth++;
    }


    // Focus first input
    setTimeout(() => {
      const firstInput = drawer.querySelector('input[type="number"]');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function closeCalculatorDrawer(sectionId) {
    const drawer = document.getElementById(`size-calculator-drawer-${sectionId}`);
    if (!drawer) return;

    const state = calculatorState.get(sectionId);

    // Close drawer
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (state && state.lastFocused) {
      state.lastFocused.focus();
    }

    // Reset selected values
    if (state) {
      state.selectedValues = {
        belly: null,
        shoulders: null,
      };
    }
  }

  // ============================================
  // VISUAL OPTION SELECTION
  // ============================================

  function handleVisualOptionClick(option) {
    const selector = option.closest('.calculator-visual-selector');
    if (!selector) return;

    const group = selector.dataset.selectorGroup;
    const value = option.dataset.value;

    // Remove selection from all options in this group
    const allOptions = selector.querySelectorAll('[data-visual-option]');
    allOptions.forEach((opt) => {
      opt.classList.remove('is-selected');
      opt.setAttribute('aria-checked', 'false');
    });

    // Add selection to clicked option
    option.classList.add('is-selected');
    option.setAttribute('aria-checked', 'true');

    // Update hidden input
    const drawer = option.closest('.size-calculator-drawer');
    const hiddenInput = drawer.querySelector(`input[name="${group}"]`);
    if (hiddenInput) {
      hiddenInput.value = value;
    }

    // Update state
    const sectionId = drawer.dataset.sectionId;
    const state = ensureState(sectionId);
    state.selectedValues[group] = value;
  }

  // ============================================
  // FORM HANDLING
  // ============================================

  function handleFormSubmit(form) {
    const drawer = form.closest('.size-calculator-drawer');
    if (!drawer) return;

    const sectionId = drawer.dataset.sectionId;
    const state = ensureState(sectionId);

    // Prevent double submission
    if (state.isProcessing) return;

    // Validate current step - form can only be submitted from Step 2
    const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);

    if (currentStep !== 2) {
      return;
    }

    // Validate Step 1 fields
    if (!validateStep1(drawer)) {
      showStatus(drawer, 'Por favor, preencha todos os campos de medidas.', 'error');
      return;
    }

    // Validate Step 2 fields
    if (!validateStep2(drawer)) {
      showStatus(drawer, 'Por favor, selecione o tipo de barriga e ombros.', 'error');
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const measurements = {
      idade: parseInt(formData.get('idade'), 10),
      altura: parseInt(formData.get('altura'), 10),
      peso: parseInt(formData.get('peso'), 10),
      belly: formData.get('belly'),
      shoulders: formData.get('shoulders'),
    };

    // Set processing state
    state.isProcessing = true;
    form.classList.add('calculator-form--loading');

    // Simulate calculation delay (remove in production)
    setTimeout(() => {
      // Calculate size
      const result = calculateSizeForSection(sectionId, measurements);

      // Save measurements
      saveMeasurements(measurements);

      // Display result
      displayResult(drawer, result);

      // Apply recommendations across drawers/cards
      applySavedRecommendations();
      startRecommendationObserver();

      // Reset processing state
      state.isProcessing = false;
      form.classList.remove('calculator-form--loading');
    }, 500);
  }

  function displayResult(drawer, result) {
    // Go to step 3 (results)
    goToStep(drawer, 3);

    // Update result content
    const sizeElement = drawer.querySelector('[data-result-size]');
    const messageElement = drawer.querySelector('[data-result-message]');

    if (sizeElement) {
      sizeElement.textContent = result.recommendedSize;
    }

    if (messageElement) {
      messageElement.textContent = result.message;
    }
  }

  function handleRecalculate(drawer) {
    // Go back to step 1
    goToStep(drawer, 1);

    // Focus first input
    const firstInput = drawer.querySelector('input[type="number"]');
    if (firstInput) firstInput.focus();
  }

  function handleConfirm(drawer) {
    const sectionId = drawer.dataset.sectionId;

    // Close calculator drawer
    closeCalculatorDrawer(sectionId);

    // Update size drawer with recommendation
    const savedMeasurements = loadSavedMeasurements();
    if (savedMeasurements) {
      applySavedRecommendations();
    }

    // Show success message in size drawer (optional)
    showStatus(drawer, 'Medidas guardadas com sucesso!', 'success');
  }

  function showStatus(drawer, message, type = 'error') {
    const statusElement = drawer.querySelector('[data-calculator-status]');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = 'size-calculator-drawer__status ' + type;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'size-calculator-drawer__status';
    }, 5000);
  }

  // ============================================
  // SIZE DRAWER INTEGRATION
  // ============================================

  function addRecommendationLabelsToSizeDrawer(sectionId, recommendedSize) {
    const sizeDrawer = document.getElementById(`size-drawer-${sectionId}`);
    if (!sizeDrawer) return;

    const normalizedRecommended = normalizeSizeValue(recommendedSize);
    const sizeItems = sizeDrawer.querySelectorAll('.size-item:not(.size-drawer__calculator-button)');

    sizeItems.forEach((item) => {
      const sizeLabel = item.querySelector('.size-item__label');
      if (!sizeLabel) return;

      const itemSize = item.dataset.size || sizeLabel.textContent.trim();
      const isRecommended = normalizedRecommended !== '' && normalizeSizeValue(itemSize) === normalizedRecommended;

      const existingBadge = item.querySelector('.size-item__recommended');
      if (existingBadge) existingBadge.remove();

      setRecommendedLabel(sizeLabel, isRecommended);
      item.classList.toggle('size-item--recommended', isRecommended);
    });
  }

  function addRecommendationLabelsToCardOptions(sectionId, recommendedSize) {
    const normalizedRecommended = normalizeSizeValue(recommendedSize);
    const triggers = document.querySelectorAll(`[data-calculator-drawer-trigger="${sectionId}"]`);

    triggers.forEach((trigger) => {
      const container = trigger.closest('.size-options');
      if (!container) return;

      const options = container.querySelectorAll('.size-option:not(.size-drawer__calculator-button)');
      options.forEach((option) => {
        const label = option.querySelector('.size-option__label');
        if (!label) return;

        const itemSize = option.dataset.size || label.textContent.trim();
        const isRecommended = normalizedRecommended !== '' && normalizeSizeValue(itemSize) === normalizedRecommended;

        setRecommendedLabel(label, isRecommended);
        option.classList.toggle('size-option--recommended', isRecommended);
      });
    });
  }

  function applyRecommendationForSection(sectionId, recommendedSize) {
    addRecommendationLabelsToSizeDrawer(sectionId, recommendedSize);
    addRecommendationLabelsToCardOptions(sectionId, recommendedSize);
  }

  function applySavedRecommendations() {
    const savedMeasurements = loadSavedMeasurements();
    if (!savedMeasurements) return;

    const sectionIds = new Set();

    if (window.themeCalculatorDrawerData) {
      Object.keys(window.themeCalculatorDrawerData).forEach((sectionId) => sectionIds.add(sectionId));
    }

    document.querySelectorAll('[data-calculator-drawer-trigger]').forEach((trigger) => {
      const sectionId = trigger.dataset.calculatorDrawerTrigger;
      if (sectionId) sectionIds.add(sectionId);
    });

    document.querySelectorAll('.size-drawer[data-section-id]').forEach((drawer) => {
      const sectionId = drawer.dataset.sectionId;
      if (sectionId) sectionIds.add(sectionId);
    });

    sectionIds.forEach((sectionId) => {
      const result = calculateSizeForSection(sectionId, savedMeasurements);
      applyRecommendationForSection(sectionId, result.recommendedSize);
    });
  }

  let recommendationObserver = null;
  let recommendationTimer = null;

  function startRecommendationObserver() {
    if (recommendationObserver) return;
    if (!loadSavedMeasurements()) return;
    if (!document.body) return;

    recommendationObserver = new MutationObserver((mutations) => {
      const hasAdditions = mutations.some((mutation) => mutation.addedNodes && mutation.addedNodes.length);
      if (!hasAdditions) return;
      if (recommendationTimer) {
        clearTimeout(recommendationTimer);
      }
      recommendationTimer = setTimeout(() => {
        applySavedRecommendations();
      }, 80);
    });

    recommendationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function autoCalculateIfMeasurementsSaved(sectionId) {
    const savedMeasurements = loadSavedMeasurements();
    if (!savedMeasurements) return;

    const result = calculateSizeForSection(sectionId, savedMeasurements);
    applyRecommendationForSection(sectionId, result.recommendedSize);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function initialize() {
    // Calculator drawer triggers (use capture phase to run before other handlers)
    document.addEventListener('click', (event) => {
      const targetInfo = {
        tag: event.target.tagName,
        classes: event.target.className,
        id: event.target.id
      };

      // Only log if it looks like it might be a calculator button click
      const maybeCalcButton = event.target.closest('[data-calculator-drawer-trigger]');
      if (maybeCalcButton || event.target.closest('.size-drawer__calculator-button')) {
      }

      // Open calculator drawer
      const trigger = event.target.closest('[data-calculator-drawer-trigger]');
      if (maybeCalcButton || trigger) {
      }

      if (trigger) {
        event.preventDefault();
        event.stopPropagation(); // Prevent other handlers from interfering
        const sectionId = trigger.dataset.calculatorDrawerTrigger;
        openCalculatorDrawer(sectionId);
        return;
      }

      // Close calculator drawer
      const closeTrigger = event.target.closest('[data-calculator-drawer-close]');
      if (closeTrigger) {
        const drawer = closeTrigger.closest('.size-calculator-drawer');
        if (drawer) {
          event.preventDefault();
          closeCalculatorDrawer(drawer.dataset.sectionId);
        }
        return;
      }

      // Visual option selection
      const option = event.target.closest('[data-visual-option]');
      if (option) {
        event.preventDefault();
        handleVisualOptionClick(option);
        return;
      }

      // Next step button
      const nextBtn = event.target.closest('[data-next-step]');
      if (nextBtn) {
        event.preventDefault();
        event.stopPropagation();
        const drawer = nextBtn.closest('.size-calculator-drawer');
        if (drawer) {
          // Only handle if this drawer is actually open
          if (!drawer.classList.contains('is-open')) {
            return;
          }
          try {
            handleNextStep(drawer);
          } catch (error) {
          }
        } else {
        }
        return;
      }

      // Previous step button
      const prevBtn = event.target.closest('[data-prev-step]');
      if (prevBtn) {
        event.preventDefault();
        const drawer = prevBtn.closest('.size-calculator-drawer');
        if (drawer) handlePrevStep(drawer);
        return;
      }

      // Confirm button
      const confirmBtn = event.target.closest('[data-calculator-confirm]');
      if (confirmBtn) {
        event.preventDefault();
        const drawer = confirmBtn.closest('.size-calculator-drawer');
        if (drawer) handleConfirm(drawer);
        return;
      }

      // Calculate/Submit button (from Step 2)
      const calculateBtn = event.target.closest('[data-calculate-submit]');
      if (calculateBtn) {
        event.preventDefault();
        const drawer = calculateBtn.closest('.size-calculator-drawer');
        if (drawer) {
          const form = drawer.querySelector('[data-calculator-form]');
          if (form) handleFormSubmit(form);
        }
        return;
      }

      // Recalculate button
      const recalculateBtn = event.target.closest('[data-calculator-recalculate]');
      if (recalculateBtn) {
        event.preventDefault();
        const drawer = recalculateBtn.closest('.size-calculator-drawer');
        if (drawer) handleRecalculate(drawer);
        return;
      }

      // Click on overlay to close
      if (event.target.classList.contains('size-calculator-drawer__overlay')) {
        event.preventDefault();
        const drawer = event.target.closest('.size-calculator-drawer');
        if (drawer) closeCalculatorDrawer(drawer.dataset.sectionId);
        return;
      }
    }, true); // Use capture phase to catch events before other handlers

    // Form submission - ONLY allow from submit button click, not Enter key
    document.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-calculator-form]');
      if (form) {
        event.preventDefault();
        // Prevent any form submission - user must use button clicks only
        return false;
      }
    });

    // Keyboard event handlers
    document.addEventListener('keydown', (event) => {
      // Escape key to close
      if (event.key === 'Escape') {
        const openDrawer = document.querySelector('.size-calculator-drawer.is-open');
        if (openDrawer) {
          event.preventDefault();
          closeCalculatorDrawer(openDrawer.dataset.sectionId);
        }
        return;
      }

      // Enter key handling
      if (event.key === 'Enter') {
        const input = event.target;
        const form = input.closest('[data-calculator-form]');

        if (form) {
          const drawer = form.closest('.size-calculator-drawer');
          if (!drawer || !drawer.classList.contains('is-open')) return;

          const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);

          // If on step 1, Enter should trigger Next button
          if (currentStep === 1 && (input.name === 'idade' || input.name === 'altura' || input.name === 'peso')) {
            event.preventDefault();

            const nextBtn = drawer.querySelector('[data-next-step]');
            if (nextBtn) {
              nextBtn.click();
            }
            return;
          }

          // For all other cases in the form, prevent Enter from submitting
          event.preventDefault();
        }
      }
    }, true); // Use capture phase to ensure we catch events before other handlers


    // Log all calculator buttons on page
    const buttons = document.querySelectorAll('[data-calculator-drawer-trigger]');
    buttons.forEach(btn => {
    });

    // Log all calculator drawers on page
    const drawers = document.querySelectorAll('.size-calculator-drawer');
    drawers.forEach(drawer => {
    });

    applySavedRecommendations();
    startRecommendationObserver();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  // Expose functions to global scope for integration
  window.themeCalculatorDrawer = {
    calculateSize,
    calculateSizeForSection,
    loadSavedMeasurements,
    saveMeasurements,
    clearSavedMeasurements,
    addRecommendationLabelsToSizeDrawer,
    addRecommendationLabelsToCardOptions,
    applyRecommendationForSection,
    applySavedRecommendations,
    autoCalculateIfMeasurementsSaved,
    openCalculatorDrawer,
    closeCalculatorDrawer,
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  // Prevent multiple initializations if script is loaded more than once
  if (!window.themeCalculatorDrawerInitialized) {
    window.themeCalculatorDrawerInitialized = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initialize();
      });
    } else {
      initialize();
    }
  } else {
  }
})();
