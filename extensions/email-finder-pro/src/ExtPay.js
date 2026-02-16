/* ExtensionPay.js — https://extensionpay.com
   Include the real ExtPay.js from: https://unpkg.com/extpay/dist/ExtPay.js
   This is a placeholder that should be replaced with the actual library before publishing. */

function ExtPay(extensionId) {
  const EXTPAY_API = 'https://extensionpay.com/api';

  let user = null;

  async function fetchUser() {
    try {
      const resp = await fetch(`${EXTPAY_API}/user?ext=${extensionId}`, {
        credentials: 'include'
      });
      if (resp.ok) user = await resp.json();
    } catch (e) {}
    return user || { paid: false, email: null, trialStartedAt: null };
  }

  return {
    startBackground() {
      // Initialize payment checking
      fetchUser();
      // Re-check every 30 min
      setInterval(fetchUser, 30 * 60 * 1000);
    },
    async getUser() {
      return await fetchUser();
    },
    openPaymentPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/pay/${extensionId}` });
    },
    openTrialPage() {
      chrome.tabs.create({ url: `https://extensionpay.com/trial/${extensionId}` });
    },
    onPaid: { addListener(cb) {} },
    onTrialStarted: { addListener(cb) {} },
  };
}

if (typeof module !== 'undefined') module.exports = ExtPay;
