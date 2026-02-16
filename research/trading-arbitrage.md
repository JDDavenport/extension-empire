# Trading & Arbitrage Plays — Deep Research

*Last updated: 2026-02-14*

---

## 1. PREDICTION MARKET ARBITRAGE (Polymarket × Kalshi)

### How It Works
- Same event trades at different prices on Polymarket (crypto, Polygon) and Kalshi (US-regulated)
- Buy YES on one platform + NO on the other = guaranteed $1.00 payout
- Typical spread: 2-5% (e.g., buy YES at $0.35 + NO at $0.63 = $0.98 cost → $0.02 guaranteed profit)
- With capital rotation (not holding to expiry), compound returns are massive

### Real Numbers
- **$40M+ in arbitrage profits** extracted from Polymarket between April 2024 - April 2025 (IMDEA Networks research)
- **0xalberto**: Earned **$764 in a single day** (Dec 21, 2025) using automated bot on BTC-15m-updown market with just a **$200 deposit**
- **Théo (the French Whale)**: Bet $30M across 4 accounts → walked away with **$85M profit** on Trump election bet
- Typical arb bot captures 1.5-4.5% on high-volume events (Fed rates, elections)

### Tools & Infrastructure
- **pmxt**: Unified wrapper (like CCXT but for prediction markets) — abstracts Polymarket CLOB + Kalshi REST API
- **Polymarket/agents** (GitHub): Official AI agent repo — fetch news, query data, execute trades
- **polymarket-arbitrage-bot** (GitHub): Open-source bot detecting arb opportunities using 100% FREE APIs (no auth required)
- **polymarket-kalshi-btc-arbitrage-bot** (GitHub): Specifically for BTC hourly price markets
- Polymarket API: Free CLOB access, no authentication needed for market data
- Kalshi API: REST-based, requires API key/secret

### Strategy: Capital Rotation (Key Insight)
Most arbers hold to maturity = terrible capital efficiency (2% over 3 months). Smart approach:
- Enter when spread widens
- Exit immediately when spread closes OR when better opportunity appears
- Rotate capital across markets continuously
- This turns 2% per trade into potentially 50-100%+ APY

### The Théo Playbook
- Used 4 accounts (Fredi9999, Theo4, PrincessCaro, etc.)
- Conviction bet based on private polling data (commissioned his own polls detecting "shy Trump voter" effect)
- Not technically arbitrage — pure directional conviction + information edge
- Key lesson: **Information advantage + prediction markets = massive asymmetric payoff**

### JD-Fit Assessment
| Factor | Rating |
|--------|--------|
| AI agents can do this TODAY? | ✅ YES — open-source bots exist, APIs are free |
| Monthly revenue range | $500-$10K+ (depends on capital deployed) |
| Time to first dollar | 1-2 weeks |
| Capital requirement | $500-$5K to start meaningfully |
| Legal risk | 3/10 (Polymarket is offshore/crypto; Kalshi is CFTC-regulated) |
| Human time/week | 1-2 hrs monitoring |
| Scalability ceiling | Medium — limited by market liquidity |
| Crowdedness | Getting crowded — bots dominate now |

---

## 2. CRYPTO/DeFi AGENT PLAYS

### A. Funding Rate Arbitrage
**How it works:** When perpetual futures funding rate is positive (longs pay shorts), go long spot + short perp → collect funding payments with delta-neutral exposure.

- **Pionex** offers this as a built-in bot product (retail-friendly)
- Typical yields: 15-50% APY during bull markets, 5-15% during calm periods
- Works best on BTC/ETH where funding is consistently positive during uptrends
- **Risk:** Exchange counterparty risk, funding rate can flip negative

### B. MEV Extraction
- **$3.37M** in MEV arbitrage profit in a single 30-day period (Sept 2025, EigenPhi data)
- Types: Backrunning (legal), liquidation bots, DEX arbitrage
- **Solana MEV is rigged** — leader nodes with $1B+ in SOL run their own sandwich bots with proprietary data at 100% margins (per Reddit r/defi)
- Ethereum MEV still profitable but competitive — need Flashbots/MEV-Boost integration
- Capital requirement: $5K-$50K+ for meaningful MEV
- **Not beginner-friendly** — requires deep blockchain infra knowledge

