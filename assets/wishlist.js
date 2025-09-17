(() => {
  // Using App Proxy: same-origin calls to /apps/wishlist (Shopify forwards to your server /proxy/wishlist)
  const apiBase = "/apps/wishlist";

  // UI helpers
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const setActive = (btn, active) => {
    btn.classList.toggle("is-active", !!active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.setAttribute("aria-label", active ? "Remove from wishlist" : "Add to wishlist");
  };
  const btnPayload = (btn) => ({
    product_id: btn.dataset.productId,
    variant_id: btn.dataset.variantId || "",
    handle: btn.dataset.handle || "",
    title: btn.dataset.title || "",
    image: btn.dataset.image || ""
  });

  // Modal (login prompt)
  function openModal(){
    const m = document.getElementById("il-wishlist-modal"); if(!m) return;
    m.hidden = false;
    m.querySelectorAll("[data-il-close]").forEach(b => b.addEventListener("click", closeModal, { once:true }));
    document.addEventListener("keydown", escClose, { once:true });
  }
  function closeModal(){
    const m = document.getElementById("il-wishlist-modal"); if(!m) return;
    m.hidden = true; document.removeEventListener("keydown", escClose);
  }
  function escClose(e){ if(e.key === "Escape") closeModal(); }

  // API calls via App Proxy
  async function fetchWishlist(){
    const res = await fetch(`${apiBase}`, { method: "GET", credentials: "same-origin" });
    if (res.status === 401) return { loggedIn:false, items:[] };
    if (!res.ok) return { loggedIn:true, items:[] };
    const data = await res.json();
    return { loggedIn:true, items: data.items || [] };
  }
  async function addToWishlist(payload){
    const res = await fetch(`${apiBase}`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"same-origin",
      body: JSON.stringify(payload)
    });
    if (res.status === 401) return { ok:false, auth:false };
    return { ok:res.ok, auth:true };
  }
  async function removeFromWishlist(product_id, variant_id=""){
    const url = new URL(apiBase, window.location.origin);
    url.searchParams.set("product_id", product_id);
    if (variant_id) url.searchParams.set("variant_id", variant_id);
    const res = await fetch(url.toString(), { method:"DELETE", credentials:"same-origin" });
    if (res.status === 401) return { ok:false, auth:false };
    return { ok:res.ok, auth:true };
  }

  async function syncStateFromServer(){
    const { loggedIn, items } = await fetchWishlist();
    if (!loggedIn) return; // leave all hearts empty
    const set = new Set(items.map(i => String(i.product_id) + "::" + (i.variant_id || "")));
    qsa(".il-wishlist-btn").forEach(btn => {
      const key = String(btn.dataset.productId) + "::" + (btn.dataset.variantId || "");
      setActive(btn, set.has(key));
    });
  }

  async function onClickHeart(e){
    const btn = e.currentTarget;
    const active = btn.classList.contains("is-active");
    const { product_id, variant_id } = btnPayload(btn);

    // Optimistic UI
    setActive(btn, !active);

    const outcome = active
      ? await removeFromWishlist(product_id, variant_id)
      : await addToWishlist(btnPayload(btn));

    if (!outcome.ok) {
      setActive(btn, active); // revert
      if (outcome.auth === false) openModal();
    }
  }

  function initHearts(){
    qsa(".il-wishlist-btn").forEach(btn => {
      if (btn.dataset.init) return;
      btn.dataset.init = "1";
      btn.addEventListener("click", onClickHeart, { passive:true });
      setActive(btn, false);
    });
  }

  // Handle dynamic sections / SPA-like theme updates
  const observer = new MutationObserver(() => initHearts());
  observer.observe(document.documentElement, { childList:true, subtree:true });

  document.addEventListener("DOMContentLoaded", async () => {
    initHearts();
    await syncStateFromServer();
  });
})();
