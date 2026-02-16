# FB Marketplace Pro — Spec

## Overview
Chrome extension for Facebook Marketplace power sellers. Auto-relist, bulk create, message templates, price scheduling, cross-posting, sales tracking, listing quality checks, competitor pricing, and bulk bump/renew.

## Features
| Feature | Free | Pro ($9.99/mo) |
|---|---|---|
| Sales tracker (last 10) | ✅ | ✅ (unlimited) |
| Listing quality checker | ✅ | ✅ |
| Message templates (3) | ✅ | ✅ (unlimited) |
| Auto-relist | ❌ | ✅ |
| Bulk listing creator | ❌ | ✅ |
| Price drop scheduler | ❌ | ✅ |
| Cross-post helper | ❌ | ✅ |
| Competitor price scanner | ❌ | ✅ |
| Bump/renew all | ❌ | ✅ |

## Technical
- Manifest V3, content scripts on `facebook.com/marketplace/*`
- ExtensionPay: `ExtPay('fb-marketplace-pro')`, Pro $9.99/mo
- Storage: chrome.storage.local for data, chrome.storage.sync for settings
- No external servers beyond ExtensionPay
