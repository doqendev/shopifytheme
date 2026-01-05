/**
 * SIZE CALCULATOR DRAWER
 * Handles size recommendation based on user measurements
 */

(() => {
  'use strict';
  const sizeCalculatorLog = () => {};
  const sizeCalculatorWarn = () => {};
  const sizeCalculatorError = () => {};

  sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  sizeCalculatorLog('🔵 [SizeCalculator] Script file loaded!');
  sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
  // STEP NAVIGATION
  // ============================================

  function goToStep(drawer, stepNumber) {
    const sectionId = drawer.dataset.sectionId;
    const state = ensureState(sectionId);

    sizeCalculatorLog('[SizeCalculator] goToStep called:', stepNumber);

    // Hide all step contents
    const stepContents = drawer.querySelectorAll('[data-step-content]');
    sizeCalculatorLog('[SizeCalculator] Found step contents:', stepContents.length);
    stepContents.forEach(content => {
      content.hidden = true;
      sizeCalculatorLog('[SizeCalculator] Hiding step:', content.dataset.stepContent);
    });

    // Show target step content
    const targetContent = drawer.querySelector(`[data-step-content="${stepNumber}"]`);
    sizeCalculatorLog('[SizeCalculator] Target content found:', !!targetContent);
    if (targetContent) {
      targetContent.hidden = false;
      sizeCalculatorLog('[SizeCalculator] Showing step:', stepNumber);
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
    sizeCalculatorLog('[SizeCalculator] Step updated to:', stepNumber);
  }

  function validateStep1(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      sizeCalculatorLog('[SizeCalculator] Form not found');
      return false;
    }

    const idade = form.querySelector('[name="idade"]');
    const altura = form.querySelector('[name="altura"]');
    const peso = form.querySelector('[name="peso"]');

    sizeCalculatorLog('[SizeCalculator] Validating Step 1:', {
      idade: idade?.value,
      altura: altura?.value,
      peso: peso?.value
    });

    // Check if all fields are filled and valid
    if (!idade || !idade.value || !idade.checkValidity()) {
      sizeCalculatorLog('[SizeCalculator] Idade validation failed');
      return false;
    }
    if (!altura || !altura.value || !altura.checkValidity()) {
      sizeCalculatorLog('[SizeCalculator] Altura validation failed');
      return false;
    }
    if (!peso || !peso.value || !peso.checkValidity()) {
      sizeCalculatorLog('[SizeCalculator] Peso validation failed');
      return false;
    }

    sizeCalculatorLog('[SizeCalculator] Step 1 validation passed');
    return true;
  }

  function validateStep2(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      sizeCalculatorError('[SizeCalculator] Form not found for step 2 validation');
      return false;
    }

    const belly = form.querySelector('[name="belly"]');
    const shoulders = form.querySelector('[name="shoulders"]');

    sizeCalculatorLog('[SizeCalculator] Validating Step 2:', {
      belly: belly?.value,
      shoulders: shoulders?.value
    });

    if (!belly || !belly.value) {
      sizeCalculatorError('[SizeCalculator] Step 2 validation failed: belly not selected');
      return false;
    }

    if (!shoulders || !shoulders.value) {
      sizeCalculatorError('[SizeCalculator] Step 2 validation failed: shoulders not selected');
      return false;
    }

    sizeCalculatorLog('[SizeCalculator] Step 2 validation passed');
    return true;
  }

  function handleNextStep(drawer) {
    const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);
    sizeCalculatorLog('[SizeCalculator] handleNextStep called, current step:', currentStep);
    sizeCalculatorLog('[SizeCalculator] Drawer section ID:', drawer.dataset.sectionId);

    // Validate step 1 before proceeding to step 2
    if (currentStep === 1) {
      if (!validateStep1(drawer)) {
        showStatus(drawer, 'Por favor, preencha todos os campos corretamente.', 'error');
        return;
      }
      sizeCalculatorLog('[SizeCalculator] Step 1 validation passed, going to step 2');
      // ALWAYS go to step 2 from step 1
      goToStep(drawer, 2);
      return;
    }

    // For other steps, advance normally
    const targetStep = currentStep + 1;
    sizeCalculatorLog('[SizeCalculator] Moving to step:', targetStep);
    goToStep(drawer, targetStep);

    // Verify the step was changed
    setTimeout(() => {
      sizeCalculatorLog('[SizeCalculator] After goToStep, current step:', drawer.dataset.currentStep);
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
      sizeCalculatorError('[SizeCalculator] Failed to save measurements:', error);
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
      sizeCalculatorError('[SizeCalculator] Failed to load measurements:', error);
      return null;
    }
  }

  function clearSavedMeasurements() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
      return true;
    } catch (error) {
      sizeCalculatorError('[SizeCalculator] Failed to clear measurements:', error);
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
    sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sizeCalculatorLog('[SizeCalculator] openCalculatorDrawer called with sectionId:', sectionId);
    const drawerId = `size-calculator-drawer-${sectionId}`;
    sizeCalculatorLog('[SizeCalculator] Looking for drawer with ID:', drawerId);

    const drawer = document.getElementById(drawerId);
    sizeCalculatorLog('[SizeCalculator] Drawer element found:', !!drawer);

    if (!drawer) {
      sizeCalculatorError('[SizeCalculator] ❌ Drawer not found for section:', sectionId);
      sizeCalculatorLog('[SizeCalculator] Available calculator drawers on page:');
      document.querySelectorAll('.size-calculator-drawer').forEach(d => {
        sizeCalculatorLog('  - ID:', d.id, 'Section ID:', d.dataset.sectionId);
      });
      sizeCalculatorLog('[SizeCalculator] All elements with data-calculator-drawer-trigger:');
      document.querySelectorAll('[data-calculator-drawer-trigger]').forEach(btn => {
        sizeCalculatorLog('  - Button trigger value:', btn.dataset.calculatorDrawerTrigger);
      });
      sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // Close any open size drawer before opening calculator drawer
    const openSizeDrawer = document.querySelector('.size-drawer.is-open');
    sizeCalculatorLog('[SizeCalculator] Open size drawer found:', !!openSizeDrawer);
    if (openSizeDrawer && openSizeDrawer.dataset.sectionId) {
      sizeCalculatorLog('[SizeCalculator] Closing open size drawer for section:', openSizeDrawer.dataset.sectionId);
      // Call the size drawer's close function if available
      if (window.themeSizeDrawer && typeof window.themeSizeDrawer.closeDrawer === 'function') {
        sizeCalculatorLog('[SizeCalculator] Using themeSizeDrawer.closeDrawer()');
        window.themeSizeDrawer.closeDrawer(openSizeDrawer.dataset.sectionId);
      } else {
        // Fallback: manually close the drawer
        sizeCalculatorLog('[SizeCalculator] Manually closing size drawer');
        openSizeDrawer.classList.remove('is-open');
        openSizeDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    const state = ensureState(sectionId);
    sizeCalculatorLog('[SizeCalculator] State initialized for section:', sectionId);

    // Store last focused element
    state.lastFocused = document.activeElement;
    sizeCalculatorLog('[SizeCalculator] Stored last focused element');

    // Reset form if exists
    const form = drawer.querySelector('[data-calculator-form]');
    sizeCalculatorLog('[SizeCalculator] Form found:', !!form);
    if (form) {
      form.reset();
      sizeCalculatorLog('[SizeCalculator] Form reset');

      // Load saved measurements if available
      const savedMeasurements = loadSavedMeasurements();
      sizeCalculatorLog('[SizeCalculator] Saved measurements:', savedMeasurements);
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
    sizeCalculatorLog('[SizeCalculator] Resetting to step 1');
    goToStep(drawer, 1);

    // Open drawer
    sizeCalculatorLog('[SizeCalculator] Adding is-open class to drawer');
    drawer.classList.add('is-open');
    sizeCalculatorLog('[SizeCalculator] Setting aria-hidden to false');
    drawer.setAttribute('aria-hidden', 'false');
    sizeCalculatorLog('[SizeCalculator] Drawer should now be visible');

    // Check computed styles
    const computedStyle = window.getComputedStyle(drawer);
    sizeCalculatorLog('[SizeCalculator] Drawer computed styles:', {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position,
      top: computedStyle.top,
      left: computedStyle.left,
      bottom: computedStyle.bottom,
      right: computedStyle.right,
      inset: computedStyle.inset,
      transform: computedStyle.transform
    });
    sizeCalculatorLog('[SizeCalculator] Drawer classList:', drawer.classList.toString());
    sizeCalculatorLog('[SizeCalculator] Drawer aria-hidden:', drawer.getAttribute('aria-hidden'));

    // Check drawer content element
    const drawerContent = drawer.querySelector('.size-calculator-drawer__content');
    if (drawerContent) {
      const contentStyle = window.getComputedStyle(drawerContent);
      sizeCalculatorLog('[SizeCalculator] Drawer CONTENT computed styles:', {
        display: contentStyle.display,
        visibility: contentStyle.visibility,
        opacity: contentStyle.opacity,
        transform: contentStyle.transform,
        position: contentStyle.position,
        width: contentStyle.width,
        height: contentStyle.height,
        maxHeight: contentStyle.maxHeight
      });
    } else {
      sizeCalculatorError('[SizeCalculator] ❌ Drawer content element not found!');
    }

    // Check if drawer is in viewport
    const rect = drawer.getBoundingClientRect();
    sizeCalculatorLog('[SizeCalculator] Drawer bounding rect:', {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
    });

    // Check parent elements for ALL potential issues
    let parent = drawer.parentElement;
    let depth = 0;
    sizeCalculatorLog('[SizeCalculator] Checking ALL parent elements:');
    while (parent && depth < 8) {
      const parentStyle = window.getComputedStyle(parent);
      const parentRect = parent.getBoundingClientRect();

      sizeCalculatorLog(`[SizeCalculator] Parent (depth ${depth}):`, {
        tag: parent.tagName,
        classes: parent.className,
        id: parent.id,
        display: parentStyle.display,
        position: parentStyle.position,
        width: parentRect.width,
        height: parentRect.height,
        overflow: parentStyle.overflow,
        transform: parentStyle.transform,
        zIndex: parentStyle.zIndex
      });

      parent = parent.parentElement;
      depth++;
    }

    sizeCalculatorLog('[SizeCalculator] Drawer direct parent:', drawer.parentElement?.tagName, drawer.parentElement?.className);

    // Focus first input
    setTimeout(() => {
      const firstInput = drawer.querySelector('input[type="number"]');
      if (firstInput) {
        sizeCalculatorLog('[SizeCalculator] Focusing first input');
        firstInput.focus();
      }
    }, 100);

    // Prevent body scroll
    sizeCalculatorLog('[SizeCalculator] Preventing body scroll');
    document.body.style.overflow = 'hidden';
    sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    sizeCalculatorLog('[SizeCalculator] Form submit triggered, current step:', currentStep);

    if (currentStep !== 2) {
      sizeCalculatorLog('[SizeCalculator] Form submit blocked - not on step 2');
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
        sizeCalculatorLog('[SizeCalculator] Click event detected on:', targetInfo);
      }

      // Open calculator drawer
      const trigger = event.target.closest('[data-calculator-drawer-trigger]');
      if (maybeCalcButton || trigger) {
        sizeCalculatorLog('[SizeCalculator] Trigger found:', !!trigger, trigger);
      }

      if (trigger) {
        sizeCalculatorLog('[SizeCalculator] ✓ Calculator button clicked!');
        event.preventDefault();
        event.stopPropagation(); // Prevent other handlers from interfering
        const sectionId = trigger.dataset.calculatorDrawerTrigger;
        sizeCalculatorLog('[SizeCalculator] Section ID from button:', sectionId);
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
        sizeCalculatorLog('[SizeCalculator] Next button clicked');
        const drawer = nextBtn.closest('.size-calculator-drawer');
        if (drawer) {
          // Only handle if this drawer is actually open
          if (!drawer.classList.contains('is-open')) {
            sizeCalculatorLog('[SizeCalculator] Drawer not open, ignoring click');
            return;
          }
          sizeCalculatorLog('[SizeCalculator] Drawer found and open, calling handleNextStep');
          try {
            handleNextStep(drawer);
          } catch (error) {
            sizeCalculatorError('[SizeCalculator] Error in handleNextStep:', error);
          }
        } else {
          sizeCalculatorError('[SizeCalculator] Drawer not found');
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
        sizeCalculatorLog('[SizeCalculator] Calculate button clicked');
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
        sizeCalculatorLog('[SizeCalculator] Form submit prevented - use buttons only');
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
            sizeCalculatorLog('[SizeCalculator] Enter pressed in step 1 - triggering Next button');

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

    sizeCalculatorLog('[SizeCalculator] ✓ Event listener added successfully');
    sizeCalculatorLog('[SizeCalculator] ✓ Initialized');

    // Log all calculator buttons on page
    const buttons = document.querySelectorAll('[data-calculator-drawer-trigger]');
    sizeCalculatorLog('[SizeCalculator] Found', buttons.length, 'calculator trigger buttons');
    buttons.forEach(btn => {
      sizeCalculatorLog('  - Button with section ID:', btn.dataset.calculatorDrawerTrigger);
    });

    // Log all calculator drawers on page
    const drawers = document.querySelectorAll('.size-calculator-drawer');
    sizeCalculatorLog('[SizeCalculator] Found', drawers.length, 'calculator drawers');
    drawers.forEach(drawer => {
      sizeCalculatorLog('  - Drawer ID:', drawer.id, 'Section ID:', drawer.dataset.sectionId);
    });

    sizeCalculatorLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

  // Prevent multiple initializations if script is loaded more than once
  if (!window.themeCalculatorDrawerInitialized) {
    window.themeCalculatorDrawerInitialized = true;

    sizeCalculatorLog('[SizeCalculator] Script loaded, document.readyState:', document.readyState);
    if (document.readyState === 'loading') {
      sizeCalculatorLog('[SizeCalculator] Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        sizeCalculatorLog('[SizeCalculator] DOMContentLoaded fired, initializing...');
        initialize();
      });
    } else {
      sizeCalculatorLog('[SizeCalculator] DOM already loaded, initializing immediately...');
      initialize();
    }
  } else {
    sizeCalculatorLog('[SizeCalculator] Already initialized, skipping');
  }
})();
