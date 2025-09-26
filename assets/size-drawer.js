// Size Drawer Functionality - TARGETED HIDE VERSION

// IMMEDIATELY hide only size drawers on script load
(function() {
  const hideOnlySizeDrawers = () => {
    // Only target size drawer elements specifically
    const sizeDrawers = document.querySelectorAll('.size-drawer, [id*="size-drawer"]');
    sizeDrawers.forEach(drawer => {
      drawer.style.display = 'none';
      drawer.style.visibility = 'hidden';
      drawer.style.opacity = '0';
      drawer.style.position = 'absolute';
      drawer.style.top = '-9999px';
      drawer.style.left = '-9999px';
      drawer.classList.remove('active');
      console.log('🚫 Force hiding size drawer:', drawer.id);
    });
    
    // Hide only specific elements with "Seleciona o tamanho" text
    const elements = document.querySelectorAll('h2, h3, .product-section, div[class*="size"]');
    elements.forEach(el => {
      if (el.textContent && el.textContent.trim() === 'Seleciona o tamanho') {
        el.style.display = 'none';
        console.log('🚫 Hiding "Seleciona o tamanho" element:', el);
      }
    });
  };
  
  // Run immediately
  hideOnlySizeDrawers();
  
  // Run after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideOnlySizeDrawers);
  }
  
  // Run periodically but only for first 2 seconds
  setTimeout(hideOnlySizeDrawers, 100);
  setTimeout(hideOnlySizeDrawers, 500);
  setTimeout(hideOnlySizeDrawers, 1000);
})();

function hideSizeSwatches() {
  console.log('🚫 Targeting only size swatches...');
  
  // Only hide size-related inputs, not all elements
  const sizeValues = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  sizeValues.forEach(size => {
    // Only hide size inputs that are NOT color-related
    const inputs = document.querySelectorAll(`input[value="${size}"]:not([name*="Color"]):not([name*="Cor"]):not([name*="color"]):not([name*="cor"])`);
    inputs.forEach(input => {
      // Double-check this is actually a size input
      if (!input.name.toLowerCase().includes('color') && !input.name.toLowerCase().includes('cor')) {
        input.style.display = 'none';
        input.style.visibility = 'hidden';
        input.style.position = 'absolute';
        input.style.top = '-9999px';
        
        // Only hide parent if it's specifically a size fieldset
        let parent = input.parentElement;
        if (parent && parent.tagName === 'FIELDSET') {
          const legend = parent.querySelector('legend');
          if (legend && (legend.textContent.toLowerCase().includes('size') || legend.textContent.toLowerCase().includes('tamanho'))) {
            parent.style.display = 'none';
            console.log('🚫 Hiding size fieldset:', parent);
          }
        }
        
        console.log('🚫 Hiding size input:', size, input);
      }
    });
    
    // Only hide labels that are specifically for size inputs
    const labels = document.querySelectorAll(`label[for*="${size}"]:not([for*="color"]):not([for*="Color"]):not([for*="cor"])`);
    labels.forEach(label => {
      const forInput = document.getElementById(label.getAttribute('for'));
      if (forInput && !forInput.name.toLowerCase().includes('color') && !forInput.name.toLowerCase().includes('cor')) {
        label.style.display = 'none';
        console.log('🚫 Hiding size label:', label);
      }
    });
  });
}

