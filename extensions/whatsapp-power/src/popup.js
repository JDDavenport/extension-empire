(() => {
  const MAX_TEMPLATES = 5;
  const listEl = document.getElementById('templates-list');
  const addBtn = document.getElementById('add-template');
  const badgeToggle = document.getElementById('badge-toggle');

  let templates = [];

  // --- Load ---
  chrome.storage.local.get(['templates', 'badgeEnabled'], (d) => {
    templates = d.templates || [];
    badgeToggle.checked = d.badgeEnabled !== false;
    render();
  });

  // --- Render templates ---
  function render() {
    listEl.innerHTML = '';
    templates.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'template-item';
      row.innerHTML = `
        <span class="tpl-shortcut">/t${i + 1}</span>
        <input type="text" value="${escHtml(text)}" placeholder="Type a template…" data-i="${i}">
        <button class="btn-icon" data-del="${i}" title="Delete">✕</button>
      `;
      listEl.appendChild(row);
    });
    addBtn.disabled = templates.length >= MAX_TEMPLATES;
    addBtn.textContent = templates.length >= MAX_TEMPLATES ? 'Max 5 templates (free tier)' : '+ Add Template';
  }

  // --- Events ---
  addBtn.addEventListener('click', () => {
    if (templates.length >= MAX_TEMPLATES) return;
    templates.push('');
    save();
  });

  listEl.addEventListener('input', (e) => {
    if (e.target.dataset.i !== undefined) {
      templates[+e.target.dataset.i] = e.target.value;
      save(true);
    }
  });

  listEl.addEventListener('click', (e) => {
    if (e.target.dataset.del !== undefined) {
      templates.splice(+e.target.dataset.del, 1);
      save();
    }
  });

  badgeToggle.addEventListener('change', () => {
    chrome.storage.local.set({ badgeEnabled: badgeToggle.checked });
    chrome.runtime.sendMessage({ type: 'badgeToggle', enabled: badgeToggle.checked });
  });

  // --- Save ---
  let saveTimer;
  function save(debounce) {
    if (debounce) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        chrome.storage.local.set({ templates });
      }, 300);
    } else {
      chrome.storage.local.set({ templates });
      render();
    }
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
