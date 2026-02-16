// Discount Code Generator & Manager — Pro feature
SPT.DiscountGenerator = {
  init() {
    // Available from popup
  },

  generateCode(prefix = 'SAVE', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  },

  generateBatch(count, prefix, length) {
    const codes = new Set();
    while (codes.size < count) codes.add(this.generateCode(prefix, length));
    return [...codes];
  },

  async saveCodes(codes, meta = {}) {
    const data = await chrome.storage.local.get('discountCodes');
    const all = data.discountCodes || [];
    codes.forEach(code => {
      all.push({ code, ...meta, createdAt: Date.now(), used: false });
    });
    await chrome.storage.local.set({ discountCodes: all });
  },

  async getCodes() {
    const data = await chrome.storage.local.get('discountCodes');
    return data.discountCodes || [];
  },

  async deleteCode(code) {
    const data = await chrome.storage.local.get('discountCodes');
    const codes = (data.discountCodes || []).filter(c => c.code !== code);
    await chrome.storage.local.set({ discountCodes: codes });
    return codes;
  },

  renderManager(container) {
    if (!SPT.requirePro('Discount Code Manager')) return;
    this.getCodes().then(codes => {
      container.innerHTML = `
        <h3>🏷️ Discount Code Manager</h3>
        <div class="spt-form-row">
          <input type="text" id="spt-disc-prefix" placeholder="Prefix (e.g. SAVE)" value="SAVE" class="spt-input" />
          <input type="number" id="spt-disc-count" placeholder="Count" value="10" class="spt-input spt-input-sm" />
          <select id="spt-disc-type" class="spt-input">
            <option value="percent">% Off</option>
            <option value="fixed">$ Off</option>
            <option value="shipping">Free Shipping</option>
          </select>
          <input type="number" id="spt-disc-value" placeholder="Value" value="10" class="spt-input spt-input-sm" />
          <button class="spt-btn spt-btn-primary" id="spt-gen-codes">Generate</button>
        </div>
        <div id="spt-codes-list">
          ${codes.length === 0 ? '<p class="spt-muted">No codes generated yet.</p>' : `
            <table class="spt-table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Created</th><th></th></tr></thead>
              <tbody>
                ${codes.slice(-50).reverse().map(c => `
                  <tr>
                    <td><code>${c.code}</code></td>
                    <td>${c.type || 'percent'}</td>
                    <td>${c.value || ''}${c.type === 'percent' ? '%' : c.type === 'fixed' ? '$' : ''}</td>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td><button class="spt-btn-sm spt-btn-danger" data-del="${c.code}">×</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <button class="spt-btn" id="spt-export-codes">Export CSV</button>
          `}
        </div>`;

      container.querySelector('#spt-gen-codes')?.addEventListener('click', async () => {
        const prefix = container.querySelector('#spt-disc-prefix').value || 'SAVE';
        const count = parseInt(container.querySelector('#spt-disc-count').value) || 10;
        const type = container.querySelector('#spt-disc-type').value;
        const value = container.querySelector('#spt-disc-value').value;
        const codes = this.generateBatch(count, prefix, 8);
        await this.saveCodes(codes, { type, value });
        SPT.toast(`Generated ${codes.length} codes`);
        this.renderManager(container);
      });

      container.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = async () => {
          await this.deleteCode(btn.dataset.del);
          this.renderManager(container);
        };
      });

      container.querySelector('#spt-export-codes')?.addEventListener('click', () => {
        const csv = 'Code,Type,Value,Created\n' + codes.map(c =>
          `${c.code},${c.type || ''},${c.value || ''},${new Date(c.createdAt).toISOString()}`
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'discount-codes.csv';
        a.click();
      });
    });
  }
};
