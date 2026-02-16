/* TikTok Shop Tools — Popup Script */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  let settings = {};
  let templates = [];
  let isPro = false;

  // ─── Tab Navigation ───
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ─── Load Everything ───
  async function init() {
    settings = await msg('getSettings');
    const tplResp = await msg('getTemplates');
    templates = tplResp?.templates || [];
    isPro = tplResp?.isPro || settings?.isPro || false;

    updateUI();
    loadDashboard();
    renderTemplates();
    loadInventory();
    loadSettings();
  }

  function msg(action, data = {}) {
    return new Promise(r => chrome.runtime.sendMessage({ action, ...data }, r));
  }

  function formatCurrency(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── UI State ───
  function updateUI() {
    if (isPro) {
      $('#proBadge').style.display = 'block';
      $('#exportProTag').style.display = 'none';
      $('#templateUpsell').style.display = 'none';
      $('#inventoryUpsell').style.display = 'none';
      $('#planName').textContent = 'Pro Plan';
      $('#planDesc').textContent = 'All features unlocked';
      $('#btnUpgrade').textContent = 'Manage Subscription';
    }
  }

  // ─── Dashboard ───
  async function loadDashboard() {
    const history = await msg('getSalesHistory');
    if (!history?.length) return;

    const latest = history[history.length - 1];
    $('#metricRevenue').textContent = formatCurrency(latest.revenue);
    $('#metricOrders').textContent = (latest.orders || 0).toLocaleString();
    $('#metricAOV').textContent = formatCurrency(latest.aov);
    $('#metricConv').textContent = (latest.conversionRate || 0) + '%';

    // Trend: compare to previous entry
    if (history.length >= 2) {
      const prev = history[history.length - 2];
      setTrend('#metricRevenueTrend', latest.revenue, prev.revenue);
      setTrend('#metricOrdersTrend', latest.orders, prev.orders);
    }

    // Chart: last 7 entries
    renderChart(history.slice(-7));
  }

  function setTrend(sel, current, previous) {
    const el = $(sel);
    if (!el || !previous) return;
    const pct = ((current - previous) / previous * 100).toFixed(1);
    const up = current >= previous;
    el.className = 'metric-sub ' + (up ? 'up' : 'down');
    el.textContent = `${up ? '↑' : '↓'} ${Math.abs(pct)}% vs prev`;
  }

  function renderChart(data) {
    const container = $('#chartContainer');
    if (!data.length) return;

    const maxRev = Math.max(...data.map(d => d.revenue || 0), 1);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    container.innerHTML = `<div class="chart-bars">${data.map(d => {
      const h = Math.max(4, (d.revenue / maxRev) * 60);
      const day = days[new Date(d.timestamp).getDay()];
      return `<div class="chart-bar" style="height:${h}px" title="${formatCurrency(d.revenue)}">
        <span class="chart-bar-label">${day}</span>
      </div>`;
    }).join('')}</div>`;
  }

  // ─── Templates ───
  function renderTemplates() {
    const list = $('#templateList');
    if (!templates.length) {
      list.innerHTML = '<div class="empty-state">No templates yet. Add one below!</div>';
      return;
    }

    list.innerHTML = templates.map((t, i) => `
      <div class="template-item">
        <div class="template-item-header">
          <span class="template-name">${escHtml(t.name)}</span>
          <div class="template-actions">
            <button class="template-action" data-copy="${i}" title="Copy">📋</button>
            <button class="template-action" data-delete="${i}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="template-text">${escHtml(t.text).slice(0, 120)}${t.text.length > 120 ? '...' : ''}</div>
      </div>
    `).join('');

    // Copy handlers
    list.querySelectorAll('[data-copy]').forEach(btn => {
      btn.onclick = () => {
        const t = templates[+btn.dataset.copy];
        navigator.clipboard.writeText(t.text);
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '📋', 1200);
      };
    });

    // Delete handlers
    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = async () => {
        templates.splice(+btn.dataset.delete, 1);
        await msg('saveTemplates', { templates });
        renderTemplates();
      };
    });

    // Show upsell if at limit
    if (!isPro && templates.length >= 3) {
      $('#templateUpsell').style.display = 'block';
    }
  }

  $('#btnAddTemplate').addEventListener('click', async () => {
    const name = $('#newTemplateName').value.trim();
    const text = $('#newTemplateText').value.trim();
    if (!name || !text) return;

    if (!isPro && templates.length >= 3) {
      alert('Free plan is limited to 3 templates. Upgrade to Pro for unlimited templates!');
      return;
    }

    templates.push({ id: Date.now().toString(), name, text, free: false });
    await msg('saveTemplates', { templates });
    $('#newTemplateName').value = '';
    $('#newTemplateText').value = '';
    renderTemplates();
  });

  // ─── Inventory ───
  async function loadInventory() {
    const inventory = await msg('getInventory');
    const list = $('#inventoryList');
    if (!inventory?.length) return;

    const threshold = settings?.inventoryThreshold || 10;
    list.innerHTML = inventory.map(item => {
      const isLow = item.stock <= threshold;
      return `<div class="inventory-item">
        <span class="inventory-name">${escHtml(item.name)}</span>
        <span class="inventory-stock ${isLow ? 'low' : 'ok'}">${item.stock}</span>
      </div>`;
    }).join('');
  }

  // ─── Settings ───
  function loadSettings() {
    $('#settingDashboard').checked = settings?.dashboardEnabled !== false;
    $('#settingNotifications').checked = settings?.notificationsEnabled !== false;
    $('#settingThreshold').value = settings?.inventoryThreshold || 10;
  }

  async function saveSettings() {
    settings.dashboardEnabled = $('#settingDashboard').checked;
    settings.notificationsEnabled = $('#settingNotifications').checked;
    settings.inventoryThreshold = parseInt($('#settingThreshold').value) || 10;
    await msg('saveSettings', { settings });
  }

  $('#settingDashboard').addEventListener('change', saveSettings);
  $('#settingNotifications').addEventListener('change', saveSettings);
  $('#settingThreshold').addEventListener('change', saveSettings);

  // ─── Export ───
  $('#btnExport').addEventListener('click', async () => {
    if (!isPro) {
      alert('CSV Export is a Pro feature. Upgrade to Pro ($14.99/mo) for CSV exports, unlimited templates, competitor tracking & more!');
      return;
    }
    // Send message to active tab's content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'exportCSV' });
    }
  });

  // ─── Upgrade Buttons ───
  const upgradeHandler = () => {
    // In production, this would open ExtensionPay
    chrome.tabs.create({ url: 'https://tiktokshoptools.com/pro' });
  };
  $('#btnUpgrade')?.addEventListener('click', upgradeHandler);
  $('#btnUpgradeTemplates')?.addEventListener('click', upgradeHandler);
  $('#btnUpgradeInventory')?.addEventListener('click', upgradeHandler);

  // ─── Helpers ───
  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  init();
})();
