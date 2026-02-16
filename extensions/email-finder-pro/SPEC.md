# Email Finder Pro — SPEC

## Overview
Chrome extension that extracts contact info from LinkedIn profiles and company websites, infers professional email addresses using common patterns, and verifies them via MX record checks.

## Monetization
- **Free tier**: 10 lookups/day
- **Pro ($19.99/mo via ExtensionPay)**: Unlimited lookups, bulk extract from LinkedIn search, CSV export

## Features
1. **LinkedIn Profile Extraction** — Name, title, company from any LinkedIn profile page
2. **Email Pattern Inference** — Generates candidates: first@co, first.last@co, flast@co, firstl@co
3. **MX Record Verification** — Background service worker checks domain has valid mail server
4. **Bulk Extract (Pro)** — Extract all contacts from LinkedIn search results page
5. **Company Website Scraping** — Find mailto: links and team page emails on any site
6. **Contact CRM** — Save, search, tag contacts in chrome.storage
7. **CSV Export (Pro)** — Export saved contacts
8. **One-click Copy** — Copy best email to clipboard

## Technical Stack
- Manifest V3
- Content scripts: linkedin.com/*, optional on all URLs
- Background service worker with ExtensionPay
- Popup UI for CRM, search, export
- chrome.storage.local for contact DB

## File Structure
```
src/
├── manifest.json
├── background.js
├── content.js
├── content-web.js
├── popup.html
├── popup.js
├── styles.css
├── ExtPay.js (vendored)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
