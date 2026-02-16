/* Amazon Seller Dashboard — Profit Calculator */
ASD.profitCalc = {
  // Amazon referral fee percentages by category
  referralFees: {
    'default': 15,
    'electronics': 8,
    'computers': 8,
    'camera': 8,
    'video-games': 15,
    'books': 15,
    'clothing': 17,
    'shoes': 15,
    'jewelry': 20,
    'watches': 16,
    'grocery': 8,
    'health': 8,
    'beauty': 8,
    'toys': 15,
    'home': 15,
    'kitchen': 15,
    'automotive': 12,
    'sports': 15,
    'outdoors': 15,
    'tools': 15,
    'garden': 15,
    'pet': 15,
    'office': 15,
    'industrial': 12,
    'baby': 8
  },

  // Simplified FBA fee tiers (based on weight/size)
  fbaFees: {
    small_standard: { base: 3.22, perLb: 0 },
    large_standard: { base: 3.86, perLb: 0.08 },
    small_oversize: { base: 9.73, perLb: 0.42 },
    large_oversize: { base: 89.98, perLb: 0.83 }
  },

  estimateFbaFee(weight, tier = 'large_standard') {
    const t = this.fbaFees[tier] || this.fbaFees.large_standard;
    return t.base + (Math.max(0, weight - 1) * t.perLb);
  },

  calculate(params) {
    const {
      price = 0,
      category = 'default',
      weight = 1,
      tier = 'large_standard',
      cogs = 0,
      shippingToFba = 0,
      isFbm = false,
      fbmShipping = 0
    } = params;

    const referralPct = this.referralFees[category] || this.referralFees.default;
    const referralFee = price * (referralPct / 100);
    const fbaFee = isFbm ? 0 : this.estimateFbaFee(weight, tier);
    const shipping = isFbm ? fbmShipping : shippingToFba;
    const totalFees = referralFee + fbaFee + shipping;
    const profit = price - totalFees - cogs;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const roi = cogs > 0 ? (profit / cogs) * 100 : 0;

    return {
      price,
      referralFee: +referralFee.toFixed(2),
      referralPct,
      fbaFee: +fbaFee.toFixed(2),
      shipping: +shipping.toFixed(2),
      cogs,
      totalFees: +totalFees.toFixed(2),
      profit: +profit.toFixed(2),
      margin: +margin.toFixed(1),
      roi: +roi.toFixed(1)
    };
  },

  renderWidget(container, params = {}) {
    const { el } = ASD.utils;
    const calc = this.calculate(params);

    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, ['💰 Profit Calculator']));

    const rows = [
      ['Selling Price', ASD.utils.formatCurrency(calc.price), ''],
      ['Referral Fee (' + calc.referralPct + '%)', '-' + ASD.utils.formatCurrency(calc.referralFee), 'negative'],
      ['FBA Fee', '-' + ASD.utils.formatCurrency(calc.fbaFee), 'negative'],
      ['Shipping', '-' + ASD.utils.formatCurrency(calc.shipping), 'negative'],
      ['COGS', '-' + ASD.utils.formatCurrency(calc.cogs), 'negative'],
      ['Net Profit', ASD.utils.formatCurrency(calc.profit), calc.profit >= 0 ? 'positive' : 'negative'],
      ['Margin', ASD.utils.formatPercent(calc.margin), calc.margin >= 20 ? 'positive' : calc.margin >= 0 ? 'warning' : 'negative'],
      ['ROI', ASD.utils.formatPercent(calc.roi), calc.roi >= 100 ? 'positive' : calc.roi >= 0 ? 'warning' : 'negative']
    ];

    for (const [label, value, cls] of rows) {
      container.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: label }),
        el('span', { className: 'asd-stat-value ' + cls, textContent: value })
      ]));
    }
  }
};
