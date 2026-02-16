// Customer Lifetime Value Calculator — Pro feature
SPT.CLVCalculator = {
  init() {
    // Available from popup and orders page
    if (SPT.isOrdersPage()) this.addButton();
  },

  addButton() {
    const observer = new MutationObserver(SPT.debounce(() => {
      if (document.getElementById('spt-clv-btn')) return;
      const header = document.querySelector('[class*="Header"] .Polaris-Page-Header__Row, [class*="Header__MainContent"]');
      if (!header) return;
      const btn = document.createElement('button');
      btn.id = 'spt-clv-btn';
      btn.className = 'spt-toolbar-btn';
      btn.innerHTML = '👤 CLV Stats';
      btn.onclick = () => this.showOverlay();
      header.appendChild(btn);
    }, 500));
    observer.observe(document.body, { childList: true, subtree: true });
  },

  async showOverlay() {
    if (!SPT.requirePro('Customer Lifetime Value')) return;
    const existing = document.getElementById('spt-clv-overlay');
    if (existing) { existing.remove(); return; }

    const orders = await this.fetchOrders();
    const stats = this.calculate(orders);
    this.render(stats);
  },

  async fetchOrders() {
    try {
      const data = await SPT.shopifyFetch('/orders.json?limit=250&status=any');
      return data.orders || [];
    } catch { return []; }
  },

  calculate(orders) {
    const customers = {};
    orders.forEach(o => {
      const cid = o.customer?.id || 'guest';
      if (!customers[cid]) customers[cid] = { orders: 0, total: 0, first: o.created_at, last: o.created_at, email: o.customer?.email || 'Guest' };
      customers[cid].orders++;
      customers[cid].total += parseFloat(o.total_price || 0);
      if (new Date(o.created_at) < new Date(customers[cid].first)) customers[cid].first = o.created_at;
      if (new Date(o.created_at) > new Date(customers[cid].last)) customers[cid].last = o.created_at;
    });

    const custs = Object.values(customers).filter(c => c.email !== 'Guest');
    const totalRevenue = custs.reduce((s, c) => s + c.total, 0);
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
    const avgOrders = custs.length ? custs.reduce((s, c) => s + c.orders, 0) / custs.length : 0;
    const avgCLV = custs.length ? totalRevenue / custs.length : 0;
    const repeatRate = custs.length ? (custs.filter(c => c.orders > 1).length / custs.length * 100) : 0;

    const top = custs.sort((a, b) => b.total - a.total).slice(0, 10);

    return { totalCustomers: custs.length, avgOrderValue, avgOrders, avgCLV, repeatRate, top };
  },

  render(stats) {
    const panel = document.createElement('div');
    panel.id = 'spt-clv-overlay';
    panel.className = 'spt-panel spt-panel-overlay';
    panel.innerHTML = `
      <div class="spt-panel-header">
        <h3>👤 Customer Lifetime Value</h3>
        <button class="spt-btn-sm" onclick="this.closest('#spt-clv-overlay').remove()">✕</button>
      </div>
      <div class="spt-stats">
        <div class="spt-stat"><span class="spt-stat-num">${stats.totalCustomers}</span><span>Customers</span></div>
        <div class="spt-stat"><span class="spt-stat-num">$${stats.avgCLV.toFixed(2)}</span><span>Avg CLV</span></div>
        <div class="spt-stat"><span class="spt-stat-num">$${stats.avgOrderValue.toFixed(2)}</span><span>Avg Order</span></div>
        <div class="spt-stat"><span class="spt-stat-num">${stats.avgOrders.toFixed(1)}</span><span>Avg Orders/Customer</span></div>
        <div class="spt-stat"><span class="spt-stat-num">${stats.repeatRate.toFixed(1)}%</span><span>Repeat Rate</span></div>
      </div>
      <h4>Top 10 Customers</h4>
      <table class="spt-table">
        <thead><tr><th>Customer</th><th>Orders</th><th>Total</th></tr></thead>
        <tbody>
          ${stats.top.map(c => `<tr><td>${c.email}</td><td>${c.orders}</td><td>$${c.total.toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>`;
    document.body.appendChild(panel);
  }
};
