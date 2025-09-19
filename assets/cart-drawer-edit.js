(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  function parseJSONAttr(el, name, fallback) {
    try { return JSON.parse(el.getAttribute(name) || ''); } catch(e){ return fallback; }
  }

  function uniq(arr){ return [...new Set(arr)]; }
  function money(cents){ try { return new Intl.NumberFormat(undefined, {style:'currency', currency: Shopify?.currency?.active}).format(cents/100); } catch(e){ return (cents/100).toFixed(2); } }

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

  function buildOptions(container, product, selected){
    container.innerHTML = '';
    (product.options || []).forEach((name, iIdx) => {
      const idx = iIdx + 1;
      const wrap = document.createElement('div');
      wrap.className = 'il-opt';
      const label = document.createElement('div');
      label.className = 'il-opt__name';
      label.textContent = name;
      wrap.appendChild(label);

      const isColor = /color|cor|couleur|farbe/i.test(name);
      const values = optionValues(product, idx);
      const list = document.createElement('div');
      list.className = isColor ? 'il-swatches' : 'il-pills';

      values.forEach(val => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isColor ? 'il-swatch' : 'il-pill';
        btn.dataset.optIndex = String(idx);
        btn.dataset.value = val;

        if(isColor){
          const lower = val.toLowerCase().trim();
          btn.title = val;
          btn.style.background = lower;
          const withImg = (product.variants || []).find(v => v['option'+idx] === val && v.featured_image?.src);
          if(withImg){
            btn.classList.add('is-image');
            btn.style.backgroundImage = `url(${withImg.featured_image.src})`;
          }
        } else {
          btn.textContent = val;
        }

        if(selected[idx] === val) btn.classList.add('is-selected');
        btn.addEventListener('click', () => {
          qsa(`[data-opt-index="${idx}"]`, list).forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          selected[idx] = val;
          const v = findVariant(product, selected);
          container.dispatchEvent(new CustomEvent('variant:change', {detail: {variant: v, selected}}));
        });

        list.appendChild(btn);
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
          <button class="il-cart-edit__close" data-close>×</button>
          <div class="il-cart-edit__gallery" data-gallery></div>
          <div class="il-cart-edit__info">
            <h3 class="il-cart-edit__title" data-title></h3>
            <div class="il-cart-edit__price" data-price></div>
            <div class="il-cart-edit__options" data-options></div>
            <div class="il-cart-edit__qty">
              <span>Quantidade</span>
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

  function openEditor(hostEl){
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
    price.textContent = variant ? money((variant.price*100) || variant.price || 0) : '';
    qtyInput.value = String(qty);

    buildGallery(gallery, product);
    const selected = {1: variant?.option1, 2: variant?.option2, 3: variant?.option3};
    buildOptions(options, product, selected);

    const onChange = (ev) => { const v = ev.detail.variant; if(v) price.textContent = money((v.price*100) || v.price || 0); };
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
            alert('Esta combinação está indisponível.');
            return;
          }
          // Add first, then remove old line only if add succeeded
          const addRes = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: chosen.id, quantity: newQty, properties: parseJSONAttr(hostEl, 'data-properties', {}) })
          });
          if(!addRes.ok){
            let msg = 'Não foi possível adicionar o artigo.';
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
      } catch(err){ console.error('Cart update failed', err); alert('Não foi possível atualizar o artigo.'); }
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
      attachHandlers(drawer || document);
      drawer?.open();
    } catch(e){ console.error('Section render failed', e); location.reload(); }
  }

  function attachHandlers(root=document){
    // Edit
    qsa('.il-cart-line__edit', root).forEach(btn => {
      btn.addEventListener('click', () => {
        const host = btn.closest('[data-line-key]');
        if(host) openEditor(host);
      });
    });
    // Optional extra remove icon
    qsa('.il-cart-line__remove', root).forEach(btn => {
      btn.addEventListener('click', async () => {
        const host = btn.closest('[data-line-key]');
        const key = host?.getAttribute('data-line-key');
        if(!key) return;
        await fetch('/cart/change.js', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ id: key, quantity: 0 }) });
        await refreshCartDrawer();
      });
    });
    // Move to favorites
    qsa('[data-move-to-wishlist]', root).forEach(btn => {
      btn.addEventListener('click', async () => {
        const host = btn.closest('[data-line-key]');
        const prod = parseJSONAttr(host, 'data-product', {});
        const variantId = Number(host.getAttribute('data-variant-id'));
        const key = host.getAttribute('data-line-key');
        try{
          await fetch('/apps/wishlist', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ product_id: prod.id, variant_id: variantId || '', handle: prod.handle, title: prod.title, image: (prod.images && prod.images[0]) || prod.featured_image }) });
          await fetch('/cart/change.js', { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify({ id: key, quantity: 0 }) });
          await refreshCartDrawer();
        } catch(e){ console.error('Move to wishlist failed', e); alert('Não foi possível mover para favoritos.'); }
      });
    });
  }

  function getDrawerRoot(){
    // Support themes that render the drawer as a Section wrapper or as a plain snippet
    return document.getElementById('shopify-section-cart-drawer') || document.querySelector('cart-drawer') || document.body;
  }

  function observeDrawer(){
    const root = getDrawerRoot();
    if(!root) return;
    attachHandlers(root);
    const mo = new MutationObserver(() => attachHandlers(root));
    mo.observe(root, {subtree:true, childList:true});

    // Safety: event delegation so edits still work even if we miss a rebind
    if(!window.__IL_CART_EDIT_BOUND__){
      window.__IL_CART_EDIT_BOUND__ = true;
      document.addEventListener('click', (ev) => {
        const editBtn = ev.target.closest && ev.target.closest('.il-cart-line__edit');
        if(editBtn){
          const host = editBtn.closest('[data-line-key]') || getDrawerRoot();
          if(host && host !== document.body){
            ev.preventDefault();
            openEditor(host);
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
