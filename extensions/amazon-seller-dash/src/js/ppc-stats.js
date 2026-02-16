/* Amazon Seller Dashboard — PPC Quick Stats */
ASD.ppc = {
  scrapeStats() {
    const stats = { campaigns: [], totals: { spend: 0, sales: 0, impressions: 0, clicks: 0, orders: 0 } };

    // Try to scrape from campaign manager page
    const rows = document.querySelectorAll('[data-e2e-id="campaign-table"] tr, .campaigns-table tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;

      const name = cells[0]?.textContent?.trim();
      const spend = ASD.utils.parsePrice(cells[1]?.textContent);
      const sales = ASD.utils.parsePrice(cells[2]?.textContent);
      const impressions = parseInt(cells[3]?.textContent?.replace(/,/g, '')) || 0;
      const clicks = parseInt(cells[4]?.textContent?.replace(/,/g, '')) || 0;

      if (!name) return;
      const acos = sales > 0 ? (spend / sales) * 100 : 0;
      const campaign = { name, spend, sales, impressions, clicks, acos: +acos.toFixed(1) };
      stats.campaigns.push(campaign);
      stats.totals.spend += spend;
      stats.totals.sales += sales;
      stats.totals.impressions += impressions;
      stats.totals.clicks += clicks;
    });

    stats.totals.acos = stats.totals.sales > 0
      ? +((stats.totals.spend / stats.totals.sales) * 100).toFixed(1) : 0;
    stats.totals.ctr = stats.totals.impressions > 0
      ? +((stats.totals.clicks / stats.totals.impressions) * 100).toFixed(2) : 0;

    return stats;
  },

  renderWidget(container, isPro) {
    const { el, formatCurrency, formatPercent, formatNumber } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, [
      '📈 PPC Stats', isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
    ].filter(Boolean)));

    if (!isPro) {
      container.appendChild(el('div', { className: 'asd-card', textContent: 'Upgrade to Pro to see PPC campaign stats.' }));
      return;
    }

    const stats = this.scrapeStats();
    const t = stats.totals;

    const rows = [
      ['Total Spend', formatCurrency(t.spend), 'negative'],
      ['Total Sales', formatCurrency(t.sales), 'positive'],
      ['ACoS', formatPercent(t.acos), t.acos <= 30 ? 'positive' : 'negative'],
      ['CTR', formatPercent(t.ctr), ''],
      ['Impressions', formatNumber(t.impressions), ''],
      ['Clicks', formatNumber(t.clicks), '']
    ];

    for (const [label, value, cls] of rows) {
      container.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: label }),
        el('span', { className: 'asd-stat-value ' + cls, textContent: value })
      ]));
    }

    if (stats.campaigns.length) {
      container.appendChild(el('div', { style: 'margin-top:8px;font-size:11px;color:var(--asd-text-muted);', textContent: `${stats.campaigns.length} active campaigns` }));
    }
  }
};
