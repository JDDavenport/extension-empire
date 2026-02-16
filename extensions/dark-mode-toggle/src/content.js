(function() {
  if (document.getElementById('dm-style')) return;
  const style = document.createElement('style');
  style.id = 'dm-style';
  style.textContent = `
    html {
      filter: invert(0.9) hue-rotate(180deg) !important;
      background: #111 !important;
    }
    img, video, canvas, svg, picture,
    [style*="background-image"],
    .emoji, iframe {
      filter: invert(1) hue-rotate(180deg) !important;
    }
    /* Fix common elements */
    input, textarea, select {
      background-color: #333 !important;
      color: #eee !important;
      border-color: #555 !important;
    }
  `;
  document.documentElement.appendChild(style);
})();
