/* eBay Seller Analytics — Background Service Worker */

// ExtensionPay integration
importScripts('ExtPay.js');
const extpay = ExtPay('ebay-seller-analytics');
extpay.startBackground();

// ─── Constants ───
const EBAY_FVF_RATE = 0.1325; // 13.25% final value fee
const PAYMENT_FEE_RATE = 0.029; // 2.9% payment processing
const PAYMENT_FEE_FIXED = 0.30; // $0.30 per transaction
const ALARM_DAILY = 'daily-stats-snapshot';
const ALARM_COMPETITOR = 'competitor-check';

// ─── Alarms ───
chrome.alarms.create(ALARM_DAILY, { periodInMinutes: 1440 }); // daily
chrome.alarms.create(ALARM_COMPETITOR, { periodInMinutes: 60 }); // hourly

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_DAILY) {
    takeDailySnapshot();
  } else if (alarm.name === ALARM_COMPETITOR) {
    checkCompetitorPrices();
  }
});

// ─── Installation ───
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      sales: [],
      dailySnapshots: [],
      competitors: [],
      costOfGoods: {},
      shippingCosts: {},
      settings: {
        currency: 'USD',
        competitorAlertThreshold: 5, // percent
        showProfitOverlay: true,
        showQualityScore: true,
        showVelocity: true,
        proEnabled: false
      }
    });
  }
});

// ─── Message Handler ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handlers = {
    'get-payment-status': handlePaymentStatus,
    'record-sale': handleRecordSale,
    'get-stats': handleGetStats,
    'get-profit': handleGetProfit,
    'add-competitor': handleAddCompetitor,
    'get-competitors': handleGetCompetitors,
    'remove-competitor': handleRemoveCompetitor,
    'update-cog': handleUpdateCOG,
    'get-settings': handleGetSettings,
    'update-settings': handleUpdateSettings,
    'get-dashboard-data': handleGetDashboardData,
    'bulk-action': handleBulkAction,
    'export-data': handleExportData,
    'get-listing-score': handleGetListingScore
  };

  const handler = handlers[msg.type];
  if (handler) {
    handler(msg, sender, sendResponse);
    return true; // async
  }
});

// ─── Payment Status ───
async function handlePaymentStatus(msg, sender, sendResponse) {
  try {
    const user = await extpay.getUser();
    sendResponse({ paid: user.paid, trialDays: user.trialDaysRemaining || 0 });
  } catch (e) {
    sendResponse({ paid: false, trialDays: 0 });
  }
}

// ─── Record Sale ───
async function handleRecordSale(msg, sender, sendResponse) {
  const { item } = msg;
  const data = await chrome.storage.local.get('sales');
  const sales = data.sales || [];
  sales.push({
    ...item,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0]
  });
  // Keep last 365 days
  const cutoff = Date.now() - (365 * 24 * 60 * 60 * 1000);
  const filtered = sales.filter(s => s.timestamp > cutoff);
  await chrome.storage.local.set({ sales: filtered });
  sendResponse({ success: true, totalSales: filtered.length });
}

