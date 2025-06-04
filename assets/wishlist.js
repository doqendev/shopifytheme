console.log('[Wishlist] script loaded; customerLoggedIn=', window.customerLoggedIn);

const PROXY_ENDPOINT = '/apps/wishlist';

// --- Drawer overlay logic ---
function showLoginDrawer() {
  let drawer = document.getElementById('wishlist-login-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'wishlist-login-drawer';
    drawer.innerHTML = `
      <div class="drawer-bg"></div>
      <div class="drawer-content">
        <button class="drawer-close" aria-label="Fechar" type="button">&#10005;</button>
        <img src="https://cdn.shopify.com/s/files/1/0911/7843/4884/files/favoritos_banner.png?v=1747393749" alt="" class="drawer-img">
        <div class="drawer-msg">
          Entre ou registe-se para adicionar este produto à sua lista de favoritos e desfrutar de todas as funcionalidades.
        </div>
        <a href="/account/login?return_url=${encodeURIComponent(window.location.pathname)}" class="drawer-btn">INICIAR SESSÃO</a>
      </div>
    `;
    document.body.appendChild(drawer);

    // Close drawer on background click or X
    drawer.querySelector('.drawer-bg').onclick = () => drawer.style.display = 'none';
    drawer.querySelector('.drawer-close').onclick = () => drawer.style.display = 'none';
  }
  drawer.style.display = 'flex';
}

// --- Load wishlist for product buttons ---
async function loadWishlistFromBackend() {
  const res = await fetch(`${PROXY_ENDPOINT}?action=get`, { credentials: 'include' });
  const data = await res.json();
  return data.products || [];
}

document.addEventListener('DOMContentLoaded', async () => {
  const wishlist = new Set();

  let products = [];
  try {
    products = await loadWishlistFromBackend();
    products.forEach(handle => wishlist.add(handle));
  } catch (e) {
    console.error('[Wishlist] error loading wishlist:', e);
  }

  // Update all wishlist buttons based on loaded state
  document.querySelectorAll('.product-card[data-product-handle]').forEach(card => {
    const handle = card.dataset.productHandle;
    const btn = card.querySelector('.wishlist-toggle');
    if (btn) updateButton(btn, wishlist.has(handle));
  });

  // --- Heart button (single click) ---
  document.body.addEventListener('click', async e => {
    const btn = e.target.closest('.wishlist-toggle');
    if (!btn) return;

    console.log('[Wishlist] ❤️ clicked');

    // If not logged in, show drawer
    if (!window.customerLoggedIn) {
      showLoginDrawer();
      return;
    }

    const card = btn.closest('.product-card');
    const handle = card.dataset.productHandle;
    handleWishlistToggle(card, handle, wishlist, btn);
  });

  // --- Double click/double tap anywhere on product card ---
  document.querySelectorAll('.product-card[data-product-handle]').forEach(card => {
    let lastTap = 0;

    // Double click for desktop
    card.addEventListener('dblclick', e => {
      // Don’t fire if clicking the heart directly (handled above)
      if (e.target.closest('.wishlist-toggle')) return;

      const handle = card.dataset.productHandle;
      const btn = card.querySelector('.wishlist-toggle');
      handleWishlistToggle(card, handle, wishlist, btn);
    });

    // Double tap for mobile (custom logic)
    card.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTap < 450) { // 450ms is a typical double-tap window
        // Don’t fire if tapping the heart
        if (e.target.closest('.wishlist-toggle')) return;
        e.preventDefault();
        const handle = card.dataset.productHandle;
        const btn = card.querySelector('.wishlist-toggle');
        handleWishlistToggle(card, handle, wishlist, btn);
      }
      lastTap = now;
    });
  });

  // --- Toggle wishlist logic, reusable for heart/double-tap ---
  async function handleWishlistToggle(card, handle, wishlist, btn) {
    if (!window.customerLoggedIn) {
      showLoginDrawer();
      return;
    }
    const isAdding = !wishlist.has(handle);
    try {
      const url = `${PROXY_ENDPOINT}?action=${isAdding ? 'add' : 'remove'}&handle=${encodeURIComponent(handle)}`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await res.json();
      if (result.error && result.error.toLowerCase().includes('not logged')) {
        showLoginDrawer();
        return;
      }
      wishlist[isAdding ? 'add' : 'delete'](handle);
      if (btn) updateButton(btn, isAdding);
    } catch (err) {
      console.error('[Wishlist] error:', err);
    }
  }

  function updateButton(btn, active) {
    if (!btn) return;
    const empty = btn.querySelector('.empty');
    const filled = btn.querySelector('.filled');
    if (empty) empty.style.display = active ? 'none' : '';
    if (filled) filled.style.display = active ? '' : 'none';
    btn.setAttribute('aria-pressed', !!active);
  }
});

// --- Minimalist Drawer styles ---
const drawerStyles = `
#wishlist-login-drawer {
  position: fixed; z-index: 9999; inset: 0; display: none; align-items: center; justify-content: center;
  background: rgba(40,40,40,0.09);
}
#wishlist-login-drawer .drawer-bg {
  position: absolute; inset: 0; background: transparent; cursor: pointer;
}
#wishlist-login-drawer .drawer-content {
  position: relative;
  background: #fff;
  border-radius: 0px;
  width: 98vw;
  max-width: 340px;
  box-shadow: 0 4px 28px 0 rgba(30,32,37,.10), 0 1.5px 6px 0 rgba(0,0,0,0.08);
  text-align: center;
  padding: 34px 18px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: pop-in .22s cubic-bezier(.42,0,0,1);
}
#wishlist-login-drawer .drawer-close {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  font-size: 1em;
  color: #555;
  cursor: pointer;
  font-weight: 400;
  z-index: 5;
  padding: 0;
  line-height: 1;
  transition: color .16s;
}
#wishlist-login-drawer .drawer-close:hover {
  color: #000;
}
#wishlist-login-drawer .drawer-img {
  width: 100%;
  border-radius: 0px;
  margin-bottom: 15px;
  object-fit: cover;
}
#wishlist-login-drawer .drawer-msg {
  color: #232526;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 18px;
  font-weight: 400;
}
#wishlist-login-drawer .drawer-btn {
  display: inline-block;
  width: 100%;
  max-width: 230px;
  padding: 12px 0;
  margin: 0 auto;
  background: #232526;
  color: #fff;
  border-radius: 0px;
  font-weight: 100;
  font-size: 1em;
  letter-spacing: 0.04em;
  text-decoration: none;
  border: none;
  transition: background .16s;
  box-shadow: 0 1.5px 6px 0 rgba(0,0,0,0.06);
}
#wishlist-login-drawer .drawer-btn:hover {
  background: #313135;
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.96);}
  to   { opacity: 1; transform: scale(1);}
}
@media (max-width: 430px) {
  #wishlist-login-drawer .drawer-content { max-width: 97vw; padding: 24px 3vw 14px 3vw; }
  #wishlist-login-drawer .drawer-img { max-height: 400px;}
  #wishlist-login-drawer .drawer-msg { font-size: 0.7em; font-weight: 100; }
}
`;
const styleTag = document.createElement('style');
styleTag.textContent = drawerStyles;
document.head.appendChild(styleTag);
