# YT Analytics Pro — Spec

## Overview
Chrome extension providing YouTube creators with real-time analytics overlay, performance prediction, thumbnail testing, upload timing optimization, competitor tracking, sentiment analysis, revenue estimation, tag optimization, and bulk description editing.

## Target Users
YouTube creators (10K–1M subs) who want data-driven channel growth without leaving YouTube Studio.

## Features

### Free Tier
1. **Analytics Overlay** — Injects real-time stats panel on YouTube Studio dashboard (views, subs, watch time today)
2. **Comment Sentiment Analyzer** — Breaks comments into positive/negative/questions with pie chart
3. **Tag Optimizer** — Suggests high-traffic tags based on video title/description keywords
4. **Revenue Estimator** — Estimates per-video revenue based on views × niche CPM rates

### Pro Tier ($12.99/mo via ExtensionPay)
5. **Video Performance Predictor** — Compares first-hour metrics to channel average, predicts final performance
6. **Thumbnail A/B Test Helper** — Save thumbnail variants, track CTR over time periods
7. **Best Time to Upload** — Analyzes audience activity patterns, recommends optimal upload windows
8. **Competitor Channel Tracker** — Track up to 10 competitor channels (subs, uploads, view trends)
9. **Bulk Video Description Editor** — Select multiple videos, apply template-based description changes

## Technical
- Manifest V3
- Content scripts: `studio.youtube.com/*`, `youtube.com/*`
- Service worker background script
- ExtensionPay: `ExtPay('yt-analytics-pro')` — Pro at $12.99/mo
- Storage: chrome.storage.local + chrome.storage.sync
- No external API keys required (scrapes public YouTube data + YouTube Data API via user's own key optional)

## Monetization
- Free: Core overlay, sentiment, tags, revenue estimate
- Pro: Predictor, A/B thumbnails, upload timing, competitor tracking, bulk editor
