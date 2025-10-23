// TEMPORARY DEBUG VERSION - Replace cart-drawer-edit.js with this
// This adds simple non-grouped console logs to trace the image extraction

// Add this right after line 1028 (after ev.preventDefault();):
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔥 MOVE TO WISHLIST BUTTON CLICKED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 Host element:', host);
console.log('🔍 data-product-image:', host.getAttribute('data-product-image'));
console.log('🔍 img element:', host.querySelector('.il-cart-line__image img'));
if (host.querySelector('.il-cart-line__image img')) {
  const img = host.querySelector('.il-cart-line__image img');
  console.log('   img.src:', img.src);
  console.log('   img.currentSrc:', img.currentSrc);
}

// Then in buildWishlistItemFromCart, replace the image extraction section with:
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🖼️ IMAGE EXTRACTION PROCESS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let imageSource = '';

// Priority 1: Variant image
console.log('1️⃣ Checking variant image...');
console.log('   variantImageData:', variantImageData);
if (variantImageData) {
  imageSource = variantImageData;
  console.log('   ✅ SUCCESS - Using variant image');
} else {
  console.log('   ❌ FAILED - No variant image');
}

// Priority 2: data-product-image attribute
if (!imageSource && host) {
  console.log('2️⃣ Checking data-product-image attribute...');
  const hostImageAttr = host.getAttribute && host.getAttribute('data-product-image');
  console.log('   Attribute value:', hostImageAttr);
  if (hostImageAttr && hostImageAttr.trim()) {
    imageSource = hostImageAttr.trim();
    console.log('   ✅ SUCCESS - Using data-product-image');
  } else {
    console.log('   ❌ FAILED - Attribute is empty');
  }
}

// Priority 3: img element in DOM
if (!imageSource && host) {
  console.log('3️⃣ Checking img element in DOM...');
  const img = host.querySelector('.il-cart-line__image img');
  console.log('   img element:', img);
  if (img) {
    imageSource = img.currentSrc || img.src || img.getAttribute('src') || '';
    console.log('   ✅ SUCCESS - Using img element:', imageSource);
  } else {
    console.log('   ❌ FAILED - No img element found');
  }
}

// Priority 4: Product data fallback
if (!imageSource) {
  console.log('4️⃣ Checking product data...');
  imageSource = getProductImageForWishlist(product, host);
  console.log('   Result:', imageSource);
  if (imageSource) {
    console.log('   ✅ SUCCESS - Using product data');
  } else {
    console.log('   ❌ FAILED - No image in product data');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 FINAL IMAGE SOURCE:', imageSource);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
