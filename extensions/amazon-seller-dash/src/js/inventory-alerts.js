/* Amazon Seller Dashboard — Inventory Alerts */
ASD.inventory = {
  async checkAlerts() {
    const settings = await ASD.storage.getSettings();
    const threshold = settings.lowStockThreshold || 10;
    const alerts = [];

    // Scrape inventory data from Seller Central page
    const rows = document.querySelectorAll('[data-test-id="inventory-table"] tr, .mt-row');
    rows.forEach(row => {
      const skuEl = row.querySelector('[data-column="sku"] span, .mt-cell-sku');
      const qtyEl = row.querySelector('[data-column="quantity"] span, .mt-cell-available');
      const statusEl = row.querySelector('[data-column="status"] span, .mt-cell-status');

      if (!skuEl) return;
      const sku = skuEl.textContent.trim();
      const qty = parseInt(qtyEl?.textContent?.trim()) || 0;
      const status = statusEl?.textContent?.trim()?.toLowerCase() || '';

      if (qty <= threshold && qty > 0) {
        alerts.push({ type: 'low-stock', sku, qty, message: `${sku}: ${qty} units left` });
      }
      if (qty === 0) {
        alerts.push({ type: 'out-of-stock', sku, qty: 0, message: `${sku}: OUT OF STOCK` });
      }
      if (status.includes('stranded') || status.includes('inactive')) {
        alerts.push({ type: 'stranded', sku, message: `${sku}: ${status}` });
      }
    });

    // Store alerts
    await ASD.storage.set({ inventory_alerts: alerts, inventory_check_time: Date.now() });
    return alerts;
  },

  renderAlerts(container, alerts) {
    const { el } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, ['📦 Inventory Alerts']));

    if (!alerts.length) {
      container.appendChild(el('div', { className: 'asd-card', textContent: '✅ All inventory levels healthy' }));
      return;
    }

    for (const alert of alerts) {
      const cls = alert.type === 'out-of-stock' ? 'asd-alert-danger'
        : alert.type === 'stranded' ? 'asd-alert-danger'
        : 'asd-alert-warning';
      const icon = alert.type === 'out-of-stock' ? '🚨'
        : alert.type === 'stranded' ? '⚠️' : '📉';
      container.appendChild(el('div', { className: `asd-alert ${cls}` }, [
        el('span', { textContent: icon }),
        el('span', { textContent: alert.message })
      ]));
    }
  }
};
