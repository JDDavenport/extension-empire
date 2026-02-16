# Declutter YouTube — Clean UI & Focus Mode

## Overview
Chrome extension that removes distracting elements from YouTube for a cleaner, focused viewing experience.

## Status: Built — Ready for Store Submission

## Features
### Free Tier
- **10 independent toggles**: comments, recommendations, shorts, trending, end screens, autoplay, chat replay, notification count, clean homepage, theater mode
- **Focus Mode**: One-click hides everything except video player
- **CSS-first approach**: Instant effect, no layout shift, runs at document_start

### Pro Tier ($3.99/mo via ExtensionPay)
- Per-channel settings (allow comments on trusted channels)
- Scheduled focus mode
- Custom CSS themes
- Keyboard shortcuts

## Technical
- Manifest V3
- CSS injection at `document_start` for zero-flash hiding
- Body class toggling (`dy-hide-*`) for each feature
- `chrome.storage.sync` for cross-device settings persistence
- SPA navigation observer for YouTube's client-side routing
- Dark theme popup matching YouTube's aesthetic

## Target Keywords
declutter youtube, clean youtube, hide youtube comments, youtube distraction free, youtube focus mode, remove youtube recommendations, hide youtube shorts, youtube minimalist
