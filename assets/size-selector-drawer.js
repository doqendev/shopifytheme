class SizeSelectorDrawer extends HTMLElement {
  constructor() {
    super();

    this.overlay = this.querySelector('.drawer-overlay');
    this.closeButton = this.querySelector('.drawer-close');

    this.overlay.addEventListener('click', this.close.bind(this));
    this.closeButton.addEventListener('click', this.close.bind(this));
    this.addEventListener('keyup', (evt) => {
      if (evt.code === 'Escape') {
        this.close();
      }
    });
  }

  open(productForm) {
    this.productForm = productForm;

    const sizePicker = this.productForm.querySelector('.product-variant-picker--size');
    const buyButton = this.productForm.querySelector('.product-form__submit');

    if (sizePicker && buyButton) {
      const sizePickerClone = sizePicker.cloneNode(true);
      const buyButtonClone = buyButton.cloneNode(true);

      // Make the cloned size picker visible
      sizePickerClone.classList.remove('mobile-hidden');

      const sizePickerPlaceholder = this.querySelector('.size-picker-placeholder');
      const buyButtonsPlaceholder = this.querySelector('.buy-buttons-placeholder');

      sizePickerPlaceholder.appendChild(sizePickerClone);
      buyButtonsPlaceholder.appendChild(buyButtonClone);

      buyButtonClone.addEventListener('click', (evt) => {
        evt.preventDefault();
        this.productForm.submitForm();
        this.close();
      });
    }

    this.setAttribute('aria-hidden', 'false');
    this.classList.add('active');
    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    this.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
    this.productForm = null;
    const sizePickerPlaceholder = this.querySelector('.size-picker-placeholder');
    const buyButtonsPlaceholder = this.querySelector('.buy-buttons-placeholder');
    sizePickerPlaceholder.innerHTML = '';
    buyButtonsPlaceholder.innerHTML = '';
  }
}

customElements.define('size-selector-drawer', SizeSelectorDrawer);
