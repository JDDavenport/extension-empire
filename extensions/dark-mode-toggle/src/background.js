const extpay = ExtPay('dark-mode-toggle');
extpay.startBackground();

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-dark') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) toggleDark(tab);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOGGLE_DARK') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) toggleDark(tab).then(state => sendResponse(state));
    });
    return true;
  }
  if (msg.type === 'GET_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return sendResponse({ enabled: false });
      const host = new URL(tab.url).hostname;
      chrome.storage.local.get({ darkSites: {} }, data => {
        sendResponse({ enabled: !!data.darkSites[host] });
      });
    });
    return true;
  }
});

async function toggleDark(tab) {
  const host = new URL(tab.url).hostname;
  const data = await chrome.storage.local.get({ darkSites: {} });
  const sites = data.darkSites;
  const isEnabled = !sites[host];
  
  if (isEnabled) {
    sites[host] = true;
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } else {
    delete sites[host];
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { const el = document.getElementById('dm-style'); if (el) el.remove(); }
    });
  }
  
  await chrome.storage.local.set({ darkSites: sites });
  chrome.action.setBadgeText({ text: isEnabled ? 'ON' : '', tabId: tab.id });
  chrome.action.setBadgeBackgroundColor({ color: '#666', tabId: tab.id });
  return { enabled: isEnabled };
}
