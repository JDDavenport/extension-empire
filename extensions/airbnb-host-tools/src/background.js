/* Airbnb Host Power Tools — Background Service Worker */

// ExtensionPay integration
importScripts('ExtPay.js');
const extpay = ExtPay('airbnb-host-tools');
extpay.startBackground();

// Default templates seeded on install
const DEFAULT_TEMPLATES = {
  messages: [
    {
      id: 'checkin-1',
      name: 'Check-in Instructions',
      category: 'check-in',
      body: `Hi {guest_name}! 👋

Welcome to {listing_name}! Here are your check-in details:

🔑 **Access:** {access_instructions}
📍 **Address:** {address}
🕐 **Check-in:** {checkin_time}
🕐 **Check-out:** {checkout_time}

**WiFi:** {wifi_name} / {wifi_password}

Let me know if you need anything. Enjoy your stay!`
    },
    {
      id: 'rules-1',
      name: 'House Rules Reminder',
      category: 'rules',
      body: `Hi {guest_name},

Just a few friendly reminders for your stay:

🚭 No smoking inside the property
🐾 No pets (unless pre-approved)
🔇 Quiet hours: 10 PM – 8 AM
🗑️ Please take out trash before checkout
🔑 Lock all doors when leaving

Thanks for being a great guest!`
    },
    {
      id: 'directions-1',
      name: 'Directions & Parking',
      category: 'directions',
      body: `Hi {guest_name},

Here are directions to {listing_name}:

📍 **Address:** {address}
🚗 **Parking:** {parking_instructions}
🚌 **Public Transit:** {transit_info}

**Landmarks to look for:** {landmarks}

Safe travels! 🚗`
    },
    {
      id: 'checkout-1',
      name: 'Checkout Reminder',
      category: 'checkout',
      body: `Hi {guest_name},

Just a reminder that checkout is at {checkout_time} tomorrow.

Before you go:
✅ Strip bed linens and leave in hamper
✅ Load dishwasher / hand wash dishes
✅ Take out trash
✅ Lock all doors and windows
✅ Leave keys {key_return_instructions}

Thank you for staying with us! We'd love a review if you enjoyed your stay ⭐

Safe travels!`
    }
  ],
  reviews: [
    {
      id: 'review-positive',
      name: 'Positive Review Response',
      body: `Thank you so much, {guest_name}! 🙏 We loved hosting you and are thrilled you enjoyed your stay at {listing_name}. You were a wonderful guest — welcome back anytime!`
    },
    {
      id: 'review-neutral',
      name: 'Neutral/Constructive Response',
      body: `Thank you for your feedback, {guest_name}. We appreciate you staying at {listing_name} and taking the time to share your experience. We're always looking to improve, and your input helps us do that. We hope to welcome you back in the future!`
    },
    {
      id: 'review-issue',
      name: 'Issue Acknowledgment Response',
      body: `Thank you for your honest feedback, {guest_name}. We're sorry about {issue}. We've already taken steps to address this and want every guest to have an excellent experience. We appreciate your understanding and hope you'll give us another chance in the future.`
    }
  ],
  autoResponses: [],
  variables: {
    listing_name: '',
    address: '',
    access_instructions: '',
    checkin_time: '3:00 PM',
    checkout_time: '11:00 AM',
    wifi_name: '',
    wifi_password: '',
    parking_instructions: '',
    transit_info: '',
    landmarks: '',
    key_return_instructions: ''
  }
};

// Install handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.sync.get('templates');
    if (!existing.templates) {
      await chrome.storage.sync.set({ templates: DEFAULT_TEMPLATES });
    }
    await chrome.storage.local.set({
      stats: { totalMessagesSent: 0, totalReviewsResponded: 0, installDate: Date.now() }
    });
  }
});

// Message handler for content script communication
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getTemplates') {
    chrome.storage.sync.get('templates', (data) => {
      sendResponse(data.templates || DEFAULT_TEMPLATES);
    });
    return true;
  }

  if (msg.action === 'saveTemplates') {
    chrome.storage.sync.set({ templates: msg.templates }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.action === 'getProStatus') {
    extpay.getUser().then(user => {
      sendResponse({ paid: user.paid });
    }).catch(() => {
      sendResponse({ paid: false });
    });
    return true;
  }

  if (msg.action === 'openPaymentPage') {
    extpay.openPaymentPage();
    sendResponse({ success: true });
    return true;
  }

  if (msg.action === 'trackStat') {
    chrome.storage.local.get('stats', (data) => {
      const stats = data.stats || {};
      if (msg.stat === 'messageSent') {
        stats.totalMessagesSent = (stats.totalMessagesSent || 0) + 1;
      } else if (msg.stat === 'reviewResponded') {
        stats.totalReviewsResponded = (stats.totalReviewsResponded || 0) + 1;
      }
      chrome.storage.local.set({ stats });
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.action === 'getStats') {
    chrome.storage.local.get('stats', (data) => {
      sendResponse(data.stats || {});
    });
    return true;
  }

  if (msg.action === 'getPricingComps') {
    // Fetch nearby listings for pricing comparison
    fetchPricingComps(msg.location, msg.price).then(comps => {
      sendResponse({ comps });
    }).catch(err => {
      sendResponse({ comps: [], error: err.message });
    });
    return true;
  }
});

// Fetch comparable listings from Airbnb search (client-side scraping approach)
async function fetchPricingComps(location, currentPrice) {
  try {
    const searchUrl = `https://www.airbnb.com/s/${encodeURIComponent(location)}/homes?price_min=${Math.floor(currentPrice * 0.5)}&price_max=${Math.ceil(currentPrice * 2)}`;
    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'text/html' }
    });
    const html = await response.text();

    // Extract pricing data from search results using regex patterns
    const pricePattern = /\$(\d+)\s*(?:night|\/night)/g;
    const prices = [];
    let match;
    while ((match = pricePattern.exec(html)) !== null && prices.length < 20) {
      prices.push(parseInt(match[1]));
    }

    if (prices.length === 0) return [];

    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return [{
      avgPrice: avg,
      medianPrice: median,
      minPrice: min,
      maxPrice: max,
      sampleSize: prices.length,
      yourPrice: currentPrice,
      percentile: Math.round((sorted.filter(p => p <= currentPrice).length / sorted.length) * 100)
    }];
  } catch (e) {
    return [];
  }
}
