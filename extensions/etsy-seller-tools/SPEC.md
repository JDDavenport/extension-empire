# Etsy Seller Power Tools — Specification

## Overview
Chrome extension for Etsy sellers providing SEO analysis, competitor intelligence, listing optimization, and productivity tools. Freemium model at $14.99/mo Pro.

## Target Market
- 7M+ active Etsy sellers
- Competitors: Marmalead ($19/mo), eRank (freemium but limited), Sale Samurai ($9.99/mo)
- Differentiation: lower price, better UX, more features in free tier

## Features

### Free Tier
- **SEO Tag Analyzer** — Score listing tags (0-100) based on relevance, competition, length optimization
- **Listing Quality Score** — Grade photos, tags, description, shipping settings
- **Competitor Spy** — 3 lookups/day: bestsellers, pricing, review velocity
- **Star Seller Tracker** — Overlay on dashboard showing progress to Star Seller
- **Review Response Templates** — 5 built-in templates

### Pro Tier ($14.99/mo)
- Unlimited competitor lookups
- **Bulk Tag Editor** — Edit tags across multiple listings at once
- **Keyword Research Tool** — Search volume estimates, trend data
- **Sales Dashboard Overlay** — Enhanced analytics on seller dashboard
- **Renewal Tracker** — Alerts before listings expire
- Unlimited review response templates (custom)
- Priority support

## Technical Architecture
- Manifest V3
- Content scripts: etsy.com seller pages
- Popup: keyword research, competitor search, settings
- Background: ExtensionPay, alarms for renewal tracking
- Storage: chrome.storage.local + chrome.storage.sync

## Monetization
- ExtensionPay integration: `ExtPay('etsy-seller-tools')`
- Free tier generous enough for organic growth
- Pro conversion via feature gates + usage limits
