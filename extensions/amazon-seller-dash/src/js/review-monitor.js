/* Amazon Seller Dashboard — Review Monitor */
ASD.reviews = {
  async checkNewReviews() {
    const data = await ASD.storage.get(['review_cache']);
    const cache = data.review_cache || {};
    const newReviews = [];

    // Look for review elements on the page
    const reviewEls = document.querySelectorAll('.review, [data-hook="review"]');
    reviewEls.forEach(el => {
      const id = el.getAttribute('id') || el.getAttribute('data-review-id');
      if (!id) return;

      const ratingEl = el.querySelector('[data-hook="review-star-rating"] span, .a-icon-alt');
      const titleEl = el.querySelector('[data-hook="review-title"] span, .review-title');
      const dateEl = el.querySelector('[data-hook="review-date"], .review-date');
      const bodyEl = el.querySelector('[data-hook="review-body"] span, .review-text');

      const review = {
        id,
        rating: parseInt(ratingEl?.textContent) || 0,
        title: titleEl?.textContent?.trim() || '',
        date: dateEl?.textContent?.trim() || '',
        body: bodyEl?.textContent?.trim()?.slice(0, 200) || '',
        seen: Date.now()
      };

      if (!cache[id]) {
        cache[id] = review;
        newReviews.push(review);
        // Highlight new review on page
        el.style.borderLeft = '3px solid #ff9900';
        el.style.backgroundColor = 'rgba(255,153,0,0.05)';
      }
    });

    await ASD.storage.set({ review_cache: cache });
    return newReviews;
  },

  renderWidget(container) {
    const { el } = ASD.utils;
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'asd-section-title' }, ['⭐ Review Monitor']));

    ASD.storage.get(['review_cache']).then(data => {
      const cache = data.review_cache || {};
      const reviews = Object.values(cache)
        .sort((a, b) => b.seen - a.seen)
        .slice(0, 10);

      if (!reviews.length) {
        container.appendChild(el('div', { className: 'asd-card', textContent: 'No reviews tracked yet. Visit your product pages.' }));
        return;
      }

      for (const r of reviews) {
        const stars = '⭐'.repeat(Math.min(r.rating, 5));
        const card = el('div', { className: 'asd-card' }, [
          el('div', { innerHTML: `${stars} <strong>${r.title}</strong>` }),
          el('div', { className: 'asd-stat-label', textContent: r.date }),
          el('div', { textContent: r.body, style: 'margin-top:4px;font-size:11px;' })
        ]);
        container.appendChild(card);
      }
    });
  }
};
