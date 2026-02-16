# Top 10 Chrome Extension Opportunities — February 2026

Research completed by extension-scout-v1. Sources: IndieHackers verified revenue, Reddit r/SaaS, r/indiehackers, ExtensionPay case studies, Chrome Web Store listings, Rick Blyth's extension playbook.

---

## Key Pattern from Winners

The extensions making real indie money share ONE trait: **they enhance a SPECIFIC platform where users already make money**. Closet Tools ($42K/mo on Poshmark), Merch Wizard (6-figures on Amazon Merch), GMass ($130K/mo on Gmail), Easy Folders ($3.7K MRR on ChatGPT/Claude). The formula is: **Platform where money flows + friction point + automation = willingness to pay**.

---

## #1 — Airbnb Host Power Tools

**Concept:** Chrome extension that overlays Airbnb's host dashboard with competitor price tracking, automated guest screening (review analysis), and seasonal pricing suggestions.

**Target user:** Airbnb hosts (4M+ listings globally) frustrated by Airbnb's bare-bones host UI, manually checking competitor pricing, and slow guest vetting.

**Competition:**
- AirDNA (web app, not extension, $20-100/mo, 4.2★) — expensive, overkill for casual hosts
- Hostaway (PMS, not extension) — enterprise-focused
- PriceLabs (web app) — no browser integration
- **No dominant Chrome extension exists for hosts.** This is a gap.

**Revenue model:** Freemium. Free: basic competitor view. Pro: $15/mo for pricing suggestions, auto-screening, calendar optimization.

**Why NOW:** Airbnb host count is at ATH, margins are compressing, hosts NEED pricing intelligence. Existing tools are expensive web apps, not lightweight extensions. Post-COVID hosting is more competitive = hosts will pay for edge.

**Build complexity:** ~20-30 hours MVP. Scrape Airbnb listing pages for comp data, overlay UI on host dashboard. No backend needed for V1 (all client-side scraping).

**Revenue at 10K installs:** $5K-15K/mo (hosts are used to paying for tools, high conversion potential)

---

## #2 — Mercari/Depop Seller Automation (The "Next Closet Tools")

**Concept:** Automation extension for Mercari and Depop sellers — auto-relist, share/boost listings, bulk edit, cross-platform listing copy.

**Target user:** Resellers on Mercari/Depop (millions of active sellers) who manually relist items to stay visible in search. The exact same pain Closet Tools solved for Poshmark at $42K/mo.

**Competition:**
- Closet Tools (Poshmark only, $30/mo, proven $42K/mo) — doesn't support Mercari/Depop
- PrimeLister (3.5★, 10K+ users) — cross-listing but buggy, users complain about reliability
- Crosslist Magic (4.3★, 58 ratings) — copy-focused, not automation
- **No "Closet Tools for Mercari" exists with dominant market share**

**Revenue model:** $20-30/mo subscription (proven price point from Closet Tools precedent)

**Why NOW:** Mercari and Depop have grown massively. Resellers crosslist across 3-5 platforms but automation tools lag behind Poshmark's ecosystem. PrimeLister's 3.5★ rating = users are frustrated with existing options.

**Build complexity:** ~16-24 hours MVP. DOM manipulation on Mercari/Depop, automate relisting and sharing. Pure client-side.

**Revenue at 10K installs:** $10K-25K/mo (resellers pay because it directly makes them money)

---

## #3 — ChatGPT/Claude Conversation Manager Pro

**Concept:** Folders, search, tagging, prompt library, and export for ChatGPT and Claude conversations — but BETTER than Easy Folders.

**Target user:** Power AI users (developers, writers, researchers) drowning in hundreds of unorganized ChatGPT conversations.

**Competition:**
- Easy Folders ($3.7K MRR verified, growing) — proven demand but one dev, limited features
- Superpower ChatGPT (4.0★, 200K+ users) — free, but cluttered and unreliable after updates
- ChatGPT Prompt Genius (3.8★) — export-focused, limited org features

**Revenue model:** Freemium. Free: basic folders. Pro: $5-8/mo for search, tagging, prompt library, cross-AI sync.

**Why NOW:** ChatGPT has 200M+ weekly users. OpenAI's native UI is still terrible for organization. Easy Folders proved the model at $42K total revenue in 6 months. Room for a better-polished competitor. Claude growing fast = multi-platform opportunity.

**Build complexity:** ~12-20 hours MVP. DOM injection into ChatGPT/Claude UI. localStorage for data. No backend needed.

**Revenue at 10K installs:** $3K-8K/mo (lower price point but huge addressable market)

---

## #4 — eBay Seller Analytics & Listing Optimizer

**Concept:** Chrome extension overlaying eBay with real-time competitor pricing, sell-through rates, SEO title optimization, and listing quality scores.

**Target user:** eBay sellers (25M+ globally) who lack the sophisticated tooling that Amazon sellers enjoy (Jungle Scout, Helium 10 etc.).

