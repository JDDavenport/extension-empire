/* Airbnb Host Power Tools — Content Script */

(function () {
  'use strict';

  let templates = null;
  let variables = {};
  let isPro = false;
  let currentPage = detectPage();

  // ─── Init ───────────────────────────────────────────────────────────
  async function init() {
    templates = await sendMessage({ action: 'getTemplates' });
    variables = templates?.variables || {};
    const status = await sendMessage({ action: 'getProStatus' });
    isPro = status?.paid || false;

    injectUI();

    // Re-inject on SPA navigation
    const observer = new MutationObserver(debounce(() => {
      const newPage = detectPage();
      if (newPage !== currentPage) {
        currentPage = newPage;
        cleanup();
        injectUI();
      }
    }, 500));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function detectPage() {
    const path = window.location.pathname;
    if (path.includes('/hosting/inbox')) return 'inbox';
    if (path.includes('/hosting/reviews')) return 'reviews';
    if (path.includes('/hosting/calendar') || path.includes('/multicalendar')) return 'calendar';
    if (path.includes('/hosting/listings')) return 'listings';
    if (path.match(/\/hosting\/?$/)) return 'dashboard';
    if (path.includes('/hosting')) return 'hosting';
    return 'other';
  }

  function cleanup() {
    document.querySelectorAll('.ahpt-widget').forEach(el => el.remove());
  }

  function injectUI() {
    switch (currentPage) {
      case 'inbox': injectInboxTools(); break;
      case 'reviews': injectReviewTools(); break;
      case 'calendar': injectCalendarTools(); break;
      case 'listings': injectListingsTools(); break;
      case 'dashboard':
      case 'hosting': injectDashboardOverlay(); break;
    }
  }

  // ─── Dashboard Overlay ──────────────────────────────────────────────
  function injectDashboardOverlay() {
    const overlay = createElement('div', 'ahpt-widget ahpt-dashboard-overlay');
    overlay.innerHTML = `
      <div class="ahpt-panel">
        <div class="ahpt-panel-header">
          <span class="ahpt-logo">🏠</span>
          <span class="ahpt-title">Host Power Tools</span>
          <button class="ahpt-minimize" title="Minimize">−</button>
        </div>
        <div class="ahpt-panel-body">
          <div class="ahpt-stats-grid" id="ahpt-stats-grid">
            <div class="ahpt-stat-card">
              <div class="ahpt-stat-value" id="ahpt-messages-sent">—</div>
              <div class="ahpt-stat-label">Messages Sent</div>
            </div>
            <div class="ahpt-stat-card">
              <div class="ahpt-stat-value" id="ahpt-reviews-done">—</div>
              <div class="ahpt-stat-label">Reviews Responded</div>
            </div>
            <div class="ahpt-stat-card">
              <div class="ahpt-stat-value" id="ahpt-templates-count">—</div>
              <div class="ahpt-stat-label">Templates</div>
            </div>
            <div class="ahpt-stat-card">
              <div class="ahpt-stat-value" id="ahpt-plan-status">—</div>
              <div class="ahpt-stat-label">Plan</div>
            </div>
          </div>
          <div class="ahpt-quick-actions">
            <button class="ahpt-btn ahpt-btn-primary" id="ahpt-goto-inbox">📨 Quick Message</button>
            <button class="ahpt-btn" id="ahpt-goto-reviews">⭐ Review Templates</button>
            ${!isPro ? '<button class="ahpt-btn ahpt-btn-upgrade" id="ahpt-upgrade-dash">🚀 Upgrade to Pro</button>' : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    loadDashboardStats();
    setupDashboardEvents(overlay);
  }

  async function loadDashboardStats() {
    const stats = await sendMessage({ action: 'getStats' });
    const msgEl = document.getElementById('ahpt-messages-sent');
    const revEl = document.getElementById('ahpt-reviews-done');
    const tplEl = document.getElementById('ahpt-templates-count');
    const planEl = document.getElementById('ahpt-plan-status');

    if (msgEl) msgEl.textContent = stats.totalMessagesSent || 0;
    if (revEl) revEl.textContent = stats.totalReviewsResponded || 0;
    if (tplEl) tplEl.textContent = (templates?.messages?.length || 0) + (templates?.reviews?.length || 0);
    if (planEl) {
      planEl.textContent = isPro ? 'Pro ✨' : 'Free';
      planEl.className = 'ahpt-stat-value ' + (isPro ? 'ahpt-pro' : '');
    }
  }

  function setupDashboardEvents(overlay) {
    overlay.querySelector('.ahpt-minimize')?.addEventListener('click', () => {
      overlay.querySelector('.ahpt-panel-body').classList.toggle('ahpt-collapsed');
      const btn = overlay.querySelector('.ahpt-minimize');
      btn.textContent = btn.textContent === '−' ? '+' : '−';
    });
    overlay.querySelector('#ahpt-goto-inbox')?.addEventListener('click', () => {
      window.location.href = '/hosting/inbox';
    });
    overlay.querySelector('#ahpt-goto-reviews')?.addEventListener('click', () => {
      window.location.href = '/hosting/reviews';
    });
    overlay.querySelector('#ahpt-upgrade-dash')?.addEventListener('click', () => {
      sendMessage({ action: 'openPaymentPage' });
    });
  }

  // ─── Inbox / Messaging Tools ───────────────────────────────────────
  function injectInboxTools() {
    // Wait for the message input area to appear
    waitForElement('[data-testid="message-send-area"], [contenteditable="true"], textarea').then(inputArea => {
      const toolbar = createElement('div', 'ahpt-widget ahpt-inbox-toolbar');
      toolbar.innerHTML = `
        <div class="ahpt-toolbar-row">
          <span class="ahpt-toolbar-label">📝 Templates:</span>
          <div class="ahpt-template-chips" id="ahpt-msg-chips"></div>
          <button class="ahpt-btn ahpt-btn-sm" id="ahpt-add-msg-tpl" title="Manage templates">⚙️</button>
        </div>
      `;

      // Insert before the message input
      const parent = inputArea.closest('[data-testid="message-send-area"]')?.parentElement || inputArea.parentElement;
      parent.insertBefore(toolbar, inputArea.closest('[data-testid="message-send-area"]') || inputArea);

      renderMessageChips();
    });
  }

  function renderMessageChips() {
    const container = document.getElementById('ahpt-msg-chips');
    if (!container) return;
    container.innerHTML = '';

    const msgs = templates?.messages || [];
    const limit = isPro ? msgs.length : Math.min(msgs.length, 5);

    for (let i = 0; i < limit; i++) {
      const tpl = msgs[i];
      const chip = createElement('button', 'ahpt-chip');
      chip.textContent = tpl.name;
      chip.title = `Insert: ${tpl.name}`;
      chip.addEventListener('click', () => insertTemplate(tpl.body));
      container.appendChild(chip);
    }

    if (!isPro && msgs.length > 5) {
      const proChip = createElement('button', 'ahpt-chip ahpt-chip-pro');
      proChip.textContent = `+${msgs.length - 5} more (Pro)`;
      proChip.addEventListener('click', () => sendMessage({ action: 'openPaymentPage' }));
      container.appendChild(proChip);
    }
  }

  function insertTemplate(body) {
    // Resolve variables
    let resolved = body;
    for (const [key, val] of Object.entries(variables)) {
      resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), val || `{${key}}`);
    }

    // Try to extract guest name from the conversation header
    const guestNameEl = document.querySelector('[data-testid="thread-header"] h2, [data-testid="messaging-thread-header"] span');
    if (guestNameEl) {
      resolved = resolved.replace(/\{guest_name\}/g, guestNameEl.textContent.trim());
    }

    // Find the message input and insert
    const input = document.querySelector('[contenteditable="true"], textarea[name="message"], [data-testid="message-input"]');
    if (input) {
      if (input.tagName === 'TEXTAREA') {
        input.value = resolved;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        input.focus();
        // For contenteditable
        document.execCommand('insertText', false, resolved);
      }
      sendMessage({ action: 'trackStat', stat: 'messageSent' });
      showToast('Template inserted! ✅');
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(resolved);
      showToast('Template copied to clipboard! 📋');
    }
  }

  // ─── Review Tools ──────────────────────────────────────────────────
  function injectReviewTools() {
    waitForElement('[data-testid="review-card"], [class*="review"]').then(() => {
      const panel = createElement('div', 'ahpt-widget ahpt-review-panel');
      panel.innerHTML = `
        <div class="ahpt-panel ahpt-panel-inline">
          <div class="ahpt-panel-header">
            <span class="ahpt-title">⭐ Review Response Templates</span>
            <button class="ahpt-minimize">−</button>
          </div>
          <div class="ahpt-panel-body">
            <div class="ahpt-template-list" id="ahpt-review-list"></div>
            ${!isPro ? '<div class="ahpt-pro-banner">🚀 <a href="#" id="ahpt-upgrade-review">Upgrade to Pro</a> for AI-suggested personalization</div>' : ''}
          </div>
        </div>
      `;

      // Insert at top of reviews page
      const main = document.querySelector('main, [role="main"], #site-content');
      if (main) {
        main.insertBefore(panel, main.firstChild);
      } else {
        document.body.appendChild(panel);
      }

      renderReviewTemplates();
      setupReviewEvents(panel);
    });
  }

  function renderReviewTemplates() {
    const container = document.getElementById('ahpt-review-list');
    if (!container) return;
    container.innerHTML = '';

    const reviews = templates?.reviews || [];
    const limit = isPro ? reviews.length : Math.min(reviews.length, 3);

    for (let i = 0; i < limit; i++) {
      const tpl = reviews[i];
      const card = createElement('div', 'ahpt-review-card');
      card.innerHTML = `
        <div class="ahpt-review-card-header">
          <strong>${escapeHtml(tpl.name)}</strong>
          <button class="ahpt-btn ahpt-btn-sm ahpt-copy-review" data-idx="${i}">📋 Copy</button>
        </div>
        <div class="ahpt-review-card-body">${escapeHtml(tpl.body).substring(0, 120)}...</div>
      `;
      card.querySelector('.ahpt-copy-review').addEventListener('click', () => {
        let resolved = tpl.body;
        for (const [key, val] of Object.entries(variables)) {
          resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), val || `{${key}}`);
        }
        navigator.clipboard.writeText(resolved);
        sendMessage({ action: 'trackStat', stat: 'reviewResponded' });
        showToast('Review template copied! ⭐');
      });
      container.appendChild(card);
    }
  }

  function setupReviewEvents(panel) {
    panel.querySelector('.ahpt-minimize')?.addEventListener('click', () => {
      panel.querySelector('.ahpt-panel-body').classList.toggle('ahpt-collapsed');
    });
    panel.querySelector('#ahpt-upgrade-review')?.addEventListener('click', (e) => {
      e.preventDefault();
      sendMessage({ action: 'openPaymentPage' });
    });
  }

  // ─── Calendar Tools ────────────────────────────────────────────────
  function injectCalendarTools() {
    if (!isPro) {
      injectProUpsell('calendar', '📅 Calendar Gap Analysis & Pricing Suggestions');
      return;
    }

    waitForElement('[data-testid="calendar"], [class*="calendar"], table').then(() => {
      analyzeCalendarGaps();
    });
  }

  function analyzeCalendarGaps() {
    const panel = createElement('div', 'ahpt-widget ahpt-calendar-panel');
    panel.innerHTML = `
      <div class="ahpt-panel ahpt-panel-inline">
        <div class="ahpt-panel-header">
          <span class="ahpt-title">📅 Calendar Analysis</span>
          <button class="ahpt-minimize">−</button>
        </div>
        <div class="ahpt-panel-body">
          <div class="ahpt-calendar-insights" id="ahpt-cal-insights">
            <div class="ahpt-insight">
              <span class="ahpt-insight-icon">🔍</span>
              <span>Analyzing your calendar for gaps and opportunities...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const main = document.querySelector('main, [role="main"], #site-content');
    if (main) {
      main.insertBefore(panel, main.firstChild);
    } else {
      document.body.appendChild(panel);
    }

    panel.querySelector('.ahpt-minimize')?.addEventListener('click', () => {
      panel.querySelector('.ahpt-panel-body').classList.toggle('ahpt-collapsed');
    });

    // Analyze visible calendar cells
    setTimeout(() => {
      const insights = document.getElementById('ahpt-cal-insights');
      if (!insights) return;

      // Look for blocked/available patterns
      const blockedCells = document.querySelectorAll('[data-testid*="blocked"], [class*="blocked"], [aria-label*="Not available"]');
      const availCells = document.querySelectorAll('[data-testid*="available"], [class*="available"], [aria-label*="Available"]');
      const bookedCells = document.querySelectorAll('[data-testid*="booked"], [class*="reserved"], [aria-label*="Booked"]');

      const total = blockedCells.length + availCells.length + bookedCells.length;
      const occupancyRate = total > 0 ? Math.round((bookedCells.length / total) * 100) : null;

      let html = '';

      if (occupancyRate !== null) {
        html += `
          <div class="ahpt-insight">
            <span class="ahpt-insight-icon">📊</span>
            <span>Visible occupancy rate: <strong>${occupancyRate}%</strong></span>
          </div>
        `;
      }

      if (availCells.length > 3) {
        html += `
          <div class="ahpt-insight ahpt-insight-warning">
            <span class="ahpt-insight-icon">⚠️</span>
            <span><strong>${availCells.length} open nights</strong> visible. Consider lowering prices for gaps or enabling Instant Book.</span>
          </div>
        `;
      }

      const weekendGaps = checkWeekendAvailability();
      if (weekendGaps > 0) {
        html += `
          <div class="ahpt-insight ahpt-insight-tip">
            <span class="ahpt-insight-icon">💡</span>
            <span><strong>${weekendGaps} weekend nights open.</strong> Weekends typically command 20-40% premium — ensure your weekend pricing reflects demand.</span>
          </div>
        `;
      }

      html += `
        <div class="ahpt-insight ahpt-insight-tip">
          <span class="ahpt-insight-icon">💡</span>
          <span><strong>Pricing tip:</strong> Listings with dynamic pricing fill 15-25% more nights. Consider adjusting prices for low-demand periods.</span>
        </div>
      `;

      if (!html) {
        html = `
          <div class="ahpt-insight">
            <span class="ahpt-insight-icon">✅</span>
            <span>Calendar looks well-optimized! Keep monitoring for new opportunities.</span>
          </div>
        `;
      }

      insights.innerHTML = html;
    }, 2000);
  }

  function checkWeekendAvailability() {
    // Check for Fri/Sat cells that are available
    const allCells = document.querySelectorAll('[aria-label*="Friday"], [aria-label*="Saturday"]');
    let gaps = 0;
    allCells.forEach(cell => {
      if (cell.getAttribute('aria-label')?.includes('Available') ||
        cell.classList.toString().includes('available')) {
        gaps++;
      }
    });
    return gaps;
  }

  // ─── Listings / Pricing Tools ──────────────────────────────────────
  function injectListingsTools() {
    if (!isPro) {
      injectProUpsell('listings', '💰 Pricing Analytics & Competitor Comparison');
      return;
    }

    waitForElement('[data-testid="listing-card"], [class*="listing"]').then(() => {
      injectPricingOverlay();
    });
  }

  function injectPricingOverlay() {
    const panel = createElement('div', 'ahpt-widget ahpt-pricing-panel');
    panel.innerHTML = `
      <div class="ahpt-panel ahpt-panel-inline">
        <div class="ahpt-panel-header">
          <span class="ahpt-title">💰 Pricing Analytics</span>
          <button class="ahpt-minimize">−</button>
        </div>
        <div class="ahpt-panel-body">
          <div class="ahpt-pricing-form">
            <label>Your nightly price: $<input type="number" id="ahpt-your-price" value="100" min="1" class="ahpt-input-sm"></label>
            <label>Location: <input type="text" id="ahpt-location" placeholder="e.g. Austin, TX" class="ahpt-input-sm ahpt-input-wide"></label>
            <button class="ahpt-btn ahpt-btn-primary" id="ahpt-analyze-pricing">Analyze Comps</button>
          </div>
          <div id="ahpt-pricing-results" class="ahpt-pricing-results"></div>
        </div>
      </div>
    `;

    const main = document.querySelector('main, [role="main"], #site-content');
    if (main) {
      main.insertBefore(panel, main.firstChild);
    } else {
      document.body.appendChild(panel);
    }

    panel.querySelector('.ahpt-minimize')?.addEventListener('click', () => {
      panel.querySelector('.ahpt-panel-body').classList.toggle('ahpt-collapsed');
    });

    panel.querySelector('#ahpt-analyze-pricing')?.addEventListener('click', async () => {
      const price = parseInt(document.getElementById('ahpt-your-price').value);
      const location = document.getElementById('ahpt-location').value;
      const results = document.getElementById('ahpt-pricing-results');

      if (!location) {
        results.innerHTML = '<p class="ahpt-error">Please enter a location.</p>';
        return;
      }

      results.innerHTML = '<p class="ahpt-loading">Analyzing nearby listings... ⏳</p>';

      const data = await sendMessage({ action: 'getPricingComps', location, price });
      if (data?.comps?.length > 0) {
        const comp = data.comps[0];
        const diff = price - comp.avgPrice;
        const diffPct = Math.round((diff / comp.avgPrice) * 100);
        const color = diff > 0 ? '#e74c3c' : diff < 0 ? '#27ae60' : '#666';

        results.innerHTML = `
          <div class="ahpt-comp-grid">
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value">$${comp.avgPrice}</div>
              <div class="ahpt-comp-label">Area Average</div>
            </div>
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value">$${comp.medianPrice}</div>
              <div class="ahpt-comp-label">Median</div>
            </div>
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value">$${comp.minPrice} – $${comp.maxPrice}</div>
              <div class="ahpt-comp-label">Range</div>
            </div>
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value" style="color:${color}">${diff > 0 ? '+' : ''}$${diff} (${diffPct > 0 ? '+' : ''}${diffPct}%)</div>
              <div class="ahpt-comp-label">vs Average</div>
            </div>
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value">${comp.percentile}th</div>
              <div class="ahpt-comp-label">Percentile</div>
            </div>
            <div class="ahpt-comp-card">
              <div class="ahpt-comp-value">${comp.sampleSize}</div>
              <div class="ahpt-comp-label">Listings Analyzed</div>
            </div>
          </div>
          <p class="ahpt-comp-advice">
            ${diff > comp.avgPrice * 0.2 ? '⚠️ Your price is significantly above average. Consider if your amenities justify the premium, or lower to improve occupancy.' :
            diff < -comp.avgPrice * 0.2 ? '💡 Your price is well below average — you may be leaving money on the table! Consider raising prices gradually.' :
            '✅ Your pricing is competitive with the area average. Nice!'}
          </p>
        `;
      } else {
        results.innerHTML = '<p class="ahpt-error">Could not fetch comparison data. Try a different location.</p>';
      }
    });
  }

  // ─── Pro Upsell ────────────────────────────────────────────────────
  function injectProUpsell(page, featureName) {
    const banner = createElement('div', 'ahpt-widget ahpt-pro-upsell');
    banner.innerHTML = `
      <div class="ahpt-panel ahpt-panel-inline ahpt-panel-upsell">
        <div class="ahpt-upsell-content">
          <h3>${featureName}</h3>
          <p>This Pro feature helps you optimize your Airbnb business with data-driven insights.</p>
          <button class="ahpt-btn ahpt-btn-upgrade" id="ahpt-upgrade-${page}">🚀 Upgrade to Pro — $14.99/mo</button>
        </div>
      </div>
    `;

    const main = document.querySelector('main, [role="main"], #site-content');
    if (main) main.insertBefore(banner, main.firstChild);
    else document.body.appendChild(banner);

    banner.querySelector(`#ahpt-upgrade-${page}`)?.addEventListener('click', () => {
      sendMessage({ action: 'openPaymentPage' });
    });
  }

  // ─── Utilities ─────────────────────────────────────────────────────
  function sendMessage(msg) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(msg, resolve);
    });
  }

  function createElement(tag, className) {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  }

  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        // Resolve anyway to still inject UI even if selector not found
        resolve(null);
      }, timeout);
    });
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message) {
    const existing = document.querySelector('.ahpt-toast');
    if (existing) existing.remove();

    const toast = createElement('div', 'ahpt-toast');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('ahpt-toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('ahpt-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Start ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
