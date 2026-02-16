/* Amazon Seller Dashboard — Content Script (amazon.com product pages) */
(async function() {
  'use strict';

  const extpay = typeof ExtPay !== 'undefined' ? ExtPay('amazon-seller-dash') : null;
  if (extpay) extpay.startBackground();

  let isPro = false;
  try {
    if (extpay) {
      const user = await extpay.getUser();
      isPro = user.paid;
    }
  } catch(e) {}

  // Only run on product pages
  if (!location.href.match(/\/dp\/[A-Z0-9]{10}/)) return;

  const { el } = ASD.utils;

  // Track BSR automatically
  if (isPro) {
    ASD.bsr.trackBSR();
    ASD.competitors.track();
  }

  // Add inline BSR badge next to existing BSR on page
  const bsr = ASD.bsr.scrapeCurrentBSR();
  if (bsr) {
    const bsrElements = document.querySelectorAll('th');
    bsrElements.forEach(th => {
      if (th.textContent.includes('Best Sellers Rank')) {
        const badge = el('span', { className: 'asd-inline-badge' }, [
          '📊 Tracked',
          isPro ? '' : el('span', { className: 'asd-pro-badge', textContent: 'PRO' })
        ].filter(Boolean));
        th.parentElement?.appendChild(badge);
      }
    });
  }

  // Add profit calculator inline
  const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, #corePrice_feature_div .a-offscreen');
  const price = ASD.utils.parsePrice(priceEl?.textContent);

  if (price > 0) {
    const profitBadge = el('div', { className: 'asd-inline-badge', style: 'margin-top:8px;display:flex;gap:12px;padding:6px 10px;' });
    const calc = ASD.profitCalc.calculate({ price, cogs: 0, weight: 1 });
    profitBadge.innerHTML = `
      <span>Fee: ${ASD.utils.formatCurrency(calc.totalFees)}</span>
      <span>Profit: <strong style="color:${calc.profit >= 0 ? '#00c853' : '#ff1744'}">${ASD.utils.formatCurrency(calc.profit)}</strong></span>
      <span style="color:var(--asd-text-muted);font-size:10px;">excl. COGS</span>
    `;

    const priceParent = priceEl?.closest('#corePrice_feature_div, #price, #priceblock_ourprice')?.parentElement;
    if (priceParent) priceParent.appendChild(profitBadge);
  }

  // Review monitoring
  ASD.reviews.checkNewReviews();
})();
