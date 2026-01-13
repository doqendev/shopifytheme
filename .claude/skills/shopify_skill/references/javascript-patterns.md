# Shopify JavaScript Patterns

## Table of Contents
1. [Ajax Cart API](#ajax-cart-api)
2. [Section Rendering API](#section-rendering-api)
3. [Custom Elements Pattern](#custom-elements-pattern)
4. [Event Patterns](#event-patterns)
5. [Fetch Patterns](#fetch-patterns)
6. [Dawn Component Examples](#dawn-component-examples)

---

## Ajax Cart API

The Cart API allows AJAX cart operations without page reload.

### Base URL
Always use locale-aware URLs:
```javascript
const baseUrl = window.Shopify.routes.root; // Always ends with '/'
```

### Get Cart
```javascript
async function getCart() {
  const response = await fetch(`${window.Shopify.routes.root}cart.js`);
  return response.json();
}

// Usage
const cart = await getCart();
console.log(cart.items, cart.item_count, cart.total_price);
```

### Add to Cart
```javascript
async function addToCart(variantId, quantity = 1, properties = {}) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{
        id: variantId,
        quantity: quantity,
        properties: properties
      }]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add to cart');
  }
  
  return response.json();
}

// Usage
await addToCart(12345678, 2, { 'Gift wrap': 'Yes' });
```

### Add Multiple Items
```javascript
async function addMultipleToCart(items) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items })
  });
  return response.json();
}

// Usage
await addMultipleToCart([
  { id: 123456, quantity: 1 },
  { id: 789012, quantity: 2 }
]);
```

### Update Cart Item Quantity
```javascript
// By line item key (preferred)
async function updateItemQuantity(key, quantity) {
  const response = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: key,  // line item key, not variant ID
      quantity: quantity
    })
  });
  return response.json();
}

// By line number (1-indexed)
async function updateItemByLine(line, quantity) {
  const response = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      line: line,
      quantity: quantity
    })
  });
  return response.json();
}
```

### Remove Cart Item
```javascript
// Set quantity to 0 to remove
async function removeItem(key) {
  return updateItemQuantity(key, 0);
}
```

### Update Multiple Items
```javascript
async function updateCart(updates) {
  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      updates: updates  // { variantId: quantity, ... }
    })
  });
  return response.json();
}

// Usage
await updateCart({
  '123456': 2,  // Set variant 123456 quantity to 2
  '789012': 0   // Remove variant 789012
});
```

### Clear Cart
```javascript
async function clearCart() {
  const response = await fetch(`${window.Shopify.routes.root}cart/clear.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.json();
}
```

### Update Cart Note
```javascript
async function updateCartNote(note) {
  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ note })
  });
  return response.json();
}
```

### Update Cart Attributes
```javascript
async function updateCartAttributes(attributes) {
  const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ attributes })
  });
  return response.json();
}

// Usage
await updateCartAttributes({
  'Gift message': 'Happy Birthday!',
  'Delivery date': '2024-12-25'
});
```

### Get Product JSON
```javascript
async function getProduct(handle) {
  const response = await fetch(`${window.Shopify.routes.root}products/${handle}.js`);
  return response.json();
}
```

---

## Section Rendering API

Fetch section HTML without full page reload.

### Basic Section Fetch
```javascript
async function fetchSection(sectionId) {
  const response = await fetch(
    `${window.location.pathname}?section_id=${sectionId}`
  );
  return response.text();
}
```

### Fetch Multiple Sections
```javascript
async function fetchSections(sectionIds) {
  const response = await fetch(
    `${window.location.pathname}?sections=${sectionIds.join(',')}`
  );
  return response.json();
}

// Returns: { "section-id": "<html>...", "other-section": "<html>..." }
```

### Bundled Section Rendering (with Cart API)
Combine cart operations with section rendering:
```javascript
async function addToCartWithSections(variantId, quantity, sections) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ id: variantId, quantity }],
      sections: sections,
      sections_url: window.location.pathname
    })
  });
  return response.json();
}

