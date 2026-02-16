/* YT Analytics Pro — Content Script for youtube.com (public pages) */

(function () {
  'use strict';

  function bg(action, data = {}) {
    return chrome.runtime.sendMessage({ action, ...data });
  }

  // Scrape comments from video page for sentiment analysis
  function scrapeComments() {
    const comments = [];
    document.querySelectorAll('#content-text, ytd-comment-renderer #content-text').forEach(el => {
      const text = el.textContent.trim();
      if (text) comments.push(text);
    });
    return comments;
  }

  // Scrape video metadata
  function getVideoMeta() {
    const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title')?.textContent?.trim() || '';
    const viewsEl = document.querySelector('.ytd-video-primary-info-renderer .view-count, ytd-watch-metadata #info span');
    const views = viewsEl ? viewsEl.textContent.trim() : '';
    const channelEl = document.querySelector('#channel-name a, ytd-channel-name a');
    const channel = channelEl ? channelEl.textContent.trim() : '';
    const tagsEl = document.querySelector('meta[name="keywords"]');
    const tags = tagsEl ? tagsEl.content : '';
    return { title, views, channel, tags };
  }

  // Listen for requests from the panel (opened via Studio content script)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'scrape-comments') {
      sendResponse({ comments: scrapeComments() });
    }
    if (msg.action === 'get-video-meta') {
      sendResponse(getVideoMeta());
    }
  });

  // Auto-collect comment data when scrolling on video pages
  if (location.pathname === '/watch') {
    let collected = false;
    const observer = new MutationObserver(() => {
      if (!collected) {
        const comments = scrapeComments();
        if (comments.length >= 5) {
          collected = true;
          // Store for use by Studio panel
          bg('save-data', { key: 'ytap_last_comments', value: comments.slice(0, 200) });
        }
      }
    });
    // Observe comment section loading
    const waitForComments = setInterval(() => {
      const commentSection = document.querySelector('#comments, ytd-comments');
      if (commentSection) {
        clearInterval(waitForComments);
        observer.observe(commentSection, { childList: true, subtree: true });
      }
    }, 2000);
    // Cleanup after 60s
    setTimeout(() => { clearInterval(waitForComments); observer.disconnect(); }, 60000);
  }
})();
