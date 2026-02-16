/* Airbnb Host Power Tools — Popup Script */

let templates = null;
let isPro = false;
let editingType = null; // 'messages' or 'reviews'
let editingIndex = -1;  // -1 = new

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  templates = await sendMsg({ action: 'getTemplates' });
  const status = await sendMsg({ action: 'getProStatus' });
  isPro = status?.paid || false;

  document.getElementById('plan-badge').textContent = isPro ? 'Pro ✨' : 'Free';

  renderMessages();
  renderReviews();
  renderVariables();
  renderStats();
  setupTabs();
  setupEditor();
});

// ─── Tabs ──────────────────────────────────────────────────────────
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

// ─── Messages ──────────────────────────────────────────────────────
function renderMessages() {
  const list = document.getElementById('msg-list');
  const msgs = templates?.messages || [];
  const limit = isPro ? msgs.length : Math.min(msgs.length, 5);

  if (msgs.length === 0) {
    list.innerHTML = '<div class="empty-state">No message templates yet. Add one!</div>';
    return;
  }

  list.innerHTML = '';
  for (let i = 0; i < limit; i++) {
    const tpl = msgs[i];
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `
      <div class="tpl-name">
        <span>${esc(tpl.name)}</span>
        <span class="tpl-category">${esc(tpl.category || 'general')}</span>
      </div>
      <div class="tpl-preview">${esc(tpl.body.substring(0, 80))}...</div>
    `;
    item.addEventListener('click', () => openEditor('messages', i));
    list.appendChild(item);
  }

  if (!isPro && msgs.length > 5) {
    const upsell = document.createElement('div');
    upsell.className = 'template-item';
    upsell.style.textAlign = 'center';
    upsell.style.color = '#FF5A5F';
    upsell.innerHTML = `🚀 +${msgs.length - 5} more templates with Pro`;
    upsell.addEventListener('click', () => sendMsg({ action: 'openPaymentPage' }));
    list.appendChild(upsell);
  }

  document.getElementById('add-msg-btn').addEventListener('click', () => {
    if (!isPro && msgs.length >= 5) {
      sendMsg({ action: 'openPaymentPage' });
      return;
    }
    openEditor('messages', -1);
  });
}

// ─── Reviews ───────────────────────────────────────────────────────
function renderReviews() {
  const list = document.getElementById('review-list');
  const reviews = templates?.reviews || [];
  const limit = isPro ? reviews.length : Math.min(reviews.length, 3);

  if (reviews.length === 0) {
    list.innerHTML = '<div class="empty-state">No review templates yet. Add one!</div>';
    return;
  }

  list.innerHTML = '';
  for (let i = 0; i < limit; i++) {
    const tpl = reviews[i];
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `
      <div class="tpl-name"><span>${esc(tpl.name)}</span></div>
      <div class="tpl-preview">${esc(tpl.body.substring(0, 80))}...</div>
    `;
    item.addEventListener('click', () => openEditor('reviews', i));
    list.appendChild(item);
  }

  if (!isPro && reviews.length > 3) {
    const upsell = document.createElement('div');
    upsell.className = 'template-item';
    upsell.style.textAlign = 'center';
    upsell.style.color = '#FF5A5F';
    upsell.innerHTML = `🚀 +${reviews.length - 3} more with Pro`;
    upsell.addEventListener('click', () => sendMsg({ action: 'openPaymentPage' }));
    list.appendChild(upsell);
  }

  document.getElementById('add-review-btn').addEventListener('click', () => {
    if (!isPro && reviews.length >= 3) {
      sendMsg({ action: 'openPaymentPage' });
      return;
    }
    openEditor('reviews', -1);
  });
}

// ─── Variables ─────────────────────────────────────────────────────
function renderVariables() {
  const container = document.getElementById('var-fields');
  const vars = templates?.variables || {};
  const labels = {
    listing_name: '🏠 Listing Name',
    address: '📍 Address',
    access_instructions: '🔑 Access Instructions',
    checkin_time: '🕐 Check-in Time',
    checkout_time: '🕐 Check-out Time',
    wifi_name: '📶 WiFi Name',
    wifi_password: '🔒 WiFi Password',
    parking_instructions: '🚗 Parking Instructions',
    transit_info: '🚌 Transit Info',
    landmarks: '🏔️ Landmarks',
    key_return_instructions: '🔑 Key Return'
  };

  container.innerHTML = '';
  for (const [key, label] of Object.entries(labels)) {
    const group = document.createElement('div');
    group.className = 'var-group';
    group.innerHTML = `
      <label>${label}</label>
      <input type="text" data-var="${key}" value="${esc(vars[key] || '')}">
    `;
    container.appendChild(group);
  }

  document.getElementById('save-vars').addEventListener('click', async () => {
    const inputs = container.querySelectorAll('input[data-var]');
    const newVars = {};
    inputs.forEach(input => {
      newVars[input.dataset.var] = input.value;
    });
    templates.variables = newVars;
    await sendMsg({ action: 'saveTemplates', templates });
    const btn = document.getElementById('save-vars');
    btn.textContent = 'Saved! ✅';
    setTimeout(() => { btn.textContent = 'Save Variables'; }, 1500);
  });
}

