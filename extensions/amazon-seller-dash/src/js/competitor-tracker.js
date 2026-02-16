/* Amazon Seller Dashboard — Competitor ASIN Tracker */
ASD.competitors = {
  async scrapeProduct() {
    const asin = ASD.bsr.getAsinFromPage();
    if (!asin) return null;

    const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, #corePrice_feature_div .a-offscreen');
    const price = ASD.utils.parsePrice(priceEl?.textContent);

    const bsr = ASD.bsr.scrapeCurrentBSR();
    const rank = bsr?.rank || 0;

    const reviewCountEl = document.querySelector('#acrCustomerReviewText');
    const reviewCount = parseInt(reviewCountEl?.textContent?.replace(/[^0-9]/g, '')) || 0;

    const ratingEl = document.querySelector('#acrPopover .a-icon-alt, [data-hook="rating-out-of-text"]');
    const rating = parseFloat(ratingEl?.textContent) || 0;

    const titleEl = document.querySelector('#productTitle');
    const title = titleEl?.textContent?.trim()?.slice(0, 80) || asin;

    return { asin, title, price, rank, reviewCount, rating, timestamp: Date.now() };
  },

  async track() {
    const product = await this.scrapeProduct();
    if (!product) return;

    const key = `competitor_${product.asin}`;
    await ASD.storage.appendToArray(key, product, 90);

    // Add to tracked list
    const settings = await ASD.storage.getSettings();
    if (!settings.trackedCompetitors.includes(product.asin)) {
      settings.trackedCompetitors.push(product.asin);
      await ASD.storage.saveSettings(settings);
    }
  },

  async getTrackedData() {
    const settings = await ASD.storage.getSettings();
    const results = [];
    for (const asin of settings.trackedCompetitors) {
      const key = `competitor_${asin}`;
      const data = await ASD.storage.get([key]);
      const history = data[key] || [];
      if (history.length) {
        const latest = history[history.length - 1];
        const prev = history.length > 1 ? history[history.length - 2] : latest;
        results.push({
          ...latest,
          priceChange: latest.price - prev.price,
          rankChange: latest.rank - prev.rank,
          reviewChange: latest.reviewCount - prev.reviewCount,
          history
        });
      }
    }
    return results;
  },

  renderWidget(container, isPro) {
    const { el, formatCurrency, formatNumber } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, [
      '🔍 Competitor Tracker', isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
    ].filter(Boolean)));

    if (!isPro) {
      container.appendChild(el('div', { className: 'asd-card', textContent: 'Upgrade to Pro to track competitors.' }));
      return;
    }

    this.getTrackedData().then(competitors => {
      if (!competitors.length) {
        container.appendChild(el('div', { className: 'asd-card', textContent: 'Visit competitor product pages to start tracking.' }));
        return;
      }

      for (const c of competitors.slice(0, 5)) {
        const priceDir = c.priceChange > 0 ? '↑' : c.priceChange < 0 ? '↓' : '—';
        const rankDir = c.rankChange < 0 ? '↑' : c.rankChange > 0 ? '↓' : '—';
        const card = el('div', { className: 'asd-card' }, [
          el('div', { innerHTML: `<strong>${c.title}</strong>` }),
          el('div', { className: 'asd-stat-row' }, [
            el('span', { className: 'asd-stat-label', textContent: 'Price' }),
            el('span', { textContent: `${formatCurrency(c.price)} ${priceDir}` })
          ]),
          el('div', { className: 'asd-stat-row' }, [
            el('span', { className: 'asd-stat-label', textContent: 'BSR' }),
            el('span', { textContent: `#${formatNumber(c.rank)} ${rankDir}` })
          ]),
          el('div', { className: 'asd-stat-row' }, [
            el('span', { className: 'asd-stat-label', textContent: 'Reviews' }),
            el('span', { textContent: `${formatNumber(c.reviewCount)} (+${c.reviewChange})` })
          ])
        ]);
        container.appendChild(card);
      }
    });
  }
};
