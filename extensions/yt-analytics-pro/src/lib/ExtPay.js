// ExtensionPay stub — replace with actual ExtPay.js from https://extensionpay.com
// This is a development stub that mimics the ExtPay API
function ExtPay(extensionId) {
  const listeners = { paid: [], trial: [] };
  let _user = {
    paid: false,
    paidAt: null,
    installedAt: new Date(),
    trialStartedAt: null,
  };

  // Try to load saved state
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('extpay_user', (data) => {
      if (data.extpay_user) _user = { ..._user, ...data.extpay_user };
    });
  }

  return {
    startBackground() {
      // In production, ExtPay handles background messaging
      console.log(`[ExtPay] Background started for ${extensionId}`);
    },

    async getUser() {
      return { ..._user };
    },

    async openPaymentPage() {
      // In production, opens ExtensionPay payment page
      const url = `https://extensionpay.com/ext/${extensionId}`;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    },

    async openTrialPage(trialDays) {
      const url = `https://extensionpay.com/ext/${extensionId}?trial=${trialDays}`;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    },

    async openLoginPage() {
      const url = `https://extensionpay.com/ext/${extensionId}/login`;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    },

    onPaid: {
      addListener(fn) { listeners.paid.push(fn); }
    },

    onTrialStarted: {
      addListener(fn) { listeners.trial.push(fn); }
    }
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
