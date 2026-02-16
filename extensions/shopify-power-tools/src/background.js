// Background service worker
importScripts('ExtPay.js');

const extpay = ExtPay('shopify-power-tools');
extpay.startBackground();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkPro') {
    extpay.getUser().then(user => {
      sendResponse({ paid: user.paid });
    });
    return true;
  }
  if (msg.action === 'openPayment') {
    extpay.openPaymentPage();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    competitors: [],
    discountCodes: [],
    settings: {
      inlineEditEnabled: true,
      seoEnabled: true,
      imageOptimizerEnabled: true
    }
  });
});
