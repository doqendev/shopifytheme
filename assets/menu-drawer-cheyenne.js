document.addEventListener('DOMContentLoaded', () => {
  const menuDrawerContent = document.querySelector("#menu-drawer .menu-drawer__inner-container");

  if (!menuDrawerContent) return;

  const navMenuHtml = `
    <div class="drawer-nav-menu">
      <div class="drawer-menu-nav">
        <a href="#" data-menu="women-menu" class="drawer-menu-link active">MULHER</a>
        <a href="#" data-menu="homem-menu" class="drawer-menu-link">HOMEM</a>
        <a href="#" data-menu="crianca-menu" class="drawer-menu-link">CRIANÇAS</a>
      </div>
    </div>
  `;

  menuDrawerContent.insertAdjacentHTML('afterbegin', navMenuHtml);

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
      
          <li><a href="/collections/casacos" class="menu-link">Casacos</a></li>
          <li><a href="/collections/acessorios" class="menu-link">ACESSÓRIOS</a></li>
          <li><a href="/collections/vestidos" class="menu-link">Camisas/Blusas</a></li>
          <li><a href="/collections/tops e bodies" class="menu-link">Top/Bodies</a></li>
          <li><a href="/collections/t-shirts" class="menu-link">T-Shirts</a></li>
          <li><a href="/collections/camisola e cardigans" class="menu-link">Camisolas/Cardigans</a></li>
          <li><a href="/collections/sweatshirts" class="menu-link">Sweatshirts</a></li>
          <li><a href="/collections/calças" class="menu-link">Calças</a></li>
          <li><a href="/collections/jeans" class="menu-link">Jeans</a></li>
          <li><a href="/collections/calções e saias" class="menu-link">Calções/Saias</a></li>
          <li><a href="/collections/acessorios" class="menu-link">ACESSÓRIOS</a></li>
          <li class="menu-item has-submenu">
            <a href="#" class="menu-link info-item">
              + INFO
              <span class="submenu-arrow">▶</span>
            </a>
            <div class="submenu hidden">
              <ul class="submenu-list">
                <li><a href="">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/pages/trocas-e-devolucoes">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/pages/envios">ENVIOS</a></li>
                <li><a href="/pages/faq">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/pages/contactos">CONTACTO</a></li>
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
                <li><a href="">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/pages/trocas-e-devolucoes">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/pages/envios">ENVIOS</a></li>
                <li><a href="/pages/faq">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/pages/contactos">CONTACTO</a></li>
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
                <li><a href="">ESTADO DA TUA ENCOMENDA</a></li>
                <li><a href="/pages/trocas-e-devolucoes">TROCAS E DEVOLUÇÕES</a></li>
                <li><a href="/pages/envios">ENVIOS</a></li>
                <li><a href="/pages/faq">PERGUNTAS FREQUENTES</a></li>
                <li><a href="/pages/contactos">CONTACTO</a></li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    `
  };

  const MENU_STORAGE_KEY = 'menuDrawerActiveMenu';
  const DEFAULT_MENU_KEY = 'women-menu';

  const isValidMenuKey = (key) => Object.prototype.hasOwnProperty.call(menus, key);

  const getStoredMenuKey = () => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return DEFAULT_MENU_KEY;
    }
    try {
      const stored = window.localStorage.getItem(MENU_STORAGE_KEY);
      if (stored && isValidMenuKey(stored)) {
        return stored;
      }
    } catch (error) {
      // Ignore storage access issues
    }
    return DEFAULT_MENU_KEY;
  };

  const persistMenuKey = (key) => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    if (!isValidMenuKey(key)) return;
    try {
      window.localStorage.setItem(MENU_STORAGE_KEY, key);
    } catch (error) {
      // Ignore persistence issues
    }
  };
  const navLinks = menuDrawerContent.querySelectorAll('.drawer-menu-link');

  const setActiveMenu = (rawKey) => {
    const menuKey = isValidMenuKey(rawKey) ? rawKey : DEFAULT_MENU_KEY;

    // Update active tab
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.menu === menuKey);
    });

    // Replace menu content
    menuDrawerContent.querySelectorAll('.menu-drawer__navigation').forEach(nav => nav.remove());
    menuDrawerContent.insertAdjacentHTML('beforeend', menus[menuKey]);

    // Initialize submenu and auth link if needed
    initializeSubmenuBehavior();
    appendAuthLink();

    persistMenuKey(menuKey);
  };
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveMenu(link.dataset.menu);
    });
  });

  // Initialize menu with persisted state
  const initialMenuKey = getStoredMenuKey();
  setActiveMenu(initialMenuKey);
  function initializeSubmenuBehavior() {
    const submenuLinks = menuDrawerContent.querySelectorAll(".menu-item.has-submenu > .menu-link");
    submenuLinks.forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const submenu = link.nextElementSibling;
        submenu.classList.toggle('hidden');
        submenu.style.display = submenu.classList.contains('hidden') ? 'none' : 'block';
        link.querySelector(".submenu-arrow").textContent = submenu.classList.contains('hidden') ? "▶" : "▼";
      });
    });
  }

  function appendAuthLink() {
    const isLoggedIn = window.customerLoggedIn === 'true';
    const linkTarget = isLoggedIn ? '/account' : '/account/login';
    const authItemHtml = `
      <li class="menu-item account-link">
        <a href="${linkTarget}" class="menu-link" style="margin-top:30px;">
          <span class="svg-wrapper">
            <svg style="width:1em;height:1em;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 19">
              <path fill="currentColor" fill-rule="evenodd" d="M6 4.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m5.58 12.15c1.12.82 1.83 2.24 1.91 4.85H1.51c.08-2.6.79-4.03 1.9-4.85C4.66 11.75 6.5 11.5 9 11.5s4.35.26 5.58 1.15M9 10.5c-2.5 0-4.65.24-6.17 1.35C1.27 12.98.5 14.93.5 18v.5h17V18c0-3.07-.77-5.02-2.33-6.15-1.52-1.1-3.67-1.35-6.17-1.35" clip-rule="evenodd"/>
            </svg>
          </span>
          CONTA
        </a>
      </li>
    `;
    const navUl = menuDrawerContent.querySelector('.menu-drawer__navigation ul.menu-drawer__menu');
    if (navUl) {
      const existingAuth = navUl.querySelector(".account-link");
      if (existingAuth) existingAuth.remove();
      navUl.insertAdjacentHTML("beforeend", authItemHtml);
    }
  }
});


