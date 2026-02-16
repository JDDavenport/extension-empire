// Bulk Inventory Updater — Pro feature
SPT.BulkInventory = {
  init() {
    if (!SPT.isProductsPage()) return;
    this.addToolbarButton();
  },

  addToolbarButton() {
    const observer = new MutationObserver(SPT.debounce(() => {
      if (document.getElementById('spt-bulk-inv-btn')) return;
      const toolbar = document.querySelector('.Polaris-IndexTable__StickyTableHeader, .Polaris-ResourceList__HeaderWrapper');
      if (!toolbar) return;
      const btn = document.createElement('button');
      btn.id = 'spt-bulk-inv-btn';
      btn.className = 'spt-toolbar-btn';
      btn.innerHTML = '📦 Bulk Inventory';
      btn.onclick = () => this.openModal();
      toolbar.appendChild(btn);
    }, 500));
    observer.observe(document.body, { childList: true, subtree: true });
  },

  openModal() {
    if (!SPT.requirePro('Bulk Inventory Updater')) return;
    const modal = document.createElement('div');
    modal.className = 'spt-modal-overlay';
    modal.id = 'spt-bulk-inv-modal';
    modal.innerHTML = `
      <div class="spt-modal spt-modal-lg">
        <h2>📦 Bulk Inventory Updater</h2>
        <div class="spt-form-group">
          <label>Action</label>
          <select id="spt-inv-action">
            <option value="set">Set quantity to</option>
            <option value="add">Add to current</option>
            <option value="subtract">Subtract from current</option>
          </select>
        </div>
        <div class="spt-form-group">
          <label>Quantity</label>
          <input type="number" id="spt-inv-qty" placeholder="e.g. 100" />
        </div>
        <div id="spt-inv-preview" class="spt-preview"></div>
        <div class="spt-modal-actions">
          <button class="spt-btn" id="spt-inv-preview-btn">Preview</button>
          <button class="spt-btn spt-btn-primary" id="spt-inv-apply-btn">Apply</button>
          <button class="spt-btn" id="spt-inv-cancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#spt-inv-cancel').onclick = () => modal.remove();
    modal.querySelector('#spt-inv-preview-btn').onclick = () => this.preview();
    modal.querySelector('#spt-inv-apply-btn').onclick = () => this.apply();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  },

  async preview() {
    const products = await SPT.BulkPrice.getProducts();
    const action = document.getElementById('spt-inv-action').value;
    const qty = parseInt(document.getElementById('spt-inv-qty').value) || 0;
    const container = document.getElementById('spt-inv-preview');

    const rows = products.slice(0, 20).map(p => {
      const v = p.variants?.[0];
      const current = v?.inventory_quantity ?? 0;
      const newQty = action === 'set' ? qty : action === 'add' ? current + qty : current - qty;
      return `<tr><td>${p.title}</td><td>${current}</td><td>${Math.max(0, newQty)}</td></tr>`;
    }).join('');

    container.innerHTML = `<table class="spt-table"><thead><tr><th>Product</th><th>Current</th><th>New</th></tr></thead><tbody>${rows}</tbody></table>`;
  },

  async apply() {
    const products = await SPT.BulkPrice.getProducts();
    const action = document.getElementById('spt-inv-action').value;
    const qty = parseInt(document.getElementById('spt-inv-qty').value) || 0;
    let updated = 0;

    for (const p of products) {
      for (const v of (p.variants || [])) {
        const current = v.inventory_quantity ?? 0;
        const newQty = action === 'set' ? qty : action === 'add' ? current + qty : Math.max(0, current - qty);
        try {
          await SPT.shopifyPut(`/variants/${v.id}.json`, { variant: { id: v.id, inventory_quantity: newQty } });
          updated++;
        } catch (e) { /* continue */ }
      }
    }
    SPT.toast(`Updated inventory for ${updated} variants`);
    document.getElementById('spt-bulk-inv-modal')?.remove();
  }
};
