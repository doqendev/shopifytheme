// Size Drawer Functionality - Fixed Version

// Don't auto-open drawer on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Size drawer JavaScript DOM loaded');
  
  // Hide size swatches
  hideSizeSwatches();
  
  // Re-run size swatch hiding after a delay to catch dynamically loaded elements
  setTimeout(hideSizeSwatches, 1000);
  
  // Make sure all drawers are closed on page load
  const allDrawers = document.querySelectorAll('.size-drawer');
  allDrawers.forEach(drawer => {
    drawer.style.display = 'none';
    drawer.classList.remove('active');
  });
  
  // Debug: List all elements that might be size drawers
  const drawerElements = document.querySelectorAll('[id*="size-drawer"]');
  console.log('🔍 Found drawer elements:', Array.from(drawerElements).map(el => ({
    id: el.id,
    display: window.getComputedStyle(el).display,
    visibility: window.getComputedStyle(el).visibility
  })));
  
  // Listen for color variant changes
  const colorInputs = document.querySelectorAll('input[name*="Color"], input[name*="Cor"], input[name*="color"], input[name*="cor"]');
  console.log('🎨 Found color inputs:', colorInputs.length);
  
  colorInputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log('🎨 Color changed to:', this.value);
      // If size drawer is open, update the available sizes
      const openDrawer = document.querySelector('.size-drawer.active');
      if (openDrawer) {
        const sectionId = openDrawer.id.replace('size-drawer-', '');
        populateAvailableSizes(sectionId);
      }
    });
  });
  
  // Close drawer when clicking outside
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('size-drawer-overlay')) {
      const drawer = event.target.parentElement;
      const sectionId = drawer.id.replace('size-drawer-', '');
      closeSizeDrawer(sectionId);
    }
  });
  
  // Close drawer with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      console.log('⌨️ Escape key pressed');
      const activeDrawer = document.querySelector('.size-drawer.active');
      if (activeDrawer) {
        const sectionId = activeDrawer.id.replace('size-drawer-', '');
        closeSizeDrawer(sectionId);
      }
    }
  });
});

function hideSizeSwatches() {
  console.log('🚫 Hiding size swatches...');
  
  // Find all size-related elements and hide them
  const sizeSelectors = [
    'input[value="XS"]:not([name*="Color"]):not([name*="Cor"])',
    'input[value="S"]:not([name*="Color"]):not([name*="Cor"])',
    'input[value="M"]:not([name*="Color"]):not([name*="Cor"])',
    'input[value="L"]:not([name*="Color"]):not([name*="Cor"])',
    'input[value="XL"]:not([name*="Color"]):not([name*="Cor"])',
    'input[value="XXL"]:not([name*="Color"]):not([name*="Cor"])',
    'label[for*="XS"]',
    'label[for*="-S-"]',
    'label[for*="-M-"]',
    'label[for*="-L-"]',
    'label[for*="XL"]',
    '[data-option-name*="Size"]',
    '[data-option-name*="Tamanho"]'
  ];
  
  sizeSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      console.log('🚫 Hiding element:', el);
      el.style.display = 'none';
      // Also hide parent containers
      if (el.parentElement) {
        const parent = el.parentElement;
        // Check if parent only contains size-related elements
        const siblings = parent.querySelectorAll('input, label');
        const sizeSiblings = parent.querySelectorAll('input[value="XS"], input[value="S"], input[value="M"], input[value="L"], input[value="XL"], input[value="XXL"]');
        if (siblings.length === sizeSiblings.length) {
          console.log('🚫 Hiding parent container:', parent);
          parent.style.display = 'none';
        }
      }
    });
  });
  
  // Also hide fieldsets with size-related legends
  const fieldsets = document.querySelectorAll('fieldset');
  fieldsets.forEach(fieldset => {
    const legend = fieldset.querySelector('legend');
    if (legend && (legend.textContent.toLowerCase().includes('size') || legend.textContent.toLowerCase().includes('tamanho'))) {
      console.log('🚫 Hiding size fieldset:', fieldset);
      fieldset.style.display = 'none';
    }
  });
}

