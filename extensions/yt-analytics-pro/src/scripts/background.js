/* YT Analytics Pro — Background Service Worker */

const extpay = ExtPay('yt-analytics-pro');
extpay.startBackground();

// Listen for messages from content scripts / popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handlers = {
    'get-user': handleGetUser,
    'open-payment': handleOpenPayment,
    'save-data': handleSaveData,
    'load-data': handleLoadData,
    'analyze-sentiment': handleSentiment,
    'suggest-tags': handleTagSuggestions,
    'estimate-revenue': handleRevenueEstimate,
    'predict-performance': handlePredictPerformance,
  };

  const handler = handlers[msg.action];
  if (handler) {
    handler(msg, sender).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true; // async
  }
});

async function handleGetUser() {
  return extpay.getUser();
}

async function handleOpenPayment() {
  await extpay.openPaymentPage();
  return { ok: true };
}

async function handleSaveData(msg) {
  await chrome.storage.local.set({ [msg.key]: msg.value });
  return { ok: true };
}

async function handleLoadData(msg) {
  const data = await chrome.storage.local.get(msg.key);
  return { value: data[msg.key] || null };
}

// Simple sentiment analysis (keyword-based)
async function handleSentiment(msg) {
  const comments = msg.comments || [];
  const positiveWords = ['great', 'awesome', 'love', 'amazing', 'excellent', 'fantastic', 'best', 'thank', 'helpful', 'perfect', 'good', 'nice', 'cool', 'beautiful', 'wonderful', 'brilliant', 'incredible', 'outstanding', 'superb', 'fire', '🔥', '❤️', '👏', '💯', '👍'];
  const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'awful', 'horrible', 'waste', 'boring', 'trash', 'stupid', 'clickbait', 'dislike', 'disappointed', 'annoying', 'sucks', 'garbage', 'fake', 'scam', '👎'];

  let positive = 0, negative = 0, questions = 0, neutral = 0;

  for (const c of comments) {
    const lower = c.toLowerCase();
    const isQuestion = lower.includes('?') || lower.startsWith('how') || lower.startsWith('what') || lower.startsWith('why') || lower.startsWith('when') || lower.startsWith('where') || lower.startsWith('can ') || lower.startsWith('does ') || lower.startsWith('is ');
    const posScore = positiveWords.filter(w => lower.includes(w)).length;
    const negScore = negativeWords.filter(w => lower.includes(w)).length;

    if (isQuestion) questions++;
    else if (posScore > negScore) positive++;
    else if (negScore > posScore) negative++;
    else neutral++;
  }

  const total = comments.length || 1;
  return {
    positive, negative, questions, neutral, total: comments.length,
    percentages: {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      questions: Math.round((questions / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    }
  };
}

// Tag suggestions based on video topic
async function handleTagSuggestions(msg) {
  const topic = (msg.topic || '').toLowerCase();
  const words = topic.split(/\s+/).filter(w => w.length > 2);

  // Generate tag variations
  const tags = [];
  const addTag = (tag, score) => {
    if (tag && !tags.find(t => t.tag === tag)) {
      tags.push({ tag, score });
    }
  };

  // Direct words
  words.forEach(w => addTag(w, 70 + Math.floor(Math.random() * 30)));

  // Combinations
  for (let i = 0; i < words.length - 1; i++) {
    addTag(`${words[i]} ${words[i + 1]}`, 60 + Math.floor(Math.random() * 35));
  }

  // Full phrase
  if (words.length > 1) addTag(topic.trim(), 80 + Math.floor(Math.random() * 20));

  // Common prefixes
  const prefixes = ['how to', 'best', 'top', 'tutorial', 'guide', 'review', 'tips'];
  prefixes.forEach(p => {
    if (words.length > 0) {
      addTag(`${p} ${words[0]}`, 50 + Math.floor(Math.random() * 40));
    }
  });

  // Year tag
  addTag(`${topic.trim()} 2026`, 75 + Math.floor(Math.random() * 20));

  tags.sort((a, b) => b.score - a.score);
  return { tags: tags.slice(0, 20) };
}

// Revenue estimation based on niche CPM
async function handleRevenueEstimate(msg) {
  const nicheCPM = {
    'finance': 12.00, 'insurance': 15.00, 'legal': 10.00, 'technology': 6.50,
    'marketing': 8.00, 'business': 7.50, 'health': 5.00, 'education': 4.50,
    'gaming': 2.50, 'entertainment': 3.00, 'music': 1.50, 'comedy': 2.00,
    'sports': 3.50, 'news': 4.00, 'science': 5.50, 'food': 3.50,
    'travel': 4.00, 'beauty': 4.50, 'fashion': 4.00, 'fitness': 5.00,
    'diy': 3.50, 'pets': 2.50, 'auto': 5.50, 'real estate': 11.00,
    'crypto': 8.00, 'programming': 7.00, 'default': 3.50,
  };

  const niche = (msg.niche || 'default').toLowerCase();
  const cpm = nicheCPM[niche] || nicheCPM['default'];
  const views = msg.views || 0;
  const monetizedViews = views * 0.55; // ~55% of views are monetized
  const revenue = (monetizedViews / 1000) * cpm;

  return {
    estimatedRevenue: Math.round(revenue * 100) / 100,
    cpm,
    niche,
    views,
    monetizedViews: Math.round(monetizedViews),
  };
}

// Performance prediction
async function handlePredictPerformance(msg) {
  const { firstHourViews, channelAvgFirstHour, channelAvgTotal } = msg;
  if (!channelAvgFirstHour || !channelAvgTotal) {
    return { prediction: null, message: 'Need channel averages to predict' };
  }

  const ratio = firstHourViews / channelAvgFirstHour;
  const predictedTotal = Math.round(channelAvgTotal * ratio);
  let performance = 'average';
  if (ratio > 1.5) performance = 'viral';
  else if (ratio > 1.1) performance = 'above_average';
  else if (ratio < 0.5) performance = 'below_average';
  else if (ratio < 0.8) performance = 'underperforming';

  return {
    predictedTotal,
    ratio: Math.round(ratio * 100) / 100,
    performance,
    confidence: ratio > 0.3 ? 'high' : 'low',
  };
}

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      ytap_installed: Date.now(),
      ytap_competitors: [],
      ytap_thumbnails: {},
      ytap_upload_data: {},
    });
  }
});
