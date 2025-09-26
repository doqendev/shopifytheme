// Size Drawer Functionality

// Global functions for opening and closing drawer
function openSizeDrawer(sectionId) {
  const drawer = document.getElementById('size-drawer-' + sectionId);
  if (drawer) {
    // Populate sizes based on current color selection
    populateAvailableSizes(sectionId);
    
    // Show drawer
    drawer.style.display = 'block';
    setTimeout(() => {
      drawer.classList.add('active');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    console.log('Size drawer opened for section:', sectionId);
  }
}

function closeSizeDrawer(sectionId) {
  const drawer = document.getElementById('size-drawer-' + sectionId);
  if (drawer) {
    drawer.classList.remove('active');
    
    setTimeout(() => {
      drawer.style.display = 'none';
    }, 300);
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    console.log('Size drawer closed for section:', sectionId);
  }
}

function populateAvailableSizes(sectionId) {
  const productData = window['productData_' + sectionId];
  const sizeContainer = document.getElementById('size-options-' + sectionId);
  
  if (!productData || !sizeContainer) {
    console.error('Missing product data or size container for section:', sectionId);
    return;
  }
  
  // Get currently selected color
  const selectedColor = getCurrentlySelectedColor();
  console.log('Selected color:', selectedColor);
  
  // Clear existing size options
  sizeContainer.innerHTML = '';
  
  // Get unique sizes available for the selected color (or all sizes if no color selected)
  const availableSizes = getAvailableSizesForColor(productData, selectedColor);
  console.log('Available sizes:', availableSizes);
  
  // Create size option buttons
  availableSizes.forEach(sizeData => {
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
      button.addEventListener('click', () => selectSize(sectionId, sizeData));
    }
    
    sizeContainer.appendChild(button);
  });
  
  if (availableSizes.length === 0) {
    sizeContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Não há tamanhos disponíveis para esta cor.</p>';
  }
}

function getCurrentlySelectedColor() {
  // Look for selected color in various possible selectors
  const colorSelectors = [
    'input[name*="Color"]:checked',
    'input[name*="Cor"]:checked', 
    'input[name*="color"]:checked',
    'input[name*="cor"]:checked',
    '[data-selected-color]'
  ];
  
  for (const selector of colorSelectors) {
    const colorInput = document.querySelector(selector);
    if (colorInput) {
      return colorInput.value || colorInput.dataset.selectedColor || colorInput.textContent.trim();
    }
  }
  
  // Try to get from variant picker
  const variantRadios = document.querySelectorAll('input[type="radio"]:checked');
  for (const radio of variantRadios) {
    if (radio.name.toLowerCase().includes('color') || radio.name.toLowerCase().includes('cor')) {
      return radio.value;
    }
  }
  
  return null;
}

function getAvailableSizesForColor(productData, selectedColor) {
  const sizesMap = new Map();
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  productData.variants.forEach(variant => {
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
  
  return sizesArray.sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.size);
    const bIndex = sizeOrder.indexOf(b.size);
    
    if (aIndex === -1 && bIndex === -1) {
      return a.size.localeCompare(b.size);
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}

function isSizeValue(value) {
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+|\d+\/\d+)$/i;
  const sizeKeywords = ['size', 'tamanho', 'talla'];
  
  return sizePattern.test(value) || 
         sizeKeywords.some(keyword => value.toLowerCase().includes(keyword));
}

function selectSize(sectionId, sizeData) {
  console.log('Size selected:', sizeData);
  
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
      console.log('Updated variant ID to:', sizeData.variantId);
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
  const variantInput = document.getElementById('variant-id-' + sectionId);
  const chooseSizeBtn = document.getElementById('ChooseSizeButton-' + sectionId);
  
  if (!variantInput || !variantInput.value) {
    alert('Por favor, selecione um tamanho válido.');
    return;
  }
  
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
      console.log('Product added to cart:', result);
      
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
      console.error('Add to cart error:', result);
      throw new Error(result.message || result.description || 'Erro ao adicionar ao carrinho');
    }
    
  } catch (error) {
    console.error('Error adding to cart:', error);
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
      console.log('Cart updated:', cart);
      
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
      console.error('Error updating cart UI:', error);
    });
}

// Listen for color changes to update available sizes
document.addEventListener('DOMContentLoaded', function() {
  // Listen for color variant changes
  const colorInputs = document.querySelectorAll('input[name*="Color"], input[name*="Cor"], input[name*="color"], input[name*="cor"]');
  
  colorInputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log('Color changed to:', this.value);
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
      const activeDrawer = document.querySelector('.size-drawer.active');
      if (activeDrawer) {
        const sectionId = activeDrawer.id.replace('size-drawer-', '');
        closeSizeDrawer(sectionId);
      }
    }
  });
});

console.log('Size drawer JavaScript loaded successfully');