document.addEventListener('DOMContentLoaded', () => {
  const stickyBar = document.getElementById('sticky-product-bar');
  if (!stickyBar) return;

  const hasColorAndSize = stickyBar.dataset.hasColorAndSize === 'true';
  if (!hasColorAndSize) return;

  const drawer = document.getElementById('size-selector-drawer');
  const openTrigger = stickyBar.querySelector('[data-action="open-size-drawer"]');
  const sizePicker = stickyBar.querySelector('[data-variant-picker="size"]');
  const buyButtons = stickyBar.querySelector('.product-form__buttons');
  const originalSizePickerParent = sizePicker ? sizePicker.parentNode : null;
  const originalBuyButtonsParent = buyButtons ? buyButtons.parentNode : null;
  const colorSwatches = stickyBar.querySelectorAll('input[name="options[Color]"], input[name="options[Cor]"]');

  if (!drawer || !openTrigger || !sizePicker || !buyButtons || !originalSizePickerParent || !originalBuyButtonsParent) {
    return;
  }

  // Disable trigger button initially
  openTrigger.disabled = true;

  // Add event listeners to color swatches
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('change', () => {
      openTrigger.disabled = false;
    });
  });

  const sizePlaceholder = drawer.querySelector('.size-picker-placeholder');
  const buyButtonsPlaceholder = drawer.querySelector('.buy-buttons-placeholder');

  const openDrawer = () => {
    if (openTrigger.disabled) return;
    sizePicker.classList.remove('sticky-bar__size-picker--hidden');
    sizePlaceholder.appendChild(sizePicker);
    buyButtonsPlaceholder.appendChild(buyButtons);
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
  };

  const closeDrawer = () => {
    sizePicker.classList.add('sticky-bar__size-picker--hidden');
    originalSizePickerParent.appendChild(sizePicker);
    originalBuyButtonsParent.appendChild(buyButtons);
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
  };

  openTrigger.addEventListener('click', openDrawer);
  drawer.addEventListener('click', (event) => {
    if (event.target.dataset.action === 'close-drawer') {
      closeDrawer();
    }
  });

  // Close drawer after form submission
  const form = stickyBar.querySelector('.product-form');
  if (form) {
    form.addEventListener('submit', () => {
      // Use a small timeout to allow the submission to start
      setTimeout(closeDrawer, 100);
    });
  }
});
