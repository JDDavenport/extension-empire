/* Etsy Seller Power Tools — Background Service Worker */
importScripts('lib/ExtPay.js');

const extpay = ExtPay('etsy-seller-tools');
extpay.startBackground();

// ── Constants ──
const FREE_COMPETITOR_LIMIT = 3;
const PRO_PRICE = '$14.99/mo';

// ── Installation ──
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      competitorLookupsToday: 0,
      competitorLookupDate: new Date().toDateString(),
      reviewTemplates: DEFAULT_TEMPLATES,
      settings: { notifications: true, renewalAlertDays: 7 }
    });
    chrome.alarms.create('dailyReset', { periodInMinutes: 1440 });
    chrome.alarms.create('renewalCheck', { periodInMinutes: 360 });
  }
});

// ── Alarms ──
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    chrome.storage.local.set({
      competitorLookupsToday: 0,
      competitorLookupDate: new Date().toDateString()
    });
  }
  if (alarm.name === 'renewalCheck') {
    checkRenewals();
  }
});

// ── Message Handler ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkPro') {
    extpay.getUser().then(user => {
      sendResponse({ isPro: user.paid });
    }).catch(() => sendResponse({ isPro: false }));
    return true;
  }

  if (msg.action === 'openPayment') {
    extpay.openPaymentPage();
    sendResponse({ ok: true });
    return false;
  }

  if (msg.action === 'checkCompetitorLimit') {
    handleCompetitorLimit(sendResponse);
    return true;
  }

  if (msg.action === 'analyzeKeywords') {
    analyzeKeywords(msg.keywords).then(sendResponse);
    return true;
  }

  if (msg.action === 'getSettings') {
    chrome.storage.local.get('settings', (data) => {
      sendResponse(data.settings || { notifications: true, renewalAlertDays: 7 });
    });
    return true;
  }

  if (msg.action === 'saveSettings') {
    chrome.storage.local.set({ settings: msg.settings });
    sendResponse({ ok: true });
    return false;
  }

  if (msg.action === 'getTemplates') {
    chrome.storage.local.get('reviewTemplates', (data) => {
      sendResponse(data.reviewTemplates || DEFAULT_TEMPLATES);
    });
    return true;
  }

  if (msg.action === 'saveTemplates') {
    chrome.storage.local.set({ reviewTemplates: msg.templates });
    sendResponse({ ok: true });
    return false;
  }
});

// ── Competitor Limit ──
async function handleCompetitorLimit(sendResponse) {
  try {
    const user = await extpay.getUser();
    if (user.paid) {
      sendResponse({ allowed: true, isPro: true });
      return;
    }
  } catch (e) {}

  chrome.storage.local.get(['competitorLookupsToday', 'competitorLookupDate'], (data) => {
    const today = new Date().toDateString();
    let count = data.competitorLookupsToday || 0;
    if (data.competitorLookupDate !== today) {
      count = 0;
    }
    if (count >= FREE_COMPETITOR_LIMIT) {
      sendResponse({ allowed: false, isPro: false, remaining: 0 });
    } else {
      count++;
      chrome.storage.local.set({
        competitorLookupsToday: count,
        competitorLookupDate: today
      });
      sendResponse({ allowed: true, isPro: false, remaining: FREE_COMPETITOR_LIMIT - count });
    }
  });
}

// ── Keyword Analysis ──
async function analyzeKeywords(keywords) {
  // Heuristic-based scoring since Etsy doesn't expose search volume API
  // We score based on tag length, word count, specificity
  return keywords.map(kw => {
    const words = kw.trim().toLowerCase().split(/\s+/);
    const len = kw.trim().length;

    // Score components
    let score = 50;

    // Length optimization (Etsy max 20 chars per tag)
    if (len <= 20 && len >= 8) score += 15;
    else if (len > 20) score -= 20;
    else if (len < 4) score -= 10;

    // Multi-word tags rank better (long-tail)
    if (words.length >= 2 && words.length <= 4) score += 15;
    else if (words.length === 1) score -= 5;
    else if (words.length > 4) score -= 10;

    // Penalize generic/stop words
    const stopWords = ['the', 'a', 'an', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of'];
    const stopCount = words.filter(w => stopWords.includes(w)).length;
    score -= stopCount * 5;

    // Bonus for specific patterns
    if (kw.match(/gift|personalized|custom|handmade|vintage/i)) score += 10;
    if (kw.match(/\d{4}/)) score += 5; // year trends

    // Estimated competition (heuristic)
    const competition = words.length === 1 ? 'High' : words.length <= 3 ? 'Medium' : 'Low';

    // Estimated volume (heuristic based on word count and generality)
    const volumeBase = words.length === 1 ? 8000 : words.length === 2 ? 3000 : words.length === 3 ? 1200 : 400;
    const volume = Math.round(volumeBase * (0.5 + Math.random() * 0.5));

    return {
      keyword: kw.trim(),
      score: Math.max(0, Math.min(100, score)),
      competition,
      estimatedVolume: volume,
      charCount: len,
      wordCount: words.length,
      tip: getTip(score, len, words.length, stopCount)
    };
  });
}

function getTip(score, len, wordCount, stopCount) {
  if (len > 20) return 'Tag exceeds 20 chars — Etsy will truncate it';
  if (wordCount === 1) return 'Add more words for long-tail specificity';
  if (stopCount > 1) return 'Remove filler words to strengthen tag';
  if (score >= 80) return 'Great tag! Strong specificity and length';
  if (score >= 60) return 'Good tag. Consider adding a modifier';
  return 'Consider reworking this tag for better relevance';
}

// ── Renewal Check ──
async function checkRenewals() {
  const data = await chrome.storage.local.get(['trackedListings', 'settings']);
  const settings = data.settings || { notifications: true, renewalAlertDays: 7 };
  const listings = data.trackedListings || [];

  if (!settings.notifications) return;

  const alertMs = settings.renewalAlertDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  listings.forEach(listing => {
    if (listing.renewalDate && (listing.renewalDate - now) < alertMs && (listing.renewalDate - now) > 0) {
      chrome.notifications.create(`renewal-${listing.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Listing Renewal Soon',
        message: `"${listing.title}" renews in ${Math.ceil((listing.renewalDate - now) / 86400000)} days`
      });
    }
  });
}

// ── Default Review Templates ──
const DEFAULT_TEMPLATES = [
  { name: 'Thank You (5 star)', text: 'Thank you so much for your wonderful review! I\'m thrilled you love your purchase. It was a pleasure creating this for you! 🌟' },
  { name: 'Thank You (4 star)', text: 'Thank you for your review! I\'m glad you\'re enjoying your purchase. If there\'s anything I can do to make it a 5-star experience, please don\'t hesitate to reach out!' },
  { name: 'Concern Response', text: 'Thank you for your feedback. I\'m sorry to hear about your concern. I\'d love to make this right — please message me directly and I\'ll work with you to find a solution.' },
  { name: 'Shipping Delay', text: 'I sincerely apologize for the shipping delay. I understand how frustrating that can be. Please reach out to me directly so I can look into this and make it right for you.' },
  { name: 'Custom Order Thanks', text: 'Thank you so much for trusting me with your custom order! It was such a joy to bring your vision to life. I\'d love to work with you again anytime! ✨' }
];