**Competition:**
- Terapeak (owned by eBay, clunky, limited) — 3.2★, users hate the UX
- ZIK Analytics (web app, $25-50/mo) — not an extension
- No dominant Chrome extension equivalent of "Jungle Scout for eBay"

**Revenue model:** $15-25/mo subscription

**Why NOW:** Amazon seller tools are a billion-dollar industry. eBay seller tools are 5 years behind. eBay has 184M active buyers. Rick Blyth proved the "marketplace seller extension" model with Merch Wizard. Terapeak's terrible UX = ripe for disruption.

**Build complexity:** ~24-36 hours MVP. Overlay on eBay listing/search pages, scrape sold item data, calculate metrics.

**Revenue at 10K installs:** $8K-20K/mo (eBay sellers pay for ROI tools)

---

## #5 — LinkedIn Engagement Autopilot

**Concept:** Extension that auto-tracks your LinkedIn post performance, suggests optimal posting times, manages saved/bookmarked connections with CRM-like notes, and drafts contextual comments.

**Target user:** B2B sales professionals, recruiters, and personal-brand builders who spend 1-2 hours/day on LinkedIn manually.

**Competition:**
- BlackMagic.so ($3K/mo verified, Twitter-focused) — no LinkedIn version
- Dux-Soup (4.0★, LinkedIn automation) — focused on outreach, not engagement analytics
- Shield Analytics ($6/mo, web app) — not an extension, basic
- AuthoredUp (4.5★, 30K+ users, $20/mo) — posting-focused but no CRM/engagement tracking

**Revenue model:** $12-20/mo subscription

**Why NOW:** LinkedIn is THE B2B platform. 1B+ members. Everyone's trying to "build in public" on LinkedIn now. Post engagement is currency. No extension combines analytics + CRM + smart commenting well. AuthoredUp covers posting but misses engagement management.

**Build complexity:** ~20-30 hours MVP. LinkedIn DOM parsing, local storage CRM, posting analytics overlay.

**Revenue at 10K installs:** $5K-15K/mo

---

## #6 — Google Meet / Zoom "Meeting Intelligence" Sidebar

**Concept:** Extension that adds a sidebar to Google Meet/Zoom web client showing attendee LinkedIn profiles, company info, meeting notes from previous calls, and action item tracking.

**Target user:** Sales reps and account managers doing 5-10 video calls/day who scramble to look up attendees before calls.

**Competition:**
- Google Meet Enhancement Suite (4.0★, dropping — users report broken features post-updates)
- Fireflies.ai (recording/transcription, not profile intelligence)
- Grain (heavy, expensive, enterprise)
- **No lightweight "who am I meeting with?" sidebar extension**

**Revenue model:** $10-15/mo subscription

**Why NOW:** Remote selling is permanent. Google Meet Enhancement Suite is breaking (reviews confirm features stop working after Google updates). Sales teams need context, not just recordings. The "meeting prep" gap is real.

**Build complexity:** ~24-36 hours MVP. Scrape calendar invite emails, match to LinkedIn profiles via name matching, sidebar overlay on Meet/Zoom.

**Revenue at 10K installs:** $5K-12K/mo

---

## #7 — Etsy SEO & Listing Score Extension

**Concept:** Overlay on Etsy that shows any listing's estimated monthly sales, keyword ranking, SEO score, and tag optimization suggestions.

**Target user:** Etsy sellers (7.5M+ active sellers) who guess at tags and titles without data.

**Competition:**
- EverBee (freemium, 4.3★, 200K+ users, dominant) — strong but users complain about accuracy
- Alura (newer, 4.1★) — less established
- eRank (web app, not extension) — clunky
- GPT for Ecom (3.2★) — buggy, login issues, users frustrated

**Revenue model:** $10-20/mo subscription

**Why NOW:** Etsy seller tools market is less saturated than Amazon's. EverBee is good but not unbeatable. GPT for Ecom at 3.2★ shows frustrated users ready to switch. Etsy's algorithm changes keep sellers anxious = they pay for intelligence.

**Build complexity:** ~20-30 hours. Overlay on Etsy search/listing pages, estimate sales from review velocity, analyze tags/titles.

**Revenue at 10K installs:** $5K-15K/mo

**Honest caveat:** EverBee is strong here. You'd need a clear differentiator (better accuracy, AI-powered title rewriting, or focusing on a sub-niche like Etsy digital products).

---

## #8 — WhatsApp Web Power Tools

**Concept:** Enhanced WhatsApp Web with scheduled messages, message templates, contact labels/CRM, bulk messaging, and chat analytics.

**Target user:** Small business owners and freelancers who use WhatsApp for customer communication (especially in Latin America, India, SE Asia, Africa).

**Competition:**
- WA Web Plus (1M+ users, $28-40/mo!) — Rick Blyth estimates potential $280K/mo revenue. Dominant but expensive.
- WA Toolkit (3.8★) — limited features
- Rapido (newer, limited)
- **WA Web Plus proves MASSIVE demand but its price ($28-40/mo) leaves room for a cheaper alternative**

**Revenue model:** $9.99/mo (undercut WA Web Plus by 60-70%)

