/* Amazon Seller Dashboard — BSR Tracker */
ASD.bsr = {
  scrapeCurrentBSR() {
    // Find BSR on Amazon product page
    const bsrEl = document.querySelector('#productDetails_detailBullets_sections1, #detailBulletsWrapper_feature_div, .prodDetTable');
    if (!bsrEl) return null;

    const text = bsrEl.textContent;
    const match = text.match(/Best Sellers Rank.*?#([\d,]+)/i);
    if (!match) return null;

    const rank = parseInt(match[1].replace(/,/g, ''));
    const catMatch = text.match(/Best Sellers Rank.*?#[\d,]+\s+in\s+([^\(]+)/i);
    const category = catMatch ? catMatch[1].trim() : 'Unknown';

    return { rank, category, timestamp: Date.now() };
  },

  getAsinFromPage() {
    // Try canonical link
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const m = canonical.href.match(/\/dp\/([A-Z0-9]{10})/);
      if (m) return m[1];
    }
    // Try URL
    const urlMatch = location.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (urlMatch) return urlMatch[1];
    // Try hidden input
    const input = document.querySelector('input[name="ASIN"]');
    return input?.value || null;
  },

  async trackBSR() {
    const asin = this.getAsinFromPage();
    if (!asin) return null;

    const bsr = this.scrapeCurrentBSR();
    if (!bsr) return null;

    const key = `bsr_${asin}`;
    const data = await ASD.storage.get([key]);
    const history = data[key] || [];
    history.push({ rank: bsr.rank, ts: bsr.timestamp });

    // Keep 90 days of daily data
    if (history.length > 90) history.splice(0, history.length - 90);
    await ASD.storage.set({ [key]: history });

    return { asin, current: bsr, history };
  },

  renderWidget(container, isPro) {
    const { el } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, [
      '📊 BSR Tracker', isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
    ].filter(Boolean)));

    if (!isPro) {
      container.appendChild(el('div', { className: 'asd-card', textContent: 'Upgrade to Pro to track BSR history.' }));
      return;
    }

    this.trackBSR().then(result => {
      if (!result) {
        container.appendChild(el('div', { className: 'asd-card', textContent: 'Visit a product page to track BSR.' }));
        return;
      }

      container.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: 'ASIN' }),
        el('span', { className: 'asd-stat-value', textContent: result.asin })
      ]));
      container.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: 'Current BSR' }),
        el('span', { className: 'asd-stat-value', textContent: '#' + ASD.utils.formatNumber(result.current.rank) })
      ]));
      container.appendChild(el('div', { className: 'asd-stat-row' }, [
        el('span', { className: 'asd-stat-label', textContent: 'Category' }),
        el('span', { className: 'asd-stat-value', textContent: result.current.category })
      ]));

      // Chart
      if (result.history.length > 1) {
        const chartDiv = el('div', { className: 'asd-chart-container' });
        const canvas = el('canvas');
        chartDiv.appendChild(canvas);
        container.appendChild(chartDiv);
        requestAnimationFrame(() => {
          ASD.utils.miniChart(canvas, result.history.map(h => h.rank).reverse(), '#ff9900');
        });
      }
    });
  }
};
