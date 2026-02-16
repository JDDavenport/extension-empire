/* Amazon Seller Dashboard — Sales Velocity Tracker */
ASD.salesVelocity = {
  async recordSale(asin, units, revenue) {
    const key = 'sales_data';
    const entry = {
      asin,
      units,
      revenue,
      day: ASD.utils.dayKey(),
      week: ASD.utils.weekKey(),
      month: ASD.utils.monthKey(),
      ts: Date.now()
    };
    await ASD.storage.appendToArray(key, entry, 5000);
  },

  async scrapeSalesFromPage() {
    // Try scraping from Seller Central business reports / orders page
    const rows = document.querySelectorAll('.orders-table tr, [data-test-id="orders-table"] tr');
    let totalUnits = 0;
    let totalRevenue = 0;
    rows.forEach(row => {
      const qtyEl = row.querySelector('[data-column="quantity"], .qty-cell');
      const priceEl = row.querySelector('[data-column="item-price"], .price-cell');
      if (qtyEl && priceEl) {
        totalUnits += parseInt(qtyEl.textContent) || 0;
        totalRevenue += ASD.utils.parsePrice(priceEl.textContent);
      }
    });
    return { totalUnits, totalRevenue };
  },

  async getVelocity(period = 'daily') {
    const data = await ASD.storage.get(['sales_data']);
    const sales = data.sales_data || [];
    const grouped = {};

    for (const s of sales) {
      const key = period === 'daily' ? s.day : period === 'weekly' ? s.week : s.month;
      if (!grouped[key]) grouped[key] = { units: 0, revenue: 0 };
      grouped[key].units += s.units;
      grouped[key].revenue += s.revenue;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data }));
  },

  renderWidget(container, isPro) {
    const { el, formatCurrency, formatNumber } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, [
      '🚀 Sales Velocity', isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
    ].filter(Boolean)));

    if (!isPro) {
      container.appendChild(el('div', { className: 'asd-card', textContent: 'Upgrade to Pro to track sales velocity.' }));
      return;
    }

    // Period tabs
    let activePeriod = 'daily';
    const tabs = el('div', { className: 'asd-tabs' });
    for (const p of ['daily', 'weekly', 'monthly']) {
      const tab = el('button', {
        className: 'asd-tab' + (p === activePeriod ? ' active' : ''),
        textContent: p.charAt(0).toUpperCase() + p.slice(1),
        onClick: () => {
          activePeriod = p;
          tabs.querySelectorAll('.asd-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderChart(p);
        }
      });
      tabs.appendChild(tab);
    }
    container.appendChild(tabs);

    const chartArea = el('div');
    container.appendChild(chartArea);

    const renderChart = async (period) => {
      const velocity = await this.getVelocity(period);
      chartArea.innerHTML = '';

      if (!velocity.length) {
        chartArea.appendChild(el('div', { className: 'asd-card', textContent: 'No sales data yet.' }));
        return;
      }

      const latest = velocity[velocity.length - 1];
      chartArea.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: 'Units' }),
        el('span', { className: 'asd-stat-value', textContent: formatNumber(latest.units) })
      ]));
      chartArea.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: 'Revenue' }),
        el('span', { className: 'asd-stat-value positive', textContent: formatCurrency(latest.revenue) })
      ]));

      if (velocity.length > 1) {
        const chartDiv = el('div', { className: 'asd-chart-container' });
        const canvas = el('canvas');
        chartDiv.appendChild(canvas);
        chartArea.appendChild(chartDiv);
        requestAnimationFrame(() => {
          ASD.utils.miniChart(canvas, velocity.map(v => v.revenue), '#00c853');
        });
      }
    };

    renderChart(activePeriod);
  }
};
