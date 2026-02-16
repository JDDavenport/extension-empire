// Declutter YouTube — Content Script
// Runs at document_start for instant effect

const SETTINGS_KEYS = [
  'hideComments', 'hideRecommendations', 'hideShorts', 'hideTrending',
  'hideEndScreens', 'disableAutoplay', 'hideChat', 'hideNotifCount',
  'cleanHome', 'theaterDefault', 'focusMode'
];

const CLASS_MAP = {
  hideComments: 'dy-hide-comments',
  hideRecommendations: 'dy-hide-recommendations',
  hideShorts: 'dy-hide-shorts',
  hideTrending: 'dy-hide-trending',
  hideEndScreens: 'dy-hide-endscreens',
  disableAutoplay: 'dy-disable-autoplay',
  hideChat: 'dy-hide-chat',
  hideNotifCount: 'dy-hide-notif-count',
  cleanHome: 'dy-clean-home',
  theaterDefault: 'dy-theater-default',
  focusMode: 'dy-focus-mode'
};

const DEFAULT_SETTINGS = {
  hideComments: false,
  hideRecommendations: false,
  hideShorts: false,
  hideTrending: false,
  hideEndScreens: false,
  disableAutoplay: false,
  hideChat: false,
  hideNotifCount: false,
  cleanHome: false,
  theaterDefault: false,
  focusMode: false,
  perChannelSettings: {},
  proEnabled: false
};

let currentSettings = { ...DEFAULT_SETTINGS };
let currentChannel = null;

// Apply CSS classes to body based on settings
function applySettings(settings) {
  currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Check per-channel overrides
  const channelOverrides = getChannelOverrides();
  
  for (const [key, className] of Object.entries(CLASS_MAP)) {
    let enabled = currentSettings[key];
    
    // Per-channel: if comments are hidden globally but allowed for this channel
    if (key === 'hideComments' && channelOverrides && channelOverrides.allowComments) {
      enabled = false;
    }
    
    if (enabled) {
      document.documentElement.classList.add(className);
      // Also add to body when available
      if (document.body) document.body.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
      if (document.body) document.body.classList.remove(className);
    }
  }
  
  // JS-driven features
  if (currentSettings.disableAutoplay) handleAutoplay();
  if (currentSettings.theaterDefault) handleTheaterMode();
}

function getChannelOverrides() {
  if (!currentChannel || !currentSettings.perChannelSettings) return null;
  return currentSettings.perChannelSettings[currentChannel] || null;
}

// Detect current channel
function detectChannel() {
  const channelLink = document.querySelector(
    'ytd-video-owner-renderer a, ytd-channel-name a'
  );
  if (channelLink) {
    const href = channelLink.getAttribute('href');
    if (href) {
      currentChannel = href.replace(/^\//, '').split('/')[0];
      // Re-apply in case per-channel settings matter
      applySettings(currentSettings);
    }
  }
}

// Disable autoplay
function handleAutoplay() {
  const autoplayButton = document.querySelector('.ytp-autonav-toggle-button');
  if (autoplayButton) {
    const isOn = autoplayButton.getAttribute('aria-checked') === 'true';
    if (isOn) autoplayButton.click();
  }
}

// Theater mode by default
function handleTheaterMode() {
  const player = document.querySelector('ytd-watch-flexy');
  if (player && !player.hasAttribute('theater') && !player.hasAttribute('fullscreen')) {
    const theaterBtn = document.querySelector('.ytp-size-button');
    if (theaterBtn) theaterBtn.click();
  }
}

// Load settings and apply immediately
chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applySettings(settings);
});

// Re-apply when body is available (we run at document_start)
if (!document.body) {
  const observer = new MutationObserver(() => {
    if (document.body) {
      observer.disconnect();
      applySettings(currentSettings);
    }
  });
  observer.observe(document.documentElement, { childList: true });
}

// Listen for settings changes from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    const updated = { ...currentSettings };
    for (const [key, { newValue }] of Object.entries(changes)) {
      updated[key] = newValue;
    }
    applySettings(updated);
  }
});

// Listen for messages from popup (focus mode toggle, etc.)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleFocusMode') {
    currentSettings.focusMode = msg.enabled;
    applySettings(currentSettings);
    sendResponse({ ok: true });
  }
  if (msg.action === 'getChannel') {
    sendResponse({ channel: currentChannel });
  }
});

// Observe YouTube SPA navigation to re-apply settings and detect channel
const navObserver = new MutationObserver(() => {
  applySettings(currentSettings);
  detectChannel();
});

// Wait for page to be ready, then start observing
function init() {
  const target = document.querySelector('ytd-app') || document.body;
  if (target) {
    navObserver.observe(target, { childList: true, subtree: true });
    detectChannel();
    // Re-handle JS features after navigation
    if (currentSettings.disableAutoplay) handleAutoplay();
    if (currentSettings.theaterDefault) handleTheaterMode();
  } else {
    setTimeout(init, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
