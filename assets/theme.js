document.addEventListener('DOMContentLoaded', function() {
  // Ensure the Cheyenne menu is properly contained
  const cheyenneMenu = document.querySelector('.cheyenne-menu');
  if (cheyenneMenu) {
    // Ensure menu is visible within viewport
    cheyenneMenu.style.maxWidth = '100%';
    cheyenneMenu.style.overflowX = 'hidden';
    
    // Fix positioning to avoid the large blank space
    const menuContainer = cheyenneMenu.closest('.menu-container');
    if (menuContainer) {
      menuContainer.style.marginTop = '0';
    }
  }
  
  // Make the login link a dropdown or an icon in the header instead
  const userAccountButton = document.createElement('a');
  userAccountButton.href = '#';
  userAccountButton.className = 'user-account-button';
  userAccountButton.innerHTML = '<span class="icon-user"></span>';
  
  document.querySelector('.header-actions').appendChild(userAccountButton);
  
  userAccountButton.addEventListener('click', function(e) {
    e.preventDefault();
    const accountContainer = document.querySelector('.user-account-container');
    accountContainer.classList.toggle('hidden');
  });
});