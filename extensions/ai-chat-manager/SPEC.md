# AI Chat Manager — Spec

## Overview
Chrome extension adding power features to ChatGPT and Claude: export, search, organize, prompt library, analytics, sharing.

## Platform Support
- chat.openai.com/* (ChatGPT)
- claude.ai/* (Claude)

## Features

### Free Tier
- **Export conversations** — Markdown, PDF, JSON
- **Search** — Full-text search across all indexed conversations
- **Pin conversations** — Quick access to important chats
- **Bulk delete** — Select and remove old conversations

### Pro Tier ($9.99/mo via ExtensionPay)
- **Folders & Tags** — Organize conversations with custom folders, color-coded tags
- **Prompt Library** — Save, categorize, and one-click insert favorite prompts
- **Analytics** — Token usage estimates, topic breakdown, usage patterns
- **Share via Link** — Generate clean shareable HTML page for any conversation

## Technical Architecture
- **Manifest V3**
- **Background service worker** — ExtensionPay init, message routing, IndexedDB management
- **Content scripts** — DOM scraping for conversations on both platforms, UI injection
- **Popup** — Search, folders, prompt library, settings
- **Storage** — Chrome storage sync (settings, folders, tags), IndexedDB (conversation index, prompts)
- **Monetization** — ExtensionPay (`ai-chat-manager`), freemium gating in popup + content script

## File Structure
```
src/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── db.js              # IndexedDB wrapper
├── export.js          # Export utilities
├── analytics.js       # Token estimation + topic analysis
├── share.js           # Share page generation
├── ExtPay.js          # ExtensionPay library
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
