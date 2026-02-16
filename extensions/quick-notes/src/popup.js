const extpay = ExtPay('quick-notes');
document.getElementById('proBtn').addEventListener('click', () => extpay.openPaymentPage());

document.getElementById('openNote').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    window.close();
  }
});

chrome.runtime.sendMessage({ type: 'GET_ALL_NOTES' }, notes => {
  if (!notes || !notes.length) return;
  document.getElementById('empty').style.display = 'none';
  const list = document.getElementById('notesList');
  notes.sort((a, b) => b.updated - a.updated).slice(0, 20).forEach(n => {
    const el = document.createElement('div');
    el.className = 'note-item';
    el.innerHTML = `<div class="url">${n.url}</div><div class="preview">${(n.text || '').slice(0, 60)}${n.text?.length > 60 ? '...' : ''}</div>`;
    list.appendChild(el);
  });
});
