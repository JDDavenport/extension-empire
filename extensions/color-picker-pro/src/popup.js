const extpay = ExtPay('color-picker-pro');
document.getElementById('proBtn').addEventListener('click', () => extpay.openPaymentPage());

document.getElementById('pickBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    window.close();
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_COLORS' }, () => {
    document.getElementById('palette').innerHTML = '';
    document.getElementById('actions').style.display = 'none';
    document.getElementById('empty').style.display = 'block';
  });
});

chrome.runtime.sendMessage({ type: 'GET_COLORS' }, colors => {
  if (!colors || !colors.length) return;
  document.getElementById('empty').style.display = 'none';
  document.getElementById('actions').style.display = 'flex';
  const palette = document.getElementById('palette');
  colors.slice(0, 20).forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = c.hex;
    swatch.innerHTML = `<span class="tip">${c.hex}</span>`;
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(c.hex);
      swatch.querySelector('.tip').textContent = 'Copied!';
      setTimeout(() => swatch.querySelector('.tip').textContent = c.hex, 1000);
    });
    palette.appendChild(swatch);
  });
});
