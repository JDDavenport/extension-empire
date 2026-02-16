/* FB Marketplace Pro — Background Service Worker */
importScripts('lib/ExtPay.js');
const extpay = ExtPay('fb-marketplace-pro');
extpay.startBackground();

// ── Alarms for price drop scheduler ──
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'price-drop-check') {
    await checkPriceDrops();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('price-drop-check', { periodInMinutes: 60 });
  // Init default storage
  chrome.storage.local.get('settings', (r) => {
    if (!r.settings) {
      chrome.storage.local.set({
        settings: {
          messageTemplates: [
            { name: 'Available', text: 'Hi! Yes, this item is still available. When would you like to pick it up?' },
            { name: 'Price Firm', text: 'Thanks for your interest! The price is firm at this time.' },
            { name: 'Sold', text: 'Sorry, this item has been sold. Thanks for your interest!' }
          ],
          priceDropRules: [],
          crossPostFormats: { craigslist: true, offerup: true }
        },
        salesHistory: [],
        listings: []
      });
    }
  });
});

// ── Message passing from content/popup ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkPro') {
    extpay.getUser().then(user => {
      sendResponse({ isPro: user.paid });
    });
    return true;
  }
  if (msg.action === 'openPayment') {
    extpay.openPaymentPage();
    return;
  }
  if (msg.action === 'getSalesStats') {
    chrome.storage.local.get('salesHistory', (r) => {
      const history = r.salesHistory || [];
      const total = history.reduce((s, i) => s + (i.price || 0), 0);
      const avg = history.length ? (history.reduce((s, i) => s + (i.daysToSell || 0), 0) / history.length) : 0;
      sendResponse({ count: history.length, revenue: total, avgDays: Math.round(avg * 10) / 10, items: history.slice(-50) });
    });
    return true;
  }
  if (msg.action === 'recordSale') {
    chrome.storage.local.get('salesHistory', (r) => {
      const history = r.salesHistory || [];
      history.push({ ...msg.data, date: Date.now() });
      chrome.storage.local.set({ salesHistory: history }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.action === 'getSettings') {
    chrome.storage.local.get('settings', (r) => sendResponse(r.settings || {}));
    return true;
  }
  if (msg.action === 'saveSettings') {
    chrome.storage.local.set({ settings: msg.data }, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === 'savePriceDropRules') {
    chrome.storage.local.get('settings', (r) => {
      const s = r.settings || {};
      s.priceDropRules = msg.rules;
      chrome.storage.local.set({ settings: s }, () => sendResponse({ ok: true }));
    });
    return true;
  }
});

async function checkPriceDrops() {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings?.priceDropRules?.length) return;
  const now = Date.now();
  for (const rule of settings.priceDropRules) {
    if (!rule.active) continue;
    const elapsed = (now - rule.createdAt) / (1000 * 60 * 60 * 24);
    if (elapsed >= rule.daysBeforeDrop && !rule.dropped) {
      rule.dropped = true;
      rule.newPrice = Math.round(rule.originalPrice * (1 - rule.dropPercent / 100) * 100) / 100;
      // Flag for content script to apply
      rule.pendingApply = true;
    }
  }
  settings.priceDropRules = settings.priceDropRules;
  await chrome.storage.local.set({ settings });
}
