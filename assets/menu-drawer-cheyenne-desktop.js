document.addEventListener("DOMContentLoaded", () => {
  // Only run on desktop viewports (≥768px). Otherwise bail out.
  if (window.innerWidth < 768) return;

  // Initialize AOS (if you’re using it)
  if (typeof AOS !== 'undefined') AOS.init();

  // (A) Grab the top navigation links (they’re hidden in the header via CSS on desktop)
  const navLinks = document.querySelectorAll(".nav-menu-new a");
  const menuDrawer = document.querySelector("#menu-drawer");
  const menuDrawerContent = menuDrawer
    ? menuDrawer.querySelector(".menu-drawer__inner-container")
    : null;
  const detailsElement = menuDrawer ? menuDrawer.closest("details") : null;

  if (!menuDrawerContent) return; // Nothing to do if drawer container isn’t present.

  // (B) Clone & prepend the hidden .nav-menu-new into the drawer so it appears at the top
  const navMenuContainer = document.querySelector(".nav-menu-new");
  if (navMenuContainer) {
    const cloneNav = navMenuContainer.cloneNode(true);
    cloneNav.classList.add("moved-into-drawer");
    cloneNav.style.display = 'flex'; // Ensure it's visible in drawer
    menuDrawerContent.prepend(cloneNav);
  }

  // (C) Define the three category menus (identical to mobile version)
  const menus = {
    "women-menu": `
      <nav class="menu-drawer__navigation">
        <ul class="menu-drawer__menu list-menu" role="list">
          <li class="menu-item saldos-item">
            <a href="/collections/saldos" class="menu-link saldos-link">SALDOS</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item saldos-item">
            <a href="/collections/novidades" class="menu-link novidades-link">NOVIDADES</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              ROUPA
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/women-dresses">VESTIDOS</a></li>
                <li><a href="/collections/women-tops">BLUSAS</a></li>
                <li><a href="/collections/women-shoes">CALÇAS</a></li>
              </ul>
            </div>
          </li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              CALÇADO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/shoes-sneakers">SAPATILHAS</a></li>
                <li><a href="/collections/shoes-boots">BOTAS</a></li>
                <li><a href="/collections/shoes-sandals">SANDÁLIAS</a></li>
              </ul>
            </div>
          </li>
          <li><a href="/collections/malas-mochilas" class="menu-link">MALAS | MOCHILAS</a></li>
          <li><a href="/collections/acessorios" class="menu-link">ACESSÓRIOS</a></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link info-item">
              + INFO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/encomenda">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/collections/trocas">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/collections/envio">ENVIO</a></li>
                <li><a href="/collections/faqs">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/collections/lojas">LOJAS</a></li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    `,
    "homem-menu": `
      <nav class="menu-drawer__navigation">
        <ul class="menu-drawer__menu list-menu" role="list">
          <li class="menu-item saldos-item">
            <a href="/collections/homem-saldos" class="menu-link saldos-link">SALDOS</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item saldos-item">
            <a href="/collections/homem-novidades" class="menu-link novidades-link">NOVIDADES</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              ROUPA
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/homem-shirts">CAMISAS</a></li>
                <li><a href="/collections/homem-pants">CALÇAS</a></li>
                <li><a href="/collections/homem-jackets">CASACOS</a></li>
              </ul>
            </div>
          </li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              CALÇADO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/homem-sneakers">SAPATILHAS</a></li>
                <li><a href="/collections/homem-boots">BOTAS</a></li>
                <li><a href="/collections/homem-formal-shoes">SAPATOS</a></li>
              </ul>
            </div>
          </li>
          <li><a href="/collections/homem-malas" class="menu-link">MALAS | MOCHILAS</a></li>
          <li><a href="/collections/homem-acessorios" class="menu-link">ACESSÓRIOS</a></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link info-item">
              + INFO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/homem-encomenda">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/collections/homem-trocas">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/collections/homem-envio">ENVIO</a></li>
                <li><a href="/collections/homem-faqs">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/collections/homem-lojas">LOJAS</a></li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    `,
    "crianca-menu": `
      <nav class="menu-drawer__navigation">
        <ul class="menu-drawer__menu list-menu" role="list">
          <li class="menu-item saldos-item">
            <a href="/collections/crianca-saldos" class="menu-link saldos-link">SALDOS</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item saldos-item">
            <a href="/collections/crianca-novidades" class="menu-link novidades-link">NOVIDADES</a>
          </li>
          <li class="menu-separator"></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              ROUPA
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/crianca-shirts">CAMISAS</a></li>
                <li><a href="/collections/crianca-pants">CALÇAS</a></li>
                <li><a href="/collections/crianca-jackets">CASACOS</a></li>
              </ul>
            </div>
          </li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link">
              CALÇADO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/crianca-sneakers">SAPATILHAS</a></li>
                <li><a href="/collections/crianca-boots">BOTAS</a></li>
                <li><a href="/collections/crianca-formal-shoes">SAPATOS</a></li>
              </ul>
            </div>
          </li>
          <li><a href="/collections/crianca-malas" class="menu-link">MALAS | MOCHILAS</a></li>
          <li><a href="/collections/crianca-acessorios" class="menu-link">ACESSÓRIOS</a></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link info-item">
              + INFO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="/collections/crianca-encomenda">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/collections/crianca-trocas">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/collections/crianca-envio">ENVIO</a></li>
                <li><a href="/collections/crianca-faqs">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/collections/crianca-lojas">LOJAS</a></li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    `
  };

  const MENU_STORAGE_KEY = 'menuDrawerActiveMenu';
  const DEFAULT_MENU_KEY = 'women-menu';
  const MENU_KEY_TO_CATEGORY = {
    'women-menu': 'mulher',
    'homem-menu': 'homem',
    'crianca-menu': 'crianca',
  };

  const getStoredMenuKey = () => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return DEFAULT_MENU_KEY;
    }
    try {
      const stored = window.localStorage.getItem(MENU_STORAGE_KEY);
      if (stored && Object.prototype.hasOwnProperty.call(menus, stored)) {
        return stored;
      }
    } catch (error) {
      // Ignore storage access issues
    }
    return DEFAULT_MENU_KEY;
  };

  const persistMenuKey = (key) => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    if (!Object.prototype.hasOwnProperty.call(menus, key)) return;
    try {
      window.localStorage.setItem(MENU_STORAGE_KEY, key);
    } catch (error) {
      // Ignore persistence issues
    }
  };

  const initialMenuKey = getStoredMenuKey();

  // (D) Append the “CONTA” link at the bottom of whichever menu is active.
  function appendAuthLink() {
    const isLoggedIn = window.customerLoggedIn === 'true';
    const linkTarget = isLoggedIn ? '/account' : '/account/login';
    const accountIcon = `
      <svg style="width:80%;height:80%;" xmlns="http://www.w3.org/2000/svg" fill="none"
           class="icon icon-account" viewBox="0 0 18 19">
        <path fill="currentColor" fill-rule="evenodd"
              d="M6 4.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m5.58 12.15c1.12.82 1.83 2.24 1.91 4.85H1.51c.08-2.6.79-4.03 1.9-4.85C4.66 11.75 6.5 11.5 9 11.5s4.35.26 5.58 1.15M9 10.5c-2.5 0-4.65.24-6.17 1.35C1.27 12.98.5 14.93.5 18v.5h17V18c0-3.07-.77-5.02-2.33-6.15-1.52-1.1-3.67-1.35-6.17-1.35"
              clip-rule="evenodd"/>
      </svg>
    `;
    const authItem = `
      <li class="menu-item account-link">
        <a href="${linkTarget}" class="menu-link" style="margin-top:30px;">
          <span class="svg-wrapper">${accountIcon}</span> CONTA
        </a>
      </li>`;
    
    const menuList = menuDrawerContent.querySelector(".menu-drawer__menu");
    if (menuList) {
      const existingAuth = menuList.querySelector('.account-link');
      if (existingAuth) existingAuth.remove();
      menuList.insertAdjacentHTML('beforeend', authItem);
    } else {
      menuDrawerContent.insertAdjacentHTML('beforeend', authItem);
    }
  }

  // (E) Submenu toggle behavior
  function initializeSubmenuBehavior() {
    const submenuLinks = menuDrawerContent.querySelectorAll(".menu-item.has-submenu > .menu-link");
    submenuLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const parentItem = link.closest(".menu-item");
        const submenu = parentItem.querySelector(".submenu");
        // Only toggle on viewports < 1024px (so you can still close on smaller screens)
        if (window.innerWidth < 1024) {
          menuDrawerContent.querySelectorAll(".menu-item.has-submenu .submenu")
            .forEach((otherSubmenu) => {
              if (otherSubmenu !== submenu) {
                otherSubmenu.style.display = "none";
                otherSubmenu.classList.add("hidden");
                const otherArrow = otherSubmenu.parentElement.querySelector(".submenu-arrow");
                if (otherArrow) otherArrow.textContent = "▶";
              }
            });
          if (submenu.classList.contains("hidden")) {
            submenu.style.display = "block";
            submenu.classList.remove("hidden");
            link.querySelector(".submenu-arrow").textContent = "▼";
          } else {
            submenu.style.display = "none";
            submenu.classList.add("hidden");
            link.querySelector(".submenu-arrow").textContent = "▶";
          }
        }
      });
    });
  }

  // (F) Render stored menu on desktop (defaults to women-menu)
  if (menus[initialMenuKey]) {
    // Keep the nav at the top when adding menu content
    const existingNav = menuDrawerContent.querySelector(".moved-into-drawer");
    menuDrawerContent.insertAdjacentHTML("beforeend", menus[initialMenuKey]);
    initializeSubmenuBehavior();
    appendAuthLink();

    // Set initial active state
    if (existingNav) {
      existingNav.querySelector(`a[data-menu="${initialMenuKey}"]`)?.classList.add("active");
    }
  }

  // (G) Handle clicks on "MULHER | HOMEM | CRIANÇAS" (now inside the drawer)
  const clonedNavLinks = menuDrawerContent.querySelectorAll(".moved-into-drawer a[data-menu]");
  clonedNavLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const menuKey = link.getAttribute("data-menu");
      if (menus[menuKey]) {
        // Remove old menu but keep nav
        const oldNav = menuDrawerContent.querySelector(".menu-drawer__navigation");
        if (oldNav) oldNav.remove();
        
        // Add new menu
        menuDrawerContent.insertAdjacentHTML("beforeend", menus[menuKey]);
        
        initializeSubmenuBehavior();
        appendAuthLink();

        applyActiveMenuState(menuKey, link);
      }
    });
  });

  // (H) If the drawer is a <details>, toggle body/nav-link classes on open/close
  if (detailsElement) {
    detailsElement.addEventListener("toggle", () => {
      if (detailsElement.open) {
        document.body.classList.add("menu-drawer-open");
        menuDrawerContent
          .querySelectorAll(".moved-into-drawer a")
          .forEach(a => a.classList.add("menu-open"));
      } else {
        document.body.classList.remove("menu-drawer-open");
        menuDrawerContent
          .querySelectorAll(".moved-into-drawer a")
          .forEach(a => a.classList.remove("menu-open"));
      }
    });
  }

  // (I) Section-switching (“MULHER / HOMEM / CRIANA”) and trending-image update
  const mulherSection  = document.querySelector(".image-section-mulher");
  const homemSection   = document.querySelector(".image-section-homem");
  const criancaSection = document.querySelector(".image-section-crianca");
  const trendingSource  = document.querySelector(".trending-now__picture source");
  const trendingImg     = document.querySelector(".trending-now__picture img");

  function showSection(section) {
    [mulherSection, homemSection, criancaSection].forEach((element) => {
      if (!element) return;
      element.style.display = element === section ? "block" : "none";
    });
  }
  function updateActiveLink(activeLink, menuKeyOverride = '') {
    const resolvedKey = menuKeyOverride || activeLink?.dataset?.menu || '';

    const movedLinks = menuDrawerContent.querySelectorAll('.moved-into-drawer a[data-menu]');
    movedLinks.forEach((link) => {
      link.classList.toggle('active', resolvedKey ? link.dataset.menu === resolvedKey : link === activeLink);
    });

    const drawerTabs = menuDrawerContent.querySelectorAll('.drawer-menu-link[data-menu]');
    drawerTabs.forEach((link) => {
      link.classList.toggle('active', resolvedKey ? link.dataset.menu === resolvedKey : link === activeLink);
    });

    if (!resolvedKey && activeLink) {
      activeLink.classList.add('active');
    }
  }
  function updateTrendingNow(category) {
    if (!trendingSource || !trendingImg) return;

    if (category === "mulher") {
      trendingSource.srcset = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/fashion-model-in-black-white.jpg?v=1743757550";
      trendingImg.src       = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/hero_woman.jpg?v=1747744739";
      trendingImg.alt       = "Trending Mulher";
    } else if (category === "homem") {
      trendingSource.srcset = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/S_1_1.jpg?v=1744018021";
      trendingImg.src       = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/A_1_6.webp?v=1744017915";
      trendingImg.alt       = "Trending Homem";
    } else if (category === "crianca") {
      trendingSource.srcset = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/S_1.jpg?v=1744016515";
      trendingImg.src       = "https://cdn.shopify.com/s/files/1/0911/7843/4884/files/A_1_5.webp?v=1744016919";
      trendingImg.alt       = "Trending Criança";
    }
  }

  function applyActiveMenuState(menuKey, providedLink) {
    const resolvedCategory =
      MENU_KEY_TO_CATEGORY[menuKey] || MENU_KEY_TO_CATEGORY[DEFAULT_MENU_KEY];
    const targetLink =
      providedLink ||
      menuDrawerContent.querySelector(`.moved-into-drawer a[data-menu='${menuKey}']`) ||
      null;

    persistMenuKey(menuKey);

    if (targetLink) {
      updateActiveLink(targetLink, menuKey);
    } else {
      updateActiveLink(null, menuKey);
    }

    let targetSection = null;
    if (resolvedCategory === "homem" && homemSection) {
      targetSection = homemSection;
    } else if (resolvedCategory === "crianca" && criancaSection) {
      targetSection = criancaSection;
    } else if (mulherSection) {
      targetSection = mulherSection;
    }

    if (targetSection) {
      showSection(targetSection);
    }

    updateTrendingNow(resolvedCategory);
  }

  // Initial state on desktop: apply persisted category (fallback to Mulher)
  const initialDrawerLink =
    menuDrawerContent.querySelector(`.moved-into-drawer a[data-menu='${initialMenuKey}']`) ||
    menuDrawerContent.querySelector(".moved-into-drawer a[data-menu='women-menu']");

  applyActiveMenuState(initialMenuKey, initialDrawerLink);
});
