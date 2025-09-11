document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('[data-wishlist-button]');
  const loginModal = document.getElementById('wishlist-login-modal');
  const closeBtn = loginModal?.querySelector('[data-wishlist-modal-close]');
  closeBtn?.addEventListener('click', () => loginModal.classList.remove('active'));

  let wishlist = new Set();

  async function loadWishlist() {
    try {
      const res = await fetch('/apps/wishlist', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        wishlist = new Set(data.items.map(it => `${it.product_id}:${it.variant_id}`));
        buttons.forEach(btn => {
          const key = `${btn.dataset.productId}:${btn.dataset.variantId || ''}`;
          if (wishlist.has(key)) btn.classList.add('is-active');
        });
      }
    } catch (e) {}
  }

  async function toggle(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId || '';
    const handle = button.dataset.handle || '';
    const title = button.dataset.title || '';
    const image = button.dataset.image || '';
    const key = `${productId}:${variantId}`;

    const active = button.classList.contains('is-active');
    const method = active ? 'DELETE' : 'POST';
    const url = active
      ? `/apps/wishlist?product_id=${encodeURIComponent(productId)}&variant_id=${encodeURIComponent(variantId)}`
      : '/apps/wishlist';

    const options = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (!active) {
      options.body = JSON.stringify({ product_id: productId, variant_id: variantId, handle, title, image });
    }

    try {
      const res = await fetch(url, options);
      if (res.status === 401) {
        loginModal?.classList.add('active');
        return;
      }
      if (res.ok) {
        if (active) {
          wishlist.delete(key);
          button.classList.remove('is-active');
        } else {
          wishlist.add(key);
          button.classList.add('is-active');
        }
      }
    } catch (e) {}
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => toggle(btn));
  });

  loadWishlist();
});
