document.addEventListener('DOMContentLoaded', function () {
    var swiperContainers = document.querySelectorAll('.swiper-container');
    swiperContainers.forEach(function(container) {
      new Swiper(container, {
        loop: true,
        pagination: {
          el: container.querySelector('.swiper-pagination'),
          clickable: true,
        },
        slidesPerView: 1,
        spaceBetween: 10,
        grabCursor: true,
        // Enable keyboard control
        keyboard: {
          enabled: true,
        },
        // Responsive breakpoints (optional)
        breakpoints: {
          768: {
            slidesPerView: 1,
          }
        }
      });
    });
  });