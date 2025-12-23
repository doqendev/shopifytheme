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
      console.error('[SizeCalculator] Failed to save measurements:', error);
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
      console.error('[SizeCalculator] Failed to load measurements:', error);
      return null;
    }
  }

  function clearSavedMeasurements() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('[SizeCalculator] Failed to clear measurements:', error);
      return false;
    }
  }

  // ============================================
  // SIZE CALCULATION ALGORITHM
  // ============================================

  function calculateSize(measurements) {
    const { idade, altura, peso, belly, shoulders } = measurements;

    // Calculate BMI
    const heightInMeters = altura / 100;
    const bmi = peso / (heightInMeters * heightInMeters);

    // Map BMI to base size
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    let baseSize = '';

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

    // Adjust for body type
    const currentIndex = sizeOrder.indexOf(baseSize);

    if (belly === 'broad' || shoulders === 'broad') {
      // Size up for broad body types
      if (currentIndex < sizeOrder.length - 1) {
        baseSize = sizeOrder[currentIndex + 1];
      }
    } else if (belly === 'slim' && shoulders === 'narrow') {
      // Size down for slim body types
      if (currentIndex > 0) {
        baseSize = sizeOrder[currentIndex - 1];
      }
    }

    return {
      recommendedSize: baseSize,
      confidence: 'high',
      message: `Com base nas tuas medidas, recomendamos o tamanho ${baseSize}.`,
      bmi: bmi.toFixed(1),
    };
  }

  // ============================================
  // DRAWER CONTROLS
  // ============================================

  function openCalculatorDrawer(sectionId) {
    const drawer = document.getElementById(`size-calculator-drawer-${sectionId}`);
    if (!drawer) {
      console.warn('[SizeCalculator] Drawer not found for section:', sectionId);
      return;
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

    // Hide result, show form
    const resultSection = drawer.querySelector('[data-calculator-result]');
    const formElement = drawer.querySelector('[data-calculator-form]');
    if (resultSection) resultSection.hidden = true;
    if (formElement) formElement.hidden = false;

    // Open drawer
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');

    // Focus first input
    setTimeout(() => {
      const firstInput = drawer.querySelector('input[type="number"]');
      if (firstInput) firstInput.focus();
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

    // Collect form data
    const formData = new FormData(form);
    const measurements = {
      idade: parseInt(formData.get('idade'), 10),
      altura: parseInt(formData.get('altura'), 10),
      peso: parseInt(formData.get('peso'), 10),
      belly: formData.get('belly'),
      shoulders: formData.get('shoulders'),
    };

    // Validate
    if (!measurements.idade || !measurements.altura || !measurements.peso || !measurements.belly || !measurements.shoulders) {
      showStatus(drawer, 'Por favor, preencha todos os campos.', 'error');
      return;
    }

    // Set processing state
    state.isProcessing = true;
    form.classList.add('calculator-form--loading');

    // Simulate calculation delay (remove in production)
    setTimeout(() => {
      // Calculate size
      const result = calculateSize(measurements);

      // Save measurements
      saveMeasurements(measurements);

      // Display result
      displayResult(drawer, result);

      // Reset processing state
      state.isProcessing = false;
      form.classList.remove('calculator-form--loading');
    }, 500);
  }

  function displayResult(drawer, result) {
    const formSection = drawer.querySelector('[data-calculator-form]');
    const resultSection = drawer.querySelector('[data-calculator-result]');

    if (!resultSection) return;

    // Hide form, show result
    if (formSection) formSection.hidden = true;
    resultSection.hidden = false;

    // Update result content
    const sizeElement = resultSection.querySelector('[data-result-size]');
    const messageElement = resultSection.querySelector('[data-result-message]');

    if (sizeElement) {
      sizeElement.textContent = result.recommendedSize;
    }

    if (messageElement) {
      messageElement.textContent = result.message;
    }
  }

  function handleRecalculate(drawer) {
    const formSection = drawer.querySelector('[data-calculator-form]');
    const resultSection = drawer.querySelector('[data-calculator-result]');

    // Show form, hide result
    if (formSection) formSection.hidden = false;
    if (resultSection) resultSection.hidden = true;

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
      const result = calculateSize(savedMeasurements);
      addRecommendationLabelsToSizeDrawer(sectionId, result.recommendedSize);
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

    // Find all size items
    const sizeItems = sizeDrawer.querySelectorAll('.size-item');

    sizeItems.forEach((item) => {
      const sizeLabel = item.querySelector('.size-item__label');
      if (!sizeLabel) return;

      const itemSize = sizeLabel.textContent.trim();

      // Remove existing recommendation badges
      const existingBadge = item.querySelector('.size-item__recommended');
      if (existingBadge) existingBadge.remove();

      // Remove existing highlight
      item.classList.remove('size-item--recommended');

      // Add badge to recommended size
      if (itemSize === recommendedSize) {
        const badge = document.createElement('span');
        badge.className = 'size-item__recommended';
        badge.textContent = 'recomendado';
        item.appendChild(badge);

        // Add highlight class
        item.classList.add('size-item--recommended');
      }
    });
  }

  function autoCalculateIfMeasurementsSaved(sectionId) {
    const savedMeasurements = loadSavedMeasurements();
    if (!savedMeasurements) return;

    // Calculate and add labels
    const result = calculateSize(savedMeasurements);
    addRecommendationLabelsToSizeDrawer(sectionId, result.recommendedSize);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function initialize() {
    // Calculator drawer triggers
    document.addEventListener('click', (event) => {
      // Open calculator drawer
      const trigger = event.target.closest('[data-calculator-drawer-trigger]');
      if (trigger) {
        event.preventDefault();
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

      // Confirm button
      const confirmBtn = event.target.closest('[data-calculator-confirm]');
      if (confirmBtn) {
        event.preventDefault();
        const drawer = confirmBtn.closest('.size-calculator-drawer');
        if (drawer) handleConfirm(drawer);
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
    });

    // Form submission
    document.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-calculator-form]');
      if (form) {
        event.preventDefault();
        handleFormSubmit(form);
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openDrawer = document.querySelector('.size-calculator-drawer.is-open');
        if (openDrawer) {
          event.preventDefault();
          closeCalculatorDrawer(openDrawer.dataset.sectionId);
        }
      }
    });

    console.log('[SizeCalculator] Initialized');
  }

  // ============================================
  // PUBLIC API
  // ============================================

  // Expose functions to global scope for integration
  window.themeCalculatorDrawer = {
    calculateSize,
    loadSavedMeasurements,
    saveMeasurements,
    clearSavedMeasurements,
    addRecommendationLabelsToSizeDrawer,
    autoCalculateIfMeasurementsSaved,
    openCalculatorDrawer,
    closeCalculatorDrawer,
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
