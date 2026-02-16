/* Amazon Seller Dashboard — Content Script (Seller Central) */
(async function() {
  'use strict';

  const extpay = typeof ExtPay !== 'undefined' ? ExtPay('amazon-seller-dash') : null;
  if (extpay) extpay.startBackground();

  let isPro = false;
  try {
    if (extpay) {
      const user = await extpay.getUser();
      isPro = user.paid;
    }
  } catch(e) { console.log('ASD: ExtPay check failed', e); }

  const { el } = ASD.utils;

  // Create toggle button
  const toggleBtn = el('button', {
    className: 'asd-toggle-btn',
    textContent: '📊',
    title: 'Amazon Seller Dashboard'
  });
  document.body.appendChild(toggleBtn);

  // Create main panel
  const panel = el('div', { className: 'asd-panel asd-hidden' });
  const header = el('div', { className: 'asd-panel-header' }, [
    el('h2', { textContent: '📊 Seller Dashboard' }),
    el('div', {}, [
      isPro ? el('span', { className: 'asd-pro-badge', textContent: 'PRO' }) : null,
      el('button', { className: 'asd-panel-close', textContent: '✕', onClick: () => togglePanel() })
    ].filter(Boolean))
  ]);
  panel.appendChild(header);

  // Tab navigation
  const tabs = ['Overview', 'Profit', 'Inventory', 'PPC', 'Reviews'];
  if (isPro) tabs.push('Velocity', 'Keywords');

  const tabBar = el('div', { className: 'asd-tabs' });
  let activeTab = 'Overview';

  tabs.forEach(name => {
    const tab = el('button', {
      className: 'asd-tab' + (name === activeTab ? ' active' : ''),
      textContent: name,
      onClick: () => {
        activeTab = name;
        tabBar.querySelectorAll('.asd-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderContent();
      }
    });
    tabBar.appendChild(tab);
  });
  panel.appendChild(tabBar);

  const contentArea = el('div', { style: 'padding:0;' });
  panel.appendChild(contentArea);

  // Export button
  const exportBar = el('div', { className: 'asd-section', style: 'text-align:center;' }, [
    el('button', {
      className: 'asd-btn asd-btn-outline',
      textContent: '📥 Export CSV',
      onClick: () => exportData()
    }),
    !isPro ? el('button', {
      className: 'asd-btn asd-btn-primary',
      textContent: '⭐ Upgrade to Pro',
      style: 'margin-left:8px;',
      onClick: () => { if (extpay) extpay.openPaymentPage(); }
    }) : null
  ].filter(Boolean));
  panel.appendChild(exportBar);

  document.body.appendChild(panel);

  function togglePanel() {
    panel.classList.toggle('asd-hidden');
    toggleBtn.classList.toggle('asd-hidden');
    if (!panel.classList.contains('asd-hidden')) renderContent();
  }
  toggleBtn.addEventListener('click', togglePanel);

  function renderContent() {
    const section = el('div', { className: 'asd-section' });
    switch(activeTab) {
      case 'Overview':
        renderOverview(section);
        break;
      case 'Profit':
        ASD.profitCalc.renderWidget(section, { price: 29.99, cogs: 8, weight: 1.5 });
        break;
      case 'Inventory':
        ASD.inventory.checkAlerts().then(alerts => ASD.inventory.renderAlerts(section, alerts));
        break;
      case 'PPC':
        ASD.ppc.renderWidget(section, isPro);
        break;
      case 'Reviews':
        ASD.reviews.renderWidget(section);
        break;
      case 'Velocity':
        ASD.salesVelocity.renderWidget(section, isPro);
        break;
      case 'Keywords':
        ASD.keywords.renderWidget(section, isPro);
        break;
    }
    contentArea.innerHTML = '';
    contentArea.appendChild(section);
  }

  function renderOverview(container) {
    container.appendChild(el('div', { className: 'asd-section-title' }, ['Dashboard Overview']));

    // Quick stats
    const quickStats = [
      { label: 'Today\'s Orders', value: '—', note: 'Visit Orders page' },
      { label: 'Revenue', value: '—', note: 'Visit Reports' },
      { label: 'Inventory Alerts', value: '...', note: 'checking...' }
    ];

    for (const stat of quickStats) {
      container.appendChild(el('div', { className: 'asd-card' }, [
        el('div', { className: 'asd-stat-row' }, [
          el('span', { className: 'asd-stat-label', textContent: stat.label }),
          el('span', { className: 'asd-stat-value', textContent: stat.value })
        ]),
        el('div', { style: 'font-size:10px;color:var(--asd-text-muted);', textContent: stat.note })
      ]));
    }

    // Check inventory in background
    ASD.inventory.checkAlerts().then(alerts => {
      const alertCard = container.querySelectorAll('.asd-card')[2];
      if (alertCard) {
        const val = alertCard.querySelector('.asd-stat-value');
        if (val) val.textContent = alerts.length ? `${alerts.length} ⚠️` : '✅ OK';
      }
    });
  }

  async function exportData() {
    if (!isPro) {
      if (extpay) extpay.openPaymentPage();
      return;
    }
    // Export inventory alerts
    const alerts = await ASD.inventory.checkAlerts();
    if (alerts.length) {
      ASD.utils.downloadCsv('inventory-alerts.csv',
        ['Type', 'SKU', 'Quantity', 'Message'],
        alerts.map(a => [a.type, a.sku, a.qty || '', a.message])
      );
    }
  }

  // Auto-check inventory on relevant pages
  if (location.href.includes('/inventory') || location.href.includes('/fba-inventory')) {
    ASD.inventory.checkAlerts();
  }
})();
