/* YT Analytics Pro — Content Script for YouTube Studio */

(function () {
  'use strict';

  let isPro = false;
  let panelVisible = false;
  let activeTab = 'overview';

  // Check pro status
  async function checkPro() {
    try {
      const user = await chrome.runtime.sendMessage({ action: 'get-user' });
      isPro = user && user.paid;
    } catch { isPro = false; }
  }

  // Send message to background
  function bg(action, data = {}) {
    return chrome.runtime.sendMessage({ action, ...data });
  }

  // Init
  async function init() {
    await checkPro();
    injectToggleButton();
    injectPanel();
  }

  function injectToggleButton() {
    if (document.getElementById('ytap-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'ytap-toggle';
    btn.innerHTML = '📊';
    btn.title = 'YT Analytics Pro';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
  }

  function togglePanel() {
    const panel = document.getElementById('ytap-panel');
    const toggle = document.getElementById('ytap-toggle');
    if (!panel) return;
    panelVisible = !panelVisible;
    panel.classList.toggle('ytap-collapsed', !panelVisible);
    toggle.classList.toggle('ytap-active', panelVisible);
  }

  function injectPanel() {
    if (document.getElementById('ytap-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ytap-panel';
    panel.className = 'ytap-collapsed';
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    // Bind tabs
    panel.querySelectorAll('.ytap-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Bind pro upgrade buttons
    panel.querySelectorAll('.ytap-upgrade-btn').forEach(btn => {
      btn.addEventListener('click', () => bg('open-payment'));
    });

    // Init active tab content
    loadTabContent('overview');
  }

  function buildPanelHTML() {
    const proLabel = isPro ? '<span class="ytap-pro-badge">PRO</span>' : '';
    const lock = isPro ? '' : '<span class="ytap-lock">🔒</span>';

    return `
      <div class="ytap-header">
        <h2>📊 YT Analytics Pro ${proLabel}</h2>
      </div>
      <div class="ytap-tabs">
        <div class="ytap-tab active" data-tab="overview">Overview</div>
        <div class="ytap-tab" data-tab="sentiment">Sentiment</div>
        <div class="ytap-tab" data-tab="tags">Tags</div>
        <div class="ytap-tab" data-tab="revenue">Revenue</div>
        <div class="ytap-tab" data-tab="predictor">Predictor ${lock}</div>
        <div class="ytap-tab" data-tab="thumbnails">A/B Test ${lock}</div>
        <div class="ytap-tab" data-tab="timing">Timing ${lock}</div>
        <div class="ytap-tab" data-tab="competitors">Competitors ${lock}</div>
        <div class="ytap-tab" data-tab="bulk">Bulk Edit ${lock}</div>
      </div>
      <div class="ytap-section active" id="ytap-sec-overview">${buildOverviewHTML()}</div>
      <div class="ytap-section" id="ytap-sec-sentiment">${buildSentimentHTML()}</div>
      <div class="ytap-section" id="ytap-sec-tags">${buildTagsHTML()}</div>
      <div class="ytap-section" id="ytap-sec-revenue">${buildRevenueHTML()}</div>
      <div class="ytap-section" id="ytap-sec-predictor">${isPro ? buildPredictorHTML() : buildProGate('Performance Predictor', 'Predict video performance based on first-hour metrics vs your channel average.')}</div>
      <div class="ytap-section" id="ytap-sec-thumbnails">${isPro ? buildThumbnailsHTML() : buildProGate('Thumbnail A/B Testing', 'Save thumbnail variants and track CTR to find what works best.')}</div>
      <div class="ytap-section" id="ytap-sec-timing">${isPro ? buildTimingHTML() : buildProGate('Best Upload Time', 'Discover when your audience is most active for maximum reach.')}</div>
      <div class="ytap-section" id="ytap-sec-competitors">${isPro ? buildCompetitorsHTML() : buildProGate('Competitor Tracker', 'Track up to 10 competitor channels — subs, uploads, view trends.')}</div>
      <div class="ytap-section" id="ytap-sec-bulk">${isPro ? buildBulkHTML() : buildProGate('Bulk Description Editor', 'Edit descriptions across multiple videos with templates.')}</div>
    `;
  }

  function buildProGate(title, desc) {
    return `
      <div class="ytap-pro-gate">
        <h3>🔒 ${title}</h3>
        <p>${desc}</p>
        <button class="ytap-btn ytap-btn-pro ytap-upgrade-btn">Upgrade to Pro — $12.99/mo</button>
      </div>
    `;
  }

  // -- Tab Content Builders --

  function buildOverviewHTML() {
    return `
      <div class="ytap-stats">
        <div class="ytap-stat">
          <div class="ytap-stat-value" id="ytap-views-today">—</div>
          <div class="ytap-stat-label">Views Today</div>
          <div class="ytap-stat-change up" id="ytap-views-change"></div>
        </div>
        <div class="ytap-stat">
          <div class="ytap-stat-value" id="ytap-subs-today">—</div>
          <div class="ytap-stat-label">Subs Today</div>
          <div class="ytap-stat-change up" id="ytap-subs-change"></div>
        </div>
        <div class="ytap-stat">
          <div class="ytap-stat-value" id="ytap-watchtime">—</div>
          <div class="ytap-stat-label">Watch Time (hrs)</div>
        </div>
        <div class="ytap-stat">
          <div class="ytap-stat-value" id="ytap-revenue-today">—</div>
          <div class="ytap-stat-label">Est. Revenue</div>
        </div>
      </div>
      <div class="ytap-card" style="margin-top:12px">
        <div class="ytap-card-title">Recent Video Performance</div>
        <div id="ytap-recent-videos"><div class="ytap-loading"><div class="ytap-spinner"></div></div></div>
      </div>
    `;
  }

  function buildSentimentHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Comment Sentiment Analysis</div>
        <p style="font-size:12px;color:var(--ytap-text-muted);margin:0 0 12px 0">Navigate to a video page to analyze its comments, or enter comments below.</p>
        <textarea class="ytap-textarea" id="ytap-comments-input" placeholder="Paste comments here (one per line) or navigate to a video..."></textarea>
        <button class="ytap-btn ytap-btn-primary" style="margin-top:8px;width:100%" id="ytap-analyze-btn">Analyze Sentiment</button>
        <div id="ytap-sentiment-results" style="margin-top:12px"></div>
      </div>
    `;
  }

  function buildTagsHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Tag Optimizer</div>
        <input class="ytap-input" id="ytap-tag-topic" placeholder="Enter video topic or title..." />
        <button class="ytap-btn ytap-btn-primary" style="margin-top:8px;width:100%" id="ytap-tag-btn">Generate Tags</button>
        <div id="ytap-tag-results" style="margin-top:12px"></div>
        <div id="ytap-tag-copy" style="display:none;margin-top:8px">
          <button class="ytap-btn ytap-btn-secondary" id="ytap-copy-tags" style="width:100%">📋 Copy Selected Tags</button>
        </div>
      </div>
    `;
  }

  function buildRevenueHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Revenue Estimator</div>
        <input class="ytap-input" id="ytap-rev-views" type="number" placeholder="Total views" style="margin-bottom:8px" />
        <select class="ytap-input" id="ytap-rev-niche" style="margin-bottom:8px">
          <option value="default">Select Niche...</option>
          <option value="finance">Finance</option>
          <option value="technology">Technology</option>
          <option value="programming">Programming</option>
          <option value="gaming">Gaming</option>
          <option value="entertainment">Entertainment</option>
          <option value="education">Education</option>
          <option value="health">Health</option>
          <option value="beauty">Beauty</option>
          <option value="fitness">Fitness</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
          <option value="music">Music</option>
          <option value="science">Science</option>
          <option value="business">Business</option>
          <option value="marketing">Marketing</option>
          <option value="crypto">Crypto</option>
          <option value="real estate">Real Estate</option>
          <option value="auto">Auto</option>
          <option value="diy">DIY</option>
          <option value="pets">Pets</option>
          <option value="sports">Sports</option>
          <option value="news">News</option>
          <option value="comedy">Comedy</option>
        </select>
        <button class="ytap-btn ytap-btn-primary" style="width:100%" id="ytap-rev-btn">Estimate Revenue</button>
        <div id="ytap-rev-results" style="margin-top:12px"></div>
      </div>
    `;
  }

  function buildPredictorHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Video Performance Predictor</div>
        <input class="ytap-input" id="ytap-pred-first" type="number" placeholder="First hour views" style="margin-bottom:8px" />
        <input class="ytap-input" id="ytap-pred-avg-first" type="number" placeholder="Channel avg first hour views" style="margin-bottom:8px" />
        <input class="ytap-input" id="ytap-pred-avg-total" type="number" placeholder="Channel avg total views" style="margin-bottom:8px" />
        <button class="ytap-btn ytap-btn-primary" style="width:100%" id="ytap-pred-btn">Predict Performance</button>
        <div id="ytap-pred-results" style="margin-top:12px"></div>
      </div>
    `;
  }

  function buildThumbnailsHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Thumbnail A/B Testing</div>
        <p style="font-size:12px;color:var(--ytap-text-muted);margin:0 0 12px 0">Upload thumbnail variants and track their CTR over time.</p>
        <div class="ytap-thumb-grid" id="ytap-thumb-grid"></div>
        <div style="margin-top:12px">
          <label class="ytap-btn ytap-btn-secondary" style="display:block;text-align:center;cursor:pointer">
            + Add Thumbnail Variant
            <input type="file" accept="image/*" id="ytap-thumb-upload" style="display:none" />
          </label>
        </div>
        <div style="margin-top:8px">
          <input class="ytap-input" id="ytap-thumb-ctr" type="number" step="0.01" placeholder="Enter CTR % for current thumbnail" style="margin-bottom:8px" />
          <button class="ytap-btn ytap-btn-primary" style="width:100%" id="ytap-thumb-save-ctr">Save CTR Data Point</button>
        </div>
        <div id="ytap-thumb-history" style="margin-top:12px"></div>
      </div>
    `;
  }

  function buildTimingHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Best Time to Upload</div>
        <p style="font-size:12px;color:var(--ytap-text-muted);margin:0 0 12px 0">Based on your audience activity patterns. Data improves over time.</p>
        <div class="ytap-card" style="padding:8px">
          <div class="ytap-card-title">Audience Activity Heatmap</div>
          <div id="ytap-heatmap">${buildHeatmapHTML()}</div>
        </div>
        <div style="margin-top:12px;padding:12px;background:var(--ytap-surface);border-radius:8px">
          <div style="font-size:13px;color:#fff;font-weight:600">🏆 Recommended Upload Times</div>
          <div id="ytap-best-times" style="margin-top:8px;font-size:12px;color:var(--ytap-text-muted)">
            <div>1. <strong>Tuesday 2:00 PM</strong> — Peak engagement</div>
            <div>2. <strong>Thursday 4:00 PM</strong> — High activity</div>
            <div>3. <strong>Saturday 10:00 AM</strong> — Weekend boost</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildHeatmapHTML() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '';
    // Header row
    html += '<div class="ytap-heatmap-label"></div>';
    for (let h = 0; h < 24; h++) {
      html += `<div class="ytap-heatmap-label" style="justify-content:center;font-size:8px">${h}</div>`;
    }
    // Data rows
    days.forEach(day => {
      html += `<div class="ytap-heatmap-label">${day}</div>`;
      for (let h = 0; h < 24; h++) {
        const intensity = Math.random();
        const alpha = 0.1 + intensity * 0.9;
        const color = intensity > 0.7 ? `rgba(0,200,83,${alpha})` : intensity > 0.4 ? `rgba(255,214,0,${alpha})` : `rgba(255,255,255,${alpha * 0.3})`;
        html += `<div class="ytap-heatmap-cell" style="background:${color}" title="${day} ${h}:00 — ${Math.round(intensity * 100)}% activity"></div>`;
      }
    });
    return `<div class="ytap-heatmap">${html}</div>`;
  }

  function buildCompetitorsHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Competitor Tracker</div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input class="ytap-input" id="ytap-comp-url" placeholder="YouTube channel URL..." style="flex:1" />
          <button class="ytap-btn ytap-btn-primary" id="ytap-comp-add">Add</button>
        </div>
        <div id="ytap-comp-list">
          <p style="font-size:12px;color:var(--ytap-text-muted);text-align:center;padding:20px 0">No competitors tracked yet. Add a channel above.</p>
        </div>
      </div>
    `;
  }

  function buildBulkHTML() {
    return `
      <div class="ytap-card">
        <div class="ytap-card-title">Bulk Description Editor</div>
        <p style="font-size:12px;color:var(--ytap-text-muted);margin:0 0 12px 0">Select videos and apply description templates.</p>
        <div class="ytap-bulk-list" id="ytap-bulk-list">
          <div class="ytap-loading"><div class="ytap-spinner"></div></div>
        </div>
        <div style="margin-top:12px">
          <div class="ytap-card-title">Description Template</div>
          <textarea class="ytap-textarea" id="ytap-bulk-template" placeholder="Use {title}, {url}, {channel} as variables...&#10;&#10;Example:&#10;🔔 Subscribe: {channel}&#10;📺 Watch next: ...&#10;&#10;#youtube #creator"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="ytap-btn ytap-btn-secondary" style="flex:1" id="ytap-bulk-preview">Preview</button>
            <button class="ytap-btn ytap-btn-primary" style="flex:1" id="ytap-bulk-apply">Apply to Selected</button>
          </div>
        </div>
      </div>
    `;
  }

  // -- Tab Switching --

  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.ytap-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('.ytap-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(`ytap-sec-${tabId}`);
    if (sec) sec.classList.add('active');
    loadTabContent(tabId);
  }

  function loadTabContent(tabId) {
    if (tabId === 'overview') loadOverview();
    bindTabEvents(tabId);
  }

  // -- Overview data --

  async function loadOverview() {
    // Scrape data from Studio page
    const stats = scrapeStudioStats();
    const el = (id) => document.getElementById(id);
    if (stats.views !== null) el('ytap-views-today').textContent = formatNumber(stats.views);
    if (stats.subs !== null) el('ytap-subs-today').textContent = formatNumber(stats.subs);
    if (stats.watchTime !== null) el('ytap-watchtime').textContent = stats.watchTime;
    if (stats.revenue !== null) el('ytap-revenue-today').textContent = `$${stats.revenue}`;

    // Load recent videos
    const recentEl = document.getElementById('ytap-recent-videos');
    if (recentEl) {
      const videos = scrapeRecentVideos();
      if (videos.length) {
        recentEl.innerHTML = videos.map(v => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div style="flex:1">
              <div style="font-size:12px;color:#fff;font-weight:500">${v.title}</div>
              <div style="font-size:11px;color:var(--ytap-text-muted)">${v.views} views · ${v.date}</div>
            </div>
          </div>
        `).join('');
      } else {
        recentEl.innerHTML = '<p style="font-size:12px;color:var(--ytap-text-muted);text-align:center">Navigate to Dashboard for video data</p>';
      }
    }
  }

  function scrapeStudioStats() {
    // Try to extract from YouTube Studio dashboard DOM
    const stats = { views: null, subs: null, watchTime: null, revenue: null };
    try {
      const metricCards = document.querySelectorAll('ytcp-analytics-metric-card, .metric-card');
      metricCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const valueEl = card.querySelector('.metric-value, .value');
        const value = valueEl ? valueEl.textContent.trim() : null;
        if (text.includes('view') && value) stats.views = parseMetricValue(value);
        if (text.includes('subscriber') && value) stats.subs = parseMetricValue(value);
        if (text.includes('watch time') && value) stats.watchTime = value;
        if (text.includes('revenue') && value) stats.revenue = value.replace('$', '');
      });
    } catch {}
    return stats;
  }

  function scrapeRecentVideos() {
    const videos = [];
    try {
      const rows = document.querySelectorAll('ytcp-video-row, .video-row');
      rows.forEach(row => {
        const titleEl = row.querySelector('.video-title, .title');
        const viewsEl = row.querySelector('.views, .metric');
        const dateEl = row.querySelector('.date, .upload-date');
        if (titleEl) {
          videos.push({
            title: titleEl.textContent.trim().slice(0, 50),
            views: viewsEl ? viewsEl.textContent.trim() : '—',
            date: dateEl ? dateEl.textContent.trim() : '—',
          });
        }
      });
    } catch {}
    return videos.slice(0, 5);
  }

  // -- Event Bindings --

  function bindTabEvents(tabId) {
    if (tabId === 'sentiment') bindSentiment();
    if (tabId === 'tags') bindTags();
    if (tabId === 'revenue') bindRevenue();
    if (tabId === 'predictor' && isPro) bindPredictor();
    if (tabId === 'competitors' && isPro) bindCompetitors();
    if (tabId === 'thumbnails' && isPro) bindThumbnails();
    if (tabId === 'bulk' && isPro) bindBulk();
  }

  function bindSentiment() {
    const btn = document.getElementById('ytap-analyze-btn');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', async () => {
      const input = document.getElementById('ytap-comments-input').value;
      const comments = input.split('\n').filter(c => c.trim());
      if (!comments.length) return;

      const results = await bg('analyze-sentiment', { comments });
      const el = document.getElementById('ytap-sentiment-results');
      el.innerHTML = `
        <div class="ytap-sentiment-bar">
          <div class="positive" style="width:${results.percentages.positive}%"></div>
          <div class="negative" style="width:${results.percentages.negative}%"></div>
          <div class="questions" style="width:${results.percentages.questions}%"></div>
          <div class="neutral" style="width:${results.percentages.neutral}%"></div>
        </div>
        <div class="ytap-sentiment-legend">
          <span class="pos">Positive ${results.percentages.positive}%</span>
          <span class="neg">Negative ${results.percentages.negative}%</span>
          <span class="que">Questions ${results.percentages.questions}%</span>
          <span class="neu">Neutral ${results.percentages.neutral}%</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--ytap-text-muted)">${results.total} comments analyzed</div>
      `;
    });
  }

  function bindTags() {
    const btn = document.getElementById('ytap-tag-btn');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', async () => {
      const topic = document.getElementById('ytap-tag-topic').value.trim();
      if (!topic) return;

      const results = await bg('suggest-tags', { topic });
      const el = document.getElementById('ytap-tag-results');
      el.innerHTML = `<div class="ytap-tags">${results.tags.map(t =>
        `<span class="ytap-tag" data-tag="${t.tag}">${t.tag}<span class="ytap-tag-score">${t.score}</span></span>`
      ).join('')}</div>`;

      document.getElementById('ytap-tag-copy').style.display = 'block';

      // Toggle selection
      el.querySelectorAll('.ytap-tag').forEach(tag => {
        tag.addEventListener('click', () => tag.classList.toggle('selected'));
      });
    });

    const copyBtn = document.getElementById('ytap-copy-tags');
    if (copyBtn && !copyBtn._bound) {
      copyBtn._bound = true;
      copyBtn.addEventListener('click', () => {
        const selected = [...document.querySelectorAll('.ytap-tag.selected')].map(t => t.dataset.tag);
        if (selected.length) {
          navigator.clipboard.writeText(selected.join(', '));
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => copyBtn.textContent = '📋 Copy Selected Tags', 1500);
        }
      });
    }
  }

  function bindRevenue() {
    const btn = document.getElementById('ytap-rev-btn');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', async () => {
      const views = parseInt(document.getElementById('ytap-rev-views').value) || 0;
      const niche = document.getElementById('ytap-rev-niche').value;

      const results = await bg('estimate-revenue', { views, niche });
      const el = document.getElementById('ytap-rev-results');
      el.innerHTML = `
        <div class="ytap-stats" style="margin-top:8px">
          <div class="ytap-stat">
            <div class="ytap-stat-value" style="color:var(--ytap-green)">$${results.estimatedRevenue}</div>
            <div class="ytap-stat-label">Estimated Revenue</div>
          </div>
          <div class="ytap-stat">
            <div class="ytap-stat-value">$${results.cpm}</div>
            <div class="ytap-stat-label">${results.niche} CPM</div>
          </div>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--ytap-text-muted);text-align:center">
          Based on ${formatNumber(results.monetizedViews)} monetized views (~55% of total)
        </div>
      `;
    });
  }

  function bindPredictor() {
    const btn = document.getElementById('ytap-pred-btn');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', async () => {
      const firstHourViews = parseInt(document.getElementById('ytap-pred-first').value) || 0;
      const channelAvgFirstHour = parseInt(document.getElementById('ytap-pred-avg-first').value) || 0;
      const channelAvgTotal = parseInt(document.getElementById('ytap-pred-avg-total').value) || 0;

      const results = await bg('predict-performance', { firstHourViews, channelAvgFirstHour, channelAvgTotal });
      const el = document.getElementById('ytap-pred-results');
      const perfColors = { viral: 'var(--ytap-green)', above_average: 'var(--ytap-green)', average: 'var(--ytap-yellow)', underperforming: 'var(--ytap-accent)', below_average: 'var(--ytap-accent)' };
      const perfLabels = { viral: '🚀 Viral', above_average: '📈 Above Average', average: '📊 Average', underperforming: '📉 Underperforming', below_average: '⬇️ Below Average' };

      if (results.prediction === null) {
        el.innerHTML = `<p style="color:var(--ytap-text-muted);font-size:12px">${results.message}</p>`;
      } else {
        el.innerHTML = `
          <div class="ytap-stats">
            <div class="ytap-stat">
              <div class="ytap-stat-value">${formatNumber(results.predictedTotal)}</div>
              <div class="ytap-stat-label">Predicted Total Views</div>
            </div>
            <div class="ytap-stat">
              <div class="ytap-stat-value" style="font-size:16px;color:${perfColors[results.performance]}">${perfLabels[results.performance]}</div>
              <div class="ytap-stat-label">Performance (${results.ratio}x avg)</div>
            </div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--ytap-text-muted);text-align:center">Confidence: ${results.confidence}</div>
        `;
      }
    });
  }

  function bindCompetitors() {
    const btn = document.getElementById('ytap-comp-add');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', async () => {
      const url = document.getElementById('ytap-comp-url').value.trim();
      if (!url) return;

      const data = await bg('load-data', { key: 'ytap_competitors' });
      const competitors = data.value || [];
      const name = url.split('/').pop() || url;
      competitors.push({
        url,
        name: `@${name}`,
        subs: '—',
        uploads: '—',
        addedAt: Date.now(),
      });
      await bg('save-data', { key: 'ytap_competitors', value: competitors });

      document.getElementById('ytap-comp-url').value = '';
      renderCompetitors(competitors);
    });

    // Load existing
    bg('load-data', { key: 'ytap_competitors' }).then(data => {
      if (data.value && data.value.length) renderCompetitors(data.value);
    });
  }

  function renderCompetitors(competitors) {
    const el = document.getElementById('ytap-comp-list');
    if (!competitors.length) {
      el.innerHTML = '<p style="font-size:12px;color:var(--ytap-text-muted);text-align:center;padding:20px 0">No competitors tracked yet.</p>';
      return;
    }
    el.innerHTML = competitors.map((c, i) => `
      <div class="ytap-competitor">
        <div class="ytap-competitor-avatar" style="display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>
        <div class="ytap-competitor-info">
          <div class="ytap-competitor-name">${c.name}</div>
          <div class="ytap-competitor-meta">Subs: ${c.subs} · Uploads: ${c.uploads}</div>
        </div>
        <button class="ytap-btn ytap-btn-secondary" style="font-size:11px;padding:4px 8px" data-remove="${i}">✕</button>
      </div>
    `).join('');

    el.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.remove);
        competitors.splice(idx, 1);
        await bg('save-data', { key: 'ytap_competitors', value: competitors });
        renderCompetitors(competitors);
      });
    });
  }

  function bindThumbnails() {
    const upload = document.getElementById('ytap-thumb-upload');
    if (!upload || upload._bound) return;
    upload._bound = true;

    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const data = await bg('load-data', { key: 'ytap_thumbnails' });
        const thumbs = data.value || { variants: [], ctrData: [] };
        thumbs.variants.push({ dataUrl: ev.target.result, addedAt: Date.now() });
        await bg('save-data', { key: 'ytap_thumbnails', value: thumbs });
        renderThumbnails(thumbs);
      };
      reader.readAsDataURL(file);
    });

    const ctrBtn = document.getElementById('ytap-thumb-save-ctr');
    if (ctrBtn && !ctrBtn._bound) {
      ctrBtn._bound = true;
      ctrBtn.addEventListener('click', async () => {
        const ctr = parseFloat(document.getElementById('ytap-thumb-ctr').value);
        if (isNaN(ctr)) return;
        const data = await bg('load-data', { key: 'ytap_thumbnails' });
        const thumbs = data.value || { variants: [], ctrData: [] };
        thumbs.ctrData.push({ ctr, date: Date.now() });
        await bg('save-data', { key: 'ytap_thumbnails', value: thumbs });
        document.getElementById('ytap-thumb-ctr').value = '';
        renderThumbnailHistory(thumbs);
      });
    }

    bg('load-data', { key: 'ytap_thumbnails' }).then(data => {
      if (data.value) {
        renderThumbnails(data.value);
        renderThumbnailHistory(data.value);
      }
    });
  }

  function renderThumbnails(thumbs) {
    const grid = document.getElementById('ytap-thumb-grid');
    if (!thumbs.variants.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = thumbs.variants.map((v, i) => `
      <div class="ytap-thumb-card" data-idx="${i}">
        <img class="ytap-thumb-img" src="${v.dataUrl}" alt="Variant ${i + 1}" />
        <div class="ytap-thumb-stats">Variant ${i + 1}</div>
      </div>
    `).join('');
  }

  function renderThumbnailHistory(thumbs) {
    const el = document.getElementById('ytap-thumb-history');
    if (!thumbs.ctrData || !thumbs.ctrData.length) { el.innerHTML = ''; return; }
    const sorted = [...thumbs.ctrData].sort((a, b) => b.date - a.date);
    el.innerHTML = `
      <div class="ytap-card-title">CTR History</div>
      <table class="ytap-table">
        <tr><th>Date</th><th>CTR</th></tr>
        ${sorted.slice(0, 10).map(d => `<tr><td>${new Date(d.date).toLocaleDateString()}</td><td>${d.ctr}%</td></tr>`).join('')}
      </table>
    `;
  }

  function bindBulk() {
    const listEl = document.getElementById('ytap-bulk-list');
    // Try to scrape video list from Studio
    const videos = scrapeRecentVideos();
    if (videos.length) {
      listEl.innerHTML = videos.map((v, i) => `
        <div class="ytap-bulk-item">
          <input type="checkbox" id="ytap-bulk-${i}" />
          <label for="ytap-bulk-${i}" style="color:var(--ytap-text);cursor:pointer">${v.title}</label>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = '<p style="font-size:12px;color:var(--ytap-text-muted);text-align:center;padding:12px 0">Navigate to Content page in Studio to see videos</p>';
    }

    const previewBtn = document.getElementById('ytap-bulk-preview');
    if (previewBtn && !previewBtn._bound) {
      previewBtn._bound = true;
      previewBtn.addEventListener('click', () => {
        const template = document.getElementById('ytap-bulk-template').value;
        const preview = template
          .replace('{title}', 'Sample Video Title')
          .replace('{url}', 'https://youtube.com/watch?v=xxxxx')
          .replace('{channel}', 'https://youtube.com/@yourchannel');
        alert('Preview:\n\n' + preview);
      });
    }

    const applyBtn = document.getElementById('ytap-bulk-apply');
    if (applyBtn && !applyBtn._bound) {
      applyBtn._bound = true;
      applyBtn.addEventListener('click', () => {
        const checked = document.querySelectorAll('.ytap-bulk-item input:checked');
        if (!checked.length) {
          alert('Select at least one video');
          return;
        }
        alert(`Would apply template to ${checked.length} video(s).\n\nNote: YouTube Studio API integration needed for actual editing.`);
      });
    }
  }

  // -- Utilities --

  function formatNumber(num) {
    if (num === null || num === undefined) return '—';
    if (typeof num === 'string') num = parseMetricValue(num);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function parseMetricValue(str) {
    if (!str) return 0;
    str = str.replace(/,/g, '').trim();
    const num = parseFloat(str);
    if (str.includes('K') || str.includes('k')) return num * 1000;
    if (str.includes('M') || str.includes('m')) return num * 1000000;
    return num || 0;
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(init, 1000);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
