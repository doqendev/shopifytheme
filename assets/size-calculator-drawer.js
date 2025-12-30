/**
 * SIZE CALCULATOR DRAWER
 * Handles size recommendation based on user measurements
 */

(() => {
  'use strict';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 [SizeCalculator] Script file loaded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

    console.log('[SizeCalculator] goToStep called:', stepNumber);

    // Hide all step contents
    const stepContents = drawer.querySelectorAll('[data-step-content]');
    console.log('[SizeCalculator] Found step contents:', stepContents.length);
    stepContents.forEach(content => {
      content.hidden = true;
      console.log('[SizeCalculator] Hiding step:', content.dataset.stepContent);
    });

    // Show target step content
    const targetContent = drawer.querySelector(`[data-step-content="${stepNumber}"]`);
    console.log('[SizeCalculator] Target content found:', !!targetContent);
    if (targetContent) {
      targetContent.hidden = false;
      console.log('[SizeCalculator] Showing step:', stepNumber);
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
    console.log('[SizeCalculator] Step updated to:', stepNumber);
  }

  function validateStep1(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      console.log('[SizeCalculator] Form not found');
      return false;
    }

    const idade = form.querySelector('[name="idade"]');
    const altura = form.querySelector('[name="altura"]');
    const peso = form.querySelector('[name="peso"]');

    console.log('[SizeCalculator] Validating Step 1:', {
      idade: idade?.value,
      altura: altura?.value,
      peso: peso?.value
    });

    // Check if all fields are filled and valid
    if (!idade || !idade.value || !idade.checkValidity()) {
      console.log('[SizeCalculator] Idade validation failed');
      return false;
    }
    if (!altura || !altura.value || !altura.checkValidity()) {
      console.log('[SizeCalculator] Altura validation failed');
      return false;
    }
    if (!peso || !peso.value || !peso.checkValidity()) {
      console.log('[SizeCalculator] Peso validation failed');
      return false;
    }

    console.log('[SizeCalculator] Step 1 validation passed');
    return true;
  }

  function validateStep2(drawer) {
    const form = drawer.querySelector('[data-calculator-form]');
    if (!form) {
      console.error('[SizeCalculator] Form not found for step 2 validation');
      return false;
    }

    const belly = form.querySelector('[name="belly"]');
    const shoulders = form.querySelector('[name="shoulders"]');

    console.log('[SizeCalculator] Validating Step 2:', {
      belly: belly?.value,
      shoulders: shoulders?.value
    });

    if (!belly || !belly.value) {
      console.error('[SizeCalculator] Step 2 validation failed: belly not selected');
      return false;
    }

    if (!shoulders || !shoulders.value) {
      console.error('[SizeCalculator] Step 2 validation failed: shoulders not selected');
      return false;
    }

    console.log('[SizeCalculator] Step 2 validation passed');
    return true;
  }

  function handleNextStep(drawer) {
    const currentStep = parseInt(drawer.dataset.currentStep || '1', 10);
    console.log('[SizeCalculator] handleNextStep called, current step:', currentStep);
    console.log('[SizeCalculator] Drawer section ID:', drawer.dataset.sectionId);

    // Validate step 1 before proceeding to step 2
    if (currentStep === 1) {
      if (!validateStep1(drawer)) {
        showStatus(drawer, 'Por favor, preencha todos os campos corretamente.', 'error');
        return;
      }
      console.log('[SizeCalculator] Step 1 validation passed, going to step 2');
      // ALWAYS go to step 2 from step 1
      goToStep(drawer, 2);
      return;
    }

    // For other steps, advance normally
    const targetStep = currentStep + 1;
    console.log('[SizeCalculator] Moving to step:', targetStep);
    goToStep(drawer, targetStep);

    // Verify the step was changed
    setTimeout(() => {
      console.log('[SizeCalculator] After goToStep, current step:', drawer.dataset.currentStep);
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[SizeCalculator] openCalculatorDrawer called with sectionId:', sectionId);
    const drawerId = `size-calculator-drawer-${sectionId}`;
    console.log('[SizeCalculator] Looking for drawer with ID:', drawerId);

    const drawer = document.getElementById(drawerId);
    console.log('[SizeCalculator] Drawer element found:', !!drawer);

    if (!drawer) {
      console.error('[SizeCalculator] ❌ Drawer not found for section:', sectionId);
      console.log('[SizeCalculator] Available calculator drawers on page:');
      document.querySelectorAll('.size-calculator-drawer').forEach(d => {
        console.log('  - ID:', d.id, 'Section ID:', d.dataset.sectionId);
      });
      console.log('[SizeCalculator] All elements with data-calculator-drawer-trigger:');
      document.querySelectorAll('[data-calculator-drawer-trigger]').forEach(btn => {
        console.log('  - Button trigger value:', btn.dataset.calculatorDrawerTrigger);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // Close any open size drawer before opening calculator drawer
    const openSizeDrawer = document.querySelector('.size-drawer.is-open');
    console.log('[SizeCalculator] Open size drawer found:', !!openSizeDrawer);
    if (openSizeDrawer && openSizeDrawer.dataset.sectionId) {
      console.log('[SizeCalculator] Closing open size drawer for section:', openSizeDrawer.dataset.sectionId);
      // Call the size drawer's close function if available
      if (window.themeSizeDrawer && typeof window.themeSizeDrawer.closeDrawer === 'function') {
        console.log('[SizeCalculator] Using themeSizeDrawer.closeDrawer()');
        window.themeSizeDrawer.closeDrawer(openSizeDrawer.dataset.sectionId);
      } else {
        // Fallback: manually close the drawer
        console.log('[SizeCalculator] Manually closing size drawer');
        openSizeDrawer.classList.remove('is-open');
        openSizeDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    const state = ensureState(sectionId);
    console.log('[SizeCalculator] State initialized for section:', sectionId);

    // Store last focused element
    state.lastFocused = document.activeElement;
    console.log('[SizeCalculator] Stored last focused element');

    // Reset form if exists
    const form = drawer.querySelector('[data-calculator-form]');
    console.log('[SizeCalculator] Form found:', !!form);
    if (form) {
      form.reset();
      console.log('[SizeCalculator] Form reset');

      // Load saved measurements if available
      const savedMeasurements = loadSavedMeasurements();
      console.log('[SizeCalculator] Saved measurements:', savedMeasurements);
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
    console.log('[SizeCalculator] Resetting to step 1');
    goToStep(drawer, 1);

    // Open drawer
    console.log('[SizeCalculator] Adding is-open class to drawer');
    drawer.classList.add('is-open');
    console.log('[SizeCalculator] Setting aria-hidden to false');
    drawer.setAttribute('aria-hidden', 'false');
    console.log('[SizeCalculator] Drawer should now be visible');

    // Check computed styles
    const computedStyle = window.getComputedStyle(drawer);
    console.log('[SizeCalculator] Drawer computed styles:', {
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
    console.log('[SizeCalculator] Drawer classList:', drawer.classList.toString());
    console.log('[SizeCalculator] Drawer aria-hidden:', drawer.getAttribute('aria-hidden'));

    // Check drawer content element
    const drawerContent = drawer.querySelector('.size-calculator-drawer__content');
    if (drawerContent) {
      const contentStyle = window.getComputedStyle(drawerContent);
      console.log('[SizeCalculator] Drawer CONTENT computed styles:', {
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
      console.error('[SizeCalculator] ❌ Drawer content element not found!');
    }

    // Check if drawer is in viewport
    const rect = drawer.getBoundingClientRect();
    console.log('[SizeCalculator] Drawer bounding rect:', {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
    });

    // Check parent elements for transform/positioning issues
    let parent = drawer.parentElement;
    let depth = 0;
    console.log('[SizeCalculator] Checking parent elements for positioning issues:');
    while (parent && depth < 5) {
      const parentStyle = window.getComputedStyle(parent);
      const hasTransform = parentStyle.transform !== 'none';
      const hasPerspective = parentStyle.perspective !== 'none';
      const hasFilter = parentStyle.filter !== 'none';
      const hasWillChange = parentStyle.willChange !== 'auto';

      if (hasTransform || hasPerspective || hasFilter || hasWillChange) {
        console.log(`[SizeCalculator] ⚠️  Parent element (depth ${depth}):`, {
          tag: parent.tagName,
          classes: parent.className,
          id: parent.id,
          transform: parentStyle.transform,
          perspective: parentStyle.perspective,
          filter: parentStyle.filter,
          willChange: parentStyle.willChange,
          position: parentStyle.position
        });
      }
      parent = parent.parentElement;
      depth++;
    }

    // Focus first input
    setTimeout(() => {
      const firstInput = drawer.querySelector('input[type="number"]');
      if (firstInput) {
        console.log('[SizeCalculator] Focusing first input');
        firstInput.focus();
      }
    }, 100);

    // Prevent body scroll
    console.log('[SizeCalculator] Preventing body scroll');
    document.body.style.overflow = 'hidden';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    console.log('[SizeCalculator] Form submit triggered, current step:', currentStep);

    if (currentStep !== 2) {
      console.log('[SizeCalculator] Form submit blocked - not on step 2');
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
        console.log('[SizeCalculator] Click event detected on:', targetInfo);
      }

      // Open calculator drawer
      const trigger = event.target.closest('[data-calculator-drawer-trigger]');
      if (maybeCalcButton || trigger) {
        console.log('[SizeCalculator] Trigger found:', !!trigger, trigger);
      }

      if (trigger) {
        console.log('[SizeCalculator] ✓ Calculator button clicked!');
        event.preventDefault();
        event.stopPropagation(); // Prevent other handlers from interfering
        const sectionId = trigger.dataset.calculatorDrawerTrigger;
        console.log('[SizeCalculator] Section ID from button:', sectionId);
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
        console.log('[SizeCalculator] Next button clicked');
        const drawer = nextBtn.closest('.size-calculator-drawer');
        if (drawer) {
          // Only handle if this drawer is actually open
          if (!drawer.classList.contains('is-open')) {
            console.log('[SizeCalculator] Drawer not open, ignoring click');
            return;
          }
          console.log('[SizeCalculator] Drawer found and open, calling handleNextStep');
          try {
            handleNextStep(drawer);
          } catch (error) {
            console.error('[SizeCalculator] Error in handleNextStep:', error);
          }
        } else {
          console.error('[SizeCalculator] Drawer not found');
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
        console.log('[SizeCalculator] Calculate button clicked');
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
        console.log('[SizeCalculator] Form submit prevented - use buttons only');
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
            console.log('[SizeCalculator] Enter pressed in step 1 - triggering Next button');

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

    console.log('[SizeCalculator] ✓ Event listener added successfully');
    console.log('[SizeCalculator] ✓ Initialized');

    // Log all calculator buttons on page
    const buttons = document.querySelectorAll('[data-calculator-drawer-trigger]');
    console.log('[SizeCalculator] Found', buttons.length, 'calculator trigger buttons');
    buttons.forEach(btn => {
      console.log('  - Button with section ID:', btn.dataset.calculatorDrawerTrigger);
    });

    // Log all calculator drawers on page
    const drawers = document.querySelectorAll('.size-calculator-drawer');
    console.log('[SizeCalculator] Found', drawers.length, 'calculator drawers');
    drawers.forEach(drawer => {
      console.log('  - Drawer ID:', drawer.id, 'Section ID:', drawer.dataset.sectionId);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

    console.log('[SizeCalculator] Script loaded, document.readyState:', document.readyState);
    if (document.readyState === 'loading') {
      console.log('[SizeCalculator] Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[SizeCalculator] DOMContentLoaded fired, initializing...');
        initialize();
      });
    } else {
      console.log('[SizeCalculator] DOM already loaded, initializing immediately...');
      initialize();
    }
  } else {
    console.log('[SizeCalculator] Already initialized, skipping');
  }
})();
