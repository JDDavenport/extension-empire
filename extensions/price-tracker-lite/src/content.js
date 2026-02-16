(function() {
  const url = window.location.href;
  let price = null, title = null;

  if (url.includes('amazon.')) {
    const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, #corePrice_feature_div .a-offscreen');
    if (priceEl) price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
    const titleEl = document.querySelector('#productTitle');
    if (titleEl) title = titleEl.textContent.trim();
  } else if (url.includes('ebay.')) {
    const priceEl = document.querySelector('.x-price-primary span, [itemprop="price"]');
    if (priceEl) price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
    const titleEl = document.querySelector('.x-item-title__mainTitle span, h1.it-ttl');
    if (titleEl) title = titleEl.textContent.trim();
  }

  if (price && !isNaN(price)) {
    chrome.runtime.sendMessage({ type: 'PRICE_DETECTED', url: url.split('?')[0], price, title });
  }
})();
