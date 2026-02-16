/* Tab Master Pro — Background Service Worker */

// ExtensionPay integration
importScripts('ExtPay.js');
const extpay = ExtPay('tab-master-pro');
extpay.startBackground();

// ─── State ───
let isPro = false;
let ramSaved = 0; // bytes estimated
const suspendedTabs = new Map(); // tabId -> {url, title, favIconUrl}
const tabTimeline = []; // {url, title, timestamp, action}

// ─── Init ───
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ sessions: {}, ramSaved: 0, timeline: [], suspendedTabs: {} });
  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  loadState();
  setupAlarms();
});

async function loadState() {
  const data = await chrome.storage.local.get(['ramSaved', 'suspendedTabs', 'timeline']);
  ramSaved = data.ramSaved || 0;
  if (data.suspendedTabs) {
    for (const [k, v] of Object.entries(data.suspendedTabs)) {
      suspendedTabs.set(parseInt(k), v);
    }
  }
}

function setupAlarms() {
  chrome.alarms.create('auto-save', { periodInMinutes: 5 });
  chrome.alarms.create('check-scheduled', { periodInMinutes: 1 });
  chrome.alarms.create('suspend-check', { periodInMinutes: 10 });
}

// ─── Pro check ───
async function checkPro() {
  try {
    const user = await extpay.getUser();
    isPro = user.paid;
  } catch { isPro = false; }
  return isPro;
}

// ─── Alarms ───
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-save') {
    await autoSaveSession();
  } else if (alarm.name === 'check-scheduled') {
    await checkPro();
    if (isPro) await checkScheduledSessions();
  } else if (alarm.name === 'suspend-check') {
    // Auto-suspend after 30 min inactive (if enabled)
    const { autoSuspend } = await chrome.storage.local.get('autoSuspend');
    if (autoSuspend) await suspendInactiveTabs(30);
  }
});

// ─── Tab tracking for timeline ───
chrome.tabs.onCreated.addListener((tab) => {
  addTimelineEvent(tab.url || 'about:newtab', tab.title || 'New Tab', 'created');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  suspendedTabs.delete(tabId);
  persistSuspended();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    addTimelineEvent(tab.url, tab.title, 'loaded');
  }
});

function addTimelineEvent(url, title, action) {
  const evt = { url, title, action, timestamp: Date.now() };
  tabTimeline.push(evt);
  // Keep only today
  const dayStart = new Date().setHours(0, 0, 0, 0);
  while (tabTimeline.length > 0 && tabTimeline[0].timestamp < dayStart) {
    tabTimeline.shift();
  }
  chrome.storage.local.set({ timeline: tabTimeline });
}

// ─── Sessions ───
async function saveSession(name) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const session = {
    name,
    created: Date.now(),
    tabs: tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl, pinned: t.pinned }))
  };
  const { sessions } = await chrome.storage.local.get('sessions');
  const all = sessions || {};
  all[name] = session;
  await chrome.storage.local.set({ sessions: all });

  // Pro: sync
  if (isPro) {
    try { await chrome.storage.sync.set({ [`session_${name}`]: session }); } catch {}
  }
  return session;
}

async function autoSaveSession() {
  await saveSession('__autosave__');
}

async function restoreSession(name) {
  const { sessions } = await chrome.storage.local.get('sessions');
  const session = sessions?.[name];
  if (!session) return null;
  const urls = session.tabs.map(t => t.url).filter(u => u && !u.startsWith('chrome://'));
  if (urls.length > 0) {
    await chrome.windows.create({ url: urls });
  }
  return session;
}

async function deleteSession(name) {
  const { sessions } = await chrome.storage.local.get('sessions');
  if (sessions?.[name]) {
    delete sessions[name];
    await chrome.storage.local.set({ sessions });
    if (isPro) {
      try { await chrome.storage.sync.remove(`session_${name}`); } catch {}
    }
  }
}

async function getSessions() {
  const { sessions } = await chrome.storage.local.get('sessions');
  return sessions || {};
}

// ─── Tab Search ───
async function searchTabs(query) {
  const tabs = await chrome.tabs.query({});
  if (!query) return tabs;
  const q = query.toLowerCase();
  return tabs.filter(t => {
    const title = (t.title || '').toLowerCase();
    const url = (t.url || '').toLowerCase();
    return fuzzyMatch(q, title) || fuzzyMatch(q, url);
  }).sort((a, b) => {
    // Better matches first
    const aScore = fuzzyScore(q, (a.title || '').toLowerCase());
    const bScore = fuzzyScore(q, (b.title || '').toLowerCase());
    return bScore - aScore;
  });
}

function fuzzyMatch(query, text) {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function fuzzyScore(query, text) {
  let score = 0, qi = 0, consecutive = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 2;
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '/') score += 5;
    } else {
      consecutive = 0;
    }
  }
  if (qi < query.length) return 0;
  if (text.startsWith(query)) score += 20;
  return score;
}

