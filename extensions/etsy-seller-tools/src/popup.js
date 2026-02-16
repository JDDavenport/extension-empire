/* Etsy Seller Power Tools — Popup */

let isPro = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Check pro status
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'checkPro' });
    isPro = resp?.isPro || false;
  } catch (e) {}

  updatePlanUI();
  loadSettings();
  loadTemplates();
  setupTabs();
  setupKeywords();
  setupCompetitor();
  setupSettings();
  setupUpgradeButtons();
});

// ── Tabs ──
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ── Plan UI ──
function updatePlanUI() {
  const badge = document.getElementById('plan-badge');
  const status = document.getElementById('plan-status');
  const upgradeBtn = document.getElementById('upgrade-btn');

  if (isPro) {
    badge.textContent = 'Pro';
    badge.classList.add('pro');
    status.textContent = 'Plan: Pro ✅';
    upgradeBtn.style.display = 'none';
    document.getElementById('keyword-pro-gate').style.display = 'none';
    document.getElementById('template-pro-gate').style.display = 'none';
  } else {
    badge.textContent = 'Free';
    badge.classList.remove('pro');
  }
}

// ── Keywords ──
function setupKeywords() {
  document.getElementById('keyword-analyze').addEventListener('click', async () => {
    if (!isPro) {
      document.getElementById('keyword-pro-gate').style.display = 'block';
      return;
    }

    const input = document.getElementById('keyword-input').value.trim();
    if (!input) return;

    const keywords = input.split('\n').filter(Boolean);
    const btn = document.getElementById('keyword-analyze');
    btn.textContent = 'Analyzing...';
    btn.disabled = true;

    try {
      const results = await chrome.runtime.sendMessage({ action: 'analyzeKeywords', keywords });
      renderKeywordResults(results);
    } catch (e) {
      document.getElementById('keyword-results').innerHTML = '<p class="error">Analysis failed. Try again.</p>';
    }

    btn.textContent = 'Analyze Keywords';
    btn.disabled = false;
  });
}

