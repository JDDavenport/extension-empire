// Declutter YouTube — Background Service Worker

// Set default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
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
    });
  }
});

// Listen for keyboard shortcut commands (Pro feature placeholder)
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'toggle-focus-mode') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('youtube.com')) {
        chrome.storage.sync.get({ focusMode: false }, (settings) => {
          const newVal = !settings.focusMode;
          chrome.storage.sync.set({ focusMode: newVal });
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleFocusMode', enabled: newVal });
        });
      }
    });
  }
});
