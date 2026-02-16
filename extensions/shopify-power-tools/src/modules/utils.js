// Shared utilities
const SPT = window.SPT || {};
window.SPT = SPT;

SPT.isPro = null;

SPT.checkPro = () => new Promise(resolve => {
  chrome.runtime.sendMessage({ action: 'checkPro' }, res => {
    SPT.isPro = res?.paid || false;
    resolve(SPT.isPro);
  });
});

SPT.requirePro = (featureName) => {
  if (SPT.isPro) return true;
  SPT.showUpgradeModal(featureName);
  return false;
};

SPT.showUpgradeModal = (feature) => {
  const existing = document.getElementById('spt-upgrade-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'spt-upgrade-modal';
  modal.className = 'spt-modal-overlay';
  modal.innerHTML = `
    <div class="spt-modal">
      <h2>🚀 Upgrade to Pro</h2>
      <p><strong>${feature}</strong> is a Pro feature.</p>
      <p>Get unlimited access to all power tools for <strong>$14.99/mo</strong>.</p>
      <ul>
        <li>✅ Bulk price & inventory editor</li>
        <li>✅ Competitor price monitoring</li>
        <li>✅ Order dashboard & trends</li>
        <li>✅ Discount code manager</li>
        <li>✅ Customer lifetime value</li>
        <li>✅ Abandoned cart stats</li>
      </ul>
      <div class="spt-modal-actions">
        <button class="spt-btn spt-btn-primary" id="spt-upgrade-btn">Upgrade Now</button>
        <button class="spt-btn" id="spt-close-upgrade">Maybe Later</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('spt-upgrade-btn').onclick = () => {
    chrome.runtime.sendMessage({ action: 'openPayment' });
    modal.remove();
  };
  document.getElementById('spt-close-upgrade').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
};

SPT.getShopDomain = () => location.hostname;

SPT.shopifyFetch = async (endpoint) => {
  const res = await fetch(`/admin/api/2024-01${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  });
  return res.json();
};

SPT.shopifyPut = async (endpoint, data) => {
  const res = await fetch(`/admin/api/2024-01${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify(data)
  });
  return res.json();
};

SPT.toast = (msg, type = 'success') => {
  const t = document.createElement('div');
  t.className = `spt-toast spt-toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.classList.add('spt-toast-show'); }, 10);
  setTimeout(() => { t.classList.remove('spt-toast-show'); setTimeout(() => t.remove(), 300); }, 3000);
};

SPT.debounce = (fn, ms = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

SPT.isProductsPage = () => /\/admin\/products/i.test(location.href);
SPT.isOrdersPage = () => /\/admin\/orders/i.test(location.href);
SPT.isProductDetailPage = () => /\/admin\/products\/\d+/i.test(location.href);
