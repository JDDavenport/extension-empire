// Inline Product Editor — Free feature
SPT.InlineEditor = {
  init() {
    if (!SPT.isProductsPage()) return;
    this.observe();
  },

  observe() {
    const observer = new MutationObserver(SPT.debounce(() => this.attachEditors(), 500));
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => this.attachEditors(), 1000);
  },

  attachEditors() {
    // Target product list table cells
    const rows = document.querySelectorAll('table tbody tr:not(.spt-editable)');
    rows.forEach(row => {
      row.classList.add('spt-editable');
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, i) => {
        if (i === 0) return; // skip checkbox
        cell.classList.add('spt-inline-cell');
        cell.addEventListener('dblclick', (e) => this.startEdit(cell, row));
      });
    });
  },

  startEdit(cell, row) {
    if (cell.querySelector('.spt-inline-input')) return;
    const original = cell.textContent.trim();
    const input = document.createElement('input');
    input.className = 'spt-inline-input';
    input.value = original;
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    const save = async () => {
      const newVal = input.value.trim();
      cell.textContent = newVal;
      if (newVal !== original) {
        // Extract product ID from row link
        const link = row.querySelector('a[href*="/products/"]');
        if (link) {
          const pid = link.href.match(/products\/(\d+)/)?.[1];
          if (pid) {
            try {
              // Determine field from column index
              const field = this.getFieldName(cell);
              if (field) {
                await SPT.shopifyPut(`/products/${pid}.json`, { product: { [field]: newVal } });
                SPT.toast(`Updated ${field}`);
              }
            } catch (e) {
              SPT.toast('Update failed', 'error');
              cell.textContent = original;
            }
          }
        }
      }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { cell.textContent = original; }
    });
  },

  getFieldName(cell) {
    const header = document.querySelector(`table thead th:nth-child(${cell.cellIndex + 1})`);
    const text = header?.textContent?.trim()?.toLowerCase() || '';
    const map = { 'product': 'title', 'title': 'title', 'status': 'status', 'type': 'product_type', 'vendor': 'vendor' };
    return map[text] || null;
  }
};
