# Dawn Theme Architecture

## Table of Contents
1. [Directory Structure](#directory-structure)
2. [Templates](#templates)
3. [Sections](#sections)
4. [Snippets](#snippets)
5. [Assets](#assets)
6. [Config](#config)
7. [Locales](#locales)
8. [Dawn Conventions](#dawn-conventions)

---

## Directory Structure

```
theme/
├── assets/           # CSS, JS, images, fonts
├── config/           # Theme settings
│   ├── settings_schema.json   # Theme settings definition
│   └── settings_data.json     # Saved setting values
├── layout/           # Layout wrappers
│   ├── theme.liquid           # Main layout
│   └── password.liquid        # Password page layout
├── locales/          # Translations
│   ├── en.default.json
│   └── [locale].json
├── sections/         # Reusable sections
├── snippets/         # Reusable code fragments
└── templates/        # Page templates (JSON or Liquid)
    ├── index.json
    ├── product.json
    ├── collection.json
    ├── cart.json
    ├── page.json
    ├── blog.json
    ├── article.json
    ├── 404.json
    ├── search.json
    └── customers/    # Account templates
```

---

## Templates

### JSON Templates (Shopify 2.0)
JSON templates define which sections appear on a page:

```json
// templates/product.json
{
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": {
        "title": { "type": "title" },
        "price": { "type": "price" },
        "variant_picker": { "type": "variant_picker" },
        "quantity_selector": { "type": "quantity_selector" },
        "buy_buttons": { "type": "buy_buttons" }
      },
      "block_order": ["title", "price", "variant_picker", "quantity_selector", "buy_buttons"],
      "settings": {
        "enable_sticky_info": true
      }
    },
    "recommendations": {
      "type": "product-recommendations",
      "settings": {
        "heading": "You may also like"
      }
    }
  },
  "order": ["main", "recommendations"]
}
```

### Template Types
| Template | URL Pattern | Available Objects |
|----------|-------------|-------------------|
| index.json | `/` | N/A |
| product.json | `/products/{handle}` | `product` |
| collection.json | `/collections/{handle}` | `collection` |
| collection.list.json | `/collections` | `collections` |
| cart.json | `/cart` | `cart` |
| page.json | `/pages/{handle}` | `page` |
| blog.json | `/blogs/{handle}` | `blog` |
| article.json | `/blogs/{blog}/articles/{handle}` | `article`, `blog` |
| search.json | `/search` | `search` |
| 404.json | 404 pages | N/A |
| customers/*.json | `/account/*` | `customer` |

### Alternate Templates
Create variations with `.{suffix}.json`:
- `product.featured.json` → Products can use "Featured" template
- `page.contact.json` → Pages can use "Contact" template

---

## Sections

### Section File Structure
```liquid
<!-- sections/featured-collection.liquid -->

<!-- Liquid/HTML Content -->
<div class="section-{{ section.id }}">
  <h2>{{ section.settings.title }}</h2>
  
  {% for block in section.blocks %}
    {% case block.type %}
      {% when 'product' %}
        <div {{ block.shopify_attributes }}>
          {% render 'product-card', product: block.settings.product %}
        </div>
    {% endcase %}
  {% endfor %}
</div>

<!-- Styles scoped to section -->
{% style %}
  .section-{{ section.id }} {
    padding: {{ section.settings.padding }}px 0;
  }
{% endstyle %}

<!-- Schema (required) -->
{% schema %}
{
  "name": "Featured collection",
  "tag": "section",
  "class": "featured-collection",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Heading",
      "default": "Featured products"
    }
  ],
  "blocks": [],
  "presets": [
    {
      "name": "Featured collection"
    }
  ]
}
{% endschema %}
```

### Section Wrapper
Sections render inside a wrapper div:
```html
<div id="shopify-section-{section.id}" class="shopify-section {class}">
  <!-- section content -->
</div>
```

Customize the wrapper tag:
```json
{% schema %}
{
  "tag": "aside",
  "class": "my-custom-class"
}
{% endschema %}
```

### Static vs Dynamic Sections
**Static sections**: Rendered with `{% section 'name' %}` in layouts/templates
- Always appear in the same location
- ID is the filename (e.g., `shopify-section-header`)

**Dynamic sections**: Added via JSON templates or theme editor
- Can be reordered/added/removed by merchants
- ID includes template prefix (e.g., `shopify-section-template--123__main`)

---

## Snippets

### Basic Snippet
```liquid
<!-- snippets/product-card.liquid -->
<div class="product-card">
  <a href="{{ product.url }}">
    {{ product.featured_image | image_url: width: 400 | image_tag }}
    <h3>{{ product.title }}</h3>
    <p>{{ product.price | money }}</p>
  </a>
</div>
```

### Using Snippets
```liquid
{% render 'product-card', product: product %}

<!-- With multiple variables -->
{% render 'product-card', 
  product: product,
  show_vendor: true,
  image_size: 'medium'
%}

<!-- For loop with snippet -->
{% for product in collection.products %}
  {% render 'product-card', product: product %}
{% endfor %}
```

### Snippet Variable Scope
Variables inside snippets are isolated. Use parameters:
```liquid
<!-- Parent -->
{% assign show_price = true %}
{% render 'product-card', product: product, show_price: show_price %}

<!-- snippets/product-card.liquid -->
{% if show_price %}
  {{ product.price | money }}
{% endif %}
```

---

## Assets

### Asset Types
```
assets/
├── base.css              # Base styles
├── component-*.css       # Component styles
├── section-*.css         # Section-specific styles
├── global.js             # Global JavaScript
├── product-form.js       # Product form handling
├── cart.js               # Cart functionality
├── cart-drawer.js        # Cart drawer
├── details-modal.js      # Modal component
└── [images, fonts]
```

### Loading Assets
```liquid
<!-- CSS -->
{{ 'base.css' | asset_url | stylesheet_tag }}

<!-- Conditional CSS loading -->
{% if section.settings.enable_feature %}
  {{ 'feature.css' | asset_url | stylesheet_tag }}
{% endif %}

<!-- JavaScript -->
<script src="{{ 'global.js' | asset_url }}" defer></script>

<!-- JavaScript module -->
<script type="module" src="{{ 'product-form.js' | asset_url }}"></script>

<!-- Images -->
<img src="{{ 'logo.png' | asset_url }}" alt="Logo">

<!-- SVG inline -->
{% render 'icon-cart' %}

<!-- Preload critical assets -->
<link rel="preload" href="{{ 'base.css' | asset_url }}" as="style">
```

### Dawn CSS Architecture
Dawn uses vanilla CSS with:
- CSS custom properties (variables)
- BEM-like naming convention
- No preprocessor (no SCSS/LESS)

```css
:root {
  --color-foreground: 18, 18, 18;
  --color-background: 255, 255, 255;
  --font-body-family: "Assistant", sans-serif;
  --font-body-weight: 400;
}

.product-card {
  /* ... */
}

.product-card__title {
  /* ... */
}

.product-card__price--sale {
  /* ... */
}
```

---

## Config

### settings_schema.json
Defines theme settings in the Theme Editor:

```json
[
  {
    "name": "theme_info",
    "theme_name": "Dawn",
    "theme_version": "10.0.0",
    "theme_author": "Shopify",
    "theme_documentation_url": "https://help.shopify.com",
    "theme_support_url": "https://support.shopify.com"
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "color",
        "id": "color_primary",
        "label": "Primary color",
        "default": "#121212"
      },
      {
        "type": "color_scheme_group",
        "id": "color_schemes",
        "definition": [...]
      }
    ]
  },
  {
    "name": "Typography",
    "settings": [
      {
        "type": "font_picker",
        "id": "type_body_font",
        "label": "Body font",
        "default": "assistant_n4"
      }
    ]
  }
]
```

### settings_data.json
Stores saved values (auto-generated, don't edit manually):
```json
{
  "current": {
    "color_primary": "#ff0000",
    "type_body_font": "roboto_n4"
  },
  "presets": {
    "Default": {
      "color_primary": "#121212"
    }
  }
}
```

---

## Locales

### Translation File Structure
```json
// locales/en.default.json
{
  "general": {
    "continue_shopping": "Continue shopping"
  },
  "products": {
    "product": {
      "add_to_cart": "Add to cart",
      "sold_out": "Sold out",
      "quantity": {
        "label": "Quantity",
        "increase": "Increase quantity for {{ title }}",
        "decrease": "Decrease quantity for {{ title }}"
      }
    }
  },
  "sections": {
    "header": {
      "menu": "Menu",
      "cart_count": {
        "one": "{{ count }} item",
        "other": "{{ count }} items"
      }
    }
  }
}
```

### Using Translations
```liquid
<!-- Simple translation -->
{{ 'products.product.add_to_cart' | t }}

<!-- With interpolation -->
{{ 'products.product.quantity.increase' | t: title: product.title }}

<!-- Pluralization -->
{{ 'sections.header.cart_count' | t: count: cart.item_count }}

<!-- In schema (for labels) -->
"label": "t:sections.header.settings.logo.label"
```

---

## Dawn Conventions

### File Naming
- Sections: `main-{page}.liquid`, `{feature}.liquid`
- Snippets: `{component}.liquid`, `icon-{name}.liquid`
- CSS: `component-{name}.css`, `section-{name}.css`
- JS: `{feature}.js`, `{component}.js`

### Main Sections Pattern
Dawn uses `main-*.liquid` for primary page content:
- `main-product.liquid` - Product page main content
- `main-collection-product-grid.liquid` - Collection grid
- `main-cart-items.liquid` - Cart items
- `main-article.liquid` - Blog article content

### Component Pattern
Dawn uses Web Components / Custom Elements:
```javascript
// Define custom element
class ProductForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.form = this.querySelector('form');
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
  }

  onSubmitHandler(event) {
    event.preventDefault();
    // Handle form submission
  }
}

customElements.define('product-form', ProductForm);
```

```liquid
<!-- Use in Liquid -->
<product-form>
  {% form 'product', product %}
    <!-- form content -->
  {% endform %}
</product-form>
```

### Common Dawn Custom Elements
- `<product-form>` - Product form handling
- `<cart-items>` - Cart items management
- `<cart-drawer>` - Slide-out cart
- `<details-modal>` - Modal dialogs
- `<deferred-media>` - Lazy-loaded media
- `<variant-selects>` - Variant option handling
- `<quantity-input>` - Quantity +/- buttons
- `<localization-form>` - Currency/language selector

### Data Attributes
Dawn uses data attributes for JavaScript hooks:
```liquid
<button 
  data-add-to-cart
  data-variant-id="{{ variant.id }}"
>
  Add to cart
</button>
```

### Section Group Pattern (Header/Footer)
```liquid
<!-- layout/theme.liquid -->
{% sections 'header-group' %}
{{ content_for_layout }}
{% sections 'footer-group' %}
```

```json
// sections/header-group.json
{
  "type": "header",
  "name": "Header group",
  "sections": {
    "header": {
      "type": "header",
      "settings": {}
    }
  },
  "order": ["header"]
}
```
