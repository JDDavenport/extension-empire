/* ExtensionPay stub — replace with real ExtPay.js from https://extensionpay.com */
function ExtPay(extensionId) {
  return {
    startBackground() {},
    async getUser() { return { paid: false, email: '', installedAt: new Date() }; },
    openPaymentPage() { chrome.tabs.create({ url: `https://extensionpay.com/ext/${extensionId}` }); },
    onPaid: { addListener(cb) {} },
  };
}
if (typeof module !== 'undefined') module.exports = ExtPay;
