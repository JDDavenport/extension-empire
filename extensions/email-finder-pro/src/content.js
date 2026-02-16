/* Email Finder Pro — LinkedIn Content Script */

(function () {
  'use strict';

  const WIDGET_ID = 'efp-widget';
  let currentUrl = location.href;

  // ── LinkedIn profile data extraction ──
  function extractProfileData() {
    try {
      const nameEl = document.querySelector('h1.text-heading-xlarge') ||
                     document.querySelector('.pv-top-card--list li') ||
                     document.querySelector('h1');
      const titleEl = document.querySelector('.text-body-medium.break-words') ||
                      document.querySelector('.pv-top-card--list .text-body-medium');
      const companyEl = document.querySelector('[aria-label*="Current company"]') ||
                        document.querySelector('.pv-top-card--experience-list-item') ||
                        document.querySelector('.experience-item .pv-entity__secondary-title');

      const fullName = nameEl ? nameEl.textContent.trim() : '';
      const parts = fullName.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const title = titleEl ? titleEl.textContent.trim() : '';

      let company = '';
      if (companyEl) {
        company = companyEl.textContent.trim();
      }
      // Fallback: try experience section
      if (!company) {
        const expEl = document.querySelector('#experience ~ .pvs-list__outer-container .hoverable-link-text span[aria-hidden="true"]');
        if (expEl) company = expEl.textContent.trim();
      }

      const profileUrl = location.href.split('?')[0];

      return { firstName, lastName, fullName, title, company, profileUrl };
    } catch (e) {
      console.error('EFP: extraction error', e);
      return null;
    }
  }

  function inferDomain(company) {
    if (!company) return '';
    // Clean common suffixes and guess domain
    const clean = company.replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|Group|Holdings|International|GmbH|S\.A\.?|PLC)$/gi, '').trim();
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 30);
    return slug + '.com';
  }

  // ── Extract from LinkedIn search results (bulk) ──
  function extractSearchResults() {
    const cards = document.querySelectorAll('.entity-result__item, .reusable-search__result-container');
    const people = [];
    cards.forEach(card => {
      const nameEl = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
                     card.querySelector('.entity-result__title-text a');
      const subtitleEl = card.querySelector('.entity-result__primary-subtitle');
      const secondaryEl = card.querySelector('.entity-result__secondary-subtitle');

      if (!nameEl) return;
      const fullName = nameEl.textContent.trim().replace(/\s+/g, ' ');
      const parts = fullName.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const title = subtitleEl ? subtitleEl.textContent.trim() : '';
      const location = secondaryEl ? secondaryEl.textContent.trim() : '';

      // Try to get company from subtitle
      let company = '';
      if (title.includes(' at ')) {
        company = title.split(' at ').pop().trim();
      } else if (title.includes(' @ ')) {
        company = title.split(' @ ').pop().trim();
      }

      const link = card.querySelector('.entity-result__title-text a');
      const profileUrl = link ? link.href.split('?')[0] : '';

      people.push({ firstName, lastName, fullName, title, company, location, profileUrl, domain: inferDomain(company) });
    });
    return people;
  }

  // ── Floating widget on LinkedIn profiles ──
  function createWidget(profile) {
    removeWidget();
    const w = document.createElement('div');
    w.id = WIDGET_ID;
    w.innerHTML = `
      <div class="efp-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>Email Finder Pro</span>
        <button class="efp-close" id="efp-close">×</button>
      </div>
      <div class="efp-body">
        <div class="efp-name">${profile.fullName}</div>
        <div class="efp-meta">${profile.title}</div>
        <div class="efp-meta">${profile.company}</div>
        <div class="efp-domain-row">
          <label>Domain:</label>
          <input type="text" id="efp-domain" value="${inferDomain(profile.company)}" placeholder="company.com" />
        </div>
        <button class="efp-btn efp-btn-primary" id="efp-find">🔍 Find Email</button>
        <div id="efp-results" class="efp-results" style="display:none;"></div>
        <div id="efp-status" class="efp-status"></div>
      </div>
    `;
    document.body.appendChild(w);

    document.getElementById('efp-close').addEventListener('click', removeWidget);
    document.getElementById('efp-find').addEventListener('click', () => findEmails(profile));
  }

  function removeWidget() {
    const el = document.getElementById(WIDGET_ID);
    if (el) el.remove();
  }

  async function findEmails(profile) {
    const domain = document.getElementById('efp-domain').value.trim();
    const statusEl = document.getElementById('efp-status');
    const resultsEl = document.getElementById('efp-results');
    const btn = document.getElementById('efp-find');

    if (!domain) { statusEl.textContent = 'Enter a domain'; return; }

    btn.disabled = true;
    btn.textContent = '⏳ Searching...';
    statusEl.textContent = '';
    resultsEl.style.display = 'none';

    try {
      const resp = await chrome.runtime.sendMessage({
        action: 'lookup',
        firstName: profile.firstName,
        lastName: profile.lastName,
        domain
      });

      if (resp.error === 'limit') {
        statusEl.innerHTML = '⚡ Daily limit reached. <a href="#" id="efp-upgrade">Upgrade to Pro</a>';
        document.getElementById('efp-upgrade').addEventListener('click', e => {
          e.preventDefault();
          chrome.runtime.sendMessage({ action: 'openPayment' });
        });
        btn.disabled = false;
        btn.textContent = '🔍 Find Email';
        return;
      }

      const mxValid = resp.mx && resp.mx.valid;
      let html = '';
      if (mxValid) {
        html += `<div class="efp-mx">✅ Mail server verified for ${domain}</div>`;
      } else {
        html += `<div class="efp-mx efp-mx-warn">⚠️ No mail server found for ${domain}</div>`;
      }

      html += '<div class="efp-email-list">';
      (resp.emails || []).forEach((email, i) => {
        const conf = i === 0 ? 'High' : i < 3 ? 'Medium' : 'Low';
        const confClass = i === 0 ? 'high' : i < 3 ? 'med' : 'low';
        html += `
          <div class="efp-email-row">
            <span class="efp-email">${email}</span>
            <span class="efp-conf efp-conf-${confClass}">${conf}</span>
            <button class="efp-btn-sm efp-copy" data-email="${email}">📋</button>
            <button class="efp-btn-sm efp-save" data-email="${email}">💾</button>
          </div>`;
      });
      html += '</div>';

      if (resp.remaining !== undefined && resp.remaining !== Infinity) {
        html += `<div class="efp-remaining">${resp.remaining} lookups remaining today</div>`;
      }

      resultsEl.innerHTML = html;
      resultsEl.style.display = 'block';

      // Copy handlers
      resultsEl.querySelectorAll('.efp-copy').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.email);
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      });

      // Save handlers
      resultsEl.querySelectorAll('.efp-save').forEach(btn => {
        btn.addEventListener('click', async () => {
          await chrome.runtime.sendMessage({
            action: 'saveContact',
            contact: {
              name: profile.fullName,
              firstName: profile.firstName,
              lastName: profile.lastName,
              title: profile.title,
              company: profile.company,
              email: btn.dataset.email,
              domain,
              profileUrl: profile.profileUrl,
              source: 'linkedin'
            }
          });
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '💾', 1500);
        });
      });

    } catch (e) {
      statusEl.textContent = 'Error: ' + e.message;
    }

    btn.disabled = false;
    btn.textContent = '🔍 Find Email';
  }

  // ── Bulk extract button for search pages ──
  function injectBulkButton() {
    if (document.getElementById('efp-bulk-btn')) return;
    const container = document.querySelector('.search-results-container') ||
                      document.querySelector('.scaffold-layout__main');
    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'efp-bulk-btn';
    btn.className = 'efp-btn efp-btn-primary efp-bulk-btn';
    btn.textContent = '📧 Bulk Extract Emails (Pro)';
    btn.addEventListener('click', handleBulkExtract);
    container.insertBefore(btn, container.firstChild);
  }

  async function handleBulkExtract() {
    const resp = await chrome.runtime.sendMessage({ action: 'isPro' });
    if (!resp.pro) {
      chrome.runtime.sendMessage({ action: 'openPayment' });
      return;
    }

    const people = extractSearchResults();
    if (!people.length) { alert('No results found on this page'); return; }

    const btn = document.getElementById('efp-bulk-btn');
    btn.textContent = `⏳ Extracting ${people.length} contacts...`;
    btn.disabled = true;

    const result = await chrome.runtime.sendMessage({ action: 'bulkLookup', people });

    if (result.results) {
      for (const person of result.results) {
        if (person.emails && person.emails.length > 0) {
          await chrome.runtime.sendMessage({
            action: 'saveContact',
            contact: {
              name: person.fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              title: person.title,
              company: person.company,
              email: person.emails[0],
              domain: person.domain,
              profileUrl: person.profileUrl,
              source: 'linkedin-bulk'
            }
          });
        }
      }
      btn.textContent = `✅ Extracted ${result.results.length} contacts — saved!`;
    }

    setTimeout(() => {
      btn.textContent = '📧 Bulk Extract Emails (Pro)';
      btn.disabled = false;
    }, 3000);
  }

  // ── Init ──
  function init() {
    const isProfile = /linkedin\.com\/in\//.test(location.href);
    const isSearch = /linkedin\.com\/search\/results\/people/.test(location.href);

    if (isProfile) {
      setTimeout(() => {
        const profile = extractProfileData();
        if (profile && profile.fullName) createWidget(profile);
      }, 2000);
    } else if (isSearch) {
      setTimeout(injectBulkButton, 2000);
    }
  }

  // Watch for SPA navigation
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(init, 1500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  init();
})();