// ─── Suspend Tabs ───
async function suspendInactiveTabs(minMinutes = 0) {
  const tabs = await chrome.tabs.query({ active: false, currentWindow: true });
  let count = 0;
  for (const tab of tabs) {
    if (tab.pinned || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
    if (suspendedTabs.has(tab.id)) continue;
    if (tab.audible) continue;

    suspendedTabs.set(tab.id, { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });
    await chrome.tabs.discard(tab.id);
    ramSaved += 50 * 1024 * 1024; // ~50MB estimate per tab
    count++;
  }
  await chrome.storage.local.set({ ramSaved });
  persistSuspended();
  return { count, ramSaved };
}

async function unsuspendTab(tabId) {
  if (suspendedTabs.has(tabId)) {
    await chrome.tabs.reload(tabId);
    ramSaved = Math.max(0, ramSaved - 50 * 1024 * 1024);
    suspendedTabs.delete(tabId);
    await chrome.storage.local.set({ ramSaved });
    persistSuspended();
  }
}

function persistSuspended() {
  const obj = {};
  for (const [k, v] of suspendedTabs) obj[k] = v;
  chrome.storage.local.set({ suspendedTabs: obj });
}

// ─── Duplicate Detection ───
async function findDuplicates() {
  const tabs = await chrome.tabs.query({});
  const urlMap = new Map();
  const dupes = [];
  for (const tab of tabs) {
    const url = tab.url?.split('#')[0]; // ignore hash
    if (!url) continue;
    if (urlMap.has(url)) {
      urlMap.get(url).push(tab);
    } else {
      urlMap.set(url, [tab]);
    }
  }
  for (const [url, tabList] of urlMap) {
    if (tabList.length > 1) {
      dupes.push({ url, tabs: tabList });
    }
  }
  return dupes;
}

async function closeDuplicates() {
  const dupes = await findDuplicates();
  let closed = 0;
  for (const { tabs } of dupes) {
    // Keep first, close rest
    for (let i = 1; i < tabs.length; i++) {
      await chrome.tabs.remove(tabs[i].id);
      closed++;
    }
  }
  return closed;
}

// ─── Auto-group by domain (Pro) ───
async function autoGroupByDomain() {
  if (!isPro) return { error: 'Pro feature' };
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const domainMap = new Map();
  const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let colorIdx = 0;

  for (const tab of tabs) {
    try {
      const domain = new URL(tab.url).hostname.replace('www.', '');
      if (!domainMap.has(domain)) domainMap.set(domain, []);
      domainMap.get(domain).push(tab.id);
    } catch {}
  }

  let grouped = 0;
  for (const [domain, tabIds] of domainMap) {
    if (tabIds.length < 2) continue;
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: domain,
      color: colors[colorIdx % colors.length]
    });
    colorIdx++;
    grouped += tabIds.length;
  }
  return { grouped };
}

// ─── Scheduled Sessions (Pro) ───
async function scheduleSession(name, time) {
  if (!isPro) return { error: 'Pro feature' };
  const { scheduled } = await chrome.storage.local.get('scheduled');
  const all = scheduled || [];
  all.push({ name, time, enabled: true });
  await chrome.storage.local.set({ scheduled: all });
  return { ok: true };
}

async function checkScheduledSessions() {
  const { scheduled } = await chrome.storage.local.get('scheduled');
  if (!scheduled) return;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const updated = [];

  for (const s of scheduled) {
    if (!s.enabled) { updated.push(s); continue; }
    const [h, m] = s.time.split(':').map(Number);
    const targetMinutes = h * 60 + m;
    if (Math.abs(nowMinutes - targetMinutes) <= 1) {
      await restoreSession(s.name);
    }
    updated.push(s);
  }
}

async function getScheduled() {
  const { scheduled } = await chrome.storage.local.get('scheduled');
  return scheduled || [];
}

async function removeScheduled(index) {
  const { scheduled } = await chrome.storage.local.get('scheduled');
  if (scheduled && scheduled[index]) {
    scheduled.splice(index, 1);
    await chrome.storage.local.set({ scheduled });
  }
}

// ─── Message Handler ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse);
  return true; // async
});

async function handleMessage(msg) {
  switch (msg.action) {
    case 'saveSession': return await saveSession(msg.name);
    case 'restoreSession': return await restoreSession(msg.name);
    case 'deleteSession': return await deleteSession(msg.name);
    case 'getSessions': return await getSessions();
    case 'searchTabs': return await searchTabs(msg.query);
    case 'suspendTabs': return await suspendInactiveTabs();
    case 'unsuspendTab': return await unsuspendTab(msg.tabId);
    case 'findDuplicates': return await findDuplicates();
    case 'closeDuplicates': return await closeDuplicates();
    case 'autoGroup': return await autoGroupByDomain();
    case 'scheduleSession': return await scheduleSession(msg.name, msg.time);
    case 'getScheduled': return await getScheduled();
    case 'removeScheduled': return await removeScheduled(msg.index);
    case 'getTimeline': return tabTimeline;
    case 'getRamSaved': return { ramSaved };
    case 'getProStatus': return { isPro: await checkPro() };
    case 'openPayment': extpay.openPaymentPage(); return { ok: true };
    case 'toggleAutoSuspend':
      await chrome.storage.local.set({ autoSuspend: msg.enabled });
      return { ok: true };
    default: return { error: 'Unknown action' };
  }
}

// ─── Commands ───
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-session') {
    await saveSession(`Quick Save ${new Date().toLocaleString()}`);
  } else if (command === 'suspend-tabs') {
    await suspendInactiveTabs();
  } else if (command === 'find-duplicates') {
    await closeDuplicates();
  }
  // search-tabs opens popup naturally via _execute_action
});

// Auto-save on potential browser close (periodic)
loadState();
checkPro();
