const extpay = ExtPay('quick-notes');
extpay.startBackground();

chrome.action.onClicked.addListener(async (tab) => {
  // Handled by popup
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SAVE_NOTE') {
    const key = 'qn_' + msg.url;
    chrome.storage.local.set({ [key]: { text: msg.text, x: msg.x, y: msg.y, color: msg.color, updated: Date.now() } });
    sendResponse({ ok: true });
  }
  if (msg.type === 'GET_NOTE') {
    const key = 'qn_' + msg.url;
    chrome.storage.local.get(key, data => sendResponse(data[key] || null));
    return true;
  }
  if (msg.type === 'GET_ALL_NOTES') {
    chrome.storage.local.get(null, data => {
      const notes = Object.entries(data)
        .filter(([k]) => k.startsWith('qn_'))
        .map(([k, v]) => ({ url: k.slice(3), ...v }));
      sendResponse(notes);
    });
    return true;
  }
  if (msg.type === 'DELETE_NOTE') {
    chrome.storage.local.remove('qn_' + msg.url);
    sendResponse({ ok: true });
  }
});
