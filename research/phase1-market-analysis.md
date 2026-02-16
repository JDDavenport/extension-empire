# Phase 1 Market Analysis — First Extension Selection

*2026-02-14 | The Architect*

---

## Research Methodology

1. Analyzed Chrome Web Store trending categories and 2025 favorites
2. Reviewed competitor reviews and complaints
3. Cross-referenced with proven solo-dev revenue models (Rick Blyth, Closet Tools, GoFullPage)
4. Applied filters: buildable in <48 hours, no server needed, freemium-friendly, low competition in niche

## Extension Candidates Evaluated

### 1. 🏆 QuickCopy Pro — Advanced Copy & Paste Toolkit
**Category:** Productivity / Text Tools
**The Gap:** Copying text from websites is broken. You copy, you paste, you get formatting garbage. Or you need to copy multiple things. Or you want to transform text (UPPERCASE, trim whitespace, extract emails/URLs from a block). Existing clipboard managers are bloated, require too many permissions, or have bad UX.

**Why this wins for Extension #1:**
- Universal pain point — EVERYONE copies and pastes
- Simple to build (no server, no API, pure JS)
- Clear freemium split (basic copy clean = free, multi-clipboard + text transforms = pro)
- Keyword-rich niche: "clipboard manager", "copy paste", "text tools", "remove formatting"
- Existing options: Clipboard History Pro (130K users but clunky), Copy History+ (smaller). Room for a cleaner, faster option.

**Features (Free Tier):**
- Right-click → Copy as Plain Text (strips ALL formatting)
- Right-click → Copy & Trim (strips whitespace + formatting)
- Popup with last 10 copied items (session clipboard history)

**Features (Pro Tier — $2.99/mo):**
- Unlimited clipboard history (persisted across sessions)
- Text transformations: UPPERCASE, lowercase, Title Case, Sentence case
- Extract all emails from selected text
- Extract all URLs from selected text
- Find & replace in clipboard
- Export clipboard history as TXT/CSV
- Keyboard shortcuts for all actions

**Revenue Estimate (12 month):**
- Conservative: 5K installs × 20% WAU × 1.5% conversion × $2.99 = $45/mo
- Moderate: 20K installs × 25% WAU × 2% conversion × $2.99 = $300/mo
- Optimistic: 50K installs × 30% WAU × 3% conversion × $2.99 = $1,350/mo

### 2. TabSnap — One-Click Tab Exporter
**Category:** Productivity / Tab Management
**The Gap:** People have 50+ tabs open. They want to save all tab URLs as a list. Existing "tab manager" extensions are complex. This does ONE thing: export your tabs.
**Status:** Good candidate for Extension #2
**Build time:** ~1 day

### 3. JSON Pretty — Instant JSON Formatter & Viewer
**Category:** Developer Tools
**The Gap:** Developer audience, high search volume for "json formatter". Several exist but many are ugly, bloated with features, or have invasive permissions.
**Status:** Good candidate for Extension #3 (developer audience pays well)
**Build time:** ~1 day

### 4. SiteColors — Extract Color Palette From Any Website
**Category:** Design / Developer Tools
**The Gap:** Designers constantly need to identify colors on websites. Several exist but most are limited to one color at a time. This extracts the FULL palette.
**Status:** Extension #4 candidate
**Build time:** ~2 days

### 5. FormFiller Lite — Auto-Fill Repetitive Form Fields
**Category:** Productivity
**The Gap:** Not a password manager — fills custom fields (job applications, contact forms) with saved snippets. Existing options are either dead (Manifest V2) or enterprise-only.
**Status:** Extension #5 candidate — higher complexity but high value
**Build time:** ~3 days

## Decision

**Extension #1: QuickCopy Pro**

Rationale:
1. Lowest build complexity — achievable this weekend
2. Universal audience — not limited to developers or designers
3. Clear monetization path — free/pro split is obvious to users
4. Strong keyword potential — clipboard, copy, paste, text tools
5. Existing competitors are mediocre — room for a clean, fast, beautiful option
6. Zero server costs — everything runs locally
7. Natural upsell — users discover they want more features after using the free version

## Next Steps

1. Build QuickCopy Pro (today/tomorrow)
2. Submit to Chrome Web Store
3. While waiting for review, build TabSnap and JSON Pretty
4. Week 2: Evaluate installs, iterate on winner
