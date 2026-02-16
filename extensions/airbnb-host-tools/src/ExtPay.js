/* ExtensionPay.js stub — replace with real ExtPay.js from https://extensionpay.com */
/* This stub allows the extension to load in dev mode without the real ExtPay SDK */

function ExtPay(extensionId) {
  let user = { paid: false, paidAt: null, installedAt: new Date() };

  return {
    startBackground() {
      console.log(`[ExtPay] Started for ${extensionId} (dev stub)`);
    },
    async getUser() {
      const stored = await chrome.storage.local.get('extpay_user');
      if (stored.extpay_user) return stored.extpay_user;
      return user;
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/pay/${extensionId}` });
    },
    openTrialPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/trial/${extensionId}` });
    },
    onPaid: { addListener(fn) { /* stub */ } },
    onTrialStarted: { addListener(fn) { /* stub */ } }
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
