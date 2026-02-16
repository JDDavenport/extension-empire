const extpay = ExtPay('color-picker-pro');
extpay.startBackground();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SAVE_COLOR') {
    chrome.storage.local.get({ colors: [] }, data => {
      const colors = data.colors;
      colors.unshift({ hex: msg.hex, rgb: msg.rgb, hsl: msg.hsl, date: Date.now() });
      if (colors.length > 50) colors.length = 50;
      chrome.storage.local.set({ colors });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === 'GET_COLORS') {
    chrome.storage.local.get({ colors: [] }, data => sendResponse(data.colors));
    return true;
  }
  if (msg.type === 'CLEAR_COLORS') {
    chrome.storage.local.set({ colors: [] });
    sendResponse({ ok: true });
  }
});
