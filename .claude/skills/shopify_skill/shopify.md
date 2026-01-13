---
name: shopify-dev
description: Comprehensive Shopify theme development for Dawn-based stores. Triggers on any Shopify, Liquid, theme development, sections, snippets, or .liquid file work. Covers Liquid templating, Dawn theme architecture, section schemas, JavaScript (Cart API, Section Rendering API, Custom Elements), and storefront interactivity. Use for building new features, sections, snippets, drawers, modals, cart functionality, product forms, wishlists, and any theme customization.
---

# Shopify Theme Development

Build and customize Shopify themes based on Dawn architecture.

## Quick Reference

### File Locations
| Type | Path | Purpose |
|------|------|---------|
| Sections | `sections/*.liquid` | Reusable page components |
| Snippets | `snippets/*.liquid` | Small reusable code fragments |
| Templates | `templates/*.json` | Page structure definitions |
| Layouts | `layout/*.liquid` | Page wrappers |
| Assets | `assets/*` | CSS, JS, images |
| Config | `config/*.json` | Theme settings |
| Locales | `locales/*.json` | Translations |

### Key URLs (JavaScript)
```javascript
window.Shopify.routes.root          // Base URL (always ends with /)
window.Shopify.routes.root + 'cart.js'         // Get cart
window.Shopify.routes.root + 'cart/add.js'     // Add to cart
window.Shopify.routes.root + 'cart/change.js'  // Update item
window.Shopify.routes.root + 'cart/update.js'  // Bulk update
window.Shopify.routes.root + 'cart/clear.js'   // Clear cart
```

### Section Rendering API
Fetch section HTML dynamically:
```javascript
// Single section
fetch(`${window.location.pathname}?section_id=cart-drawer`)

// Multiple sections
fetch(`${window.location.pathname}?sections=cart-drawer,cart-icon`)

// Bundled with Cart API
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{ id: variantId, quantity: 1 }],
    sections: ['cart-drawer', 'cart-icon-bubble'],
    sections_url: window.location.pathname
  })
})
```

## Development Workflow

### Creating a New Section
1. Create `sections/my-section.liquid`
2. Add HTML/Liquid content
3. Add `{% schema %}` with settings and blocks
4. Add presets if section should be addable via theme editor
5. Reference in templates or render statically

### Creating Interactive Features
1. Create section with necessary Liquid structure
2. Define custom element in JavaScript
3. Use Cart API / Section Rendering API for updates
4. Dispatch events for cross-component communication

### Common Patterns

**Product form with Ajax:**
```liquid
<product-form>
  {% form 'product', product %}
    <select name="id">
      {% for variant in product.variants %}
        <option value="{{ variant.id }}">{{ variant.title }}</option>
      {% endfor %}
    </select>
    <button type="submit">Add to cart</button>
  {% endform %}
</product-form>
```

**Drawer trigger:**
```liquid
<button aria-controls="my-drawer" aria-expanded="false">Open</button>
<drawer-component id="my-drawer" class="drawer">
  <div class="drawer__overlay"></div>
  <div class="drawer__content">
    <!-- content -->
  </div>
</drawer-component>
```

**Render snippet with variables:**
```liquid
{% render 'product-card', 
  product: product,
  show_vendor: true,
  image_size: 'medium'
%}
```

## Reference Documentation

Read these files for detailed information:

- **Liquid syntax, filters, objects**: [references/liquid-reference.md](references/liquid-reference.md)
- **Dawn file structure, templates, sections**: [references/dawn-architecture.md](references/dawn-architecture.md)
- **Cart API, Section Rendering, Custom Elements**: [references/javascript-patterns.md](references/javascript-patterns.md)
- **Schema settings, blocks, presets**: [references/section-schema.md](references/section-schema.md)

## Feature Implementation Checklist

When building a feature:

1. [ ] Identify affected files (sections, snippets, assets)
2. [ ] Plan Liquid structure and data flow
3. [ ] Define schema settings/blocks if needed
4. [ ] Implement JavaScript for interactivity
5. [ ] Use Section Rendering API for dynamic updates
6. [ ] Add translations to locales if needed
7. [ ] Test across templates where feature appears

## Common Tasks

### Add to Cart with Drawer
Read [javascript-patterns.md](references/javascript-patterns.md) → "Product Form Component" and "Drawer Component"

### Create Custom Section
Read [section-schema.md](references/section-schema.md) → "Common Patterns"

### Work with Product Data
Read [liquid-reference.md](references/liquid-reference.md) → "Product Objects"

### Update Cart UI Dynamically
Read [javascript-patterns.md](references/javascript-patterns.md) → "Section Rendering API" and "Bundled Section Rendering"

### Style with Dawn CSS
Read [dawn-architecture.md](references/dawn-architecture.md) → "Assets" section
