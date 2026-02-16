// SEO Score — Free feature
SPT.SEOScore = {
  init() {
    if (!SPT.isProductDetailPage()) return;
    setTimeout(() => this.analyze(), 1500);
  },

  analyze() {
    const title = document.querySelector('input[name="title"]')?.value || '';
    const body = document.querySelector('.tox-edit-area iframe')?.contentDocument?.body?.textContent || '';
    const metaTitle = document.querySelector('input[name="metafields[global][title_tag]"]')?.value || '';
    const metaDesc = document.querySelector('textarea[name="metafields[global][description_tag]"]')?.value || '';
    const handle = document.querySelector('input[name="handle"]')?.value || '';
    const images = document.querySelectorAll('.product-images img, [class*="MediaCard"] img');
    const imagesWithAlt = Array.from(images).filter(img => img.alt && img.alt.trim().length > 0);

    const checks = [
      { name: 'Title length (50-60 chars)', pass: title.length >= 50 && title.length <= 60, score: 15, detail: `${title.length} chars` },
      { name: 'Meta title set', pass: metaTitle.length > 0, score: 10, detail: metaTitle ? `${metaTitle.length} chars` : 'Missing' },
      { name: 'Meta title length (50-60)', pass: metaTitle.length >= 50 && metaTitle.length <= 60, score: 10, detail: `${metaTitle.length} chars` },
      { name: 'Meta description set', pass: metaDesc.length > 0, score: 10, detail: metaDesc ? `${metaDesc.length} chars` : 'Missing' },
      { name: 'Meta description (120-160)', pass: metaDesc.length >= 120 && metaDesc.length <= 160, score: 10, detail: `${metaDesc.length} chars` },
      { name: 'URL handle is clean', pass: handle.length > 0 && !handle.includes(' '), score: 10, detail: handle || 'Missing' },
      { name: 'Product description > 300 chars', pass: body.length > 300, score: 15, detail: `${body.length} chars` },
      { name: 'Images have alt tags', pass: images.length > 0 && imagesWithAlt.length === images.length, score: 10, detail: `${imagesWithAlt.length}/${images.length}` },
      { name: 'Has images', pass: images.length > 0, score: 10, detail: `${images.length} images` },
    ];

    const total = checks.reduce((s, c) => s + (c.pass ? c.score : 0), 0);
    this.render(total, checks);
  },

  render(score, checks) {
    const existing = document.getElementById('spt-seo-panel');
    if (existing) existing.remove();

    const color = score >= 70 ? '#4caf50' : score >= 40 ? '#ff9800' : '#f44336';
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

    const panel = document.createElement('div');
    panel.id = 'spt-seo-panel';
    panel.className = 'spt-panel';
    panel.innerHTML = `
      <div class="spt-panel-header">
        <h3>🔍 SEO Score</h3>
        <div class="spt-score-badge" style="background:${color}">${grade} (${score}/100)</div>
      </div>
      <div class="spt-checklist">
        ${checks.map(c => `
          <div class="spt-check ${c.pass ? 'spt-check-pass' : 'spt-check-fail'}">
            <span>${c.pass ? '✅' : '❌'} ${c.name}</span>
            <span class="spt-muted">${c.detail}</span>
          </div>
        `).join('')}
      </div>`;

    // Insert after the main form
    const form = document.querySelector('form') || document.querySelector('[class*="Page"]');
    if (form) form.parentNode.insertBefore(panel, form.nextSibling);
    else document.body.appendChild(panel);
  }
};
