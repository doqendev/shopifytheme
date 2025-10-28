# Wishlist Feature - UI/UX Documentation

**Last Updated:** 2025-10-28
**Version:** 1.0
**Author:** Claude Code Analysis

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Component Anatomy](#2-component-anatomy)
3. [User Experience Flows](#3-user-experience-flows)
4. [Interaction Patterns](#4-interaction-patterns)
5. [Responsive Behavior](#5-responsive-behavior)
6. [Accessibility Features](#6-accessibility-features)
7. [Visual Design Details](#7-visual-design-details)
8. [Performance Considerations](#8-performance-considerations)
9. [Edge Cases & Error States](#9-edge-cases--error-states)
10. [UX Strengths](#10-ux-strengths)
11. [UX Weaknesses & Opportunities](#11-ux-weaknesses--opportunities)
12. [Recommendations Summary](#12-recommendations-summary)

---

## 1. Design System Overview

### Color Palette

```css
Primary Colors:
├─ Wishlist Accent: #d23f57 (Active state red)
├─ Active State (Mobile): #dc2e2e (Filled heart)
├─ Inactive State: grey (Outline heart)
└─ Foreground: rgb(var(--color-foreground, 18, 18, 18))

Background Colors:
├─ Primary: rgb(var(--color-background, 255, 255, 255))
├─ Placeholder: rgba(18, 18, 18, 0.08)
└─ Border: rgba(18, 18, 18, 0.15)

Text Colors:
├─ Primary: rgb(var(--color-foreground))
├─ Secondary: rgba(18, 18, 18, 0.7)
└─ Tertiary: rgba(18, 18, 18, 0.6)
```

### Typography

```
Wishlist Page Title:
├─ Desktop: 20px / 600 weight / 18px line-height / 0.56px letter-spacing
└─ Mobile: 1.5rem / 500 weight / 0 letter-spacing

Product Card Title:
├─ Font: "Figtree", Arial, Helvetica, sans-serif
├─ Size: 13px (0.8125rem in drawer)
├─ Weight: 500 (400 in drawer)
├─ Line-height: 16px (1.3 in drawer)
├─ Behavior: Truncates with ellipsis
└─ No underline decoration

Tab Labels:
├─ Size: 0.875rem (0.75rem mobile)
├─ Weight: 600
├─ Transform: uppercase
└─ Letter-spacing: 0.05em

Price Display:
├─ Size: 0.875rem
├─ Weight: 600
└─ Position: price--end
```

### Spacing System

```
Component Padding:
├─ Cart Drawer Tabs: margin-top 0.75rem, gap 0.75rem
├─ Drawer Panels: margin-top 1.5rem (5% mobile)
├─ Wishlist Grid Gap: 1rem (0.6rem on main page)
├─ Product Card Gap: 1rem
└─ Section Padding: 36px default (adjustable)

Button Spacing:
├─ Tab Buttons: 0.5rem vertical, 0.75rem horizontal
├─ Size Options: 0.75rem vertical, 1rem horizontal
└─ Quick Add: Gap 0.5rem between size buttons

Empty State:
├─ Desktop: padding 4rem vertical, 2rem horizontal
└─ Mobile: padding 2rem vertical, 0.5rem horizontal
```

### Border Radius

```
├─ Wishlist Heart Button: 999px (full circle)
├─ Tab Buttons: 0 (square)
├─ Media/Images: var(--media-radius, 0.6rem)
└─ Size Buttons: 999px (pill shape)
```

---

## 2. Component Anatomy

### 2.1 Heart Button (Wishlist Toggle)

**Visual States:**

```
INACTIVE STATE (Default)
┌─────────────────────┐
│    ┌─────────┐      │
│    │   ♡     │      │  • Outline heart
│    └─────────┘      │  • Color: grey
└─────────────────────┘  • Stroke-width: 1
                          • Background: transparent

ACTIVE STATE (In Wishlist)
┌─────────────────────┐
│    ┌─────────────┐  │
│    │   ♥️ (red)   │  │  • Filled heart
│    └─────────────┘  │  • Color: #d23f57 (desktop) / #dc2e2e (mobile)
└─────────────────────┘  • Fill: currentColor
                          • aria-pressed="true"

HOVER STATE
┌─────────────────────┐
│    ┌─────────────┐  │
│    │   ♡ / ♥️     │  │  • No transform
│    └─────────────┘  │  • No box-shadow
└─────────────────────┘  • Transition: 0.15s ease
```

**Size Variations:**

| Location | Width | Height | Stroke Width | Notes |
|----------|-------|--------|--------------|-------|
| Collection Cards | 3.5rem | 3.5rem | 1 | Position: absolute top-right |
| Product Page (Desktop) | 2.25rem | 2.25rem | 1.6 | Static positioning |
| Mobile Product | 3rem | 3rem | 1 | Top: 1rem right: 0.3rem |
| Sticky Bar (Mobile) | 1.75rem | 1.75rem | 1.6 | Absolute positioning |

**Positioning:**
```css
Default Card Position:
├─ position: absolute
├─ top: 0.5rem (1rem mobile)
├─ right: 0.3rem
└─ z-index: 1

Product Page Position:
├─ position: static
├─ display: inline-flex
└─ Within title wrapper
```

**File References:**
- Component: `snippets/wishlist-heart.liquid`
- Styles: `wishlist.css:1-78`
- Logic: `wishlist.js:729-742, 752-800`

### 2.2 Cart Drawer Tabs

**Layout:**

```
┌──────────────────────────────────────────────┐
│  ┌───────────────┐  ┌───────────────┐       │
│  │  Cart (2)     │  │ Wishlist (5)  │       │
│  │   ACTIVE      │  │   INACTIVE    │       │
│  └───────────────┘  └───────────────┘       │
└──────────────────────────────────────────────┘
     ▲ Black bg          ▲ Transparent bg
       White text          Grey text
       Full border         Border outline
```

**Tab States:**

```css
INACTIVE TAB:
├─ background: transparent
├─ border: 1px solid rgba(18,18,18,0.15)
├─ color: rgba(18,18,18,0.7)
├─ cursor: pointer
└─ aria-selected: false

ACTIVE TAB:
├─ background: rgb(18,18,18)
├─ color: rgb(255,255,255)
├─ border-color: rgb(18,18,18)
└─ aria-selected: true

FOCUS STATE:
├─ outline: 2px solid currentColor
└─ outline-offset: 2px
```

**Interaction Behavior:**
- Click switches between Cart/Wishlist panels
- Count updates dynamically in parentheses
- Smooth transition: 0.15s ease
- Label format: `{Base Label} ({Count})`

**File References:**
- Styles: `wishlist.css:194-255, 408-469`
- Logic: `wishlist.js:860-887`

### 2.3 Wishlist Grid Layout

**Desktop Grid (≥750px):**
```
┌────┬────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │  6-column grid
├────┼────┼────┼────┼────┼────┤
│ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │  Gap: 1rem (0.6rem on page)
└────┴────┴────┴────┴────┴────┘
```

**Mobile Grid (<750px):**
```
┌──────────┬──────────┐
│    1     │    2     │  2-column grid
├──────────┼──────────┤
│    3     │    4     │  Gap: 1rem (0.6rem on page)
└──────────┴──────────┘
```

**Drawer Grid (Cart Drawer Wishlist Tab):**
```
┌────┬────┬────┐
│ 1  │ 2  │ 3  │  3-column grid (all devices)
├────┼────┼────┤
│ 4  │ 5  │ 6  │  Gap: 1rem
└────┴────┴────┘
     Scrollable container with custom scrollbar
```

**File References:**
- Page Grid: `sections/wishlist-page.liquid:47-83`
- Drawer Grid: `wishlist.css:306-361, 521-576`

### 2.4 Wishlist Product Card

**Card Structure:**

```
┌─────────────────────────────────────┐
│  ♥️ [Heart Button - Top Right]       │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      Product Image          │   │
│  │    (aspect-ratio: 2/3)      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Product Title (truncated)          │
│  $99.00                             │
│                                     │
│  ⚫ ⚫ ⚫ +2  [Color Swatches + Count] │
│                                     │
│  [+ Quick Add Button] (if has sizes)│
└─────────────────────────────────────┘
```

**Image Specifications:**
```css
├─ aspect-ratio: 2 / 3 (portrait)
├─ object-fit: cover
├─ width: 100%
├─ height: 100%
├─ loading: lazy
└─ Fallback: Grey placeholder (rgba(18,18,18,0.08))
```

**Card Dimensions:**
- Fluid width based on grid columns
- Height: 100% (fills grid cell)
- Image maintains 2:3 ratio
- Content area: flexible height

**File References:**
- Rendering: `wishlist.js:1085-1125, 1484-1546`
- Styles: `wishlist.css:313-356, 528-576`

### 2.5 Quick Add Component

**Closed State:**
```
┌─────────────────────────────┐
│  ⚫ ⚫ ⚫   [+]                │  + button visible
└─────────────────────────────┘
```

**Open State:**
```
┌─────────────────────────────────────────┐
│         Select a size              [×]  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │  S  │ │  M  │ │  L  │ │ XL  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────────────┘
     Available  Available  Available  Sold Out
     (clickable)(clickable)(clickable)(disabled)
```

**Size Button States:**

```css
DEFAULT:
├─ background: transparent
├─ border: 1px solid rgba(18,18,18,0.2)
├─ color: rgb(18,18,18)
└─ cursor: pointer

HOVER/FOCUS:
├─ background: rgb(18,18,18)
├─ color: rgb(255,255,255)
├─ border-color: rgb(18,18,18)
└─ outline: none (on focus-visible)

SOLD OUT:
├─ opacity: reduced (implicit)
├─ cursor: not-allowed
├─ disabled: true
└─ class: 'sold-out'

HIDDEN (no matching variant):
└─ display: none
```

**Interaction Flow:**
1. Click "+" → Overlay slides up
2. Click size → Adds to cart
3. Item removed from wishlist
4. Drawer switches to cart tab
5. Click outside or ESC → Overlay closes

**File References:**
- Markup: `wishlist.js:939-976, 1382-1423`
- Styles: `wishlist.css:596-677`
- Handlers: `wishlist.js:1697-1747`

### 2.6 Color Swatches

**Swatch Display:**
```
┌─────────────────────────────────┐
│  ⚫ ⚪ 🔵 +2                      │
│  │  │  │  └─ Overflow count     │
│  │  │  └──── Third swatch       │
│  │  └─────── Second swatch      │
│  └────────── Active swatch      │
└─────────────────────────────────┘
```

**Swatch Specifications:**
```css
Individual Swatch:
├─ Display: Limited to 3 visible
├─ Background: --swatch--background: url(image)
├─ Active Class: .active (first by default)
├─ Unavailable: .swatch--unavailable
└─ data-color: Normalized color value

Overflow Badge:
├─ Text: "+{count}"
├─ Class: .additional-swatch-count
└─ Hidden: On wishlist grid (display: none)
```

**Behavior:**
- Only matching color shown on wishlist (filtered by colorKey)
- Active swatch marked with `.active` class
- Unavailable swatches shown but marked
- Overflow count hidden in wishlist view

**File References:**
- Normalization: `wishlist.js:94-134`
- Rendering: `wishlist.js:1252-1295`

---

## 3. User Experience Flows

### 3.1 Adding to Wishlist Journey

**Entry Points:**
1. Collection/Category pages (product cards)
2. Product detail page (desktop/mobile)
3. Search results
4. Quick view modals
5. Sticky add-to-cart bar (mobile)

**User Flow:**

```
START: User browsing products
        │
        ▼
   Sees heart icon (grey outline)
        │
        ▼
   Clicks heart
        │
        ├─────────────────────────┐
        ▼                         ▼
   No color option          Has color option
        │                         │
        ▼                         ▼
   Add with handle key      Detect selected color
                                 │
                                 ▼
                            Add with handle::colorKey
                                 │
        ┌────────────────────────┘
        │
        ▼
   Heart fills with red (instant feedback)
        │
        ▼
   Item saved to localStorage
        │
        ▼
   All hearts across site sync
        │
        ▼
   Cart drawer count updates
        │
        ▼
END: Visual confirmation complete
```

**Feedback Mechanisms:**
- ✅ Instant visual feedback (heart fills red)
- ✅ State persists across page navigation
- ✅ Counter updates in cart drawer tab
- ✅ No loading spinner needed (localStorage is instant)
- ✅ All instances of same product sync immediately

**Error States:**
- No explicit error handling (localStorage failures silent)
- Console warnings for debugging

**File References:**
- Handler: `wishlist.js:729-742`
- Add Logic: `wishlist.js:485-506`
- Save: `wishlist.js:452-461`

### 3.2 Viewing Wishlist Journey

**Entry Points:**
1. Cart drawer → Wishlist tab
2. Direct URL: `/pages/wishlist`
3. Navigation menu (if linked)

**Drawer View Flow:**

```
START: User clicks cart icon
        │
        ▼
   Drawer opens to Cart tab
        │
        ▼
   User sees "Wishlist (5)" tab
        │
        ▼
   Clicks Wishlist tab
        │
        ▼
   Tab switches (black background)
        │
        ▼
   Cart content hidden
   Footer/checkout hidden
        │
        ▼
   Wishlist grid renders
   (3-column layout)
        │
        ├──────────────────┐
        │                  │
   Has items?          No items
        │                  │
        ▼                  ▼
   Show products      Show empty state
   Grid visible       + recommendations
        │
        ▼
   Scrollable container
   (custom scrollbar)
        │
        ▼
END: User browses wishlist
```

**Page View Flow:**

```
START: User visits /pages/wishlist
        │
        ▼
   Page loads with section
        │
        ▼
   "Favoritos" heading displays
        │
        ├──────────────────┐
        │                  │
   Has items?          No items
        │                  │
        ▼                  ▼
   6-col desktop       Empty state message
   2-col mobile        "Continue shopping" button
        │                  │
        ▼                  ▼
   All products       Click → All products
   rendered
        │
        ▼
END: User browses or shops
```

**Empty State Experience:**

```
┌───────────────────────────────────────┐
│                                       │
│         Your wishlist is empty.       │
│                                       │
│       [Continue shopping]             │
│                                       │
│  ───────────────────────────────────  │
│                                       │
│       You might also like:            │
│                                       │
│  ┌────┐  ┌────┐  ┌────┐             │
│  │ 1  │  │ 2  │  │ 3  │             │
│  └────┘  └────┘  └────┘             │
│  ┌────┐  ┌────┐  ┌────┐             │
│  │ 4  │  │ 5  │  │ 6  │             │
│  └────┘  └────┘  └────┘             │
│                                       │
└───────────────────────────────────────┘
   (Scrollable recommendations)
```

**File References:**
- Tab Switch: `wishlist.js:860-887`
- Render: `wishlist.js:1560-1608`
- Empty State: `wishlist.css:769-923`

### 3.3 Adding to Cart from Wishlist

**Scenario A: Product WITHOUT Size Options**

```
START: User in wishlist view
        │
        ▼
   Sees product card
   (no "+" button visible)
        │
        ▼
   Clicks product title/image
        │
        ▼
   Navigates to product page
        │
        ▼
END: User adds from PDP
```

**Scenario B: Product WITH Size Options**

```
START: User in wishlist view
        │
        ▼
   Sees product card with "+" button
        │
        ▼
   Clicks "+" button
        │
        ▼
   Size picker overlay slides up
        │
        ▼
   ┌─────────────────────────────┐
   │  Select a size          [×] │
   │  [S]  [M]  [L]  [XL-sold]   │
   └─────────────────────────────┘
        │
        ▼
   User selects available size
        │
        ▼
   Button disabled (loading state)
        │
        ▼
   POST to /cart/add
        │
        ├───────────────────┐
        ▼                   ▼
   Success            Error (rare)
        │                   │
        ▼                   │
   Remove from wishlist    │
        │                   │
        ▼                   │
   Refresh cart drawer     │
        │                   │
        ▼                   │
   Switch to Cart tab      │
        │                   │
        ▼                   ▼
   Show in cart       Console error
        │              Button re-enabled
        ▼
END: Item in cart
```

**Size Picker Interactions:**

| Action | Result |
|--------|--------|
| Click "+" | Opens size picker overlay |
| Click size button | Adds to cart, closes overlay |
| Click outside card | Closes overlay |
| Press ESC key | Closes overlay |
| Click heart while open | Closes overlay, removes item |
| Swatch click while open | Updates available sizes |

**File References:**
- Plus Handler: `wishlist.js:1697-1732`
- Size Handler: `wishlist.js:1734-1747`
- Add to Cart: `wishlist.js:1666-1695`

### 3.4 Removing from Wishlist

**Method 1: Via Heart Button**

```
START: Item in wishlist (heart filled red)
        │
        ▼
   User clicks heart icon
        │
        ▼
   Heart instantly unfills (grey outline)
        │
        ▼
   Item removed from localStorage
        │
        ▼
   Wishlist re-renders
   (item disappears)
        │
        ▼
   Cart drawer count updates
   "Wishlist (5)" → "Wishlist (4)"
        │
        ▼
   All hearts across site sync
        │
        ▼
END: Item removed, visual confirmation
```

**Method 2: Via Quick Add**

```
START: Item in wishlist
        │
        ▼
   User adds to cart (via size picker)
        │
        ▼
   Item automatically removed from wishlist
        │
        ▼
   Appears in cart instead
        │
        ▼
END: Item moved from wishlist to cart
```

**File References:**
- Remove Logic: `wishlist.js:508-517`
- Heart Handler: `wishlist.js:729-742`

---

## 4. Interaction Patterns

### 4.1 Click Behaviors

**Heart Button:**
```
State: INACTIVE → ACTIVE (Add)
├─ Click target: 3.5rem × 3.5rem circle
├─ Feedback: Instant color change (grey → red)
├─ Transition: fill 0.15s ease
└─ No loading state needed

State: ACTIVE → INACTIVE (Remove)
├─ Click target: Same circle area
├─ Feedback: Instant color change (red → grey)
├─ Confirmation: None (immediate action)
└─ Undo: Click heart again to re-add
```

**Tab Switching:**
```
Action: Click tab button
├─ Visual feedback: Background color swap (instant)
├─ Content swap: Panel visibility toggle
├─ Transition: None (immediate)
└─ Persistence: Tab state not saved (resets on close)
```

**Size Picker:**
```
Action: Click "+" button
├─ Overlay animation: Slide up from bottom
├─ Focus: Size options container
├─ Background: White with shadow
├─ Close methods:
│   ├─ Click size (adds to cart)
│   ├─ Click outside
│   ├─ Press ESC
│   └─ Scroll away (auto-closes)
└─ Multiple pickers: Only one open at a time
```

### 4.2 Hover States

**Heart Button:**
```css
:hover {
  /* No visual change on hover */
  /* Relies on click for state change */
  transform: none;
  box-shadow: none;
}
```

**Tab Buttons:**
```css
Inactive Tab:hover {
  /* No explicit hover state defined */
  /* Click to activate */
}
```

**Size Buttons:**
```css
:hover, :focus-visible {
  background: rgb(18,18,18);
  color: rgb(255,255,255);
  border-color: rgb(18,18,18);
  /* Invert colors on hover */
}
```

**Product Cards:**
```css
Card:hover {
  /* Title does NOT underline */
  text-decoration: none !important;
  /* Image might have zoom effect (theme-dependent) */
}
```

### 4.3 Focus States

**Keyboard Navigation:**

| Element | Focus Indicator |
|---------|----------------|
| Heart button | Browser default outline |
| Tab buttons | 2px solid outline, 2px offset |
| Size picker | Focus on .size-options container |
| Size buttons | Inverted colors (same as hover) |
| Product links | Browser default underline |

**Tab Order:**
1. Heart buttons (left to right, top to bottom)
2. Product images/titles
3. Color swatches (if present)
4. Quick add buttons
5. Size picker buttons (when open)

### 4.4 Touch Interactions (Mobile)

**Heart Button:**
```
Tap behavior:
├─ Target size: Minimum 3rem × 3rem (meets 44px guideline)
├─ Touch feedback: Instant color change
├─ No hover state (touch device)
└─ No double-tap required
```

**Size Picker:**
```
Touch behavior:
├─ Tap "+" → Overlay opens
├─ Tap size → Adds to cart
├─ Swipe down → Does not close (scroll only)
├─ Tap outside → Closes overlay
└─ Overlay scrollable: -webkit-overflow-scrolling: touch
```

**Drawer Scrolling:**
```
Scroll behavior:
├─ Vertical scroll only
├─ Momentum scrolling enabled
├─ Scrollbar: Thin custom style
├─ Safe area: Padding for notched devices
│   └─ env(safe-area-inset-bottom)
└─ Pull-to-refresh: Not disabled (browser default)
```

---

## 5. Responsive Behavior

### 5.1 Breakpoint Strategy

**Primary Breakpoint: 750px**

```
< 750px (Mobile)              ≥ 750px (Desktop)
├─ 2-column grid             ├─ 6-column grid
├─ Smaller fonts             ├─ Larger fonts
├─ Stacked layouts           ├─ Horizontal layouts
├─ Full-width buttons        ├─ Inline buttons
└─ Touch-optimized targets   └─ Mouse-optimized
```

### 5.2 Component Adaptations

**Heart Button:**

| Viewport | Size | Position | Notes |
|----------|------|----------|-------|
| Mobile Collection | 3rem | top: 1rem, right: 0.3rem | Increased top spacing |
| Desktop Collection | 3.5rem | top: 0.5rem, right: 0.3rem | Standard positioning |
| Mobile Product Page | 20px | Static in title | Inline with heading |
| Desktop Product Page | 2.25rem | Static in title | Inline with heading |
| Mobile Sticky Bar | 1.75rem | Absolute positioning | Above bar |

**Wishlist Grid:**

```
MOBILE (< 750px):
┌──────────┬──────────┐
│    1     │    2     │
├──────────┼──────────┤  Grid: 2 columns
│    3     │    4     │  Gap: 1rem
└──────────┴──────────┘

DESKTOP (≥ 750px):
┌────┬────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │  Grid: 6 columns
└────┴────┴────┴────┴────┴────┘  Gap: 1rem (0.6rem on page)

CART DRAWER (All sizes):
┌────┬────┬────┐
│ 1  │ 2  │ 3  │  Grid: Always 3 columns
└────┴────┴────┘  Gap: 1rem
```

**Tab Buttons:**

```
Desktop:
├─ font-size: 0.875rem
├─ padding: 0.5rem 0.75rem
└─ Letter-spacing: 0.05em

Mobile:
├─ font-size: 0.75rem
├─ padding: 0.5rem 0.5rem
└─ Reduced horizontal padding
```

**Size Picker:**

```
Desktop:
├─ Button flex: 1 1 calc(33.333% - 0.5rem)
├─ Min-width: 6rem
└─ 3 buttons per row

Mobile:
├─ Button flex: 1 1 calc(50% - 0.5rem)
├─ 2 buttons per row
└─ Padding: 1rem (reduced from 1.25rem)
```

### 5.3 Viewport Height Handling

**Mobile Devices (Address Bar Issue):**

```css
Drawer Height:
├─ height: 100dvh (dynamic viewport height)
├─ max-height: 100dvh
├─ Fallback: max-height: -webkit-fill-available
└─ Prevents content hidden by browser UI

Bottom Padding:
├─ padding-bottom: max(6rem, calc(4rem + env(safe-area-inset-bottom)))
├─ Ensures content visible above:
│   ├─ iOS Safari toolbar
│   ├─ Android Chrome toolbar
│   └─ Notched device bottom inset
```

**Scrollable Areas:**

```
Cart Drawer:
├─ Wishlist container: overflow-y: auto
├─ Webkit scrolling: -webkit-overflow-scrolling: touch
├─ Scrollbar styling:
│   ├─ width: 0.5rem
│   ├─ thumb: rgba(0,0,0,0.25)
│   └─ border-radius: 999px
└─ Empty state: No scroll needed

Wishlist Page:
├─ Natural page scroll (no custom handling)
└─ Recommendations scroll naturally
```

### 5.4 Safe Area Insets

**iPhone X+ Bottom Bar:**

```css
.drawer__footer {
  padding-bottom: max(
    6rem,
    calc(4rem + env(safe-area-inset-bottom, 0px))
  );
}

.cart__ctas {
  padding-bottom: calc(
    2rem + env(safe-area-inset-bottom, 0px)
  );
}
```

**Purpose:**
- Prevents buttons from being obscured by home indicator
- Maintains tap targets above gesture area
- Adapts to device-specific safe zones

---

## 6. Accessibility Features

### 6.1 ARIA Attributes

**Heart Button:**
```html
<button
  class="wishlist-toggle"
  type="button"
  aria-pressed="false"  <!-- Toggles to "true" when active -->
  aria-label="Add to wishlist"  <!-- Changes to "Remove from wishlist" -->
>
```

**Tab Buttons:**
```html
<button
  data-tab-target="wishlist"
  role="tab"
  aria-selected="false"  <!-- Toggles to "true" when active -->
  class="drawer__tab"
>
  Wishlist (5)
</button>
```

**Tab Panels:**
```html
<div
  data-tab-panel="wishlist"
  role="tabpanel"
  hidden  <!-- Removed when active -->
  class="drawer__panel drawer__panel--active"
>
```

**Quick Add Button:**
```html
<button
  class="plus-icon"
  aria-label="Add to cart"
  aria-expanded="false"  <!-- Toggles to "true" when open -->
>
```

### 6.2 Keyboard Navigation

**Supported Keys:**

| Key | Context | Action |
|-----|---------|--------|
| Space/Enter | Heart button | Toggle wishlist |
| Space/Enter | Tab button | Switch tabs |
| Space/Enter | Size button | Add to cart |
| Escape | Size picker open | Close overlay |
| Tab | Any | Move to next focusable |
| Shift+Tab | Any | Move to previous focusable |

**Focus Management:**

```
Tab Order Example (Wishlist Card):
1. Heart button
2. Product image link
3. Product title link
4. Color swatch (if interactive)
5. Quick add "+" button
6. (If opened) Size options
```

### 6.3 Screen Reader Experience

**Heart Button Announcements:**
```
Initial State:
"Add to wishlist, button, not pressed"

After Click:
"Remove from wishlist, button, pressed"

Multiple Products:
Each heart independently announced
No confusion between products
```

**Tab Navigation:**
```
Tab Button:
"Wishlist, 5 items, tab, not selected"

After Activation:
"Wishlist, 5 items, tab, selected"

Panel Switch:
Screen reader announces region change
```

**Empty State:**
```
Heading: "Your wishlist is empty"
Link: "Continue shopping, link"
Recommendations: Announced as list of products
```

### 6.4 Color Contrast

**WCAG AA Compliance:**

| Element | Foreground | Background | Ratio | Pass |
|---------|-----------|------------|-------|------|
| Active Heart | #d23f57 | White | ~4.5:1 | ✅ |
| Primary Text | rgb(18,18,18) | White | >15:1 | ✅ |
| Secondary Text | rgba(18,18,18,0.7) | White | ~7:1 | ✅ |
| Active Tab Text | White | rgb(18,18,18) | >15:1 | ✅ |
| Border (inactive) | rgba(18,18,18,0.15) | White | 1.3:1 | ⚠️ Non-text |

**Notes:**
- Heart icon relies on fill vs. outline distinction
- Red fill provides additional visual cue beyond outline
- Inactive state uses grey (sufficient for non-text)

### 6.5 Reduced Motion

**Currently Not Implemented:**

```css
/* Recommendation: Add this */
@media (prefers-reduced-motion: reduce) {
  .wishlist-toggle__icon path,
  .drawer__tab,
  .size-option {
    transition: none;
  }

  .product-card-plus .size-options {
    animation: none;
  }
}
```

---

## 7. Visual Design Details

### 7.1 Icon Design

**Heart Icon Path:**
```svg
<path d="M12 21.35 10.55 20.03C6.2 15.99 3 12.99 3 9.31
         3 6.28 5.42 4 8.4 4A5.2 5.2 0 0 1 12 5.86
         5.2 5.2 0 0 1 15.6 4C18.58 4 21 6.28 21 9.31
         c0 3.68-3.2 6.68-7.55 10.72z" />
```

**Visual Properties:**
- ViewBox: 24×24
- Stroke-based outline (inactive)
- Fill-based solid (active)
- Smooth curves for organic feel
- Centered within button circle

### 7.2 Shadow & Elevation

**Size Picker Overlay:**
```css
box-shadow: 0 -12px 24px rgba(0, 0, 0, 0.12);
```
- Direction: Upward shadow (0 -12px)
- Blur: 24px (soft diffusion)
- Color: Black at 12% opacity
- Effect: Elevated drawer appearance

**No Other Shadows:**
- Heart button: No shadow
- Tab buttons: No shadow
- Product cards: No shadow
- Flat design aesthetic

### 7.3 Animations & Transitions

**Heart Button:**
```css
transition: transform 0.15s ease, box-shadow 0.15s ease;

.wishlist-toggle__icon path {
  transition: fill 0.15s ease;
}
```
- Duration: 150ms (fast, responsive)
- Easing: ease (natural feel)
- Properties: fill color only

**Tab Buttons:**
```css
transition: background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease;
```
- Smooth color transitions
- All properties animate together
- Instant panel swap (no transition on content)

**Size Picker:**
```css
transform: translateY(100%);  /* Hidden */
transition: transform 0.25s ease;
/* Open: translateY(0) */
```
- Slides up from bottom
- Duration: 250ms (slower for comprehension)
- Hardware-accelerated (transform property)

**Swatch Clicks:**
```
No explicit transition defined
Reliant on browser default
```

### 7.4 Image Treatment

**Product Images:**
```css
.wishlist-card__image {
  object-fit: cover;          /* Crops to fit */
  aspect-ratio: 2 / 3;        /* Portrait orientation */
  border-radius: var(--media-radius, 0.6rem);
  loading: lazy;              /* Performance optimization */
}
```

**Image States:**
1. Loading: Grey placeholder background
2. Loaded: Full color image
3. Error: Placeholder remains (no broken image icon)

**URL Normalization:**
- Protocol-relative URLs fixed (`//cdn...` → `https://cdn...`)
- Extracts from stored markup if URL missing
- Multiple fallback sources (variant image, featured image, etc.)

### 7.5 Empty States

**Wishlist Empty (Drawer):**
```
┌───────────────────────────────────┐
│                                   │
│       Your wishlist is empty      │  ← 1.375rem, weight 600
│                                   │
│   Add items you love to your     │  ← 0.9375rem, color rgba(18,18,18,0.7)
│   wishlist and they'll show      │
│   up here.                        │
│                                   │
│  ─────────────────────────────── │
│                                   │
│     You might also like:          │  ← 1.125rem, weight 600
│                                   │
│   [Product Grid 3 columns]        │
│                                   │
└───────────────────────────────────┘
```

**Wishlist Empty (Page):**
```
┌───────────────────────────────────┐
│                                   │
│   Your wishlist is empty.         │  ← 1.125rem
│                                   │
│   ┌─────────────────────┐        │
│   │  Continue shopping  │        │  ← Button
│   └─────────────────────┘        │
│                                   │
└───────────────────────────────────┘
```

---

## 8. Performance Considerations

### 8.1 Rendering Strategy

**Initial Load:**
```
1. HTML parses
2. CSS loads (blocking)
3. JavaScript loads (async implied)
4. DOMContentLoaded fires
5. Wishlist init() runs
6. localStorage read (synchronous)
7. Hearts sync (initial state)
8. Wishlist renders (if on page)
```

**Subsequent Operations:**
```
Heart Click:
├─ localStorage.setItem() - ~1ms
├─ renderWishlist() - ~50-100ms (if drawer open)
└─ syncHearts() - ~10-20ms (querySelectorAll + loop)

Total: <150ms perceived latency
```

### 8.2 Image Optimization

**Lazy Loading:**
```html
<img loading="lazy" ... />
```
- Below-fold images deferred
- Reduces initial page weight
- Browser-native implementation

**Srcset/Sizes:**
```html
srcset attribute populated from Shopify CDN
sizes="100vw" (default)
```
- Responsive images served
- Bandwidth optimization
- No manual intervention needed

### 8.3 Scroll Performance

**Hardware Acceleration:**
```css
transform: translateY(100%);
/* GPU-accelerated property */
```

**Smooth Scrolling:**
```css
-webkit-overflow-scrolling: touch;
scrollbar-width: thin;
```
- iOS momentum scrolling
- Reduced scrollbar overhead

**Paint Optimization:**
- `will-change` not used (appropriate)
- No large background images
- Simple color transitions

### 8.4 Storage Efficiency

**LocalStorage Usage:**
```javascript
Key: 'theme-wishlist-cache'
Value: JSON.stringify(items)  // Array of objects

Approximate size per item: ~1-2KB
Storage limit: 5-10MB (browser-dependent)
Estimated capacity: ~2,500-10,000 items
```

**Optimization Opportunities:**
- Card markup stored (large)
- Could compress or omit if regenerate from API
- className properties duplicated across items

---

## 9. Edge Cases & Error States

### 9.1 Storage Failures

**LocalStorage Full:**
```javascript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedWishlist));
} catch (error) {
  console.warn('Unable to persist wishlist', error);
}
// Graceful degradation: Feature fails silently
// User not notified (UX opportunity)
```

**LocalStorage Disabled (Private Mode):**
- Feature completely non-functional
- Hearts don't persist
- No error message shown

### 9.2 Network Failures

**Add to Cart Fails:**
```javascript
.catch((error) => {
  console.error(error);
  // Button re-enabled
  // Item stays in wishlist
  // No user notification (UX gap)
})
```

**Recommendations API Fails:**
- Empty state still shows
- Recommendations section simply empty
- No error message

### 9.3 Data Corruption

**Invalid JSON in Storage:**
```javascript
const parsed = JSON.parse(stored);
if (Array.isArray(parsed)) {
  // Use data
} else {
  // Reset to empty array
}
```

**Missing Product Data:**
- Fallback markup generation
- Placeholder images shown
- Title/price from stored data

### 9.4 Race Conditions

**Rapid Clicks:**
- Heart clicks queued naturally (synchronous localStorage)
- Last click wins
- No debouncing implemented

**Multiple Tabs:**
- No cross-tab synchronization
- Each tab has independent state
- Changes visible on page reload only

### 9.5 Product Unavailability

**Product Deleted:**
- Wishlist still shows item
- Links may 404
- Image may 404
- No validation against product existence

**All Variants Sold Out:**
- Item still in wishlist
- Quick add shows all sizes disabled
- No "sold out" badge on card
- User clicks → sees all sizes greyed

---

## 10. UX Strengths

✅ **Instant Feedback**
- Heart fills immediately on click
- No loading states needed
- Feels fast and responsive

✅ **Persistent State**
- Survives page navigation
- Survives browser restart
- No login required

✅ **Color Intelligence**
- Tracks color variants separately
- Syncs with product page swatch selection
- Shows correct color swatch on wishlist

✅ **Multi-Location Access**
- Cart drawer (convenient)
- Dedicated page (browsing)
- Hearts visible throughout site

✅ **Quick Add Flow**
- Add to cart without leaving wishlist
- Size picker right in card
- Automatic removal after add

✅ **Visual Consistency**
- Matches theme styling
- Inherits product card design
- Feels native, not bolted-on

✅ **Keyboard Accessible**
- All functions keyboard-operable
- Escape closes overlays
- Tab navigation logical

✅ **Mobile Optimized**
- Touch targets meet guidelines
- Responsive grids
- Drawer scrolling smooth

---

## 11. UX Weaknesses & Opportunities

### 11.1 Missing Feedback

❌ **No Loading States**
- Add to cart has no spinner
- User clicks size, uncertain if it worked
- Could show "Adding..." state on button

❌ **No Error Messages**
- Cart add failures silent
- Storage failures silent
- Network errors only in console

❌ **No Success Confirmations**
- Item added to wishlist → Just heart fills
- Item added to cart → Just drawer switches
- Could show toast notifications

❌ **No Undo Mechanism**
- Remove from wishlist is permanent
- Accidental clicks cannot be undone
- Could show "Undo" toast for 3 seconds

### 11.2 Missing Features

❌ **No Login Modal Integration**
- `wishlist-login-modal.liquid` exists but empty
- Likely intended for "save across devices" feature
- Currently unused

❌ **No Cross-Device Sync**
- LocalStorage is device-specific
- No account integration
- Lost on device switch

❌ **No Sharing**
- Can't share wishlist with others
- No public wishlist URLs
- No email/social share buttons

❌ **No Organization**
- Can't sort wishlist
- Can't create multiple lists
- No favorites within wishlist

❌ **No Price Tracking**
- Doesn't notify on price drops
- Doesn't show price history
- Stored price never updates

### 11.3 Accessibility Gaps

⚠️ **Reduced Motion Not Supported**
- Transitions always animate
- Could respect `prefers-reduced-motion`

⚠️ **Focus Indicator Weak**
- Heart button uses browser default
- Could enhance with custom outline

⚠️ **Screen Reader Context**
- "Add to wishlist" doesn't announce product name
- Could be "Add {Product Name} to wishlist"

### 11.4 Performance Issues

⚠️ **Stored Markup Bloat**
- Each item stores full card HTML (~1-2KB)
- Could regenerate from minimal data
- Impacts storage limits

⚠️ **No Virtualization**
- All wishlist items render at once
- Could lag with 100+ items
- Could use virtual scrolling

⚠️ **Synchronous LocalStorage**
- Can block main thread (rare but possible)
- Could use IndexedDB for large datasets

### 11.5 Mobile UX

⚠️ **Drawer Scrolling**
- Custom scrollbar on mobile (often hidden)
- Native scroll bars more familiar

⚠️ **Bottom Sheet Pattern**
- Size picker slides up (good)
- But covers card content
- Could use modal overlay instead

⚠️ **Safe Area Handling**
- Implemented for bottom
- But not tested for landscape notches

---

## 12. Recommendations Summary

### Priority 1: Quick Wins (Low Effort, High Impact)

#### 1. Add Toast Notifications ⭐
**Impact:** High user satisfaction, clear feedback
**Effort:** Low (1-2 hours)
**Implementation:**
- "Added to wishlist" with undo option
- "Removed from wishlist"
- "Added to cart"
- Duration: 2-3 seconds, dismissible
- Position: Top-right corner (desktop), bottom (mobile)

**Files to modify:**
- `assets/wishlist.js` - Add toast system
- `assets/wishlist.css` - Toast styling
- Consider creating `snippets/toast-notification.liquid`

**User benefit:** Users get clear confirmation of actions, reducing uncertainty

---

#### 2. Loading States ⭐
**Impact:** Reduces uncertainty during cart add
**Effort:** Low (1 hour)
**Implementation:**
- Disable size button during add
- Show "Adding..." text or spinner
- Re-enable on success/error

**Files to modify:**
- `assets/wishlist.js:1734-1747` (handleWishlistSizeOptionClick)
- `assets/wishlist.css` - Loading state styles

**User benefit:** Clear indication that action is processing

---

#### 3. Error Messages ⭐
**Impact:** User can understand and recover from errors
**Effort:** Low (1 hour)
**Implementation:**
- Alert/toast if cart add fails
- Message if localStorage full
- Network error notifications

**Files to modify:**
- `assets/wishlist.js:1677-1690` (addVariantToCart catch block)
- `assets/wishlist.js:452-461` (saveWishlist try/catch)

**User benefit:** Users know when something goes wrong and can take action

---

#### 4. Reduced Motion Support ⭐
**Impact:** Accessibility compliance
**Effort:** Very low (30 minutes)
**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
```

**Files to modify:**
- `assets/wishlist.css` - Add media query

**User benefit:** Respects user accessibility preferences

---

#### 5. Screen Reader Improvements
**Impact:** Better accessibility
**Effort:** Low (1 hour)
**Implementation:**
- Include product name in aria-label
- "Add [Product Name] to wishlist"
- Announce count changes

**Files to modify:**
- `assets/wishlist.js:793-799` (syncHearts aria-label)

**User benefit:** Screen reader users get better context

---

### Priority 2: Medium Effort, High Impact

#### 6. Cross-Tab Sync
**Impact:** Consistent state across browser tabs
**Effort:** Medium (2-3 hours)
**Implementation:**
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    cachedWishlist = null; // Invalidate cache
    renderWishlist();
    syncHearts();
  }
});
```

**Files to modify:**
- `assets/wishlist.js` - Add storage event listener

**User benefit:** Changes in one tab reflected in others instantly

---

#### 7. Empty State Enhancement
**Impact:** Better engagement, reduced abandonment
**Effort:** Medium (2-3 hours)
**Implementation:**
- More prominent CTA
- Personalized recommendations
- "Recently viewed" fallback

**Files to modify:**
- `sections/wishlist-page.liquid`
- `assets/wishlist.css` - Empty state styling

**User benefit:** Users have clear next steps when wishlist empty

---

#### 8. Sort/Filter Options
**Impact:** Better organization for large wishlists
**Effort:** Medium (3-4 hours)
**Implementation:**
- Sort by: Date added, Price (low/high), Name
- Filter by: Availability, Color, Price range
- Dropdown controls above grid

**Files to modify:**
- `assets/wishlist.js` - Add sorting/filtering logic
- `sections/wishlist-page.liquid` - Add UI controls

**User benefit:** Easier to find items in large wishlists

---

#### 9. Price Update Mechanism
**Impact:** Accurate pricing, better trust
**Effort:** Medium (3-4 hours)
**Implementation:**
- Fetch current prices on load
- Show "Price dropped" badges
- Background update every 24h

**Files to modify:**
- `assets/wishlist.js` - Add price fetching logic

**User benefit:** Always see current prices

---

#### 10. Wishlist Limit Warning
**Impact:** Prevents silent failures
**Effort:** Low-Medium (2 hours)
**Implementation:**
- Show count (e.g., "45/100 items")
- Warn at 90% capacity
- Suggest clearing old items

**Files to modify:**
- `assets/wishlist.js` - Add limit checking
- Add UI indicator in drawer/page

**User benefit:** Users know when approaching limits

---

### Priority 3: High Effort, High Impact

#### 11. Account Integration
**Impact:** Cross-device sync, permanent storage
**Effort:** High (1-2 weeks)
**Implementation:**
- Optional login to sync
- Server-side storage (Shopify metafields)
- Merge local with server on login
- Background sync

**Files to modify:**
- Multiple files, backend integration required
- `snippets/wishlist-login-modal.liquid` - Implement login UI

**User benefit:** Wishlist follows user across devices

---

#### 12. Share Functionality
**Impact:** Social proof, viral growth
**Effort:** High (1 week)
**Implementation:**
- Generate shareable URL
- Email wishlist
- Social media sharing (Pinterest, Facebook)
- Public wishlist pages

**Files to modify:**
- New backend endpoint for sharing
- Add share buttons to UI

**User benefit:** Share gift ideas, inspiration

---

#### 13. Multiple Lists
**Impact:** Better organization for power users
**Effort:** High (1-2 weeks)
**Implementation:**
- Create custom lists ("Favorites", "Gift Ideas", etc.)
- Move items between lists
- Different colors per list
- List management UI

**Files to modify:**
- Major refactor of storage structure
- New UI for list management

**User benefit:** Organize items by purpose

---

#### 14. Analytics Integration
**Impact:** Data-driven improvements
**Effort:** Medium-High (1 week)
**Implementation:**
- Track wishlist adds
- Track conversions (wishlist → cart)
- A/B test features
- Heat maps on heart icons

**Files to modify:**
- Add analytics events throughout `wishlist.js`

**User benefit:** Better feature development based on data

---

#### 15. Virtual Scrolling
**Impact:** Performance with large wishlists
**Effort:** High (1 week)
**Implementation:**
- Render only visible items
- Dynamically add/remove as scroll
- Handle 1000+ item wishlists
- Use IntersectionObserver

**Files to modify:**
- Major refactor of rendering logic in `wishlist.js`

**User benefit:** Fast performance with many items

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error messages
- ✅ Reduced motion
- ✅ Screen reader improvements

**Total effort:** ~5 hours
**Impact:** Major UX improvement

---

### Phase 2: Polish (Week 2-3)
- Cross-tab sync
- Empty state enhancement
- Sort/filter options
- Price updates
- Wishlist limit warning

**Total effort:** ~15 hours
**Impact:** Professional polish

---

### Phase 3: Advanced (Month 2)
- Account integration
- Share functionality
- Multiple lists
- Analytics

**Total effort:** 3-4 weeks
**Impact:** Feature completeness

---

### Phase 4: Optimization (Ongoing)
- Virtual scrolling (if needed)
- Performance monitoring
- A/B testing
- User feedback implementation

**Total effort:** Ongoing
**Impact:** Continuous improvement

---

## File Reference Index

### Core Files
- `assets/wishlist.js` - Main logic (1933 lines)
- `assets/wishlist.css` - Styles (977 lines)
- `snippets/wishlist-heart.liquid` - Heart button component
- `snippets/wishlist-login-modal.liquid` - Login modal (empty)
- `sections/wishlist-page.liquid` - Dedicated page
- `templates/page.wishlist.json` - Page template config

### Key Functions Reference
- Add to wishlist: `wishlist.js:485-506`
- Remove from wishlist: `wishlist.js:508-517`
- Render wishlist: `wishlist.js:1560-1608`
- Sync hearts: `wishlist.js:752-800`
- Handle heart click: `wishlist.js:729-742`
- Quick add handler: `wishlist.js:1697-1747`
- Add to cart: `wishlist.js:1666-1695`

### Styling Sections
- Heart button: `wishlist.css:1-78`
- Drawer tabs: `wishlist.css:194-255`
- Wishlist grid: `wishlist.css:306-361`
- Quick add: `wishlist.css:596-677`
- Empty state: `wishlist.css:769-923`

---

**End of Documentation**
