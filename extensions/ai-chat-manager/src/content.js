// content.js — Content script for ChatGPT and Claude
(function() {
  'use strict';

  const PLATFORM = window.location.hostname.includes('claude') ? 'claude' : 'chatgpt';

  // ========== Platform Adapters ==========
  const Adapters = {
    chatgpt: {
      getConversationId() {
        const match = window.location.pathname.match(/\/c\/([a-z0-9-]+)/);
        return match ? match[1] : null;
      },
      getTitle() {
        // ChatGPT shows title in the active nav item or document title
        return document.title.replace(' | ChatGPT', '').replace('ChatGPT - ', '') || 'Untitled';
      },
      getMessages() {
        const messages = [];
        const turns = document.querySelectorAll('[data-message-author-role]');
        turns.forEach(el => {
          const role = el.getAttribute('data-message-author-role');
          const textEl = el.querySelector('.markdown, .whitespace-pre-wrap');
          if (textEl) {
            messages.push({ role: role === 'user' ? 'user' : 'assistant', text: textEl.innerText.trim() });
          }
        });
        return messages;
      },
      getInputBox() {
        return document.querySelector('#prompt-textarea, textarea[data-id="root"]');
      },
      getSidebarConversations() {
        const items = [];
        document.querySelectorAll('nav a[href^="/c/"]').forEach(a => {
          const id = a.href.match(/\/c\/([a-z0-9-]+)/)?.[1];
          if (id) items.push({ id, title: a.textContent.trim(), platform: 'chatgpt' });
        });
        return items;
      }
    },
    claude: {
      getConversationId() {
        const match = window.location.pathname.match(/\/chat\/([a-z0-9-]+)/);
        return match ? match[1] : null;
      },
      getTitle() {
        return document.title.replace(' - Claude', '') || 'Untitled';
      },
      getMessages() {
        const messages = [];
        // Claude uses data-testid or specific class patterns
        const humanMsgs = document.querySelectorAll('[data-testid="human-turn"], .human-turn');
        const aiMsgs = document.querySelectorAll('[data-testid="ai-turn"], .ai-turn');

        // Alternative: grab all message blocks in order
        const allBlocks = document.querySelectorAll('.font-claude-message, [class*="Message"], [data-testid*="turn"]');
        if (allBlocks.length > 0) {
          allBlocks.forEach((el, i) => {
            const isHuman = el.matches('[data-testid="human-turn"], .human-turn') ||
                           el.querySelector('[data-testid="human-turn"]');
            messages.push({
              role: isHuman ? 'user' : 'assistant',
              text: el.innerText.trim()
            });
          });
        }

        // Fallback: alternate user/assistant from contenteditable and response blocks
        if (messages.length === 0) {
          const blocks = document.querySelectorAll('.prose, .whitespace-pre-wrap, [class*="message"]');
          blocks.forEach((el, i) => {
            if (el.innerText.trim()) {
              messages.push({ role: i % 2 === 0 ? 'user' : 'assistant', text: el.innerText.trim() });
            }
          });
        }
        return messages;
      },
      getInputBox() {
        return document.querySelector('[contenteditable="true"].ProseMirror, textarea, [contenteditable="true"]');
      },
      getSidebarConversations() {
        const items = [];
        document.querySelectorAll('a[href^="/chat/"]').forEach(a => {
          const id = a.href.match(/\/chat\/([a-z0-9-]+)/)?.[1];
          if (id) items.push({ id, title: a.textContent.trim(), platform: 'claude' });
        });
        return items;
      }
    }
  };

  const adapter = Adapters[PLATFORM];

  // ========== Conversation Scraping & Indexing ==========
  async function scrapeAndIndex() {
    const id = adapter.getConversationId();
    if (!id) return null;

    const conv = {
      id: `${PLATFORM}_${id}`,
      platform: PLATFORM,
      externalId: id,
      title: adapter.getTitle(),
      messages: adapter.getMessages(),
      timestamp: Date.now(),
      pinned: false,
      folder: null,
      tags: []
    };

    // Preserve existing metadata
    const existing = await window.acmDB.getConversation(conv.id);
    if (existing) {
      conv.pinned = existing.pinned;
      conv.folder = existing.folder;
      conv.tags = existing.tags || [];
    }

    await window.acmDB.saveConversation(conv);
    return conv;
  }

  // Index sidebar conversations (titles only, for search)
  async function indexSidebar() {
    const items = adapter.getSidebarConversations();
    for (const item of items) {
      const id = `${PLATFORM}_${item.id}`;
      const existing = await window.acmDB.getConversation(id);
      if (!existing) {
        await window.acmDB.saveConversation({
          id,
          platform: PLATFORM,
          externalId: item.id,
          title: item.title,
          messages: [],
          timestamp: Date.now(),
          pinned: false,
          folder: null,
          tags: []
        });
      }
    }
  }

  // ========== Floating Action Button ==========
  function createFAB() {
    if (document.getElementById('acm-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'acm-fab';
    fab.innerHTML = `
      <div class="acm-fab-btn" title="AI Chat Manager">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h8M8 14h4"/>
        </svg>
      </div>
      <div class="acm-fab-menu" style="display:none;">
        <button data-action="export-md" title="Export Markdown">📝 Export MD</button>
        <button data-action="export-json" title="Export JSON">📋 Export JSON</button>
        <button data-action="export-pdf" title="Export PDF">📄 Export PDF</button>
        <button data-action="pin" title="Pin Conversation">📌 Pin</button>
        <button data-action="tag" title="Add Tag">🏷️ Tag</button>
        <button data-action="share" title="Share" data-pro="true">🔗 Share</button>
        <button data-action="analytics" title="Analytics" data-pro="true">📊 Analytics</button>
        <button data-action="prompt-insert" title="Insert Prompt" data-pro="true">⚡ Prompt</button>
      </div>
    `;
    document.body.appendChild(fab);

    const btn = fab.querySelector('.acm-fab-btn');
    const menu = fab.querySelector('.acm-fab-menu');

    btn.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target)) menu.style.display = 'none';
    });

    menu.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', (e) => handleAction(e.target.dataset.action, e.target.dataset.pro === 'true'));
    });
  }

  // ========== Actions ==========
  async function handleAction(action, requiresPro) {
    if (requiresPro) {
      const { isPro } = await chrome.storage.local.get('isPro');
      if (!isPro) {
        showProModal();
        return;
      }
    }

    const conv = await scrapeAndIndex();
    if (!conv && ['export-md', 'export-json', 'export-pdf', 'pin', 'share', 'analytics'].includes(action)) {
      showToast('Navigate to a conversation first');
      return;
    }

    switch (action) {
      case 'export-md':
        window.ACMExport.exportConversation(conv, 'markdown');
        showToast('Exported as Markdown');
        break;
      case 'export-json':
        window.ACMExport.exportConversation(conv, 'json');
        showToast('Exported as JSON');
        break;
      case 'export-pdf':
        window.ACMExport.exportConversation(conv, 'pdf');
        showToast('Opening print dialog...');
        break;
      case 'pin':
        conv.pinned = !conv.pinned;
        await window.acmDB.saveConversation(conv);
        showToast(conv.pinned ? '📌 Pinned!' : 'Unpinned');
        break;
      case 'tag':
        showTagDialog(conv);
        break;
      case 'share':
        const html = window.ACMExport.generateShareHTML(conv);
        window.ACMExport.download(`${conv.title || 'share'}.html`, html, 'text/html');
        showToast('Share file downloaded');
        break;
      case 'analytics':
        showAnalytics(conv);
        break;
      case 'prompt-insert':
        showPromptPicker();
        break;
    }
  }

  // ========== Token Estimation ==========
  function estimateTokens(text) {
    // ~4 chars per token is a reasonable estimate
    return Math.ceil((text || '').length / 4);
  }

  function getAnalytics(conv) {
    let userTokens = 0, assistantTokens = 0;
    const messages = conv.messages || [];
    messages.forEach(m => {
      const tokens = estimateTokens(m.text);
      if (m.role === 'user') userTokens += tokens;
      else assistantTokens += tokens;
    });

    // Simple topic extraction: most common significant words
    const wordFreq = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'how', 'if', 'then', 'than', 'just', 'also', 'about', 'up', 'out', 'all', 'there', 'some']);
    messages.forEach(m => {
      (m.text || '').toLowerCase().split(/\W+/).forEach(w => {
        if (w.length > 3 && !stopWords.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });
    });
    const topics = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);

    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      userTokens,
      assistantTokens,
      totalTokens: userTokens + assistantTokens,
      topics
    };
  }

  // ========== UI Overlays ==========
  function showToast(msg) {
    const existing = document.querySelector('.acm-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'acm-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function showProModal() {
    const overlay = document.createElement('div');
    overlay.className = 'acm-overlay';
    overlay.innerHTML = `
      <div class="acm-modal">
        <h2>⚡ Upgrade to Pro</h2>
        <p>Unlock folders, tags, prompt library, analytics, and sharing.</p>
        <p class="acm-price">$9.99/month</p>
        <div class="acm-modal-actions">
          <button class="acm-btn-primary" id="acm-upgrade">Upgrade Now</button>
          <button class="acm-btn-secondary" id="acm-trial">Start 3-Day Trial</button>
          <button class="acm-btn-text" id="acm-dismiss">Maybe Later</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#acm-upgrade').onclick = () => {
      chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
      overlay.remove();
    };
    overlay.querySelector('#acm-trial').onclick = () => {
      chrome.runtime.sendMessage({ type: 'OPEN_TRIAL' });
      overlay.remove();
    };
    overlay.querySelector('#acm-dismiss').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  function showTagDialog(conv) {
    const overlay = document.createElement('div');
    overlay.className = 'acm-overlay';
    overlay.innerHTML = `
      <div class="acm-modal">
        <h2>🏷️ Manage Tags</h2>
        <div class="acm-tags-list">${(conv.tags || []).map(t => `<span class="acm-tag">${t} <span class="acm-tag-remove" data-tag="${t}">×</span></span>`).join('')}</div>
        <input type="text" id="acm-tag-input" placeholder="Add tag and press Enter" class="acm-input" />
        <button class="acm-btn-text" id="acm-tag-close">Done</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#acm-tag-input');
    const tagsList = overlay.querySelector('.acm-tags-list');

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const tag = input.value.trim();
        if (!conv.tags) conv.tags = [];
        if (!conv.tags.includes(tag)) {
          conv.tags.push(tag);
          await window.acmDB.saveConversation(conv);
          tagsList.innerHTML += `<span class="acm-tag">${tag} <span class="acm-tag-remove" data-tag="${tag}">×</span></span>`;
        }
        input.value = '';
      }
    });

    tagsList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('acm-tag-remove')) {
        const tag = e.target.dataset.tag;
        conv.tags = (conv.tags || []).filter(t => t !== tag);
        await window.acmDB.saveConversation(conv);
        e.target.parentElement.remove();
      }
    });

    overlay.querySelector('#acm-tag-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  function showAnalytics(conv) {
    const stats = getAnalytics(conv);
    const overlay = document.createElement('div');
    overlay.className = 'acm-overlay';
    overlay.innerHTML = `
      <div class="acm-modal acm-analytics">
        <h2>📊 Conversation Analytics</h2>
        <div class="acm-stats-grid">
          <div class="acm-stat"><span class="acm-stat-value">${stats.totalMessages}</span><span class="acm-stat-label">Messages</span></div>
          <div class="acm-stat"><span class="acm-stat-value">${stats.totalTokens.toLocaleString()}</span><span class="acm-stat-label">Est. Tokens</span></div>
          <div class="acm-stat"><span class="acm-stat-value">${stats.userTokens.toLocaleString()}</span><span class="acm-stat-label">Your Tokens</span></div>
          <div class="acm-stat"><span class="acm-stat-value">${stats.assistantTokens.toLocaleString()}</span><span class="acm-stat-label">AI Tokens</span></div>
        </div>
        <div class="acm-topics">
          <h3>Key Topics</h3>
          <div class="acm-topic-pills">${stats.topics.map(t => `<span class="acm-pill">${t}</span>`).join('')}</div>
        </div>
        <button class="acm-btn-text" id="acm-analytics-close">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#acm-analytics-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  async function showPromptPicker() {
    const prompts = await window.acmDB.getAllPrompts();
    const overlay = document.createElement('div');
    overlay.className = 'acm-overlay';
    overlay.innerHTML = `
      <div class="acm-modal">
        <h2>⚡ Prompt Library</h2>
        ${prompts.length === 0 ? '<p class="acm-empty">No saved prompts yet. Add prompts from the extension popup.</p>' : ''}
        <div class="acm-prompt-list">
          ${prompts.map(p => `
            <div class="acm-prompt-item" data-id="${p.id}">
              <strong>${p.name}</strong>
              <p>${p.text.substring(0, 100)}${p.text.length > 100 ? '...' : ''}</p>
              <button class="acm-btn-small acm-insert-prompt" data-id="${p.id}">Insert</button>
            </div>
          `).join('')}
        </div>
        <button class="acm-btn-text" id="acm-prompt-close">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.acm-insert-prompt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prompt = prompts.find(p => p.id === btn.dataset.id);
        if (prompt) {
          const input = adapter.getInputBox();
          if (input) {
            if (input.tagName === 'TEXTAREA') {
              input.value = prompt.text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              // contenteditable (Claude)
              input.textContent = prompt.text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            showToast('Prompt inserted!');
            overlay.remove();
          }
        }
      });
    });

    overlay.querySelector('#acm-prompt-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  // ========== Message Listener ==========
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_CONVERSATION') {
      scrapeAndIndex().then(conv => sendResponse({ conv }));
      return true;
    }
    if (msg.type === 'GET_SIDEBAR') {
      const items = adapter.getSidebarConversations();
      sendResponse({ items });
    }
    if (msg.type === 'INSERT_PROMPT') {
      const input = adapter.getInputBox();
      if (input) {
        if (input.tagName === 'TEXTAREA') {
          input.value = msg.text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          input.textContent = msg.text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'Input not found' });
      }
    }
  });

  // ========== Init ==========
  function init() {
    createFAB();
    // Index on load
    setTimeout(() => {
      scrapeAndIndex();
      indexSidebar();
    }, 2000);

    // Re-index on URL change (SPA navigation)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => scrapeAndIndex(), 1500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
