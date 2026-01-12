/**
 * Color-based Image Filter for Shopify Product Pages
 * Filters displayed images based on selected color swatch
 */

class ColorImageFilter {
  constructor() {
    this.currentColor = null;
    this.isDesktop = window.matchMedia('(min-width: 750px)').matches;
    this.colorOptionNames = ['color', 'cor', 'colour', 'couleur'];
    this.initialized = false;

    this.init();
  }

  init() {
    // Subscribe to variant/option change events via pub/sub
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, this.handleOptionChange.bind(this));
      subscribe(PUB_SUB_EVENTS.variantChange, this.handleVariantChange.bind(this));
    }

    // Listen for custom variant change events (from sticky-product-bar swatch drawer)
    document.addEventListener('variantchange', this.handleCustomVariantChange.bind(this));

    // Listen for direct swatch clicks (backup method)
    this.setupSwatchListeners();

    // Set initial filter based on selected variant
    this.setInitialColor();

    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.isDesktop = window.matchMedia('(min-width: 750px)').matches;
    }, 250));

    this.initialized = true;
  }

  /**
   * Setup direct swatch click listeners as backup
   */
  setupSwatchListeners() {
    document.addEventListener('change', (e) => {
      const target = e.target;

      // Check if this is a color swatch input
      if (target.matches('.swatch-input__input, [data-option-name]')) {
        const fieldset = target.closest('fieldset[data-option-name], .product-form__input--swatch');
        if (!fieldset) return;

        const optionName = (fieldset.dataset.optionName || fieldset.querySelector('legend')?.textContent || '').toLowerCase().trim();

        if (this.colorOptionNames.some(name => optionName.includes(name))) {
          const selectedColor = target.value;
          if (selectedColor) {
            this.filterByColor(this.normalizeColor(selectedColor));
          }
        }
      }
    });
  }

  /**
   * Normalize color string for matching
   */
  normalizeColor(color) {
    if (!color) return '';
    return color.toLowerCase().trim().replace(/\s+/g, '-');
  }

  /**
   * Handle option value selection change from pub/sub
   */
  handleOptionChange({ data }) {
    if (!data || !data.target) return;

    const target = data.target;
    const fieldset = target.closest('fieldset[data-option-name], .product-form__input--swatch');
    if (!fieldset) return;

    const optionName = (fieldset.dataset.optionName || fieldset.querySelector('legend')?.textContent || '').toLowerCase().trim();

    if (this.colorOptionNames.some(name => optionName.includes(name))) {
      const selectedColor = target.value || target.dataset.value;
      if (selectedColor) {
        this.filterByColor(this.normalizeColor(selectedColor));
      }
    }
  }

  /**
   * Handle variant change from pub/sub
   */
  handleVariantChange({ data }) {
    if (!data || !data.variant) return;

    const product = this.getProductData();
    if (!product) return;

    const colorIndex = this.getColorOptionIndex(product);
    if (colorIndex === -1) return;

    const selectedColor = data.variant.options?.[colorIndex];
    if (selectedColor) {
      this.filterByColor(this.normalizeColor(selectedColor));
    }
  }

  /**
   * Handle custom variant change event (from swatch drawer)
   */
  handleCustomVariantChange(event) {
    if (event.detail && event.detail.colorValue) {
      this.filterByColor(this.normalizeColor(event.detail.colorValue));
    }
  }

  /**
   * Get product data from page
   */
  getProductData() {
    // Try global productData
    if (typeof productData !== 'undefined') {
      return productData;
    }

    // Try finding product JSON in page
    const productJson = document.querySelector('[data-product-json], [type="application/json"][data-product]');
    if (productJson) {
      try {
        return JSON.parse(productJson.textContent);
      } catch (e) {
        console.warn('[ColorImageFilter] Could not parse product JSON');
      }
    }

    return null;
  }

  /**
   * Find the index of the color option
   */
  getColorOptionIndex(product) {
    if (!product || !product.options) return -1;

    for (let i = 0; i < product.options.length; i++) {
      const optionName = product.options[i].toLowerCase();
      if (this.colorOptionNames.some(name => optionName.includes(name))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Set initial color based on selected/first variant
   */
  setInitialColor() {
    // Give DOM time to render
    setTimeout(() => {
      const product = this.getProductData();
      if (!product) return;

      const colorIndex = this.getColorOptionIndex(product);
      if (colorIndex === -1) return;

      // Check if product has multiple colors
      const colorOption = product.options_with_values?.find(opt =>
        this.colorOptionNames.some(name => opt.name.toLowerCase().includes(name))
      );

      if (!colorOption || colorOption.values.length <= 1) {
        // Single color or no color option - don't filter
        return;
      }

      // Get selected variant's color or first available
      const selectedVariant = product.selected_or_first_available_variant || product.variants?.[0];
      if (selectedVariant?.options) {
        const selectedColor = selectedVariant.options[colorIndex];
        if (selectedColor) {
          this.filterByColor(this.normalizeColor(selectedColor));
        }
      }
    }, 100);
  }

  /**
   * Main filter function - filters images by color
   */
  filterByColor(color) {
    if (!color || this.currentColor === color) return;
    this.currentColor = color;

    if (this.isDesktop) {
      this.filterDesktopGallery(color);
    } else {
      this.filterMobileGallery(color);
    }
  }

  /**
   * Filter desktop gallery (vertical thumbnails + scrollable main images)
   */
  filterDesktopGallery(color) {
    const section = document.querySelector('.desktop-product-section');
    if (!section) return;

    // Filter thumbnails
    const thumbnails = section.querySelectorAll('.thumbnail-list li[data-color]');
    let firstVisibleThumb = null;
    let hasColoredImages = false;

    thumbnails.forEach(thumb => {
      const thumbColor = thumb.dataset.color;
      if (thumbColor) hasColoredImages = true;

      // Show if: no color attribute, or color matches
      const shouldShow = !thumbColor || this.colorMatches(thumbColor, color);

      thumb.classList.toggle('color-filtered-hidden', !shouldShow);

      if (shouldShow && !firstVisibleThumb) {
        firstVisibleThumb = thumb;
      }
    });

    // If no images have color data, don't filter
    if (!hasColoredImages) return;

    // Filter main images
    const mainImages = section.querySelectorAll('.main-image-slide[data-color]');
    let firstVisibleImage = null;

    mainImages.forEach(image => {
      const imageColor = image.dataset.color;
      const shouldShow = !imageColor || this.colorMatches(imageColor, color);

      image.classList.toggle('color-filtered-hidden', !shouldShow);

      if (shouldShow && !firstVisibleImage) {
        firstVisibleImage = image;
      }
    });

    // Scroll container to top to show first visible image
    const container = section.querySelector('.image-scroll-container');
    if (container && firstVisibleImage) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active thumbnail
    if (firstVisibleThumb) {
      thumbnails.forEach(t => t.classList.remove('active'));
      firstVisibleThumb.classList.add('active');
    }
  }

  /**
   * Filter mobile gallery (slider-based)
   */
  filterMobileGallery(color) {
    const gallery = document.querySelector('media-gallery, .product__media-gallery');
    if (!gallery) {
      // Try new-product section
      this.filterNewProductGallery(color);
      return;
    }

    // Filter main slider items
    const sliderItems = gallery.querySelectorAll('[data-media-id][data-color], .product__media-item[data-color]');
    let firstVisibleItem = null;
    let visibleCount = 0;
    let hasColoredImages = false;

    sliderItems.forEach(item => {
      const itemColor = item.dataset.color;
      if (itemColor) hasColoredImages = true;

      const shouldShow = !itemColor || this.colorMatches(itemColor, color);

      item.classList.toggle('color-filtered-hidden', !shouldShow);

      if (shouldShow) {
        visibleCount++;
        if (!firstVisibleItem) {
          firstVisibleItem = item;
        }
      }
    });

    if (!hasColoredImages) return;

    // Filter thumbnails if present
    const thumbnailItems = gallery.querySelectorAll('.thumbnail-list__item[data-color]');
    thumbnailItems.forEach(item => {
      const itemColor = item.dataset.color;
      const shouldShow = !itemColor || this.colorMatches(itemColor, color);
      item.classList.toggle('color-filtered-hidden', !shouldShow);
    });

    // Update slider counter
    const counterTotal = gallery.querySelector('.slider-counter--total');
    if (counterTotal) {
      counterTotal.textContent = visibleCount;
    }

    // Reset to first visible item
    if (firstVisibleItem) {
      const slider = gallery.querySelector('[id^="Slider-Gallery-"], .product__media-list');
      if (slider) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      }

      // Update active states
      sliderItems.forEach(item => item.classList.remove('is-active'));
      firstVisibleItem.classList.add('is-active');
    }
  }

  /**
   * Filter new-product.liquid gallery (alternative mobile layout)
   */
  filterNewProductGallery(color) {
    const section = document.querySelector('.new-product-section, [class*="new-product"]');
    if (!section) return;

    const mediaItems = section.querySelectorAll('[data-color]');
    let hasColoredImages = false;

    mediaItems.forEach(item => {
      const itemColor = item.dataset.color;
      if (itemColor) hasColoredImages = true;

      const shouldShow = !itemColor || this.colorMatches(itemColor, color);
      item.classList.toggle('color-filtered-hidden', !shouldShow);
    });
  }

  /**
   * Check if two color strings match (fuzzy matching)
   */
  colorMatches(imageColor, selectedColor) {
    if (!imageColor || !selectedColor) return true;

    const normalizedImage = this.normalizeColor(imageColor);
    const normalizedSelected = this.normalizeColor(selectedColor);

    // Exact match
    if (normalizedImage === normalizedSelected) return true;

    // Contains match (handles "preto-frente" matching "preto")
    if (normalizedImage.includes(normalizedSelected) || normalizedSelected.includes(normalizedImage)) {
      return true;
    }

    return false;
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.colorImageFilter = new ColorImageFilter();
  });
} else {
  window.colorImageFilter = new ColorImageFilter();
}