**Why NOW:** WhatsApp has 2B+ users. Business use is exploding. WA Web Plus proves the model at insane scale but at premium pricing. A well-built $10/mo competitor could capture price-sensitive small business users. Huge international market.

**Build complexity:** ~16-24 hours MVP. WhatsApp Web DOM manipulation, scheduled sends via content script timers, template storage in localStorage.

**Revenue at 10K installs:** $5K-15K/mo (massive TAM, price-sensitive but high volume)

---

## #9 — Shopify Store Spy / Competitor Intelligence

**Concept:** Extension that reveals any Shopify store's best-selling products, estimated traffic, recently added products, apps installed, and theme used.

**Target user:** Shopify store owners and dropshippers doing competitive research.

**Competition:**
- Koala Inspector (4.4★, 200K+ users, freemium) — dominant, well-established
- Commerce Inspector (4.1★) — decent but less popular
- ShopHunter (newer, web-based)
- This space is more competitive than others on this list

**Revenue model:** $15-20/mo subscription

**Why NOW:** Shopify has 4.6M+ stores. Dropshipping and DTC remain huge. Koala Inspector is good but premium features are expensive. There's room for better product-level sales estimation.

**Build complexity:** ~20-30 hours. Detect Shopify stores, parse public APIs/meta tags, estimate sales from product IDs.

**Revenue at 10K installs:** $4K-10K/mo

**Honest caveat:** Koala Inspector is well-entrenched. Harder to differentiate here. Ranked lower because of this.

---

## #10 — Google Sheets / Docs Productivity Enhancer

**Concept:** Extension adding power features to Google Sheets: named ranges manager, formula builder with AI, sheet comparison/diff, data validation templates, and one-click formatting macros.

**Target user:** Business analysts, ops teams, and freelancers who live in Google Sheets but miss Excel's power features.

**Competition:**
- Power Tools by Ablebits (4.0★, 10M+ users, $30/year) — dominant but bloated, users complain about performance
- Coefficient (newer, data connector focused)
- Sheetgo (workflows, not enhancement)

**Revenue model:** $5-8/mo or $49/year

**Why NOW:** Google Sheets adoption keeps growing. Ablebits Power Tools at 4.0★ with complaints about slowness = users want lighter alternatives. AI formula generation is a killer feature no current extension does well.

**Build complexity:** ~24-36 hours MVP. Google Sheets API + Sidebar UI. AI formula builder via API call.

**Revenue at 10K installs:** $3K-8K/mo

---

## Summary Rankings

| Rank | Extension | Competition Gap | Revenue Potential | Build Time | Confidence |
|------|-----------|----------------|-------------------|------------|------------|
| 1 | Mercari/Depop Seller Automation | 🟢 Wide open | $10-25K/mo | 16-24h | HIGH — Closet Tools proved model |
| 2 | Airbnb Host Power Tools | 🟢 No extension exists | $5-15K/mo | 20-30h | HIGH — massive underserved niche |
| 3 | WhatsApp Web Power Tools | 🟡 WA Web Plus dominant but overpriced | $5-15K/mo | 16-24h | HIGH — proven demand, price disruption |
| 4 | eBay Seller Analytics | 🟢 No "Jungle Scout for eBay" extension | $8-20K/mo | 24-36h | MEDIUM-HIGH |
| 5 | ChatGPT/Claude Conversation Manager | 🟡 Easy Folders exists but small | $3-8K/mo | 12-20h | MEDIUM-HIGH — fastest to build |
| 6 | LinkedIn Engagement Autopilot | 🟡 Fragmented competition | $5-15K/mo | 20-30h | MEDIUM — LinkedIn may break it |
| 7 | Etsy SEO & Listing Score | 🟡 EverBee is strong | $5-15K/mo | 20-30h | MEDIUM — need differentiator |
| 8 | Google Meet Meeting Intelligence | 🟢 No sidebar intel tool | $5-12K/mo | 24-36h | MEDIUM — platform instability risk |
| 9 | Shopify Store Spy | 🔴 Koala Inspector entrenched | $4-10K/mo | 20-30h | MEDIUM-LOW |
| 10 | Google Sheets Enhancer | 🔴 Ablebits has 10M users | $3-8K/mo | 24-36h | MEDIUM-LOW |

---

## The Playbook (What Winners Did)

1. **Closet Tools formula:** Pick a marketplace where people make money → automate their tedious daily task → charge $20-30/mo
2. **Easy Folders formula:** Pick a platform with millions of daily users and bad UX → fix ONE thing → charge $5-8/mo
3. **Rick Blyth formula:** Build free extensions first to capture emails → build paid version with power features → sell via your email list
4. **GMass formula:** Enhance a platform everyone uses (Gmail) with workflow automation → subscription model

**The sweet spot for a stealth, AI-buildable extension:** #1 (Mercari/Depop) or #3 (WhatsApp Web) — both have proven revenue models to copy, clear competition gaps, and can be built in 1-2 days with AI assistance. No backend needed. Anonymous brand. Pure Chrome Web Store distribution.