### C. Memecoin Sniping Bots
- **15,000+ SOL in realized profit** extracted in one month through memecoin sniping on Pump.fun (4,600+ sniper wallets)
- Prices can increase 5-10x within minutes of launch
- Sniper bots buy in the same block as token creation
- Tools: BullX, Trojan, BONKbot, Photon, custom bots via QuickNode/Helius RPCs
- Helius RPC: $300/month for 50 req/sec (sufficient for sniping)
- **Risk: VERY HIGH** — most tokens are rugpulls, you need sophisticated filtering
- 20-50% gains possible in minutes on good picks

### D. Airdrop Farming at Scale
- **ZKsync example**: One "airdrop hunter" got 3M ZK tokens ($753K) through 85 wallets
- Another user publicly boasted **$800K** from "ZK sybilling strategy"
- Tools: AdsPower, Multilogin (antidetect browsers), custom automation scripts
- Strategy: Manage 50-500 wallets, do protocol interactions (bridges, swaps, LP)
- **Risk:** Protocols are getting better at Sybil detection — wallets can get blacklisted
- Capital: $500-$5K for gas across wallets
- **Cointelegraph reported on a 30,000 phone bot farm** stealing crypto airdrops

### E. Cross-Exchange Arbitrage (CEX-CEX, CEX-DEX, DEX-DEX)
- Still exists but margins are razor-thin (0.1-0.5%)
- Speed advantage is everything — need colocated servers
- DEX-DEX arb on different chains has wider spreads but bridge risk
- Tools: Hummingbot, custom bots, CCXT library

### JD-Fit Assessment (Crypto Overall)

| Play | Revenue | Capital | Risk | Time | Crowded | JD Score |
|------|---------|---------|------|------|---------|----------|
| Funding Rate Arb | $200-2K/mo per $10K | $1K+ | 4/10 | 1 hr/wk | Medium | ⭐⭐⭐⭐ |
| MEV | $1K-50K/mo | $10K+ | 6/10 | 5+ hrs/wk | Very | ⭐⭐ |
| Memecoin Sniping | $0-50K/mo (wild variance) | $500+ | 8/10 | 3+ hrs/wk | High | ⭐⭐ |
| Airdrop Farming | $0-100K+ per drop | $1K-5K | 7/10 (Sybil ban) | 3+ hrs/wk | Very | ⭐⭐⭐ |
| CEX-DEX Arb | $100-5K/mo | $5K+ | 5/10 | 2 hrs/wk | Very | ⭐⭐⭐ |

---

## 3. SEC FILING / PUBLIC DATA TRADING

### How It Works
- Monitor SEC EDGAR for new filings (10-K, 10-Q, 8-K, Form 4 insider trades)
- AI analyzes filing in minutes → extract sentiment, key changes, red flags
- Trade on insights before market digests the information
- **100% legal** — all public data, no MNPI

### Tools
- **EdgarTools** (Python): Full SEC EDGAR API library
- **Apify SEC Filings Intelligence**: Monitor filings + AI sentiment analysis + Form 4 insider patterns
- **Zillion AI**: Pull and analyze EDGAR filings instantly
- Custom: EDGAR RSS feed → LLM analysis → trading signal → execute via broker API

### Revenue Potential
- Highly variable — depends on signal quality
- Information advantage decays fast (minutes-hours)
- Best used as supplementary alpha, not standalone
- Could sell the analysis as a subscription ($50-500/mo) to other traders

### JD-Fit: ⭐⭐⭐ (better as info product than direct trading)

---

## KEY TAKEAWAY: TOP TRADING PLAYS FOR JD

1. **Polymarket × Kalshi Arb Bot** — Best risk/reward. Open-source code exists. Start with $500-1K.
2. **Funding Rate Arbitrage** — Set-and-forget with Pionex or custom bot. Steady yields.
3. **SEC Filing Alert Service** — Build once, sell subscriptions. Recurring revenue.
4. **AI-Powered Prediction Market Agent** — Use LLM to read news → adjust positions. Higher alpha but more complex.
