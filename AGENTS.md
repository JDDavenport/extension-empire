# AGENTS.md — Extension Empire Operations

## Agent Organization

```
🏴 The Architect (strategic command, orchestration)
│
├── 🔍 Scout Agent (spawned as needed)
│   └── Research Chrome Web Store gaps, competitor analysis, niche identification
│   └── Output: Ranked opportunity list with data
│
├── 🏗️ Builder Agent (spawned per extension)
│   └── Code the extension using coding agent tools
│   └── Output: Complete extension ready for submission
│
├── 📦 Publisher Agent (spawned per extension)
│   └── Store listing copy, screenshots, keyword optimization
│   └── Output: Submitted extension + listing assets
│
├── 📊 Analytics Agent (spawned on heartbeat/weekly)
│   └── Track installs, reviews, revenue across portfolio
│   └── Output: Portfolio dashboard + recommendations
│
└── 🔧 Maintainer Agent (spawned as needed)
    └── Bug fixes, review responses, updates
    └── Output: Updated extensions
```

## Workflow

### New Extension Pipeline
1. Scout identifies opportunity → writes spec to `research/opportunities/`
2. Architect reviews, approves → creates `extensions/{name}/SPEC.md`
3. Builder builds extension → code in `extensions/{name}/src/`
4. Publisher creates listing → assets in `extensions/{name}/store/`
5. Architect reviews final package → submits to Chrome Web Store
6. Analytics monitors post-launch → updates `dashboards/portfolio.md`

### Weekly Cycle
- **Monday**: Scout runs gap analysis, reports new opportunities
- **Wednesday**: Builder ships any in-progress extensions
- **Friday**: Analytics produces weekly report for JD
- **Daily heartbeat**: Check for reviews needing response, installs trending, revenue updates

### Kill Criteria (30-day window)
- <50 installs after 30 days → kill or pivot
- <3.5 star average → fix or kill
- 0 revenue after 30 days with 500+ installs → fix monetization or kill
- Negative install trend for 2 weeks → investigate, then kill if unfixable

### Scale Criteria
- 1,000+ installs with 4+ stars → add pro features
- Any revenue → prioritize for iteration
- 5,000+ installs → port to Firefox
- $500+/mo → dedicated maintenance priority

## File Structure

```
extension-empire/
├── SOUL.md                    # Who we are
├── USER.md                    # JD's role
├── AGENTS.md                  # This file
├── TOOLS.md                   # Tool usage
├── research/
│   ├── opportunities/         # Scout reports
│   ├── competitors/           # Competitor analysis
│   └── market-intel.md        # Running market notes
├── extensions/
│   └── {name}/
│       ├── SPEC.md            # What to build
│       ├── src/               # Extension source code
│       ├── store/             # Listing assets
│       └── STATUS.md          # Current status + metrics
├── dashboards/
│   └── portfolio.md           # Revenue + install tracking
├── templates/
│   ├── manifest-v3.json       # Base manifest template
│   ├── extension-spec.md      # Spec template
│   └── store-listing.md       # Listing template
└── scripts/
    └── package-extension.sh   # Zip for submission
```
