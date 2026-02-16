(function() {
  if (document.getElementById('rt-badge')) return;

  const article = document.querySelector('article') || document.querySelector('[role="main"]') || document.body;
  const text = article.innerText || '';
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  if (words < 100) return; // Not an article

  const wpm = 238;
  const minutes = Math.ceil(words / wpm);
  const timeText = minutes < 1 ? '< 1 min' : `${minutes} min read`;

  // Badge on icon
  chrome.runtime.sendMessage({ type: 'SET_BADGE', text: `${minutes}m` });

  // Inject badge on page
  const badge = document.createElement('div');
  badge.id = 'rt-badge';
  badge.innerHTML = `⏱️ ${timeText} · ${words.toLocaleString()} words`;

  const style = document.createElement('style');
  style.textContent = `
    #rt-badge {
      position: fixed; top: 10px; right: 10px; z-index: 2147483646;
      background: #4CAF50; color: #fff; padding: 6px 14px;
      border-radius: 20px; font: 600 12px -apple-system, system-ui, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,.15); opacity: 0.95;
      transition: opacity .3s;
    }
    #rt-badge:hover { opacity: 0.3; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(badge);

  // Auto-hide after 5s
  setTimeout(() => { badge.style.opacity = '0.3'; }, 5000);
})();
