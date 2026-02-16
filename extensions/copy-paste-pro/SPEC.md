# Copy Paste Pro — Spec

## Status: MVP Complete

## Market
- Target: "Allow Copy" (16M installs, 2.2 stars)
- Category: Productivity / Utility
- Monetization: Freemium via ExtensionPay ($2.99/mo Pro)

## Architecture
- **Manifest V3**, service worker background
- **Permissions**: activeTab, storage, scripting (minimal)
- **No host permissions** — fast Chrome Web Store review
- Content script injected on-demand via `chrome.scripting.executeScript`

## How the Content Script Works
1. Injects `!important` CSS overriding all `user-select: none`
2. Nullifies `oncopy/oncut/onpaste/onselectstart/oncontextmenu` handler properties
3. Adds capture-phase listeners on blocked events that call `stopImmediatePropagation`
4. Wraps `addEventListener` to neuter future blocking listeners
5. Removes transparent overlay divs (pointer-events: none)
6. MutationObserver watches for dynamically added restrictions
7. Cleans up disabled input fields

## Pro Features (TODO)
- [ ] ExtensionPay integration
- [ ] Auto-enable on saved domains
- [ ] "Nuclear mode" — remove ALL JS event listeners
- [ ] Domain allowlist/blocklist in options page

## Keyboard Shortcut
Ctrl+Shift+U (avoiding Ctrl+Shift+C which opens DevTools)

## Files
- `src/manifest.json` — Extension manifest
- `src/background.js` — Service worker, toggle logic, badge
- `src/content.js` — Injected script that removes restrictions
- `src/popup.html/js/css` — Toggle UI
- `store/listing.md` — Chrome Web Store listing copy
