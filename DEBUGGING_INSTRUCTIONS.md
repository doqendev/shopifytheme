# Wishlist Image Bug - Debugging Instructions

## What Was Added

I've added comprehensive console logging to the `cart-drawer-edit.js` file to trace exactly what happens when you click "Move to favorites" (Mover para os favoritos).

## How to Test

1. **Open your browser's Developer Console** (F12 or right-click → Inspect → Console tab)

2. **Add a product to the cart** from the product page

3. **Open the cart drawer**

4. **Click "Mover para os favoritos"** (Move to favorites)

5. **Watch the console output**

## What to Look For in Console

The console will show detailed debug information in the following groups:

### 1. "🔥 MOVE TO WISHLIST CLICKED"
This shows:
- The host element (cart line wrapper)
- All data attributes on the cart line:
  - `data-line-key`
  - `data-variant-id`
  - `data-product-image` ⚠️ **CRITICAL - Check if this is empty!**
  - `data-product` (the full product JSON)
  - `data-qty`

### 2. "🔍 buildWishlistItemFromCart DEBUG"
This shows:
- The host element
- The parsed product data
- The variant ID
- The variant object found

### 3. "📸 IMAGE EXTRACTION PROCESS"
This is the **MOST IMPORTANT** section. It shows each priority level:

- **Priority 1**: Variant image data from the variant object
- **Priority 2**: `data-product-image` attribute value
- **Priority 3**: Whether an `<img>` element was found in the cart line
- **Priority 4**: Product data fallback (featured_media, featured_image, image, media array, images array)

For each priority level, you'll see:
- ✅ if it succeeded
- ❌ if it failed

### 4. "🎯 FINAL IMAGE SOURCE"
This shows the final image URL that will be used (or "NONE - IMAGE WILL BE MISSING!" if empty)

### 5. "✨ FINAL WISHLIST ITEM"
This shows the complete wishlist item object that will be saved

## Critical Questions to Answer

Based on the console output, please tell me:

1. **Is `data-product-image` empty?**
   - Look for: `data-product-image: ""`
   - If it's empty, the problem is in `cart-line-modern.liquid` line 10

2. **Is the `<img>` element missing from the DOM?**
   - Look for: `❌ Priority 3 - NO IMG ELEMENT FOUND IN DOM`
   - If yes, it means `item.image` is not available in the cart context

3. **What does the product JSON contain?**
   - Look at the "Parsed product data" output
   - Does it have any of these properties:
     - `featured_media`
     - `featured_image`
     - `image`
     - `media` (array)
     - `images` (array)

4. **Which priority level successfully provides the image?**
   - If all 4 priorities fail, we need to fetch product data from the Shopify API

## Expected Root Causes

Based on the hypothesis, I expect to see:

**Scenario A: item.image is not available in cart**
```
❌ Priority 1 - variantImageData: EMPTY
❌ Priority 2 - data-product-image: EMPTY or WHITESPACE
❌ Priority 3 - NO IMG ELEMENT FOUND IN DOM
🔍 Priority 4 - Product has featured_media: false
🔍 Priority 4 - Product has featured_image: false
🔍 Priority 4 - Product has image: false
🔍 Priority 4 - Product has media array: false 0
🔍 Priority 4 - Product has images array: false 0
🎯 FINAL IMAGE SOURCE: NONE - IMAGE WILL BE MISSING!
```

**Scenario B: product JSON is missing image data**
```
❌ Priority 1 - variantImageData: EMPTY
❌ Priority 2 - data-product-image: EMPTY or WHITESPACE
❌ Priority 3 - NO IMG ELEMENT FOUND IN DOM
🔍 Priority 4 - Product has images array: true 3  // Has images!
✅ Priority 4 - getProductImageForWishlist result: https://...
🎯 FINAL IMAGE SOURCE: https://... // SUCCESS
```

## What to Send Me

Please copy and paste the **entire console output** from all the debug groups, especially:
1. The "Host attributes" object
2. The "Parsed product data" object
3. The entire "📸 IMAGE EXTRACTION PROCESS" section
4. The "FINAL IMAGE SOURCE" value

This will tell me exactly where the image data is missing and how to fix it.

## Next Steps

Once I see the console output, I'll know if we need to:

1. **Fix the Liquid template** to ensure `item.image` is always available
2. **Enhance the product JSON** to include image data
3. **Fetch product data via API** as a fallback when cart data is incomplete
4. **Use a different data source** entirely

---

**File modified:** `C:\Users\Utilizador\Downloads\theme\assets\cart-drawer-edit.js`
**Lines changed:** Added console.log statements throughout the `buildWishlistItemFromCart` function and in the "Move to wishlist" click handler
