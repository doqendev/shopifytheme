document.addEventListener('DOMContentLoaded', function() {
  const swatches = document.querySelectorAll('.swatch');

  swatches.forEach(swatch => {
    swatch.addEventListener('click', function() {
      const selectedColor = this.getAttribute('data-color');
      
      document.querySelectorAll('.swiper-slide').forEach(slide => {
        const slideColor = slide.getAttribute('data-color');
        slide.style.display = (slideColor === selectedColor) ? 'block' : 'none';
      });
    });
  });
});
