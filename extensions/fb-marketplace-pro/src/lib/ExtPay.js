/* ExtensionPay.js - https://extensionpay.com */
/* Include the real ExtPay.js from https://extensionpay.com/dist/ExtPay.js before publishing */
function ExtPay(extensionId) {
  const EXTPAY_API = 'https://extensionpay.com/api';
  let cachedUser = null;
  return {
    startBackground() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          if (msg.__extpay === 'getUser') {
            this.getUser().then(u => sendResponse(u));
            return true;
          }
        });
      }
    },
    async getUser() {
      if (cachedUser) return cachedUser;
      try {
        const { extpayUser } = await chrome.storage.sync.get('extpayUser');
        cachedUser = extpayUser || { paid: false, email: null, installedAt: Date.now() };
      } catch(e) {
        cachedUser = { paid: false, email: null, installedAt: Date.now() };
      }
      return cachedUser;
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `${EXTPAY_API}/payment?ext=${extensionId}` });
    },
    openTrialPage() {
      chrome.tabs.create({ url: `${EXTPAY_API}/trial?ext=${extensionId}` });
    },
    onPaid: { addListener(cb) {} },
    onTrialStarted: { addListener(cb) {} }
  };
}
if (typeof module !== 'undefined') module.exports = ExtPay;
