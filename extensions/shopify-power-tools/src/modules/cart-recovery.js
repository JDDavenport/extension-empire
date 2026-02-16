// Abandoned Cart Recovery Stats — Pro feature
SPT.CartRecovery = {
  init() {
    // Available from popup and orders page
  },

  async fetchCheckouts() {
    try {
      const data = await SPT.shopifyFetch('/checkouts.json?limit=250');
      return data.checkouts || [];
    } catch { return []; }
  },

  async getStats() {
    const checkouts = await this.fetchCheckouts();
    const now = new Date();
    const abandoned = checkouts.filter(c => !c.completed_at);
    const recovered = checkouts.filter(c => c.completed_at);
    const week = abandoned.filter(c => (now - new Date(c.created_at)) < 7 * 86400000);
    const month = abandoned.filter(c => (now - new Date(c.created_at)) < 30 * 86400000);

    const totalValue = abandoned.reduce((s, c) => s + parseFloat(c.total_price || 0), 0);
    const recoveredValue = recovered.reduce((s, c) => s + parseFloat(c.total_price || 0), 0);
    const recoveryRate = checkouts.length ? (recovered.length / checkouts.length * 100) : 0;

    return {
      total: abandoned.length,
      thisWeek: week.length,
      thisMonth: month.length,
      totalValue,
      recoveredCount: recovered.length,
      recoveredValue,
      recoveryRate,
      recent: abandoned.slice(0, 10)
    };
  },

  renderOverlay(container) {
    if (!SPT.requirePro('Abandoned Cart Stats')) return;
    this.getStats().then(stats => {
      container.innerHTML = `
        <h3>🛒 Abandoned Cart Recovery</h3>
        <div class="spt-stats">
          <div class="spt-stat"><span class="spt-stat-num">${stats.total}</span><span>Abandoned</span></div>
          <div class="spt-stat"><span class="spt-stat-num">$${stats.totalValue.toFixed(0)}</span><span>Lost Revenue</span></div>
          <div class="spt-stat"><span class="spt-stat-num">${stats.recoveredCount}</span><span>Recovered</span></div>
          <div class="spt-stat"><span class="spt-stat-num">$${stats.recoveredValue.toFixed(0)}</span><span>Recovered $</span></div>
          <div class="spt-stat"><span class="spt-stat-num">${stats.recoveryRate.toFixed(1)}%</span><span>Recovery Rate</span></div>
          <div class="spt-stat"><span class="spt-stat-num">${stats.thisWeek}</span><span>This Week</span></div>
        </div>
        ${stats.recent.length ? `
          <h4>Recent Abandoned Carts</h4>
          <table class="spt-table">
            <thead><tr><th>Customer</th><th>Value</th><th>Date</th></tr></thead>
            <tbody>
              ${stats.recent.map(c => `
                <tr>
                  <td>${c.email || 'Anonymous'}</td>
                  <td>$${parseFloat(c.total_price || 0).toFixed(2)}</td>
                  <td>${new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : ''}`;
    });
  }
};
