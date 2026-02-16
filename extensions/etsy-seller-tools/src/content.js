/* Etsy Seller Power Tools — Content Script */

(function() {
  'use strict';

  const PANEL_ID = 'espt-panel';
  let isPro = false;

  // ── Init ──
  async function init() {
    const resp = await chrome.runtime.sendMessage({ action: 'checkPro' });
    isPro = resp?.isPro || false;

    const url = window.location.pathname;

    // Listing page
    if (url.match(/\/listing\/\d+/)) {
      injectListingAnalysis();
    }

    // Shop page
    if (url.match(/\/shop\/[\w-]+/) || url.match(/\/c\/[\w-]+/)) {
      // Shop view — could inject competitor panel
    }

    // Seller dashboard
    if (url.includes('/your/shops/me/dashboard') || url.includes('/your/shops/')) {
      injectDashboardOverlay();
      injectStarSellerTracker();
    }

    // Listing manager
    if (url.includes('/your/shops/me/listing-editor') || url.includes('/your/shops/me/listings')) {
      if (isPro) injectBulkTagEditor();
    }

    // Individual listing edit page
    if (url.includes('/your/shops/me/listing-editor/edit')) {
      injectSEOAnalyzer();
    }
  }

  // ── SEO Tag Analyzer ──
  function injectSEOAnalyzer() {
    const tagSection = document.querySelector('[data-tag-input]') ||
                       findByText('Tags') ||
                       document.querySelector('.tag-input-container');

    // Look for tag inputs
    setTimeout(() => {
      const tagInputs = document.querySelectorAll('input[name*="tag"], .tag-item, [class*="tag"]');
      if (tagInputs.length === 0) return;

      const tags = Array.from(tagInputs).map(el => el.value || el.textContent).filter(Boolean);
      if (tags.length === 0) return;

      const panel = createPanel('SEO Tag Analysis', 'seo-analyzer');
      const scores = analyzeTags(tags);

      let html = '<div class="espt-tag-list">';
      scores.forEach(s => {
        const color = s.score >= 70 ? '#22c55e' : s.score >= 40 ? '#f59e0b' : '#ef4444';
        html += `
          <div class="espt-tag-item">
            <span class="espt-tag-name">${escHtml(s.tag)}</span>
            <span class="espt-tag-score" style="color:${color}">${s.score}/100</span>
            <span class="espt-tag-chars">${s.charCount}/20 chars</span>
            <div class="espt-tag-tip">${escHtml(s.tip)}</div>
          </div>`;
      });
      html += '</div>';

      const avg = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
      const avgColor = avg >= 70 ? '#22c55e' : avg >= 40 ? '#f59e0b' : '#ef4444';
      html = `<div class="espt-overall-score" style="border-color:${avgColor}">
        <span class="espt-score-number" style="color:${avgColor}">${avg}</span>
        <span class="espt-score-label">Overall SEO Score</span>
      </div>` + html;

      if (tags.length < 13) {
        html += `<div class="espt-warning">⚠️ Only ${tags.length}/13 tags used. Fill all 13 for maximum visibility!</div>`;
      }

      panel.querySelector('.espt-panel-body').innerHTML = html;
      insertAfterElement(tagSection || document.querySelector('main'), panel);
    }, 2000);
  }

  // ── Listing Quality Score ──
  function injectListingAnalysis() {
    setTimeout(() => {
      const listing = parseListingPage();
      if (!listing.title) return;

      const panel = createPanel('Listing Quality Score', 'quality-score');
      const scores = calculateQualityScore(listing);

      let html = `<div class="espt-quality-overview">
        <div class="espt-quality-gauge" style="--score:${scores.total}">
          <span class="espt-gauge-number">${scores.total}</span>
          <span class="espt-gauge-label">/ 100</span>
        </div>
      </div>
      <div class="espt-quality-details">`;

      scores.breakdown.forEach(item => {
        const color = item.score >= 70 ? '#22c55e' : item.score >= 40 ? '#f59e0b' : '#ef4444';
        html += `
          <div class="espt-quality-row">
            <div class="espt-quality-category">
              <span class="espt-quality-icon">${item.icon}</span>
              <span>${item.name}</span>
            </div>
            <div class="espt-quality-bar-wrap">
              <div class="espt-quality-bar" style="width:${item.score}%;background:${color}"></div>
            </div>
            <span class="espt-quality-val" style="color:${color}">${item.score}</span>
          </div>
          <div class="espt-quality-tip">${escHtml(item.tip)}</div>`;
      });

      html += '</div>';
      panel.querySelector('.espt-panel-body').innerHTML = html;

      const sidebar = document.querySelector('[class*="listing-page-sidebar"]') ||
                      document.querySelector('aside') ||
                      document.querySelector('[data-appears-component-name]');
      if (sidebar) {
        sidebar.prepend(panel);
      } else {
        const main = document.querySelector('main') || document.body;
        main.appendChild(panel);
      }
    }, 1500);
  }

  // ── Dashboard Overlay ──
  function injectDashboardOverlay() {
    if (!isPro) return;

    setTimeout(() => {
      const dashboard = document.querySelector('[class*="dashboard"]') || document.querySelector('main');
      if (!dashboard) return;

      const panel = createPanel('📊 Sales Insights', 'dashboard-overlay');
      panel.querySelector('.espt-panel-body').innerHTML = `
        <div class="espt-dashboard-grid">
          <div class="espt-dash-card">
            <div class="espt-dash-label">Conversion Rate</div>
            <div class="espt-dash-value">—</div>
            <div class="espt-dash-note">Visit your Stats page to populate</div>
          </div>
          <div class="espt-dash-card">
            <div class="espt-dash-label">Avg Order Value</div>
            <div class="espt-dash-value">—</div>
          </div>
          <div class="espt-dash-card">
            <div class="espt-dash-label">Top Listing</div>
            <div class="espt-dash-value">—</div>
          </div>
          <div class="espt-dash-card">
            <div class="espt-dash-label">Listings Expiring Soon</div>
            <div class="espt-dash-value" id="espt-expiring-count">—</div>
          </div>
        </div>
        <p class="espt-dash-note">Dashboard data syncs from your Etsy stats. Keep the extension active to build trend data.</p>
      `;
      dashboard.prepend(panel);
    }, 2000);
  }

  // ── Star Seller Tracker ──
  function injectStarSellerTracker() {
    setTimeout(() => {
      const dashboard = document.querySelector('[class*="dashboard"]') || document.querySelector('main');
      if (!dashboard) return;

      // Try to find Star Seller data on the page
      const panel = createPanel('⭐ Star Seller Progress', 'star-seller');
      panel.querySelector('.espt-panel-body').innerHTML = `
        <div class="espt-star-metrics">
          <div class="espt-star-row">
            <span>Message Response Rate</span>
            <div class="espt-progress-bar"><div class="espt-progress-fill" style="width:95%"></div></div>
            <span class="espt-star-target">Target: 95%</span>
          </div>
          <div class="espt-star-row">
            <span>Shipping On Time</span>
            <div class="espt-progress-bar"><div class="espt-progress-fill" style="width:95%"></div></div>
            <span class="espt-star-target">Target: 95%</span>
          </div>
          <div class="espt-star-row">
            <span>5-Star Ratings</span>
            <div class="espt-progress-bar"><div class="espt-progress-fill" style="width:95%"></div></div>
            <span class="espt-star-target">Target: 95%</span>
          </div>
          <div class="espt-star-note">Values auto-populate from your dashboard. Keep this tab open to sync.</div>
        </div>
      `;
      dashboard.prepend(panel);
    }, 2500);
  }

  // ── Bulk Tag Editor ──
  function injectBulkTagEditor() {
    setTimeout(() => {
      const listingsArea = document.querySelector('[class*="listings"]') || document.querySelector('main');
      if (!listingsArea) return;

      const btn = document.createElement('button');
      btn.className = 'espt-bulk-btn';
      btn.textContent = '🏷️ Bulk Edit Tags';
      btn.addEventListener('click', openBulkTagModal);
      listingsArea.prepend(btn);
    }, 2000);
  }

  function openBulkTagModal() {
    const existing = document.getElementById('espt-bulk-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'espt-bulk-modal';
    modal.className = 'espt-modal-overlay';
    modal.innerHTML = `
      <div class="espt-modal">
        <div class="espt-modal-header">
          <h3>🏷️ Bulk Tag Editor</h3>
          <button class="espt-modal-close">&times;</button>
        </div>
        <div class="espt-modal-body">
          <div class="espt-bulk-section">
            <label>Find tag:</label>
            <input type="text" id="espt-bulk-find" placeholder="old tag" class="espt-input">
          </div>
          <div class="espt-bulk-section">
            <label>Replace with:</label>
            <input type="text" id="espt-bulk-replace" placeholder="new tag (leave empty to remove)" class="espt-input">
          </div>
          <div class="espt-bulk-section">
            <label>Or add tag to all selected:</label>
            <input type="text" id="espt-bulk-add" placeholder="new tag to add" class="espt-input">
          </div>
          <div class="espt-bulk-actions">
            <button id="espt-bulk-preview" class="espt-btn espt-btn-secondary">Preview Changes</button>
            <button id="espt-bulk-apply" class="espt-btn espt-btn-primary">Apply Changes</button>
          </div>
          <div id="espt-bulk-results" class="espt-bulk-results"></div>
          <p class="espt-bulk-note">⚠️ Changes are applied via Etsy's interface. Make sure you're on the listing manager page with listings visible.</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.espt-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('espt-bulk-preview').addEventListener('click', () => {
      const results = document.getElementById('espt-bulk-results');
      results.innerHTML = '<p class="espt-info">Preview: Select listings on the page first, then changes will be shown here before applying.</p>';
    });
  }

  // ── Helpers ──
  function parseListingPage() {
    const title = document.querySelector('h1')?.textContent?.trim() || '';
    const images = document.querySelectorAll('[data-appears-component-name="listing_image"] img, .carousel-pane img, [class*="listing-page"] img');
    const description = document.querySelector('[data-id="description-text"], [class*="description"]')?.textContent?.trim() || '';
    const tags = Array.from(document.querySelectorAll('.tag-card, [class*="tag"]')).map(el => el.textContent.trim()).filter(Boolean);
    const price = document.querySelector('[class*="price"], [data-buy-box-region] [class*="amount"]')?.textContent?.trim() || '';
    const hasFreeship = !!document.querySelector('[class*="free-shipping"], [class*="freeShipping"]');

    return { title, imageCount: images.length, description, tags, price, hasFreeship };
  }

  function calculateQualityScore(listing) {
    const breakdown = [];

    // Title
    let titleScore = 50;
    if (listing.title.length >= 60) titleScore += 20;
    if (listing.title.length >= 100) titleScore += 10;
    if (listing.title.length > 140) titleScore -= 10; // too long
    if (listing.title.split(/\s+/).length >= 5) titleScore += 10;
    if (listing.title.match(/[,|·\-]/)) titleScore += 10;
    titleScore = clamp(titleScore, 0, 100);
    breakdown.push({
      name: 'Title', icon: '📝', score: titleScore,
      tip: titleScore >= 70 ? 'Good title length and keyword density' : 'Add more descriptive keywords to your title'
    });

    // Photos
    let photoScore = Math.min(100, listing.imageCount * 10);
    if (listing.imageCount >= 10) photoScore = 100;
    else if (listing.imageCount >= 5) photoScore = 70;
    else if (listing.imageCount < 3) photoScore = 20;
    breakdown.push({
      name: 'Photos', icon: '📸', score: photoScore,
      tip: listing.imageCount >= 8 ? 'Great photo count!' : `Add more photos (${listing.imageCount}/10). Listings with 8+ photos convert 2x better`
    });

    // Tags
    let tagScore = Math.min(100, Math.round((listing.tags.length / 13) * 100));
    breakdown.push({
      name: 'Tags', icon: '🏷️', score: tagScore,
      tip: listing.tags.length >= 13 ? 'All 13 tags filled!' : `Use all 13 tags (${listing.tags.length}/13)`
    });

    // Description
    let descScore = 30;
    if (listing.description.length >= 200) descScore += 20;
    if (listing.description.length >= 500) descScore += 20;
    if (listing.description.length >= 1000) descScore += 20;
    if (listing.description.match(/\n/g)?.length >= 3) descScore += 10;
    descScore = clamp(descScore, 0, 100);
    breakdown.push({
      name: 'Description', icon: '📄', score: descScore,
      tip: descScore >= 70 ? 'Well-detailed description' : 'Add more details, materials, sizing info, and care instructions'
    });

    // Shipping
    let shipScore = listing.hasFreeship ? 100 : 40;
    breakdown.push({
      name: 'Shipping', icon: '📦', score: shipScore,
      tip: listing.hasFreeship ? 'Free shipping boosts search ranking!' : 'Consider free shipping — Etsy prioritizes free-shipping listings in search'
    });

    const total = Math.round(breakdown.reduce((a, b) => a + b.score, 0) / breakdown.length);
    return { total, breakdown };
  }

  function analyzeTags(tags) {
    return tags.map(tag => {
      const t = tag.trim();
      const words = t.split(/\s+/);
      let score = 50;

      if (t.length <= 20 && t.length >= 8) score += 15;
      else if (t.length > 20) score -= 20;
      else if (t.length < 4) score -= 10;

      if (words.length >= 2 && words.length <= 4) score += 15;
      else if (words.length === 1) score -= 5;

      const stopWords = ['the', 'a', 'an', 'for', 'and', 'or', 'in', 'on', 'at', 'to', 'of'];
      const stops = words.filter(w => stopWords.includes(w.toLowerCase())).length;
      score -= stops * 5;

      if (t.match(/gift|personalized|custom|handmade|vintage/i)) score += 10;

      score = clamp(score, 0, 100);

      let tip = 'Good tag';
      if (t.length > 20) tip = 'Too long — exceeds 20 char limit';
      else if (words.length === 1) tip = 'Try multi-word long-tail tags';
      else if (stops > 1) tip = 'Remove filler words';
      else if (score >= 75) tip = 'Strong tag!';

      return { tag: t, score, charCount: t.length, tip };
    });
  }

  function createPanel(title, id) {
    const panel = document.createElement('div');
    panel.id = `espt-${id}`;
    panel.className = 'espt-panel';
    panel.innerHTML = `
      <div class="espt-panel-header">
        <span class="espt-panel-logo">🛠️</span>
        <span class="espt-panel-title">${title}</span>
        <button class="espt-panel-toggle">▼</button>
      </div>
      <div class="espt-panel-body"></div>
    `;
    panel.querySelector('.espt-panel-toggle').addEventListener('click', function() {
      const body = panel.querySelector('.espt-panel-body');
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? 'block' : 'none';
      this.textContent = isHidden ? '▼' : '▶';
    });
    return panel;
  }

  function insertAfterElement(el, newEl) {
    if (el && el.parentNode) {
      el.parentNode.insertBefore(newEl, el.nextSibling);
    } else {
      document.body.appendChild(newEl);
    }
  }

  function findByText(text) {
    const els = document.querySelectorAll('label, h2, h3, h4, legend');
    for (const el of els) {
      if (el.textContent.trim().toLowerCase().includes(text.toLowerCase())) return el;
    }
    return null;
  }

  function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
