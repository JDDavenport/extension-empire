/* Tab Master Pro — Popup */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const send = (msg) => chrome.runtime.sendMessage(msg);

let isPro = false;

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  await checkPro();
  await loadSessions();
  await loadRamSaved();
  loadAutoSuspend();
});

// ─── Navigation ───
function initNav() {
  $$('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav button').forEach(b => b.classList.remove('active'));
      $$('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#panel-${btn.dataset.panel}`).classList.add('active');
      
      // Load panel data on switch
      const p = btn.dataset.panel;
      if (p === 'tabs') loadTabs();
      else if (p === 'suspend') loadSuspendPanel();
      else if (p === 'dupes') loadDupes();
      else if (p === 'timeline') loadTimeline();
      else if (p === 'sessions') loadSessions();
      else if (p === 'pro') loadProPanel();
    });
  });
}

// ─── Pro ───
async function checkPro() {
  const res = await send({ action: 'getProStatus' });
  isPro = res?.isPro || false;
}

// ─── Sessions ───
$('#saveBtn').addEventListener('click', async () => {
  const name = $('#sessionName').value.trim();
  if (!name) {
    $('#sessionName').value = '';
    $('#sessionName').placeholder = 'Enter a name first!';
    return;
  }
  await send({ action: 'saveSession', name });
  $('#sessionName').value = '';
  await loadSessions();
});

$('#sessionName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#saveBtn').click();
});

