/* TikTok Shop Seller Tools — Background Service Worker */

// ─── Default Data ───
const DEFAULT_TEMPLATES = [
  { id: '1', name: 'Order Status', text: 'Hi! Your order has been shipped and is on its way. You can track it using the tracking number in your order details. Let me know if you need anything else! 📦', free: true },
  { id: '2', name: 'Thank You', text: 'Thank you so much for your purchase! We really appreciate your support. If you love the product, a 5-star review would mean the world to us! ⭐', free: true },
  { id: '3', name: 'Return Policy', text: 'We accept returns within 30 days of delivery. Please make sure the item is in its original condition. To start a return, go to your order and select "Request Return". Happy to help! 🔄', free: true },
  { id: '4', name: 'Out of Stock', text: 'Thanks for your interest! This item is temporarily out of stock but we\'re restocking soon. Follow our shop to get notified when it\'s back! 🔔', free: false },
  { id: '5', name: 'Discount Offer', text: 'Thanks for reaching out! Here\'s a special 10% discount code just for you: THANKS10. Use it on your next order! 🎉', free: false },
];

const DEFAULT_SETTINGS = {
  dashboardEnabled: true,
  inventoryThreshold: 10,
  notificationsEnabled: true,
  dashboardPosition: { x: 20, y: 80 },
  isPro: false,
};

// ─── Install / Startup ───
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      templates: DEFAULT_TEMPLATES,
      settings: DEFAULT_SETTINGS,
      salesHistory: [],
      inventoryAlerts: [],
      competitors: [],
    });
  }
});

// ─── Inventory Alert Alarm ───
chrome.alarms.create('inventoryCheck', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'inventoryCheck') {
    const { settings, inventoryAlerts } = await chrome.storage.local.get(['settings', 'inventoryAlerts']);
    if (!settings?.notificationsEnabled || !inventoryAlerts?.length) return;

    const lowStock = inventoryAlerts.filter(i => i.stock <= (settings.inventoryThreshold || 10));
    if (lowStock.length > 0) {
      chrome.notifications.create('lowStock', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'TikTok Shop — Low Stock Alert',
        message: `${lowStock.length} product(s) are running low on stock!`,
      });
    }
  }
});

// ─── Message Handler ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getTemplates') {
    chrome.storage.local.get(['templates', 'settings'], (data) => {
      const templates = data.templates || DEFAULT_TEMPLATES;
      const isPro = data.settings?.isPro || false;
      sendResponse({ templates: isPro ? templates : templates.filter(t => t.free), isPro });
    });
    return true;
  }

  if (msg.action === 'saveTemplates') {
    chrome.storage.local.set({ templates: msg.templates }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === 'getSettings') {
    chrome.storage.local.get('settings', (data) => sendResponse(data.settings || DEFAULT_SETTINGS));
    return true;
  }

  if (msg.action === 'saveSettings') {
    chrome.storage.local.set({ settings: msg.settings }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === 'saveSalesSnapshot') {
    chrome.storage.local.get('salesHistory', (data) => {
      const history = data.salesHistory || [];
      history.push({ ...msg.snapshot, timestamp: Date.now() });
      // Keep last 90 days
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const trimmed = history.filter(h => h.timestamp > cutoff);
      chrome.storage.local.set({ salesHistory: trimmed }, () => sendResponse({ ok: true }));
    });
    return true;
  }

  if (msg.action === 'getSalesHistory') {
    chrome.storage.local.get('salesHistory', (data) => sendResponse(data.salesHistory || []));
    return true;
  }

  if (msg.action === 'saveInventory') {
    chrome.storage.local.set({ inventoryAlerts: msg.inventory }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === 'getInventory') {
    chrome.storage.local.get('inventoryAlerts', (data) => sendResponse(data.inventoryAlerts || []));
    return true;
  }

  if (msg.action === 'exportCSV') {
    // Handled in content script / popup
    sendResponse({ ok: true });
    return true;
  }
});