function renderKeywordResults(results) {
  const container = document.getElementById('keyword-results');
  if (!results || !results.length) {
    container.innerHTML = '<p class="empty">No results</p>';
    return;
  }

  let html = '<table class="results-table"><thead><tr><th>Keyword</th><th>Score</th><th>Volume</th><th>Competition</th></tr></thead><tbody>';
  results.forEach(r => {
    const color = r.score >= 70 ? 'good' : r.score >= 40 ? 'ok' : 'bad';
    html += `<tr>
      <td><strong>${escHtml(r.keyword)}</strong><br><small class="tip">${escHtml(r.tip)}</small></td>
      <td class="score ${color}">${r.score}</td>
      <td>${r.estimatedVolume.toLocaleString()}</td>
      <td>${r.competition}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ── Competitor ──
function setupCompetitor() {
  updateCompetitorRemaining();

  document.getElementById('competitor-search').addEventListener('click', async () => {
    const input = document.getElementById('competitor-input').value.trim();
    if (!input) return;

    const btn = document.getElementById('competitor-search');
    btn.textContent = 'Checking...';
    btn.disabled = true;

    const limitCheck = await chrome.runtime.sendMessage({ action: 'checkCompetitorLimit' });

    if (!limitCheck.allowed) {
      document.getElementById('competitor-results').innerHTML = `
        <div class="pro-gate">
          <p>🔒 Daily free limit reached (3/day)</p>
          <button class="btn btn-upgrade" onclick="upgrade()">Upgrade for unlimited — $14.99/mo</button>
        </div>`;
      btn.textContent = 'Analyze Shop';
      btn.disabled = false;
      return;
    }

    // Scrape shop data (simulated since we can't directly access Etsy API)
    const shopName = input.replace(/https?:\/\/(www\.)?etsy\.com\/shop\//i, '').replace(/\//g, '');
    renderCompetitorResults(shopName, limitCheck.remaining);

    btn.textContent = 'Analyze Shop';
    btn.disabled = false;
    updateCompetitorRemaining();
  });
}

function renderCompetitorResults(shopName, remaining) {
  const container = document.getElementById('competitor-results');
  container.innerHTML = `
    <div class="competitor-card">
      <h3>🏪 ${escHtml(shopName)}</h3>
      <p class="competitor-note">Visit <a href="https://www.etsy.com/shop/${encodeURIComponent(shopName)}" target="_blank">the shop page</a> with our extension active to see:</p>
      <ul class="feature-list">
        <li>📊 Bestseller rankings</li>
        <li>💰 Price range analysis</li>
        <li>⭐ Review velocity (reviews/month)</li>
        <li>🏷️ Tag strategy analysis</li>
        <li>📈 Estimated monthly revenue</li>
      </ul>
      <p class="tip">Open the shop in a new tab — our content script will overlay detailed analytics.</p>
    </div>`;
}

async function updateCompetitorRemaining() {
  const data = await chrome.storage.local.get(['competitorLookupsToday', 'competitorLookupDate']);
  const today = new Date().toDateString();
  let used = data.competitorLookupsToday || 0;
  if (data.competitorLookupDate !== today) used = 0;
  const remaining = isPro ? '∞' : `${3 - used}`;
  document.getElementById('competitor-remaining').textContent = `Lookups remaining today: ${remaining}`;
}

// ── Templates ──
async function loadTemplates() {
  const templates = await chrome.runtime.sendMessage({ action: 'getTemplates' });
  renderTemplates(templates || []);
}

function renderTemplates(templates) {
  const container = document.getElementById('templates-list');
  if (!templates.length) {
    container.innerHTML = '<p class="empty">No templates yet</p>';
    return;
  }

  container.innerHTML = templates.map((t, i) => `
    <div class="template-card">
      <div class="template-header">
        <strong>${escHtml(t.name)}</strong>
        <button class="btn-copy" data-idx="${i}" title="Copy to clipboard">📋</button>
      </div>
      <p class="template-text">${escHtml(t.text)}</p>
    </div>
  `).join('');

  container.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      navigator.clipboard.writeText(templates[idx].text);
      btn.textContent = '✅';
      setTimeout(() => btn.textContent = '📋', 1500);
    });
  });
}

document.getElementById('add-template')?.addEventListener('click', async () => {
  if (!isPro) {
    const templates = await chrome.runtime.sendMessage({ action: 'getTemplates' });
    if (templates && templates.length >= 5) {
      document.getElementById('template-pro-gate').style.display = 'block';
      return;
    }
  }

  const name = prompt('Template name:');
  if (!name) return;
  const text = prompt('Template text:');
  if (!text) return;

  const templates = await chrome.runtime.sendMessage({ action: 'getTemplates' }) || [];
  templates.push({ name, text });
  await chrome.runtime.sendMessage({ action: 'saveTemplates', templates });
  renderTemplates(templates);
});

// ── Settings ──
async function loadSettings() {
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  if (settings) {
    document.getElementById('setting-notifications').checked = settings.notifications;
    document.getElementById('setting-renewal-days').value = settings.renewalAlertDays || 7;
  }
}

function setupSettings() {
  document.getElementById('save-settings').addEventListener('click', async () => {
    const settings = {
      notifications: document.getElementById('setting-notifications').checked,
      renewalAlertDays: parseInt(document.getElementById('setting-renewal-days').value)
    };
    await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
    const btn = document.getElementById('save-settings');
    btn.textContent = 'Saved ✅';
    setTimeout(() => btn.textContent = 'Save Settings', 1500);
  });
}

// ── Upgrade ──
function setupUpgradeButtons() {
  const upgradeIds = ['upgrade-btn', 'upgrade-keywords', 'upgrade-templates'];
  upgradeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', upgrade);
  });
}

function upgrade() {
  chrome.runtime.sendMessage({ action: 'openPayment' });
}

// ── Utility ──
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
