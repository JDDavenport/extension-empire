/* ExtensionPay.js stub — replace with real ExtPay.js from https://extensionpay.com */
function ExtPay(extensionId) {
  const STORAGE_KEY = 'extpay_user_' + extensionId;

  return {
    startBackground() {
      console.log('[ExtPay] Background started for:', extensionId);
    },
    async getUser() {
      const data = await chrome.storage.sync.get(STORAGE_KEY);
      return data[STORAGE_KEY] || { paid: false, paidAt: null, installedAt: Date.now(), trialDaysRemaining: 0 };
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/extension/${extensionId}` });
    },
    openTrialPage(days) {
      chrome.tabs.create({ url: `https://extensionpay.com/extension/${extensionId}` });
    },
    onPaid: { addListener(fn) {} },
    onTrialStarted: { addListener(fn) {} }
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
