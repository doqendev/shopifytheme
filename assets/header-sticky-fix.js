// Fallback sticky header behavior for desktop + mobile.
// If the theme's <sticky-header> custom element is missing, define a simple one to
// hide on scroll down and reveal on scroll up.
(function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (customElements.get('sticky-header')) return;

  const SCROLL_DELTA = 4;

  class StickyHeaderFix extends HTMLElement {
    constructor() {
      super();
      this.lastY = window.scrollY || 0;
      this.boundary = 0;
      this.sectionHeader = null;
      this.onScroll = this.onScroll.bind(this);
    }

    connectedCallback() {
      this.sectionHeader = this.closest('.section-header') || document.querySelector('.section-header');
      if (this.sectionHeader) {
        const rect = this.sectionHeader.getBoundingClientRect();
        this.boundary = (rect.bottom || rect.height || 0) + (window.scrollY || 0);
      } else {
        this.boundary = this.getBoundingClientRect().bottom + (window.scrollY || 0);
      }
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', () => {
        if (this.sectionHeader) {
          const rect = this.sectionHeader.getBoundingClientRect();
          this.boundary = (rect.bottom || rect.height || 0) + (window.scrollY || 0);
        }
      });
      console.log('[StickyHeader] fallback enabled');
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
    }

    hide() {
      if (!this.sectionHeader) return;
      this.sectionHeader.classList.add('header--slide-up');
      this.sectionHeader.classList.add('shopify-section-header-hidden');
    }

    show() {
      if (!this.sectionHeader) return;
      this.sectionHeader.classList.remove('header--slide-up');
      this.sectionHeader.classList.remove('shopify-section-header-hidden');
    }

    onScroll() {
      const y = window.scrollY || 0;
      const down = y > this.lastY + SCROLL_DELTA;
      const up = y < this.lastY - SCROLL_DELTA;
      if (down && y > this.boundary) {
        this.hide();
      } else if (up || y <= this.boundary) {
        this.show();
      }
      this.lastY = y;
    }
  }

  customElements.define('sticky-header', StickyHeaderFix);
})();
