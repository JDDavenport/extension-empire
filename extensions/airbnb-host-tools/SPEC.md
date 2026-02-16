# Airbnb Host Power Tools — SPEC.md

## Overview
Chrome extension enhancing Airbnb's host dashboard with messaging templates, pricing analytics, review tools, and calendar optimization.

## Target User
Airbnb hosts (4M+ listings globally) frustrated by Airbnb's bare-bones host UI.

## Features

### Free Tier
- **Message Templates** (up to 5): Check-in instructions, house rules, directions — insert with one click in Airbnb message thread
- **Review Response Templates** (up to 3): Pre-written responses with variable substitution ({guest_name}, {listing_name})
- **Quick-Stats Dashboard Overlay**: Shows key metrics at a glance on the hosting dashboard

### Pro Tier ($14.99/mo via ExtensionPay)
- **Unlimited Templates**: No cap on message or review templates
- **Bulk Messaging**: Send templates to multiple guests at once
- **Pricing Analytics Overlay**: Compare your listing price vs nearby comps (scraped from Airbnb search)
- **Calendar Gap Analysis**: Highlight booking gaps, suggest pricing adjustments
- **Auto-Response Rules**: Set triggers for automatic guest inquiry responses
- **AI-Suggested Review Personalization**: Analyze guest review text and suggest personalized response

## Technical Stack
- Manifest V3
- Content script → airbnb.com/hosting/*
- Popup UI for template management & settings
- Chrome storage (sync) for templates, local for cache
- ExtensionPay for subscriptions
- No external backend — all client-side

## Monetization
- ExtensionPay integration: `ExtPay('airbnb-host-tools')`
- Free: basic templates + stats overlay
- Pro: $14.99/mo — bulk messaging, analytics, auto-response, calendar tools

## Pages Targeted
- `airbnb.com/hosting` — dashboard overlay
- `airbnb.com/hosting/inbox/*` — message templates
- `airbnb.com/hosting/reviews` — review templates
- `airbnb.com/hosting/calendar/*` — calendar analysis
- `airbnb.com/hosting/listings/*` — pricing overlay
