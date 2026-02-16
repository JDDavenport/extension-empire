// Order Dashboard Overlay — Pro feature
SPT.OrderDashboard = {
  init() {
    if (!SPT.isOrdersPage()) return;
    this.addDashboardButton();
  },

  addDashboardButton() {
    const observer = new MutationObserver(SPT.debounce(() => {
      if (document.getElementById('spt-order-dash-btn')) return;
      const header = document.querySelector('[class*="Header"] .Polaris-Page-Header__Row, [class*="Header__MainContent"]');
      if (!header) return;
      const btn = document.createElement('button');
      btn.id = 'spt-order-dash-btn';
      btn.className = 'spt-toolbar-btn';
      btn.innerHTML = '📊 Trends Dashboard';
      btn.onclick = () => this.toggle();
      header.appendChild(btn);
    }, 500));
    observer.observe(document.body, { childList: true, subtree: true });
  },

  async toggle() {
    if (!SPT.requirePro('Order Dashboard')) return;
    const existing = document.getElementById('spt-order-dashboard');
    if (existing) { existing.remove(); return; }

    const orders = await this.fetchOrders();
    this.render(orders);
  },

  async fetchOrders() {
    try {
      const data = await SPT.shopifyFetch('/orders.json?limit=250&status=any');
      return data.orders || [];
    } catch { return []; }
  },

  render(orders) {
    const now = new Date();
    const today = orders.filter(o => new Date(o.created_at).toDateString() === now.toDateString());
    const week = orders.filter(o => (now - new Date(o.created_at)) < 7 * 86400000);
    const month = orders.filter(o => (now - new Date(o.created_at)) < 30 * 86400000);

    const sum = arr => arr.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
    const avg = arr => arr.length ? (sum(arr) / arr.length) : 0;

    // Daily breakdown for the week
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString('en', { weekday: 'short' });
      days[key] = { count: 0, revenue: 0 };
    }
    week.forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString('en', { weekday: 'short' });
      if (days[key]) { days[key].count++; days[key].revenue += parseFloat(o.total_price || 0); }
    });

    const maxCount = Math.max(...Object.values(days).map(d => d.count), 1);
    const bars = Object.entries(days).map(([day, d]) =>
      `<div class="spt-bar-col"><div class="spt-bar" style="height:${(d.count / maxCount * 100)}%"></div><span>${day}</span><span class="spt-muted">${d.count}</span></div>`
    ).join('');

    const panel = document.createElement('div');
    panel.id = 'spt-order-dashboard';
    panel.className = 'spt-panel spt-panel-overlay';
    panel.innerHTML = `
      <div class="spt-panel-header">
        <h3>📊 Order Trends</h3>
        <button class="spt-btn-sm" onclick="this.closest('#spt-order-dashboard').remove()">✕</button>
      </div>
      <div class="spt-stats">
        <div class="spt-stat"><span class="spt-stat-num">${today.length}</span><span>Today</span></div>
        <div class="spt-stat"><span class="spt-stat-num">$${sum(today).toFixed(0)}</span><span>Today Rev</span></div>
        <div class="spt-stat"><span class="spt-stat-num">${week.length}</span><span>This Week</span></div>
        <div class="spt-stat"><span class="spt-stat-num">$${sum(week).toFixed(0)}</span><span>Week Rev</span></div>
        <div class="spt-stat"><span class="spt-stat-num">$${avg(month).toFixed(2)}</span><span>Avg Order</span></div>
      </div>
      <h4>Daily Orders (7 days)</h4>
      <div class="spt-bar-chart">${bars}</div>`;

    document.body.appendChild(panel);
  }
};