// Response includes:
// {
//   items: [...],
//   sections: {
//     "cart-drawer": "<html>...",
//     "cart-icon-bubble": "<html>..."
//   }
// }
```

### Dawn Pattern: Get Sections to Render
```javascript
getSectionsToRender() {
  return [
    {
      id: 'cart-drawer',
      section: 'cart-drawer',
      selector: '#CartDrawer'
    },
    {
      id: 'cart-icon-bubble',
      section: 'cart-icon-bubble',
      selector: '#cart-icon-bubble'
    }
  ];
}
```

### Update DOM with Section HTML
```javascript
function updateSections(sections, sectionsToRender) {
  sectionsToRender.forEach(({ id, selector, section }) => {
    const element = document.querySelector(selector);
    if (element && sections[section]) {
      // Parse new HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(sections[section], 'text/html');
      const newContent = doc.querySelector(selector);
      
      if (newContent) {
        element.innerHTML = newContent.innerHTML;
      }
    }
  });
}
```

### Full Cart Update Pattern
```javascript
async function updateQuantity(line, quantity) {
  const sectionsToRender = this.getSectionsToRender();
  
  const response = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line,
      quantity,
      sections: sectionsToRender.map(s => s.section),
      sections_url: window.location.pathname
    })
  });
  
  const cart = await response.json();
  
  // Update relevant sections
  this.updateSections(cart.sections, sectionsToRender);
  
  // Dispatch event for other components
  document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
  
  return cart;
}
```

---

## Custom Elements Pattern

Dawn uses Web Components for interactive functionality.

### Basic Custom Element
```javascript
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
  }

  connectedCallback() {
    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    const isPlus = event.currentTarget.name === 'plus';
    
    if (isPlus) {
      this.input.stepUp();
    } else {
      this.input.stepDown();
    }
    
    if (previousValue !== this.input.value) {
      this.input.dispatchEvent(this.changeEvent);
    }
  }
}

customElements.define('quantity-input', QuantityInput);
```

### Usage in Liquid
```liquid
<quantity-input class="quantity">
  <button name="minus" type="button">-</button>
  <input 
    type="number" 
    name="quantity" 
    value="{{ item.quantity }}"
    min="0"
    max="{{ item.variant.inventory_quantity }}"
  >
  <button name="plus" type="button">+</button>
</quantity-input>
```

### Extended Custom Element
```javascript
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.drawer = this.querySelector('.drawer');
    this.overlay = this.querySelector('.drawer__overlay');
  }

  connectedCallback() {
    this.overlay?.addEventListener('click', this.close.bind(this));
    document.addEventListener('cart:updated', this.onCartUpdate.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener('cart:updated', this.onCartUpdate.bind(this));
  }

  open() {
    this.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
    this.drawer.focus();
  }

  close() {
    this.classList.remove('is-open');
    document.body.classList.remove('overflow-hidden');
  }

  onCartUpdate(event) {
    // Update cart count, totals, etc.
    const cart = event.detail;
    this.updateCartCount(cart.item_count);
  }

  updateCartCount(count) {
    const countElement = this.querySelector('[data-cart-count]');
    if (countElement) {
      countElement.textContent = count;
    }
  }
}

customElements.define('cart-drawer', CartDrawer);
```

---

## Event Patterns

### Custom Events
```javascript
// Dispatch event
document.dispatchEvent(new CustomEvent('cart:add', {
  detail: {
    variantId: 123456,
    quantity: 1
  },
  bubbles: true
}));

// Listen for event
document.addEventListener('cart:add', (event) => {
  console.log('Added to cart:', event.detail);
});
```

### Common Dawn Events
```javascript
// Cart events
document.addEventListener('cart:add', handler);
document.addEventListener('cart:update', handler);
document.addEventListener('cart:remove', handler);
document.addEventListener('cart:refresh', handler);

// Variant events
document.addEventListener('variant:change', handler);

// Modal events
document.addEventListener('modal:open', handler);
document.addEventListener('modal:close', handler);
```

### Debounce Pattern
```javascript
function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Usage
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

input.addEventListener('input', (e) => debouncedSearch(e.target.value));
```

---

## Fetch Patterns

### Error Handling
```javascript
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

### Loading States
```javascript
class ProductForm extends HTMLElement {
  async onSubmit(event) {
    event.preventDefault();
    
    const submitButton = this.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';
    this.classList.add('is-loading');
    
    try {
      const formData = new FormData(this.querySelector('form'));
      await this.addToCart(formData);
      
      // Success feedback
      submitButton.textContent = 'Added!';
      setTimeout(() => {
        submitButton.textContent = originalText;
      }, 2000);
    } catch (error) {
      // Error feedback
      this.showError(error.message);
      submitButton.textContent = originalText;
    } finally {
      submitButton.disabled = false;
      this.classList.remove('is-loading');
    }
  }
}
```

---

## Dawn Component Examples