// ─── Get Stats ───
async function handleGetStats(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get(['sales', 'dailySnapshots']);
  const sales = data.sales || [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const today = sales.filter(s => now - s.timestamp < day);
  const week = sales.filter(s => now - s.timestamp < 7 * day);
  const month = sales.filter(s => now - s.timestamp < 30 * day);

  const sumRevenue = (arr) => arr.reduce((t, s) => t + (s.price || 0), 0);
  const sumProfit = (arr) => arr.reduce((t, s) => t + (s.profit || 0), 0);

  // Velocity trend: compare this week vs last week
  const lastWeek = sales.filter(s => now - s.timestamp >= 7 * day && now - s.timestamp < 14 * day);
  const velocityTrend = lastWeek.length > 0
    ? ((week.length - lastWeek.length) / lastWeek.length * 100).toFixed(1)
    : 0;

  sendResponse({
    today: { count: today.length, revenue: sumRevenue(today), profit: sumProfit(today) },
    week: { count: week.length, revenue: sumRevenue(week), profit: sumProfit(week) },
    month: { count: month.length, revenue: sumRevenue(month), profit: sumProfit(month) },
    velocityTrend: parseFloat(velocityTrend),
    totalTracked: sales.length
  });
}

// ─── Profit Calculator ───
async function handleGetProfit(msg, sender, sendResponse) {
  const { price, shippingCharged, itemId } = msg;
  const data = await chrome.storage.local.get(['costOfGoods', 'shippingCosts']);
  const cog = (data.costOfGoods || {})[itemId] || 0;
  const shippingCost = (data.shippingCosts || {})[itemId] || 0;

  const salePrice = price + (shippingCharged || 0);
  const ebayFee = salePrice * EBAY_FVF_RATE;
  const paymentFee = salePrice * PAYMENT_FEE_RATE + PAYMENT_FEE_FIXED;
  const totalFees = ebayFee + paymentFee;
  const profit = salePrice - totalFees - cog - shippingCost;
  const margin = salePrice > 0 ? (profit / salePrice * 100) : 0;

  sendResponse({
    salePrice: salePrice.toFixed(2),
    ebayFee: ebayFee.toFixed(2),
    paymentFee: paymentFee.toFixed(2),
    totalFees: totalFees.toFixed(2),
    cog: cog.toFixed(2),
    shippingCost: shippingCost.toFixed(2),
    profit: profit.toFixed(2),
    margin: margin.toFixed(1)
  });
}

// ─── Update Cost of Goods ───
async function handleUpdateCOG(msg, sender, sendResponse) {
  const { itemId, cog, shipping } = msg;
  const data = await chrome.storage.local.get(['costOfGoods', 'shippingCosts']);
  const costOfGoods = data.costOfGoods || {};
  const shippingCosts = data.shippingCosts || {};
  if (cog !== undefined) costOfGoods[itemId] = parseFloat(cog) || 0;
  if (shipping !== undefined) shippingCosts[itemId] = parseFloat(shipping) || 0;
  await chrome.storage.local.set({ costOfGoods, shippingCosts });
  sendResponse({ success: true });
}

// ─── Competitor Management ───
async function handleAddCompetitor(msg, sender, sendResponse) {
  const user = await extpay.getUser().catch(() => ({ paid: false }));
  if (!user.paid) {
    sendResponse({ success: false, error: 'Pro feature — upgrade to monitor competitors' });
    return;
  }
  const data = await chrome.storage.local.get('competitors');
  const competitors = data.competitors || [];
  if (competitors.length >= 50) {
    sendResponse({ success: false, error: 'Maximum 50 competitor listings' });
    return;
  }
  competitors.push({
    id: msg.listing.id,
    title: msg.listing.title,
    url: msg.listing.url,
    price: msg.listing.price,
    seller: msg.listing.seller,
    lastChecked: Date.now(),
    priceHistory: [{ price: msg.listing.price, date: Date.now() }],
    addedAt: Date.now()
  });
  await chrome.storage.local.set({ competitors });
  sendResponse({ success: true, total: competitors.length });
}

async function handleGetCompetitors(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get('competitors');
  sendResponse({ competitors: data.competitors || [] });
}

async function handleRemoveCompetitor(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get('competitors');
  const competitors = (data.competitors || []).filter(c => c.id !== msg.id);
  await chrome.storage.local.set({ competitors });
  sendResponse({ success: true });
}

// ─── Competitor Price Check ───
async function checkCompetitorPrices() {
  const user = await extpay.getUser().catch(() => ({ paid: false }));
  if (!user.paid) return;

  const data = await chrome.storage.local.get(['competitors', 'settings']);
  const competitors = data.competitors || [];
  const threshold = (data.settings || {}).competitorAlertThreshold || 5;

  for (const comp of competitors) {
    try {
      const response = await fetch(comp.url);
      const html = await response.text();
      const priceMatch = html.match(/prcIsum[^>]*>(?:US\s*)?\$([0-9,.]+)/);
      if (priceMatch) {
        const newPrice = parseFloat(priceMatch[1].replace(',', ''));
        const oldPrice = comp.price;
        comp.price = newPrice;
        comp.lastChecked = Date.now();
        comp.priceHistory.push({ price: newPrice, date: Date.now() });
        // Keep last 90 days of history
        const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
        comp.priceHistory = comp.priceHistory.filter(h => h.date > cutoff);

        // Alert if price dropped more than threshold
        if (oldPrice > 0 && newPrice < oldPrice) {
          const dropPct = ((oldPrice - newPrice) / oldPrice * 100);
          if (dropPct >= threshold) {
            chrome.notifications?.create?.(`undercut-${comp.id}`, {
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: '⚠️ Competitor Price Drop!',
              message: `${comp.title.substring(0, 50)}... dropped ${dropPct.toFixed(0)}% to $${newPrice.toFixed(2)}`
            });
          }
        }
      }
    } catch (e) {
      // Skip failed fetches silently
    }
  }
  await chrome.storage.local.set({ competitors });
}

// ─── Daily Snapshot ───
async function takeDailySnapshot() {
  const data = await chrome.storage.local.get(['sales', 'dailySnapshots']);
  const sales = data.sales || [];
  const snapshots = data.dailySnapshots || [];
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === today);

  const sumRevenue = todaySales.reduce((t, s) => t + (s.price || 0), 0);
  const sumProfit = todaySales.reduce((t, s) => t + (s.profit || 0), 0);

  snapshots.push({
    date: today,
    sales: todaySales.length,
    revenue: sumRevenue,
    profit: sumProfit
  });

  // Keep 365 days
  const cutoff = Date.now() - (365 * 24 * 60 * 60 * 1000);
  const filtered = snapshots.filter(s => new Date(s.date).getTime() > cutoff);
  await chrome.storage.local.set({ dailySnapshots: filtered });
}

