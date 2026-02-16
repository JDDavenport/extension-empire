// background.js — Service worker for AI Chat Manager
importScripts('ExtPay.js');

const extpay = ExtPay('ai-chat-manager');
extpay.startBackground();

// Track pro status
let isPro = false;

extpay.getUser().then(user => {
  isPro = user.paid;
}).catch(() => {});

extpay.onPaid.addListener(user => {
  isPro = true;
  chrome.storage.local.set({ isPro: true });
});

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PRO_STATUS') {
    extpay.getUser().then(user => {
      isPro = user.paid;
      chrome.storage.local.set({ isPro });
      sendResponse({ isPro });
    }).catch(() => sendResponse({ isPro: false }));
    return true;
  }

  if (msg.type === 'OPEN_PAYMENT') {
    extpay.openPaymentPage();
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'OPEN_TRIAL') {
    extpay.openTrialPage('3-day').then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'CREATE_SHARE_LINK') {
    // Store shared conversation data as a data URL
    const html = msg.html;
    const blob = new Blob([html], { type: 'text/html' });
    const reader = new FileReader();
    reader.onloadend = () => {
      sendResponse({ url: reader.result });
    };
    reader.readAsDataURL(blob);
    return true;
  }
});

// Context menu for quick prompt insert
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isPro: false });
});
