/* eBay Seller Analytics — Popup */

(function() {
  'use strict';

  let dashboardData = null;
  let isPro = false;

  // ─── Init ───
  async function init() {
    setupTabs();
    await loadDashboard();
    await loadSettings();
    setupEventListeners();
  }

  function sendMsg(msg) {
    return new Promise(resolve => chrome.runtime.sendMessage(msg, resolve));
  }

  function formatCurrency(n) {
    return '$' + parseFloat(n || 0).toFixed(2);
  }

  // ─── Tabs ───
  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'competitors') loadCompetitors();
      });
    });
  }

  // ─── Dashboard ───
  async function loadDashboard() {
    dashboardData = await sendMsg({ type: 'get-dashboard-data' });
    if (!dashboardData) return;

    isPro = dashboardData.isPro;

    // Plan badge
    const badge = document.getElementById('plan-badge');
    badge.textContent = isPro ? 'PRO' : 'FREE';
    badge.className = 'badge ' + (isPro ? 'badge-pro' : 'badge-free');

    // Stats
    document.getElementById('today-count').textContent = dashboardData.today.count + ' sales';
    document.getElementById('today-revenue').textContent = formatCurrency(dashboardData.today.revenue);
    document.getElementById('week-count').textContent = dashboardData.week.count + ' sales';
    document.getElementById('week-revenue').textContent = formatCurrency(dashboardData.week.revenue);
    document.getElementById('month-revenue').textContent = formatCurrency(dashboardData.month.revenue);
    document.getElementById('month-profit').textContent = 'Net: ' + formatCurrency(dashboardData.month.profit);
    document.getElementById('month-count').textContent = dashboardData.month.count + ' sales';

    // Velocity trend
    const stats = await sendMsg({ type: 'get-stats' });
    if (stats) {
      const trendEl = document.getElementById('velocity-trend');
      const trend = stats.velocityTrend;
      if (trend > 0) {
        trendEl.textContent = `↑${trend}% vs last week`;
        trendEl.className = 'stat-sub positive';
      } else if (trend < 0) {
        trendEl.textContent = `↓${Math.abs(trend)}% vs last week`;
        trendEl.className = 'stat-sub negative';
      } else {
        trendEl.textContent = '→ Steady';
        trendEl.className = 'stat-sub';
      }
    }

    drawPopupChart(dashboardData.chartData);
  }

  function drawPopupChart(chartData) {
    const canvas = document.getElementById('popup-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 5, right: 5, bottom: 20, left: 35 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    chartData.forEach((d, i) => {
      const x = pad.left + (i / (chartData.length - 1)) * plotW;
      const y = pad.top + plotH - (d.revenue / maxRev) * plotH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    chartData.forEach((d, i) => {
      const x = pad.left + (i / (chartData.length - 1)) * plotW;
      const y = pad.top + plotH - (d.revenue / maxRev) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#475569';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    [0, 14, 29].forEach(i => {
      if (chartData[i]) {
        const x = pad.left + (i / (chartData.length - 1)) * plotW;
        ctx.fillText(chartData[i].date.slice(5), x, H - 3);
      }
    });
    ctx.textAlign = 'right';
    ctx.fillText('$' + maxRev.toFixed(0), pad.left - 3, pad.top + 10);
  }

  // ─── Competitors ───
  async function loadCompetitors() {
    const container = document.getElementById('competitors-container');

    if (!isPro) {
      container.innerHTML = `
        <div class="pro-lock">
          <div class="icon">🔒</div>
          <p>Competitor monitoring is a Pro feature</p>
          <p style="margin-top:4px;font-size:12px;">Track up to 50 competitor listings with price alerts</p>
          <button class="btn btn-upgrade" id="upgrade-competitors">Upgrade to Pro — $12.99/mo</button>
        </div>
      `;
      document.getElementById('upgrade-competitors')?.addEventListener('click', openUpgrade);
      return;
    }

    const res = await sendMsg({ type: 'get-competitors' });
    const competitors = res?.competitors || [];

    if (competitors.length === 0) {
      container.innerHTML = '<div class="empty">No competitors tracked yet.<br>Visit an eBay listing and click "Track Competitor".</div>';
      return;
    }

    container.innerHTML = `
      <div class="section-title">${competitors.length}/50 Competitors Tracked</div>
      <ul class="competitor-list">
        ${competitors.map(c => `
          <li class="competitor-item" data-id="${c.id}">
            <div>
              <div class="title" title="${c.title}">${c.title}</div>
              <div style="font-size:10px;color:#64748b;">by ${c.seller} · Checked ${timeAgo(c.lastChecked)}</div>
            </div>
            <div style="text-align:right;">
              <div class="price">$${c.price.toFixed(2)}</div>
              <span class="remove" title="Remove">✕</span>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    container.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const item = e.target.closest('.competitor-item');
        await sendMsg({ type: 'remove-competitor', id: item.dataset.id });
        loadCompetitors();
      });
    });
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  // ─── Settings ───
  async function loadSettings() {
    const res = await sendMsg({ type: 'get-settings' });
    const s = res?.settings || {};
    document.getElementById('setting-profit').checked = s.showProfitOverlay !== false;
    document.getElementById('setting-quality').checked = s.showQualityScore !== false;
    document.getElementById('setting-velocity').checked = s.showVelocity !== false;
    document.getElementById('setting-threshold').value = s.competitorAlertThreshold || 5;

    if (!isPro) {
      document.getElementById('upgrade-section').innerHTML = `
        <button class="btn btn-upgrade" id="upgrade-btn">⚡ Upgrade to Pro — $12.99/mo</button>
        <p style="text-align:center;font-size:11px;color:#64748b;margin-top:8px;">Competitor monitoring, bulk actions, advanced analytics & export</p>
      `;
      document.getElementById('upgrade-btn')?.addEventListener('click', openUpgrade);
    }
  }

  function setupEventListeners() {
    // Settings toggles
    ['profit', 'quality', 'velocity'].forEach(key => {
      document.getElementById(`setting-${key}`)?.addEventListener('change', (e) => {
        const settingKey = key === 'profit' ? 'showProfitOverlay' : key === 'quality' ? 'showQualityScore' : 'showVelocity';
        sendMsg({ type: 'update-settings', settings: { [settingKey]: e.target.checked } });
      });
    });

    document.getElementById('setting-threshold')?.addEventListener('change', (e) => {
      sendMsg({ type: 'update-settings', settings: { competitorAlertThreshold: parseInt(e.target.value) } });
    });

    // Export
    document.getElementById('export-btn')?.addEventListener('click', async () => {
      const res = await sendMsg({ type: 'export-data' });
      if (!res?.success) {
        if (!isPro) alert('Export is a Pro feature. Upgrade to export your data.');
        return;
      }
      const sales = res.data.sales;
      let csv = 'Date,Item ID,Price,Profit,Fees\n';
      sales.forEach(s => {
        csv += `${s.date},${s.id},${s.price},${s.profit || ''},${s.fees || ''}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ebay-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function openUpgrade() {
    chrome.runtime.sendMessage({ type: 'get-payment-status' }, () => {
      // ExtensionPay will handle the payment flow
      if (typeof ExtPay !== 'undefined') {
        ExtPay('ebay-seller-analytics').openPaymentPage();
      } else {
        chrome.tabs.create({ url: 'https://extensionpay.com/extension/ebay-seller-analytics' });
      }
    });
  }

  init();
})();
