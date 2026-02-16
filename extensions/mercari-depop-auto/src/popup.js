/**
 * RelistPro — Popup Dashboard
 */

document.addEventListener('DOMContentLoaded', async () => {
  const $ = (sel) => document.querySelector(sel);

  // ── Load Stats ──────────────────────────────────────────────────────

  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    const rateLimit = await chrome.runtime.sendMessage({ type: 'CHECK_RATE_LIMIT' });

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayCount = stats?.dailyRelists?.[today] || 0;
    const yesterdayCount = stats?.dailyRelists?.[yesterday] || 0;

    $('#stat-today').textContent = todayCount;
    $('#stat-total').textContent = stats?.totalRelists || 0;
    $('#stat-tracked').textContent = stats?.totalListingsTracked || 0;
    $('#stat-remaining').textContent = rateLimit?.remaining ?? 50;

    // Today vs yesterday change
    const changeEl = $('#stat-today-change');
    if (todayCount > yesterdayCount) {
      changeEl.textContent = `↑ +${todayCount - yesterdayCount} vs yesterday`;
      changeEl.className = 'stat-change up';
    } else if (todayCount < yesterdayCount) {
      changeEl.textContent = `↓ ${todayCount - yesterdayCount} vs yesterday`;
      changeEl.className = 'stat-change down';
    } else {
      changeEl.textContent = 'Same as yesterday';
      changeEl.className = 'stat-change neutral';
    }

    // ── 7-Day Chart ─────────────────────────────────────────────────

    const chartContainer = $('#chart-container');
    const days = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      days.push({
        label: dayLabels[d.getDay()],
        count: stats?.dailyRelists?.[key] || 0
      });
    }

    const maxCount = Math.max(...days.map(d => d.count), 1);

    if (days.every(d => d.count === 0)) {
      chartContainer.innerHTML = '<div class="chart-empty">No activity yet. Relist your first item! ⚡</div>';
    } else {
      const chart = document.createElement('div');
      chart.className = 'chart';
      days.forEach(day => {
        const wrap = document.createElement('div');
        wrap.className = 'chart-bar-wrap';
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = Math.max(4, (day.count / maxCount) * 64);
        bar.style.height = '4px';
        // Animate in
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.height = height + 'px';
          });
        });
        bar.title = `${day.count} relists`;
        const label = document.createElement('span');
        label.className = 'chart-label';
        label.textContent = day.label;
        wrap.appendChild(bar);
        wrap.appendChild(label);
        chart.appendChild(wrap);
      });
      chartContainer.appendChild(chart);
    }

  } catch (err) {
    console.error('RelistPro popup error:', err);
  }

  // ── Quick Actions ─────────────────────────────────────────────────

  $('#action-listings')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.mercari.com/mypage/listings' });
  });

  $('#action-sell')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.mercari.com/sell/' });
  });

  // ── Pro Banner ────────────────────────────────────────────────────

  // ExtensionPay placeholder
  // $('#pro-banner')?.addEventListener('click', () => {
  //   extpay.openPaymentPage();
  // });
  $('#pro-banner')?.addEventListener('click', () => {
    // For now, just show coming soon
    $('#pro-banner').querySelector('.pro-banner-desc').textContent = 'Coming soon! Stay tuned for Pro features.';
  });

  // ── Footer Links ──────────────────────────────────────────────────

  $('#footer-rate')?.addEventListener('click', () => {
    // Replace with actual Chrome Web Store URL after publishing
    chrome.tabs.create({ url: 'https://chrome.google.com/webstore' });
  });

  $('#footer-support')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'mailto:support@relistpro.app' });
  });
});
