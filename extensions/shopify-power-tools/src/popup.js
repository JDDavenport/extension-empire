const extpay = ExtPay('shopify-power-tools');
let isPro = false;

async function init() {
  try {
    const user = await extpay.getUser();
    isPro = user.paid;
  } catch { isPro = false; }

  document.getElementById('pro-status').innerHTML = isPro
    ? '<span class="pro-badge">✅ PRO</span>'
    : '<span class="pro-badge" style="background:#e4e5e7;color:#6d7175">FREE</span>';

  document.getElementById('upgrade-link').onclick = (e) => {
    e.preventDefault();
    if (!isPro) extpay.openPaymentPage();
  };
  if (isPro) document.getElementById('upgrade-link').textContent = 'Pro Active ✓';

  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    };
  });

  renderTab('tools');
}

function renderTab(name) {
  const c = document.getElementById('tab-content');
  switch (name) {
    case 'tools': return renderTools(c);
    case 'competitors': return renderCompetitors(c);
    case 'discounts': return renderDiscounts(c);
    case 'analytics': return renderAnalytics(c);
    case 'settings': return renderSettings(c);
  }
}

function renderTools(c) {
  c.innerHTML = `
    <div class="section">
      <h3>Free Tools (Active on Shopify Admin)</h3>
      <div class="toggle-row"><span>✏️ Inline Product Editor</span><span class="spt-active">Active</span></div>
      <div class="toggle-row"><span>🔍 SEO Score Panel</span><span class="spt-active">Active</span></div>
      <div class="toggle-row"><span>🖼️ Image Optimizer</span><span class="spt-active">Active</span></div>
    </div>
    <div class="section ${isPro ? '' : 'pro-lock'}">
      <h3>Pro Tools</h3>
      <div class="toggle-row"><span>💰 Bulk Price Editor</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>📦 Bulk Inventory</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>📊 Order Dashboard</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>🕵️ Competitor Monitor</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>🏷️ Discount Manager</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>👤 CLV Calculator</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
      <div class="toggle-row"><span>🛒 Cart Recovery Stats</span><span>${isPro ? 'Active' : 'Locked'}</span></div>
    </div>
    ${!isPro ? '<button class="btn btn-primary" id="popup-upgrade">🚀 Unlock All Pro Tools — $14.99/mo</button>' : ''}`;
  document.getElementById('popup-upgrade')?.addEventListener('click', () => extpay.openPaymentPage());
}

function renderCompetitors(c) {
  if (!isPro) {
    c.innerHTML = '<div class="section pro-lock"><h3>🕵️ Competitor Monitor</h3><p>Track competitor Shopify stores and their pricing.</p><button class="btn btn-primary" id="comp-upgrade">Unlock with Pro</button></div>';
    document.getElementById('comp-upgrade')?.addEventListener('click', () => extpay.openPaymentPage());
    return;
  }
  c.innerHTML = `
    <div class="section">
      <h3>🕵️ Add Competitor</h3>
      <input class="input" type="url" id="comp-url" placeholder="https://competitor-store.myshopify.com" />
      <button class="btn btn-primary" id="add-comp">Add Store</button>
    </div>
    <div class="section" id="comp-list"><p>Loading...</p></div>`;

  loadCompetitors();

  document.getElementById('add-comp').onclick = async () => {
    const url = document.getElementById('comp-url').value.trim();
    if (!url) return;
    const data = await chrome.storage.local.get('competitors');
    const comps = data.competitors || [];
    comps.push({ url, addedAt: Date.now() });
    await chrome.storage.local.set({ competitors: comps });
    document.getElementById('comp-url').value = '';
    loadCompetitors();
  };
}

async function loadCompetitors() {
  const data = await chrome.storage.local.get('competitors');
  const comps = data.competitors || [];
  const el = document.getElementById('comp-list');
  if (!el) return;
  if (comps.length === 0) { el.innerHTML = '<p style="color:#6d7175">No competitors added yet.</p>'; return; }
  el.innerHTML = comps.map(c => `
    <div class="toggle-row">
      <span>${new URL(c.url).hostname}</span>
      <button class="btn btn-outline" style="width:auto;margin:0;padding:4px 8px;font-size:11px" data-rm="${c.url}">Remove</button>
    </div>`).join('');
  el.querySelectorAll('[data-rm]').forEach(btn => {
    btn.onclick = async () => {
      const d = await chrome.storage.local.get('competitors');
      await chrome.storage.local.set({ competitors: (d.competitors || []).filter(x => x.url !== btn.dataset.rm) });
      loadCompetitors();
    };
  });
}

