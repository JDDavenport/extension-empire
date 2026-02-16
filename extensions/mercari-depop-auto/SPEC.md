# Extension Spec: RelistPro — Mercari & Depop Seller Automation

## One-Line Pitch
Automate relisting, sharing, and bulk editing on Mercari and Depop to boost sales — the "Closet Tools" for every reseller platform.

## Target User
Resellers on Mercari and Depop who spend 1-3 hours/day manually relisting items to stay visible in search results. Many manage 100-1000+ listings across platforms.

## Pain Point
Mercari and Depop bury old listings in search results. The ONLY way to stay visible is to manually delete and relist items — one by one, every single day. For a seller with 500 listings, this takes HOURS. Closet Tools solved this on Poshmark ($42K/mo). No equivalent exists for Mercari/Depop.

## Competition
| Extension | Installs | Rating | Gap |
|-----------|----------|--------|-----|
| PrimeLister | 10K+ | 3.5★ | Buggy, unreliable, users frustrated |
| Crosslist Magic | ~1K | 4.3★ | Copy-focused only, no automation |
| List Perfectly | Web app | 3.8★ | Expensive ($29-89/mo), overkill for most |

## Features (MVP — Free Tier)
1. **One-click relist** — Delete and relist any Mercari/Depop item with one click (preserves all details)
2. **Bulk select** — Select multiple listings for batch operations
3. **Listing stats overlay** — Show days since listed, view count, like count on each listing
4. **Activity dashboard** — Track daily relists, views, sales in popup

## Features (Pro — $19.99/mo)
1. **Auto-relist scheduler** — Set items to auto-relist every X days
2. **Bulk relist** — Relist up to 50 items at once with randomized timing (avoid detection)
3. **Smart pricing** — Suggest price adjustments based on similar sold items
4. **Cross-platform copy** — Copy a Mercari listing to Depop format (and vice versa) with one click
5. **Sales analytics** — Track revenue, sell-through rate, best-selling categories over time
6. **Listing templates** — Save reusable description templates with variables

## Revenue Model
- Free: One-click relist + stats overlay (hooks users, demonstrates value)
- Pro: $19.99/mo via ExtensionPay
- Target: 3-5% free-to-paid conversion
- At 10K installs with 4% conversion = 400 subscribers × $20 = $8,000/mo

## Technical Notes
- Permissions: activeTab, storage, alarms (for scheduling)
- Host permissions: mercari.com, depop.com
- APIs: None — pure DOM manipulation + content scripts
- Backend required: No (all client-side, ExtensionPay handles billing)
- Must use randomized delays between actions to mimic human behavior
- Must handle Mercari/Depop DOM changes gracefully (version detection)

## Build Estimate
- MVP (free features): 8-12 hours
- Pro features: 12-16 hours
- Store listing + icons: 2 hours
- Total: ~24 hours

## Anti-Detection Strategy
- Randomized delays (2-8 seconds between actions)
- Human-like scroll patterns
- Rate limiting (max 50 actions/hour default)
- Pause on tab unfocus
- User-configurable speed settings

## Brand
- Name: **RelistPro** (or FlipHelper, BoostList — test alternatives)
- Publisher: Generic brand name (no personal identity)
- Support email: Anonymous ProtonMail

## Success Metrics (30 days)
- Installs: >500
- Rating: >4.0 stars
- Revenue: >$0 (first paying user)
- 60-day target: 2,000+ installs, $1,000+/mo MRR

## Risks
- Mercari/Depop may change DOM structure (mitigation: version detection, quick patches)
- Platform ToS may prohibit automation (mitigation: position as "productivity tool", user-initiated actions only)
- PrimeLister could improve (mitigation: ship faster, better UX, lower price)
