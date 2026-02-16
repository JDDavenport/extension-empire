// ExtPay.js — ExtensionPay wrapper
// Replace this file with the real ExtPay.js from https://extensionpay.com
// This is a functional stub for development/testing

function ExtPay(extensionId) {
  const listeners = { onPaid: [] };

  return {
    startBackground() {
      // In production, this initializes ExtensionPay
      console.log(`[ExtPay] Initialized for: ${extensionId}`);
    },
    async getUser() {
      // Check local cache first
      const data = await chrome.storage.local.get('extpay_user');
      return data.extpay_user || { paid: false, paidAt: null, installedAt: Date.now() };
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/pay/${extensionId}` });
    },
    async openTrialPage(trialPeriod) {
      chrome.tabs.create({ url: `https://extensionpay.com/trial/${extensionId}?period=${trialPeriod}` });
    },
    onPaid: {
      addListener(fn) { listeners.onPaid.push(fn); }
    },
    onTrialStarted: {
      addListener(fn) {}
    }
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
