# Tab Master Pro — Spec

## Overview
Power tab & session manager. Save sessions, search tabs, suspend inactive tabs, detect duplicates. Freemium with Pro sync/auto-group/scheduling at $4.99/mo.

## Free Features
- Save/restore named sessions (one click)
- Auto-save on browser close
- Fuzzy tab search across all open tabs
- Suspend inactive tabs (RAM saved counter)
- Duplicate tab detector
- Tab history timeline (today)
- Keyboard shortcuts

## Pro Features ($4.99/mo via ExtensionPay)
- Sync sessions across devices
- Auto-group tabs by domain
- Schedule sessions to open at specific times

## Tech Stack
- Manifest V3, background service worker
- Popup UI + side panel
- chrome.storage.local + chrome.storage.sync (Pro)
- ExtensionPay: `ExtPay('tab-master-pro')`
- No content scripts — pure tabs/storage API

## Monetization
- ExtensionPay, $4.99/mo
- Free tier generous enough for mass adoption
- Pro unlocks power-user features
