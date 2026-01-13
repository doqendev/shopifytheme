# Section Schema Reference

## Table of Contents
1. [Schema Structure](#schema-structure)
2. [Setting Types](#setting-types)
3. [Blocks](#blocks)
4. [Presets](#presets)
5. [Enabled On / Disabled On](#enabled-on--disabled-on)
6. [Localization](#localization)
7. [Common Patterns](#common-patterns)

---

## Schema Structure

Every section requires a `{% schema %}` tag with valid JSON:

```liquid
{% schema %}
{
  "name": "Section name",
  "tag": "section",
  "class": "custom-class",
  "limit": 1,
  "settings": [],
  "blocks": [],
  "presets": [],
  "default": {},
  "locales": {},
  "enabled_on": {},
  "disabled_on": {}
}
{% endschema %}
```

### Required Attributes
- `name`: Display name in theme editor

### Optional Attributes
| Attribute | Description |
|-----------|-------------|
| `tag` | HTML wrapper element (default: `div`) |
| `class` | CSS class for wrapper |
| `limit` | Max instances in template |
| `settings` | Section-level settings |
| `blocks` | Block definitions |
| `presets` | Preset configurations |
| `default` | Default config for static sections |
| `locales` | Section-specific translations |
| `enabled_on` | Where section can be used |
| `disabled_on` | Where section cannot be used |

---

## Setting Types

### Basic Input Types

#### Text
```json
{
  "type": "text",
  "id": "heading",
  "label": "Heading",
  "default": "Welcome",
  "placeholder": "Enter heading text",
  "info": "Optional help text"
}
```

#### Textarea
```json
{
  "type": "textarea",
  "id": "description",
  "label": "Description",
  "default": "Lorem ipsum..."
}
```

#### Number
```json
{
  "type": "number",
  "id": "products_per_row",
  "label": "Products per row",
  "default": 4,
  "min": 1,
  "max": 6
}
```

#### Range
```json
{
  "type": "range",
  "id": "padding",
  "label": "Section padding",
  "min": 0,
  "max": 100,
  "step": 4,
  "unit": "px",
  "default": 40
}
```

#### Checkbox
```json
{
  "type": "checkbox",
  "id": "show_vendor",
  "label": "Show product vendor",
  "default": true
}
```

#### Select
```json
{
  "type": "select",
  "id": "image_ratio",
  "label": "Image ratio",
  "default": "square",
  "options": [
    { "value": "portrait", "label": "Portrait" },
    { "value": "square", "label": "Square" },
    { "value": "landscape", "label": "Landscape" }
  ]
}
```

#### Radio
```json
{
  "type": "radio",
  "id": "layout",
  "label": "Layout",
  "default": "grid",
  "options": [
    { "value": "grid", "label": "Grid" },
    { "value": "list", "label": "List" }
  ]
}
```

### Resource Pickers

#### Product
```json
{
  "type": "product",
  "id": "featured_product",
  "label": "Featured product"
}
```
Access: `{{ section.settings.featured_product }}`

#### Collection
```json
{
  "type": "collection",
  "id": "collection",
  "label": "Collection"
}
```

#### Blog
```json
{
  "type": "blog",
  "id": "blog",
  "label": "Blog"
}
```

#### Page
```json
{
  "type": "page",
  "id": "page",
  "label": "Page"
}
```

#### Article
```json
{
  "type": "article",
  "id": "article",
  "label": "Article"
}
```

#### Product List
```json
{
  "type": "product_list",
  "id": "products",
  "label": "Products",
  "limit": 8
}
```
Access: `{% for product in section.settings.products %}`

#### Collection List
```json
{
  "type": "collection_list",
  "id": "collections",
  "label": "Collections",
  "limit": 6
}
```

### Media Types

#### Image Picker
```json
{
  "type": "image_picker",
  "id": "image",
  "label": "Image"
}
```

#### Video
```json
{
  "type": "video",
  "id": "video",
  "label": "Video"
}
```

#### Video URL
```json
{
  "type": "video_url",
  "id": "video_url",
  "label": "Video URL",
  "accept": ["youtube", "vimeo"],
  "placeholder": "https://www.youtube.com/watch?v=..."
}
```

### Style Types

#### Color
```json
{
  "type": "color",
  "id": "background_color",
  "label": "Background color",
  "default": "#ffffff"
}
```

#### Color Background
```json
{
  "type": "color_background",
  "id": "gradient",
  "label": "Background gradient"
}
```

#### Color Scheme
```json
{
  "type": "color_scheme",
  "id": "color_scheme",
  "label": "Color scheme",
  "default": "scheme-1"
}
```

#### Font Picker
```json
{
  "type": "font_picker",
  "id": "heading_font",
  "label": "Heading font",
  "default": "helvetica_n4"
}
```

### Special Types

#### Link List (Menu)
```json
{
  "type": "link_list",
  "id": "menu",
  "label": "Menu",
  "default": "main-menu"
}
```

#### URL
```json
{
  "type": "url",
  "id": "link",
  "label": "Link",
  "default": "/"
}
```

#### Richtext
```json
{
  "type": "richtext",
  "id": "content",
  "label": "Content",
  "default": "<p>Add your text here</p>"
}
```

#### HTML
```json
{
  "type": "html",
  "id": "custom_html",
  "label": "Custom HTML"
}
```

#### Liquid
```json
{
  "type": "liquid",
  "id": "custom_liquid",
  "label": "Custom Liquid"
}
```

#### Inline Richtext (no block elements)
```json
{
  "type": "inline_richtext",
  "id": "caption",
  "label": "Caption"
}
```

### Organizational

#### Header
```json
{
  "type": "header",
  "content": "Layout settings"
}
```

#### Paragraph
```json
{
  "type": "paragraph",
  "content": "These settings control the section appearance."
}
```

---

## Blocks

### Basic Block Definition
```json
{
  "blocks": [
    {
      "type": "heading",
      "name": "Heading",
      "limit": 1,
      "settings": [
        {
          "type": "text",
          "id": "heading",
          "label": "Heading text",
          "default": "Heading"
        }
      ]
    },
    {
      "type": "text",
      "name": "Text",
      "settings": [
        {
          "type": "richtext",
          "id": "text",
          "label": "Text"
        }
      ]
    }
  ]
}
```

### Using Blocks in Liquid
```liquid
{% for block in section.blocks %}
  <div {{ block.shopify_attributes }}>
    {% case block.type %}
      {% when 'heading' %}
        <h2>{{ block.settings.heading }}</h2>
      {% when 'text' %}
        {{ block.settings.text }}
      {% when 'image' %}
        {{ block.settings.image | image_url: width: 600 | image_tag }}
    {% endcase %}
  </div>
{% endfor %}
```

### Block Attributes
| Attribute | Description |
|-----------|-------------|
| `type` | Unique identifier |
| `name` | Display name |
| `limit` | Max instances |
| `settings` | Block settings |

### Block Object Properties
```liquid
{{ block.id }}               <!-- Unique block ID -->
{{ block.type }}             <!-- Block type string -->
{{ block.settings.xxx }}     <!-- Block settings -->
{{ block.shopify_attributes }} <!-- Required for editor -->
```

### Theme Blocks (Shopify 2.0)
Allow blocks to be used across multiple sections:
```json
{
  "blocks": [
    {
      "type": "@theme"
    },
    {
      "type": "custom_block",
      "name": "Custom"
    }
  ]
}
```

### App Blocks
Allow apps to inject content:
```json
{
  "blocks": [
    {
      "type": "@app"
    }
  ]
}
```

---

## Presets

Presets define how sections appear in "Add section" picker:

```json
{
  "presets": [
    {
      "name": "Featured collection",
      "settings": {
        "title": "Featured products",
        "products_to_show": 8
      },
      "blocks": [
        { "type": "heading" },
        { "type": "product", "settings": { "show_vendor": true } },
        { "type": "product" },
        { "type": "product" }
      ]
    }
  ]
}
```

### Multiple Presets
```json
{
  "presets": [
    {
      "name": "Grid layout",
      "settings": { "layout": "grid" }
    },
    {
      "name": "List layout", 
      "settings": { "layout": "list" }
    }
  ]
}
```

---

## Enabled On / Disabled On

### Restrict by Template
```json
{
  "enabled_on": {
    "templates": ["product", "collection"]
  }
}
```

### Restrict by Section Group
```json
{
  "enabled_on": {
    "groups": ["header", "footer"]
  }
}
```

### Disable on Specific Templates
```json
{
  "disabled_on": {
    "templates": ["password"],
    "groups": ["header"]
  }
}
```

### Available Templates
- `index`, `product`, `collection`, `collection.list`
- `page`, `blog`, `article`, `cart`
- `search`, `404`, `password`
- `customers/account`, `customers/login`, etc.

### Available Groups
- `header`, `footer`, `aside`, `custom.xxx`

---

## Localization

### Section-Level Translations
```json
{
  "locales": {
    "en": {
      "heading": "Featured collection",
      "view_all": "View all"
    },
    "fr": {
      "heading": "Collection vedette",
      "view_all": "Voir tout"
    }
  }
}
```

Access in Liquid:
```liquid
{{ 'sections.featured-collection.heading' | t }}
```

### Schema Label Localization
Reference theme locale files:
```json
{
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "t:sections.featured-collection.settings.heading.label",
      "info": "t:sections.featured-collection.settings.heading.info"
    }
  ]
}
```

In `locales/en.default.json`:
```json
{
  "sections": {
    "featured-collection": {
      "settings": {
        "heading": {
          "label": "Heading",
          "info": "Add a heading for this section"
        }
      }
    }
  }
}
```

---

## Common Patterns

### Image with Text Section
```json
{% schema %}
{
  "name": "Image with text",
  "settings": [
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "select",
      "id": "image_position",
      "label": "Image position",
      "default": "left",
      "options": [
        { "value": "left", "label": "Left" },
        { "value": "right", "label": "Right" }
      ]
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label"
    }
  ],
  "presets": [
    {
      "name": "Image with text"
    }
  ]
}
{% endschema %}
```

### Product Grid Section
```json
{% schema %}
{
  "name": "Featured collection",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Heading",
      "default": "Featured collection"
    },
    {
      "type": "collection",
      "id": "collection",
      "label": "Collection"
    },
    {
      "type": "range",
      "id": "products_to_show",
      "min": 2,
      "max": 12,
      "step": 1,
      "default": 4,
      "label": "Products to show"
    },
    {
      "type": "range",
      "id": "columns",
      "min": 1,
      "max": 6,
      "step": 1,
      "default": 4,
      "label": "Columns"
    },
    {
      "type": "checkbox",
      "id": "show_view_all",
      "default": true,
      "label": "Show 'View all' button"
    }
  ],
  "presets": [
    {
      "name": "Featured collection"
    }
  ]
}
{% endschema %}
```

### Main Product Section with Blocks
```json
{% schema %}
{
  "name": "Product information",
  "tag": "section",
  "class": "section",
  "blocks": [
    {
      "type": "@app"
    },
    {
      "type": "title",
      "name": "Title",
      "limit": 1
    },
    {
      "type": "price",
      "name": "Price",
      "limit": 1
    },
    {
      "type": "variant_picker",
      "name": "Variant picker",
      "limit": 1,
      "settings": [
        {
          "type": "select",
          "id": "picker_type",
          "label": "Type",
          "default": "dropdown",
          "options": [
            { "value": "dropdown", "label": "Dropdown" },
            { "value": "buttons", "label": "Buttons" }
          ]
        }
      ]
    },
    {
      "type": "quantity_selector",
      "name": "Quantity selector",
      "limit": 1
    },
    {
      "type": "buy_buttons",
      "name": "Buy buttons",
      "limit": 1,
      "settings": [
        {
          "type": "checkbox",
          "id": "show_dynamic_checkout",
          "label": "Show dynamic checkout buttons",
          "default": true
        }
      ]
    },
    {
      "type": "description",
      "name": "Description",
      "limit": 1
    },
    {
      "type": "custom_liquid",
      "name": "Custom Liquid",
      "settings": [
        {
          "type": "liquid",
          "id": "custom_liquid",
          "label": "Custom Liquid"
        }
      ]
    }
  ]
}
{% endschema %}
```

### Slideshow Section
```json
{% schema %}
{
  "name": "Slideshow",
  "tag": "section",
  "settings": [
    {
      "type": "range",
      "id": "slide_height",
      "label": "Slide height",
      "min": 400,
      "max": 800,
      "step": 50,
      "default": 600,
      "unit": "px"
    },
    {
      "type": "checkbox",
      "id": "autoplay",
      "label": "Auto-rotate slides",
      "default": false
    },
    {
      "type": "range",
      "id": "autoplay_speed",
      "label": "Change slides every",
      "min": 3,
      "max": 9,
      "step": 1,
      "default": 5,
      "unit": "s"
    }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Slide",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Image"
        },
        {
          "type": "text",
          "id": "heading",
          "label": "Heading"
        },
        {
          "type": "text",
          "id": "subheading",
          "label": "Subheading"
        },
        {
          "type": "url",
          "id": "link",
          "label": "Link"
        },
        {
          "type": "text",
          "id": "button_label",
          "label": "Button label"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Slideshow",
      "blocks": [
        { "type": "slide" },
        { "type": "slide" }
      ]
    }
  ]
}
{% endschema %}
```
