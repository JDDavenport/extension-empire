// popup.js — AI Chat Manager Popup
(async function() {
  'use strict';

  const db = new ACMDatabase();
  await db.open();

  let isPro = false;
  let bulkMode = false;
  let selectedIds = new Set();

  // ========== Pro Status ==========
  async function checkPro() {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'GET_PRO_STATUS' });
      isPro = resp?.isPro || false;
    } catch { isPro = false; }

    document.getElementById('pro-badge').style.display = isPro ? 'inline' : 'none';
    document.getElementById('pro-status').textContent = isPro ? 'Active ✓' : 'Free';
    document.getElementById('upgrade-btn').style.display = isPro ? 'none' : 'inline-block';

    // Gate pro features
    if (!isPro) {
      document.getElementById('folders-pro-gate').style.display = 'block';
      document.getElementById('folders-content').style.display = 'none';
      document.getElementById('prompts-pro-gate').style.display = 'block';
      document.getElementById('prompts-content').style.display = 'none';
    } else {
      document.getElementById('folders-pro-gate').style.display = 'none';
      document.getElementById('folders-content').style.display = 'block';
      document.getElementById('prompts-pro-gate').style.display = 'none';
      document.getElementById('prompts-content').style.display = 'block';
    }
  }

  // ========== Tabs ==========
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => { tc.classList.remove('active'); tc.style.display = 'none'; });
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      target.classList.add('active');
      target.style.display = 'block';
      document.getElementById('settings-panel').style.display = 'none';
    });
  });

  // Settings
  document.getElementById('settings-btn').addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(tc => { tc.classList.remove('active'); tc.style.display = 'none'; });
    document.getElementById('settings-panel').style.display = 'block';
  });
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('settings-panel').style.display = 'none';
    document.querySelector('.tab.active').click();
  });

  // ========== Rendering Helpers ==========
  function platformIcon(platform) {
    return platform === 'chatgpt'
      ? '<div class="platform-icon platform-chatgpt">G</div>'
      : '<div class="platform-icon platform-claude">C</div>';
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function renderConvItem(conv, options = {}) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.dataset.id = conv.id;

    let html = '';
    if (options.checkbox) {
      html += `<input type="checkbox" class="bulk-check" data-id="${conv.id}" ${selectedIds.has(conv.id) ? 'checked' : ''}>`;
    }
    html += platformIcon(conv.platform);
    html += `<div class="item-info">
      <div class="item-title">${conv.pinned ? '📌 ' : ''}${escHtml(conv.title || 'Untitled')}</div>
      <div class="item-meta">${timeAgo(conv.timestamp)}${conv.tags?.length ? ' · ' + conv.tags.map(t => `🏷${t}`).join(' ') : ''}</div>
    </div>`;
    html += `<div class="item-actions">
      <button title="Export" data-action="export" data-id="${conv.id}">📥</button>
      <button title="${conv.pinned ? 'Unpin' : 'Pin'}" data-action="pin" data-id="${conv.id}">${conv.pinned ? '📌' : '📍'}</button>
      <button title="Delete" data-action="delete" data-id="${conv.id}">🗑</button>
    </div>`;
    div.innerHTML = html;

    // Actions
    div.querySelectorAll('.item-actions button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'export') {
          const c = await db.getConversation(id);
          if (c) downloadJSON(c);
        } else if (action === 'pin') {
          const c = await db.getConversation(id);
          if (c) { c.pinned = !c.pinned; await db.saveConversation(c); refresh(); }
        } else if (action === 'delete') {
          if (confirm('Delete this conversation from index?')) {
            await db.deleteConversation(id);
            refresh();
          }
        }
      });
    });

    if (options.checkbox) {
      div.querySelector('.bulk-check')?.addEventListener('change', (e) => {
        if (e.target.checked) selectedIds.add(conv.id);
        else selectedIds.delete(conv.id);
      });
    }

    return div;
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function downloadJSON(conv) {
    const json = JSON.stringify(conv, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(conv.title || 'conv').replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ========== Search ==========
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const q = searchInput.value.trim();
      const resultsEl = document.getElementById('search-results');
      const pinnedSection = document.getElementById('pinned-section');
      const recentSection = document.getElementById('recent-section');

      if (q.length < 2) {
        resultsEl.innerHTML = '';
        pinnedSection.style.display = '';
        recentSection.style.display = '';
        return;
      }

      pinnedSection.style.display = 'none';
      recentSection.style.display = 'none';

      const results = await db.searchConversations(q);
      resultsEl.innerHTML = '';
      if (results.length === 0) {
        resultsEl.innerHTML = '<div class="empty-state">No results found</div>';
      } else {
        results.slice(0, 50).forEach(c => resultsEl.appendChild(renderConvItem(c)));
      }
    }, 300);
  });

  // ========== Load Lists ==========
  async function loadPinned() {
    const pinned = await db.getPinnedConversations();
    const list = document.getElementById('pinned-list');
    list.innerHTML = '';
    if (pinned.length === 0) {
      document.getElementById('pinned-section').style.display = 'none';
    } else {
      document.getElementById('pinned-section').style.display = '';
      pinned.forEach(c => list.appendChild(renderConvItem(c)));
    }
  }

  async function loadRecent() {
    const all = await db.getAllConversations();
    all.sort((a, b) => b.timestamp - a.timestamp);
    const list = document.getElementById('recent-list');
    list.innerHTML = '';
    all.slice(0, 20).forEach(c => list.appendChild(renderConvItem(c)));
    if (all.length === 0) {
      list.innerHTML = '<div class="empty-state">No conversations indexed yet. Visit ChatGPT or Claude to auto-index.</div>';
    }
  }

  async function loadFolders() {
    const folders = await db.getAllFolders();
    const list = document.getElementById('folders-list');
    list.innerHTML = '';
    if (folders.length === 0) {
      list.innerHTML = '<div class="empty-state">No folders yet</div>';
    }
    for (const f of folders) {
      const convs = await db.getConversationsByFolder(f.id);
      const div = document.createElement('div');
      div.className = 'folder-item';
      div.innerHTML = `<span>📁</span><span class="folder-name">${escHtml(f.name)}</span><span class="folder-count">${convs.length}</span><button class="del-folder" data-id="${f.id}" style="background:none;border:none;cursor:pointer;">🗑</button>`;
      div.querySelector('.del-folder').addEventListener('click', async (e) => {
        e.stopPropagation();
        const allFolders = await db.getAllFolders();
        await db.saveFolders(allFolders.filter(x => x.id !== f.id));
        loadFolders();
      });
      list.appendChild(div);
    }
  }

  async function loadPrompts() {
    const prompts = await db.getAllPrompts();
    const list = document.getElementById('prompts-list');
    list.innerHTML = '';
    if (prompts.length === 0) {
      list.innerHTML = '<div class="empty-state">No prompts saved yet</div>';
    }
    prompts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'prompt-item';
      div.innerHTML = `
        <div class="prompt-header">
          <span class="prompt-name">${escHtml(p.name)}</span>
          <span class="prompt-category">${p.category || 'general'}</span>
        </div>
        <div class="prompt-preview">${escHtml(p.text)}</div>
        <div class="prompt-actions">
          <button class="use-btn">Use</button>
          <button class="del-btn">Delete</button>
        </div>
      `;
      div.querySelector('.use-btn').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'INSERT_PROMPT', text: p.text });
          window.close();
        }
      });
      div.querySelector('.del-btn').addEventListener('click', async () => {
        await db.deletePrompt(p.id);
        loadPrompts();
      });
      list.appendChild(div);
    });
  }

  async function loadManage() {
    const platform = document.getElementById('filter-platform').value;
    const sort = document.getElementById('filter-sort').value;

    let all = await db.getAllConversations();
    if (platform !== 'all') all = all.filter(c => c.platform === platform);

    if (sort === 'newest') all.sort((a, b) => b.timestamp - a.timestamp);
    else if (sort === 'oldest') all.sort((a, b) => a.timestamp - b.timestamp);
    else all.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    const list = document.getElementById('manage-list');
    list.innerHTML = '';
    all.forEach(c => list.appendChild(renderConvItem(c, { checkbox: bulkMode })));

    document.getElementById('manage-stats').textContent =
      `${all.length} conversations · ChatGPT: ${all.filter(c => c.platform === 'chatgpt').length} · Claude: ${all.filter(c => c.platform === 'claude').length}`;
  }

  // ========== Folder Actions ==========
  document.getElementById('add-folder-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-folder-name').value.trim();
    if (!name) return;
    const folders = await db.getAllFolders();
    folders.push({ id: `folder_${Date.now()}`, name });
    await db.saveFolders(folders);
    document.getElementById('new-folder-name').value = '';
    loadFolders();
  });

  // ========== Prompt Actions ==========
  document.getElementById('add-prompt-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-prompt-name').value.trim();
    const text = document.getElementById('new-prompt-text').value.trim();
    const category = document.getElementById('new-prompt-category').value;
    if (!name || !text) return;
    await db.savePrompt({ id: `prompt_${Date.now()}`, name, text, category, createdAt: Date.now() });
    document.getElementById('new-prompt-name').value = '';
    document.getElementById('new-prompt-text').value = '';
    loadPrompts();
  });

  // ========== Manage Actions ==========
  document.getElementById('bulk-select-btn').addEventListener('click', () => {
    bulkMode = !bulkMode;
    selectedIds.clear();
    document.getElementById('bulk-select-btn').textContent = bulkMode ? '✅ Cancel Selection' : '☑️ Select Multiple';
    document.getElementById('bulk-delete-btn').style.display = bulkMode ? 'block' : 'none';
    loadManage();
  });

  document.getElementById('bulk-delete-btn').addEventListener('click', async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} conversations from index?`)) {
      await db.deleteConversations([...selectedIds]);
      selectedIds.clear();
      bulkMode = false;
      document.getElementById('bulk-select-btn').textContent = '☑️ Select Multiple';
      document.getElementById('bulk-delete-btn').style.display = 'none';
      loadManage();
    }
  });

  document.getElementById('export-all-btn').addEventListener('click', async () => {
    const all = await db.getAllConversations();
    const json = JSON.stringify(all, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-manager-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('filter-platform').addEventListener('change', loadManage);
  document.getElementById('filter-sort').addEventListener('change', loadManage);

  // ========== Settings ==========
  document.getElementById('upgrade-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
  });
  document.querySelectorAll('.btn-upgrade').forEach(btn => {
    btn.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' }));
  });
  document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (confirm('Delete ALL indexed data? This cannot be undone.')) {
      const all = await db.getAllConversations();
      await db.deleteConversations(all.map(c => c.id));
      refresh();
    }
  });

  // ========== Refresh ==========
  async function refresh() {
    await checkPro();
    loadPinned();
    loadRecent();
    loadFolders();
    loadPrompts();
    loadManage();
  }

  refresh();
})();
