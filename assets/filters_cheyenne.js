// Open the filter drawer
document.getElementById('open-filters')?.addEventListener('click', () => {
  const filterDrawer = document.getElementById('filter-drawer');
  if (filterDrawer) {
    filterDrawer.classList.remove('hidden'); // Show the filter drawer
    filterDrawer.classList.add('open');
  } else {
    console.error("Filter drawer element not found.");
  }
});

// Close the filter drawer
document.querySelector('.close-filter')?.addEventListener('click', () => {
  const filterDrawer = document.getElementById('filter-drawer');
  if (filterDrawer) {
    filterDrawer.classList.remove('open'); // Close the filter drawer
    filterDrawer.classList.add('hidden'); // Hide the filter drawer
  } else {
    console.error("Filter drawer element not found.");
  }
});

// Apply filters via JavaScript
document.getElementById('apply-filters')?.addEventListener('click', () => {
  const selectedTags = getSelectedValues('type-filter'); // Get selected tags
  const selectedColors = getSelectedValues('color-filter'); // Get selected colors
  const selectedSizes = getSelectedValues('size-filter'); // Get selected sizes
  const priceRange = document.getElementById('price-range')?.value || ''; // Get price range

  const queryParams = new URLSearchParams();

  // Build query parameters
  if (selectedTags.length > 0) queryParams.set('tags', selectedTags.join(','));
  if (selectedColors.length > 0) queryParams.set('colors', selectedColors.join(','));
  if (selectedSizes.length > 0) queryParams.set('sizes', selectedSizes.join(','));
  if (priceRange) queryParams.set('price', priceRange);

  // Make an AJAX request to fetch filtered products
  fetchFilteredProducts(queryParams.toString());
});

// Helper function to get selected filter values
function getSelectedValues(filterName) {
  return Array.from(
    document.querySelectorAll(`input[name="${filterName}"]:checked`)
  ).map(el => el.value);
}

// Function to fetch filtered products and update the grid
function fetchFilteredProducts(queryString) {
  const productGrid = document.getElementById('product-grid');
  if (!productGrid) {
    console.error("Product grid element not found.");
    return;
  }

  // Fetch filtered products from Shopify collection
  fetch(`/collections/saldos?${queryString}&view=ajax`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch filtered products.");
      return response.text();
    })
    .then(html => {
      // Update the product grid with the fetched HTML
      productGrid.innerHTML = html;

      // Optionally reattach event listeners or scripts if needed
      console.log("Products successfully updated.");
    })
    .catch(error => {
      console.error("Error fetching filtered products:", error);
    });
}

// Debugging Utility
document.addEventListener('DOMContentLoaded', () => {
  const debugInfo = {
    tags: getSelectedValues('type-filter'),
    colors: getSelectedValues('color-filter'),
    sizes: getSelectedValues('size-filter'),
    price: document.getElementById('price-range')?.value || '',
  };

  console.log('Debug Info:', debugInfo);
});