// Global functions for opening and closing drawer
function openSizeDrawer(sectionId) {
  console.log('🚀 MANUALLY opening size drawer for section:', sectionId);
  
  const drawer = document.getElementById('size-drawer-' + sectionId);
  console.log('📦 Drawer element found:', drawer);
  
  if (drawer) {
    // Make sure we're using the correct product data for THIS page
    const currentProduct = getCurrentProductInfo();
    console.log('🛍️ Current product info:', currentProduct);
    
    // Override the product data with current page product
    if (currentProduct) {
      window['productData_' + sectionId] = {
        variants: currentProduct.variants,
        options: currentProduct.options,
        sectionId: sectionId
      };
      console.log('✅ Updated product data for section:', sectionId);
    }
    
    // Populate sizes based on current color selection
    populateAvailableSizes(sectionId);
    
    // Show drawer manually
    drawer.classList.add('manually-activated');
    drawer.style.display = 'block';
    drawer.style.position = 'fixed';
    drawer.style.top = '0';
    drawer.style.left = '0';
    drawer.style.width = '100vw';
    drawer.style.height = '100vh';
    drawer.style.visibility = 'visible';
    drawer.style.opacity = '1';
    drawer.style.zIndex = '9999999';
    
    // Add active class with delay for animation
    setTimeout(() => {
      drawer.classList.add('active');
      console.log('✅ Drawer should now be active and visible');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    console.log('📱 Size drawer manually opened for section:', sectionId);
  } else {
    console.error('❌ Size drawer not found for section:', sectionId);
  }
}

function getCurrentProductInfo() {
  // Try to get product info from the current page
  const productScripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of productScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Product' || data.variants) {
        console.log('📦 Found product data in page:', data);
        return data;
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  // Try to get from meta tags or other sources
  const productId = document.querySelector('[data-product-id]');
  if (productId) {
    console.log('📦 Found product ID:', productId.dataset.productId);
  }
  
  // Last resort: try to get from global variables
  if (window.product || window.meta?.product) {
    const product = window.product || window.meta.product;
    console.log('📦 Found product in global variables:', product);
    return product;
  }
  
  console.log('❌ Could not find current product info');
  return null;
}

function closeSizeDrawer(sectionId) {
  console.log('🔒 Closing size drawer for section:', sectionId);
  
  const drawer = document.getElementById('size-drawer-' + sectionId);
  if (drawer) {
    drawer.classList.remove('active');
    drawer.classList.remove('manually-activated');
    
    setTimeout(() => {
      drawer.style.display = 'none';
      drawer.style.position = 'absolute';
      drawer.style.top = '-9999px';
      drawer.style.left = '-9999px';
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
  
  console.log('✅ Size options populated.');
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
  
  console.log('🔍 Processing variants for CORRECT product:', productData.variants.length);
  
  productData.variants.forEach((variant, index) => {
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
    
    // If we have a selected color, filter by that color
    if (selectedColor && color && color.toLowerCase() !== selectedColor.toLowerCase()) {
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
  
  return sortedSizes;
}

function isSizeValue(value) {
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+|\d+\/\d+)$/i;
  return sizePattern.test(value);
}

function selectSize(sectionId, sizeData) {
  console.log('📋 Size selected:', sizeData);
  
  if (sizeData.available) {
    // Update the hidden variant ID input
    const variantInput = document.getElementById('variant-id-' + sectionId);
    if (variantInput) {
      variantInput.value = sizeData.variantId;
      console.log('✅ Updated variant ID to:', sizeData.variantId);
    }
    
    // Add to cart
    setTimeout(() => {
      addToCartAndClose(sectionId);
    }, 100);
  } else {
    alert('Este tamanho não está disponível.');
  }
}

async function addToCartAndClose(sectionId) {
  console.log('🛒 Adding CORRECT product to cart for section:', sectionId);
  
  const variantInput = document.getElementById('variant-id-' + sectionId);
  const chooseSizeBtn = document.getElementById('ChooseSizeButton-' + sectionId);
  
  if (!variantInput || !variantInput.value) {
    alert('Por favor, selecione um tamanho válido.');
    return;
  }
  
  // Show loading state
  if (chooseSizeBtn) {
    chooseSizeBtn.querySelector('span').textContent = 'Adicionando...';
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
      console.log('✅ CORRECT product added to cart:', result);
      
      // Close drawer
      closeSizeDrawer(sectionId);
      
      // Update button text
      if (chooseSizeBtn) {
        chooseSizeBtn.querySelector('span').textContent = 'Adicionado!';
        chooseSizeBtn.style.background = '#28a745';
      }
      
      // Reset button after delay
      setTimeout(() => {
        if (chooseSizeBtn) {
          chooseSizeBtn.querySelector('span').textContent = 'Escolher tamanho';
          chooseSizeBtn.disabled = false;
          chooseSizeBtn.style.background = '';
        }
      }, 2000);
      
    } else {
      throw new Error(result.message || 'Erro ao adicionar ao carrinho');
    }
    
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    alert('Erro ao adicionar produto ao carrinho');
    
    // Reset button
    if (chooseSizeBtn) {
      chooseSizeBtn.querySelector('span').textContent = 'Escolher tamanho';
      chooseSizeBtn.disabled = false;
    }
  }
}

// Listen for DOM ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Size drawer JavaScript DOM loaded - TARGETED VERSION');
  
  // Only hide size-specific elements
  setTimeout(hideSizeSwatches, 100);
  
  // Listen for color variant changes
  const colorInputs = document.querySelectorAll('input[name*="Color"], input[name*="Cor"]');
  colorInputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log('🎨 Color changed to:', this.value);
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
      const activeDrawer = document.querySelector('.size-drawer.active');
      if (activeDrawer) {
        const sectionId = activeDrawer.id.replace('size-drawer-', '');
        closeSizeDrawer(sectionId);
      }
    }
  });
});

console.log('✅ Size drawer JavaScript loaded - TARGETED HIDE VERSION');