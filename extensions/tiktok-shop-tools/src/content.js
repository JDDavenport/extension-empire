/* TikTok Shop Seller Tools — Content Script */
(() => {
  'use strict';

  // Prevent double-injection
  if (window.__tiktokShopToolsInjected) return;
  window.__tiktokShopToolsInjected = true;

  // ─── Utilities ───
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function formatCurrency(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  // ─── Data Extraction ───
  // These selectors target common patterns in TikTok Shop seller dashboard.
  // They may need updates as TikTok changes their DOM.
  function extractDashboardData() {
    const data = {
      revenue: 0,
      orders: 0,
      visitors: 0,
      conversionRate: 0,
      topProducts: [],
      inventory: [],
    };

    try {
      // Try to extract from the seller dashboard page
      // Look for key metric cards
      const metricCards = $$('[class*="metric"], [class*="summary"], [class*="overview"] [class*="value"], [class*="DataCard"], [class*="data-card"]');
      
      // Extract text content that looks like numbers/currency
      const allText = document.body.innerText;
      
      // Revenue pattern: $X,XXX.XX
      const revenueMatch = allText.match(/(?:Revenue|Sales|GMV|Total\s*Sales)[:\s]*\$?([\d,]+\.?\d*)/i);
      if (revenueMatch) data.revenue = parseFloat(revenueMatch[1].replace(/,/g, ''));

      // Orders pattern
      const ordersMatch = allText.match(/(?:Orders|Total\s*Orders)[:\s]*([\d,]+)/i);
      if (ordersMatch) data.orders = parseInt(ordersMatch[1].replace(/,/g, ''));

      // Visitors
      const visitorsMatch = allText.match(/(?:Visitors|Page\s*Views|Traffic)[:\s]*([\d,]+)/i);
      if (visitorsMatch) data.visitors = parseInt(visitorsMatch[1].replace(/,/g, ''));

      // Conversion rate
      const convMatch = allText.match(/(?:Conversion|Conv\.?\s*Rate)[:\s]*([\d.]+)%/i);
      if (convMatch) data.conversionRate = parseFloat(convMatch[1]);

      // Try to extract product rows from tables
      const tableRows = $$('table tbody tr, [class*="product-row"], [class*="ProductItem"], [class*="list-item"]');
      tableRows.slice(0, 20).forEach(row => {
        const cells = $$('td, [class*="cell"], [class*="col"]', row);
        if (cells.length >= 2) {
          const name = cells[0]?.textContent?.trim().slice(0, 60);
          const stockText = cells.find(c => /^\d+$/.test(c.textContent.trim()));
          const priceText = cells.find(c => /\$[\d,.]+/.test(c.textContent.trim()));
          
          if (name && name.length > 2) {
            const stock = stockText ? parseInt(stockText.textContent.trim()) : null;
            const price = priceText ? parseFloat(priceText.textContent.match(/\$([\d,.]+)/)?.[1]?.replace(/,/g, '') || 0) : null;
            
            data.topProducts.push({ name, stock, price });
            if (stock !== null) {
              data.inventory.push({ name, stock, price });
            }
          }
        }
      });

      // Also look for specific TikTok Shop DOM patterns
      $$('[class*="product-name"], [class*="ProductName"]').forEach((el, i) => {
        if (i >= 10) return;
        const row = el.closest('tr, [class*="row"], [class*="item"]');
        const name = el.textContent.trim().slice(0, 60);
        if (!name || data.topProducts.find(p => p.name === name)) return;
        
        let stock = null, price = null;
        if (row) {
          const stockEl = $('[class*="stock"], [class*="inventory"], [class*="quantity"]', row);
          const priceEl = $('[class*="price"]', row);
          if (stockEl) stock = parseInt(stockEl.textContent.replace(/\D/g, '')) || null;
          if (priceEl) price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || null;
        }
        data.topProducts.push({ name, stock, price });
        if (stock !== null) data.inventory.push({ name, stock, price });
      });

    } catch (e) {
      console.warn('[TikTok Shop Tools] Data extraction error:', e);
    }

    return data;
  }

  function extractOrdersForExport() {
    const orders = [];
    try {
      const rows = $$('table tbody tr, [class*="order-row"], [class*="OrderItem"], [class*="order-item"]');
      rows.forEach(row => {
        const cells = $$('td, [class*="cell"]', row);
        const texts = cells.map(c => c.textContent.trim());
        if (texts.length >= 2) {
          orders.push(texts);
        }
      });
      
      // Get headers
      const headerRow = $('table thead tr, [class*="header-row"]');
      let headers = [];
      if (headerRow) {
        headers = $$('th, [class*="header-cell"]', headerRow).map(h => h.textContent.trim());
      }
      if (!headers.length) headers = ['Order ID', 'Product', 'Amount', 'Status', 'Date'];
      
      return { headers, orders };
    } catch (e) {
      console.warn('[TikTok Shop Tools] Order extraction error:', e);
      return { headers: [], orders: [] };
    }
  }

  // ─── Dashboard Overlay ───
  function createDashboard() {
    if ($('#ttst-dashboard')) return;

    const dash = document.createElement('div');
    dash.id = 'ttst-dashboard';
    dash.innerHTML = `
      <style>
        #ttst-dashboard {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 340px;
          max-height: 520px;
          background: #1a1a2e;
          border: 1px solid rgba(254, 44, 85, 0.3);
          border-radius: 16px;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          z-index: 999999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        #ttst-dashboard.ttst-collapsed {
          max-height: 44px;
          width: 200px;
        }
        #ttst-dashboard.ttst-collapsed .ttst-body { display: none; }
        .ttst-header {
          background: linear-gradient(135deg, #fe2c55 0%, #25f4ee 100%);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: move;
          user-select: none;
        }
        .ttst-header-title {
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ttst-header-actions { display: flex; gap: 6px; }
        .ttst-header-actions button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ttst-header-actions button:hover { background: rgba(255,255,255,0.35); }
        .ttst-body { padding: 14px; overflow-y: auto; max-height: 460px; }
        .ttst-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .ttst-metric {
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 10px;
        }
        .ttst-metric-label { color: #888; font-size: 11px; margin-bottom: 4px; }
        .ttst-metric-value { font-size: 20px; font-weight: 700; }
        .ttst-metric-trend { font-size: 11px; margin-top: 2px; }
        .ttst-metric-trend.up { color: #25f4ee; }
        .ttst-metric-trend.down { color: #fe2c55; }
        .ttst-section-title {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 12px 0 8px;
        }
        .ttst-product {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ttst-product:last-child { border: none; }
        .ttst-product-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 8px;
        }
        .ttst-product-stock { font-weight: 600; font-size: 12px; }
        .ttst-product-stock.low { color: #fe2c55; }
        .ttst-product-stock.ok { color: #25f4ee; }
        .ttst-btn {
          background: linear-gradient(135deg, #fe2c55, #ff6b81);
          border: none;
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          width: 100%;
          margin-top: 8px;
          transition: opacity 0.2s;
        }
        .ttst-btn:hover { opacity: 0.85; }
        .ttst-btn.secondary {
          background: rgba(255,255,255,0.1);
        }
        .ttst-reply-bar {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999998;
          display: none;
        }
        .ttst-reply-bar.active { display: flex; gap: 6px; flex-wrap: wrap; max-width: 400px; }
        .ttst-reply-chip {
          background: #1a1a2e;
          border: 1px solid rgba(254,44,85,0.3);
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .ttst-reply-chip:hover {
          background: #fe2c55;
          border-color: #fe2c55;
        }
        .ttst-empty { color: #555; text-align: center; padding: 20px 0; font-size: 12px; }
        .ttst-refresh-note { color: #555; font-size: 10px; text-align: center; margin-top: 8px; }
      </style>
      <div class="ttst-header">
        <span class="ttst-header-title">📊 TikTok Shop Tools</span>
        <div class="ttst-header-actions">
          <button id="ttst-refresh" title="Refresh">↻</button>
          <button id="ttst-toggle" title="Collapse">—</button>
          <button id="ttst-close" title="Close">✕</button>
        </div>
      </div>
      <div class="ttst-body" id="ttst-body">
        <div class="ttst-metrics" id="ttst-metrics"></div>
        <div class="ttst-section-title">Top Products</div>
        <div id="ttst-products"></div>
        <button class="ttst-btn" id="ttst-export">📥 Export Orders to CSV</button>
        <div class="ttst-refresh-note">Data refreshes every 60s • Click ↻ to refresh now</div>
      </div>
    `;
    document.body.appendChild(dash);

    // Reply bar for messaging pages
    const replyBar = document.createElement('div');
    replyBar.className = 'ttst-reply-bar';
    replyBar.id = 'ttst-reply-bar';
    document.body.appendChild(replyBar);

    // ─── Events ───
    let collapsed = false;
    $('#ttst-toggle').onclick = () => {
      collapsed = !collapsed;
      dash.classList.toggle('ttst-collapsed', collapsed);
      $('#ttst-toggle').textContent = collapsed ? '+' : '—';
    };

    $('#ttst-close').onclick = () => {
      dash.style.display = 'none';
      replyBar.classList.remove('active');
    };

    $('#ttst-refresh').onclick = () => refreshDashboard();
    $('#ttst-export').onclick = () => exportOrders();

    // Drag support
    makeDraggable(dash, $('.ttst-header', dash));

    // Initial load
    refreshDashboard();
    loadReplyTemplates();

    // Auto-refresh every 60s
    setInterval(refreshDashboard, 60000);
    
    // Show reply bar on messaging pages
    if (location.href.includes('message') || location.href.includes('chat')) {
      loadReplyTemplates();
    }
  }

  function refreshDashboard() {
    const data = extractDashboardData();
    const metricsEl = $('#ttst-metrics');
    const productsEl = $('#ttst-products');
    if (!metricsEl || !productsEl) return;

    const aov = data.orders > 0 ? (data.revenue / data.orders) : 0;

    metricsEl.innerHTML = `
      <div class="ttst-metric">
        <div class="ttst-metric-label">Revenue</div>
        <div class="ttst-metric-value">${formatCurrency(data.revenue)}</div>
      </div>
      <div class="ttst-metric">
        <div class="ttst-metric-label">Orders</div>
        <div class="ttst-metric-value">${formatNumber(data.orders)}</div>
      </div>
      <div class="ttst-metric">
        <div class="ttst-metric-label">Avg Order Value</div>
        <div class="ttst-metric-value">${formatCurrency(aov)}</div>
      </div>
      <div class="ttst-metric">
        <div class="ttst-metric-label">Conversion</div>
        <div class="ttst-metric-value">${data.conversionRate}%</div>
      </div>
    `;

    if (data.topProducts.length === 0) {
      productsEl.innerHTML = '<div class="ttst-empty">Navigate to your dashboard or products page to see data</div>';
    } else {
      productsEl.innerHTML = data.topProducts.slice(0, 5).map(p => {
        const stockClass = p.stock !== null ? (p.stock <= 10 ? 'low' : 'ok') : '';
        const stockText = p.stock !== null ? p.stock : '—';
        return `<div class="ttst-product">
          <span class="ttst-product-name">${p.name}</span>
          <span class="ttst-product-stock ${stockClass}">${stockText}</span>
        </div>`;
      }).join('');
    }

    // Save snapshot
    chrome.runtime.sendMessage({
      action: 'saveSalesSnapshot',
      snapshot: { revenue: data.revenue, orders: data.orders, aov, conversionRate: data.conversionRate }
    });

    // Save inventory
    if (data.inventory.length) {
      chrome.runtime.sendMessage({ action: 'saveInventory', inventory: data.inventory });
    }
  }

  function loadReplyTemplates() {
    chrome.runtime.sendMessage({ action: 'getTemplates' }, (resp) => {
      if (!resp?.templates?.length) return;
      const bar = $('#ttst-reply-bar');
      if (!bar) return;

      // Show on message/chat pages
      const isMessagePage = location.href.includes('message') || location.href.includes('chat') || location.href.includes('im');
      if (!isMessagePage) return;

      bar.classList.add('active');
      bar.innerHTML = resp.templates.map(t =>
        `<div class="ttst-reply-chip" data-text="${t.text.replace(/"/g, '&quot;')}" title="${t.text.slice(0, 80)}">${t.name}</div>`
      ).join('');

      bar.querySelectorAll('.ttst-reply-chip').forEach(chip => {
        chip.onclick = () => {
          const text = chip.dataset.text;
          // Try to find and fill the message input
          const input = $('textarea, [contenteditable="true"], input[type="text"]');
          if (input) {
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
              input.value = text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              input.textContent = text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
              chip.textContent = '✓ Copied!';
              setTimeout(() => { chip.textContent = chip.dataset.text?.slice(0, 20) || 'Template'; }, 1500);
            });
          }
        };
      });
    });
  }

  function exportOrders() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
      if (!settings?.isPro) {
        alert('CSV Export is a Pro feature. Upgrade to Pro ($14.99/mo) for unlimited exports, templates, competitor tracking & more!');
        return;
      }
      const { headers, orders } = extractOrdersForExport();
      if (!orders.length) {
        alert('No orders found on this page. Navigate to your Orders page first.');
        return;
      }
      const csv = [headers.join(','), ...orders.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiktok-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ─── Drag ───
  function makeDraggable(el, handle) {
    let isDragging = false, startX, startY, startLeft, startTop;
    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      el.style.left = (startLeft + e.clientX - startX) + 'px';
      el.style.top = (startTop + e.clientY - startY) + 'px';
      el.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
  }

  // ─── Inventory Highlighting ───
  function highlightLowStock() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
      if (!settings?.isPro) return;
      const threshold = settings.inventoryThreshold || 10;
      
      $$('[class*="stock"], [class*="inventory"], [class*="quantity"]').forEach(el => {
        const num = parseInt(el.textContent.replace(/\D/g, ''));
        if (!isNaN(num) && num <= threshold) {
          el.style.color = '#fe2c55';
          el.style.fontWeight = '700';
          if (!el.dataset.ttstAlert) {
            el.dataset.ttstAlert = '1';
            el.title = `⚠️ Low stock: ${num} remaining`;
          }
        }
      });
    });
  }

  // ─── Init ───
  async function init() {
    const settings = await new Promise(r => chrome.runtime.sendMessage({ action: 'getSettings' }, r));
    if (settings?.dashboardEnabled !== false) {
      // Small delay to let TikTok's SPA render
      await wait(1500);
      createDashboard();
      highlightLowStock();
    }

    // Re-check on SPA navigation
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => {
          refreshDashboard();
          loadReplyTemplates();
          highlightLowStock();
        }, 2000);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
