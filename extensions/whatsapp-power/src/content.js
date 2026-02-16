// WAPower — Content Script for WhatsApp Web
// Handles: template panel, quick replies, chat labels, unread counter
(() => {
  'use strict';

  // =========================================================================
  // CONFIG
  // =========================================================================
  const LABELS = [
    { id: 'lead',      name: 'Lead',      color: '#2196F3' },
    { id: 'customer',  name: 'Customer',  color: '#4CAF50' },
    { id: 'vip',       name: 'VIP',       color: '#FFB300' },
    { id: 'followup',  name: 'Follow-up', color: '#FF9800' },
    { id: 'custom',    name: 'Custom',    color: '#9E9E9E' },
  ];

  let templates = [];
  let chatLabels = {}; // { chatId: labelId }
  let panelOpen = false;

  // =========================================================================
  // STORAGE
  // =========================================================================
  function loadData(cb) {
    chrome.storage.local.get(['templates', 'chatLabels'], (d) => {
      templates = d.templates || [];
      chatLabels = d.chatLabels || {};
      if (cb) cb();
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.templates) templates = changes.templates.newValue || [];
    if (changes.chatLabels) chatLabels = changes.chatLabels.newValue || {};
    refreshTemplatePanel();
    injectLabelsOnChats();
  });

  // =========================================================================
  // TOAST
  // =========================================================================
  let toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'wap-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // =========================================================================
  // TEMPLATE PANEL (floating near message input)
  // =========================================================================
  let tplBtn, tplPanel;

  function injectTemplateButton() {
    if (document.querySelector('.wap-tpl-btn')) return;

    // WhatsApp's message input footer area — look for the toolbar with attach/emoji buttons
    const footer = document.querySelector('footer') || document.querySelector('[data-testid="conversation-compose-box-input"]')?.closest('div[class]')?.parentElement?.parentElement;
    if (!footer) return;

    // Find the icon row (emoji, attach, etc.)
    const iconRow = footer.querySelector('div[role="button"]')?.parentElement ||
                    footer.querySelector('button[aria-label]')?.parentElement;
    if (!iconRow) return;

    tplBtn = document.createElement('button');
    tplBtn.className = 'wap-tpl-btn';
    tplBtn.title = 'WAPower Templates';
    tplBtn.innerHTML = '⚡';
    tplBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });

    // Insert at the beginning of the icon row
    iconRow.insertBefore(tplBtn, iconRow.firstChild);

    // Create panel
    tplPanel = document.createElement('div');
    tplPanel.className = 'wap-tpl-panel';
    // Position relative to footer
    const footerParent = footer.closest('[tabindex]') || footer.parentElement;
    if (footerParent) {
      footerParent.style.position = 'relative';
      footerParent.appendChild(tplPanel);
    } else {
      footer.style.position = 'relative';
      footer.appendChild(tplPanel);
    }

    refreshTemplatePanel();
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    if (tplPanel) tplPanel.classList.toggle('open', panelOpen);
    if (tplBtn) tplBtn.classList.toggle('active', panelOpen);
  }

  function refreshTemplatePanel() {
    if (!tplPanel) return;
    let html = `<div class="wap-tpl-panel-header"><span>⚡ Templates</span><small>${templates.length}/5</small></div>`;
    if (templates.length === 0) {
      html += '<div class="wap-tpl-empty">No templates yet.<br>Add them in the extension popup.</div>';
    } else {
      templates.forEach((text, i) => {
        if (!text) return;
        html += `<div class="wap-tpl-row" data-tpl="${i}">
          <span class="shortcut">/t${i + 1}</span>
          <span class="text">${escHtml(text)}</span>
        </div>`;
      });
    }
    tplPanel.innerHTML = html;

    // Click to insert
    tplPanel.querySelectorAll('.wap-tpl-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = +row.dataset.tpl;
        insertTemplate(templates[idx]);
        togglePanel();
      });
    });
  }

  function insertTemplate(text) {
    if (!text) return;
    const input = getMessageInput();
    if (!input) { toast('Open a chat first'); return; }

    // WhatsApp uses contenteditable divs with React synthetic events
    input.focus();
    // Use execCommand for React compatibility
    document.execCommand('selectAll', false, null);
    // If there's existing text, just append
    const sel = window.getSelection();
    sel.collapseToEnd();
    document.execCommand('insertText', false, text);

    toast('Template inserted ⚡');
  }

  function getMessageInput() {
    return document.querySelector('[data-testid="conversation-compose-box-input"]') ||
           document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
           document.querySelector('footer div[contenteditable="true"]');
  }

  // =========================================================================
  // QUICK REPLIES (/t1, /t2, etc.)
  // =========================================================================
  function handleQuickReply(e) {
    const input = getMessageInput();
    if (!input || e.target !== input) return;

    // Only process on space or Enter after a /tN pattern
    if (e.key !== ' ' && e.key !== 'Enter') return;

    const text = input.textContent || input.innerText || '';
    const match = text.match(/\/t([1-5])\s*$/);
    if (!match) return;

    const idx = parseInt(match[1]) - 1;
    if (idx < 0 || idx >= templates.length || !templates[idx]) return;

    e.preventDefault();
    e.stopPropagation();

    // Replace the /tN with the template text
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, templates[idx]);

    toast(`Template /t${idx + 1} inserted ⚡`);
  }

  // =========================================================================
  // CHAT LABELS
  // =========================================================================
  let activePicker = null;

  function getChatId(chatRow) {
    // Try to extract a unique ID from the chat row
    // WhatsApp uses data-testid or aria attributes; fall back to chat name
    const titleEl = chatRow.querySelector('span[title]') ||
                    chatRow.querySelector('[data-testid="cell-frame-title"] span');
    return titleEl ? titleEl.getAttribute('title') || titleEl.textContent : null;
  }

  function injectLabelsOnChats() {
    const chatRows = document.querySelectorAll('[data-testid="cell-frame-container"]') ||
                     document.querySelectorAll('[role="listitem"]');

    chatRows.forEach((row) => {
      // Remove existing dots
      row.querySelectorAll('.wap-label-dot').forEach(d => d.remove());

      const chatId = getChatId(row);
      if (!chatId) return;

      const labelId = chatLabels[chatId];
      if (!labelId) return;

      const labelDef = LABELS.find(l => l.id === labelId);
      if (!labelDef) return;

      const dot = document.createElement('span');
      dot.className = 'wap-label-dot';
      dot.style.backgroundColor = labelDef.color;
      dot.title = labelDef.name;

      // Inject next to the chat title
      const titleContainer = row.querySelector('[data-testid="cell-frame-title"]') ||
                             row.querySelector('span[title]')?.parentElement;
      if (titleContainer) {
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.appendChild(dot);
      }
    });
  }

  function showLabelPicker(chatRow, x, y) {
    closeLabelPicker();
    const chatId = getChatId(chatRow);
    if (!chatId) return;

    const picker = document.createElement('div');
    picker.className = 'wap-label-picker';
    picker.style.left = x + 'px';
    picker.style.top = y + 'px';

    LABELS.forEach((l) => {
      const opt = document.createElement('div');
      opt.className = 'wap-label-opt';
      opt.innerHTML = `<span class="dot" style="background:${l.color}"></span>${l.name}`;
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        chatLabels[chatId] = l.id;
        chrome.storage.local.set({ chatLabels });
        injectLabelsOnChats();
        closeLabelPicker();
        toast(`Labeled "${chatId}" as ${l.name}`);
      });
      picker.appendChild(opt);
    });

    // Remove option
    if (chatLabels[chatId]) {
      const rem = document.createElement('div');
      rem.className = 'wap-label-opt remove';
      rem.innerHTML = '✕ Remove label';
      rem.addEventListener('click', (e) => {
        e.stopPropagation();
        delete chatLabels[chatId];
        chrome.storage.local.set({ chatLabels });
        injectLabelsOnChats();
        closeLabelPicker();
        toast('Label removed');
      });
      picker.appendChild(rem);
    }

    document.body.appendChild(picker);
    activePicker = picker;

    // Keep picker within viewport
    requestAnimationFrame(() => {
      const rect = picker.getBoundingClientRect();
      if (rect.right > window.innerWidth) picker.style.left = (window.innerWidth - rect.width - 8) + 'px';
      if (rect.bottom > window.innerHeight) picker.style.top = (window.innerHeight - rect.height - 8) + 'px';
    });
  }

  function closeLabelPicker() {
    if (activePicker) { activePicker.remove(); activePicker = null; }
  }

  function handleContextMenu(e) {
    // Find if right-click is on a chat row
    const chatRow = e.target.closest('[data-testid="cell-frame-container"]') ||
                    e.target.closest('[role="listitem"]');
    if (!chatRow) return;

    // Only intercept in the chat list sidebar
    const sidebar = document.querySelector('[data-testid="chat-list"]') ||
                    document.getElementById('pane-side');
    if (!sidebar || !sidebar.contains(chatRow)) return;

    e.preventDefault();
    showLabelPicker(chatRow, e.clientX, e.clientY);
  }

  // =========================================================================
  // UNREAD COUNTER
  // =========================================================================
  function countUnread() {
    let total = 0;
    const badges = document.querySelectorAll('[data-testid="icon-unread-count"]') ||
                   [];
    badges.forEach((badge) => {
      const n = parseInt(badge.textContent);
      if (!isNaN(n)) total += n;
    });

    // Also try aria-label based unread indicators
    if (total === 0) {
      document.querySelectorAll('span[aria-label*="unread message"]').forEach((el) => {
        const n = parseInt(el.textContent);
        if (!isNaN(n)) total += n;
      });
    }

    try {
      chrome.runtime.sendMessage({ type: 'unreadCount', count: total });
    } catch (_) { /* extension context invalidated */ }
  }

  // =========================================================================
  // MUTATION OBSERVER — react to DOM changes
  // =========================================================================
  let observerStarted = false;

  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver(() => {
      // Re-inject template button if needed (chat switch rebuilds footer)
      injectTemplateButton();
      // Re-apply labels
      injectLabelsOnChats();
      // Update unread count
      countUnread();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Throttle the MutationObserver callbacks
  let mutationTimer;
  function startThrottledObserver() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        injectTemplateButton();
        injectLabelsOnChats();
        countUnread();
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // =========================================================================
  // INIT
  // =========================================================================
  function init() {
    loadData(() => {
      injectTemplateButton();
      injectLabelsOnChats();
      countUnread();
    });

    // Events
    document.addEventListener('keydown', handleQuickReply, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('click', (e) => {
      if (activePicker && !activePicker.contains(e.target)) closeLabelPicker();
      if (panelOpen && tplPanel && !tplPanel.contains(e.target) && e.target !== tplBtn) {
        togglePanel();
      }
    });

    startThrottledObserver();
  }

  // Wait for WhatsApp to load
  function waitForApp() {
    const check = () => {
      const app = document.querySelector('#app') || document.querySelector('[data-testid="chat-list"]');
      if (app) {
        init();
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  }

  // --- Utility ---
  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  waitForApp();
})();