// ─── Settings ───
async function handleGetSettings(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get('settings');
  sendResponse({ settings: data.settings || {} });
}

async function handleUpdateSettings(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get('settings');
  const settings = { ...(data.settings || {}), ...msg.settings };
  await chrome.storage.local.set({ settings });
  sendResponse({ success: true });
}

// ─── Dashboard Data (for popup) ───
async function handleGetDashboardData(msg, sender, sendResponse) {
  const data = await chrome.storage.local.get(['sales', 'dailySnapshots', 'competitors', 'settings']);
  const sales = data.sales || [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Build 30-day chart data
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = new Date(now - i * day).toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date === dateStr);
    chartData.push({
      date: dateStr,
      sales: daySales.length,
      revenue: daySales.reduce((t, s) => t + (s.price || 0), 0),
      profit: daySales.reduce((t, s) => t + (s.profit || 0), 0)
    });
  }

  const todaySales = sales.filter(s => now - s.timestamp < day);
  const weekSales = sales.filter(s => now - s.timestamp < 7 * day);
  const monthSales = sales.filter(s => now - s.timestamp < 30 * day);

  let isPro = false;
  try {
    const user = await extpay.getUser();
    isPro = user.paid;
  } catch (e) {}

  sendResponse({
    today: {
      count: todaySales.length,
      revenue: todaySales.reduce((t, s) => t + (s.price || 0), 0),
      profit: todaySales.reduce((t, s) => t + (s.profit || 0), 0)
    },
    week: {
      count: weekSales.length,
      revenue: weekSales.reduce((t, s) => t + (s.price || 0), 0),
      profit: weekSales.reduce((t, s) => t + (s.profit || 0), 0)
    },
    month: {
      count: monthSales.length,
      revenue: monthSales.reduce((t, s) => t + (s.price || 0), 0),
      profit: monthSales.reduce((t, s) => t + (s.profit || 0), 0)
    },
    chartData,
    competitorCount: (data.competitors || []).length,
    isPro,
    settings: data.settings || {}
  });
}

// ─── Bulk Actions (Pro) ───
async function handleBulkAction(msg, sender, sendResponse) {
  const user = await extpay.getUser().catch(() => ({ paid: false }));
  if (!user.paid) {
    sendResponse({ success: false, error: 'Pro feature — upgrade for bulk actions' });
    return;
  }
  // Send action to content script
  const tabs = await chrome.tabs.query({ url: 'https://www.ebay.com/sh/*', active: true });
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'execute-bulk-action',
      action: msg.action,
      items: msg.items,
      params: msg.params
    });
    sendResponse({ success: true, message: 'Bulk action sent to page' });
  } else {
    sendResponse({ success: false, error: 'Open eBay Seller Hub first' });
  }
}

