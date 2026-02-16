// WAPower — Service Worker (badge counter + messaging hub)

// --- Badge counter ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'unreadCount') {
    updateBadge(msg.count);
  }
  if (msg.type === 'badgeToggle') {
    if (!msg.enabled) {
      chrome.action.setBadgeText({ text: '' });
    }
  }
  sendResponse({ ok: true });
});

function updateBadge(count) {
  chrome.storage.local.get('badgeEnabled', (d) => {
    if (d.badgeEnabled === false) return;
    const text = count > 0 ? (count > 99 ? '99+' : String(count)) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#00a884' });
  });
}

// Clear badge when no WhatsApp tabs
chrome.tabs.onRemoved.addListener(() => {
  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    if (tabs.length === 0) {
      chrome.action.setBadgeText({ text: '' });
    }
  });
});

// --- ExtensionPay placeholder ---
// import ExtPay from 'ExtPay';
// const extpay = ExtPay('wapower');
// extpay.startBackground();
