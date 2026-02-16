// Track which tabs have copy-paste pro enabled
const enabledTabs = new Set();

// Update badge for a tab
function updateBadge(tabId, enabled) {
  const text = enabled ? 'ON' : '';
  const color = enabled ? '#22c55e' : '#64748b';
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// Toggle copy-paste pro on a tab
async function toggle(tabId) {
  const wasEnabled = enabledTabs.has(tabId);

  if (wasEnabled) {
    // Disable — inject cleanup
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: disableCopyPastePro
      });
    } catch (e) {
      console.warn('Could not disable on tab', tabId, e);
    }
    enabledTabs.delete(tabId);
    updateBadge(tabId, false);
    return false;
  } else {
    // Enable — inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (e) {
      console.warn('Could not enable on tab', tabId, e);
      return false;
    }
    enabledTabs.add(tabId);
    updateBadge(tabId, true);
    return true;
  }
}

function disableCopyPastePro() {
  // Remove our injected style
  const style = document.getElementById('copy-paste-pro-style');
  if (style) style.remove();

  // Restore inline styles we modified
  document.querySelectorAll('[data-cpp-original-style]').forEach(el => {
    el.style.userSelect = el.getAttribute('data-cpp-original-style') || '';
    el.style.webkitUserSelect = el.getAttribute('data-cpp-original-style') || '';
    el.removeAttribute('data-cpp-original-style');
  });

  // Signal content script to stop
  window.__copyPasteProActive = false;
}

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-copy-paste') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const enabled = await toggle(tab.id);
      // Notify popup if open
      chrome.runtime.sendMessage({ type: 'stateChanged', tabId: tab.id, enabled }).catch(() => {});
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'toggle') {
    toggle(msg.tabId).then(enabled => sendResponse({ enabled }));
    return true;
  }
  if (msg.type === 'getState') {
    sendResponse({ enabled: enabledTabs.has(msg.tabId) });
    return true;
  }
});

// Clean up when tab is closed or navigated
chrome.tabs.onRemoved.addListener((tabId) => {
  enabledTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    enabledTabs.delete(tabId);
    updateBadge(tabId, false);
  }
});
