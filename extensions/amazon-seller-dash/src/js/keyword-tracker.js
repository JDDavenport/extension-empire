/* Amazon Seller Dashboard — Keyword Rank Tracker */
ASD.keywords = {
  async getTracked() {
    const settings = await ASD.storage.getSettings();
    return settings.trackedKeywords || [];
  },

  async addKeyword(keyword, asin) {
    const settings = await ASD.storage.getSettings();
    const existing = settings.trackedKeywords.find(k => k.keyword === keyword && k.asin === asin);
    if (!existing) {
      settings.trackedKeywords.push({ keyword, asin, ranks: [] });
      await ASD.storage.saveSettings(settings);
    }
  },

  async removeKeyword(keyword, asin) {
    const settings = await ASD.storage.getSettings();
    settings.trackedKeywords = settings.trackedKeywords.filter(
      k => !(k.keyword === keyword && k.asin === asin)
    );
    await ASD.storage.saveSettings(settings);
  },

  async recordRank(keyword, asin, rank) {
    const settings = await ASD.storage.getSettings();
    const kw = settings.trackedKeywords.find(k => k.keyword === keyword && k.asin === asin);
    if (kw) {
      kw.ranks.push({ rank, date: ASD.utils.dayKey(), ts: Date.now() });
      if (kw.ranks.length > 90) kw.ranks.splice(0, kw.ranks.length - 90);
      await ASD.storage.saveSettings(settings);
    }
  },

  renderWidget(container, isPro) {
    const { el } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, [
      '🔑 Keyword Tracker', isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
    ].filter(Boolean)));

    if (!isPro) {
      container.appendChild(el('div', { className: 'asd-card', textContent: 'Upgrade to Pro to track keyword rankings.' }));
      return;
    }

    // Add keyword form
    const form = el('div', { style: 'display:flex;gap:6px;margin-bottom:8px;' });
    const kwInput = el('input', { className: 'asd-input', placeholder: 'Keyword...', style: 'flex:1;' });
    const asinInput = el('input', { className: 'asd-input', placeholder: 'ASIN...', style: 'width:110px;' });
    const addBtn = el('button', {
      className: 'asd-btn asd-btn-primary',
      textContent: '+',
      onClick: async () => {
        const kw = kwInput.value.trim();
        const asin = asinInput.value.trim();
        if (kw && asin) {
          await this.addKeyword(kw, asin);
          kwInput.value = '';
          this.renderWidget(container, isPro);
        }
      }
    });
    form.append(kwInput, asinInput, addBtn);
    container.appendChild(form);

    // Show tracked keywords
    this.getTracked().then(keywords => {
      if (!keywords.length) {
        container.appendChild(el('div', { className: 'asd-card', textContent: 'Add keywords to start tracking.' }));
        return;
      }

      for (const kw of keywords) {
        const latestRank = kw.ranks.length ? kw.ranks[kw.ranks.length - 1].rank : '—';
        const prevRank = kw.ranks.length > 1 ? kw.ranks[kw.ranks.length - 2].rank : latestRank;
        const change = typeof latestRank === 'number' && typeof prevRank === 'number' ? prevRank - latestRank : 0;
        const dir = change > 0 ? '↑' : change < 0 ? '↓' : '—';
        const cls = change > 0 ? 'positive' : change < 0 ? 'negative' : '';

        const card = el('div', { className: 'asd-card', style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('div', {}, [
            el('div', { innerHTML: `<strong>${kw.keyword}</strong>` }),
            el('div', { className: 'asd-stat-label', textContent: kw.asin })
          ]),
          el('div', { style: 'text-align:right;' }, [
            el('div', { className: 'asd-stat-value ' + cls, textContent: `#${latestRank} ${dir}` }),
            el('button', {
              className: 'asd-btn-outline',
              textContent: '✕',
              style: 'font-size:10px;padding:2px 6px;margin-top:4px;',
              onClick: async () => {
                await this.removeKeyword(kw.keyword, kw.asin);
                this.renderWidget(container, isPro);
              }
            })
          ])
        ]);
        container.appendChild(card);
      }
    });
  }
};