// Global functions for opening and closing drawer
function openSizeDrawer(sectionId) {
  console.log('🚀 Opening size drawer for section:', sectionId);
  
  const drawer = document.getElementById('size-drawer-' + sectionId);
  console.log('📦 Drawer element found:', drawer);
  
  if (drawer) {
    // Populate sizes based on current color selection
    populateAvailableSizes(sectionId);
    
    // Show drawer
    drawer.style.display = 'block';
    drawer.style.visibility = 'visible';
    drawer.style.opacity = '1';
    drawer.style.zIndex = '9999999';
    drawer.style.position = 'fixed';
    drawer.style.top = '0';
    drawer.style.left = '0';
    drawer.style.width = '100vw';
    drawer.style.height = '100vh';
    
    // Add active class with delay for animation
    setTimeout(() => {
      drawer.classList.add('active');
      console.log('✅ Drawer should now be active and visible');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    console.log('📱 Size drawer opened for section:', sectionId);
  } else {
    console.error('❌ Size drawer not found for section:', sectionId);
  }
}

function closeSizeDrawer(sectionId) {
  console.log('🔒 Closing size drawer for section:', sectionId);
  
  const drawer = document.getElementById('size-drawer-' + sectionId);
  if (drawer) {
    drawer.classList.remove('active');
    
    setTimeout(() => {
      drawer.style.display = 'none';
    }, 300);
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    console.log('✅ Size drawer closed for section:', sectionId);
  }
}

function populateAvailableSizes(sectionId) {
  console.log('📐 Populating sizes for section:', sectionId);
  
  const productData = window['productData_' + sectionId];
  const sizeContainer = document.getElementById('size-options-' + sectionId);
  
  console.log('📊 Product data for section:', sectionId, productData);
  console.log('📦 Size container:', sizeContainer);
  
  if (!productData || !sizeContainer) {
    console.error('❌ Missing product data or size container for section:', sectionId);
    console.log('Available product data keys:', Object.keys(window).filter(key => key.startsWith('productData_')));
    return;
  }
  
  // Get currently selected color
  const selectedColor = getCurrentlySelectedColor();
  console.log('🎨 Selected color:', selectedColor);
  
  // Clear existing size options
  sizeContainer.innerHTML = '';
  
  // Get unique sizes available for the selected color (or all sizes if no color selected)
  const availableSizes = getAvailableSizesForColor(productData, selectedColor);
  console.log('📏 Available sizes:', availableSizes);
  
  if (availableSizes.length === 0) {
    sizeContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Não há tamanhos disponíveis para esta cor.</p>';
    return;
  }
  
  // Create size option buttons
  availableSizes.forEach((sizeData, index) => {
    console.log(`📋 Creating size button ${index + 1}:`, sizeData);
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'size-option';
    button.textContent = sizeData.size;
    button.dataset.size = sizeData.size;
    button.dataset.variantId = sizeData.variantId;
    
    if (!sizeData.available) {
      button.disabled = true;
      button.classList.add('out-of-stock');
      button.textContent += ' - Esgotado';
    } else {
      button.addEventListener('click', () => {
        console.log('🖱️ Size button clicked:', sizeData);
        selectSize(sectionId, sizeData);
      });
    }
    
    sizeContainer.appendChild(button);
  });
  
  console.log('✅ Size options populated. Container contents:', sizeContainer.innerHTML.substring(0, 200) + '...');
}

function getCurrentlySelectedColor() {
  // Look for selected color in various possible selectors
  const colorSelectors = [
    'input[name*="Color"]:checked',
    'input[name*="Cor"]:checked', 
    'input[name*="color"]:checked',
    'input[name*="cor"]:checked',
    '.swatch input:checked',
    'fieldset input:checked'
  ];
  
  for (const selector of colorSelectors) {
    const colorInput = document.querySelector(selector);
    if (colorInput) {
      console.log('🎨 Found color input:', selector, colorInput.value);
      return colorInput.value;
    }
  }
  
  console.log('🎨 No color selected, showing all sizes');
  return null;
}

function getAvailableSizesForColor(productData, selectedColor) {
  const sizesMap = new Map();
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  console.log('🔍 Processing variants for correct product:', productData.variants.length);
  
  productData.variants.forEach((variant, index) => {
    console.log(`📦 Variant ${index + 1}:`, {
      id: variant.id,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3,
      available: variant.available
    });
    
    // Determine which option is size and which is color
    let size = null;
    let color = null;
    
    // Check each option to determine if it's size or color
    if (variant.option1) {
      if (isSizeValue(variant.option1)) {
        size = variant.option1;
        color = variant.option2 || variant.option3;
      } else {
        color = variant.option1;
        size = variant.option2 || variant.option3;
      }
    }
    
    console.log(`📊 Processed variant ${index + 1}: size="${size}", color="${color}"`);
    
    // If we have a selected color, filter by that color
    if (selectedColor && color && color.toLowerCase() !== selectedColor.toLowerCase()) {
      console.log(`🚫 Skipping variant - color "${color}" doesn't match selected "${selectedColor}"`);
      return; // Skip variants that don't match selected color
    }
    
    if (size) {
      const key = size;
      if (!sizesMap.has(key) || (variant.available && !sizesMap.get(key).available)) {
        sizesMap.set(key, {
          size: size,
          variantId: variant.id,
          available: variant.available,
          color: color
        });
        console.log(`✅ Added size "${size}" with variant ${variant.id}`);
      }
    }
  });
  
  // Convert to array and sort by size order
  const sizesArray = Array.from(sizesMap.values());
  
  const sortedSizes = sizesArray.sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.size);
    const bIndex = sizeOrder.indexOf(b.size);
    
    if (aIndex === -1 && bIndex === -1) {
      return a.size.localeCompare(b.size);
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
  
  console.log('📏 Final sorted sizes:', sortedSizes);
  return sortedSizes;
}

function isSizeValue(value) {
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+|\d+\/\d+)$/i;
  const sizeKeywords = ['size', 'tamanho', 'talla'];
  
  const isSize = sizePattern.test(value) || 
         sizeKeywords.some(keyword => value.toLowerCase().includes(keyword));
  
  console.log(`🔍 Is "${value}" a size? ${isSize}`);
  return isSize;
}

function selectSize(sectionId, sizeData) {
  console.log('📋 Size selected:', sizeData);
  
  // Add visual feedback
  const button = document.querySelector(`[data-size="${sizeData.size}"][data-variant-id="${sizeData.variantId}"]`);
  if (button) {
    button.classList.add('selecting');
    setTimeout(() => button.classList.remove('selecting'), 300);
  }
  
  if (sizeData.available) {
    // Update the hidden variant ID input
    const variantInput = document.getElementById('variant-id-' + sectionId);
    if (variantInput) {
      variantInput.value = sizeData.variantId;
      console.log('✅ Updated variant ID to:', sizeData.variantId);
    } else {
      console.error('❌ Variant input not found:', 'variant-id-' + sectionId);
    }
    
    // Add to cart
    setTimeout(() => {
      addToCartAndClose(sectionId);
    }, 300);
  } else {
    alert('Este tamanho não está disponível.');
  }
}

async function addToCartAndClose(sectionId) {
  console.log('🛒 Adding to cart and closing drawer for section:', sectionId);
  
  const variantInput = document.getElementById('variant-id-' + sectionId);
  const chooseSizeBtn = document.getElementById('ChooseSizeButton-' + sectionId);
  
  if (!variantInput || !variantInput.value) {
    console.error('❌ No variant ID found');
    alert('Por favor, selecione um tamanho válido.');
    return;
  }
  
  console.log('🛒 Adding variant to cart:', variantInput.value);
  
  // Show loading state
  if (chooseSizeBtn) {
    const originalText = chooseSizeBtn.querySelector('span').textContent;
    chooseSizeBtn.querySelector('span').textContent = 'Adicionando...';
    chooseSizeBtn.classList.add('loading');
    chooseSizeBtn.disabled = true;
  }
  
  try {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: parseInt(variantInput.value),
        quantity: 1
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Product added to cart:', result);
      
      // Close drawer
      closeSizeDrawer(sectionId);
      
      // Update button text
      if (chooseSizeBtn) {
        chooseSizeBtn.querySelector('span').textContent = 'Adicionado!';
        chooseSizeBtn.style.background = '#28a745';
        chooseSizeBtn.style.borderColor = '#28a745';
      }
      
      // Update cart count and trigger any cart update events
      updateCartUI();
      
      // Reset button after delay
      setTimeout(() => {
        if (chooseSizeBtn) {
          chooseSizeBtn.querySelector('span').textContent = 'Escolher tamanho';
          chooseSizeBtn.classList.remove('loading');
          chooseSizeBtn.disabled = false;
          chooseSizeBtn.style.background = '';
          chooseSizeBtn.style.borderColor = '';
        }
      }, 2000);
      
    } else {
      console.error('❌ Add to cart error:', result);
      throw new Error(result.message || result.description || 'Erro ao adicionar ao carrinho');
    }
    
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    alert('Erro ao adicionar produto ao carrinho: ' + error.message);
    
    // Reset button
    if (chooseSizeBtn) {
      chooseSizeBtn.querySelector('span').textContent = 'Escolher tamanho';
      chooseSizeBtn.classList.remove('loading');
      chooseSizeBtn.disabled = false;
    }
  }
}

function updateCartUI() {
  // Update cart count
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      console.log('🛒 Cart updated:', cart);
      
      // Update cart count elements
      const cartCountElements = document.querySelectorAll('.cart-count, [data-cart-count], .cart-item-count');
      cartCountElements.forEach(element => {
        element.textContent = cart.item_count;
        if (cart.item_count > 0) {
          element.style.display = '';
        }
      });
      
      // Update cart drawer if it exists
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
        cartDrawer.renderContents(cart);
      }
      
      // Trigger custom cart update events
      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart }
      }));
      
      // Update mini cart if it exists
      const miniCart = document.querySelector('.mini-cart');
      if (miniCart && window.updateMiniCart) {
        window.updateMiniCart(cart);
      }
    })
    .catch(error => {
      console.error('❌ Error updating cart UI:', error);
    });
}

console.log('✅ Size drawer JavaScript loaded successfully');