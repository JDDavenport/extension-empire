# Extension Spec: WAPower — WhatsApp Web Power Tools

## One-Line Pitch
Scheduled messages, templates, contact labels, and bulk messaging for WhatsApp Web — at 1/3 the price of WA Web Plus.

## Target User
Small business owners, freelancers, and sales teams who use WhatsApp for customer communication. Massive in Latin America, India, SE Asia, Africa. Anyone doing 20+ WhatsApp conversations per day.

## Pain Point
WhatsApp Web has ZERO power features — no scheduled messages, no templates, no CRM labels, no bulk messaging. WA Web Plus proved insane demand (1M+ users, $28-40/mo) but is overpriced for small businesses.

## Competition
| Extension | Installs | Rating | Gap |
|-----------|----------|--------|-----|
| WA Web Plus | 1M+ | 4.2★ | Expensive ($28-40/mo), overkill features |
| WA Toolkit | 10K+ | 3.8★ | Limited features, buggy |
| Rapido | ~1K | 4.0★ | New, limited |

## Features (MVP — Free Tier)
1. **Message templates** — Save and insert reusable messages with one click (up to 5 free)
2. **Quick replies** — Keyboard shortcut to insert templates (/t1, /t2, etc.)
3. **Chat labels** — Color-code conversations (Lead, Customer, VIP, Follow-up)
4. **Unread counter** — Show total unread across all chats in badge

## Features (Pro — $9.99/mo)
1. **Scheduled messages** — Write now, send later (pick date/time)
2. **Unlimited templates** — No cap on saved templates
3. **Bulk messaging** — Send to multiple contacts from a list (with randomized delays)
4. **Auto-reply** — Set away messages with schedule
5. **Chat analytics** — Response time tracking, message volume by contact
6. **Export chats** — Download conversations as CSV/PDF

## Revenue Model
- Free: 5 templates + labels + quick replies (hooks users)
- Pro: $9.99/mo via ExtensionPay (60-70% cheaper than WA Web Plus)
- Target: 3-5% free-to-paid conversion
- At 10K installs with 4% conversion = 400 subscribers × $10 = $4,000/mo

## Technical Notes
- Permissions: storage, alarms, activeTab
- Host permissions: web.whatsapp.com
- APIs: None — pure DOM manipulation on WhatsApp Web
- Backend required: No
- Scheduled messages: Use chrome.alarms + content script to send at scheduled time (tab must be open)
- Must handle WhatsApp Web's React-based DOM carefully

## Build Estimate
- MVP (free features): 10-14 hours
- Pro features: 14-20 hours
- Total: ~24-30 hours

## Brand
- Name: **WAPower** (or QuickWhats, ChatPower)
- Publisher: Same anonymous brand
- Support email: Anonymous ProtonMail

## Success Metrics (30 days)
- Installs: >1,000 (WhatsApp has massive global audience)
- Rating: >4.0 stars
- Revenue: First paying user
