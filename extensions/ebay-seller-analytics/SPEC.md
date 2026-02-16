# eBay Seller Analytics — Extension Spec

## Overview
Chrome extension that overlays eBay Seller Hub with analytics, profit calculations, competitor monitoring, listing optimization scores, and bulk actions.

## Target User
eBay sellers (25M+ globally) who lack the sophisticated tooling Amazon sellers enjoy (Jungle Scout, Helium 10). Terapeak (eBay-owned) has 3.2★ and terrible UX. No dominant Chrome extension exists in this space.

## Features

### Free Tier
- **Sales Velocity Tracker** — Items sold per day/week/month with trend arrows and sparkline charts
- **Profit Calculator Overlay** — Inline profit/margin on each listing factoring eBay fees (13.25% final value), PayPal/payment fees (2.9%+$0.30), shipping costs, cost of goods (user-entered)
- **Listing Quality Score** — Score 0-100 based on title length/keyword optimization, photo count (12 ideal), description length, item specifics completeness, returns policy, free shipping
- **Revenue Dashboard** — Summary overlay on Seller Hub with daily/weekly/monthly revenue, fees paid, net profit

### Pro Tier ($12.99/mo)
- **Competitor Price Monitor** — Track up to 50 competitor listings, alert when undercut by >5%, price history charts
- **Bulk Listing Actions** — Relist ended items in bulk, bulk price updates (% or fixed), bulk mark as shipped
- **Advanced Analytics** — Category performance breakdown, best selling times, buyer geography heatmap
- **Export** — CSV export of all analytics data

## Technical Architecture
- **Manifest V3** with service worker background
- **Content scripts** inject into `ebay.com/sh/*` (Seller Hub) and `ebay.com/itm/*` (listing pages)
- **Popup** for dashboard, settings, and quick stats
- **Chrome Storage** (sync + local) for settings and tracking data
- **ExtensionPay** for subscription management: `ExtPay('ebay-seller-analytics')`

## Monetization
- ExtensionPay integration
- Free tier: Sales velocity, profit calculator, listing score, basic dashboard
- Pro tier: $12.99/mo — competitor monitoring, bulk actions, advanced analytics, export

## Revenue Projection
At 10K installs with 5% conversion: ~$6,500/mo

## Pages Targeted
- `ebay.com/sh/ovw` — Seller Hub overview (dashboard overlay)
- `ebay.com/sh/lst/active` — Active listings (quality scores, bulk actions)
- `ebay.com/sh/lst/sold` — Sold items (velocity tracking)
- `ebay.com/sh/lst/unsold` — Unsold items (relist actions)
- `ebay.com/itm/*` — Individual listings (competitor comparison)
- `ebay.com/sch/*` — Search results (competitor monitoring)
