const extpay = ExtPay('yt-analytics-pro');

async function init() {
  const user = await extpay.getUser();
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const banner = document.getElementById('pro-banner');

  if (user.paid) {
    dot.classList.remove('inactive');
    text.textContent = 'Pro Active';
    banner.classList.add('active');
    banner.querySelector('h3').textContent = '✅ Pro Active';
    banner.querySelector('p').textContent = 'All features unlocked';
    banner.style.cursor = 'default';
  } else {
    dot.classList.add('inactive');
    text.textContent = 'Free Plan';
    banner.addEventListener('click', () => extpay.openPaymentPage());
  }

  document.getElementById('open-studio').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studio.youtube.com' });
  });
}

init();
