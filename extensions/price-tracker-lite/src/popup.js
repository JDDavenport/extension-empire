const extpay = ExtPay('price-tracker-lite');
document.getElementById('proBtn').addEventListener('click', () => extpay.openPaymentPage());

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  const url = tab.url.split('?')[0];
  chrome.runtime.sendMessage({ type: 'GET_HISTORY', url }, history => {
    if (history && history.prices.length) {
      document.getElementById('empty').style.display = 'none';
      document.getElementById('currentView').style.display = 'block';
      const latest = history.prices[history.prices.length - 1];
      document.getElementById('price').textContent = '$' + latest.price.toFixed(2);
      document.getElementById('title').textContent = history.title || url;
      drawChart(history.prices);
    }
  });
  chrome.runtime.sendMessage({ type: 'GET_ALL_TRACKED' }, items => {
    if (!items || !items.length) return;
    document.getElementById('empty').style.display = 'none';
    const list = document.getElementById('trackedList');
    list.innerHTML = '<h3>Tracked Products (' + items.length + ')</h3>';
    items.slice(0, 10).forEach(item => {
      const latest = item.prices[item.prices.length - 1];
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.title || item.url}</span><span style="font-weight:600;margin-left:8px">$${latest.price.toFixed(2)}</span>`;
      list.appendChild(el);
    });
  });
});

function drawChart(prices) {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * 2;
  const H = canvas.height = 240;
  const pad = 20;
  const vals = prices.map(p => p.price);
  const min = Math.min(...vals) * 0.95;
  const max = Math.max(...vals) * 1.05;
  const range = max - min || 1;

  ctx.clearRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(102,126,234,.15)');
  grad.addColorStop(1, 'rgba(102,126,234,0)');

  ctx.beginPath();
  prices.forEach((p, i) => {
    const x = pad + (i / (prices.length - 1 || 1)) * (W - pad * 2);
    const y = pad + (1 - (p.price - min) / range) * (H - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#667eea'; ctx.lineWidth = 3; ctx.stroke();
  ctx.lineTo(pad + (W - pad * 2), H - pad);
  ctx.lineTo(pad, H - pad);
  ctx.fillStyle = grad; ctx.fill();
}
