# Shopify Liquid Reference

## Table of Contents
1. [Syntax Basics](#syntax-basics)
2. [Data Types](#data-types)
3. [Operators](#operators)
4. [Tags](#tags)
5. [Filters](#filters)
6. [Global Objects](#global-objects)
7. [Product Objects](#product-objects)
8. [Cart Objects](#cart-objects)
9. [Customer Objects](#customer-objects)
10. [Common Patterns](#common-patterns)

---

## Syntax Basics

### Output
```liquid
{{ variable }}
{{ product.title }}
{{ product.title | upcase }}
```

### Logic (no visible output)
```liquid
{% if condition %}
  ...
{% endif %}

{% assign my_var = 'value' %}
```

### Whitespace Control
Use hyphens to strip whitespace:
```liquid
{%- if condition -%}
  content
{%- endif -%}
```

---

## Data Types

| Type | Example |
|------|---------|
| String | `'hello'` or `"hello"` |
| Number | `42`, `3.14` |
| Boolean | `true`, `false` |
| Nil | empty/undefined value |
| Array | accessed via loops or `[index]` |
| EmptyDrop | defined object with no value |

### Checking Empty Values
```liquid
{% if variable == blank %}
  <!-- variable is empty string, nil, or whitespace -->
{% endif %}

{% if variable == nil %}
  <!-- variable is undefined -->
{% endif %}

{% unless object == empty %}
  <!-- object exists and has value -->
{% endunless %}
```

---

## Operators

### Comparison
| Operator | Meaning |
|----------|---------|
| `==` | equals |
| `!=` | not equals |
| `>` | greater than |
| `<` | less than |
| `>=` | greater or equal |
| `<=` | less or equal |

### Logical
| Operator | Usage |
|----------|-------|
| `and` | both conditions true |
| `or` | either condition true |
| `contains` | string/array contains value |

```liquid
{% if product.tags contains 'sale' %}
{% if product.title contains 'shirt' and product.available %}
```

**Note**: Operators evaluate right-to-left. Parentheses are NOT supported.

---

## Tags

### Variable Tags
```liquid
{% assign handle = product.handle %}
{% capture full_title %}{{ product.title }} - {{ shop.name }}{% endcapture %}
{% increment counter %}
{% decrement counter %}
```

### Control Flow
```liquid
{% if product.available %}
  In stock
{% elsif product.inventory_quantity == 0 %}
  Sold out
{% else %}
  Check availability
{% endif %}

{% unless product.available %}
  Out of stock
{% endunless %}

{% case product.type %}
  {% when 'Shirt' %}
    Clothing
  {% when 'Shoes' %}
    Footwear
  {% else %}
    Other
{% endcase %}
```

### Iteration
```liquid
{% for product in collection.products %}
  {{ product.title }}
{% endfor %}

{% for product in collection.products limit:4 offset:2 %}
  {{ product.title }}
{% endfor %}

{% for i in (1..5) %}
  {{ i }}
{% endfor %}

<!-- forloop object -->
{% for item in array %}
  {{ forloop.index }}      <!-- 1-indexed -->
  {{ forloop.index0 }}     <!-- 0-indexed -->
  {{ forloop.first }}      <!-- true on first -->
  {{ forloop.last }}       <!-- true on last -->
  {{ forloop.length }}     <!-- total items -->
{% endfor %}

<!-- else for empty arrays -->
{% for product in collection.products %}
  {{ product.title }}
{% else %}
  No products found
{% endfor %}
```

### Theme Tags
```liquid
{% render 'snippet-name' %}
{% render 'product-card', product: product, show_vendor: true %}

{% section 'header' %}

{% form 'product', product %}
  <!-- form fields -->
{% endform %}

{% style %}
  .element { color: {{ settings.color_primary }}; }
{% endstyle %}

{% javascript %}
  console.log('loaded');
{% endjavascript %}
```

### Comment
```liquid
{% comment %}
  This won't render
{% endcomment %}

{% # Inline comment (Shopify 2.0+) %}
```

### Liquid Tag (no delimiters needed inside)
```liquid
{% liquid
  assign x = 1
  if x == 1
    echo 'one'
  endif
%}
```

---

## Filters

### String Filters
```liquid
{{ 'hello' | upcase }}              <!-- HELLO -->
{{ 'HELLO' | downcase }}            <!-- hello -->
{{ 'hello' | capitalize }}          <!-- Hello -->
{{ '  hello  ' | strip }}           <!-- hello -->
{{ 'hello' | size }}                <!-- 5 -->
{{ 'hello' | slice: 0, 3 }}         <!-- hel -->
{{ 'hello' | append: ' world' }}    <!-- hello world -->
{{ 'hello' | prepend: 'say ' }}     <!-- say hello -->
{{ 'hello' | replace: 'e', 'a' }}   <!-- hallo -->
{{ 'hello' | remove: 'l' }}         <!-- heo -->
{{ 'a-b-c' | split: '-' }}          <!-- array: ['a','b','c'] -->
{{ 'hello' | truncate: 3 }}         <!-- hel... -->
{{ 'hello world' | truncatewords: 1 }} <!-- hello... -->
{{ '<p>hi</p>' | strip_html }}      <!-- hi -->
{{ 'hi\nthere' | newline_to_br }}   <!-- hi<br>there -->
{{ '"hello"' | escape }}            <!-- &quot;hello&quot; -->
{{ 'hello' | url_encode }}          <!-- hello -->
{{ 'hello' | url_decode }}          <!-- hello -->
{{ 'hello' | base64_encode }}       <!-- aGVsbG8= -->
{{ 'aGVsbG8=' | base64_decode }}    <!-- hello -->
{{ 'hello' | md5 }}                 <!-- 5d41402abc4b2a76b9719d911017c592 -->
{{ 'hello' | sha256 }}              <!-- ... -->
{{ 'Hello\nWorld' | json }}         <!-- "Hello\nWorld" -->
```

### Number Filters
```liquid
{{ 4.5 | ceil }}                    <!-- 5 -->
{{ 4.5 | floor }}                   <!-- 4 -->
{{ 4.5 | round }}                   <!-- 5 -->
{{ 4.567 | round: 2 }}              <!-- 4.57 -->
{{ 10 | plus: 5 }}                  <!-- 15 -->
{{ 10 | minus: 5 }}                 <!-- 5 -->
{{ 10 | times: 5 }}                 <!-- 50 -->
{{ 10 | divided_by: 3 }}            <!-- 3 -->
{{ 10 | modulo: 3 }}                <!-- 1 -->
{{ -5 | abs }}                      <!-- 5 -->
{{ 10 | at_least: 5 }}              <!-- 10 -->
{{ 3 | at_most: 5 }}                <!-- 3 -->
```

### Array Filters
```liquid
{{ array | first }}
{{ array | last }}
{{ array | size }}
{{ array | join: ', ' }}
{{ array | sort }}
{{ array | sort_natural }}
{{ array | reverse }}
{{ array | uniq }}
{{ array | compact }}               <!-- removes nil -->
{{ array | concat: other_array }}
{{ array | map: 'title' }}          <!-- pluck property -->
{{ array | where: 'available' }}    <!-- filter by truthy -->
{{ array | where: 'type', 'Shirt' }} <!-- filter by value -->
```

### Money Filters
```liquid
{{ product.price | money }}                    <!-- $10.00 -->
{{ product.price | money_with_currency }}      <!-- $10.00 USD -->
{{ product.price | money_without_currency }}   <!-- 10.00 -->
{{ product.price | money_without_trailing_zeros }} <!-- $10 -->
```

### URL Filters
```liquid
{{ 'cart' | url }}                  <!-- /cart -->
{{ product | url }}                 <!-- /products/handle -->
{{ 'logo.png' | asset_url }}        <!-- //cdn.../assets/logo.png -->
{{ 'logo.png' | asset_img_url: '100x' }}
{{ product.featured_image | img_url: '300x300' }}
{{ product.featured_image | image_url: width: 300, height: 300 }}
{{ 'app.js' | asset_url | script_tag }}
{{ 'styles.css' | asset_url | stylesheet_tag }}
{{ collection | link_to: collection.title }}
{{ 'Click here' | link_to: product.url }}
```

### Date Filters
```liquid
{{ 'now' | date: '%Y-%m-%d' }}      <!-- 2024-01-15 -->
{{ article.published_at | date: '%B %d, %Y' }} <!-- January 15, 2024 -->

<!-- Format codes -->
%Y - 4-digit year
%m - month (01-12)
%d - day (01-31)
%H - hour 24h (00-23)
%I - hour 12h (01-12)
%M - minute (00-59)
%S - second (00-59)
%p - AM/PM
%B - full month name
%b - abbreviated month
%A - full weekday
%a - abbreviated weekday
```

### Default Filter
```liquid
{{ product.metafields.custom.subtitle | default: 'No subtitle' }}
{{ variable | default: 'fallback', allow_false: true }}
```

### Translation Filter
```liquid
{{ 'products.product.add_to_cart' | t }}
{{ 'cart.general.item_count' | t: count: cart.item_count }}
```

---

## Global Objects

### shop
```liquid
{{ shop.name }}
{{ shop.email }}
{{ shop.url }}
{{ shop.domain }}
{{ shop.currency }}
{{ shop.money_format }}
{{ shop.money_with_currency_format }}
```

### settings
Access theme settings from settings_schema.json:
```liquid
{{ settings.color_primary }}
{{ settings.logo }}
{{ settings.type_header_font }}
```

### routes
```liquid
{{ routes.root_url }}              <!-- / -->
{{ routes.cart_url }}              <!-- /cart -->
{{ routes.cart_add_url }}          <!-- /cart/add -->
{{ routes.cart_change_url }}       <!-- /cart/change -->
{{ routes.cart_update_url }}       <!-- /cart/update -->
{{ routes.account_url }}           <!-- /account -->
{{ routes.account_login_url }}     <!-- /account/login -->
{{ routes.account_register_url }} <!-- /account/register -->
{{ routes.collections_url }}       <!-- /collections -->
{{ routes.all_products_collection_url }} <!-- /collections/all -->
{{ routes.search_url }}            <!-- /search -->
```

### request
```liquid
{{ request.host }}
{{ request.path }}
{{ request.page_type }}            <!-- product, collection, index, etc -->
{{ request.locale.iso_code }}      <!-- en, fr, etc -->
```

### content_for_header
Required in layout <head>:
```liquid
{{ content_for_header }}
```

### content_for_layout
Required in layout <body>:
```liquid
{{ content_for_layout }}
```

### page_title / page_description
```liquid
<title>{{ page_title }}</title>
<meta name="description" content="{{ page_description | escape }}">
```

---

## Product Objects

### product
```liquid
{{ product.id }}
{{ product.title }}
{{ product.handle }}
{{ product.description }}
{{ product.vendor }}
{{ product.type }}
{{ product.tags }}                  <!-- array -->
{{ product.price }}                 <!-- in cents -->
{{ product.price_min }}
{{ product.price_max }}
{{ product.compare_at_price }}
{{ product.available }}             <!-- boolean -->
{{ product.url }}
{{ product.featured_image }}
{{ product.images }}                <!-- array -->
{{ product.variants }}              <!-- array -->
{{ product.options }}               <!-- array of option names -->
{{ product.options_with_values }}   <!-- array with values -->
{{ product.selected_variant }}
{{ product.selected_or_first_available_variant }}
{{ product.has_only_default_variant }}
{{ product.metafields.namespace.key }}
```

### variant
```liquid
{{ variant.id }}
{{ variant.title }}
{{ variant.sku }}
{{ variant.price }}
{{ variant.compare_at_price }}
{{ variant.available }}
{{ variant.inventory_quantity }}
{{ variant.inventory_policy }}      <!-- 'deny' or 'continue' -->
{{ variant.inventory_management }}  <!-- 'shopify' or nil -->
{{ variant.option1 }}
{{ variant.option2 }}
{{ variant.option3 }}
{{ variant.image }}
{{ variant.url }}
{{ variant.weight }}
{{ variant.weight_unit }}
{{ variant.requires_shipping }}
{{ variant.taxable }}
{{ variant.barcode }}
{{ variant.metafields.namespace.key }}
```

### collection
```liquid
{{ collection.id }}
{{ collection.title }}
{{ collection.handle }}
{{ collection.description }}
{{ collection.url }}
{{ collection.image }}
{{ collection.products }}           <!-- array -->
{{ collection.products_count }}
{{ collection.all_products_count }}
{{ collection.all_tags }}
{{ collection.all_types }}
{{ collection.all_vendors }}
{{ collection.sort_by }}
{{ collection.default_sort_by }}
{{ collection.filters }}            <!-- storefront filters -->
{{ collection.metafields.namespace.key }}
```

---

## Cart Objects

### cart
```liquid
{{ cart.item_count }}
{{ cart.total_price }}
{{ cart.total_weight }}
{{ cart.items }}                    <!-- array of line_items -->
{{ cart.items_subtotal_price }}
{{ cart.total_discount }}
{{ cart.original_total_price }}
{{ cart.note }}
{{ cart.attributes.attribute_name }}
{{ cart.cart_level_discount_applications }}
{{ cart.currency.iso_code }}
{{ cart.requires_shipping }}
```

### line_item
```liquid
{{ line_item.id }}
{{ line_item.key }}                 <!-- unique identifier -->
{{ line_item.title }}
{{ line_item.product }}
{{ line_item.variant }}
{{ line_item.quantity }}
{{ line_item.price }}               <!-- unit price -->
{{ line_item.line_price }}          <!-- quantity * price -->
{{ line_item.original_price }}
{{ line_item.original_line_price }}
{{ line_item.final_price }}
{{ line_item.final_line_price }}
{{ line_item.total_discount }}
{{ line_item.discounts }}           <!-- array -->
{{ line_item.sku }}
{{ line_item.vendor }}
{{ line_item.properties }}          <!-- custom properties -->
{{ line_item.url }}
{{ line_item.image }}
{{ line_item.gift_card }}           <!-- boolean -->
{{ line_item.requires_shipping }}
{{ line_item.selling_plan_allocation }}
```

---

## Customer Objects

### customer
```liquid
{% if customer %}
  {{ customer.id }}
  {{ customer.email }}
  {{ customer.first_name }}
  {{ customer.last_name }}
  {{ customer.name }}               <!-- full name -->
  {{ customer.phone }}
  {{ customer.default_address }}
  {{ customer.addresses }}
  {{ customer.orders }}
  {{ customer.orders_count }}
  {{ customer.total_spent }}
  {{ customer.tags }}
  {{ customer.accepts_marketing }}
  {{ customer.tax_exempt }}
{% endif %}
```

### address
```liquid
{{ address.id }}
{{ address.first_name }}
{{ address.last_name }}
{{ address.company }}
{{ address.address1 }}
{{ address.address2 }}
{{ address.city }}
{{ address.province }}
{{ address.province_code }}
{{ address.country }}
{{ address.country_code }}
{{ address.zip }}
{{ address.phone }}
```

---

## Common Patterns

### Product Form with Variant Selector
```liquid
{% form 'product', product, id: 'product-form', data-product-form: '' %}
  <select name="id">
    {% for variant in product.variants %}
      <option 
        value="{{ variant.id }}"
        {% if variant == product.selected_or_first_available_variant %}selected{% endif %}
        {% unless variant.available %}disabled{% endunless %}
      >
        {{ variant.title }} - {{ variant.price | money }}
      </option>
    {% endfor %}
  </select>
  
  <input type="number" name="quantity" value="1" min="1">
  
  <button type="submit" {% unless product.available %}disabled{% endunless %}>
    {% if product.available %}Add to Cart{% else %}Sold Out{% endif %}
  </button>
{% endform %}
```

### Responsive Image
```liquid
{% if product.featured_image %}
  {{
    product.featured_image | image_url: width: 600 | image_tag:
      loading: 'lazy',
      widths: '200, 400, 600, 800',
      sizes: '(min-width: 750px) 50vw, 100vw',
      alt: product.featured_image.alt | escape
  }}
{% endif %}
```

### Pagination
```liquid
{% paginate collection.products by 12 %}
  {% for product in collection.products %}
    {% render 'product-card', product: product %}
  {% endfor %}
  
  {% if paginate.pages > 1 %}
    <nav>
      {{ paginate | default_pagination }}
    </nav>
  {% endif %}
{% endpaginate %}
```

### Accessing Metafields
```liquid
<!-- Single value -->
{{ product.metafields.custom.subtitle }}

<!-- Rich text -->
{{ product.metafields.custom.description | metafield_tag }}

<!-- List of products -->
{% for prod in product.metafields.custom.related_products.value %}
  {{ prod.title }}
{% endfor %}

<!-- JSON -->
{% assign data = product.metafields.custom.specs.value %}
{{ data.weight }}
```

### Localization
```liquid
<!-- In section/snippet -->
{{ 'products.product.add_to_cart' | t }}

<!-- With variables -->
{{ 'cart.general.subtotal_items' | t: count: cart.item_count }}

<!-- Schema localization -->
"label": "t:sections.header.settings.logo.label"
```
