/* FB Marketplace Pro — Content Script */
(function () {
  'use strict';

  let isPro = false;
  const PANEL_ID = 'fbmp-panel';

  // ── Check pro status ──
  chrome.runtime.sendMessage({ action: 'checkPro' }, (r) => {
    isPro = r?.isPro || false;
    init();
  });

  function init() {
    if (document.getElementById(PANEL_ID)) return;
    injectFloatingButton();
    observeMessengerForTemplates();
  }

  // ── Floating Action Button ──
  function injectFloatingButton() {
    const btn = document.createElement('div');
    btn.id = 'fbmp-fab';
    btn.innerHTML = `<span style="font-size:20px">🏪</span>`;
    btn.title = 'FB Marketplace Pro';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
  }

  function togglePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) { panel.remove(); return; }
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);
    attachPanelEvents(panel);
  }

  function buildPanelHTML() {
    const proTag = isPro ? '<span class="fbmp-pro-badge">PRO</span>' : '<span class="fbmp-free-badge">FREE</span>';
    return `
      <div class="fbmp-panel-header">
        <h3>🏪 FB Marketplace Pro ${proTag}</h3>
        <button id="fbmp-close" class="fbmp-close">✕</button>
      </div>
      <div class="fbmp-panel-body">
        <div class="fbmp-section">
          <h4>⚡ Quick Actions</h4>
          <button id="fbmp-bump-all" class="fbmp-btn fbmp-btn-primary" ${!isPro ? 'disabled title="Pro required"' : ''}>🔄 Bump/Renew All Listings</button>
          <button id="fbmp-relist" class="fbmp-btn fbmp-btn-primary" ${!isPro ? 'disabled title="Pro required"' : ''}>📋 Auto-Relist Expired</button>
        </div>

        <div class="fbmp-section">
          <h4>📊 Listing Quality Check</h4>
          <button id="fbmp-quality-check" class="fbmp-btn">🔍 Check Current Listing</button>
          <div id="fbmp-quality-results"></div>
        </div>

        <div class="fbmp-section">
          <h4>💰 Sales Tracker</h4>
          <button id="fbmp-record-sale" class="fbmp-btn">✅ Record a Sale</button>
          <div id="fbmp-sales-stats"></div>
        </div>

        <div class="fbmp-section">
          <h4>📉 Price Drop Scheduler</h4>
          <button id="fbmp-price-drop" class="fbmp-btn" ${!isPro ? 'disabled title="Pro required"' : ''}>⏰ Schedule Price Drop</button>
          <div id="fbmp-price-drop-form" style="display:none">
            <input type="number" id="fbmp-pd-percent" placeholder="Drop %" class="fbmp-input" value="10">
            <input type="number" id="fbmp-pd-days" placeholder="After X days" class="fbmp-input" value="7">
            <button id="fbmp-pd-save" class="fbmp-btn fbmp-btn-sm">Save Rule</button>
          </div>
        </div>

        <div class="fbmp-section">
          <h4>🔎 Competitor Pricing</h4>
          <button id="fbmp-comp-scan" class="fbmp-btn" ${!isPro ? 'disabled title="Pro required"' : ''}>📊 Scan Similar Listings</button>
          <div id="fbmp-comp-results"></div>
        </div>

        <div class="fbmp-section">
          <h4>📤 Cross-Post Helper</h4>
          <button id="fbmp-crosspost" class="fbmp-btn" ${!isPro ? 'disabled title="Pro required"' : ''}>📋 Copy for Craigslist/OfferUp</button>
          <div id="fbmp-crosspost-output"></div>
        </div>

        <div class="fbmp-section">
          <h4>📦 Bulk Listing</h4>
          <button id="fbmp-bulk" class="fbmp-btn" ${!isPro ? 'disabled title="Pro required"' : ''}>📑 Import from CSV</button>
          <input type="file" id="fbmp-csv-file" accept=".csv" style="display:none">
        </div>

        ${!isPro ? '<div class="fbmp-upgrade"><button id="fbmp-upgrade" class="fbmp-btn fbmp-btn-upgrade">⭐ Upgrade to Pro — $9.99/mo</button></div>' : ''}
      </div>
    `;
  }

  function attachPanelEvents(panel) {
    panel.querySelector('#fbmp-close').addEventListener('click', () => panel.remove());
    panel.querySelector('#fbmp-quality-check').addEventListener('click', runQualityCheck);
    panel.querySelector('#fbmp-record-sale').addEventListener('click', showRecordSaleForm);
    loadSalesStats();

    if (isPro) {
      panel.querySelector('#fbmp-bump-all').addEventListener('click', bumpAllListings);
      panel.querySelector('#fbmp-relist').addEventListener('click', relistExpired);
      panel.querySelector('#fbmp-price-drop').addEventListener('click', () => {
        panel.querySelector('#fbmp-price-drop-form').style.display = 'block';
      });
      panel.querySelector('#fbmp-pd-save')?.addEventListener('click', savePriceDropRule);
      panel.querySelector('#fbmp-comp-scan').addEventListener('click', scanCompetitors);
      panel.querySelector('#fbmp-crosspost').addEventListener('click', crossPostCopy);
      panel.querySelector('#fbmp-bulk').addEventListener('click', () => {
        panel.querySelector('#fbmp-csv-file').click();
      });
      panel.querySelector('#fbmp-csv-file').addEventListener('change', handleCSVImport);
    } else {
      panel.querySelector('#fbmp-upgrade')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPayment' });
      });
    }
  }

  // ── Listing Quality Checker ──
  function runQualityCheck() {
    const results = [];
    // Check photos
    const images = document.querySelectorAll('[data-pagelet="MarketplacePDP"] img, [role="main"] img[src*="scontent"]');
    const photoCount = images.length;
    if (photoCount < 3) results.push({ icon: '🔴', text: `Only ${photoCount} photo(s) — add at least 3-5 for best results` });
    else if (photoCount < 5) results.push({ icon: '🟡', text: `${photoCount} photos — good, but 5+ is ideal` });
    else results.push({ icon: '🟢', text: `${photoCount} photos — great!` });

    // Check description
    const descEl = document.querySelector('[data-pagelet="MarketplacePDP"] span[dir="auto"], [role="main"] span[dir="auto"]');
    const descLen = descEl?.textContent?.length || 0;
    if (descLen < 50) results.push({ icon: '🔴', text: `Description too short (${descLen} chars) — aim for 100+` });
    else if (descLen < 100) results.push({ icon: '🟡', text: `Description is OK (${descLen} chars) — more detail helps` });
    else results.push({ icon: '🟢', text: `Description length good (${descLen} chars)` });

    // Check price
    const priceEl = document.querySelector('[data-pagelet="MarketplacePDP"] span[dir="auto"]:first-of-type, [role="main"] span:first-of-type');
    const priceText = priceEl?.textContent || '';
    if (priceText.includes('Free')) results.push({ icon: '🟡', text: 'Listed as Free — is this intentional?' });
    else if (priceText.match(/\$[\d,]+/)) results.push({ icon: '🟢', text: `Price set: ${priceText.match(/\$[\d,]+/)[0]}` });

    // Check title
    const titleEl = document.querySelector('h1, [role="main"] span[style*="font-size"]');
    const titleLen = titleEl?.textContent?.length || 0;
    if (titleLen < 10) results.push({ icon: '🔴', text: 'Title too short — be descriptive with brand, size, color' });
    else results.push({ icon: '🟢', text: `Title: "${titleEl?.textContent?.substring(0, 40)}..."` });

    const container = document.getElementById('fbmp-quality-results');
    container.innerHTML = results.map(r => `<div class="fbmp-result">${r.icon} ${r.text}</div>`).join('');
  }

  // ── Sales Tracker ──
  function loadSalesStats() {
    chrome.runtime.sendMessage({ action: 'getSalesStats' }, (r) => {
      if (!r) return;
      const el = document.getElementById('fbmp-sales-stats');
      if (!el) return;
      el.innerHTML = `
        <div class="fbmp-stats-grid">
          <div class="fbmp-stat"><strong>${r.count}</strong><small>Items Sold</small></div>
          <div class="fbmp-stat"><strong>$${r.revenue.toFixed(2)}</strong><small>Revenue</small></div>
          <div class="fbmp-stat"><strong>${r.avgDays}</strong><small>Avg Days to Sell</small></div>
        </div>
      `;
    });
  }

  function showRecordSaleForm() {
    const container = document.getElementById('fbmp-sales-stats');
    container.innerHTML = `
      <div class="fbmp-form">
        <input type="text" id="fbmp-sale-item" placeholder="Item name" class="fbmp-input">
        <input type="number" id="fbmp-sale-price" placeholder="Sale price" class="fbmp-input">
        <input type="number" id="fbmp-sale-days" placeholder="Days listed" class="fbmp-input">
        <button id="fbmp-sale-save" class="fbmp-btn fbmp-btn-sm">Save Sale</button>
      </div>
    `;
    container.querySelector('#fbmp-sale-save').addEventListener('click', () => {
      const data = {
        item: container.querySelector('#fbmp-sale-item').value,
        price: parseFloat(container.querySelector('#fbmp-sale-price').value) || 0,
        daysToSell: parseInt(container.querySelector('#fbmp-sale-days').value) || 0
      };
      chrome.runtime.sendMessage({ action: 'recordSale', data }, () => loadSalesStats());
    });
  }

  // ── Bump/Renew All ──
  function bumpAllListings() {
    const btn = document.getElementById('fbmp-bump-all');
    btn.textContent = '⏳ Working...';
    // Navigate to selling tab and click renew on each
    const sellingLinks = document.querySelectorAll('a[href*="/marketplace/you/selling"]');
    if (sellingLinks.length) {
      sellingLinks[0].click();
      setTimeout(() => {
        const menuBtns = document.querySelectorAll('[aria-label="More"], [aria-label="Actions"]');
        let count = 0;
        menuBtns.forEach((mb, i) => {
          setTimeout(() => {
            mb.click();
            setTimeout(() => {
              const renewBtn = [...document.querySelectorAll('[role="menuitem"]')].find(el => el.textContent.toLowerCase().includes('renew'));
              if (renewBtn) { renewBtn.click(); count++; }
            }, 300);
          }, i * 1000);
        });
        setTimeout(() => {
          btn.textContent = `✅ Bumped ${count} listings`;
          setTimeout(() => btn.textContent = '🔄 Bump/Renew All Listings', 3000);
        }, menuBtns.length * 1000 + 1000);
      }, 2000);
    } else {
      btn.textContent = '❌ Navigate to your selling page first';
      setTimeout(() => btn.textContent = '🔄 Bump/Renew All Listings', 3000);
    }
  }

  // ── Auto-Relist Expired ──
  function relistExpired() {
    const btn = document.getElementById('fbmp-relist');
    btn.textContent = '⏳ Scanning...';
    // Look for expired/sold listing indicators
    const listings = document.querySelectorAll('[aria-label*="expired"], [aria-label*="sold"], span');
    const expired = [...listings].filter(el => {
      const t = el.textContent.toLowerCase();
      return t.includes('expired') || t.includes('ended');
    });
    if (expired.length) {
      btn.textContent = `Found ${expired.length} expired — click each "Relist" button`;
      // Auto-click relist buttons
      const relistBtns = [...document.querySelectorAll('span, [role="button"]')].filter(el =>
        el.textContent.toLowerCase().includes('relist')
      );
      relistBtns.forEach((rb, i) => {
        setTimeout(() => rb.click(), i * 1500);
      });
      setTimeout(() => btn.textContent = `✅ Relisted ${relistBtns.length} items`, relistBtns.length * 1500 + 1000);
    } else {
      btn.textContent = '✅ No expired listings found';
    }
    setTimeout(() => btn.textContent = '📋 Auto-Relist Expired', 5000);
  }

  // ── Price Drop Scheduler ──
  function savePriceDropRule() {
    const percent = parseFloat(document.getElementById('fbmp-pd-percent').value) || 10;
    const days = parseInt(document.getElementById('fbmp-pd-days').value) || 7;
    const titleEl = document.querySelector('h1');
    const priceEl = document.querySelector('span');
    const priceMatch = priceEl?.textContent?.match(/\$([\d,]+)/);
    const originalPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

    const rule = {
      id: Date.now().toString(),
      listingTitle: titleEl?.textContent?.substring(0, 50) || 'Unknown',
      originalPrice,
      dropPercent: percent,
      daysBeforeDrop: days,
      createdAt: Date.now(),
      active: true,
      dropped: false
    };

    chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
      const rules = settings.priceDropRules || [];
      rules.push(rule);
      chrome.runtime.sendMessage({ action: 'savePriceDropRules', rules }, () => {
        const form = document.getElementById('fbmp-price-drop-form');
        form.innerHTML = `<div class="fbmp-result">🟢 Rule saved: Drop ${percent}% after ${days} days (from $${originalPrice})</div>`;
      });
    });
  }

  // ── Competitor Price Scanner ──
  function scanCompetitors() {
    const btn = document.getElementById('fbmp-comp-scan');
    btn.textContent = '⏳ Scanning...';
    const container = document.getElementById('fbmp-comp-results');

    // Get current listing title for search
    const titleEl = document.querySelector('h1, [role="main"] span[style*="font-size"]');
    const title = titleEl?.textContent || '';

    // Scan visible listings on marketplace for similar items
    const priceEls = document.querySelectorAll('[data-testid="marketplace_feed_item"] span, a[href*="/marketplace/item/"] span');
    const prices = [];
    priceEls.forEach(el => {
      const match = el.textContent.match(/\$([\d,]+)/);
      if (match) prices.push(parseFloat(match[1].replace(',', '')));
    });

    if (prices.length > 0) {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      container.innerHTML = `
        <div class="fbmp-stats-grid">
          <div class="fbmp-stat"><strong>$${avg.toFixed(0)}</strong><small>Avg Price</small></div>
          <div class="fbmp-stat"><strong>$${min}</strong><small>Lowest</small></div>
          <div class="fbmp-stat"><strong>$${max}</strong><small>Highest</small></div>
          <div class="fbmp-stat"><strong>${prices.length}</strong><small>Listings Found</small></div>
        </div>
      `;
    } else {
      container.innerHTML = '<div class="fbmp-result">🟡 Navigate to search results for similar items first</div>';
    }
    btn.textContent = '📊 Scan Similar Listings';
  }

  // ── Cross-Post Helper ──
  function crossPostCopy() {
    const container = document.getElementById('fbmp-crosspost-output');
    const title = document.querySelector('h1')?.textContent || '';
    const desc = document.querySelector('[data-pagelet="MarketplacePDP"] span[dir="auto"]')?.textContent || '';
    const priceMatch = document.body.textContent.match(/\$([\d,]+)/);
    const price = priceMatch ? priceMatch[1] : '0';

    const craigslistFormat = `Title: ${title}\nPrice: $${price}\n\n${desc}\n\n---\nPosted via FB Marketplace Pro`;
    const offerupFormat = `${title} - $${price}\n\n${desc}`;

    container.innerHTML = `
      <div class="fbmp-crosspost-box">
        <strong>Craigslist Format:</strong>
        <textarea class="fbmp-textarea" readonly>${craigslistFormat}</textarea>
        <button class="fbmp-btn fbmp-btn-sm fbmp-copy" data-text="${encodeURIComponent(craigslistFormat)}">📋 Copy</button>
      </div>
      <div class="fbmp-crosspost-box">
        <strong>OfferUp Format:</strong>
        <textarea class="fbmp-textarea" readonly>${offerupFormat}</textarea>
        <button class="fbmp-btn fbmp-btn-sm fbmp-copy" data-text="${encodeURIComponent(offerupFormat)}">📋 Copy</button>
      </div>
    `;
    container.querySelectorAll('.fbmp-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text));
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy', 2000);
      });
    });
  }

  // ── Bulk CSV Import ──
  function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i]?.trim() || '');
        return obj;
      });

      // Store items for sequential posting
      chrome.storage.local.set({ bulkItems: items }, () => {
        alert(`FB Marketplace Pro: Loaded ${items.length} items.\n\nGo to "Create New Listing" and the extension will auto-fill each item.\n\nCSV columns: title, price, description, category, condition`);
      });
    };
    reader.readAsText(file);
  }

  // ── Auto-fill from bulk import ──
  function checkBulkAutoFill() {
    if (!window.location.href.includes('/marketplace/create')) return;
    chrome.storage.local.get('bulkItems', (r) => {
      if (!r.bulkItems?.length) return;
      const item = r.bulkItems[0];
      const remaining = r.bulkItems.slice(1);

      // Try to fill form fields
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        inputs.forEach(input => {
          const label = input.getAttribute('aria-label')?.toLowerCase() || '';
          if (label.includes('title') || label.includes('what are you selling')) {
            setNativeValue(input, item.title || '');
          } else if (label.includes('price')) {
            setNativeValue(input, item.price || '');
          } else if (label.includes('description')) {
            setNativeValue(input, item.description || '');
          }
        });
        chrome.storage.local.set({ bulkItems: remaining });
        if (remaining.length) {
          showNotification(`Auto-filled: "${item.title}" — ${remaining.length} items remaining`);
        } else {
          showNotification(`Auto-filled last item: "${item.title}"`);
        }
      }, 2000);
    });
  }

  function setNativeValue(element, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Message Templates (injected into Messenger) ──
  function observeMessengerForTemplates() {
    const observer = new MutationObserver(() => {
      const chatInput = document.querySelector('[role="textbox"][contenteditable="true"]');
      if (chatInput && !document.getElementById('fbmp-msg-templates')) {
        injectMessageTemplates(chatInput);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectMessageTemplates(chatInput) {
    const container = document.createElement('div');
    container.id = 'fbmp-msg-templates';
    container.className = 'fbmp-msg-templates';

    chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
      const templates = settings?.messageTemplates || [];
      const maxFree = 3;
      const available = isPro ? templates : templates.slice(0, maxFree);

      container.innerHTML = available.map((t, i) =>
        `<button class="fbmp-msg-btn" data-idx="${i}">${t.name}</button>`
      ).join('');

      container.querySelectorAll('.fbmp-msg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          const template = available[idx];
          if (template) {
            chatInput.focus();
            document.execCommand('insertText', false, template.text);
          }
        });
      });

      chatInput.parentElement?.insertBefore(container, chatInput);
    });
  }

  function showNotification(text) {
    const n = document.createElement('div');
    n.className = 'fbmp-notification';
    n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 4000);
  }

  // ── URL change detection ──
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      checkBulkAutoFill();
    }
  }).observe(document.body, { childList: true, subtree: true });

  checkBulkAutoFill();
})();
