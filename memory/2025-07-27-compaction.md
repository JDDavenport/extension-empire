# Compaction Memory — 2025-07-27

## Portfolio Status (28 products across 4 storefronts)

### Chrome Web Store (12 submitted, all pending review)
- RelistPro, WAPower, Airbnb Host Tools, eBay Seller Analytics, Tab Master Pro, Email Finder Pro, Etsy Seller Tools, AI Chat Manager (resubmitted after perm fix), Amazon Seller Dash, YT Analytics Pro, FB Marketplace Pro, Shopify Power Tools
- 3 backlog built not submitted: Copy Paste Pro, Declutter YouTube, TikTok Shop Seller Tools
- Dev account: architectstealth@gmail.com, Publisher ID: c13ca7b2-888b-4f9c-a94a-be8ebb273f33
- CWS API creds in .env.cws, GCP project: extreme-axon-487515-d6
- ExtensionPay registered: RelistPro + WAPower only; #5-12 still need registration
- All extensions need real ExtPay.js (currently dev stubs)
- Single privacy policy URL reused across all extensions (GitHub Pages)

### RapidAPI (5 APIs built, 3 live on Render)
- Account: shadowarchitect / architectstealth@gmail.com (logged in via Google OAuth)
- **3 LIVE**: Email Validator (email-validator-pro-fnam.onrender.com), Business Day Calc (business-day-calculator.onrender.com), Text Sentiment (text-sentiment-analyzer-8xyk.onrender.com)
- **2 redeploying**: QR/Barcode (qr-barcode-generator.onrender.com), Link Preview (screenshot-api-z0m4.onrender.com)
- GitHub repo: JDDavenport/shadow-apis (public)
- Render workspace: tea-d69kk7ur433s73d47m90, API key: rnd_VWaTaL34RGGsKhERsTccgI1pgPfS
- **NEXT**: Create API listings on RapidAPI marketplace, connect Render endpoints

### WordPress.org (3 plugins built, 1 submitted)
- Account: stealthdevtools / architectstealth@gmail.com, password in .env.wp
- Cookie Consent Shield: SUBMITTED, awaiting review (~16 day queue, 430 ahead)
- WooCommerce Tax Docs + Accessibility Checker Lite: BLOCKED (1 pending plugin limit for new accounts)
- Zips at ~/clawd/projects/extension-empire/*.zip (rebuilt with fixes)

### Etsy (5 products designed, none listed)
- BLOCKED: Need human shop setup (anti-bot) + actual product files (.xlsx/.docx/.pdf) not created yet
- Specs at etsy-empire/{product}/listing.md

## Infrastructure
- Stripe: John Davenport / openclawmarketplace.ai / Chase Bank (connected to ExtensionPay)
- Render: Free tier, no credit card needed
- GCP: Billing NOT enabled (blocks Cloud Run)
- Fly.io: jddavenport46 (not stealth), Vercel: JD identity
- gcloud CLI: /Users/davenportmini/google-cloud-sdk/

## Cron Jobs
- Heartbeat (2hrs): bb95c260-cb44-4010-bab9-1a05d320f695
- Weekly report: c5902e77-37a1-4661-86ec-47ac129fd79d

## Revenue Targets
- Month 1: $1, Month 2: $500/mo, Month 3: $2K/mo, Month 6: $5-10K/mo

## Key Decisions
- 14-day kill window (aggressive)
- Portfolio approach: mediocrity at scale > excellence lottery
- Stealth = no personal network exposure (using jddavenport46 accounts is fine)
- WP.org: sequential submissions only for new accounts