// ─── Export (Pro) ───
async function handleExportData(msg, sender, sendResponse) {
  const user = await extpay.getUser().catch(() => ({ paid: false }));
  if (!user.paid) {
    sendResponse({ success: false, error: 'Pro feature — upgrade to export data' });
    return;
  }
  const data = await chrome.storage.local.get(['sales', 'dailySnapshots', 'competitors']);
  sendResponse({
    success: true,
    data: {
      sales: data.sales || [],
      snapshots: data.dailySnapshots || [],
      competitors: data.competitors || []
    }
  });
}

// ─── Listing Quality Score ───
async function handleGetListingScore(msg, sender, sendResponse) {
  const { listing } = msg;
  let score = 0;
  const breakdown = [];

  // Title: 80 chars ideal, penalize short titles
  const titleLen = (listing.title || '').length;
  if (titleLen >= 70) { score += 20; breakdown.push({ item: 'Title length', score: 20, max: 20, tip: 'Great title length!' }); }
  else if (titleLen >= 50) { score += 15; breakdown.push({ item: 'Title length', score: 15, max: 20, tip: 'Add more keywords to your title' }); }
  else if (titleLen >= 30) { score += 8; breakdown.push({ item: 'Title length', score: 8, max: 20, tip: 'Title is too short — use all 80 characters' }); }
  else { score += 3; breakdown.push({ item: 'Title length', score: 3, max: 20, tip: 'Very short title — losing search visibility' }); }

  // Photos: 12 max, more is better
  const photos = listing.photoCount || 0;
  if (photos >= 12) { score += 25; breakdown.push({ item: 'Photos', score: 25, max: 25, tip: 'Maximum photos — excellent!' }); }
  else if (photos >= 8) { score += 18; breakdown.push({ item: 'Photos', score: 18, max: 25, tip: `Add ${12 - photos} more photos` }); }
  else if (photos >= 4) { score += 10; breakdown.push({ item: 'Photos', score: 10, max: 25, tip: 'More photos = more sales. Add several more.' }); }
  else { score += 3; breakdown.push({ item: 'Photos', score: 3, max: 25, tip: 'Too few photos! Aim for 12.' }); }

  // Description length
  const descLen = listing.descriptionLength || 0;
  if (descLen >= 500) { score += 15; breakdown.push({ item: 'Description', score: 15, max: 15, tip: 'Good description length' }); }
  else if (descLen >= 200) { score += 10; breakdown.push({ item: 'Description', score: 10, max: 15, tip: 'Add more detail to description' }); }
  else { score += 3; breakdown.push({ item: 'Description', score: 3, max: 15, tip: 'Description is too short' }); }

  // Item specifics
  const specifics = listing.specificsCount || 0;
  if (specifics >= 10) { score += 15; breakdown.push({ item: 'Item specifics', score: 15, max: 15, tip: 'Excellent specifics coverage' }); }
  else if (specifics >= 5) { score += 10; breakdown.push({ item: 'Item specifics', score: 10, max: 15, tip: 'Add more item specifics for better search' }); }
  else { score += 3; breakdown.push({ item: 'Item specifics', score: 3, max: 15, tip: 'Fill in all item specifics!' }); }

  // Free shipping
  if (listing.freeShipping) { score += 10; breakdown.push({ item: 'Free shipping', score: 10, max: 10, tip: 'Free shipping boosts search ranking' }); }
  else { score += 0; breakdown.push({ item: 'Free shipping', score: 0, max: 10, tip: 'Offer free shipping to rank higher' }); }

  // Returns accepted
  if (listing.returnsAccepted) { score += 15; breakdown.push({ item: 'Returns policy', score: 15, max: 15, tip: 'Returns accepted — builds trust' }); }
  else { score += 0; breakdown.push({ item: 'Returns policy', score: 0, max: 15, tip: 'Accept returns to boost visibility' }); }

  sendResponse({ score, breakdown, grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F' });
}
