/**
 * RelistPro — Content Script (Mercari My Listings Page)
 * Injects bulk select checkboxes, days-since-listed badges, and bulk action bar.
 * Runs on: mercari.com/mypage/listings*
 */

(() => {
  'use strict';

  if (window.__relistProListingsLoaded) return;
  window.__relistProListingsLoaded = true;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const randomDelay = (min = 2000, max = 8000) => sleep(min + Math.random() * (max - min));

  function $(sel, ctx = document) { return ctx.querySelector(sel); }
  function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

  const selected = new Set();

  // ── Toast System ──────────────────────────────────────────────────────

  function getToastContainer() {
    let c = $('.rp-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'rp-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `rp-toast rp-${type}`;
    el.innerHTML = `<span class="rp-toast-icon">${icons[type]}</span><span>${message}</span>`;
    getToastContainer().appendChild(el);
    setTimeout(() => {
      el.classList.add('rp-toast-exit');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  // ── Find Listing Cards ────────────────────────────────────────────────

  function findListingCards() {
    // Mercari listing card selectors — try multiple patterns
    const cardSelectors = [
      '[data-testid="ListingCard"]',
      '[data-testid="ItemCard"]',
      '[class*="ListingCard"]',
      '[class*="ItemCell"]',
      '[class*="item-cell"]',
      'a[href*="/items/"]'
    ];

    for (const sel of cardSelectors) {
      const cards = $$(sel);
      if (cards.length > 0) {
        // If we matched links, get their parent containers
        if (sel.startsWith('a[')) {
          return cards.map(a => a.closest('div[class]') || a.parentElement).filter(Boolean);
        }
        return cards;
      }
    }

    return [];
  }

  // ── Extract Item ID from Card ─────────────────────────────────────────

  function getItemId(card) {
    const link = card.querySelector('a[href*="/items/"]') || card.closest('a[href*="/items/"]');
    if (link) {
      const match = link.href.match(/\/items\/([a-zA-Z0-9]+)/);
      if (match) return match[1];
    }
    return card.dataset?.itemId || card.id || null;
  }

  // ── Inject Checkboxes & Badges ────────────────────────────────────────

  function processCards() {
    const cards = findListingCards();

    if (cards.length === 0) return;

    // Report tracked count
    chrome.runtime.sendMessage({ type: 'UPDATE_LISTINGS_TRACKED', count: cards.length });

    cards.forEach(card => {
      if (card.dataset.rpProcessed) return;
      card.dataset.rpProcessed = 'true';

      // Make card position relative for absolute positioning of overlays
      const computed = window.getComputedStyle(card);
      if (computed.position === 'static') {
        card.style.position = 'relative';
      }

      const itemId = getItemId(card);

      // ── Checkbox ──
      if (itemId) {
        const wrap = document.createElement('div');
        wrap.className = 'rp-checkbox-wrap';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'rp-checkbox';
        cb.dataset.itemId = itemId;
        cb.addEventListener('change', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (cb.checked) {
            selected.add(itemId);
          } else {
            selected.delete(itemId);
          }
          updateBulkBar();
        });
        cb.addEventListener('click', (e) => e.stopPropagation());
        wrap.appendChild(cb);
        card.appendChild(wrap);
      }

      // ── Days Badge ──
      // Try to find date info within the card
      const timeEl = card.querySelector('time') || card.querySelector('[datetime]');
      const textEls = $$('span, p, div', card);

      let daysAgo = null;

      if (timeEl) {
        const dt = new Date(timeEl.getAttribute('datetime') || timeEl.textContent);
        if (!isNaN(dt.getTime())) {
          daysAgo = Math.floor((Date.now() - dt.getTime()) / 86400000);
        }
      }

      if (daysAgo === null) {
        // Try to parse relative time text like "3 days ago", "Listed 2 weeks ago"
        for (const el of textEls) {
          const text = el.textContent?.trim() || '';
          const dayMatch = text.match(/(\d+)\s*days?\s*ago/i);
          const weekMatch = text.match(/(\d+)\s*weeks?\s*ago/i);
          const hourMatch = text.match(/(\d+)\s*hours?\s*ago/i);

          if (dayMatch) { daysAgo = parseInt(dayMatch[1]); break; }
          if (weekMatch) { daysAgo = parseInt(weekMatch[1]) * 7; break; }
          if (hourMatch) { daysAgo = 0; break; }
        }
      }

      if (daysAgo !== null) {
        const badge = document.createElement('div');
        badge.className = `rp-days-badge ${daysAgo > 14 ? 'rp-stale' : daysAgo > 7 ? 'rp-aging' : 'rp-fresh'}`;
        badge.textContent = daysAgo === 0 ? 'Today' : `${daysAgo}d`;
        card.appendChild(badge);
      }
    });
  }

  // ── Bulk Action Bar ───────────────────────────────────────────────────

  let bulkBar = null;

  function createBulkBar() {
    bulkBar = document.createElement('div');
    bulkBar.className = 'rp-bulk-bar';
    bulkBar.innerHTML = `
      <span class="rp-count"><span id="rp-selected-count">0</span> selected</span>
      <button class="rp-bulk-relist" id="rp-bulk-relist-btn">⚡ Bulk Relist</button>
      <button class="rp-bulk-cancel" id="rp-bulk-cancel-btn">Cancel</button>
      <span class="rp-pro-badge" style="display:none">PRO</span>
    `;
    document.body.appendChild(bulkBar);

    $('#rp-bulk-cancel-btn').addEventListener('click', () => {
      selected.clear();
      $$('.rp-checkbox').forEach(cb => cb.checked = false);
      updateBulkBar();
    });

    $('#rp-bulk-relist-btn').addEventListener('click', handleBulkRelist);
  }

  function updateBulkBar() {
    if (!bulkBar) createBulkBar();
    const count = selected.size;
    const countEl = $('#rp-selected-count');
    if (countEl) countEl.textContent = count;

    if (count > 0) {
      bulkBar.classList.add('rp-visible');
    } else {
      bulkBar.classList.remove('rp-visible');
    }

    // Free tier: limit to 5 at a time. Pro unlocks 50.
    const relistBtn = $('#rp-bulk-relist-btn');
    const proBadge = bulkBar.querySelector('.rp-pro-badge');
    if (count > 5) {
      relistBtn.disabled = true;
      relistBtn.textContent = '⚡ Bulk Relist (max 5 free)';
      proBadge.style.display = 'inline-flex';
    } else {
      relistBtn.disabled = false;
      relistBtn.textContent = '⚡ Bulk Relist';
      proBadge.style.display = 'none';
    }
  }

  // ── Bulk Relist Handler ───────────────────────────────────────────────

  async function handleBulkRelist() {
    const items = [...selected];
    if (items.length === 0) return;
    if (items.length > 5) {
      toast('Free tier is limited to 5 items at a time. Upgrade to Pro for up to 50!', 'warning');
      return;
    }

    // Check rate limit
    const rateCheck = await chrome.runtime.sendMessage({ type: 'CHECK_RATE_LIMIT' });
    if (rateCheck.remaining < items.length) {
      toast(`Rate limit: only ${rateCheck.remaining} actions remaining this hour.`, 'warning');
      return;
    }

    const relistBtn = $('#rp-bulk-relist-btn');
    relistBtn.disabled = true;
    relistBtn.textContent = '⏳ Processing...';

    // Add progress bar
    let progress = bulkBar.querySelector('.rp-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'rp-progress';
      progress.innerHTML = '<div class="rp-progress-bar" style="width: 0%"></div>';
      bulkBar.appendChild(progress);
    }
    const progressBar = progress.querySelector('.rp-progress-bar');

    let completed = 0;
    let errors = 0;

    for (const itemId of items) {
      try {
        // Open item page, scrape, and save
        toast(`Processing item ${completed + 1}/${items.length}...`, 'info', 2000);

        // Save item ID to pending bulk list
        const existing = (await chrome.storage.local.get('relistpro_bulk_queue'))?.relistpro_bulk_queue || [];
        existing.push({ itemId, url: `https://www.mercari.com/items/${itemId}/` });
        await chrome.storage.local.set({ relistpro_bulk_queue: existing });

        await chrome.runtime.sendMessage({ type: 'RECORD_ACTION' });
        await chrome.runtime.sendMessage({ type: 'INCREMENT_RELISTS', count: 1 });

        completed++;
        progressBar.style.width = `${(completed / items.length) * 100}%`;

        // Random delay between items
        if (completed < items.length) {
          await randomDelay();
        }
      } catch (err) {
        errors++;
        toast(`Error on item ${itemId}: ${err.message}`, 'error');
      }
    }

    // Done
    if (errors === 0) {
      toast(`Successfully queued ${completed} items for relist!`, 'success');
    } else {
      toast(`Completed ${completed}/${items.length} (${errors} errors)`, 'warning');
    }

    // Reset
    selected.clear();
    $$('.rp-checkbox').forEach(cb => cb.checked = false);
    updateBulkBar();
    relistBtn.disabled = false;
    relistBtn.textContent = '⚡ Bulk Relist';
    progressBar.style.width = '0%';
  }

  // ── Initialize ────────────────────────────────────────────────────────

  function init() {
    processCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Watch for dynamically loaded cards (infinite scroll)
  const observer = new MutationObserver(() => {
    processCards();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // SPA navigation
  let lastUrl = location.href;
  const navObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      $$('[data-rp-processed]').forEach(el => delete el.dataset.rpProcessed);
      $$('.rp-checkbox-wrap, .rp-days-badge').forEach(el => el.remove());
      selected.clear();
      updateBulkBar();
      setTimeout(init, 1000);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });

})();
