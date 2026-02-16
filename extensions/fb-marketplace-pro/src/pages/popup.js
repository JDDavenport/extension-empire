/* FB Marketplace Pro — Popup */
const extpay = ExtPay('fb-marketplace-pro');
let isPro = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Check pro
  try {
    const user = await extpay.getUser();
    isPro = user.paid;
    document.getElementById('plan-badge').textContent = isPro ? 'PRO' : 'FREE';
    document.getElementById('plan-badge').className = isPro ? 'badge badge-pro' : 'badge badge-free';
    if (!isPro) {
      document.getElementById('upgrade-area').innerHTML = `
        <div class="upgrade-banner" id="btn-upgrade">
          <strong>⭐ Upgrade to Pro — $9.99/mo</strong>
          <p>Auto-relist, bulk post, price drops, competitor scanning & more</p>
        </div>`;
      document.getElementById('btn-upgrade').addEventListener('click', () => extpay.openPaymentPage());
    }
  } catch (e) { console.log('ExtPay error:', e); }

  // Load stats
  chrome.runtime.sendMessage({ action: 'getSalesStats' }, (r) => {
    if (!r) return;
    document.getElementById('s-count').textContent = r.count;
    document.getElementById('s-revenue').textContent = '$' + r.revenue.toFixed(2);
    document.getElementById('s-days').textContent = r.avgDays;
  });

  // Load templates
  loadTemplates();

  // Load price rules
  chrome.runtime.sendMessage({ action: 'getSettings' }, (s) => {
    const rules = s?.priceDropRules || [];
    const active = rules.filter(r => r.active);
    const el = document.getElementById('price-rules');
    if (active.length) {
      el.innerHTML = active.map(r =>
        `<div class="template"><span class="template-name">${r.listingTitle}</span><span>-${r.dropPercent}% after ${r.daysBeforeDrop}d ${r.dropped ? '✅' : '⏳'}</span></div>`
      ).join('');
    }
  });

  // Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Navigation buttons
  document.getElementById('btn-open-mp').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.facebook.com/marketplace/' });
  });
  document.getElementById('btn-open-selling').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.facebook.com/marketplace/you/selling' });
  });

  // Add template
  document.getElementById('btn-add-tpl').addEventListener('click', () => {
    const name = document.getElementById('new-tpl-name').value.trim();
    const text = document.getElementById('new-tpl-text').value.trim();
    if (!name || !text) return;
    chrome.runtime.sendMessage({ action: 'getSettings' }, (s) => {
      const templates = s?.messageTemplates || [];
      if (!isPro && templates.length >= 3) {
        alert('Free plan: max 3 templates. Upgrade to Pro for unlimited.');
        return;
      }
      templates.push({ name, text });
      s.messageTemplates = templates;
      chrome.runtime.sendMessage({ action: 'saveSettings', data: s }, () => {
        document.getElementById('new-tpl-name').value = '';
        document.getElementById('new-tpl-text').value = '';
        loadTemplates();
      });
    });
  });

  // Manage subscription
  document.getElementById('btn-manage-sub').addEventListener('click', () => extpay.openPaymentPage());
});

function loadTemplates() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (s) => {
    const templates = s?.messageTemplates || [];
    const el = document.getElementById('templates-list');
    el.innerHTML = templates.map((t, i) =>
      `<div class="template">
        <span class="template-name">${t.name}</span>
        <span class="template-edit" data-idx="${i}">🗑️</span>
      </div>`
    ).join('');
    el.querySelectorAll('.template-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        templates.splice(idx, 1);
        s.messageTemplates = templates;
        chrome.runtime.sendMessage({ action: 'saveSettings', data: s }, loadTemplates);
      });
    });
  });
}
