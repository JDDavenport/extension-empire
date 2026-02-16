(function() {
  if (document.getElementById('cp-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cp-overlay';
  const style = document.createElement('style');
  style.textContent = `
    #cp-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; cursor: crosshair; }
    #cp-preview { position: fixed; pointer-events: none; width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,.3); z-index: 2147483647; display: none; }
    #cp-label { position: fixed; pointer-events: none; background: #222; color: #fff; font: 12px monospace; padding: 4px 8px; border-radius: 4px; z-index: 2147483647; display: none; }
  `;
  document.head.appendChild(style);

  const preview = document.createElement('div');
  preview.id = 'cp-preview';
  const label = document.createElement('div');
  label.id = 'cp-label';
  document.body.appendChild(overlay);
  document.body.appendChild(preview);
  document.body.appendChild(label);

  // Use canvas to sample pixel
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  overlay.addEventListener('mousemove', async e => {
    preview.style.display = 'block';
    label.style.display = 'block';
    preview.style.left = (e.clientX + 15) + 'px';
    preview.style.top = (e.clientY - 95) + 'px';
    label.style.left = (e.clientX + 15) + 'px';
    label.style.top = (e.clientY + 15) + 'px';

    // Get element under cursor
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';
    if (el) {
      const computed = getComputedStyle(el);
      const color = computed.backgroundColor;
      preview.style.background = color;
      const hex = rgbToHex(color);
      label.textContent = hex;
    }
  });

  overlay.addEventListener('click', e => {
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';
    if (el) {
      const color = getComputedStyle(el).backgroundColor;
      const hex = rgbToHex(color);
      const rgb = color;
      const hsl = rgbToHsl(color);
      chrome.runtime.sendMessage({ type: 'SAVE_COLOR', hex, rgb, hsl });
      navigator.clipboard.writeText(hex);
      cleanup();
    }
  });

  overlay.addEventListener('contextmenu', e => { e.preventDefault(); cleanup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cleanup(); });

  function cleanup() {
    overlay.remove(); preview.remove(); label.remove(); style.remove();
  }

  function rgbToHex(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return 'hsl(0, 0%, 0%)';
    let [r, g, b] = m.map(n => parseInt(n) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
  }
})();
