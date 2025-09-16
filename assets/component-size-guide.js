class SizeGuideDrawer {
  constructor(root) {
    this.root = root;
    this.trigger = root.querySelector('[data-size-guide-open]');
    this.drawer = root.querySelector('[data-size-guide-drawer]');
    this.overlay = root.querySelector('[data-size-guide-overlay]');
    this.closeButtons = Array.from(root.querySelectorAll('[data-size-guide-close]'));
    this.unitButtons = Array.from(root.querySelectorAll('[data-size-guide-unit]'));
    this.tables = Array.from(root.querySelectorAll('[data-size-guide-table]'));
    this.activeUnit = this.tables.find((table) => table.classList.contains('is-active'))?.dataset.sizeGuideTable || null;
    this.previouslyFocused = null;
    this.isOpen = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);

    if (!this.trigger || !this.drawer) {
      return;
    }

    this.trigger.addEventListener('click', (event) => {
      event.preventDefault();
      this.open();
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    this.closeButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.close();
      });
    });

    this.unitButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.showUnit(button.dataset.sizeGuideUnit);
      });
    });
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.previouslyFocused = document.activeElement;
    this.drawer.classList.add('is-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.trigger.setAttribute('aria-expanded', 'true');

    if (this.overlay) {
      this.overlay.classList.add('is-open');
    }

    document.body.classList.add('size-guide-open');
    document.addEventListener('keydown', this.handleKeyDown);

    this.focusDrawer();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.drawer.classList.remove('is-open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');

    if (this.overlay) {
      this.overlay.classList.remove('is-open');
    }

    document.body.classList.remove('size-guide-open');
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
      this.previouslyFocused.focus({ preventScroll: true });
    }
  }

  focusDrawer() {
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus({ preventScroll: true });
    } else {
      this.drawer.focus({ preventScroll: true });
    }
  }

  getFocusableElements() {
    if (!this.drawer) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    return Array.from(this.drawer.querySelectorAll(selectors.join(',')));
  }

  handleKeyDown(event) {
    if (!this.isOpen) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.drawer.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  showUnit(unit) {
    if (!unit || this.activeUnit === unit) return;

    this.activeUnit = unit;

    this.unitButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.sizeGuideUnit === unit);
    });

    this.tables.forEach((table) => {
      table.classList.toggle('is-active', table.dataset.sizeGuideTable === unit);
    });
  }
}

function initSizeGuideDrawers() {
  document.querySelectorAll('[data-size-guide]').forEach((root) => {
    if (!root.__sizeGuideDrawer) {
      root.__sizeGuideDrawer = new SizeGuideDrawer(root);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSizeGuideDrawers);
} else {
  initSizeGuideDrawers();
}
