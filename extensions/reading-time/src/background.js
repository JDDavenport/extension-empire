const extpay = ExtPay('reading-time');
extpay.startBackground();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_BADGE') {
    chrome.action.setBadgeText({ text: msg.text, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: sender.tab.id });
  }
  if (msg.type === 'GET_SETTINGS') {
    chrome.storage.local.get({ wpm: 238, showBadge: true }, data => sendResponse(data));
    return true;
  }
  if (msg.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ wpm: msg.wpm, showBadge: msg.showBadge });
    sendResponse({ ok: true });
  }
});
