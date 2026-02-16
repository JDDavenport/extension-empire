const extpay = ExtPay('price-tracker-lite');
extpay.startBackground();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PRICE_DETECTED') {
    savePrice(msg.url, msg.price, msg.title).then(() => {
      updateBadge(msg.price, msg.url);
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === 'GET_HISTORY') {
    getHistory(msg.url).then(h => sendResponse(h));
    return true;
  }
  if (msg.type === 'GET_ALL_TRACKED') {
    chrome.storage.local.get(null, data => {
      const items = Object.entries(data)
        .filter(([k]) => k.startsWith('pt_'))
        .map(([k, v]) => ({ url: k.slice(3), ...v }));
      sendResponse(items);
    });
    return true;
  }
});

async function savePrice(url, price, title) {
  const key = 'pt_' + url;
  const data = await chrome.storage.local.get(key);
  const entry = data[key] || { title, prices: [] };
  entry.title = title || entry.title;
  entry.prices.push({ date: Date.now(), price });
  if (entry.prices.length > 90) entry.prices = entry.prices.slice(-90);
  await chrome.storage.local.set({ [key]: entry });
}

async function getHistory(url) {
  const key = 'pt_' + url;
  const data = await chrome.storage.local.get(key);
  return data[key] || { title: '', prices: [] };
}

async function updateBadge(currentPrice, url) {
  const history = await getHistory(url);
  if (history.prices.length > 1) {
    const prev = history.prices[history.prices.length - 2].price;
    if (currentPrice < prev) {
      chrome.action.setBadgeText({ text: '↓' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else if (currentPrice > prev) {
      chrome.action.setBadgeText({ text: '↑' });
      chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}
