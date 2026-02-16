// ExtensionPay (https://extensionpay.com) — Stub loader
// Replace with full ExtPay.js from https://extensionpay.com/docs
function ExtPay(extensionId) {
  const baseUrl = 'https://extensionpay.com/api';
  let user = null;

  return {
    startBackground() {
      // Initialize payment checking in background
      chrome.storage.sync.get(['extpay_user'], (data) => {
        user = data.extpay_user || { paid: false, paidAt: null, installedAt: Date.now() };
      });
    },
    async getUser() {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['extpay_user'], (data) => {
          resolve(data.extpay_user || { paid: false, paidAt: null, installedAt: Date.now() });
        });
      });
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/pay/${extensionId}` });
    },
    openTrialPage(trialDays) {
      chrome.tabs.create({ url: `https://extensionpay.com/trial/${extensionId}?days=${trialDays}` });
    },
    onPaid: { addListener(cb) {} },
    onTrialStarted: { addListener(cb) {} }
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
