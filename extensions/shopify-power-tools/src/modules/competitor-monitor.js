// Competitor Price Monitor — Pro feature
SPT.CompetitorMonitor = {
  init() {
    // Available from popup
  },

  async addCompetitor(url) {
    if (!SPT.requirePro('Competitor Price Monitor')) return;
    const data = await chrome.storage.local.get('competitors');
    const competitors = data.competitors || [];
    if (!competitors.find(c => c.url === url)) {
      competitors.push({ url, addedAt: Date.now(), prices: [] });
      await chrome.storage.local.set({ competitors });
    }
    return competitors;
  },

  async removeCompetitor(url) {
    const data = await chrome.storage.local.get('competitors');
    const competitors = (data.competitors || []).filter(c => c.url !== url);
    await chrome.storage.local.set({ competitors });
    return competitors;
  },

  async getCompetitors() {
    const data = await chrome.storage.local.get('competitors');
    return data.competitors || [];
  },

  async fetchPrices(storeUrl) {
    try {
      const url = storeUrl.replace(/\/$/, '') + '/products.json?limit=250';
      const res = await fetch(url);
      const data = await res.json();
      return (data.products || []).map(p => ({
        title: p.title,
        price: p.variants?.[0]?.price,
        compareAt: p.variants?.[0]?.compare_at_price,
        image: p.images?.[0]?.src,
        handle: p.handle,
        updatedAt: p.updated_at
      }));
    } catch {
      return [];
    }
  },

  renderDashboard(container) {
    this.getCompetitors().then(async competitors => {
      let html = '<h3>🕵️ Competitor Monitor</h3>';
      if (competitors.length === 0) {
        html += '<p class="spt-muted">No competitors added yet. Add a Shopify store URL to start tracking.</p>';
      }
      for (const c of competitors) {
        const products = await this.fetchPrices(c.url);
        const avgPrice = products.length ? (products.reduce((s, p) => s + parseFloat(p.price || 0), 0) / products.length).toFixed(2) : 'N/A';
        html += `
          <div class="spt-card">
            <div class="spt-card-header">
              <strong>${new URL(c.url).hostname}</strong>
              <button class="spt-btn-sm spt-btn-danger" data-remove="${c.url}">Remove</button>
            </div>
            <div class="spt-stats">
              <div class="spt-stat"><span class="spt-stat-num">${products.length}</span><span>Products</span></div>
              <div class="spt-stat"><span class="spt-stat-num">$${avgPrice}</span><span>Avg Price</span></div>
            </div>
          </div>`;
      }
      container.innerHTML = html;
      container.querySelectorAll('[data-remove]').forEach(btn => {
        btn.onclick = async () => {
          await this.removeCompetitor(btn.dataset.remove);
          this.renderDashboard(container);
        };
      });
    });
  }
};
