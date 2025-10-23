(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  function parseJSONAttr(el, name, fallback) {
    try { return JSON.parse(el.getAttribute(name) || ''); } catch(e){ return fallback; }
  }

  function uniq(arr){ return [...new Set(arr)]; }
  function money(cents){ try { return new Intl.NumberFormat(undefined, {style:'currency', currency: Shopify?.currency?.active}).format(cents/100); } catch(e){ return (cents/100).toFixed(2); } }
  const COLOR_LABEL_PATTERN = /(\bcolor\b|\bcolour\b|\bcor\b|\bfarbe\b)/i;
  const SIZE_LABEL_PATTERN = /(\bsize\b|\btamanho\b|\btalla\b|\btaille\b)/i;

  function normalizeOptionValue(value){
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  function getMediaSource(entry){
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    if (typeof entry === 'object'){
      if (entry.preview_image) {
        const preview = getMediaSource(entry.preview_image);
        if (preview) return preview;
      }
      return (
        entry.currentSrc ||
        entry.src ||
        entry.url ||
        entry.original_src ||
        entry.image ||
        entry.small_url ||
        ''
      );
    }
    return '';
  }

  function extractImageFromMarkup(markup){
    if (typeof markup !== 'string' || !markup.trim()) return '';
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    const img =
      template.content.querySelector('img') ||
      template.content.querySelector('[data-src], [data-srcset]');
    if (!img) return '';
    return (
      img.currentSrc ||
      img.src ||
      img.getAttribute('src') ||
      img.getAttribute('data-srcset') ||
      img.getAttribute('data-src') ||
      ''
    );
  }


  function findOptionIndexByPattern(product, pattern){
    if (!product || !Array.isArray(product.options)) return -1;
    const idx = product.options.findIndex(name => typeof name === 'string' && pattern.test(name));
    return idx >= 0 ? idx : -1;
  }

  function buildWishlistVariantOptions(product, variant){
    if (!variant || !product || !Array.isArray(product.options)) return [];
    return product.options.map((_, index) => variant['option' + (index + 1)]);
  }

  function getProductUrlForWishlist(product, host){
    const link = qs('.il-cart-line__title', host);
    if (link && link.getAttribute('href')) return link.getAttribute('href');
    if (product && typeof product.url === 'string' && product.url.trim()) return product.url;
    if (product && typeof product.online_store_url === 'string' && product.online_store_url.trim()) return product.online_store_url;
    if (product && product.handle) return `/products/${product.handle}`;
    return '#';
  }

  function getProductImageForWishlist(product, host){
    if (host){
      const hostImageAttr = host.getAttribute && host.getAttribute('data-product-image');
      if (hostImageAttr && hostImageAttr.trim()) return hostImageAttr.trim();
      const img = qs('.il-cart-line__image img', host);
      if (img) {
        const hostImage =
          img.currentSrc ||
          img.src ||
          img.getAttribute('src') ||
          img.getAttribute('data-srcset') ||
          img.getAttribute('data-src') ||
          '';
        if (hostImage) return hostImage;
      }
    }

    if (product){
      const featuredMedia =
        product.featured_media ||
        product.featured_image ||
        product.image ||
        (Array.isArray(product.media) ? product.media.find(entry => entry && entry.media_type === 'image') : null);
      const featuredSource = getMediaSource(featuredMedia);
      if (featuredSource) return featuredSource;

      const images = product.images;
      if (Array.isArray(images)){
        for (let index = 0; index < images.length; index += 1){
          const candidate = getMediaSource(images[index]);
          if (candidate) return candidate;
        }
      }
    }
    return '';
  }

  function getCardStructureFromPage(handle){
    if (!handle) return null;
    const nodes = Array.from(document.querySelectorAll(`[data-product-handle='${handle}']`));
    const candidate = nodes.find((node) => !node.closest('[data-wishlist-item]')) || nodes[0];
    if (!candidate) return null;
    const wrapper =
      candidate.closest('.product-card-wrapper') ||
      candidate.closest('.card-wrapper') ||
      candidate.closest('.card');
    if (!wrapper) return null;
    const card = wrapper.querySelector('.card');
    if (!card) return null;
    const cardInner = wrapper.querySelector('.card__inner');
    const cardMedia = wrapper.querySelector('.card__media');
    const mediaInner =
      cardMedia?.querySelector(
        '.card__media-inner, .media, .media--transparent, .media--hover-effect, .media--hover-effect-mobile',
      ) || null;
    const cardContent = wrapper.querySelector('.card__content');
    const cardInformation = wrapper.querySelector('.card__information');
    const cardHeading = wrapper.querySelector('.card__heading');
    const priceWrapper = wrapper.querySelector('.card-information') || wrapper.querySelector('.price');
    const clone = wrapper.cloneNode(true);
    const temp = document.createElement('div');
    temp.appendChild(clone);
    return {
      cardMarkup: temp.innerHTML,
      cardWrapperClassName: wrapper.className || '',
      cardClassName: card?.className || '',
      cardInnerClassName: cardInner?.className || '',
      cardInnerStyle: cardInner?.getAttribute('style') || '',
      cardMediaClassName: cardMedia?.className || '',
      cardMediaInnerClassName: mediaInner?.className || '',
      cardContentClassName: cardContent?.className || '',
      cardInformationClassName: cardInformation?.className || '',
      cardHeadingClassName: cardHeading?.className || '',
      cardPriceWrapperClassName: priceWrapper?.className || '',
    };
  }

  function getCardStructureFromTemplate(handle){
    if (!handle) return null;

    // Search for the wishlist card template element
    const template = document.querySelector('[data-wishlist-card-template]');
    if (!template) return null;

    // Get the inner HTML (the rendered card-product)
    const templateMarkup = template.innerHTML.trim();
    if (!templateMarkup) return null;

    // Parse the template markup to extract card structure
    const temp = document.createElement('div');
    temp.innerHTML = templateMarkup;

    // Find the card wrapper inside the template
    const wrapper =
      temp.querySelector('.product-card-wrapper') ||
      temp.querySelector('.card-wrapper') ||
      temp.querySelector('.card');

    if (!wrapper) return null;

    // Extract all the same elements as getCardStructureFromPage
    const card = wrapper.querySelector('.card');
    if (!card) return null;
    const cardInner = wrapper.querySelector('.card__inner');
    const cardMedia = wrapper.querySelector('.card__media');
    const mediaInner =
      cardMedia?.querySelector(
        '.card__media-inner, .media, .media--transparent, .media--hover-effect, .media--hover-effect-mobile',
      ) || null;
    const cardContent = wrapper.querySelector('.card__content');
    const cardInformation = wrapper.querySelector('.card__information');
    const cardHeading = wrapper.querySelector('.card__heading');
    const priceWrapper = wrapper.querySelector('.card-information') || wrapper.querySelector('.price');

    const clone = wrapper.cloneNode(true);
    const tempContainer = document.createElement('div');
    tempContainer.appendChild(clone);

    return {
      cardMarkup: tempContainer.innerHTML,
      cardWrapperClassName: wrapper.className || '',
      cardClassName: card?.className || '',
      cardInnerClassName: cardInner?.className || '',
      cardInnerStyle: cardInner?.getAttribute('style') || '',
      cardMediaClassName: cardMedia?.className || '',
      cardMediaInnerClassName: mediaInner?.className || '',
      cardContentClassName: cardContent?.className || '',
      cardInformationClassName: cardInformation?.className || '',
      cardHeadingClassName: cardHeading?.className || '',
      cardPriceWrapperClassName: priceWrapper?.className || '',
    };
  }

  function buildWishlistItemFromCart(host, product, variantId){
    if (!host || !product) return null;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const numericVariantId = Number(variantId) || 0;
    const variant = variants.find((entry) => Number(entry.id) === numericVariantId) || variants[0] || null;
    const variantImageData =
      variant && typeof variant === 'object' && variant.featured_image
        ? (typeof variant.featured_image === 'string'
            ? variant.featured_image
            : variant.featured_image.src || variant.featured_image.url || variant.featured_image.small_url || '')
        : variant && typeof variant === 'object' && variant.image
        ? (typeof variant.image === 'string' ? variant.image : variant.image.src || variant.image.url || '')
        : '';
    const titleNode = qs('.il-cart-line__title', host);
    const priceNode = qs('.il-cart-line__price', host);
    const colorIndex = findOptionIndexByPattern(product, COLOR_LABEL_PATTERN);
    const sizeIndex = findOptionIndexByPattern(product, SIZE_LABEL_PATTERN);

    const mappedVariants = variants.map((entry) => {
      const variantOptions = buildWishlistVariantOptions(product, entry).map((value) => {
        if (value == null) return '';
        return typeof value === 'string' ? value : String(value);
      });
      const available = entry.available;
      return {
        id: entry.id,
        title: entry.title,
        available: available === undefined ? true : Boolean(available),
        options: variantOptions,
        price: entry.price,
      };
    });

    const primaryVariant = mappedVariants.find((entry) => Number(entry.id) === numericVariantId) || mappedVariants[0] || null;
    const imageSource = variantImageData || getProductImageForWishlist(product, host);
    const wishlistItem = {
      handle: product.handle,
      title: (product.title || (titleNode ? titleNode.textContent || '' : '')).trim(),
      url: getProductUrlForWishlist(product, host),
      image: imageSource,
      price: (priceNode ? priceNode.textContent || '' : '').trim(),
      variants: mappedVariants,
      productId: product.id,
    };

    if (sizeIndex >= 0) {
      wishlistItem.sizeIndex = sizeIndex;
    }

    if (colorIndex >= 0) {
      wishlistItem.colorIndex = colorIndex;
      const colorValueFromPrimary =
        primaryVariant && Array.isArray(primaryVariant.options)
          ? primaryVariant.options[colorIndex]
          : null;
      const fallbackColorValue =
        variant && typeof variant === 'object' ? variant['option' + (colorIndex + 1)] : null;
      const colorValue = colorValueFromPrimary || fallbackColorValue || '';
      if (colorValue) {
        const normalizedColor = normalizeOptionValue(colorValue);
        wishlistItem.colorValue = colorValue;
        wishlistItem.colorKey = normalizedColor;
        wishlistItem.selectedColor = colorValue;
        wishlistItem.color = colorValue;
      }
    }

    if (primaryVariant) {
      wishlistItem.variantId = primaryVariant.id;
    } else if (variant) {
      wishlistItem.variantId = variant.id;
    }

    // Try to get card structure from visible cards on the page (collection pages)
    let cardInfo = getCardStructureFromPage(product.handle);

      // Fallback: if no visible card found, look for template (product pages)
      if (!cardInfo) {
        cardInfo = getCardStructureFromTemplate(product.handle);
      }

      if (!wishlistItem.image && cardInfo && cardInfo.cardMarkup) {
        const markupImage = extractImageFromMarkup(cardInfo.cardMarkup);
        if (markupImage) {
          wishlistItem.image = markupImage;
        }
      }

      if (cardInfo) {
        if (cardInfo.cardMarkup) wishlistItem.cardMarkup = cardInfo.cardMarkup;
        if (cardInfo.cardWrapperClassName) wishlistItem.cardWrapperClassName = cardInfo.cardWrapperClassName;
        if (cardInfo.cardClassName) wishlistItem.cardClassName = cardInfo.cardClassName;
        if (cardInfo.cardInnerClassName) wishlistItem.cardInnerClassName = cardInfo.cardInnerClassName;
        if (cardInfo.cardInnerStyle) wishlistItem.cardInnerStyle = cardInfo.cardInnerStyle;
        if (cardInfo.cardMediaClassName) wishlistItem.cardMediaClassName = cardInfo.cardMediaClassName;
        if (cardInfo.cardMediaInnerClassName) wishlistItem.cardMediaInnerClassName = cardInfo.cardMediaInnerClassName;
        if (cardInfo.cardContentClassName) wishlistItem.cardContentClassName = cardInfo.cardContentClassName;
        if (cardInfo.cardInformationClassName) wishlistItem.cardInformationClassName = cardInfo.cardInformationClassName;
        if (cardInfo.cardHeadingClassName) wishlistItem.cardHeadingClassName = cardInfo.cardHeadingClassName;
        if (cardInfo.cardPriceWrapperClassName) wishlistItem.cardPriceWrapperClassName = cardInfo.cardPriceWrapperClassName;
      }

      return wishlistItem;
    }

  function pushWishlistItem(item){
    if (!item) return false;
    if (window.themeWishlist && typeof window.themeWishlist.addItem === 'function'){
      window.themeWishlist.addItem(item);
      return true;
    }
    document.dispatchEvent(new CustomEvent('theme:wishlist:add', { detail: { item } }));
    return true;
  }

  function removeWishlistItem(item){
    if (!item) return;
    if (window.themeWishlist && typeof window.themeWishlist.removeItem === 'function'){
      window.themeWishlist.removeItem(item);
    }
  }

  async function syncWishlistApp(product, variantId, wishlistItem){
    if (!product || !product.id) return;
    const imageSource = (wishlistItem && wishlistItem.image) || getProductImageForWishlist(product);
    await fetch('/apps/wishlist', {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({
        product_id: product.id,
        variant_id: variantId || (wishlistItem && wishlistItem.variantId) || '',
        handle: product.handle,
        title: product.title,
        image: imageSource || undefined,
      }),
    });
  }


  function optionValues(product, idx){
    return uniq((product.variants || []).map(v => v['option'+idx]).filter(Boolean));
  }
  function findVariant(product, selected){
    return (product.variants || []).find(v =>
      (!selected[1] || v.option1 === selected[1]) &&
      (!selected[2] || v.option2 === selected[2]) &&
      (!selected[3] || v.option3 === selected[3])
    );
  }

  function buildGallery(container, product){
    container.innerHTML = '';
    const imgs = (product.images && product.images.length ? product.images : (product.media || [])).slice(0, 10);
    imgs.forEach(src => {
      const url = typeof src === 'string' ? src : (src.src || src.preview_image?.src);
      if(!url) return;
      const img = new Image();
      img.loading = 'lazy';
      img.src = url;
      container.appendChild(img);
    });
  }

  function normalizeProperties(val){
    if (!val) return {};
    if (Array.isArray(val)) {
      try {
        const asObj = val.reduce((acc, cur) => {
          if (Array.isArray(cur) && cur.length >= 2) acc[cur[0]] = cur[1];
          else if (cur && typeof cur === 'object' && 'name' in cur && 'value' in cur) acc[cur.name] = cur.value;
          return acc;
        }, {});
        return asObj;
      } catch(_) { return {}; }
    }
    if (typeof val !== 'object') return {};
    return val;
  }

  async function buildOptions(container, product, selected){
    container.innerHTML = '';

    // Fetch full product data with swatch information
    let productWithSwatches = product;
    if(product.handle){
      try {
        const response = await fetch(`/products/${product.handle}?view=swatches`);
        if(response.ok){
          const swatchData = await response.json();
          if(swatchData && swatchData.options_with_values){
            productWithSwatches = {...product, options_with_values: swatchData.options_with_values};
          }
        }
      } catch(e){
        console.warn('Could not fetch swatch data', e);
      }
    }

    (product.options || []).forEach((name, iIdx) => {
      const idx = iIdx + 1;
      const wrap = document.createElement('div');
      wrap.className = 'il-opt';

      const isColor = /color|cor|couleur|farbe/i.test(name);
      const values = optionValues(product, idx);
      const list = document.createElement('div');
      list.className = isColor ? 'il-swatches' : 'il-pills';

      values.forEach(val => {
        if(isColor){
          // Create swatch wrapper to match product page structure
          const swatchWrapper = document.createElement('label');
          swatchWrapper.className = 'il-swatch-wrapper';
          swatchWrapper.title = val;

          const swatch = document.createElement('span');
          swatch.className = 'swatch il-swatch-span';
          swatch.dataset.optIndex = String(idx);
          swatch.dataset.value = val;

          // Get swatch data from productWithSwatches if available
          let swatchValue = null;
          if(productWithSwatches.options_with_values){
            const option = productWithSwatches.options_with_values[iIdx];
            if(option && option.values){
              const valueObj = option.values.find(v => (v.value || v) === val);
              if(valueObj && valueObj.swatch){
                if(valueObj.swatch.image && valueObj.swatch.image.src){
                  const imgUrl = valueObj.swatch.image.src;
                  swatchValue = `url(${imgUrl})`;
                } else if(valueObj.swatch.color && valueObj.swatch.color.rgb){
                  swatchValue = `rgb(${valueObj.swatch.color.rgb})`;
                }
              }
            }
          }

          // Fallback to color name if no swatch data
          if(!swatchValue){
            const lower = val.toLowerCase().trim();
            swatchValue = lower;
          }

          swatch.style.setProperty('--swatch--background', swatchValue);
          swatch.style.background = `var(--swatch--background)`;

          // Check if this color option has any available variants
          const tempSelected = {...selected, [idx]: val};
          const testVariant = findVariant(product, tempSelected);
          const isAvailable = testVariant && testVariant.available !== false;

          if(!isAvailable){
            swatchWrapper.classList.add('il-swatch-disabled');
            swatchWrapper.title = `${val} - Esgotado`;
          }

          if(selected[idx] === val) {
            swatchWrapper.classList.add('is-selected');
          }

          swatchWrapper.addEventListener('click', () => {
            if(!isAvailable) return;
            qsa('.il-swatch-wrapper', list).forEach(b => b.classList.remove('is-selected'));
            swatchWrapper.classList.add('is-selected');
            selected[idx] = val;
            const v = findVariant(product, selected);
            container.dispatchEvent(new CustomEvent('variant:change', {detail: {variant: v, selected}}));
          });

          swatchWrapper.appendChild(swatch);
          list.appendChild(swatchWrapper);
        } else {
          // Pills for non-color options
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'il-pill';
          btn.dataset.optIndex = String(idx);
          btn.dataset.value = val;
          btn.textContent = val;

          // Check if this size option has any available variants
          const tempSelected = {...selected, [idx]: val};
          const testVariant = findVariant(product, tempSelected);
          const isAvailable = testVariant && testVariant.available !== false;

          if(!isAvailable){
            btn.classList.add('il-pill-disabled');
            btn.disabled = true;
            btn.title = `${val} - Esgotado`;
          }

          if(selected[idx] === val) btn.classList.add('is-selected');
          btn.addEventListener('click', () => {
            if(!isAvailable) return;
            qsa(`[data-opt-index="${idx}"]`, list).forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            selected[idx] = val;
            const v = findVariant(product, selected);
            container.dispatchEvent(new CustomEvent('variant:change', {detail: {variant: v, selected}}));
          });

          list.appendChild(btn);
        }
      });

      wrap.appendChild(list);
      container.appendChild(wrap);
    });
  }

  function ensureModal(){
    return qs('#il-cart-edit') || (function(){
      const host = document.createElement('div');
      host.id = 'il-cart-edit';
      host.className = 'il-cart-edit';
      host.hidden = true;
      host.innerHTML = `
        <div class="il-cart-edit__backdrop" data-close></div>
        <div class="il-cart-edit__card">
          <button class="il-cart-edit__close" type="button" data-close aria-label="{{ 'accessibility.close' | t }}">
            <span class="svg-wrapper">
              {{- 'icon-close.svg' | inline_asset_content -}}
            </span>
          </button>
          <div class="il-cart-edit__gallery" data-gallery></div>
          <div class="il-cart-edit__info">
            <h3 class="il-cart-edit__title" data-title></h3>
            <div class="il-cart-edit__price" data-price></div>
            <div class="il-cart-edit__options" data-options></div>
            <div class="il-cart-edit__qty">
              <div class="il-stepper">
                <button type="button" class="il-stepper__btn" data-qty-minus>-</button>
                <input type="number" class="il-stepper__input" min="1" value="1" data-qty>
                <button type="button" class="il-stepper__btn" data-qty-plus>+</button>
              </div>
            </div>
            <div class="il-cart-edit__actions">
              <button class="il-cart-edit__save" data-save>Atualizar</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(host);
      return host;
    })();
  }

  async function openEditor(hostEl){
    const modal = ensureModal();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const product = parseJSONAttr(hostEl, 'data-product', {});
    const qty = Number(hostEl.getAttribute('data-qty')) || 1;
    const lineKey = hostEl.getAttribute('data-line-key');
    const currentVariantId = Number(hostEl.getAttribute('data-variant-id'));
    const variant = (product.variants || []).find(v => v.id === currentVariantId) || (product.variants || [])[0];

    const gallery = qs('[data-gallery]', modal);
    const title = qs('[data-title]', modal);
    const price = qs('[data-price]', modal);
    const options = qs('[data-options]', modal);
    const qtyInput = qs('[data-qty]', modal);

    title.textContent = product.title || '';
    price.textContent = variant ? money(variant.price || 0) : '';
    qtyInput.value = String(qty);

    buildGallery(gallery, product);
    const selected = {1: variant?.option1, 2: variant?.option2, 3: variant?.option3};
    await buildOptions(options, product, selected);

    const onChange = (ev) => { const v = ev.detail.variant; if(v) price.textContent = money(v.price || 0); };
    options.addEventListener('variant:change', onChange, {once:false});

    qs('[data-qty-minus]', modal).onclick = () => { qtyInput.value = Math.max(1, (Number(qtyInput.value)||1)-1); };
    qs('[data-qty-plus]',  modal).onclick = () => { qtyInput.value = (Number(qtyInput.value)||1)+1; };

    qs('[data-save]', modal).onclick = async () => {
      const chosen = findVariant(product, selected) || variant;
      const newQty = Number(qtyInput.value) || 1;
      try {
        if (chosen.id === currentVariantId) {
          const res = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: lineKey, quantity: newQty })
          });
          if(!res.ok) throw new Error('change_failed');
        } else {
          if (!chosen || chosen.available === false) {
            alert('Esta combinacao esta indisponivel.');
            return;
          }
          // Add first, then remove old line only if add succeeded
          const addRes = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: chosen.id, quantity: newQty, properties: normalizeProperties(parseJSONAttr(hostEl, 'data-properties', {})) })
          });
          if(!addRes.ok){
            let msg = 'Nao foi possivel adicionar o artigo.';
            try { const j = await addRes.json(); if(j?.description) msg = j.description; } catch(_) {}
            alert(msg);
            return; // keep old line in cart
          }
          const remRes = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: lineKey, quantity: 0 })
          });
          if(!remRes.ok) throw new Error('remove_failed');
        }
        closeEditor(modal);
        await refreshCartDrawer();
      } catch(err){ console.error('Cart update failed', err); alert('Nao foi possivel atualizar o artigo.'); }
    };

    qsa('[data-close]', modal).forEach(b => b.onclick = () => closeEditor(modal));
  }

  function closeEditor(modal){ modal.hidden = true; document.body.style.overflow = ''; }

  async function refreshCartDrawer(){
    // Match theme behavior: use section_id=cart-drawer and swap inner parts
    try{
      const res = await fetch(`${routes?.cart_url || '/cart'}?section_id=cart-drawer`);
      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
      for (const selector of selectors){
        const target = document.querySelector(selector);
        const source = doc.querySelector(selector);
        if(target && source){
          target.replaceWith(source);
        }
      }
      // Update bubble if present
      try{
        const bubbleRes = await fetch(`${routes?.cart_url || '/cart'}?section_id=cart-icon-bubble`);
        const bubbleHtml = await bubbleRes.text();
        const bubbleDoc = new DOMParser().parseFromString(bubbleHtml, 'text/html');
        const targetBubble = document.getElementById('cart-icon-bubble') || document.querySelector('[data-cart-icon-bubble]');
        const sourceBubble = bubbleDoc.querySelector('#cart-icon-bubble') || bubbleDoc.querySelector('[data-cart-icon-bubble]');
        if(targetBubble && sourceBubble){ targetBubble.replaceWith(sourceBubble); }
      } catch(e){}

      // Reopen drawer and rebind
      const drawer = document.querySelector('cart-drawer');
      const docDrawer = doc.querySelector('cart-drawer');
      const docIsEmpty = docDrawer ? docDrawer.classList.contains('is-empty') : false;
      if (drawer) {
        drawer.classList.toggle('is-empty', docIsEmpty);
      }

      // Show or hide empty state and cart items based on cart state
      const emptyState = drawer?.querySelector('.drawer__empty-state');
      const cartDrawerItems = drawer?.querySelector('cart-drawer-items');
      if (docIsEmpty) {
        if (emptyState) emptyState.removeAttribute('hidden');
        if (cartDrawerItems) {
          cartDrawerItems.setAttribute('hidden', '');
          cartDrawerItems.classList.add('is-empty');
        }
      } else {
        if (emptyState) emptyState.setAttribute('hidden', '');
        if (cartDrawerItems) {
          cartDrawerItems.removeAttribute('hidden');
          cartDrawerItems.classList.remove('is-empty');
        }
      }

      drawer?.open();
    } catch(e){ console.error('Section render failed', e); location.reload(); }
  }

  function getDrawerRoot(){
    // Support themes that render the drawer as a Section wrapper or as a plain snippet
    return document.getElementById('shopify-section-cart-drawer') || document.querySelector('cart-drawer') || document.body;
  }

  function observeDrawer(){
    const root = getDrawerRoot();
    if(!root) return;

    // Use event delegation for ALL buttons - much faster and more reliable
    if(!window.__IL_CART_HANDLERS_BOUND__){
      window.__IL_CART_HANDLERS_BOUND__ = true;

      document.addEventListener('click', async (ev) => {
        // Edit button
        const editBtn = ev.target.closest && ev.target.closest('.il-cart-line__edit');
        if(editBtn){
          const host = editBtn.closest('[data-line-key]') || getDrawerRoot();
          if(host && host !== document.body){
            ev.preventDefault();
            openEditor(host);
          }
          return;
        }

        // Remove button
        const removeBtn = ev.target.closest && ev.target.closest('.il-cart-line__remove');
        if(removeBtn){
          const host = removeBtn.closest('[data-line-key]');
          const key = host?.getAttribute('data-line-key');
          if(!key) return;
          ev.preventDefault();

          // Add animation class
          const cartItem = host.closest('.cart-item');
          if(cartItem) cartItem.classList.add('is-removing');

          // Start removal request and animation in parallel
          const removePromise = fetch('/cart/change.js', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ id: key, quantity: 0 }) });

          // Wait for animation to complete (300ms) before refreshing
          await Promise.all([
            removePromise,
            new Promise(resolve => setTimeout(resolve, 300))
          ]);

          await refreshCartDrawer();
          return;
        }

        // Move to favorites button
        const moveBtn = ev.target.closest && ev.target.closest('[data-move-to-wishlist]');
        if(moveBtn){
          if(moveBtn.disabled) return;
          const host = moveBtn.closest('[data-line-key]');
          if (!host) return;
          ev.preventDefault();

          // Add loading overlay to cart item
          const cartItem = host.closest('.cart-item');
          if(cartItem) cartItem.classList.add('is-moving-to-wishlist');

          const prod = parseJSONAttr(host, 'data-product', {});
          const variantIdAttr = host.getAttribute('data-variant-id') || '';
          const key = host.getAttribute('data-line-key');
          const wishlistItem = buildWishlistItemFromCart(host, prod, variantIdAttr);
          let addedToWishlist = false;
          moveBtn.disabled = true;
          try{
            if (wishlistItem) {
              addedToWishlist = pushWishlistItem(wishlistItem);
            }
            if (prod && prod.id) {
              await syncWishlistApp(prod, variantIdAttr, wishlistItem);
            }
            if (key) {
              const removeRes = await fetch('/cart/change.js', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ id: key, quantity: 0 }) });
              if (!removeRes.ok) throw new Error('cart_remove_failed');
            }

            // Wait for animation to complete (300ms) before refreshing
            await new Promise(resolve => setTimeout(resolve, 300));

            await refreshCartDrawer();
          } catch(e){
            // Remove loading overlay if failed
            if(cartItem) cartItem.classList.remove('is-moving-to-wishlist');

            if (addedToWishlist) {
              removeWishlistItem(wishlistItem);
            }
            console.error('Move to wishlist failed', e);
            alert('Nao foi possivel mover para favoritos.');
          }
          finally {
            moveBtn.disabled = false;
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDrawer);
  } else {
    observeDrawer();
  }
})();
