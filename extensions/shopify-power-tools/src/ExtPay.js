// ExtensionPay stub — replace with https://extensionpay.com/js/ExtPay.js for production
function ExtPay(id) {
  return {
    startBackground() {},
    async getUser() {
      return new Promise(resolve => {
        chrome.storage.local.get('_extpay_user', d => {
          resolve(d._extpay_user || { paid: false, paidAt: null, installedAt: Date.now() });
        });
      });
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/ext/${id}` });
    },
    openTrialPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/ext/${id}` });
    },
    onPaid: { addListener(fn) {} },
    onTrialStarted: { addListener(fn) {} },
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