### Product Form Component
```javascript
class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('[type="submit"]');
    this.errorContainer = this.querySelector('[data-error-message]');
  }

  connectedCallback() {
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
  }

  async onSubmitHandler(event) {
    event.preventDefault();
    
    if (this.submitButton.disabled) return;
    
    this.setLoading(true);
    this.hideError();

    const formData = new FormData(this.form);
    const body = {
      items: [{
        id: parseInt(formData.get('id')),
        quantity: parseInt(formData.get('quantity')) || 1
      }],
      sections: this.getSectionsToRender().map(s => s.section),
      sections_url: window.location.pathname
    };

    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Could not add to cart');
      }

      const data = await response.json();
      
      // Update cart sections
      this.updateSections(data.sections);
      
      // Open cart drawer
      document.querySelector('cart-drawer')?.open();
      
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  getSectionsToRender() {
    return [
      { section: 'cart-drawer', selector: '#CartDrawer' },
      { section: 'cart-icon-bubble', selector: '#cart-icon-bubble' }
    ];
  }

  updateSections(sections) {
    this.getSectionsToRender().forEach(({ section, selector }) => {
      const element = document.querySelector(selector);
      if (element && sections[section]) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sections[section], 'text/html');
        const newElement = doc.querySelector(selector);
        if (newElement) element.innerHTML = newElement.innerHTML;
      }
    });
  }

  setLoading(loading) {
    this.submitButton.disabled = loading;
    this.submitButton.classList.toggle('loading', loading);
  }

  showError(message) {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
      this.errorContainer.hidden = false;
    }
  }

  hideError() {
    if (this.errorContainer) {
      this.errorContainer.hidden = true;
    }
  }
}

customElements.define('product-form', ProductForm);
```

### Drawer Component
```javascript
class DrawerComponent extends HTMLElement {
  constructor() {
    super();
    this.overlay = this.querySelector('.drawer__overlay');
    this.content = this.querySelector('.drawer__content');
  }

  connectedCallback() {
    this.overlay?.addEventListener('click', () => this.close());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
    
    // Listen for open triggers
    document.querySelectorAll(`[data-drawer-open="${this.id}"]`).forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });
  }

  get isOpen() {
    return this.classList.contains('is-open');
  }

  open() {
    this.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.content?.focus();
    
    // Trap focus inside drawer
    this.trapFocus();
  }

  close() {
    this.classList.remove('is-open');
    document.body.style.overflow = '';
    
    // Return focus to trigger
    const trigger = document.querySelector(`[data-drawer-open="${this.id}"]`);
    trigger?.focus();
  }

  trapFocus() {
    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    });
  }
}

customElements.define('drawer-component', DrawerComponent);
```

### Size Selector Example (for your wishlist scenario)
```javascript
class SizeDrawer extends HTMLElement {
  constructor() {
    super();
    this.productId = null;
    this.product = null;
  }

  connectedCallback() {
    document.addEventListener('wishlist:add-to-cart', this.onWishlistAdd.bind(this));
    
    this.querySelector('[data-close]')?.addEventListener('click', () => this.close());
    this.querySelector('form')?.addEventListener('submit', this.onSubmit.bind(this));
  }

  async onWishlistAdd(event) {
    const { productHandle } = event.detail;
    
    // Fetch product data
    const response = await fetch(`/products/${productHandle}.js`);
    this.product = await response.json();
    
    // Populate size options
    this.renderSizeOptions();
    
    // Open drawer
    this.open();
  }

  renderSizeOptions() {
    const container = this.querySelector('[data-size-options]');
    const sizeOption = this.product.options.find(o => 
      o.name.toLowerCase() === 'size'
    );
    
    if (!sizeOption) {
      // No size option, add first available variant directly
      this.addToCart(this.product.variants.find(v => v.available)?.id);
      return;
    }

    container.innerHTML = this.product.variants
      .filter(v => v.available)
      .map(variant => `
        <label class="size-option">
          <input type="radio" name="id" value="${variant.id}">
          <span>${variant.option1}</span>
        </label>
      `).join('');
  }

  async onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const variantId = formData.get('id');
    
    if (variantId) {
      await this.addToCart(parseInt(variantId));
      this.close();
    }
  }

  async addToCart(variantId) {
    const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: variantId, quantity: 1 }]
      })
    });
    
    if (response.ok) {
      document.dispatchEvent(new CustomEvent('cart:updated'));
    }
  }

  open() {
    this.classList.add('is-open');
  }

  close() {
    this.classList.remove('is-open');
    this.product = null;
  }
}

customElements.define('size-drawer', SizeDrawer);
```
