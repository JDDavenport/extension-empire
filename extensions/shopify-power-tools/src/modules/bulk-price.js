// Bulk Price Editor — Pro feature
SPT.BulkPrice = {
  init() {
    if (!SPT.isProductsPage()) return;
    this.addToolbarButton();
  },

  addToolbarButton() {
    const observer = new MutationObserver(SPT.debounce(() => {
      if (document.getElementById('spt-bulk-price-btn')) return;
      const toolbar = document.querySelector('.Polaris-IndexTable__StickyTableHeader, .Polaris-ResourceList__HeaderWrapper');
      if (!toolbar) return;
      const btn = document.createElement('button');
      btn.id = 'spt-bulk-price-btn';
      btn.className = 'spt-toolbar-btn';
      btn.innerHTML = '💰 Bulk Price Edit';
      btn.onclick = () => this.openModal();
      toolbar.appendChild(btn);
    }, 500));
    observer.observe(document.body, { childList: true, subtree: true });
  },

  openModal() {
    if (!SPT.requirePro('Bulk Price Editor')) return;
    const modal = document.createElement('div');
    modal.className = 'spt-modal-overlay';
    modal.id = 'spt-bulk-price-modal';
    modal.innerHTML = `
      <div class="spt-modal spt-modal-lg">
        <h2>💰 Bulk Price Editor</h2>
        <div class="spt-form-group">
          <label>Adjustment Type</label>
          <select id="spt-price-type">
            <option value="percent_increase">% Increase</option>
            <option value="percent_decrease">% Decrease</option>
            <option value="fixed_increase">Fixed $ Increase</option>
            <option value="fixed_decrease">Fixed $ Decrease</option>
            <option value="set">Set to Exact Price</option>
          </select>
        </div>
        <div class="spt-form-group">
          <label>Value</label>
          <input type="number" id="spt-price-value" placeholder="e.g. 10" step="0.01" />
        </div>
        <div class="spt-form-group">
          <label><input type="checkbox" id="spt-price-round" checked /> Round to .99</label>
        </div>
        <div class="spt-form-group">
          <label>Apply to</label>
          <select id="spt-price-scope">
            <option value="selected">Selected Products</option>
            <option value="all">All Products</option>
            <option value="collection">By Collection</option>
          </select>
        </div>
        <div id="spt-price-preview" class="spt-preview"></div>
        <div class="spt-modal-actions">
          <button class="spt-btn" id="spt-price-preview-btn">Preview Changes</button>
          <button class="spt-btn spt-btn-primary" id="spt-price-apply-btn">Apply</button>
          <button class="spt-btn" id="spt-price-cancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#spt-price-cancel').onclick = () => modal.remove();
    modal.querySelector('#spt-price-preview-btn').onclick = () => this.preview();
    modal.querySelector('#spt-price-apply-btn').onclick = () => this.apply();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  },

  async preview() {
    const products = await this.getProducts();
    const type = document.getElementById('spt-price-type').value;
    const value = parseFloat(document.getElementById('spt-price-value').value) || 0;
    const round = document.getElementById('spt-price-round').checked;
    const container = document.getElementById('spt-price-preview');

    const rows = products.slice(0, 20).map(p => {
      const oldPrice = parseFloat(p.variants?.[0]?.price || 0);
      const newPrice = this.calculate(oldPrice, type, value, round);
      const diff = newPrice - oldPrice;
      return `<tr><td>${p.title}</td><td>$${oldPrice.toFixed(2)}</td><td>$${newPrice.toFixed(2)}</td><td class="${diff >= 0 ? 'spt-green' : 'spt-red'}">${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}</td></tr>`;
    }).join('');

    container.innerHTML = `<table class="spt-table"><thead><tr><th>Product</th><th>Current</th><th>New</th><th>Change</th></tr></thead><tbody>${rows}</tbody></table><p class="spt-muted">${products.length} products total</p>`;
  },

  calculate(price, type, value, round) {
    let result;
    switch (type) {
      case 'percent_increase': result = price * (1 + value / 100); break;
      case 'percent_decrease': result = price * (1 - value / 100); break;
      case 'fixed_increase': result = price + value; break;
      case 'fixed_decrease': result = price - value; break;
      case 'set': result = value; break;
      default: result = price;
    }
    if (round) result = Math.floor(result) + 0.99;
    return Math.max(0, result);
  },

  async apply() {
    const products = await this.getProducts();
    const type = document.getElementById('spt-price-type').value;
    const value = parseFloat(document.getElementById('spt-price-value').value) || 0;
    const round = document.getElementById('spt-price-round').checked;
    let updated = 0;

    for (const p of products) {
      for (const v of (p.variants || [])) {
        const oldPrice = parseFloat(v.price || 0);
        const newPrice = this.calculate(oldPrice, type, value, round);
        try {
          await SPT.shopifyPut(`/variants/${v.id}.json`, { variant: { id: v.id, price: newPrice.toFixed(2) } });
          updated++;
        } catch (e) { /* continue */ }
      }
    }
    SPT.toast(`Updated ${updated} variant prices`);
    document.getElementById('spt-bulk-price-modal')?.remove();
  },

  async getProducts() {
    try {
      const data = await SPT.shopifyFetch('/products.json?limit=250');
      return data.products || [];
    } catch { return []; }
  }
};
