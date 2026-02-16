const extpay = ExtPay('reading-time');
document.getElementById('proBtn').addEventListener('click', () => extpay.openPaymentPage());

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const article = document.querySelector('article') || document.querySelector('[role="main"]') || document.body;
        const text = article.innerText || '';
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
      }
    });
    if (result && result.result) {
      const words = result.result;
      const wpm = parseInt(document.getElementById('wpm').value) || 238;
      const mins = Math.ceil(words / wpm);
      document.getElementById('time').textContent = `${mins} min`;
      document.getElementById('words').textContent = `${words.toLocaleString()} words · ${wpm} WPM`;
    }
    // Also inject the badge
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  }
});

chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, settings => {
  if (settings) document.getElementById('wpm').value = settings.wpm || 238;
});

document.getElementById('wpm').addEventListener('change', e => {
  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', wpm: parseInt(e.target.value) || 238, showBadge: true });
});
