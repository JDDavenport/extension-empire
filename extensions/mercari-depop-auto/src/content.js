/**
 * RelistPro — Content Script (Mercari Listing Page)
 * Injects relist button overlay and listing stats on individual item pages.
 * Runs on: mercari.com/sell/listings/* and mercari.com/items/*
 */

(() => {
  'use strict';

  // Prevent double injection
  if (window.__relistProContentLoaded) return;
  window.__relistProContentLoaded = true;

  // ── Helpers ─────────────────────────────────────────────────────────────

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const randomDelay = (min = 2000, max = 8000) => sleep(min + Math.random() * (max - min));

  function $(sel, ctx = document) { return ctx.querySelector(sel); }
  function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

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
    el.innerHTML = `<span class="rp-toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    getToastContainer().appendChild(el);
    setTimeout(() => {
      el.classList.add('rp-toast-exit');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  // ── DOM Scraping — Listing Details ────────────────────────────────────

  function scrapeListingDetails() {
    try {
      // Mercari's DOM changes frequently. We try multiple selector strategies.
      const selectors = {
        title: [
          '[data-testid="ItemName"]',
          'h1[class*="ItemName"]',
          '.item-name h1',
          'h1'
        ],
        price: [
          '[data-testid="ItemPrice"]',
          '[class*="ItemPrice"]',
          '.item-price',
          '[class*="price"]'
        ],
        description: [
          '[data-testid="ItemDescription"]',
          '[class*="ItemDescription"]',
          '.item-description',
          '[data-testid="description"]'
        ],
        condition: [
          '[data-testid="ItemCondition"]',
          '[class*="condition"]'
        ],
        category: [
          '[data-testid="ItemCategory"]',
          '[class*="category"]',
          'nav[aria-label="breadcrumb"]'
        ],
        images: [
          '[data-testid="ItemImage"] img',
          '[class*="ItemImage"] img',
          '.item-image img',
          '[class*="carousel"] img',
          '[class*="Carousel"] img',
          'picture img'
        ]
      };

      function trySelectors(selectorList) {
        for (const sel of selectorList) {
          const el = $(sel);
          if (el) return el;
        }
        return null;
      }

      const titleEl = trySelectors(selectors.title);
      const priceEl = trySelectors(selectors.price);
      const descEl = trySelectors(selectors.description);
      const conditionEl = trySelectors(selectors.condition);
      const categoryEl = trySelectors(selectors.category);

      // Get all images
      let images = [];
      for (const sel of selectors.images) {
        const imgs = $$(sel);
        if (imgs.length > 0) {
          images = imgs.map(img => img.src || img.getAttribute('data-src')).filter(Boolean);
          break;
        }
      }

      const data = {
        title: titleEl?.textContent?.trim() || '',
        price: priceEl?.textContent?.trim()?.replace(/[^0-9.]/g, '') || '',
        description: descEl?.textContent?.trim() || '',
        condition: conditionEl?.textContent?.trim() || '',
        category: categoryEl?.textContent?.trim() || '',
        images,
        url: window.location.href,
        scrapedAt: Date.now()
      };

      // Validation
      if (!data.title) {
        throw new Error('Could not find listing title. Mercari may have updated their page layout.');
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ── Relist Flow ───────────────────────────────────────────────────────

  async function performRelist(button) {
    // 1. Check rate limit
    const rateCheck = await chrome.runtime.sendMessage({ type: 'CHECK_RATE_LIMIT' });
    if (!rateCheck.allowed) {
      toast(`Rate limit reached. ${rateCheck.remaining} actions remaining. Resets in ${Math.ceil(rateCheck.resetIn / 60000)} min.`, 'warning');
      return;
    }

    // 2. Set loading state
    const origHTML = button.innerHTML;
    button.classList.add('rp-loading');
    button.innerHTML = '<span class="rp-spinner"></span> Copying listing...';

    try {
      // 3. Scrape listing details
      const result = scrapeListingDetails();
      if (!result.ok) {
        throw new Error(result.error);
      }

      toast('Listing details copied!', 'success', 2000);
      button.innerHTML = '<span class="rp-spinner"></span> Preparing to relist...';

      // 4. Save listing data for the create flow
      await chrome.storage.local.set({ relistpro_pending_relist: result.data });

      // 5. Randomized delay to mimic human behavior
      await randomDelay();

      button.innerHTML = '<span class="rp-spinner"></span> Opening create form...';

      // 6. Record action & increment stats
      await chrome.runtime.sendMessage({ type: 'RECORD_ACTION' });
      await chrome.runtime.sendMessage({ type: 'INCREMENT_RELISTS', count: 1 });

      // 7. Navigate to create listing page
      // Mercari's create listing URL — this will be pre-filled by a separate handler
      toast('Redirecting to create listing. Paste your details there!', 'info', 5000);
      
      await sleep(1000);
      
      // Open create listing in same tab
      // Note: Actual auto-fill requires intercepting the create form — for MVP,
      // we copy to clipboard and provide clear instructions
      const listingData = result.data;
      const clipboardText = [
        `Title: ${listingData.title}`,
        `Price: $${listingData.price}`,
        `Description:\n${listingData.description}`,
        `Condition: ${listingData.condition}`
      ].join('\n\n');

      try {
        await navigator.clipboard.writeText(clipboardText);
        toast('Listing details copied to clipboard! Paste into new listing.', 'success');
      } catch {
        // Clipboard API might fail — fallback
        toast('Details saved. Navigate to Create Listing to use them.', 'info');
      }

      // Store for potential auto-fill on the create page
      await chrome.storage.local.set({
        relistpro_pending_relist: {
          ...listingData,
          sourceUrl: window.location.href
        }
      });

      // Navigate to sell page
      window.location.href = 'https://www.mercari.com/sell/';

    } catch (err) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      button.classList.remove('rp-loading');
      button.innerHTML = origHTML;
    }
  }

  // ── Inject Relist Button ──────────────────────────────────────────────

  function injectRelistButton() {
    if ($('.rp-relist-container')) return; // Already injected

    // Find a good anchor point on the listing page
    const anchorSelectors = [
      '[data-testid="item-detail"]',
      '[class*="ItemContainer"]',
      '[class*="item-detail"]',
      'main',
      '#main'
    ];

    let anchor = null;
    for (const sel of anchorSelectors) {
      anchor = $(sel);
      if (anchor) break;
    }

    if (!anchor) {
      // Last resort: prepend to body
      anchor = document.body;
    }

    const container = document.createElement('div');
    container.className = 'rp-relist-container';
    container.innerHTML = `
      <button class="rp-relist-btn" id="rp-relist-btn">
        ⚡ One-Click Relist
      </button>
      <span class="rp-badge">RelistPro</span>
    `;

    // Insert at top of anchor
    if (anchor.firstChild) {
      anchor.insertBefore(container, anchor.firstChild);
    } else {
      anchor.appendChild(container);
    }

    // Bind click
    const btn = $('#rp-relist-btn');
    btn.addEventListener('click', () => performRelist(btn));
  }

  // ── Listing Age Overlay (for item page) ───────────────────────────────

  function injectListingAge() {
    // Try to find listing date on the page
    const dateSelectors = [
      '[data-testid="ListedDate"]',
      '[class*="listed"]',
      'time',
      '[datetime]'
    ];

    for (const sel of dateSelectors) {
      const el = $(sel);
      if (el) {
        const dateText = el.getAttribute('datetime') || el.textContent;
        const listedDate = new Date(dateText);
        if (!isNaN(listedDate.getTime())) {
          const days = Math.floor((Date.now() - listedDate.getTime()) / 86400000);
          const badge = document.createElement('span');
          badge.className = `rp-days-badge ${days > 14 ? 'rp-stale' : days > 7 ? 'rp-aging' : 'rp-fresh'}`;
          badge.textContent = `${days}d ago`;
          el.parentElement?.insertBefore(badge, el);
          break;
        }
      }
    }
  }

  // ── Initialize ────────────────────────────────────────────────────────

  function init() {
    // Only inject on item detail pages (not search results etc.)
    const path = window.location.pathname;
    if (path.includes('/items/') || path.includes('/sell/listings/')) {
      injectRelistButton();
      injectListingAge();
    }
  }

  // Run on load and watch for SPA navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Mercari is a SPA — watch for URL changes
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Clean up old injections
      $$('.rp-relist-container').forEach(el => el.remove());
      $$('.rp-days-badge').forEach(el => el.remove());
      // Re-init after short delay for DOM to settle
      setTimeout(init, 1000);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
