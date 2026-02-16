# Amazon Seller Dashboard — SPEC

## Overview
Chrome extension for Amazon FBA/FBM sellers that overlays profit calculations, sales analytics, inventory alerts, BSR tracking, review monitoring, competitor tracking, keyword ranking, and PPC stats directly on Seller Central.

## Features
1. **Profit Calculator Overlay** — FBA fees, referral fees, shipping, COGS breakdown on product pages
2. **Sales Velocity Tracker** — Daily/weekly/monthly trend charts
3. **Inventory Alerts** — Low stock & stranded inventory warnings
4. **BSR Tracker** — Historical BSR chart per ASIN
5. **Review Monitor** — Highlights new reviews since last check
6. **Competitor ASIN Tracker** — Track price, BSR, review count changes
7. **Keyword Rank Tracker** — Monitor keyword positions for your listings
8. **PPC Quick Stats** — Campaign performance overlay
9. **CSV Export** — Export any report/data as CSV

## Technical
- Manifest V3
- Content scripts on `sellercentral.amazon.com/*` and `amazon.com/*`
- Service worker for background data sync & alarms
- ExtensionPay: `ExtPay('amazon-seller-dash')`
- Storage: `chrome.storage.local` for data, `chrome.storage.sync` for settings
- Charts: lightweight inline SVG/Canvas charts (no external lib)

## Monetization
- **Free**: Profit calculator, basic inventory alerts, review monitor
- **Pro ($19.99/mo)**: Sales velocity, BSR history, competitor tracker, keyword tracker, PPC stats, CSV export

## Permissions
- `storage`, `alarms`, `activeTab`
- Host: `*://sellercentral.amazon.com/*`, `*://www.amazon.com/*`
