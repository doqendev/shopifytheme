# Wishlist App - UI/UX Design Recommendations

**Date**: November 3, 2025
**Purpose**: Define optimal UI/UX patterns for Shopify App
**Status**: Design Phase

---

## Executive Summary

Based on research of top-performing Shopify wishlist apps (Swym, Wishlist King/Swish, Hulk, Wishlist Whale), the **floating button + drawer pattern** is the most popular and effective approach for 2025.

### Recommended Approach: **Floating Button with Dedicated Drawer**

**Why this works:**
✅ Non-intrusive (doesn't compete with cart)
✅ Always accessible (sticky on scroll)
✅ Clear visual separation (wishlist ≠ cart)
✅ Better mobile UX (thumb-friendly placement)
✅ Reduces cart drawer complexity
✅ Matches modern e-commerce patterns (Pinterest, Amazon)

---

## UI Pattern Comparison

### Option 1: Floating Button + Drawer (RECOMMENDED ⭐)

```
┌─────────────────────────────────────────┐
│  Store Header                           │
│  [Logo]    [Nav Menu]    [Search] [Cart]│
└─────────────────────────────────────────┘
│                                          │
│  Product Grid                            │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ ❤️   │  │ ❤️   │  │ ❤️   │          │
│  │      │  │      │  │      │          │
│  │Product│  │Product│  │Product│        │
│  └──────┘  └──────┘  └──────┘          │
│                                          │
│                              ┌─────┐    │ ← Floating button
│                              │ ❤️ 5 │    │   (fixed position)
│                              └─────┘    │
└──────────────────────────────────────────┘

When clicked, drawer slides in from right:

┌──────────────────────┬───────────────────┐
│  Main Content        │  Wishlist Drawer  │
│  (dimmed overlay)    │                   │
│                      │  ❤️ My Wishlist   │
│                      │  ───────────────  │
│                      │  [X] Close        │
│                      │                   │
│                      │  ┌──────────────┐ │
│                      │  │ Product 1    │ │
│                      │  │ $99.00  [🛒] │ │
│                      │  └──────────────┘ │
│                      │                   │
│                      │  ┌──────────────┐ │
│                      │  │ Product 2    │ │
│                      │  │ $49.00  [🛒] │ │
│                      │  └──────────────┘ │
│                      │                   │
│                      │  [View All Items] │
└──────────────────────┴───────────────────┘
```

**Pros:**
- ✅ Dedicated space for wishlist
- ✅ Doesn't interfere with cart functionality
- ✅ Easy thumb access on mobile (bottom right)
- ✅ Counter badge shows item count
- ✅ Can be positioned anywhere (customizable)
- ✅ Familiar pattern (like chat widgets)

**Cons:**
- ⚠️ Adds another UI element to manage
- ⚠️ Might compete with other floating buttons (chat, back-to-top)

---

### Option 2: Cart Drawer Integration (Your Current Approach)

```
┌─────────────────────────────────────────┐
│  Store Header                      [Cart]│ ← Click opens drawer
└─────────────────────────────────────────┘

Cart Drawer opens with tabs:

┌──────────────────────┬───────────────────┐
│  Main Content        │  Cart Drawer      │
│  (dimmed overlay)    │                   │
│                      │  [Cart] [Wishlist]│ ← Tab switching
│                      │    ▲       │      │
│                      │  ──┴───────┴────  │
│                      │                   │
│                      │  Cart Items (5)   │
│                      │  ┌──────────────┐ │
│                      │  │ Product 1    │ │
│                      │  │ $99.00  [x]  │ │
│                      │  └──────────────┘ │
│                      │                   │
│                      │  Total: $250.00   │
│                      │  [Checkout]       │
└──────────────────────┴───────────────────┘
```

**Pros:**
- ✅ Single drawer (simpler code)
- ✅ Leverages existing cart drawer
- ✅ No additional floating buttons
- ✅ Merchant already familiar with cart drawer

**Cons:**
- ⚠️ Hidden behind cart icon (low discoverability)
- ⚠️ Confusing to have wishlist in "cart" drawer
- ⚠️ Switching tabs interrupts cart flow
- ⚠️ Hides checkout button when on wishlist tab

---

### Option 3: Header Menu Item

```
┌─────────────────────────────────────────┐
│  [Logo]  [Shop] [About] [Wishlist ❤️]  [Cart]│ ← Wishlist in nav
└─────────────────────────────────────────┘

Click opens dropdown or goes to page:

┌─────────────────────────────────────────┐
│  [Logo]  [Shop] [About] [Wishlist ❤️]  [Cart]│
│                           │             │
│                           ▼             │
│                    ┌──────────────────┐ │
│                    │  My Wishlist (3) │ │
│                    ├──────────────────┤ │
│                    │ Product 1  $99   │ │
│                    │ Product 2  $49   │ │
│                    │ Product 3  $29   │ │
│                    ├──────────────────┤ │
│                    │ [View All Items] │ │
│                    └──────────────────┘ │
└─────────────────────────────────────────┘
```

**Pros:**
- ✅ Very discoverable (always visible)
- ✅ Clean integration with navigation
- ✅ Works well with dedicated page

**Cons:**
- ⚠️ Takes up nav space
- ⚠️ Merchant must manually add to menu
- ⚠️ Not always visible (scroll away on mobile)
- ⚠️ Less dynamic (hard to show quick actions)

---

### Option 4: Hybrid Approach (BEST OF BOTH WORLDS 🌟)

```
Desktop:
┌─────────────────────────────────────────┐
│  [Logo]  [Nav]  [Wishlist ❤️ 5]  [Cart] │ ← In header on desktop
└─────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────┐
│  [☰ Menu]         [Logo]         [Cart] │
└─────────────────────────────────────────┘
│                                          │
│  Product Grid                            │
│                              ┌─────┐    │
│                              │ ❤️ 5 │    │ ← Floating on mobile
│                              └─────┘    │
└──────────────────────────────────────────┘
```

**Pros:**
- ✅ Best of both: visible header (desktop) + floating (mobile)
- ✅ Optimal for each device
- ✅ Header placement mirrors cart on desktop
- ✅ Thumb-friendly floating button on mobile

**Cons:**
- ⚠️ More complex implementation (two UI patterns)
- ⚠️ Merchant must configure both placements

---

## Recommended Design: Floating Button + Drawer

### Why This is Optimal for a Shopify App:

1. **Universal Compatibility**
   - Works on ANY theme (no nav menu dependency)
   - Doesn't conflict with existing cart drawers
   - Easy to position (app block setting)

2. **Maximum Merchant Flexibility** ⭐
   - **Full position control** (8 position options)
   - **Complete style customization** (shape, colors, size, icons)
   - **Behavior options** (auto-open, animations, triggers)
   - **Toast notification customization** (style, position, duration, content)
   - **Can disable any feature** if they prefer alternatives

3. **User Experience**
   - Always accessible (follows scroll)
   - Clear purpose (separate from cart)
   - Quick access without navigation
   - Shows item count badge

4. **Mobile Optimization**
   - Perfect for thumb zone (bottom corners)
   - Doesn't take up header space
   - Easy to tap (large target area)

5. **Industry Standard**
   - Used by top apps (Swym, Hulk, Wishlist Whale)
   - Familiar to users (like chat widgets)
   - Proven conversion benefits

### Design Philosophy: Fresh Start ✨

We're building from scratch, NOT adapting existing code. This allows us to:
- ✅ Modern architecture (clean, modular, maintainable)
- ✅ Optimal performance (lightweight, fast)
- ✅ Best practices (accessibility, responsive, semantic HTML)
- ✅ Learn from what worked (color tracking, sync, quick-add)
- ✅ Avoid what didn't (complex rendering, payload size, cart drawer conflicts)

---

## Detailed Component Design

### 1. Floating Wishlist Button

```
Visual Design:

┌──────────────┐
│              │
│      ❤️      │  ← Heart icon (filled or outline)
│      5       │  ← Counter badge (optional)
│              │
└──────────────┘
  Circular or
  rounded square
```

**Specifications:**

**Desktop:**
- Size: 56px × 56px
- Position: Fixed, bottom-right (20px from edges)
- Z-index: 9998 (below modals, above content)
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Background: Customizable (default: white or theme color)
- Icon: Heart SVG (customizable color)
- Badge: Small circle, top-right corner, red/accent color

**Mobile:**
- Size: 52px × 52px
- Position: Fixed, bottom-right (16px from edges)
- Badge: Slightly smaller
- Safe area: Respects env(safe-area-inset-bottom)

**States:**

1. **Default (Empty Wishlist)**
   ```css
   background: rgba(255,255,255,0.95);
   backdrop-filter: blur(10px);
   border: 1px solid rgba(0,0,0,0.1);
   opacity: 0.9;
   ```
   - Heart: Outline style, gray
   - No badge

2. **With Items**
   ```css
   background: #fff;
   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
   opacity: 1;
   ```
   - Heart: Filled, accent color (#d23f57)
   - Badge: Shows count

3. **Hover (Desktop)**
   ```css
   transform: scale(1.05);
   box-shadow: 0 6px 16px rgba(0,0,0,0.2);
   ```
   - Subtle animation

4. **Active (Clicked)**
   ```css
   transform: scale(0.95);
   ```
   - Quick scale down feedback

**Animations:**

```css
/* Entrance animation */
@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Counter badge animation when count changes */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* Hover bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

**Customization Options (App Block Settings):**

```liquid
{% schema %}
{
  "name": "Wishlist Floating Button",
  "settings": [
    {
      "type": "header",
      "content": "Position & Layout"
    },
    {
      "type": "select",
      "id": "position",
      "label": "Button Position",
      "info": "Where the floating button appears on the page",
      "options": [
        { "value": "bottom-right", "label": "Bottom Right (Recommended)" },
        { "value": "bottom-left", "label": "Bottom Left" },
        { "value": "bottom-center", "label": "Bottom Center" },
        { "value": "middle-right", "label": "Middle Right (Side)" },
        { "value": "middle-left", "label": "Middle Left (Side)" },
        { "value": "top-right", "label": "Top Right" },
        { "value": "top-left", "label": "Top Left" },
        { "value": "custom", "label": "Custom Position (Advanced)" }
      ],
      "default": "bottom-right"
    },
    {
      "type": "range",
      "id": "bottom_spacing",
      "min": 0,
      "max": 150,
      "step": 5,
      "unit": "px",
      "label": "Distance from bottom",
      "default": 20,
      "info": "Adjust if button conflicts with other elements"
    },
    {
      "type": "range",
      "id": "side_spacing",
      "min": 0,
      "max": 150,
      "step": 5,
      "unit": "px",
      "label": "Distance from side",
      "default": 20,
      "info": "Adjust horizontal spacing"
    },
    {
      "type": "text",
      "id": "custom_position_css",
      "label": "Custom CSS Position",
      "info": "Only used if position is 'Custom'. Example: top: 100px; left: 50%;",
      "placeholder": "top: 100px; right: 20px;"
    },
    {
      "type": "header",
      "content": "Button Appearance"
    },
    {
      "type": "select",
      "id": "button_shape",
      "label": "Button Shape",
      "options": [
        { "value": "circle", "label": "Circle" },
        { "value": "rounded-square", "label": "Rounded Square" },
        { "value": "square", "label": "Square" },
        { "value": "pill", "label": "Pill (with text label)" },
        { "value": "minimal", "label": "Minimal (icon only, no bg)" }
      ],
      "default": "circle"
    },
    {
      "type": "select",
      "id": "button_size",
      "label": "Button Size",
      "options": [
        { "value": "small", "label": "Small (44px)" },
        { "value": "medium", "label": "Medium (56px)" },
        { "value": "large", "label": "Large (64px)" }
      ],
      "default": "medium"
    },
    {
      "type": "select",
      "id": "icon_style",
      "label": "Heart Icon Style",
      "options": [
        { "value": "filled", "label": "Filled Heart" },
        { "value": "outline", "label": "Outline Heart" },
        { "value": "modern", "label": "Modern Heart" },
        { "value": "minimal", "label": "Minimal Heart" },
        { "value": "custom", "label": "Custom Icon (URL)" }
      ],
      "default": "filled"
    },
    {
      "type": "image_picker",
      "id": "custom_icon",
      "label": "Custom Icon Image",
      "info": "Used only if icon style is 'Custom'. SVG or PNG recommended."
    },
    {
      "type": "color",
      "id": "button_background",
      "label": "Button Background Color",
      "default": "#ffffff"
    },
    {
      "type": "color",
      "id": "button_background_hover",
      "label": "Button Background (Hover)",
      "default": "#f5f5f5"
    },
    {
      "type": "color",
      "id": "icon_color",
      "label": "Icon Color",
      "default": "#000000"
    },
    {
      "type": "color",
      "id": "icon_color_active",
      "label": "Icon Color (When Items in Wishlist)",
      "default": "#d23f57"
    },
    {
      "type": "range",
      "id": "button_opacity",
      "min": 50,
      "max": 100,
      "step": 5,
      "unit": "%",
      "label": "Button Opacity",
      "default": 95
    },
    {
      "type": "checkbox",
      "id": "button_shadow",
      "label": "Show button shadow",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "button_backdrop_blur",
      "label": "Backdrop blur effect (glassmorphism)",
      "default": true,
      "info": "Modern frosted glass effect"
    },
    {
      "type": "header",
      "content": "Badge (Item Counter)"
    },
    {
      "type": "checkbox",
      "id": "show_badge",
      "label": "Show item count badge",
      "default": true
    },
    {
      "type": "select",
      "id": "badge_position",
      "label": "Badge Position",
      "options": [
        { "value": "top-right", "label": "Top Right (Default)" },
        { "value": "top-left", "label": "Top Left" },
        { "value": "bottom-right", "label": "Bottom Right" },
        { "value": "bottom-left", "label": "Bottom Left" },
        { "value": "center", "label": "Center (overlay)" }
      ],
      "default": "top-right"
    },
    {
      "type": "color",
      "id": "badge_background",
      "label": "Badge Background Color",
      "default": "#d23f57"
    },
    {
      "type": "color",
      "id": "badge_text_color",
      "label": "Badge Text Color",
      "default": "#ffffff"
    },
    {
      "type": "select",
      "id": "badge_style",
      "label": "Badge Style",
      "options": [
        { "value": "circle", "label": "Circle" },
        { "value": "rounded", "label": "Rounded" },
        { "value": "square", "label": "Square" }
      ],
      "default": "circle"
    },
    {
      "type": "header",
      "content": "Text Label (For Pill Style)"
    },
    {
      "type": "checkbox",
      "id": "show_text_label",
      "label": "Show text label on button",
      "default": false,
      "info": "Only applies if shape is 'Pill'"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Wishlist",
      "info": "Text shown on pill-style button"
    },
    {
      "type": "color",
      "id": "button_text_color",
      "label": "Text Color",
      "default": "#000000"
    },
    {
      "type": "header",
      "content": "Behavior & Interactions"
    },
    {
      "type": "checkbox",
      "id": "auto_open_drawer",
      "label": "Auto-open drawer when item added to wishlist",
      "default": false,
      "info": "Drawer slides in automatically after clicking heart"
    },
    {
      "type": "range",
      "id": "auto_open_delay",
      "min": 0,
      "max": 3000,
      "step": 100,
      "unit": "ms",
      "label": "Auto-open delay (if enabled)",
      "default": 500,
      "info": "Milliseconds to wait before opening drawer"
    },
    {
      "type": "checkbox",
      "id": "show_on_mobile",
      "label": "Show button on mobile devices",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_on_tablet",
      "label": "Show button on tablets",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_on_desktop",
      "label": "Show button on desktop",
      "default": true
    },
    {
      "type": "text",
      "id": "hide_on_pages",
      "label": "Hide on specific pages",
      "placeholder": "/cart, /checkout, /account",
      "info": "Comma-separated list of URL paths"
    },
    {
      "type": "checkbox",
      "id": "hide_when_empty",
      "label": "Hide button when wishlist is empty",
      "default": false
    },
    {
      "type": "select",
      "id": "hover_effect",
      "label": "Hover Animation",
      "options": [
        { "value": "none", "label": "None" },
        { "value": "scale", "label": "Scale (grow)" },
        { "value": "bounce", "label": "Bounce" },
        { "value": "shake", "label": "Shake" },
        { "value": "pulse", "label": "Pulse" },
        { "value": "glow", "label": "Glow" }
      ],
      "default": "scale"
    },
    {
      "type": "select",
      "id": "entrance_animation",
      "label": "Entrance Animation",
      "options": [
        { "value": "none", "label": "None (instant)" },
        { "value": "fade", "label": "Fade In" },
        { "value": "slide-up", "label": "Slide Up" },
        { "value": "slide-in", "label": "Slide In (from side)" },
        { "value": "scale", "label": "Scale In" },
        { "value": "bounce", "label": "Bounce In" }
      ],
      "default": "slide-up"
    },
    {
      "type": "range",
      "id": "entrance_delay",
      "min": 0,
      "max": 3000,
      "step": 100,
      "unit": "ms",
      "label": "Entrance delay",
      "default": 1000,
      "info": "Wait time before button appears on page load"
    },
    {
      "type": "checkbox",
      "id": "pulse_when_updated",
      "label": "Pulse animation when count changes",
      "default": true
    },
    {
      "type": "header",
      "content": "Accessibility"
    },
    {
      "type": "text",
      "id": "aria_label",
      "label": "Screen Reader Label",
      "default": "View wishlist",
      "info": "Announced to screen reader users"
    },
    {
      "type": "checkbox",
      "id": "keyboard_shortcut",
      "label": "Enable keyboard shortcut (Alt+W)",
      "default": true
    }
  ]
}
{% endschema %}
```

---

### 2. Wishlist Drawer

```
Visual Design:

┌────────────────────────────────────┐
│  ❤️ My Wishlist (3)           [X] │ ← Header
├────────────────────────────────────┤
│                                    │
│  ┌───────────────────────────────┐│ ← Scroll container
│  │                               ││
│  │  ┌─────┐                      ││
│  │  │     │  Product Name        ││ ← Product card
│  │  │ IMG │  $99.00              ││
│  │  │     │  [Select Size ▾] [🛒]││
│  │  └─────┘  [❤️ Remove]         ││
│  │                               ││
│  │  ┌─────┐                      ││
│  │  │     │  Product Name 2      ││
│  │  │ IMG │  $49.00              ││
│  │  │     │  [Add to Cart 🛒]    ││
│  │  └─────┘  [❤️ Remove]         ││
│  │                               ││
│  └───────────────────────────────┘│
│                                    │
├────────────────────────────────────┤
│  [Share Wishlist 🔗]              │ ← Footer actions
│  [View Full Page →]                │
└────────────────────────────────────┘
```

**Specifications:**

**Desktop:**
- Width: 420px
- Height: 100vh (full height)
- Position: Fixed right
- Slides in from right (-420px → 0)
- Background: #ffffff
- Shadow: -2px 0 16px rgba(0,0,0,0.1)
- Z-index: 9999

**Mobile:**
- Width: 90vw (max 360px)
- Height: 100vh
- Slides in from right
- Safe area padding

**Sections:**

1. **Header**
   ```
   Height: 64px
   Padding: 16px 20px
   Border-bottom: 1px solid #e5e5e5
   Sticky: Top

   Contents:
   - Heart icon + "My Wishlist (count)"
   - Close button (X icon)
   ```

2. **Content Area**
   ```
   Overflow-y: auto
   Padding: 16px
   Max-height: calc(100vh - 128px) // Header + Footer

   States:
   - Empty: Show empty state message + CTA
   - With items: Scrollable product list
   ```

3. **Footer** (Optional)
   ```
   Height: 64px
   Padding: 12px 20px
   Border-top: 1px solid #e5e5e5
   Sticky: Bottom
   Background: #ffffff

   Actions:
   - Share wishlist button
   - View full page link
   ```

**Product Card in Drawer:**

```
┌─────────────────────────────────────┐
│  ┌────────┐                          │
│  │        │  Product Title           │
│  │  IMG   │  Color: Black            │
│  │ 80x80  │  $99.00                  │
│  │        │                          │
│  └────────┘  ┌──────────┐ ┌────────┐│
│              │Size: M ▾ │ │[🛒 Add]││
│              └──────────┘ └────────┘│
│              [❤️ Remove from wishlist]│
└─────────────────────────────────────┘
```

**Card Specifications:**
- Layout: Horizontal (image left, content right)
- Image: 80×80px (desktop), 64×64px (mobile)
- Gap: 12px
- Border: 1px solid #f0f0f0
- Border-radius: 8px
- Padding: 12px
- Margin-bottom: 12px

**Interaction Elements:**

1. **Size Selector** (if variants exist)
   - Dropdown or button group
   - Shows availability
   - Required before add to cart

2. **Add to Cart Button**
   - Primary style
   - Disabled if size not selected
   - Loading state: Shows spinner
   - Success state: "Added! ✓" (2s)

3. **Remove Button**
   - Text link or icon button
   - Confirmation tooltip (optional)
   - Animates out when clicked

**Empty State:**

```
┌────────────────────────────────────┐
│  ❤️ My Wishlist (0)           [X] │
├────────────────────────────────────┤
│                                    │
│         ┌────────────┐             │
│         │            │             │
│         │  Empty     │             │
│         │  Heart     │             │
│         │  Icon      │             │
│         └────────────┘             │
│                                    │
│    Your wishlist is empty          │
│                                    │
│    Start adding items you love     │
│    by clicking the heart icon      │
│    on any product!                 │
│                                    │
│    ┌──────────────────────┐       │
│    │  Browse Products  →  │       │
│    └──────────────────────┘       │
│                                    │
└────────────────────────────────────┘
```

**Drawer Animations:**

```css
/* Slide in from right */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Slide out to right */
@keyframes slideOutRight {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

/* Overlay fade */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Product card slide in */
@keyframes slideInFromRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Performance Considerations:**

- Lazy load product images
- Virtualize list if >20 items
- Debounce size selector changes
- Batch add-to-cart operations
- Cache drawer state (don't re-render on close/open)

---

### 3. Toast Notifications System

**Purpose**: Provide instant feedback for wishlist actions

```
Notification Styles:

SUCCESS:                    ERROR:
┌─────────────────────┐    ┌─────────────────────┐
│ ✓ Added to wishlist │    │ ⚠️ Failed to add     │
│   [View] [Undo]     │    │   [Retry]           │
└─────────────────────┘    └─────────────────────┘

INFO:                      REMOVED:
┌─────────────────────┐    ┌─────────────────────┐
│ ℹ️ Sign in to sync   │    │ ❤️ Removed           │
│   [Login]           │    │   [Undo]            │
└─────────────────────┘    └─────────────────────┘
```

**Customization Options (App Block Settings):**

```liquid
{% schema %}
{
  "name": "Wishlist Toast Notifications",
  "settings": [
    {
      "type": "header",
      "content": "Display Settings"
    },
    {
      "type": "checkbox",
      "id": "enable_toasts",
      "label": "Enable toast notifications",
      "default": true,
      "info": "Show feedback messages when items are added/removed"
    },
    {
      "type": "select",
      "id": "toast_position",
      "label": "Toast Position",
      "options": [
        { "value": "top-left", "label": "Top Left" },
        { "value": "top-center", "label": "Top Center" },
        { "value": "top-right", "label": "Top Right" },
        { "value": "bottom-left", "label": "Bottom Left" },
        { "value": "bottom-center", "label": "Bottom Center" },
        { "value": "bottom-right", "label": "Bottom Right" },
        { "value": "middle-center", "label": "Middle Center (Modal Style)" }
      ],
      "default": "top-center"
    },
    {
      "type": "range",
      "id": "toast_duration",
      "min": 1000,
      "max": 10000,
      "step": 500,
      "unit": "ms",
      "label": "Toast Duration",
      "default": 3000,
      "info": "How long toast stays visible (milliseconds)"
    },
    {
      "type": "range",
      "id": "toast_offset",
      "min": 0,
      "max": 100,
      "step": 5,
      "unit": "px",
      "label": "Distance from edge",
      "default": 20
    },
    {
      "type": "header",
      "content": "Appearance"
    },
    {
      "type": "select",
      "id": "toast_style",
      "label": "Toast Style",
      "options": [
        { "value": "modern", "label": "Modern (rounded, shadow)" },
        { "value": "minimal", "label": "Minimal (flat, bordered)" },
        { "value": "bold", "label": "Bold (large, colorful)" },
        { "value": "glass", "label": "Glass (glassmorphism)" },
        { "value": "custom", "label": "Custom (match theme)" }
      ],
      "default": "modern"
    },
    {
      "type": "select",
      "id": "toast_animation",
      "label": "Entrance Animation",
      "options": [
        { "value": "slide", "label": "Slide In" },
        { "value": "fade", "label": "Fade In" },
        { "value": "scale", "label": "Scale In" },
        { "value": "bounce", "label": "Bounce In" },
        { "value": "none", "label": "None (instant)" }
      ],
      "default": "slide"
    },
    {
      "type": "color",
      "id": "toast_bg_success",
      "label": "Success Background Color",
      "default": "#10b981"
    },
    {
      "type": "color",
      "id": "toast_bg_error",
      "label": "Error Background Color",
      "default": "#ef4444"
    },
    {
      "type": "color",
      "id": "toast_bg_info",
      "label": "Info Background Color",
      "default": "#3b82f6"
    },
    {
      "type": "color",
      "id": "toast_text_color",
      "label": "Text Color",
      "default": "#ffffff"
    },
    {
      "type": "checkbox",
      "id": "toast_icon",
      "label": "Show icon in toast",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "toast_shadow",
      "label": "Show shadow",
      "default": true
    },
    {
      "type": "range",
      "id": "toast_blur",
      "min": 0,
      "max": 20,
      "step": 1,
      "unit": "px",
      "label": "Backdrop blur amount (glassmorphism)",
      "default": 10,
      "info": "Only applies if style is 'Glass'"
    },
    {
      "type": "header",
      "content": "Action Buttons"
    },
    {
      "type": "checkbox",
      "id": "show_view_button",
      "label": "Show 'View Wishlist' button",
      "default": true,
      "info": "Opens drawer when clicked"
    },
    {
      "type": "checkbox",
      "id": "show_undo_button",
      "label": "Show 'Undo' button",
      "default": true,
      "info": "Allows undoing add/remove action"
    },
    {
      "type": "range",
      "id": "undo_timeout",
      "min": 2000,
      "max": 10000,
      "step": 500,
      "unit": "ms",
      "label": "Undo timeout",
      "default": 5000,
      "info": "How long undo is available"
    },
    {
      "type": "checkbox",
      "id": "toast_dismissable",
      "label": "Allow manual dismiss (X button)",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "toast_click_to_dismiss",
      "label": "Click toast to dismiss",
      "default": true
    },
    {
      "type": "header",
      "content": "Content Customization"
    },
    {
      "type": "text",
      "id": "text_added",
      "label": "Added to Wishlist Text",
      "default": "Added to wishlist"
    },
    {
      "type": "text",
      "id": "text_removed",
      "label": "Removed from Wishlist Text",
      "default": "Removed from wishlist"
    },
    {
      "type": "text",
      "id": "text_error",
      "label": "Error Text",
      "default": "Failed to update wishlist"
    },
    {
      "type": "text",
      "id": "text_view_button",
      "label": "'View' Button Text",
      "default": "View"
    },
    {
      "type": "text",
      "id": "text_undo_button",
      "label": "'Undo' Button Text",
      "default": "Undo"
    },
    {
      "type": "header",
      "content": "Advanced"
    },
    {
      "type": "checkbox",
      "id": "toast_stack",
      "label": "Stack multiple toasts",
      "default": true,
      "info": "Show multiple toasts at once or replace existing"
    },
    {
      "type": "range",
      "id": "toast_max_stack",
      "min": 1,
      "max": 5,
      "step": 1,
      "label": "Maximum stacked toasts",
      "default": 3
    },
    {
      "type": "checkbox",
      "id": "toast_pause_on_hover",
      "label": "Pause auto-dismiss on hover",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "toast_sound",
      "label": "Play sound on notification",
      "default": false,
      "info": "Subtle sound effect"
    }
  ]
}
{% endschema %}
```

**Toast Types & Triggers:**

| Trigger | Type | Default Message | Actions |
|---------|------|----------------|---------|
| Item added | Success | "Added to wishlist" | [View] [Undo] |
| Item removed | Info | "Removed from wishlist" | [Undo] |
| Add to cart from wishlist | Success | "Added to cart" | [View Cart] |
| Sync completed | Success | "Wishlist synced ✓" | - |
| Sync failed | Error | "Sync failed" | [Retry] |
| Wishlist limit reached | Warning | "Wishlist is full (50 items)" | [View] |
| Guest user prompt | Info | "Sign in to sync across devices" | [Login] |

---

### 4. Heart Button (Product Pages/Cards)

**Design from Scratch** ✨

Building a modern, flexible heart button system:

```
States:

INACTIVE:        ACTIVE:          HOVER:          LOADING:
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│        │      │        │      │        │      │        │
│   ♡    │      │   ♥️    │      │   ♥    │      │  ⟳   │
│        │      │        │      │ (scale) │      │(spin) │
└────────┘      └────────┘      └────────┘      └────────┘
 Gray           Red              Red+shadow       Gray
```

**Customization Options:**

```liquid
{% schema %}
{
  "name": "Wishlist Heart Button",
  "settings": [
    {
      "type": "header",
      "content": "Appearance"
    },
    {
      "type": "select",
      "id": "heart_style",
      "label": "Heart Icon Style",
      "options": [
        { "value": "outline", "label": "Outline (modern)" },
        { "value": "filled", "label": "Filled (classic)" },
        { "value": "duo-tone", "label": "Duo-tone (premium)" },
        { "value": "animated", "label": "Animated (particles)" },
        { "value": "custom", "label": "Custom Icon" }
      ],
      "default": "outline"
    },
    {
      "type": "image_picker",
      "id": "custom_heart_icon",
      "label": "Custom Heart Icon (SVG recommended)"
    },
    {
      "type": "select",
      "id": "button_style",
      "label": "Button Container Style",
      "options": [
        { "value": "icon-only", "label": "Icon Only (transparent)" },
        { "value": "circle-bg", "label": "Circle Background" },
        { "value": "square-bg", "label": "Square Background" },
        { "value": "rounded-bg", "label": "Rounded Background" },
        { "value": "outline", "label": "Outlined Border" }
      ],
      "default": "icon-only"
    },
    {
      "type": "select",
      "id": "button_size",
      "label": "Button Size",
      "options": [
        { "value": "small", "label": "Small (2rem / 32px)" },
        { "value": "medium", "label": "Medium (2.5rem / 40px)" },
        { "value": "large", "label": "Large (3.5rem / 56px)" }
      ],
      "default": "medium"
    },
    {
      "type": "color",
      "id": "heart_inactive_color",
      "label": "Heart Color (Inactive)",
      "default": "#6b7280"
    },
    {
      "type": "color",
      "id": "heart_active_color",
      "label": "Heart Color (Active)",
      "default": "#d23f57"
    },
    {
      "type": "color",
      "id": "button_bg_color",
      "label": "Button Background (if enabled)",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "button_opacity",
      "min": 0,
      "max": 100,
      "step": 5,
      "unit": "%",
      "label": "Button Background Opacity",
      "default": 90
    },
    {
      "type": "header",
      "content": "Position"
    },
    {
      "type": "select",
      "id": "heart_position",
      "label": "Position on Product Cards",
      "options": [
        { "value": "top-right", "label": "Top Right (Default)" },
        { "value": "top-left", "label": "Top Left" },
        { "value": "bottom-right", "label": "Bottom Right" },
        { "value": "bottom-left", "label": "Bottom Left" },
        { "value": "center-overlay", "label": "Center (on hover)" }
      ],
      "default": "top-right"
    },
    {
      "type": "range",
      "id": "heart_offset_vertical",
      "min": 0,
      "max": 50,
      "step": 2,
      "unit": "px",
      "label": "Vertical Offset",
      "default": 8
    },
    {
      "type": "range",
      "id": "heart_offset_horizontal",
      "min": 0,
      "max": 50,
      "step": 2,
      "unit": "px",
      "label": "Horizontal Offset",
      "default": 8
    },
    {
      "type": "header",
      "content": "Animations"
    },
    {
      "type": "select",
      "id": "click_animation",
      "label": "Click Animation",
      "options": [
        { "value": "scale", "label": "Scale (pop)" },
        { "value": "bounce", "label": "Bounce" },
        { "value": "heartbeat", "label": "Heartbeat" },
        { "value": "particles", "label": "Particles (❤️ explosion)" },
        { "value": "ripple", "label": "Ripple Effect" },
        { "value": "none", "label": "None" }
      ],
      "default": "scale"
    },
    {
      "type": "select",
      "id": "hover_animation",
      "label": "Hover Animation",
      "options": [
        { "value": "scale", "label": "Scale (grow)" },
        { "value": "bounce", "label": "Bounce" },
        { "value": "shake", "label": "Shake" },
        { "value": "pulse", "label": "Pulse" },
        { "value": "none", "label": "None" }
      ],
      "default": "scale"
    },
    {
      "type": "checkbox",
      "id": "show_loading_state",
      "label": "Show loading spinner during save",
      "default": true
    },
    {
      "type": "header",
      "content": "Behavior"
    },
    {
      "type": "checkbox",
      "id": "show_on_hover_only",
      "label": "Show button only on product card hover",
      "default": false,
      "info": "Keeps UI clean, reveals on hover"
    },
    {
      "type": "checkbox",
      "id": "prevent_double_click",
      "label": "Prevent rapid clicking (debounce)",
      "default": true,
      "info": "Prevents accidental double-clicks"
    },
    {
      "type": "range",
      "id": "debounce_delay",
      "min": 100,
      "max": 1000,
      "step": 50,
      "unit": "ms",
      "label": "Debounce delay",
      "default": 300
    }
  ]
}
{% endschema %}
```

**What We're Learning From (Not Copying):**

From current implementation:
- ✅ Color variant tracking (keep this logic)
- ✅ Instant visual feedback (keep)
- ✅ Cross-page sync (keep)
- ❌ Complex rendering functions (simplify)
- ❌ Heavy localStorage payload (optimize)
- ❌ Mixed responsibilities (separate concerns)

---

### 4. Dedicated Wishlist Page

Keep your existing `/pages/wishlist` page ✅

**Enhancements:**

1. **Add "Open Drawer" Button** (Mobile)
   ```
   [≡ Quick View Drawer]
   ← Button at top, opens drawer instead of scrolling
   ```

2. **Breadcrumb Navigation**
   ```
   Home > My Wishlist
   ```

3. **Header Actions Row**
   ```
   ┌─────────────────────────────────────┐
   │  My Wishlist (12 items)             │
   │  [Sort ▾] [Grid ⊞] [Share 🔗]      │
   └─────────────────────────────────────┘
   ```

---

## User Flows

### Flow 1: Add Product to Wishlist

```
User on Product Page
        │
        ▼
Clicks Heart Button on Product
        │
        ▼
Heart fills (red) + Toast appears
        │
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
Toast: "Added to wishlist"     Floating button badge
       [View] [Undo]            updates: 0 → 1
        │                             │
        ├─────────────────────────────┘
        │
User clicks [View] on toast
        │
        ▼
Drawer slides in from right
        │
        ▼
Shows product just added (highlighted)
        │
User can:
├─ Add to cart
├─ Continue browsing (close drawer)
├─ Remove from wishlist
└─ Share wishlist
```

**Timing:**
- Heart animation: 150ms
- Toast appears: 200ms after heart
- Toast duration: 3s (auto-dismiss)
- Drawer animation: 300ms

---

### Flow 2: Quick Add to Cart from Drawer

```
User clicks Floating Button
        │
        ▼
Drawer slides in (300ms)
        │
        ▼
Shows wishlist items
        │
        ▼
User finds product
        │
        ├─────────────────────────────┐
        │                             │
   Has variants?                  No variants
        │                             │
        ▼                             ▼
Shows size selector            Shows "Add to Cart"
        │                             │
User selects size                     │
        │                             │
        └─────────────────────────────┤
                                      │
                                      ▼
                          User clicks "Add to Cart"
                                      │
                                      ▼
                          Button shows loading (spinner)
                                      │
                                      ▼
                          POST to /cart/add.js
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                 Success                              Error
                    │                                   │
                    ▼                                   ▼
        Button: "Added! ✓" (2s)              Button: "Try Again"
                    │                         + Error toast
                    ▼
        Item removed from wishlist
                    │
                    ▼
        Cart drawer notification badge updates
                    │
                    ▼
        Drawer shows next product
        (or empty state if last item)
```

**Timing:**
- Add to cart request: <500ms
- Success animation: 2s
- Remove from wishlist: Immediate
- Toast duration: 3s

---

### Flow 3: Cross-Device Sync

```
Device 1: Desktop
        │
User logs in
        │
        ▼
Fetch wishlist from server API
        │
        ▼
Merge with localStorage
        │
        ▼
Heart icons sync (all red hearts appear)
        │
User adds Product A
        │
        ▼
Saved to localStorage + Server (debounced 2s)
        │
        ▼
Floating button badge: 5 → 6
        │

Device 2: Mobile (30 seconds later)
        │
User opens app (already logged in)
        │
        ▼
Auto-fetch from server
        │
        ▼
Product A appears in wishlist!
        │
User clicks floating button
        │
        ▼
Sees Product A in drawer
```

**Sync Status Indicator:**

```
┌───────────────────────────────┐
│  ✓ Synced                     │ ← Shown in drawer header
└───────────────────────────────┘
   Green checkmark

If syncing:
┌───────────────────────────────┐
│  ⟳ Syncing...                 │
└───────────────────────────────┘
   Spinner icon

If error:
┌───────────────────────────────┐
│  ⚠️ Sync failed - Retry        │
└───────────────────────────────┘
   Clickable to retry
```

---

## Mobile-Specific Considerations

### Thumb Zone Optimization

```
┌─────────────────────────────┐
│  Header                     │
│                             │
│                             │
│  Content                    │
│                             │
│                             │ ← Hard to reach
│                             │
│                             │
│                             │
│                    ┌──────┐ │
│                    │ ❤️ 5  │ │ ← Easy to reach
│                    └──────┘ │   (thumb zone)
└─────────────────────────────┘
```

**Positioning Rules:**
- Default: Bottom-right (16px from edges)
- Clear of iOS home indicator (safe-area-inset-bottom)
- Above any bottom navigation
- At least 48px × 48px tap target

### Drawer Behavior on Mobile

1. **Swipe to Close**
   - Swipe right on drawer to close
   - Swipe threshold: 30% of width
   - Velocity detection: >0.5px/ms

2. **Backdrop Tap**
   - Tap dimmed area to close
   - Prevent scroll on body when open

3. **Back Button**
   - Android back button closes drawer
   - Use history.pushState() for navigation

4. **Scroll Lock**
   - Lock body scroll when drawer open
   - Allow drawer content to scroll

---

## Accessibility (WCAG AA Compliance)

### Floating Button

```html
<button
  type="button"
  class="wishlist-floating-button"
  aria-label="View wishlist, 5 items"
  aria-expanded="false"
>
  <svg aria-hidden="true" focusable="false">
    <!-- Heart icon -->
  </svg>
  <span class="wishlist-count" aria-live="polite">5</span>
</button>
```

**Requirements:**
- ✅ Minimum 44×44px tap target
- ✅ Focus indicator (2px outline)
- ✅ Keyboard accessible (Tab, Enter/Space)
- ✅ Screen reader announces count
- ✅ Color contrast ≥4.5:1 (text)
- ✅ Icon + text label (not icon alone)

### Drawer

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="wishlist-drawer-title"
  class="wishlist-drawer"
>
  <div class="drawer-header">
    <h2 id="wishlist-drawer-title">My Wishlist (5 items)</h2>
    <button
      type="button"
      aria-label="Close wishlist drawer"
      class="drawer-close"
    >
      ×
    </button>
  </div>

  <div role="region" aria-label="Wishlist items">
    <!-- Product cards -->
  </div>
</div>

<div
  class="drawer-backdrop"
  role="presentation"
  aria-hidden="true"
></div>
```

**Requirements:**
- ✅ Focus trap (tab cycles within drawer)
- ✅ Focus management (move to drawer on open)
- ✅ ESC key closes drawer
- ✅ Screen reader announces state changes
- ✅ Semantic HTML (dialog, region, headings)

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next element |
| Shift+Tab | Move to previous element |
| Enter/Space | Activate button |
| Escape | Close drawer |
| Arrow keys | Navigate within size selector |

---

## Customization Options for Merchants

### App Block Settings (Theme Editor)

**Floating Button:**
```
Appearance:
├─ Position (bottom-right, bottom-left, etc.)
├─ Button style (circle, square, rounded)
├─ Button size (small, medium, large)
├─ Background color
├─ Icon color
├─ Badge color
├─ Show/hide badge
└─ Show on mobile/desktop

Behavior:
├─ Hide on certain pages (checkout, etc.)
├─ Auto-open drawer after add
└─ Floating button offset (adjust if conflicts)

Animation:
├─ Entrance animation (slide, fade, none)
├─ Hover effect (scale, bounce, none)
└─ Badge animation (pulse, none)
```

**Drawer:**
```
Appearance:
├─ Drawer width (mobile/desktop)
├─ Header background color
├─ Card style (border, shadow, minimal)
├─ Button style (matches theme)
└─ Empty state message (custom text)

Features:
├─ Show share button
├─ Show "View full page" link
├─ Enable quick-add to cart
├─ Show product images
├─ Show price
├─ Show color/size options
└─ Maximum items to display

Behavior:
├─ Auto-close after add to cart
├─ Show success toast
└─ Swipe to close (mobile)
```

**Heart Button:**
```
(Keep your current settings)
├─ Heart style (outline, filled, custom icon)
├─ Active color
├─ Position (top-right, top-left, inline)
└─ Animation (none, pulse, bounce)
```

---

## Design Tokens (Shared Styles)

```css
/* Colors */
--wishlist-accent: #d23f57;
--wishlist-success: #10b981;
--wishlist-error: #ef4444;
--wishlist-text: rgb(18, 18, 18);
--wishlist-text-muted: rgba(18, 18, 18, 0.7);
--wishlist-border: rgba(18, 18, 18, 0.15);
--wishlist-bg: #ffffff;
--wishlist-overlay: rgba(0, 0, 0, 0.4);

/* Spacing */
--wishlist-spacing-xs: 4px;
--wishlist-spacing-sm: 8px;
--wishlist-spacing-md: 16px;
--wishlist-spacing-lg: 24px;
--wishlist-spacing-xl: 32px;

/* Typography */
--wishlist-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--wishlist-font-size-sm: 0.875rem;
--wishlist-font-size-base: 1rem;
--wishlist-font-size-lg: 1.125rem;
--wishlist-font-weight-normal: 400;
--wishlist-font-weight-medium: 500;
--wishlist-font-weight-bold: 600;

/* Shadows */
--wishlist-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
--wishlist-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
--wishlist-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);

/* Transitions */
--wishlist-transition-fast: 150ms ease;
--wishlist-transition-base: 300ms ease;
--wishlist-transition-slow: 500ms ease;

/* Z-index */
--wishlist-z-floating: 9998;
--wishlist-z-drawer: 9999;
--wishlist-z-overlay: 9997;
--wishlist-z-toast: 10000;

/* Border radius */
--wishlist-radius-sm: 4px;
--wishlist-radius-md: 8px;
--wishlist-radius-lg: 12px;
--wishlist-radius-full: 999px;
```

---

## Implementation Priority

### Phase 1: MVP (Week 1-2)
- ✅ Floating button (basic style)
- ✅ Drawer (basic layout)
- ✅ Heart buttons (keep existing)
- ✅ Add to wishlist (localStorage)
- ✅ Remove from wishlist
- ✅ Item count badge

### Phase 2: Enhanced UX (Week 3-4)
- ✅ Toast notifications
- ✅ Quick-add to cart from drawer
- ✅ Size/variant selection
- ✅ Empty state design
- ✅ Loading states
- ✅ Success animations

### Phase 3: Customization (Week 5)
- ✅ App block settings
- ✅ Position options
- ✅ Color customization
- ✅ Style variants (circle, square)
- ✅ Show/hide options

### Phase 4: Advanced Features (Week 6+)
- ✅ Share wishlist
- ✅ Cross-device sync
- ✅ Swipe gestures (mobile)
- ✅ Keyboard shortcuts
- ✅ Accessibility enhancements

---

## Performance Budget

### Floating Button + Drawer

**JavaScript:**
- Floating button: <5 KB (gzipped)
- Drawer logic: <15 KB (gzipped)
- Total JS: <20 KB (gzipped)

**CSS:**
- Floating button: <2 KB (gzipped)
- Drawer styles: <8 KB (gzipped)
- Total CSS: <10 KB (gzipped)

**Images:**
- Icons: SVG (inline, ~0.5 KB each)
- Product images: Lazy loaded

**Total Page Weight Impact:**
- <30 KB (JS + CSS)
- Lighthouse performance impact: <5 points

**Runtime Performance:**
- Drawer open: <300ms
- Add to cart: <500ms
- Heart toggle: <50ms

---

## Testing Checklist

### Visual Testing

- ✅ Floating button visible on all devices
- ✅ Drawer slides smoothly
- ✅ No layout shifts (CLS)
- ✅ Works with different themes
- ✅ Respects safe areas (iOS notch)
- ✅ No z-index conflicts
- ✅ Buttons not overlapping other UI

### Functional Testing

- ✅ Add to wishlist works
- ✅ Remove from wishlist works
- ✅ Counter badge updates
- ✅ Drawer opens/closes
- ✅ Quick-add to cart works
- ✅ Variant selection works
- ✅ Empty state displays correctly
- ✅ Toast notifications appear
- ✅ Cross-device sync works

### Accessibility Testing

- ✅ Keyboard navigation works
- ✅ Screen reader announces correctly
- ✅ Focus trap in drawer works
- ✅ Color contrast passes WCAG AA
- ✅ Tap targets ≥44px
- ✅ ESC closes drawer

### Performance Testing

- ✅ First Contentful Paint <2s
- ✅ Time to Interactive <3.5s
- ✅ No render-blocking scripts
- ✅ Smooth animations (60fps)
- ✅ Drawer scroll smooth on mobile

---

## Comparison with Current Implementation

| Feature | Current (Cart Drawer) | Recommended (Floating + Drawer) |
|---------|----------------------|--------------------------------|
| **Discovery** | Low (hidden in cart) | High (always visible) |
| **Access** | 2 clicks (cart → tab) | 1 click (floating button) |
| **Mobile UX** | Good | Excellent (thumb-friendly) |
| **Cart Conflict** | Yes (shares drawer) | No (separate drawer) |
| **Flexibility** | Limited (tied to cart) | High (customizable position) |
| **Visual Clarity** | Mixed (cart + wishlist) | Clear (dedicated purpose) |
| **Implementation** | Simpler (reuse cart) | More code (new drawer) |
| **Industry Standard** | Uncommon | Very common (top apps) |

---

## Final Recommendation

### Go with: **Floating Button + Dedicated Drawer** 🌟

**Why:**
1. ✅ Better UX (always accessible, clear purpose)
2. ✅ Industry standard (used by top apps)
3. ✅ More flexible (position, style, behavior)
4. ✅ Easier to discover (visible button)
5. ✅ Works universally (any theme, any cart type)
6. ✅ Better mobile experience (thumb zone)
7. ✅ No cart drawer dependency/conflicts
8. ✅ Merchant customization options

**Compromise Option:**

If you want to keep some cart integration:

```
Main UI: Floating button + Drawer (primary)
Secondary: Mini wishlist count in header (optional)
Bonus: "Add to wishlist" in cart drawer (small link)
```

This gives merchants flexibility to enable/disable each component.

---

## Next Steps

1. **Review this design** - Confirm approach
2. **Create wireframes** - Visual mockups (if needed)
3. **Build prototype** - HTML/CSS/JS proof-of-concept
4. **User test** - Get feedback from 5-10 people
5. **Iterate** - Refine based on feedback
6. **Implement in app** - Build production version

---

**Questions to decide:**

1. ✅ Floating button position: Bottom-right or bottom-left default?
2. ✅ Drawer width: 420px or wider (desktop)?
3. ✅ Auto-open drawer after adding to wishlist?
4. ✅ Show toast notifications or rely on visual feedback only?
5. ✅ Include share functionality in MVP or later?

Let me know your thoughts and we can refine further!
