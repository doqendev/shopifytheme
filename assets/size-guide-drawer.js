(function () {
  const SELECTOR = '[data-size-guide]';
  const instances = new WeakMap();

  class ProductSizeGuide {
    constructor(element) {
      this.element = element;
      this.drawer = element.querySelector('[data-size-guide-drawer]');
      this.trigger = element.querySelector('[data-size-guide-trigger]');
      this.tableWrapper = element.querySelector('[data-size-guide-table]');
      this.unitButtons = Array.from(element.querySelectorAll('[data-size-guide-unit]'));
      this.closeElements = Array.from(element.querySelectorAll('[data-size-guide-close]'));

      this.handleTriggerClick = this.open.bind(this);
      this.handleCloseClick = this.close.bind(this);
      this.handleKeyDown = this.onKeyDown.bind(this);
      this.handleUnitClick = this.onUnitClick.bind(this);

      this.previouslyFocusedElement = null;
      this.focusableElements = [];
      this.tableData = null;
      this.currentUnit = null;

      this.registerEvents();
      this.prepareTable();
    }

    registerEvents() {
      if (this.trigger) {
        this.trigger.addEventListener('click', this.handleTriggerClick);
      }

      this.closeElements.forEach((el) => {
        el.addEventListener('click', this.handleCloseClick);
      });

      this.unitButtons.forEach((button) => {
        button.addEventListener('click', this.handleUnitClick);
      });
    }

    unregisterEvents() {
      if (this.trigger) {
        this.trigger.removeEventListener('click', this.handleTriggerClick);
      }

      this.closeElements.forEach((el) => {
        el.removeEventListener('click', this.handleCloseClick);
      });

      this.unitButtons.forEach((button) => {
        button.removeEventListener('click', this.handleUnitClick);
      });

      document.removeEventListener('keydown', this.handleKeyDown);
    }

    prepareTable() {
      if (!this.tableWrapper) {
        return;
      }

      const rawData = this.tableWrapper.dataset.table;
      if (!rawData) {
        return;
      }

      try {
        this.tableData = JSON.parse(rawData);
      } catch (error) {
        console.warn('Size guide: unable to parse table data', error);
        this.tableData = null;
        return;
      }

      this.currentUnit = this.baseUnit;
      this.setUnit(this.currentUnit, true);
    }

    get baseUnit() {
      if (!this.tableWrapper) {
        return 'cm';
      }
      return this.tableWrapper.dataset.baseUnit || 'cm';
    }

    open(event) {
      if (event) {
        event.preventDefault();
      }
      if (!this.drawer || this.isOpen()) {
        return;
      }

      this.previouslyFocusedElement = document.activeElement;
      this.drawer.classList.add('product-size-guide__drawer--open');
      this.drawer.setAttribute('aria-hidden', 'false');
      if (this.trigger) {
        this.trigger.setAttribute('aria-expanded', 'true');
      }
      document.body.classList.add('size-guide-open');
      document.addEventListener('keydown', this.handleKeyDown);

      this.focusableElements = this.getFocusableElements();
      if (this.focusableElements.length) {
        this.focusableElements[0].focus();
      }
    }

    close(event) {
      if (event) {
        event.preventDefault();
      }
      if (!this.drawer || !this.isOpen()) {
        return;
      }

      this.drawer.classList.remove('product-size-guide__drawer--open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('size-guide-open');
      document.removeEventListener('keydown', this.handleKeyDown);

      if (this.trigger) {
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.focus();
      } else if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
      }
    }

    isOpen() {
      return this.drawer && this.drawer.classList.contains('product-size-guide__drawer--open');
    }

    onKeyDown(event) {
      if (!this.isOpen()) {
        return;
      }

      if (event.key === 'Escape') {
        this.close();
      } else if (event.key === 'Tab') {
        this.trapFocus(event);
      }
    }

    trapFocus(event) {
      this.focusableElements = this.getFocusableElements();
      if (!this.focusableElements.length) {
        return;
      }

      const first = this.focusableElements[0];
      const last = this.focusableElements[this.focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          event.preventDefault();
        }
      } else if (document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }

    getFocusableElements() {
      if (!this.drawer) {
        return [];
      }
      return Array.from(
        this.drawer.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    }

    onUnitClick(event) {
      event.preventDefault();
      const button = event.currentTarget;
      const unit = button.dataset.unit;
      if (!unit || unit === this.currentUnit) {
        return;
      }
      this.setUnit(unit, true);
    }

    setUnit(unit, updateTable) {
      this.currentUnit = unit;
      this.unitButtons.forEach((button) => {
        const isActive = button.dataset.unit === unit;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      if (updateTable && this.tableData) {
        this.renderTable(unit);
      }
    }

    renderTable(unit) {
      if (!this.tableWrapper || !this.tableData || !Array.isArray(this.tableData.rows)) {
        return;
      }

      const baseUnit = this.baseUnit;
      const rows = Array.from(this.tableWrapper.querySelectorAll('tbody tr'));

      rows.forEach((row, rowIndex) => {
        const dataRow = this.tableData.rows[rowIndex];
        if (!dataRow || !Array.isArray(dataRow.values)) {
          return;
        }

        const cells = Array.from(row.querySelectorAll('td'));
        cells.forEach((cell, cellIndex) => {
          const baseValue = dataRow.values[cellIndex];
          if (typeof baseValue !== 'number') {
            cell.textContent = baseValue;
            return;
          }

          let value = baseValue;
          if (unit !== baseUnit) {
            if (baseUnit === 'cm' && unit === 'in') {
              value = baseValue / 2.54;
            } else if (baseUnit === 'in' && unit === 'cm') {
              value = baseValue * 2.54;
            }
          }

          cell.textContent = this.formatValue(value, unit);
        });
      });

      this.tableWrapper.dataset.currentUnit = unit;
    }

    formatValue(value, unit) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return value;
      }

      const isInteger = Number.isInteger(value);
      const fractionDigits = unit === 'in' ? 1 : isInteger ? 0 : 1;

      return value.toLocaleString('pt-PT', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      });
    }

    destroy() {
      this.unregisterEvents();
      this.focusableElements = [];
      this.tableData = null;
    }
  }

  function init(context) {
    const scope = context || document;
    scope.querySelectorAll(SELECTOR).forEach((element) => {
      if (!instances.has(element)) {
        instances.set(element, new ProductSizeGuide(element));
      }
    });
  }

  function destroy(context) {
    const scope = context || document;
    scope.querySelectorAll(SELECTOR).forEach((element) => {
      const instance = instances.get(element);
      if (instance) {
        instance.destroy();
        instances.delete(element);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => {
    init(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    destroy(event.target);
  });
})();
