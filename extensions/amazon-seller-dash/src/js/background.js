/* Amazon Seller Dashboard — Service Worker */
importScripts('lib/ExtPay.js');

const extpay = ExtPay('amazon-seller-dash');
extpay.startBackground();

// Set up alarms for periodic checks
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('inventory-check', { periodInMinutes: 60 });
  chrome.alarms.create('bsr-check', { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'inventory-check') {
    // Notify content script to check inventory
    chrome.tabs.query({ url: '*://sellercentral.amazon.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'check-inventory' }).catch(() => {});
      });
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'get-pro-status') {
    extpay.getUser().then(user => {
      sendResponse({ isPro: user.paid });
    }).catch(() => {
      sendResponse({ isPro: false });
    });
    return true;
  }

  if (msg.action === 'open-payment') {
    extpay.openPaymentPage();
  }

  if (msg.action === 'export-data') {
    // Handled in content script
  }
});

// Badge for alerts
async function updateBadge() {
  try {
    const data = await chrome.storage.local.get(['inventory_alerts']);
    const alerts = data.inventory_alerts || [];
    const count = alerts.length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: count > 0 ? '#ff1744' : '#00c853' });
  } catch(e) {}
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.inventory_alerts) updateBadge();
});

updateBadge();
