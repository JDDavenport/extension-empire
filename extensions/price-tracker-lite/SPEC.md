# Price Tracker Lite — Extension Spec

## Overview
Tracks price changes on Amazon/eBay product pages and shows price history chart in popup.

## Features
### Free Tier
- Track prices on Amazon & eBay product pages
- View 30-day price history chart
- Price drop badge on icon
- Track up to 10 products

### Pro Tier ($2.99/mo)
- Unlimited product tracking
- Price drop alerts (notifications)
- Export price history CSV
- Multi-currency support

## Permissions
- `activeTab` — read price from current page
- `storage` — persist price history

## Technical
- Manifest V3, service worker background
- Content script extracts price via DOM selectors
- Canvas-based mini chart in popup
- Storage: `{ [url]: { prices: [{date, price}], title, image } }`
