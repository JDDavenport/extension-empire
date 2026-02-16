// ExtensionPay.js stub — replace with actual ExtPay from https://extensionpay.com
// This is a minimal implementation for development/testing
if (typeof importScripts !== 'undefined') {
  // Service worker context
  var ExtPay = function(extensionId) {
    return {
      startBackground: function() { console.log('ExtPay: background started for', extensionId); },
      getUser: function() {
        return new Promise(function(resolve) {
          chrome.storage.local.get('extpay_user', function(data) {
            resolve(data.extpay_user || { paid: false, paidAt: null, installedAt: new Date().toISOString() });
          });
        });
      },
      openPaymentPage: function() {
        chrome.tabs.create({ url: 'https://extensionpay.com/ext/' + extensionId });
      },
      onPaid: { addListener: function(cb) {} },
      openTrialPage: function() {},
      openLoginPage: function() {}
    };
  };
} else {
  // Content script / popup context
  window.ExtPay = function(extensionId) {
    return {
      getUser: function() {
        return new Promise(function(resolve) {
          chrome.storage.local.get('extpay_user', function(data) {
            resolve(data.extpay_user || { paid: false });
          });
        });
      },
      openPaymentPage: function() {
        chrome.runtime.sendMessage({ action: 'openPayment' });
      }
    };
  };
}
