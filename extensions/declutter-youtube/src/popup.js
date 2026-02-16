// Declutter YouTube — Popup Script

const TOGGLE_KEYS = [
  'hideComments', 'hideRecommendations', 'hideShorts', 'hideTrending',
  'hideEndScreens', 'disableAutoplay', 'hideChat', 'hideNotifCount',
  'cleanHome', 'theaterDefault'
];

// Load saved settings and update UI
chrome.storage.sync.get(null, (settings) => {
  // Set toggle states
  document.querySelectorAll('.toggle-row').forEach(row => {
    const key = row.dataset.key;
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && settings[key]) {
      checkbox.checked = true;
    }
  });

  // Focus mode button state
  const focusBtn = document.getElementById('focusBtn');
  if (settings.focusMode) {
    focusBtn.classList.add('active');
    focusBtn.querySelector('.focus-text').textContent = 'Focus Mode ON';
  }
});

// Toggle handlers
document.querySelectorAll('.toggle-row').forEach(row => {
  const key = row.dataset.key;
  const checkbox = row.querySelector('input[type="checkbox"]');
  if (!checkbox || !key) return;

  checkbox.addEventListener('change', () => {
    chrome.storage.sync.set({ [key]: checkbox.checked });
  });
});

// Focus Mode button
document.getElementById('focusBtn').addEventListener('click', () => {
  const btn = document.getElementById('focusBtn');
  const isActive = btn.classList.toggle('active');
  btn.querySelector('.focus-text').textContent = isActive ? 'Focus Mode ON' : 'Focus Mode';
  
  chrome.storage.sync.set({ focusMode: isActive });
  
  // Send immediate message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleFocusMode', enabled: isActive });
    }
  });
});

// Upgrade button (ExtensionPay placeholder)
document.getElementById('upgradeBtn').addEventListener('click', () => {
  // TODO: Integrate ExtensionPay
  chrome.tabs.create({ url: 'https://www.example.com/upgrade' });
});
