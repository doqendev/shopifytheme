(function () {
  if (window.CartEditInitialized) return;
  window.CartEditInitialized = true;

  const openButtonsSelector = '[data-cart-edit-open]';

  class CartEditModalController {
    constructor(dialog) {
      this.dialog = dialog;
      this.content = dialog.querySelector('[data-cart-edit-content]');
      this.form = dialog.querySelector('[data-cart-edit-form]');
      this.variantInput = this.form.querySelector('[data-cart-edit-variant-input]');
      this.quantityInput = this.form.querySelector('[data-cart-edit-quantity]');
      this.submitButton = this.form.querySelector('[data-cart-edit-submit]');
      this.priceElement = dialog.querySelector('[data-cart-edit-price]');
      this.variantTitleElement = dialog.querySelector('[data-cart-edit-variant-title]');
      this.errorElement = dialog.querySelector('[data-cart-edit-error]');
      this.featuredImage = dialog.querySelector('[data-cart-edit-featured]');
      this.thumbnailButtons = Array.from(dialog.querySelectorAll('[data-cart-edit-thumbnail]'));
      this.line = parseInt(this.content.dataset.line, 10);
      this.moneyFormat = this.content.dataset.moneyFormat;
      this.defaultSubmitLabel = this.submitButton?.dataset.defaultLabel || this.submitButton?.textContent;
      this.soldOutLabel = this.submitButton?.dataset.soldOutLabel || this.defaultSubmitLabel;

      try {
        this.variants = JSON.parse(this.content.dataset.variantData || '[]');
      } catch (error) {
        console.warn('Unable to parse variant data for cart edit modal.', error);
        this.variants = [];
      }

      this.onFormChange = this.onFormChange.bind(this);
      this.onFormSubmit = this.onFormSubmit.bind(this);
      this.onQuantityClick = this.onQuantityClick.bind(this);
      this.onThumbnailClick = this.onThumbnailClick.bind(this);

      this.form.addEventListener('change', this.onFormChange);
      this.form.addEventListener('submit', this.onFormSubmit);
      this.form.querySelectorAll('[data-quantity-change]').forEach((button) => {
        button.addEventListener('click', this.onQuantityClick);
      });
      this.thumbnailButtons.forEach((button) => {
        button.addEventListener('click', this.onThumbnailClick);
      });

      this.dialog.addEventListener('close', () => {
        if (this.errorElement) {
          this.errorElement.hidden = true;
          this.errorElement.textContent = '';
        }
      });

      this.updateVariant();
    }

    onQuantityClick(event) {
      event.preventDefault();
      const change = Number(event.currentTarget.dataset.quantityChange || 0);
      const currentValue = Number(this.quantityInput.value || 1);
      const step = Number(this.quantityInput.dataset.step || this.quantityInput.step || 1);
      const min = Number(this.quantityInput.dataset.min || this.quantityInput.min || 1);
      const maxAttr = this.quantityInput.dataset.max || this.quantityInput.max;
      const max = maxAttr ? Number(maxAttr) : null;
      let newValue = currentValue + change * step;

      if (Number.isNaN(newValue)) {
        newValue = min;
      }

      if (newValue < min) {
        newValue = min;
      }

      if (max && newValue > max) {
        newValue = max;
      }

      this.quantityInput.value = newValue;
    }

    onThumbnailClick(event) {
      event.preventDefault();
      const button = event.currentTarget;
      this.setFeaturedMediaFromButton(button);
    }

    onFormChange(event) {
      if (event.target.matches('[data-cart-edit-option-value]')) {
        this.updateVariant();
      }
    }

    onFormSubmit(event) {
      event.preventDefault();
      if (!this.variantInput.value) {
        this.showError(window.cartStrings?.error || 'Unable to update item.');
        return;
      }

      const min = Number(this.quantityInput.dataset.min || this.quantityInput.min || 1);
      const step = Number(this.quantityInput.dataset.step || this.quantityInput.step || 1);
      const maxAttr = this.quantityInput.dataset.max || this.quantityInput.max;
      const max = maxAttr ? Number(maxAttr) : null;
      let quantity = Number(this.quantityInput.value);
      if (Number.isNaN(quantity)) {
        quantity = min;
      }
      if (quantity < min) {
        quantity = min;
      }
      if (max && quantity > max) {
        quantity = max;
      }
      if (step > 1) {
        const remainder = (quantity - min) % step;
        if (remainder !== 0) {
          quantity = quantity - remainder + (remainder > 0 ? 0 : step);
        }
      }
      const cartItemsElement = document.querySelector('cart-items');

      if (!cartItemsElement || typeof cartItemsElement.updateQuantity !== 'function') {
        this.showError(window.cartStrings?.error || 'Unable to update item.');
        return;
      }

      this.setSubmitting(true);
      cartItemsElement.updateQuantity(this.line, quantity, 'updates[]', this.variantInput.value);
      this.dialog.close();
      this.setSubmitting(false);
    }

    setSubmitting(isSubmitting) {
      if (!this.submitButton) return;
      this.submitButton.disabled = isSubmitting;
      this.submitButton.classList.toggle('is-loading', isSubmitting);
    }

    showError(message) {
      if (!this.errorElement) return;
      this.errorElement.hidden = false;
      this.errorElement.textContent = message;
    }

    updateVariant() {
      const options = [];
      const optionFields = this.form.querySelectorAll('[data-cart-edit-option]');
      optionFields.forEach((_, index) => {
        const input = this.form.querySelector(`input[name="option-${index}"]:checked`);
        if (input) {
          options[index] = input.value;
        }
      });

      if (!optionFields.length) {
        const currentId = Number(this.variantInput.value);
        const defaultVariant = this.variants.find((variant) => variant.id === currentId) || this.variants[0];
        if (defaultVariant) {
          this.variantInput.value = defaultVariant.id;
          this.updateAvailability(defaultVariant.available);
          this.updateVariantDetails(defaultVariant);
        }
        return;
      }

      const matchingVariant = this.variants.find((variant) => {
        return variant.options.every((value, index) => value === options[index]);
      });

      if (!matchingVariant) {
        this.variantInput.value = '';
        this.updateAvailability(false);
        return;
      }

      this.variantInput.value = matchingVariant.id;
      this.updateAvailability(matchingVariant.available);
      this.updateVariantDetails(matchingVariant);
    }

    updateAvailability(isAvailable) {
      if (!this.submitButton) return;
      this.submitButton.disabled = !isAvailable;
      this.submitButton.textContent = isAvailable ? this.defaultSubmitLabel : this.soldOutLabel;
    }

    updateVariantDetails(variant) {
      if (this.variantTitleElement) {
        this.variantTitleElement.textContent = variant.title;
      }

      if (this.priceElement) {
        this.priceElement.textContent = this.formatMoney(variant.price);
      }

      if (this.quantityInput && variant.quantity_rule) {
        const { min, max, increment } = variant.quantity_rule;

        if (typeof min === 'number') {
          this.quantityInput.min = min;
          this.quantityInput.dataset.min = min;
        } else {
          this.quantityInput.removeAttribute('min');
          delete this.quantityInput.dataset.min;
        }

        if (typeof increment === 'number') {
          this.quantityInput.step = increment;
          this.quantityInput.dataset.step = increment;
        } else {
          this.quantityInput.step = 1;
          this.quantityInput.dataset.step = 1;
        }

        if (typeof max === 'number') {
          this.quantityInput.max = max;
          this.quantityInput.dataset.max = max;
        } else {
          this.quantityInput.removeAttribute('max');
          delete this.quantityInput.dataset.max;
        }

        const currentValue = Number(this.quantityInput.value);
        if (!Number.isNaN(currentValue) && typeof min === 'number' && currentValue < min) {
          this.quantityInput.value = min;
        }
      } else if (this.quantityInput) {
        this.quantityInput.removeAttribute('min');
        delete this.quantityInput.dataset.min;
        this.quantityInput.step = 1;
        this.quantityInput.dataset.step = 1;
        this.quantityInput.removeAttribute('max');
        delete this.quantityInput.dataset.max;
      }

      this.updateVariantMedia(variant);
    }

    setFeaturedMediaFromButton(button) {
      if (!button || !this.featuredImage) return;
      const mediaId = button.dataset.mediaId || '';
      const mediaSrc = button.dataset.mediaSrc || '';
      const mediaAlt = button.dataset.mediaAlt || '';

      if (mediaSrc) {
        this.featuredImage.src = mediaSrc;
      }

      if (mediaAlt) {
        this.featuredImage.alt = mediaAlt;
        this.featuredImage.dataset.mediaAlt = mediaAlt;
      }

      if (mediaId) {
        this.featuredImage.dataset.mediaId = mediaId;
      } else {
        delete this.featuredImage.dataset.mediaId;
      }

      this.thumbnailButtons.forEach((thumb) => {
        thumb.classList.toggle('is-active', thumb === button);
      });
    }

    updateVariantMedia(variant) {
      if (!this.featuredImage) return;

      const hasFeaturedMedia = variant && variant.featured_media;
      const targetId = hasFeaturedMedia ? String(variant.featured_media.id) : '';

      if (targetId && this.thumbnailButtons.length) {
        const match = this.thumbnailButtons.find((button) => button.dataset.mediaId === targetId);
        if (match) {
          this.setFeaturedMediaFromButton(match);
          return;
        }
      }

      if (this.thumbnailButtons.length) {
        const active = this.thumbnailButtons.find((button) => button.classList.contains('is-active'));
        if (active) {
          this.setFeaturedMediaFromButton(active);
          return;
        }

        this.setFeaturedMediaFromButton(this.thumbnailButtons[0]);
        return;
      }

      if (hasFeaturedMedia && variant.featured_media.preview_image) {
        const preview = variant.featured_media.preview_image;
        const src = preview.url || preview.src;
        if (src) {
          this.featuredImage.src = src;
        }
        const previewAlt = preview.alt || variant.featured_media.alt;
        if (previewAlt) {
          const alt = previewAlt;
          this.featuredImage.alt = alt;
          this.featuredImage.dataset.mediaAlt = alt;
        }
        this.featuredImage.dataset.mediaId = targetId;
        return;
      }

      if (variant && variant.title) {
        const defaultAlt = variant.title;
        this.featuredImage.alt = defaultAlt;
        this.featuredImage.dataset.mediaAlt = defaultAlt;
        delete this.featuredImage.dataset.mediaId;
      }
    }

    formatMoney(value) {
      if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
        return Shopify.formatMoney(value, this.moneyFormat || window.theme?.moneyFormat);
      }

      const amount = (Number(value) / 100).toFixed(2);
      return this.moneyFormat ? this.moneyFormat.replace('{{amount}}', amount) : amount;
    }
  }

  const controllers = new WeakMap();

  function getController(dialog) {
    if (!controllers.has(dialog)) {
      controllers.set(dialog, new CartEditModalController(dialog));
    }
    return controllers.get(dialog);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(openButtonsSelector);
    if (!trigger) return;
    event.preventDefault();
    const targetId = trigger.getAttribute('data-cart-edit-open');
    if (!targetId) return;
    const dialog = document.getElementById(targetId);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    getController(dialog);
    dialog.showModal();
  });
})();
