class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

static renderProductGridContainer(html) {
  // Replace the ProductGridContainer HTML with the newly fetched one
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const newGridContainer = doc.getElementById('ProductGridContainer');
  const existingGridContainer = document.getElementById('ProductGridContainer');

  if (newGridContainer && existingGridContainer) {
    existingGridContainer.innerHTML = newGridContainer.innerHTML;

    // Cancel scroll-trigger animations on the newly replaced content
    existingGridContainer.querySelectorAll('.scroll-trigger').forEach((element) => {
      element.classList.add('scroll-trigger--cancel');
    });
  }

  // *** IMPORTANT: Reinitialize grid options and product card swipers after updating the grid ***
  if (typeof window.initializeGridOptions === 'function') {
    window.initializeGridOptions();
  }
  if (typeof initializeProductCardSwipers === 'function') {
    initializeProductCardSwipers();
  }
}


  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    // Remove facets that are no longer returned from the server
    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      // Element already rendered in the DOM so just update the innerHTML
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          // Same facet type (eg horizontal/vertical or drawer/mobile)
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
          ? `.mobile-facets__close-button`
          : `.facets__summary`;
        const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('data-min', 0);
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('data-min'));
    const max = Number(input.getAttribute('data-max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);












// ----- Begin Price Slider Integration -----

// Debounce Utility Function (if not already defined)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // Function to parse price strings to float
  const parsePrice = (priceStr) => parseFloat(priceStr.replace(',', '.'));

  // Initialize all price sliders on the page
  document.querySelectorAll('.price-slider').forEach((sliderElement) => {
    // Determine if it's mobile or desktop based on ID prefix
    const isMobile = sliderElement.id.startsWith('Mobile-Filter-');

    // Select corresponding hidden inputs
    const minInput = document.getElementById(`${isMobile ? 'Mobile-Filter-' : 'Filter-'}price_min`);
    const maxInput = document.getElementById(`${isMobile ? 'Mobile-Filter-' : 'Filter-'}price_max`);

    if (!minInput || !maxInput) {
      console.warn(`Missing hidden inputs for slider with ID: ${sliderElement.id}`);
      return;
    }

    // Get initial values
    const initialMin = parsePrice(minInput.value) || 0;
    const initialMax = parsePrice(maxInput.value) || 30; // fallback default

    // Determine the slider's maximum limit from its data attribute
    const dataMax = sliderElement.getAttribute('data-max');
    const sliderMax = dataMax ? parsePrice(dataMax) : initialMax * 2;

    // Create the slider
    noUiSlider.create(sliderElement, {
      start: [initialMin, initialMax],
      connect: true,
      range: {
        'min': 0,
        'max': sliderMax,
      },
      step: 1, // whole euro values
      tooltips: [false, false],
      format: {
        to: (value) => `${parseFloat(value).toFixed(0)}`,
        from: (value) => parseFloat(value),
      },
    });

    // Update hidden inputs and dynamic labels on slider update
    sliderElement.noUiSlider.on('update', (values, handle) => {
      if (handle === 0) {
        minInput.value = parsePrice(values[0]);
        sliderElement.setAttribute('aria-valuenow', parsePrice(values[0]));
        sliderElement.setAttribute('aria-valuetext', `${parsePrice(values[0])} €`);
      } else {
        maxInput.value = parsePrice(values[1]);
        sliderElement.setAttribute('aria-valuenow', parsePrice(values[1]));
        sliderElement.setAttribute('aria-valuetext', `${parsePrice(values[1])} €`);
      }

      // Update the dynamic price labels
      const labelsContainer = sliderElement.parentElement.querySelector('.price-slider__labels');
      if (labelsContainer) {
        const minLabel = labelsContainer.querySelector('.price-slider__min');
        const maxLabel = labelsContainer.querySelector('.price-slider__max');
        if (minLabel) {
          minLabel.innerText = `${parsePrice(values[0])}€`;
        }
        if (maxLabel) {
          maxLabel.innerText = `${parsePrice(values[1])}€`;
        }
      }
    });

    // Submit the form when slider values change (optional)
    sliderElement.noUiSlider.on('change', () => {
      const form = sliderElement.closest('form');
      if (form) {
        form.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // Handle Reset Button Click (if you have a dedicated reset button)
  document.querySelectorAll('.reset-price-slider').forEach((resetButton) => {
    resetButton.addEventListener('click', () => {
      const idPrefix = resetButton.getAttribute('data-id-prefix');
      const sliderElement = document.getElementById(`${idPrefix}PriceRangeSlider`);
      const minInput = document.getElementById(`${idPrefix}price_min`);
      const maxInput = document.getElementById(`${idPrefix}price_max`);

      if (!sliderElement || !minInput || !maxInput) {
        console.warn(`Missing elements for reset button with data-id-prefix: ${idPrefix}`);
        return;
      }

      const defaultMin = parsePrice(minInput.getAttribute('data-default')) || parsePrice(sliderElement.getAttribute('data-min'));
      const defaultMax = parsePrice(maxInput.getAttribute('data-default')) || parsePrice(sliderElement.getAttribute('data-max'));
      
      sliderElement.noUiSlider.set([defaultMin, defaultMax]);

      // Optionally, trigger form submission to apply reset
      const form = sliderElement.closest('form');
      if (form) {
        form.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // Handle Clear Button Click for Price Filters
  document.querySelectorAll('.clear-price-filter').forEach((clearButton) => {
    clearButton.addEventListener('click', () => {
      const idPrefix = clearButton.getAttribute('data-id-prefix');
      const sliderElement = document.getElementById(`${idPrefix}PriceRangeSlider`);
      const minInput = document.getElementById(`${idPrefix}price_min`);
      const maxInput = document.getElementById(`${idPrefix}price_max`);

      if (!sliderElement || !minInput || !maxInput) {
        console.warn(`Missing elements for clear button with data-id-prefix: ${idPrefix}`);
        return;
      }

      const defaultMin = parsePrice(minInput.getAttribute('data-default')) || parsePrice(sliderElement.getAttribute('data-min'));
      const defaultMax = parsePrice(maxInput.getAttribute('data-default')) || parsePrice(sliderElement.getAttribute('data-max'));
      
      sliderElement.noUiSlider.set([defaultMin, defaultMax]);

      // Optionally, trigger form submission to apply reset
      const form = sliderElement.closest('form');
      if (form) {
        form.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
});

// ----- End Price Slider Integration -----


// ----- Begin Remove All Button Adjustment -----

document.addEventListener('DOMContentLoaded', () => {
  // Select the "Remove all" button using the provided selector
  const removeAllButton = document.querySelector('#FacetsWrapperMobile > div.mobile-facets__footer.gradient > facet-remove > a');

  if (removeAllButton) {
    removeAllButton.addEventListener('click', (event) => {
      // Prevent default navigation so we can clear UI state via AJAX
      event.preventDefault();

      // Reset all price sliders to their default values
      document.querySelectorAll('.price-slider').forEach((sliderElement) => {
        // Assume the slider ID is like "<prefix>PriceRangeSlider" – extract prefix by removing "PriceRangeSlider"
        const idPrefix = sliderElement.id.replace('PriceRangeSlider', '');
        const minInput = document.getElementById(`${idPrefix}price_min`);
        const maxInput = document.getElementById(`${idPrefix}price_max`);
        if (minInput && maxInput) {
          const defaultMin = parseFloat(minInput.getAttribute('data-default')) || parseFloat(sliderElement.getAttribute('data-min'));
          const defaultMax = parseFloat(maxInput.getAttribute('data-default')) || parseFloat(sliderElement.getAttribute('data-max'));
          sliderElement.noUiSlider.set([defaultMin, defaultMax]);
        }
      });

      // Remove "active" classes from filter labels (both desktop and mobile) and uncheck any checkboxes
      document.querySelectorAll('.facet__label.active, .mobile-facet__label.active').forEach((el) => {
        el.classList.remove('active');
      });
      document.querySelectorAll('.facet__options input[type="checkbox"]:checked, .mobile-facet__options input[type="checkbox"]:checked').forEach((input) => {
        input.checked = false;
      });

      // Finally, navigate to the "clear all" URL to re-render the filters and product grid in an unfiltered state
      window.location.href = removeAllButton.href;
    });
  } else {
    console.warn('Remove All button not found. Please check the selector.');
  }
});

// ----- End Remove All Button Adjustment -----

