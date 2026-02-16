/* eBay Seller Analytics — Content Script */

(function() {
  'use strict';

  // ─── State ───
  let settings = {};
  let isPro = false;
  const BADGE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };

  // ─── Init ───
  async function init() {
    const res = await sendMsg({ type: 'get-settings' });
    settings = res.settings || {};

    const payRes = await sendMsg({ type: 'get-payment-status' });
    isPro = payRes.paid;

    const url = window.location.href;

    if (url.includes('/sh/ovw')) {
      injectDashboardOverlay();
    }
    if (url.includes('/sh/lst/active')) {
      injectActiveListingsEnhancements();
    }
    if (url.includes('/sh/lst/sold') || url.includes('/sh/ord')) {
      injectSoldItemsTracking();
    }
    if (url.includes('/sh/lst/unsold')) {
      injectUnsoldEnhancements();
    }
    if (url.includes('/itm/')) {
      injectListingPageOverlay();
    }
    if (url.includes('/sch/')) {
      injectSearchPageOverlay();
    }
  }

  // ─── Utility ───
  function sendMsg(msg) {
    return new Promise(resolve => chrome.runtime.sendMessage(msg, resolve));
  }

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k === 'textContent') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c) el.appendChild(c);
    });
    return el;
  }

  function formatCurrency(n) {
    return '$' + parseFloat(n || 0).toFixed(2);
  }

  function trendArrow(pct) {
    if (pct > 0) return `<span class="esa-trend-up">↑${Math.abs(pct)}%</span>`;
    if (pct < 0) return `<span class="esa-trend-down">↓${Math.abs(pct)}%</span>`;
    return '<span class="esa-trend-flat">→0%</span>';
  }

  // ─── Dashboard Overlay (Seller Hub Overview) ───
  async function injectDashboardOverlay() {
    const data = await sendMsg({ type: 'get-dashboard-data' });
    if (!data) return;

    const container = createElement('div', { className: 'esa-dashboard' });
    container.innerHTML = `
      <div class="esa-dashboard-header">
        <div class="esa-logo">📊 eBay Seller Analytics</div>
        <div class="esa-badge ${isPro ? 'esa-pro' : 'esa-free'}">${isPro ? 'PRO' : 'FREE'}</div>
      </div>

      <div class="esa-stats-grid">
        <div class="esa-stat-card">
          <div class="esa-stat-label">Today</div>
          <div class="esa-stat-value">${data.today.count} sales</div>
          <div class="esa-stat-sub">${formatCurrency(data.today.revenue)} revenue</div>
          <div class="esa-stat-profit">Net: ${formatCurrency(data.today.profit)}</div>
        </div>
        <div class="esa-stat-card">
          <div class="esa-stat-label">This Week</div>
          <div class="esa-stat-value">${data.week.count} sales</div>
          <div class="esa-stat-sub">${formatCurrency(data.week.revenue)} revenue</div>
          <div class="esa-stat-profit">Net: ${formatCurrency(data.week.profit)}</div>
        </div>
        <div class="esa-stat-card">
          <div class="esa-stat-label">This Month</div>
          <div class="esa-stat-value">${data.month.count} sales</div>
          <div class="esa-stat-sub">${formatCurrency(data.month.revenue)} revenue</div>
          <div class="esa-stat-profit">Net: ${formatCurrency(data.month.profit)}</div>
        </div>
        <div class="esa-stat-card">
          <div class="esa-stat-label">Competitors</div>
          <div class="esa-stat-value">${data.competitorCount} tracked</div>
          <div class="esa-stat-sub">${isPro ? 'Monitoring active' : '<a href="#" class="esa-upgrade-link">Upgrade for monitoring</a>'}</div>
        </div>
      </div>

      <div class="esa-chart-container">
        <div class="esa-chart-title">30-Day Revenue & Sales</div>
        <canvas id="esa-revenue-chart" width="700" height="180"></canvas>
      </div>
    `;

    // Insert at top of seller hub
    waitForElement('.sh-ovw', (target) => {
      target.parentNode.insertBefore(container, target);
      drawChart(data.chartData);
    });

    // Fallback: just insert at top of main content
    setTimeout(() => {
      if (!document.querySelector('.esa-dashboard')) {
        const main = document.querySelector('#mainContent, main, .container') || document.body;
        main.insertBefore(container, main.firstChild);
        drawChart(data.chartData);
      }
    }, 2000);
  }

  function drawChart(chartData) {
    const canvas = document.getElementById('esa-revenue-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 10, right: 10, bottom: 30, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
    const maxSales = Math.max(...chartData.map(d => d.sales), 1);

    // Revenue bars
    const barW = plotW / chartData.length * 0.6;
    chartData.forEach((d, i) => {
      const x = pad.left + (i / chartData.length) * plotW + barW * 0.3;
      const h = (d.revenue / maxRev) * plotH;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(x, pad.top + plotH - h, barW, h);
    });

    // Sales line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    chartData.forEach((d, i) => {
      const x = pad.left + (i / (chartData.length - 1)) * plotW;
      const y = pad.top + plotH - (d.sales / maxSales) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Profit line
    const maxProfit = Math.max(...chartData.map(d => Math.abs(d.profit)), 1);
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    chartData.forEach((d, i) => {
      const x = pad.left + (i / (chartData.length - 1)) * plotW;
      const y = pad.top + plotH - ((d.profit + maxProfit) / (2 * maxProfit)) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis labels (every 5 days)
    ctx.fillStyle = '#666';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    chartData.forEach((d, i) => {
      if (i % 5 === 0 || i === chartData.length - 1) {
        const x = pad.left + (i / (chartData.length - 1)) * plotW;
        ctx.fillText(d.date.slice(5), x, H - 5);
      }
    });

    // Y-axis
    ctx.textAlign = 'right';
    ctx.fillText('$' + maxRev.toFixed(0), pad.left - 5, pad.top + 10);
    ctx.fillText('$0', pad.left - 5, pad.top + plotH);

    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('● Sales', W - 150, 15);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● Profit', W - 80, 15);
  }

  // ─── Active Listings: Quality Scores + Profit Overlay ───
  async function injectActiveListingsEnhancements() {
    waitForElement('.listings, [class*="listing"], table tbody tr, .sh-lst', (container) => {
      // Look for listing rows
      const rows = document.querySelectorAll('tr[data-listingid], .listing-row, [class*="listingEntry"]');
      if (rows.length === 0) {
        // Try a more generic approach for eBay's dynamic content
        observeAndEnhanceListings();
        return;
      }
      rows.forEach(row => enhanceListingRow(row));
    });
    observeAndEnhanceListings();
  }

  function observeAndEnhanceListings() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // Look for listing elements
            const listings = node.querySelectorAll?.('[data-listingid], .listing-row, tr') || [];
            listings.forEach(el => {
              if (!el.dataset.esaEnhanced) enhanceListingRow(el);
            });
            if (node.dataset && !node.dataset.esaEnhanced && (node.dataset.listingid || node.classList?.contains('listing-row'))) {
              enhanceListingRow(node);
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function enhanceListingRow(row) {
    if (row.dataset.esaEnhanced) return;
    row.dataset.esaEnhanced = 'true';

    // Extract listing data from the row
    const titleEl = row.querySelector('a[href*="/itm/"], .item-title, [class*="title"]');
    const priceEl = row.querySelector('[class*="price"], .item-price');

    if (!titleEl) return;

    const title = titleEl.textContent.trim();
    const priceText = priceEl?.textContent || '';
    const priceMatch = priceText.match(/\$?([\d,.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
    const itemUrl = titleEl.href || '';
    const itemIdMatch = itemUrl.match(/\/itm\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : row.dataset?.listingid || '';

    // Get listing quality score
    const listing = {
      title,
      photoCount: row.querySelectorAll('img').length || 1,
      descriptionLength: 200, // estimate for list view
      specificsCount: 5, // estimate
      freeShipping: row.textContent.toLowerCase().includes('free shipping'),
      returnsAccepted: !row.textContent.toLowerCase().includes('no returns')
    };

    const scoreRes = await sendMsg({ type: 'get-listing-score', listing });

    // Inject quality score badge
    if (settings.showQualityScore !== false && scoreRes) {
      const badge = createElement('div', {
        className: `esa-quality-badge esa-grade-${scoreRes.grade}`,
        innerHTML: `<span class="esa-grade">${scoreRes.grade}</span><span class="esa-score">${scoreRes.score}</span>`,
        title: scoreRes.breakdown.map(b => `${b.item}: ${b.score}/${b.max} — ${b.tip}`).join('\n')
      });
      const titleContainer = titleEl.parentElement || titleEl;
      titleContainer.style.position = 'relative';
      titleContainer.appendChild(badge);
    }

    // Inject profit calculator
    if (settings.showProfitOverlay !== false && price > 0) {
      const profitRes = await sendMsg({ type: 'get-profit', price, shippingCharged: 0, itemId });
      if (profitRes) {
        const profitEl = createElement('div', {
          className: `esa-profit-inline ${parseFloat(profitRes.profit) >= 0 ? 'esa-profit-pos' : 'esa-profit-neg'}`,
          innerHTML: `
            <span class="esa-profit-label">Net:</span>
            <span class="esa-profit-amount">${formatCurrency(profitRes.profit)}</span>
            <span class="esa-profit-margin">(${profitRes.margin}%)</span>
            <button class="esa-edit-cog" data-itemid="${itemId}" title="Edit cost of goods">✏️</button>
          `
        });

        // COG edit button
        const editBtn = profitEl.querySelector('.esa-edit-cog');
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showCOGEditor(itemId, price, profitEl);
        });

        const priceContainer = priceEl?.parentElement || titleEl.parentElement;
        priceContainer.appendChild(profitEl);
      }
    }
  }

  function showCOGEditor(itemId, price, profitEl) {
    const existing = document.querySelector('.esa-cog-editor');
    if (existing) existing.remove();

    const editor = createElement('div', { className: 'esa-cog-editor' });
    editor.innerHTML = `
      <div class="esa-cog-title">Edit Costs — Item #${itemId}</div>
      <label>Cost of Goods: $<input type="number" id="esa-cog-input" step="0.01" min="0" placeholder="0.00"></label>
      <label>Shipping Cost: $<input type="number" id="esa-ship-input" step="0.01" min="0" placeholder="0.00"></label>
      <div class="esa-cog-actions">
        <button id="esa-cog-save" class="esa-btn esa-btn-primary">Save</button>
        <button id="esa-cog-cancel" class="esa-btn">Cancel</button>
      </div>
    `;

    profitEl.appendChild(editor);

    document.getElementById('esa-cog-save').addEventListener('click', async () => {
      const cog = document.getElementById('esa-cog-input').value;
      const shipping = document.getElementById('esa-ship-input').value;
      await sendMsg({ type: 'update-cog', itemId, cog, shipping });
      editor.remove();
      // Refresh profit display
      const profitRes = await sendMsg({ type: 'get-profit', price, shippingCharged: 0, itemId });
      if (profitRes) {
        const amountEl = profitEl.querySelector('.esa-profit-amount');
        const marginEl = profitEl.querySelector('.esa-profit-margin');
        if (amountEl) amountEl.textContent = formatCurrency(profitRes.profit);
        if (marginEl) marginEl.textContent = `(${profitRes.margin}%)`;
        profitEl.className = `esa-profit-inline ${parseFloat(profitRes.profit) >= 0 ? 'esa-profit-pos' : 'esa-profit-neg'}`;
      }
    });

    document.getElementById('esa-cog-cancel').addEventListener('click', () => editor.remove());
  }

  // ─── Sold Items Tracking ───
  function injectSoldItemsTracking() {
    waitForElement('table, .sh-lst, [class*="sold"]', () => {
      observeSoldItems();
      injectVelocityWidget();
    });
  }

  function observeSoldItems() {
    const processed = new Set();
    const observer = new MutationObserver(() => scanSoldItems(processed));
    observer.observe(document.body, { childList: true, subtree: true });
    scanSoldItems(processed);
  }

  function scanSoldItems(processed) {
    const rows = document.querySelectorAll('tr[data-listingid], .sold-item, [class*="order"]');
    rows.forEach(row => {
      const id = row.dataset?.listingid || row.dataset?.orderid;
      if (!id || processed.has(id)) return;
      processed.add(id);

      const priceEl = row.querySelector('[class*="price"]');
      const priceMatch = (priceEl?.textContent || '').match(/\$?([\d,.]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

      if (price > 0) {
        // Calculate profit inline
        sendMsg({ type: 'get-profit', price, shippingCharged: 0, itemId: id }).then(res => {
          if (res) {
            sendMsg({
              type: 'record-sale',
              item: { id, price, profit: parseFloat(res.profit), fees: parseFloat(res.totalFees) }
            });
          }
        });
      }
    });
  }

  async function injectVelocityWidget() {
    const stats = await sendMsg({ type: 'get-stats' });
    if (!stats) return;

    const widget = createElement('div', { className: 'esa-velocity-widget' });
    widget.innerHTML = `
      <div class="esa-widget-title">📈 Sales Velocity</div>
      <div class="esa-velocity-grid">
        <div class="esa-vel-item">
          <span class="esa-vel-num">${stats.today.count}</span>
          <span class="esa-vel-label">Today</span>
        </div>
        <div class="esa-vel-item">
          <span class="esa-vel-num">${stats.week.count}</span>
          <span class="esa-vel-label">This Week</span>
          ${trendArrow(stats.velocityTrend)}
        </div>
        <div class="esa-vel-item">
          <span class="esa-vel-num">${stats.month.count}</span>
          <span class="esa-vel-label">This Month</span>
        </div>
        <div class="esa-vel-item">
          <span class="esa-vel-num">${formatCurrency(stats.month.revenue)}</span>
          <span class="esa-vel-label">Monthly Rev</span>
        </div>
      </div>
    `;

    const main = document.querySelector('#mainContent, main, .sh-lst') || document.body;
    main.insertBefore(widget, main.firstChild);
  }

  // ─── Unsold: Relist Actions ───
  function injectUnsoldEnhancements() {
    if (!isPro) return;

    waitForElement('table, .sh-lst', (container) => {
      const actionBar = createElement('div', { className: 'esa-bulk-bar' });
      actionBar.innerHTML = `
        <div class="esa-bulk-title">⚡ Bulk Actions (Pro)</div>
        <label class="esa-checkbox"><input type="checkbox" id="esa-select-all"> Select All</label>
        <button class="esa-btn esa-btn-primary" id="esa-bulk-relist">Relist Selected</button>
        <button class="esa-btn" id="esa-bulk-price">Update Prices</button>
      `;
      container.parentNode.insertBefore(actionBar, container);

      document.getElementById('esa-select-all')?.addEventListener('change', (e) => {
        document.querySelectorAll('.esa-item-check').forEach(cb => cb.checked = e.target.checked);
      });

      document.getElementById('esa-bulk-relist')?.addEventListener('click', () => {
        const selected = getSelectedItems();
        if (selected.length === 0) { alert('Select items to relist'); return; }
        if (confirm(`Relist ${selected.length} items?`)) {
          sendMsg({ type: 'bulk-action', action: 'relist', items: selected });
        }
      });

      document.getElementById('esa-bulk-price')?.addEventListener('click', () => {
        const selected = getSelectedItems();
        if (selected.length === 0) { alert('Select items first'); return; }
        const adjustment = prompt('Price adjustment (e.g., -10% or -5.00):');
        if (adjustment) {
          sendMsg({ type: 'bulk-action', action: 'update-price', items: selected, params: { adjustment } });
        }
      });

      // Add checkboxes to rows
      const rows = container.querySelectorAll('tr, .listing-row');
      rows.forEach(row => {
        const id = row.dataset?.listingid;
        if (id) {
          const cb = createElement('input', { type: 'checkbox', className: 'esa-item-check', 'data-id': id });
          const firstCell = row.querySelector('td') || row;
          firstCell.insertBefore(cb, firstCell.firstChild);
        }
      });
    });
  }

  function getSelectedItems() {
    return [...document.querySelectorAll('.esa-item-check:checked')].map(cb => cb.dataset.id);
  }

  // ─── Individual Listing Page ───
  async function injectListingPageOverlay() {
    waitForElement('#mainContent, .itemInfo, [class*="item-info"]', async () => {
      const title = document.querySelector('h1, .x-item-title, [class*="item-title"]')?.textContent?.trim() || '';
      const priceEl = document.querySelector('.x-price-primary, [class*="price"], #prcIsum');
      const priceMatch = (priceEl?.textContent || '').match(/\$?([\d,.]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
      const images = document.querySelectorAll('[class*="image"] img, .ux-image-carousel img, #icImg');
      const photoCount = images.length || 1;
      const descFrame = document.querySelector('#desc_ifr, iframe[src*="desc"]');
      let descLen = 200;
      try { descLen = descFrame?.contentDocument?.body?.textContent?.length || 200; } catch (e) {}
      const specificsItems = document.querySelectorAll('.ux-labels-values, [class*="specifics"] tr, .itemAttr tr');
      const specificsCount = specificsItems.length;
      const freeShipping = document.body.textContent.includes('FREE shipping') || document.body.textContent.includes('Free shipping');
      const returnsAccepted = !document.body.textContent.includes('No returns');

      const urlMatch = window.location.href.match(/\/itm\/(\d+)/);
      const itemId = urlMatch ? urlMatch[1] : '';

      // Quality score
      const scoreRes = await sendMsg({
        type: 'get-listing-score',
        listing: { title, photoCount, descriptionLength: descLen, specificsCount, freeShipping, returnsAccepted }
      });

      // Profit calculator
      const profitRes = await sendMsg({ type: 'get-profit', price, shippingCharged: 0, itemId });

      // Build overlay panel
      const panel = createElement('div', { className: 'esa-listing-panel' });
      panel.innerHTML = `
        <div class="esa-panel-header">📊 eBay Seller Analytics</div>

        ${scoreRes ? `
        <div class="esa-section">
          <div class="esa-section-title">Listing Quality Score</div>
          <div class="esa-score-display">
            <div class="esa-score-circle esa-grade-${scoreRes.grade}">
              <span class="esa-big-grade">${scoreRes.grade}</span>
              <span class="esa-big-score">${scoreRes.score}/100</span>
            </div>
            <div class="esa-score-breakdown">
              ${scoreRes.breakdown.map(b => `
                <div class="esa-breakdown-item">
                  <div class="esa-breakdown-label">${b.item}</div>
                  <div class="esa-breakdown-bar">
                    <div class="esa-breakdown-fill" style="width:${(b.score/b.max*100)}%"></div>
                  </div>
                  <div class="esa-breakdown-val">${b.score}/${b.max}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="esa-tips">
            ${scoreRes.breakdown.filter(b => b.score < b.max).map(b => `<div class="esa-tip">💡 ${b.tip}</div>`).join('')}
          </div>
        </div>
        ` : ''}

        ${profitRes && price > 0 ? `
        <div class="esa-section">
          <div class="esa-section-title">Profit Calculator</div>
          <div class="esa-profit-table">
            <div class="esa-profit-row"><span>Sale Price</span><span>${formatCurrency(profitRes.salePrice)}</span></div>
            <div class="esa-profit-row esa-fee"><span>eBay Fee (13.25%)</span><span>-${formatCurrency(profitRes.ebayFee)}</span></div>
            <div class="esa-profit-row esa-fee"><span>Payment Fee</span><span>-${formatCurrency(profitRes.paymentFee)}</span></div>
            <div class="esa-profit-row esa-fee"><span>Cost of Goods</span><span>-${formatCurrency(profitRes.cog)}</span></div>
            <div class="esa-profit-row esa-fee"><span>Shipping Cost</span><span>-${formatCurrency(profitRes.shippingCost)}</span></div>
            <div class="esa-profit-row esa-total ${parseFloat(profitRes.profit) >= 0 ? 'esa-profit-pos' : 'esa-profit-neg'}">
              <span>Net Profit</span><span>${formatCurrency(profitRes.profit)} (${profitRes.margin}%)</span>
            </div>
          </div>
          <button class="esa-btn esa-btn-sm" id="esa-edit-listing-cog">Edit Costs</button>
        </div>
        ` : ''}

        <div class="esa-section">
          <button class="esa-btn esa-btn-primary esa-btn-full" id="esa-track-competitor">
            ${isPro ? '👁️ Track This Competitor' : '🔒 Track Competitor (Pro)'}
          </button>
        </div>
      `;

      // Insert panel
      const sidebar = document.querySelector('.vi-cvipSidebar, [class*="sidebar"], .ux-layout-section--evo__col') || document.querySelector('#mainContent');
      if (sidebar) {
        sidebar.appendChild(panel);
      }

      // Event handlers
      document.getElementById('esa-edit-listing-cog')?.addEventListener('click', () => {
        showCOGEditor(itemId, price, panel.querySelector('.esa-profit-table'));
      });

      document.getElementById('esa-track-competitor')?.addEventListener('click', async () => {
        const seller = document.querySelector('.x-sellercard-atf__info__about-seller a, [class*="seller"] a')?.textContent?.trim() || 'Unknown';
        const res = await sendMsg({
          type: 'add-competitor',
          listing: { id: itemId, title, url: window.location.href, price, seller }
        });
        if (res.success) {
          alert(`Now tracking this listing. ${res.total}/50 slots used.`);
        } else {
          alert(res.error);
        }
      });
    });
  }

  // ─── Search Page: Competitor Overlay ───
  function injectSearchPageOverlay() {
    if (!isPro) return;

    waitForElement('.srp-results, .s-item, [class*="result"]', () => {
      const items = document.querySelectorAll('.s-item, [class*="result-item"]');
      items.forEach(item => {
        const priceEl = item.querySelector('.s-item__price, [class*="price"]');
        const priceMatch = (priceEl?.textContent || '').match(/\$?([\d,.]+)/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(',', ''));
          const trackBtn = createElement('button', {
            className: 'esa-track-btn',
            textContent: '📌 Track',
            onClick: async () => {
              const title = item.querySelector('.s-item__title, [class*="title"]')?.textContent?.trim() || '';
              const link = item.querySelector('a[href*="/itm/"]');
              const url = link?.href || '';
              const idMatch = url.match(/\/itm\/(\d+)/);
              const seller = item.querySelector('.s-item__seller-info, [class*="seller"]')?.textContent?.trim() || '';
              const res = await sendMsg({
                type: 'add-competitor',
                listing: { id: idMatch?.[1] || '', title, url, price, seller }
              });
              if (res.success) {
                trackBtn.textContent = '✅ Tracked';
                trackBtn.disabled = true;
              } else {
                alert(res.error);
              }
            }
          });
          const container = priceEl?.parentElement || item;
          container.appendChild(trackBtn);
        }
      });
    });
  }

  // ─── Bulk Action Executor (from background) ───
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'execute-bulk-action') {
      executeBulkAction(msg.action, msg.items, msg.params);
    }
  });

  async function executeBulkAction(action, items, params) {
    // eBay Seller Hub uses specific button classes for actions
    // This simulates clicking the appropriate buttons
    if (action === 'relist') {
      for (const itemId of items) {
        const row = document.querySelector(`tr[data-listingid="${itemId}"], [data-listingid="${itemId}"]`);
        if (row) {
          const relistBtn = row.querySelector('button[class*="relist"], a[href*="relist"], [data-action="relist"]');
          if (relistBtn) relistBtn.click();
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } else if (action === 'update-price') {
      const adj = params.adjustment;
      const isPercent = adj.includes('%');
      const value = parseFloat(adj.replace('%', ''));

      for (const itemId of items) {
        const row = document.querySelector(`tr[data-listingid="${itemId}"], [data-listingid="${itemId}"]`);
        if (row) {
          const priceEl = row.querySelector('[class*="price"] input, input[name*="price"]');
          if (priceEl) {
            const currentPrice = parseFloat(priceEl.value) || 0;
            const newPrice = isPercent
              ? currentPrice * (1 + value / 100)
              : currentPrice + value;
            priceEl.value = Math.max(0.01, newPrice).toFixed(2);
            priceEl.dispatchEvent(new Event('input', { bubbles: true }));
            priceEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    }
  }

  // ─── Helper: Wait for Element ───
  function waitForElement(selector, callback, timeout = 10000) {
    const el = document.querySelector(selector);
    if (el) { callback(el); return; }

    const observer = new MutationObserver((mutations, obs) => {
      const found = document.querySelector(selector);
      if (found) {
        obs.disconnect();
        callback(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), timeout);
  }

  // ─── Start ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
