document.addEventListener('DOMContentLoaded', function() {
  // Handle swatch interactions for variant selection
  function initSwatchInteractions() {
    // Handle form swatch inputs
    const swatchInputs = document.querySelectorAll('.product-form__input--swatch .swatch-input__input');

    swatchInputs.forEach(input => {
      input.addEventListener('change', function() {
        // Remove active class from all labels in this group
        const parentFieldset = this.closest('.product-form__input--swatch');
        if (parentFieldset) {
          const allLabels = parentFieldset.querySelectorAll('.swatch-input__label');
          allLabels.forEach(label => label.classList.remove('active'));

          // Add active class to the selected label
          const selectedLabel = this.nextElementSibling;
          if (selectedLabel) {
            selectedLabel.classList.add('active');
          }
        }
      });
    });

    // Set first swatch as active by default
    const firstSwatchInputs = document.querySelectorAll('.product-form__input--swatch .swatch-input__input:first-of-type');
    firstSwatchInputs.forEach(input => {
      input.checked = true;
      const label = input.nextElementSibling;
      if (label) {
        label.classList.add('active');
      }
    });
  }

  // Handle standalone swatches (e.g., in cards)
  function initStandaloneSwatches() {
    const swatches = document.querySelectorAll('.swatch[data-color]');

    swatches.forEach(swatch => {
      swatch.addEventListener('click', function() {
        const selectedColor = this.getAttribute('data-color');

        // Remove active class from sibling swatches
        const parent = this.parentElement;
        if (parent) {
          const siblings = parent.querySelectorAll('.swatch');
          siblings.forEach(sibling => sibling.classList.remove('active'));
        }

        // Add active class to clicked swatch
        this.classList.add('active');

        // Handle image switching if swiper slides exist
        const swiperSlides = document.querySelectorAll('.swiper-slide[data-color]');
        if (swiperSlides.length > 0) {
          swiperSlides.forEach(slide => {
            const slideColor = slide.getAttribute('data-color');
            slide.style.display = (slideColor === selectedColor) ? 'block' : 'none';
          });
        }
      });
    });
  }

  // Initialize all swatch interactions
  initSwatchInteractions();
  initStandaloneSwatches();

  // Re-initialize when new content is loaded (for dynamic content)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (
            node.querySelector('.product-form__input--swatch') ||
            node.querySelector('.swatch[data-color]')
          )) {
            initSwatchInteractions();
            initStandaloneSwatches();
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