// ─── Stats ─────────────────────────────────────────────────────────
async function renderStats() {
  const stats = await sendMsg({ action: 'getStats' });
  const area = document.getElementById('stats-area');
  const daysSinceInstall = stats.installDate ? Math.floor((Date.now() - stats.installDate) / 86400000) : 0;

  area.innerHTML = `
    <div class="stat-row"><span>Messages sent via templates</span><span class="stat-value">${stats.totalMessagesSent || 0}</span></div>
    <div class="stat-row"><span>Reviews responded</span><span class="stat-value">${stats.totalReviewsResponded || 0}</span></div>
    <div class="stat-row"><span>Templates created</span><span class="stat-value">${(templates?.messages?.length || 0) + (templates?.reviews?.length || 0)}</span></div>
    <div class="stat-row"><span>Days since install</span><span class="stat-value">${daysSinceInstall}</span></div>
    <div class="stat-row"><span>Plan</span><span class="stat-value">${isPro ? 'Pro ✨' : 'Free'}</span></div>
  `;

  const upgradeArea = document.getElementById('upgrade-area');
  if (!isPro) {
    upgradeArea.innerHTML = `<button class="btn btn-upgrade btn-block" id="upgrade-btn">🚀 Upgrade to Pro — $14.99/mo</button>
    <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--text-muted);">Unlimited templates · Pricing analytics · Calendar tools · Auto-responses</div>`;
    document.getElementById('upgrade-btn').addEventListener('click', () => {
      sendMsg({ action: 'openPaymentPage' });
    });
  } else {
    upgradeArea.innerHTML = '<div style="text-align:center;color:var(--success);font-weight:600;">You\'re on Pro! Thank you for your support ❤️</div>';
  }
}

// ─── Editor ────────────────────────────────────────────────────────
function setupEditor() {
  document.getElementById('editor-back').addEventListener('click', closeEditor);
  document.getElementById('editor-save').addEventListener('click', saveEditor);
  document.getElementById('editor-delete').addEventListener('click', deleteEditor);
}

function openEditor(type, index) {
  editingType = type;
  editingIndex = index;
  const editor = document.getElementById('editor');
  const title = document.getElementById('editor-title');
  const nameInput = document.getElementById('editor-name');
  const bodyInput = document.getElementById('editor-body');
  const deleteBtn = document.getElementById('editor-delete');

  if (index === -1) {
    title.textContent = 'New Template';
    nameInput.value = '';
    bodyInput.value = '';
    deleteBtn.style.display = 'none';
  } else {
    const tpl = templates[type][index];
    title.textContent = 'Edit Template';
    nameInput.value = tpl.name || '';
    bodyInput.value = tpl.body || '';
    deleteBtn.style.display = 'inline-block';
  }

  editor.classList.add('open');
}

function closeEditor() {
  document.getElementById('editor').classList.remove('open');
}

async function saveEditor() {
  const name = document.getElementById('editor-name').value.trim();
  const body = document.getElementById('editor-body').value.trim();
  if (!name || !body) return;

  const arr = templates[editingType] || [];

  if (editingIndex === -1) {
    arr.push({ id: `custom-${Date.now()}`, name, body, category: 'custom' });
  } else {
    arr[editingIndex].name = name;
    arr[editingIndex].body = body;
  }

  templates[editingType] = arr;
  await sendMsg({ action: 'saveTemplates', templates });

  closeEditor();
  if (editingType === 'messages') renderMessages();
  else renderReviews();
}

async function deleteEditor() {
  if (editingIndex < 0) return;
  templates[editingType].splice(editingIndex, 1);
  await sendMsg({ action: 'saveTemplates', templates });
  closeEditor();
  if (editingType === 'messages') renderMessages();
  else renderReviews();
}

// ─── Helpers ───────────────────────────────────────────────────────
function sendMsg(msg) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(msg, resolve);
  });
}

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str || '';
  return el.innerHTML;
}
