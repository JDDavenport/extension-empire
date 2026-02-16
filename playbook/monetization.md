# Monetization Playbook

## Primary: ExtensionPay (Stripe)
- Free, open-source: https://extensionpay.com
- Handles Stripe integration, license management
- Setup: `npm install extensionpay`, add to background.js
- Revenue: 100% yours minus Stripe's 2.9% + $0.30

## Pricing Strategy
- **Standard tier:** $2.99/mo or $24.99/year (2 months free)
- **Adjust per extension:** Developer tools can go $4.99/mo. Consumer tools stay at $2.99.
- **Never go below $1.99/mo** — lower prices don't increase conversion enough to offset revenue

## Freemium Split Rules
1. Free tier must be genuinely useful (not crippled)
2. Pro tier must be genuinely valuable (not just removing annoyware)
3. The "aha moment" for upgrade should be natural — user hits the limit while doing real work
4. Good split examples:
   - Free: 10 clipboard items. Pro: 500 items
   - Free: basic transforms. Pro: regex, extract, export
   - Free: works on current tab. Pro: works across all tabs

## Conversion Optimization
- Show pro features in UI (greyed out / locked icon) — visibility drives upgrades
- After 7 days of use, show one-time "try Pro free for 7 days" prompt
- Never nag. One prompt, then rely on visibility of locked features.
- Target: 1.5-3% of WAU converting to paid