async function loadSessions() {
  const sessions = await send({ action: 'getSessions' });
  const el = $('#sessionList');
  const entries = Object.entries(sessions || {})
    .filter(([k]) => k !== '__autosave__')
    .sort((a, b) => b[1].created - a[1].created);

  if (entries.length === 0) {
    el.innerHTML = '<div class="empty fade-in"><div class="empty-icon">📁</div><p>No saved sessions yet.<br>Save your current tabs!</p></div>';
    return;
  }

  el.innerHTML = entries.map(([name, s]) => `
    <div class="session-item fade-in" data-name="${esc(name)}">
      <div>
        <div class="session-name">${esc(name)}</div>
        <div class="session-meta">${s.tabs.length} tabs · ${timeAgo(s.created)}</div>
      </div>
      <div class="session-actions">
        <button class="restore" title="Restore" data-name="${esc(name)}">▶️</button>
        <button class="delete" title="Delete" data-name="${esc(name)}">🗑️</button>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('.restore').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await send({ action: 'restoreSession', name: btn.dataset.name });
    });
  });

  el.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await send({ action: 'deleteSession', name: btn.dataset.name });
      await loadSessions();
    });
  });
}

// ─── Tab Search ───
let searchTimeout;
$('#tabSearch').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadTabs($('#tabSearch').value), 100);
});

async function loadTabs(query = '') {
  const tabs = await send({ action: 'searchTabs', query });
  const el = $('#tabList');

  if (!tabs || tabs.length === 0) {
    el.innerHTML = '<div class="empty fade-in"><div class="empty-icon">🔍</div><p>No tabs found</p></div>';
    return;
  }

  el.innerHTML = tabs.slice(0, 100).map(t => `
    <div class="tab-item fade-in" data-tab-id="${t.id}">
      ${t.favIconUrl ? `<img src="${esc(t.favIconUrl)}" onerror="this.style.display='none'">` : '<div class="tab-icon">🌐</div>'}
      <div class="tab-title" title="${esc(t.title)}">${esc(t.title)}</div>
      <div class="tab-url">${esc(shortUrl(t.url))}</div>
      <button class="tab-close" data-tab-id="${t.id}">✕</button>
    </div>
  `).join('');

  el.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.tabId);
      chrome.tabs.update(id, { active: true });
      chrome.windows.update(0, { focused: true }); // best effort
    });
  });

  el.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.tabs.remove(parseInt(btn.dataset.tabId));
      await loadTabs($('#tabSearch').value);
    });
  });
}

// ─── Suspend ───
$('#suspendBtn').addEventListener('click', async () => {
  $('#suspendBtn').textContent = '⏳ Suspending...';
  const res = await send({ action: 'suspendTabs' });
  $('#suspendBtn').textContent = `✅ Suspended ${res?.count || 0} tabs!`;
  setTimeout(() => { $('#suspendBtn').textContent = '💤 Suspend Inactive Tabs'; }, 2000);
  await loadSuspendPanel();
  await loadRamSaved();
});

async function loadSuspendPanel() {
  const res = await send({ action: 'getRamSaved' });
  const ram = res?.ramSaved || 0;
  $('#ramSaved').textContent = formatBytes(ram);
  $('#suspendCount').textContent = Math.round(ram / (50 * 1024 * 1024));
}

async function loadRamSaved() {
  const res = await send({ action: 'getRamSaved' });
  const ram = res?.ramSaved || 0;
  $('#ramBadge').textContent = `${formatBytes(ram)} saved`;
}

async function loadAutoSuspend() {
  const { autoSuspend } = await chrome.storage.local.get('autoSuspend');
  $('#autoSuspendToggle').checked = !!autoSuspend;
}

$('#autoSuspendToggle').addEventListener('change', async () => {
  await send({ action: 'toggleAutoSuspend', enabled: $('#autoSuspendToggle').checked });
});

// ─── Duplicates ───
$('#closeDupesBtn').addEventListener('click', async () => {
  const closed = await send({ action: 'closeDuplicates' });
  $('#closeDupesBtn').textContent = `✅ Closed ${closed || 0} duplicates!`;
  setTimeout(() => { $('#closeDupesBtn').textContent = '🗑️ Close All Duplicates'; }, 2000);
  await loadDupes();
});

async function loadDupes() {
  const dupes = await send({ action: 'findDuplicates' });
  const el = $('#dupeList');

  if (!dupes || dupes.length === 0) {
    el.innerHTML = '<div class="empty fade-in"><div class="empty-icon">✨</div><p>No duplicates found!</p></div>';
    return;
  }

  el.innerHTML = dupes.map(d => `
    <div class="dupe-group fade-in">
      <div class="dupe-group-header">
        <div class="tab-title" style="flex:1;">${esc(shortUrl(d.url))}</div>
        <span class="dupe-count">${d.tabs.length}×</span>
      </div>
      ${d.tabs.map(t => `
        <div class="tab-item" data-tab-id="${t.id}" style="margin-left:8px;">
          ${t.favIconUrl ? `<img src="${esc(t.favIconUrl)}" onerror="this.style.display='none'">` : ''}
          <div class="tab-title">${esc(t.title)}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ─── Timeline ───
async function loadTimeline() {
  const events = await send({ action: 'getTimeline' });
  const el = $('#timelineList');

  if (!events || events.length === 0) {
    el.innerHTML = '<div class="empty fade-in"><div class="empty-icon">📊</div><p>No tab activity today yet</p></div>';
    return;
  }

  const reversed = [...events].reverse().slice(0, 50);
  el.innerHTML = reversed.map(e => `
    <div class="timeline-item fade-in">
      <div class="timeline-time">${formatTime(e.timestamp)}</div>
      <div>
        <div class="timeline-title">${esc(e.title || e.url)}</div>
        <div class="timeline-action">${e.action}</div>
      </div>
    </div>
  `).join('');
}

// ─── Pro Panel ───
async function loadProPanel() {
  await checkPro();
  if (isPro) {
    $('#proBanner').style.display = 'none';
    $('#proFeatures').style.display = 'block';
    await loadSchedulePanel();
  } else {
    $('#proBanner').style.display = 'block';
    $('#proFeatures').style.display = 'none';
  }
}

$('#upgradeBtn').addEventListener('click', () => send({ action: 'openPayment' }));

$('#autoGroupBtn')?.addEventListener('click', async () => {
  $('#autoGroupBtn').textContent = '⏳ Grouping...';
  const res = await send({ action: 'autoGroup' });
  if (res?.error) {
    $('#autoGroupBtn').textContent = '❌ Pro required';
  } else {
    $('#autoGroupBtn').textContent = `✅ Grouped ${res?.grouped || 0} tabs!`;
  }
  setTimeout(() => { $('#autoGroupBtn').textContent = '🎨 Auto-Group by Domain'; }, 2000);
});

$('#addScheduleBtn')?.addEventListener('click', async () => {
  const name = $('#schedSessionSelect').value;
  const time = $('#schedTime').value;
  if (!name || !time) return;
  await send({ action: 'scheduleSession', name, time });
  await loadSchedulePanel();
});

async function loadSchedulePanel() {
  // Populate session select
  const sessions = await send({ action: 'getSessions' });
  const sel = $('#schedSessionSelect');
  sel.innerHTML = Object.keys(sessions || {})
    .filter(k => k !== '__autosave__')
    .map(k => `<option value="${esc(k)}">${esc(k)}</option>`)
    .join('');

  // Load scheduled
  const scheduled = await send({ action: 'getScheduled' });
  const el = $('#scheduleList');
  if (!scheduled || scheduled.length === 0) {
    el.innerHTML = '<div class="empty"><p>No scheduled sessions</p></div>';
    return;
  }
  el.innerHTML = scheduled.map((s, i) => `
    <div class="schedule-item fade-in">
      <div>
        <div class="schedule-time">${esc(s.time)}</div>
        <div class="schedule-name">${esc(s.name)}</div>
      </div>
      <button class="btn btn-small btn-secondary" data-idx="${i}">Remove</button>
    </div>
  `).join('');

  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      await send({ action: 'removeScheduled', index: parseInt(btn.dataset.idx) });
      await loadSchedulePanel();
    });
  });
}

// ─── Utilities ───
function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 1 ? u.pathname.substring(0, 30) : '');
  } catch { return url || ''; }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return '0 MB';
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}
