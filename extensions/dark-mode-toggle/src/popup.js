const extpay = ExtPay('dark-mode-toggle');
document.getElementById('proBtn').addEventListener('click', () => extpay.openPaymentPage());

const btn = document.getElementById('toggleBtn');
const status = document.getElementById('status');

chrome.runtime.sendMessage({ type: 'GET_STATE' }, state => {
  if (state && state.enabled) {
    btn.classList.add('on');
    btn.textContent = '☀️';
    status.textContent = 'ON — Dark mode active';
  }
});

btn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'TOGGLE_DARK' }, state => {
    if (state && state.enabled) {
      btn.classList.add('on');
      btn.textContent = '☀️';
      status.textContent = 'ON — Dark mode active';
    } else {
      btn.classList.remove('on');
      btn.textContent = '🌙';
      status.textContent = 'OFF';
    }
  });
});
