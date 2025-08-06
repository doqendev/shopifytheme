<script>
document.addEventListener('DOMContentLoaded', function() {
  const sheet = document.getElementById('BottomSheet');
  const handle = document.getElementById('BottomSheetHandle');
  
  let startY = 0;
  let currentY = 0;
  let currentTranslate = 0;      // how far sheet is moved from bottom
  let minTranslate = 0;          // fully open => 0
  let maxTranslate = window.innerHeight * 0.7; 
    // in this example, 70vh is "peek" – match your CSS transform
  
  // Because we set transform: translateY(70vh) in CSS, let's keep that as our "default" state
  let sheetOpen = false;
  
  function setTranslateY(y) {
    // clamp within [0, maxTranslate]
    const clamped = Math.max(Math.min(y, maxTranslate), minTranslate);
    currentTranslate = clamped;
    sheet.style.transform = `translateY(${clamped}px)`;
  }

  handle.addEventListener('touchstart', (e) => {
    // Disable transitions so it moves smoothly as we drag
    sheet.style.transition = 'none';
    startY = e.touches[0].clientY;
  });

  handle.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    let delta = currentY - startY; 
    // negative delta => dragging up
    // positive delta => dragging down

    // figure out the new translate
    let newTranslate = (sheetOpen ? 0 : maxTranslate) + delta;
    setTranslateY(newTranslate);
    e.preventDefault(); // prevent page behind from scrolling
  });

  handle.addEventListener('touchend', (e) => {
    // Re-enable transitions
    sheet.style.transition = 'transform 0.3s ease';

    // Decide whether to snap open or snap back
    let midpoint = maxTranslate / 2;
    if (currentTranslate < midpoint) {
      // Snap to open
      setTranslateY(0);
      sheetOpen = true;
    } else {
      // Snap to peek
      setTranslateY(maxTranslate);
      sheetOpen = false;
    }
  });
});
</script>