function renderDiscounts(c) {
  if (!isPro) {
    c.innerHTML = '<div class="section pro-lock"><h3>🏷️ Discount Manager</h3><p>Generate and manage discount codes.</p><button class="btn btn-primary" id="disc-upgrade">Unlock with Pro</button></div>';
    document.getElementById('disc-upgrade')?.addEventListener('click', () => extpay.openPaymentPage());
    return;
  }
  c.innerHTML = `
    <div class="section">
      <h3>🏷️ Generate Codes</h3>
      <input class="input" id="disc-prefix" placeholder="Prefix (e.g. SAVE)" value="SAVE" />
      <input class="input" type="number" id="disc-count" placeholder="How many?" value="10" />
      <select class="input" id="disc-type"><option value="percent">% Off</option><option value="fixed">$ Off</option><option value="shipping">Free Shipping</option></select>
      <input class="input" type="number" id="disc-val" placeholder="Value" value="10" />
      <button class="btn btn-primary" id="gen-codes">Generate Codes</button>
    </div>
    <div class="section" id="codes-list"></div>`;

  loadCodes();

  document.getElementById('gen-codes').onclick = async () => {
    const prefix = document.getElementById('disc-prefix').value || 'SAVE';
    const count = parseInt(document.getElementById('disc-count').value) || 10;
    const type = document.getElementById('disc-type').value;
    const value = document.getElementById('disc-val').value;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codes = [];
    for (let i = 0; i < count; i++) {
      let code = prefix;
      for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
      codes.push({ code, type, value, createdAt: Date.now() });
    }
    const data = await chrome.storage.local.get('discountCodes');
    const all = [...(data.discountCodes || []), ...codes];
    await chrome.storage.local.set({ discountCodes: all });
    loadCodes();
  };
}

async function loadCodes() {
  const data = await chrome.storage.local.get('discountCodes');
  const codes = data.discountCodes || [];
  const el = document.getElementById('codes-list');
  if (!el) return;
  if (codes.length === 0) { el.innerHTML = '<p style="color:#6d7175">No codes yet.</p>'; return; }
  el.innerHTML = `<h3>${codes.length} Codes</h3>` + codes.slice(-20).reverse().map(c =>
    `<div class="toggle-row"><code style="font-size:12px">${c.code}</code><span style="font-size:11px;color:#6d7175">${c.type} ${c.value}${c.type === 'percent' ? '%' : c.type === 'fixed' ? '$' : ''}</span></div>`
  ).join('') + `<button class="btn btn-outline" id="export-csv" style="margin-top:8px">Export CSV</button>`;

  document.getElementById('export-csv').onclick = () => {
    const csv = 'Code,Type,Value,Created\n' + codes.map(c => `${c.code},${c.type},${c.value},${new Date(c.createdAt).toISOString()}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    chrome.downloads?.download({ url, filename: 'discount-codes.csv' });
  };
}

function renderAnalytics(c) {
  if (!isPro) {
    c.innerHTML = '<div class="section pro-lock"><h3>📊 Analytics</h3><p>Order trends, CLV, and cart recovery stats.</p><button class="btn btn-primary" id="ana-upgrade">Unlock with Pro</button></div>';
    document.getElementById('ana-upgrade')?.addEventListener('click', () => extpay.openPaymentPage());
    return;
  }
  c.innerHTML = `
    <div class="section">
      <h3>📊 Quick Stats</h3>
      <p style="font-size:12px;color:#6d7175">Open your Shopify admin to see full dashboards overlaid on the orders page.</p>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">📊</div><div class="label">Order Trends</div></div>
        <div class="stat-box"><div class="num">👤</div><div class="label">CLV Stats</div></div>
        <div class="stat-box"><div class="num">🛒</div><div class="label">Cart Recovery</div></div>
        <div class="stat-box"><div class="num">🕵️</div><div class="label">Competitors</div></div>
      </div>
      <p style="font-size:12px;color:#6d7175;margin-top:8px">Dashboards appear as overlays on your Shopify admin pages.</p>
    </div>`;
}

function renderSettings(c) {
  chrome.storage.local.get('settings', (data) => {
    const s = data.settings || { inlineEditEnabled: true, seoEnabled: true, imageOptimizerEnabled: true };
    c.innerHTML = `
      <div class="section">
        <h3>⚙️ Settings</h3>
        <div class="toggle-row"><span>Inline Editor</span><div class="toggle ${s.inlineEditEnabled ? 'on' : ''}" data-key="inlineEditEnabled"></div></div>
        <div class="toggle-row"><span>SEO Score</span><div class="toggle ${s.seoEnabled ? 'on' : ''}" data-key="seoEnabled"></div></div>
        <div class="toggle-row"><span>Image Optimizer</span><div class="toggle ${s.imageOptimizerEnabled ? 'on' : ''}" data-key="imageOptimizerEnabled"></div></div>
      </div>
      <div class="section">
        <h3>Account</h3>
        <p style="font-size:12px;color:#6d7175">Plan: ${isPro ? 'Pro ($14.99/mo)' : 'Free'}</p>
        ${isPro ? '<button class="btn btn-outline" id="manage-sub">Manage Subscription</button>' : '<button class="btn btn-primary" id="go-pro">Upgrade to Pro — $14.99/mo</button>'}
      </div>`;

    c.querySelectorAll('.toggle').forEach(toggle => {
      toggle.onclick = async () => {
        toggle.classList.toggle('on');
        const d = await chrome.storage.local.get('settings');
        const settings = d.settings || {};
        settings[toggle.dataset.key] = toggle.classList.contains('on');
        chrome.storage.local.set({ settings });
      };
    });

    document.getElementById('go-pro')?.addEventListener('click', () => extpay.openPaymentPage());
    document.getElementById('manage-sub')?.addEventListener('click', () => extpay.openPaymentPage());
  });
}

init();
