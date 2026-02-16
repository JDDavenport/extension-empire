/**
 * RelistPro — Background Service Worker
 * Handles messaging between content scripts and popup, rate limiting, and stats tracking.
 */

const RATE_LIMIT = { maxPerHour: 50, windowMs: 3600000 };
const ACTION_LOG_KEY = 'relistpro_action_log';
const STATS_KEY = 'relistpro_stats';

// ── Initialization ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      [STATS_KEY]: {
        totalRelists: 0,
        totalListingsTracked: 0,
        dailyRelists: {},
        installDate: Date.now()
      },
      [ACTION_LOG_KEY]: [],
      relistpro_settings: {
        minDelay: 2000,
        maxDelay: 8000,
        maxActionsPerHour: 50,
        pauseOnUnfocus: true
      }
    });
  }
});

// ── Rate Limiting ───────────────────────────────────────────────────────────

async function checkRateLimit() {
  const { [ACTION_LOG_KEY]: log = [] } = await chrome.storage.local.get(ACTION_LOG_KEY);
  const cutoff = Date.now() - RATE_LIMIT.windowMs;
  const recentActions = log.filter(ts => ts > cutoff);
  // Clean old entries
  await chrome.storage.local.set({ [ACTION_LOG_KEY]: recentActions });
  return {
    allowed: recentActions.length < RATE_LIMIT.maxPerHour,
    remaining: RATE_LIMIT.maxPerHour - recentActions.length,
    resetIn: recentActions.length > 0 ? Math.max(0, recentActions[0] + RATE_LIMIT.windowMs - Date.now()) : 0
  };
}

async function recordAction() {
  const { [ACTION_LOG_KEY]: log = [] } = await chrome.storage.local.get(ACTION_LOG_KEY);
  log.push(Date.now());
  await chrome.storage.local.set({ [ACTION_LOG_KEY]: log });
}

// ── Stats Tracking ──────────────────────────────────────────────────────────

async function incrementRelists(count = 1) {
  const { [STATS_KEY]: stats } = await chrome.storage.local.get(STATS_KEY);
  const today = new Date().toISOString().split('T')[0];
  stats.totalRelists += count;
  stats.dailyRelists[today] = (stats.dailyRelists[today] || 0) + count;
  // Keep only last 30 days
  const keys = Object.keys(stats.dailyRelists).sort();
  if (keys.length > 30) {
    for (const k of keys.slice(0, keys.length - 30)) {
      delete stats.dailyRelists[k];
    }
  }
  await chrome.storage.local.set({ [STATS_KEY]: stats });
  return stats;
}

async function updateListingsTracked(count) {
  const { [STATS_KEY]: stats } = await chrome.storage.local.get(STATS_KEY);
  stats.totalListingsTracked = count;
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}

// ── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case 'CHECK_RATE_LIMIT': {
          sendResponse(await checkRateLimit());
          break;
        }
        case 'RECORD_ACTION': {
          await recordAction();
          sendResponse({ ok: true });
          break;
        }
        case 'INCREMENT_RELISTS': {
          const stats = await incrementRelists(msg.count || 1);
          sendResponse({ ok: true, stats });
          break;
        }
        case 'UPDATE_LISTINGS_TRACKED': {
          await updateListingsTracked(msg.count);
          sendResponse({ ok: true });
          break;
        }
        case 'GET_STATS': {
          const { [STATS_KEY]: stats } = await chrome.storage.local.get(STATS_KEY);
          sendResponse(stats || {});
          break;
        }
        case 'GET_SETTINGS': {
          const { relistpro_settings: settings } = await chrome.storage.local.get('relistpro_settings');
          sendResponse(settings || {});
          break;
        }
        case 'SAVE_SETTINGS': {
          await chrome.storage.local.set({ relistpro_settings: msg.settings });
          sendResponse({ ok: true });
          break;
        }
        // Pro placeholder — scheduler
        // case 'SCHEDULE_RELIST': {
        //   const alarmName = `relist_${msg.itemId}`;
        //   await chrome.alarms.create(alarmName, { delayInMinutes: msg.delayMinutes, periodInMinutes: msg.periodMinutes });
        //   sendResponse({ ok: true, alarmName });
        //   break;
        // }
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();
  return true; // keep channel open for async
});

// Pro placeholder — alarm handler
// chrome.alarms.onAlarm.addListener(async (alarm) => {
//   if (alarm.name.startsWith('relist_')) {
//     const itemId = alarm.name.replace('relist_', '');
//     // Send message to content script to relist
//   }
// });
