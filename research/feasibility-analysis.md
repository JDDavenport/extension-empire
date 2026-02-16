# Feasibility Analysis — Which Business to Build First

*The Shadow Architect | 2026-02-14*
*Based on real market research, not theory.*

---

## THE BRUTAL TRUTH UPFRONT

Most of what's in our prior research is **optimistic**. The real numbers are uglier. Here's what the market actually says.

---

## 1. MICRO-SAAS PORTFOLIO

### What the Data Actually Shows

**The good:**
- Samuel Rondot: $28K/mo from a portfolio (verified, IndieHackers)
- saas.group: $100M ARR from 25 brands (but they're a funded company with employees)
- GMass (extension+SaaS): $130K/mo
- Solo devs hitting $10K-$85K/mo exist but are EXTREME outliers

**The brutal:**
- **97.4% failure rate on Product Hunt.** Someone analyzed 500 SaaS launches from Jan-June 2024. 487 were dead 6-8 months later.
- **92% of micro-SaaS fail within 18 months** (rockingweb.com.au study of 1,000+ startups)
- Most micro-SaaS die with ZERO revenue. Not low revenue — zero.
- The "build it and they will come" thesis is dead. Distribution is the bottleneck, not building.
- AI can build a working app in days — but a working app ≠ a product people pay for
- Conversion rates on Product Hunt are abysmal. A top launch might get 500 upvotes → 50 signups → 2-5 paying customers
- AppSumo gives you one-time revenue (lifetime deals), trains users to never pay full price, and the audience is deal-hunters not real customers

**Can AI build production-quality SaaS?** Yes, for simple tools. But "production quality" = handling edge cases, auth, billing, onboarding, error handling, mobile responsiveness, accessibility. AI gets you 70% there; the last 30% is where products die.

**Time to first dollar:** Realistically 4-8 weeks per tool (not 2-4). Building is fast; getting the first paying customer is slow.

### Feasibility Score: 62/100

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Speed to first $ | 25% | 45 | 11.3 |
| Automation potential | 25% | 75 | 18.8 |
| Stealth compatibility | 20% | 90 | 18.0 |
| Revenue ceiling | 15% | 80 | 12.0 |
| Capital efficiency | 15% | 85 | 12.8 |
| **TOTAL** | | | **62.8** |

**Why speed scores low:** 97% failure rate means you need to launch 10-30 tools before one sticks. At 4-8 weeks per tool, that's 3-12 months to meaningful revenue. The portfolio approach works — at scale. Getting there takes longer than advertised.

---

## 2. POLYMARKET × KALSHI ARBITRAGE

### What the Data Actually Shows

**The good:**
- **Polymarket is now LEGAL for US residents** (CFTC approved late 2025, returned to US Jan 2026). JD can trade from Utah. This is huge — removes the #1 risk.
- $40M+ in arb profits extracted Apr 2024 - Apr 2025 (IMDEA research, 86M bets analyzed)
- 4-6 cent cross-platform spreads still exist as of Jan 2026 (Reddit r/algotrading: "Found 5¢ arbitrage spreads in prediction markets expiring tomorrow" — Jan 9, 2026)
- Open-source bots exist. Free APIs. Infrastructure cost near zero.
- Capital rotation strategy turns 2% per trade into much higher APY

**The brutal:**
- Same-market arb windows close in **200 milliseconds**. Manual trading is impossible.
- Cross-platform arb (Polymarket vs Kalshi) requires capital on BOTH platforms simultaneously
- Kalshi charges up to **3% taker fee**. Polymarket charges 2% on winning positions. So a 5¢ spread → ~0-1¢ actual profit after fees.
- "Arbitrage requires a lot of capital" — CryptoNews, Feb 2026. Small capital = small returns.
- The arb is becoming more competed. Institutional market makers are entering. Spreads are compressing.
- With $1K capital split across 2 platforms = $500 each side. At 1-2% net per trade with rotation... maybe $50-100/mo.
- To make $5K/mo you'd need ~$50K-100K deployed capital minimum

**The real opportunity is NOT pure arb** — it's AI-informed directional betting (the Théo model). But that's not arbitrage, it's trading with an edge. Different risk profile entirely.

### Feasibility Score: 48/100

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Speed to first $ | 25% | 70 | 17.5 |
| Automation potential | 25% | 90 | 22.5 |
| Stealth compatibility | 20% | 60 | 12.0 |
| Revenue ceiling | 15% | 25 | 3.8 |
| Capital efficiency | 15% | 20 | 3.0 |
| **TOTAL** | | | **48.8** |

**Why it scores low overall:** The math doesn't work at <$1K capital. Revenue ceiling is capped by capital, not effort. And fees eat most of the spread. This is a capital game, not a sweat equity game. Skip unless JD has $50K+ to deploy.

---

## 3. API-AS-A-SERVICE (RapidAPI)

### What the Data Actually Shows

**The good:**
- RapidAPI itself does $44.9M revenue, 55K customers — the marketplace is real
- 4M+ developers on the platform — built-in distribution
- Zero identity needed. Pure brand. API → money.
- Serverless = near-zero hosting costs
- AI can build APIs fast. An AI wrapper API (e.g., "send me an image, I'll extract text") takes hours, not weeks.

**The brutal:**
- RapidAPI takes a **25% cut** of all revenue. So a $100 plan → $75 to you.
- The marketplace is FLOODED. Search "text extraction API" and you'll find 50+ options.
- Most APIs on RapidAPI make $0-50/mo. The top earners are not transparent about numbers.
- Discovery is terrible unless you rank top 3 in a category. It's like Google SEO — winner-take-most.
- The underlying AI APIs (OpenAI, Anthropic) charge per call. Your margin = markup minus their cost. Thin.
- Customer support for API products requires technical competence. AI support agents struggle with "why is my API returning 403" edge cases.

**Real revenue numbers are almost impossible to find.** Nobody publicly shares API revenue on RapidAPI. The few data points suggest most indie APIs earn <$500/mo.

### Feasibility Score: 55/100

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Speed to first $ | 25% | 55 | 13.8 |
| Automation potential | 25% | 80 | 20.0 |
| Stealth compatibility | 20% | 95 | 19.0 |
| Revenue ceiling | 15% | 45 | 6.8 |
| Capital efficiency | 15% | 90 | 13.5 |
| **TOTAL** | | | **53.0** |

**The catch:** Easy to build, hard to get customers. Distribution on RapidAPI is a Black box. You could build 10 APIs and have them all sit at $0/mo.

---

## 4. BROWSER EXTENSION EMPIRE

### What the Data Actually Shows

**The good:**
- **Real, verified revenue numbers exist:**
  - GMass: $130K/mo (email campaigns from Gmail)
  - Closet Tools: $42K/mo (Poshmark automation, verified on IndieHackers)
  - GoFullPage: $10K/mo (screenshot tool, 4M users)
  - Night Eye: $3.1K/mo (dark mode)
  - Rick Blyth: ~$10K/mo from a portfolio of extensions
- ExtensionPay: free, open-source payment integration. No backend needed.
- Chrome Web Store is FREE to publish ($5 one-time developer fee)
- Extensions run locally = near-zero server costs = 70-85% profit margins
- AI can build simple extensions in 1-2 days. The tech is straightforward (HTML/CSS/JS + manifest).
- Distribution via Chrome Web Store search IS possible — people search for solutions there daily

**The brutal:**
- The revenue winners (GMass, Closet Tools) took YEARS to build and optimize
- Most extensions get <100 installs and die
- Chrome Web Store discovery is keyword-driven but competitive
- Manifest V3 changes have killed some extension categories (ad blockers, privacy tools)
- Google can reject/remove your extension with no appeal (platform risk)
- Monetization is tricky: most users expect extensions to be free. Freemium conversion is 1-3%.
- The $732K claim on Medium is likely exaggerated clickbait

**Key insight:** The BEST extension businesses solve a pain point for a specific workflow on a specific platform (Poshmark automation, Gmail power features, specific dev tools). Generic utility extensions struggle.

### Feasibility Score: 68/100

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Speed to first $ | 25% | 60 | 15.0 |
| Automation potential | 25% | 80 | 20.0 |
| Stealth compatibility | 20% | 95 | 19.0 |
| Revenue ceiling | 15% | 60 | 9.0 |
| Capital efficiency | 15% | 95 | 14.3 |
| **TOTAL** | | | **67.3** |

**Why it scores highest:** Lowest capital requirement ($5), highest margins (70-85%), real proven revenue examples from solo devs, AI can build the product fast, and distribution exists natively (Chrome Web Store search). The failure rate is still high, but the cost of failure is near zero — you lose a day of agent time, not thousands of dollars.

---

## 5. INFORMATION ARBITRAGE / ALT DATA

### What the Data Actually Shows

**The good:**
- Hedge funds are in a "budget boom" for alt data in 2025-2026 (Business Insider)
- Alt data market is growing 30%+ YoY
- Individual datasets sell for $10K-$100K+/year to institutional clients
- Thinknum, YipitData = multi-million ARR businesses built on public web data
- Government contract data (SAM.gov), SEC filings, job postings = all publicly available, valuable when processed

**The brutal:**
- **Sales cycle is 3-12 months for institutional clients.** Hedge funds don't buy data from anonymous providers who emailed them cold.
- You need **credibility, compliance documentation, data quality guarantees, and often a named entity** to sell to institutional buyers. Stealth is near-impossible.
- Data brokers demand 50%+ revenue share to connect you with buyers
- Building the scraping infrastructure is the easy part. Finding the first paying client is the hard part.
- Eagle Alpha, Quandl (now Nasdaq), and established players own the distribution channels
- One Reddit poster (r/quant): built an alt data platform, needed 10 engineers, raised $7M — that's NOT a solo/agent operation
- B2B data sales require trust, track record, and often in-person demos

**This is a GREAT business at scale but a TERRIBLE first business.** The time to first dollar is 4-12 months, requires human networking, and the stealth constraint kills it.

### Feasibility Score: 32/100

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Speed to first $ | 25% | 15 | 3.8 |
| Automation potential | 25% | 60 | 15.0 |
| Stealth compatibility | 20% | 20 | 4.0 |
| Revenue ceiling | 15% | 90 | 13.5 |
| Capital efficiency | 15% | 50 | 7.5 |
| **TOTAL** | | | **33.8** |

**Kill this for Phase 1.** Revisit when you have revenue, credibility, and a legal entity that institutional buyers would trust.

---

## FINAL RANKING

| Rank | Business | Score | First Dollar | Monthly Ceiling |
|------|----------|-------|-------------|-----------------|
| **#1** | **Browser Extension Empire** | **68** | 2-4 weeks | $10K-$50K |
| #2 | Micro-SaaS Portfolio | 63 | 4-12 weeks | $10K-$100K |
| #3 | API-as-a-Service | 55 | 4-8 weeks | $5K-$20K |
| #4 | Polymarket Arbitrage | 49 | 1-2 weeks | Capital-capped |
| #5 | Alt Data Service | 34 | 3-12 months | $50K+ |

---

## 🏆 THE #1 RECOMMENDATION: BROWSER EXTENSION EMPIRE

### Why Extensions Win

1. **Lowest cost of failure.** Each extension costs $0 to build (agent time) and $0 to distribute (Chrome Web Store). If it flops, you lost a day. With SaaS, you might lose weeks + hosting + domain costs.

2. **Built-in distribution.** Chrome Web Store has search. People actively look for extensions to solve problems. You don't need Product Hunt, AppSumo, or cold outreach. The customers come to you.

3. **Proven solo-dev revenue.** Multiple verified examples of solo devs earning $3K-$130K/mo from extensions. Not theoretical — real.

4. **Near-zero marginal cost.** Extensions run on the user's browser. No servers. No scaling costs. 70-85% margins.

5. **AI builds these fast.** Extensions are HTML/CSS/JS + a manifest file. Claude/Cursor can ship a working extension in hours.

6. **Portfolio approach is natural.** Unlike SaaS (where each product needs its own landing page, auth, billing, support), extensions just... exist in the store. Less overhead per unit.

7. **Stealth-perfect.** Each extension is its own brand. No personal identity anywhere. Different publisher names if needed.

8. **Pairs perfectly with Micro-SaaS later.** A successful extension can become a SaaS product (add server-side features, pro tiers, etc). Extensions are a discovery mechanism for SaaS.

### The Honest Risks
- Google can remove extensions arbitrarily (platform risk)
- Most extensions will get <100 installs
- Monetization is harder than building — users expect free
- Manifest V3 limits some functionality

### Why NOT the others first?
- **Micro-SaaS:** 97% failure rate + longer build cycles + distribution problem. Extensions have BUILT-IN distribution. Do SaaS second, AFTER you learn what users want from extension analytics.
- **Polymarket:** Capital-limited returns. $1K capital = $50-100/mo max. Not worth the engineering time.
- **APIs:** No transparent revenue data = blind bet. 25% RapidAPI cut hurts.
- **Alt Data:** Wrong phase entirely. Needs network, credibility, legal entity.

---

## "START THIS WEEKEND" ACTION PLAN

### Saturday Morning: Research (2 hours)
1. Go to Chrome Web Store. Browse categories: Productivity, Developer Tools, Shopping, Social Media
2. Read 1-3 star reviews of popular extensions. What are people complaining about?
3. Find 5 extensions with 10K-100K users and obvious UX problems or missing features
4. Identify 3 "gap" opportunities — things people search for but existing solutions suck

### Saturday Afternoon: Build Extension #1 (4 hours)
1. Pick the simplest gap from your research
2. Use Claude/Cursor to build the entire extension
3. Target: a SINGLE feature done well. Not a Swiss army knife.
4. Categories that work for solo devs:
   - **Platform-specific automation** (automate repetitive tasks on a specific website — like Closet Tools did for Poshmark)
   - **Developer tools** (CSS viewers, JSON formatters, API testers)
   - **Productivity enhancers** (tab management, text manipulation, screenshot tools)
   - **Data extractors** (scrape specific sites into structured data)

### Sunday: Polish & Submit (3 hours)
1. Write compelling store listing (title with keywords, clear description, screenshots)
2. Add ExtensionPay for freemium monetization (free core, $2-5/mo for pro features)
3. Submit to Chrome Web Store (review takes 1-3 days)
4. Set up anonymous email for support

### Week 2: Build Extensions #2 and #3
- Same process. Different niches.
- Don't iterate on #1 yet — ship more, test more niches

### Week 3-4: Evaluate & Double Down
- Which extension is getting installs?
- Which has the best review sentiment?
- Kill the losers. Iterate on the winner.
- Add 2 more extensions

### Month 2: Scale to 10 Extensions
- You now have data on what works
- Build 5-7 more targeted extensions
- Start adding pro tiers to winners
- Consider Firefox ports for winners (2x distribution)

### Month 3+: $1K-5K/mo Target
- 10-20 extensions, 2-3 winners with paying users
- Winners get more features, better SEO, review responses
- Start converting best extension into a SaaS product (this is your bridge to Micro-SaaS)

---

## BACKUP PLAN: If Extensions Don't Work in 30 Days

**Switch to: Micro-SaaS Portfolio** (with a twist)

If after 30 days and 5-10 extensions you have zero traction, pivot to micro-SaaS BUT apply the lesson: **distribution first, product second.**

1. Find communities where people are asking for tools (Reddit, Twitter, niche forums)
2. Pre-validate by posting "I'm building X, would you pay $Y/mo?" 
3. Only build what gets 10+ "yes" responses
4. Launch on AppSumo for initial cash (accept that it's one-time, use it for validation)
5. Convert AppSumo buyers to monthly plans with v2 features

The extension experience will teach you what niches have demand, even if the extensions themselves don't monetize.

---

## WHAT I'D BET AGAINST

- **$100K/mo in 6 months from any of these.** Unrealistic. $5K-10K/mo in 6 months is ambitious but achievable.
- **"Each tool making $500-2K/mo" average.** Survivorship bias. The median micro-SaaS/extension makes $0/mo. The mean is dragged up by outliers.
- **"AI agents building production SaaS autonomously."** They can build MVPs. Production quality (error handling, edge cases, security, billing edge cases) still needs human oversight. We're at 70-80% autonomous, not 95%.
- **Polymarket arb with <$10K capital being worth the effort.** The engineering time to build/maintain the bot exceeds the returns at small capital sizes.

---

## THE REAL PATH TO $100K/MO

Be honest: $100K/mo from a standing start with <$1K capital and no network takes **18-36 months**, not 6. Here's the realistic trajectory:

- **Month 1-3:** Build 15-20 extensions. Find 2-3 winners. Revenue: $200-1,000/mo
- **Month 3-6:** Convert winners to SaaS products. Scale to 5-10 revenue-generating products. Revenue: $2K-8K/mo
- **Month 6-12:** Double down on winners. Add API products. Revenue: $8K-25K/mo
- **Month 12-24:** Portfolio at scale. 30+ products. Cross-sell. Revenue: $25K-75K/mo
- **Month 24-36:** Compound growth. Acquisitions of competitors. Revenue: $75K-150K/mo

The agent organization model accelerates this, but doesn't skip the market validation step. No amount of AI agents can make people buy something they don't want.

---

*"The best time to plant a tree was 20 years ago. The second best time is this weekend, with a Chrome extension."*
