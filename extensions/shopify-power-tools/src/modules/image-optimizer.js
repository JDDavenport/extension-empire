// Image Optimizer Suggestions — Free feature
SPT.ImageOptimizer = {
  init() {
    if (!SPT.isProductDetailPage()) return;
    setTimeout(() => this.analyze(), 2000);
  },

  analyze() {
    const images = document.querySelectorAll('.product-images img, [class*="MediaCard"] img, [class*="Thumbnail"] img');
    if (images.length === 0) return;

    const suggestions = [];
    images.forEach((img, i) => {
      const issues = [];
      if (!img.alt || img.alt.trim() === '') issues.push('Missing alt text');
      if (img.naturalWidth > 2048) issues.push(`Width ${img.naturalWidth}px — consider ≤2048px`);
      if (img.naturalHeight > 2048) issues.push(`Height ${img.naturalHeight}px — consider ≤2048px`);
      if (img.naturalWidth !== img.naturalHeight) issues.push('Not square — may crop oddly');
      const src = img.src || '';
      if (src.includes('.png') && !src.includes('logo')) issues.push('Consider JPEG/WebP for photos (smaller file)');
      if (src.includes('.bmp')) issues.push('BMP detected — convert to JPEG/WebP');
      if (issues.length === 0) issues.push('✅ Looks good!');
      suggestions.push({ index: i + 1, src: img.src, issues });
    });

    this.render(suggestions);
  },

  render(suggestions) {
    const existing = document.getElementById('spt-image-panel');
    if (existing) existing.remove();

    const allGood = suggestions.every(s => s.issues[0]?.startsWith('✅'));
    const panel = document.createElement('div');
    panel.id = 'spt-image-panel';
    panel.className = 'spt-panel';
    panel.innerHTML = `
      <div class="spt-panel-header">
        <h3>🖼️ Image Optimizer</h3>
        <span class="spt-badge ${allGood ? 'spt-badge-green' : 'spt-badge-yellow'}">${allGood ? 'All Good' : `${suggestions.filter(s => !s.issues[0]?.startsWith('✅')).length} Issues`}</span>
      </div>
      <div class="spt-checklist">
        ${suggestions.map(s => `
          <div class="spt-check ${s.issues[0]?.startsWith('✅') ? 'spt-check-pass' : 'spt-check-warn'}">
            <strong>Image ${s.index}</strong>
            ${s.issues.map(i => `<div class="spt-check-detail">${i}</div>`).join('')}
          </div>
        `).join('')}
      </div>`;

    const seoPanel = document.getElementById('spt-seo-panel');
    if (seoPanel) seoPanel.parentNode.insertBefore(panel, seoPanel.nextSibling);
    else {
      const form = document.querySelector('form') || document.body;
      form.parentNode?.insertBefore(panel, form.nextSibling) || document.body.appendChild(panel);
    }
  }
};
