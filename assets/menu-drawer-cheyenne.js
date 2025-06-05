document.addEventListener("DOMContentLoaded", () => {
  const menuDrawerContent = document.querySelector("#menu-drawer .menu-drawer__inner-container");
  const menuDrawer = document.querySelector("#menu-drawer");
  const detailsElement = menuDrawer ? menuDrawer.closest("details") : null;

  if (!menuDrawerContent) return;

  // Create the navigation menu directly in the drawer
  const createNavMenu = () => {
    // Check if navigation already exists to prevent duplication
    if (menuDrawerContent.querySelector(".drawer-nav-menu")) return;
    
    const navMenu = document.createElement("div");
    navMenu.className = "drawer-nav-menu";
    navMenu.innerHTML = `
      <div class="drawer-menu-nav">
        <a href="#" data-menu="women-menu" class="drawer-menu-link active">MULHER</a>
        <a href="#" data-menu="homem-menu" class="drawer-menu-link">HOMEM</a>
        <a href="#" data-menu="crianca-menu" class="drawer-menu-link">CRIANÇAS</a>
      </div>
    `;
    
    // Insert at the beginning of the drawer
    menuDrawerContent.insertBefore(navMenu, menuDrawerContent.firstChild);
    
    // Add event listeners to the new navigation links
    const navLinks = navMenu.querySelectorAll(".drawer-menu-link");
    navLinks.forEach(link => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        
        // Update active state
        navLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        
        // Change menu content based on selection
        const menuKey = link.getAttribute("data-menu");
        if (menus[menuKey]) {
          // Remove existing menu navigation
          const oldNav = menuDrawerContent.querySelector(".menu-drawer__navigation");
          if (oldNav) oldNav.remove();
          
          // Add the new menu content
          menuDrawerContent.insertAdjacentHTML("beforeend", menus[menuKey]);
          initializeSubmenuBehavior();
          appendAuthLink();
        }
      });
    });
  };

  // Execute once when the drawer is initialized
  createNavMenu();

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

  function appendAuthLink() {
  const isLoggedIn = window.customerLoggedIn === 'true';
  const linkTarget = isLoggedIn ? '/account' : '/account/login';
  const accountIcon = `
    <svg style="width:1em;height:1em;" xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-account" viewBox="0 0 18 19">
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M6 4.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m5.58 12.15c1.12.82 1.83 2.24 1.91 4.85H1.51c.08-2.6.79-4.03 1.9-4.85C4.66 11.75 6.5 11.5 9 11.5s4.35.26 5.58 1.15M9 10.5c-2.5 0-4.65.24-6.17 1.35C1.27 12.98.5 14.93.5 18v.5h17V18c0-3.07-.77-5.02-2.33-6.15-1.52-1.1-3.67-1.35-6.17-1.35"
        clip-rule="evenodd"
      />
    </svg>
  `;
  const authItem = `
    <li class="menu-item account-link">
      <a href="${linkTarget}" class="menu-link" style="margin-top:30px;">
        <span class="svg-wrapper">${accountIcon}</span>
        CONTA
      </a>
    </li>
  `;

  // — Always grab the UL directly under nav.menu-drawer__navigation
  const navUl = menuDrawerContent.querySelector("nav.menu-drawer__navigation > ul.menu-drawer__menu");
  if (navUl) {
    // If an old “account-link” already exists, remove it so we don’t duplicate
    const existingAuth = navUl.querySelector(".account-link");
    if (existingAuth) existingAuth.remove();
    navUl.insertAdjacentHTML("beforeend", authItem);
  }
}

  function initializeSubmenuBehavior() {
    const submenuLinks = menuDrawerContent.querySelectorAll(".menu-item.has-submenu > .menu-link");
    submenuLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const parentItem = link.closest(".menu-item");
        const submenu = parentItem.querySelector(".submenu");

        // Always toggle (no viewport-width guard)
        // 1) Close all other submenus
        menuDrawerContent.querySelectorAll(".menu-item.has-submenu .submenu").forEach((otherSubmenu) => {
          if (otherSubmenu !== submenu) {
            otherSubmenu.style.display = "none";
            otherSubmenu.classList.add("hidden");
            const otherArrow = otherSubmenu.parentElement.querySelector(".submenu-arrow");
            if (otherArrow) otherArrow.textContent = "▶";
          }
        });

        // 2) Toggle this submenu’s visibility
        if (submenu.classList.contains("hidden")) {
          submenu.style.display = "block";
          submenu.classList.remove("hidden");
          link.querySelector(".submenu-arrow").textContent = "▼";
        } else {
          submenu.style.display = "none";
          submenu.classList.add("hidden");
          link.querySelector(".submenu-arrow").textContent = "▶";
        }
      });
    });
  }

  // On initial page load, show the "women-menu" by default
  const defaultMenu = "women-menu";
  if (menus[defaultMenu]) {
    menuDrawerContent.innerHTML = menuDrawerContent.innerHTML.replace(/<nav class="menu-drawer__navigation">[\s\S]*?<\/nav>/g, '');
    menuDrawerContent.insertAdjacentHTML("beforeend", menus[defaultMenu]);
    initializeSubmenuBehavior();
    appendAuthLink();
  }

  // When drawer opens/closes
  if (detailsElement) {
    detailsElement.addEventListener("toggle", () => {
      if (detailsElement.open) {
        createNavMenu();
        document.body.classList.add("menu-drawer-open");
      } else {
        document.body.classList.remove("menu-drawer-open");
      }
    });
  }

  // Get the menu nav items
  const menuItems = document.querySelectorAll('.main-menu-item');
  
  // Get the menu content containers
  const mulherMenu = document.getElementById('women-menu');
  const homemMenu = document.getElementById('homem-menu');
  const criancasMenu = document.getElementById('criancas-menu');
  
  const allMenus = [mulherMenu, homemMenu, criancasMenu];
  
  // Function to set active menu
  function setActiveMenu(clickedItem) {
    // Remove active class from all menu items
    menuItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    clickedItem.classList.add('active');
    
    // Hide all menus
    allMenus.forEach(menu => {
      if (menu) menu.style.display = 'none';
    });
    
    // Show the corresponding menu based on clicked item
    const category = clickedItem.getAttribute('data-category');
    if (category === 'mulher' && mulherMenu) {
      mulherMenu.style.display = 'block';
    } else if (category === 'homem' && homemMenu) {
      homemMenu.style.display = 'block';
    } else if (category === 'criancas' && criancasMenu) {
      criancasMenu.style.display = 'block';
    }
  }
  
  // Add click event listeners to menu items
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      setActiveMenu(this);
    });
  });
  
  // Set default active menu to "mulher" on page load
  const mulherMenuItem = document.querySelector('.main-menu-item[data-category="mulher"]');
  if (mulherMenuItem) {
    setActiveMenu(mulherMenuItem);
  }

  // Get the existing category tabs in the drawer
  const mulherTab = document.querySelector('.menu-drawer-tabs [data-tab="MULHER"], .menu-drawer-tabs a:contains("MULHER")');
  const homemTab = document.querySelector('.menu-drawer-tabs [data-tab="HOMEM"], .menu-drawer-tabs a:contains("HOMEM")');
  const criancasTab = document.querySelector('.menu-drawer-tabs [data-tab="CRIANÇAS"], .menu-drawer-tabs a:contains("CRIANÇAS")');
  
  // Get the menu content containers - adjust these selectors to match your actual IDs/classes
  const mulherContent = document.getElementById('women-menu') || document.querySelector('.mulher-menu-content');
  const homemContent = document.getElementById('homem-menu') || document.querySelector('.homem-menu-content');
  const criancasContent = document.getElementById('criancas-menu') || document.querySelector('.criancas-menu-content');
  
  // Function to handle tab switching
  function switchTab(tab, content) {
    // Remove active class from all tabs
    [mulherTab, homemTab, criancasTab].forEach(t => {
      if (t) t.classList.remove('active');
    });
    
    // Hide all content sections
    [mulherContent, homemContent, criancasContent].forEach(c => {
      if (c) c.style.display = 'none';
    });
    
    // Activate the selected tab and content
    if (tab) tab.classList.add('active');
    if (content) content.style.display = 'block';
  }
  
  // Add click event listeners
  if (mulherTab) {
    mulherTab.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(mulherTab, mulherContent);
    });
  }
  
  if (homemTab) {
    homemTab.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(homemTab, homemContent);
    });
  }
  
  if (criancasTab) {
    criancasTab.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(criancasTab, criancasContent);
    });
  }
  
  // Set default tab to MULHER on page load
  switchTab(mulherTab, mulherContent);

  document.addEventListener('DOMContentLoaded', function() {
    // Target the existing tabs in your drawer
    const menuTabs = document.querySelectorAll('.menu-drawer-tabs a');
    
    // Target the menu content sections
    const menuContents = document.querySelectorAll('.menu-drawer-content');
    
    // Function to switch active tab and show corresponding content
    function switchTab(clickedTab) {
      // Get the category from the clicked tab
      const category = clickedTab.getAttribute('data-category') || clickedTab.textContent.trim();
      
      // Remove active class from all tabs
      menuTabs.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked tab
      clickedTab.classList.add('active');
      
      // Hide all content sections
      menuContents.forEach(content => content.style.display = 'none');
      
      // Show the corresponding content
      const targetContent = document.querySelector(`.menu-drawer-content[data-category="${category}"]`) || 
                           document.getElementById(`${category.toLowerCase()}-menu`);
      
      if (targetContent) {
        targetContent.style.display = 'block';
      }
    }
    
    // Add click event listeners to all tabs
    menuTabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(this);
      });
    });
    
    // Set default active tab (MULHER)
    const defaultTab = document.querySelector('.menu-drawer-tabs a[data-category="MULHER"]') || 
                      Array.from(menuTabs).find(tab => tab.textContent.trim() === 'MULHER');
    
    if (defaultTab) {
      switchTab(defaultTab);
    }
  });
});
