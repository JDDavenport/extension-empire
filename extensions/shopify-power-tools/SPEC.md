# Shopify Quick Edit Power Tools — SPEC

## Overview
Chrome extension for Shopify store owners that adds inline editing, bulk operations, SEO scoring, competitor monitoring, and analytics overlays directly into the Shopify admin.

## Features
| Feature | Tier |
|---|---|
| Inline product editing (click-to-edit) | Free |
| SEO score per product | Free |
| Image optimizer suggestions | Free |
| Bulk price editor (% increase/decrease) | Pro |
| Bulk inventory updater | Pro |
| Competitor price monitor | Pro |
| Order dashboard overlay (daily/weekly trends) | Pro |
| Discount code generator & manager | Pro |
| Customer lifetime value calculator | Pro |
| Abandoned cart recovery stats | Pro |

## Technical
- Manifest V3, content scripts on `*.myshopify.com/admin/*`
- ExtensionPay: `ExtPay('shopify-power-tools')`, Pro at $14.99/mo
- Uses Shopify Admin API via page context (auth piggybacks on logged-in session)
- No external server needed (all client-side except ExtensionPay)

## Monetization
- Free: Inline editing, SEO scores, image suggestions
- Pro ($14.99/mo): Bulk ops, competitor monitor, dashboards, discount manager, CLV, cart stats
