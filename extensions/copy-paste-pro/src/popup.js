document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const statusCard = document.getElementById('statusCard');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // Check if we can run on this tab
  const isRestricted = tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:');

  if (isRestricted) {
    statusText.textContent = 'Not available';
    toggle.disabled = true;
    return;
  }

  // Get current state
  chrome.runtime.sendMessage({ type: 'getState', tabId: tab.id }, (response) => {
    if (response?.enabled) {
      toggle.checked = true;
      statusText.textContent = 'Active';
      statusCard.classList.add('active');
    }
  });

  // Handle toggle
  toggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'toggle', tabId: tab.id }, (response) => {
      if (response?.enabled) {
        statusText.textContent = 'Active';
        statusCard.classList.add('active');
      } else {
        statusText.textContent = 'Disabled';
        statusCard.classList.remove('active');
      }
    });
  });

  // Listen for external state changes (keyboard shortcut)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'stateChanged' && msg.tabId === tab.id) {
      toggle.checked = msg.enabled;
      statusText.textContent = msg.enabled ? 'Active' : 'Disabled';
      statusCard.classList.toggle('active', msg.enabled);
    }
  });
});
