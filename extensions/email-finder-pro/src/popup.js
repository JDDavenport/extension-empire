/* Email Finder Pro — Popup */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ── Tabs ──
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.tab-content').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $(`#tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'contacts') loadContacts();
  });
});

// ── Init ──
async function init() {
  const resp = await chrome.runtime.sendMessage({ action: 'checkAccess' });
  if (resp.pro) {
    $('#plan-badge').textContent = 'Pro';
    $('#plan-badge').className = 'badge badge-pro';
    $('#usage-text').textContent = 'Unlimited';
    $('#pro-status').style.display = 'block';
    $('#btn-upgrade').style.display = 'none';
  } else {
    $('#usage-text').textContent = `${resp.remaining} lookups left today`;
    $('#btn-upgrade').style.display = 'block';
    $('#pro-status').style.display = 'none';
  }
}

// ── Finder ──
$('#btn-find').addEventListener('click', async () => {
  const firstName = $('#inp-first').value.trim();
  const lastName = $('#inp-last').value.trim();
  const domain = $('#inp-domain').value.trim();
  const resultsEl = $('#finder-results');

  if (!firstName || !lastName || !domain) {
    resultsEl.innerHTML = '<p class="error">Please fill all fields</p>';
    return;
  }

  $('#btn-find').disabled = true;
  $('#btn-find').textContent = '⏳ Searching...';

  const resp = await chrome.runtime.sendMessage({ action: 'lookup', firstName, lastName, domain });

  if (resp.error === 'limit') {
    resultsEl.innerHTML = `<p class="error">Daily limit reached. <a href="#" id="popup-upgrade">Upgrade to Pro</a></p>`;
    $('#popup-upgrade').addEventListener('click', e => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openPayment' });
    });
  } else {
    let html = '';
    if (resp.mx && resp.mx.valid) {
      html += `<div class="mx-ok">✅ MX verified: ${domain}</div>`;
    } else {
      html += `<div class="mx-warn">⚠️ No mail server for ${domain}</div>`;
    }
    (resp.emails || []).forEach((email, i) => {
      const conf = i === 0 ? 'High' : i < 3 ? 'Medium' : 'Low';
      const cls = i === 0 ? 'high' : i < 3 ? 'med' : 'low';
      html += `
        <div class="email-row">
          <span class="email-addr">${email}</span>
          <span class="conf conf-${cls}">${conf}</span>
          <button class="icon-btn copy-btn" data-email="${email}" title="Copy">📋</button>
          <button class="icon-btn save-btn" data-email="${email}" title="Save">💾</button>
        </div>`;
    });
    if (resp.remaining !== undefined && resp.remaining !== Infinity) {
      html += `<p class="muted center">${resp.remaining} lookups remaining today</p>`;
    }
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.email);
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📋', 1200);
      });
    });

    resultsEl.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({
          action: 'saveContact',
          contact: {
            name: `${firstName} ${lastName}`,
            firstName, lastName, email: btn.dataset.email,
            domain, source: 'manual'
          }
        });
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '💾', 1200);
      });
    });
  }

  $('#btn-find').disabled = false;
  $('#btn-find').textContent = '🔍 Find Email';
  init(); // refresh usage
});

// ── Contacts ──
async function loadContacts(query) {
  const contacts = await chrome.runtime.sendMessage({ action: 'getContacts', query: query || '' });
  const listEl = $('#contacts-list');
  const emptyEl = $('#contacts-empty');

  if (!contacts || contacts.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  listEl.innerHTML = contacts.map(c => `
    <div class="contact-card" data-id="${c.id}">
      <div class="contact-main">
        <div class="contact-name">${c.name || 'Unknown'}</div>
        <div class="contact-meta">${c.title || ''} ${c.company ? '@ ' + c.company : ''}</div>
        <div class="contact-email">${c.email || 'No email'}</div>
      </div>
      <div class="contact-actions">
        <button class="icon-btn copy-contact" data-email="${c.email || ''}" title="Copy email">📋</button>
        <button class="icon-btn delete-contact" data-id="${c.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.copy-contact').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.email) {
        navigator.clipboard.writeText(btn.dataset.email);
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📋', 1200);
      }
    });
  });

  listEl.querySelectorAll('.delete-contact').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'deleteContact', id: btn.dataset.id });
      loadContacts($('#contact-search').value);
    });
  });
}

$('#contact-search').addEventListener('input', e => loadContacts(e.target.value));

// ── CSV Export ──
$('#btn-export').addEventListener('click', async () => {
  const resp = await chrome.runtime.sendMessage({ action: 'isPro' });
  if (!resp.pro) {
    chrome.runtime.sendMessage({ action: 'openPayment' });
    return;
  }
  const contacts = await chrome.runtime.sendMessage({ action: 'getContacts' });
  if (!contacts || !contacts.length) return;

  const headers = ['Name', 'Email', 'Title', 'Company', 'Domain', 'Source', 'Profile URL'];
  const rows = contacts.map(c => [
    c.name, c.email, c.title, c.company, c.domain, c.source, c.profileUrl
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email-finder-contacts-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Settings ──
$('#btn-upgrade').addEventListener('click', () => chrome.runtime.sendMessage({ action: 'openPayment' }));

$('#btn-clear').addEventListener('click', async () => {
  if (confirm('Delete all saved contacts? This cannot be undone.')) {
    await chrome.storage.local.set({ contacts: [] });
    loadContacts();
  }
});

$('#btn-scan-page').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const emails = new Set();
        // mailto links
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          const email = a.href.replace('mailto:', '').split('?')[0].trim();
          if (email.includes('@')) emails.add(email.toLowerCase());
        });
        // regex scan body text
        const text = document.body.innerText;
        const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          const e = m[0].toLowerCase();
          if (!e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.gif'))
            emails.add(e);
        }
        return [...emails];
      }
    });
    const emails = results[0]?.result || [];
    const scanEl = $('#scan-results');
    if (emails.length === 0) {
      scanEl.innerHTML = '<p class="muted">No emails found on this page.</p>';
    } else {
      scanEl.innerHTML = emails.map(e => `
        <div class="email-row">
          <span class="email-addr">${e}</span>
          <button class="icon-btn copy-btn" data-email="${e}">📋</button>
          <button class="icon-btn save-btn" data-email="${e}">💾</button>
        </div>
      `).join('');
      scanEl.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.email);
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1200);
        });
      });
      scanEl.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await chrome.runtime.sendMessage({
            action: 'saveContact',
            contact: { email: btn.dataset.email, source: 'web-scan', name: btn.dataset.email.split('@')[0] }
          });
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '💾', 1200);
        });
      });
    }
  } catch (e) {
    $('#scan-results').innerHTML = `<p class="error">Cannot scan this page. Try granting permission.</p>`;
  }
});

init();
