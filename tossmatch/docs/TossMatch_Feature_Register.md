# TossMatch v10.8 — Feature Register

**Documentation revision:** 25 August 2026  
**Status key:** ✅ Implemented in demo · ⚠️ Demo-only / production service required · 🧭 Recommended next phase

## Authoritative documentation set

The current v10.8 rules are consolidated in `TossMatch_Complete_Feature_and_Rules_Specification.md` and Appendices V–Z of `TossMatch_Project_Documentation.docx`. They explicitly enumerate all **33 Catalog games, 23 Arcade+ modes, 8 VIP tiers, 49 achievements, levels 2–50, 134 shop items and 101 Feature Directory records**. Appendix V is the v10.4 baseline; W records v10.5 analytics; X records v10.6 live sync; Y records v10.7 first-top-up eligibility; Z controls v10.8 bot wallet initialization. Earlier appendices and release sections remain historical records.

Current release totals: **90 Implemented · 3 Partial · 8 Suggested · 101 unique Feature Directory records**, with **53 exact game destinations** and **72 Player command entries**.

> **v11.0 unified merge addendum:** the five project workspaces were merged into one release. The unified app adds **OPS-5 Bot Withdrawals**, **OPS-6 Player Directory**, restores the classic **G21 Crash / G22 Hi-Lo / G23 Mines** Arcade+ modes, and returns the photographic coin assets as the Photoreal skin — bringing the Feature Directory to **106 records (95 Implemented · 3 Partial · 8 Suggested)** and Arcade+ to **23 modes**.

## Core platform

| Area | Before | Current v10.8 | Status |
|---|---|---|---:|
| Coin Toss | Basic player/bot flip | Escrow, manual take, auto-match, bot-vs-bot, fee, jackpot, proof, history | ✅ |
| P2P Catalog | Catalog concepts and direct demo settlement | 33 playable games with per-game waiting rooms, manual take, automatic bot joining, bot postings, bot-vs-bot settlement, carry/split rules, proof details, per-game history and Admin results | ✅ |
| Series Cups | Player-dependent Cups | Player-vs-bot and unattended bot-vs-bot Bo3/Bo5/Bo7/Advantage with fast fill and history | ✅ |
| Tournaments | Player seat required | Bot-filled single-flip/Bo3 brackets, VIP entry discount, 75/25 prizes, history | ✅ |
| Bot economy | Coin games and shopping | Every bot starts 0 MAIN + 1,000 BONUS, completes a varied first MAIN top-up, then enters full activity through the coordinated live engine | ✅ |
| VIP | Primarily rates and thresholds | 8 tiers, rakeback, permanent rewards, discounts, queue priority, titles and UTC monthly reset | ✅ |
| Wallet | Segmented balances | MAIN/BONUS/REFERRAL/RAKEBACK/BANK, escrow, transfer/gifting caps, staking | ✅ |
| Player history | Limited recent-game list | 9 searchable categories, 200 game records, details, pagination and JSON export | ✅ |
| Statistics | Games/wins/net/streak | Lifetime wager, total/max payout, fees, averages, ROI, game-family counts, payout trend and complete Player top-up analytics | ✅ |
| Top-up analytics | Wallet action and basic deposit-limit records | Player analytics plus bot MAIN/BONUS, starting bonus, first-promo bonus, readiness, complete wallet credit, pagination and CSV export | ✅ |
| Player UI | Large wrapped mobile navigation | Premium Home, grouped sidebar, one-row mobile navigation, responsive forms and customizable Top-up credited KPI | ✅ |
| Admin UI | Top-tab operations pages | 12-screen Command Center with live bot-engine status, hidden Player-engine fallback, dedicated Top-up Analytics, Feature Hub, Directory, Trust Center, realtime analytics, alerts and paginated data | ✅ |
| Auto Bet | Hard-coded −200 stop | Default −200 with presets and custom −50 to −10,000 session stop | ✅ |
| Achievements & levels | 29 achievements; configured rewards through level 25 | 49 achievements; rewards through level 50; rare/epic/legendary milestone cosmetics at levels 30/40/50; Admin filter/sort/pagination | ✅ |
| Shop inventory | Original items across nine categories | 38 additional items across skins, flags, personas, frames, chat colours, victory FX, themes, sounds and emojis | ✅ |
| Player network | Fixed 99-bot roster | Automatic bot creation grows the visible Player Directory/network count to an Admin-defined cap; Admin can also add a bot immediately | ✅ |
| Navigation | Long Player/Admin menus and mobile horizontal scrolling | Searchable sidebars, quick jumps, command palettes, mobile docks and exact-game navigation; Player Admin links open a new tab so bot simulation remains loaded | ✅ |
| UX personalization | Fixed Home and repeated manual setup | Accessibility preferences, selectable/reordered Dashboard widgets/sections, up to 20 saved game presets and explainable game recommendations | ✅ |

## B1 — Social & Community

| Code | Feature | Before | Current v10.8 | Status |
|---|---|---|---|---:|
| S1 | Friend List & Buddy System | Idea only | Persistent friends, incoming bot requests, bot-to-bot connections, online/skill display, direct challenges, friend-first queue badge/order and history | ✅ |
| S2 | Private Rooms | Idea only | Custom game/stake/access/code, details modal, lifecycle history, Coin/Catalog room games | ✅ |
| S3 | Player Profiles | Partial bot profiles | Public player career, VIP/skill, cosmetics, achievements, win-rate graph and recent results | ✅ |
| S4 | Spectator Mode | Idea only | Live/recent match list, animated stage, players/picks/pot/fee/result/proof | ✅ |
| S5 | Gifting | Coin transfer only | Friend coin and cosmetic gifting with minimum, fee, shared daily cap and history | ✅ |
| S6 | Chat System | Reactions only | Local lobby chat, autonomous bot-started conversations and replies, free/premium emoji buttons, mute/block and sent history | ✅ |
| S7 | Clans / Teams | Idea only | Create/tag/roster, team matches, four-clan tournament, score, leaderboard and history | ✅ |

## B2 — New Game Types

| Code | Feature | Before | Current v10.8 | Status |
|---|---|---|---|---:|
| G1 | Lucky Wheel | Hidden legacy concept | Player plus autonomous bot spins, daily free/paid player spins, coin/cosmetic prizes, accounting and history | ✅ |
| G2 | Scratch Cards | Idea only | Player plus autonomous bot sessions, three price tiers, 9-cell reveal, 3+/4+/5+ match payouts and history | ✅ |
| G3 | Dice Roll | Legacy dice differed | Player plus autonomous bot sessions, exact double 30×, low/high 1.8×, payout accounting and history | ✅ |
| G4 | Loteria / Raffle | Idea only | Active bot ticket purchases, player tickets, weekly reset, 80/20 draw, bot payout and history | ✅ |
| G5 | Multiplier Ladder P2P | Retired vs-house concept | Escrowed player/bot and autonomous bot-vs-bot rung-or-bust duels, fee accounting, split handling and history | ✅ |
| G6 | War Card Game | Idea only | Player/bot and autonomous bot-vs-bot 2–Ace games, automatic War rounds, P2P fee and history | ✅ |

## v9.8 Phase 1 game expansion — implemented

All 22 former roadmap entries are implemented as working local-demo game flows. CAT18–CAT29 use the attached catalog's shared P2P model: two-entrant escrow, per-game waiting room, manual take, automatic bot joining, bot-vs-bot liquidity, retained proof, post-fee settlement, carry/split rules, per-game player history and Admin result/earnings visibility. G7–G16 provide playable controls, published payout rules, retained proof, wallet/economy settlement, player history and autonomous bot activity. Production still requires server-authoritative settlement, independently verifiable randomness, reviewed mathematics/content, abuse controls, accessibility testing and legal/regulatory approval.

### Implemented Catalog expansion

| Code | Implemented Catalog game | Implemented winner determination |
|---|---|---|
| CAT18 | Rock Paper Scissors Duel | Hidden simultaneous choices use standard RPS; same choices split. |
| CAT19 | Closest to 21 | Proof-derived cards are dealt to both entrants; closest total to 21 without exceeding it wins, with defined double-bust and equal-total split rules. |
| CAT20 | Triple Coin Majority | Opposite HEADS/TAILS picks; the majority of three proof-derived flips wins. |
| CAT21 | Sequence Builder | Different two-symbol starters compete against a proof-derived sequence; first completed target pattern wins. |
| CAT22 | Dice Sum Duel | Two proof-derived dice per entrant; higher total wins and equal totals split. |
| CAT23 | Colour Spectrum Duel | Entrants claim non-overlapping byte-mapped colour bands; a result in a claimed band wins and an unclaimed result carries. |
| CAT24 | Prime vs Composite | Opposite PRIME/COMPOSITE picks; proof-derived integer 2–251 is classified and the matching side wins. |
| CAT25 | Median Number Battle | Two distinct player picks and one proof number form three values; the entrant whose pick is closest to the median wins, with an equal-distance split. |
| CAT26 | Streak Survivor | Opposite sides race through proof-derived flips; the first side to produce a four-result streak wins. |
| CAT27 | Territory Capture | Entrants claim non-overlapping sectors; nine proof bytes capture sectors and the higher claimed count wins, with split/carry handling. |
| CAT28 | Modulo Four Duel | Entrants choose different remainders 0–3; proof byte modulo four decides, while an unclaimed remainder carries. |
| CAT29 | Poker High Duel | Five proof-derived cards per entrant; standard poker hand rank and deterministic kickers decide, with exact ties split. |

### Implemented Arcade expansion

| Code | Implemented Arcade game | Implemented outcome / reward rule |
|---|---|---|
| G7 | Plinko Drop | A proof-derived peg path reaches a published multiplier slot. |
| G8 | Mini Slots | Three proof-derived reels resolve published paylines, symbol weights and capped prizes. |
| G9 | Quick Keno | Player selections are compared with a proof-derived draw using a published hit/pay table. |
| G10 | Bingo Rush | Proof-derived draws fill a 3×3 card; a completed line before the limit wins the published prize. |
| G11 | Treasure Hunt | Proof-shuffled tiles contain coins, multipliers, keys and traps; the published stop/bust rule determines payout. |
| G12 | Memory Match | Eight proof-driven demo memory moves award a published multiplier from the resulting pair count. |
| G13 | Drop Ball | A proof-derived bounce path lands in a visible multiplier pocket. |
| G14 | Daily Trivia | One local daily question attempt pays 3× for the correct answer; production question integrity requires a managed content service. |
| G15 | Fishing Reel | A proof-derived rarity table determines catch, collection progress and published coin rewards. |
| G16 | Penalty Shootout | Five player shot choices resolve against proof-derived goalkeeper directions; score determines the published reward. |

**Phase 1 implementation checks:**

- Catalog registry: 29 total / CAT18–CAT29 present.
- Catalog resolver coverage: 12/12 new modes return player, bot, split or carry plus resolution detail.
- New Catalog modes use the existing waiting/manual-take/auto-bot/bot-vs-bot and Admin history paths.
- Extended Arcade registry: 10/10; all write `S.games`, Arcade history, player statistics, proof details and economy accounting.
- Autonomous bot Arcade activity covers all 16 implemented Arcade+ games.
- Feature Directory status after Phase 1: 63 Implemented / 6 Partial / 8 Suggested.


## B3 — Progression & Engagement

| Code | Feature | Before | Current v10.8 | Status |
|---|---|---|---|---:|
| P1 | Battle Pass | Idea only | Monthly free/premium tracks, XP milestones, claims and history | ✅ |
| P2 | 7-Day Login Calendar | Numeric streak only | Visual calendar, automatic escalating rewards, day-7 cosmetic + 250 BONUS | ✅ |
| P3 | Weekly Challenges | Daily quests only | Weekly wins, game variety and streak goals with claims and history | ✅ |
| P4 | Prestige | Idea only | Level-10 reset, rank, Rainbow frame, permanent +5% XP per rank, history | ✅ |
| P5 | Skill Matchmaking | Unranked matching | Five skill tiers, preferred peer-bot matching and safe fallback | ✅ |

## B4 — Economy & Monetization

| Code | Feature | Before | Current v10.8 | Status |
|---|---|---|---|---:|
| E1 | Mystery Crates | Idea only | Four crate tiers, 1–3 cosmetics, rarity floor, purchase accounting/history | ✅ |
| E2 | Trading Post | Idea only | Bot listings, player purchases/sales, solvent bot buyer, 10% fee, history | ✅ |
| E3 | Staking / Interest | Bank had no interest | Stake/unstake, completed-week 1%, 500 claim cap and history | ✅ |
| E4 | Subscription Tiers | Idea only | Plus/Pro/Elite 30-day tiers, cosmetic/theme/quest/booster perks and history | ✅ |
| E5 | Coin Boosters | Idea only | 2× XP for 1 hour, +5% rakeback for 24 hours, extension and history | ✅ |
| E6 | Cosmetic Crafting | No crafting sink | Uncommon/Rare/Epic rarity-floor recipes cost 150/400/800 MAIN, grant one cosmetic, retain up to 50 crafts and use shop/sink accounting | ✅ |
| E7 | Event Ticket Packs | No event utility token | Persistent non-payout demo tickets cost 100 MAIN for 1, 250 for 3 or 500 for 7; up to 50 purchases retained | ✅ |
| E8 | Clan Treasury | No shared utility fund | Minimum 50 MAIN contribution (control defaults to 100); non-withdrawable sink/social resource; level `min(10, 1 + floor(total/1,000))`; no house revenue/game advantage | ✅ |
| E9 | Private Room Upgrades | Basic room visuals only | Basic/Neon/Royal/Cosmic cost 0/200/500/1,000 MAIN; persistent visual-only tier; up to 20 purchases retained; no odds/matchmaking advantage | ✅ |

## v9.8 Phase 1 delivery summary

The values in this section are the historical v9.8 delivery baseline; current v10.8 totals are stated at the top of this register and in the authoritative specification.

| Area | Before | Delivered at v9.8 |
|---|---|---|
| Catalog game registry | 17 playable + 12 Suggested | 29 playable; CAT18–CAT29 use complete P2P queue, matching, proof, history and Admin result paths |
| Arcade+ registry | 6 playable + 10 Suggested | 16 playable; G7–G16 have controls, published outcome rules, wallet settlement, proof and history |
| Bot coverage | Six Arcade modes | All 16 Arcade+ modes appear in autonomous bot activity |
| Feature Directory | 41 Implemented / 6 Partial / 30 Suggested | 63 Implemented / 6 Partial / 8 Suggested |

## v9.8 bot activity, progression and shop expansion

| Area | Before | Current v10.8 |
|---|---|---|
| Bot game cadence | Six Coin Toss and six Catalog runs per normal cycle | Eight Coin Toss and eight Catalog runs per normal cycle, plus two Arcade+ bot sessions |
| Social bots | Mostly reactive friend/chat behavior | Bot requests, bot-to-bot friendships, autonomous lobby chat, room/clan/gift activity events and live logs |
| Arcade bots | Raffle participation only | Activity across Wheel, Scratch, Dice, Raffle, Multiplier Ladder and War with wallet/economy accounting |
| Bot top-up trigger | Hard-coded paths around 100/500 | One shared Admin-configurable trigger, default 500, with varied top-up values and first-top-up promo handling |
| Bot population | Fixed at 99 | Automatic creation at a configurable interval/batch up to a configurable cap; visible count rises in Home, Player Directory and Admin |
| Achievements | 29 | 49, including social, Arcade, payout, wagering, collection, clan and level milestones |
| Levels | Rewards configured through 25 | Rewards configured through 50; cosmetic milestones at 30/40/50; Admin editor has filter/sort/20-row pagination |
| Shop | 96 items | 134 items: 38 additions across all nine categories; bots purchase from the expanded inventory |

## v10.8 bot starting wallet

| Area | Before | Current v10.8 |
|---|---|---|
| Seeded/procedural MAIN | Nonzero balances embedded/generated in roster | Every source bot definition and procedural bot starts at exactly 0 MAIN |
| Starting BONUS | No separate bot BONUS wallet | Every bot receives exactly 1,000 in `bonusBalance` |
| Existing saved bots | Retained historical MAIN/top-up state | One-time `walletVersion=2` migration resets to 0 MAIN / 1,000 BONUS and pending first top-up |
| Auto-created bots | Random 2,500–12,499 MAIN | 0 MAIN + 1,000 BONUS, then immediate required varied first MAIN top-up |
| Admin-created bots | Random 5,000–9,999 MAIN | 0 MAIN + 1,000 BONUS, blocked until live engine completes first MAIN top-up |
| First top-up base | Credited base + promo into one balance | Varied 400–1,600 base credits MAIN only |
| First promotion | Added into bot balance | +50% credits BONUS only when enabled |
| Starting bonus accounting | Not applicable | One-time 1,000 tap + promotion cost, with `startingBonusAccounted` and timestamp |
| Record | Base/promo/total | Adds startingBonus and full walletCredit while retaining required/pre-play flags |
| Player profile | One Balance tile | Separate MAIN, BONUS and Total wallet tiles |
| Admin readiness | Ready/blocked/top-up counts | Also shows aggregate bot MAIN/BONUS and separates starting versus first-promo BONUS |
| CSV/history | First promo only | Starting bonus, first promo, wallet credit and reason are separate columns |

The initial 1,000 BONUS is a non-revenue promotional wallet credit. Required first top-up still occurs before play and places base in MAIN; later threshold top-ups also credit MAIN.

## v10.7 required bot first-top-up gate

| Area | Before | Delivered at v10.7 |
|---|---|---|
| Existing/imported bots | Could play from seeded balance while `firstTopupDone=false` | Coordinated engine bulk-completes every pending first top-up before its first full bot tick |
| Initial Player activation | Bot onboarding happened only after low balance | Engine leader performs required onboarding synchronously before initial Player render/play availability |
| Auto-created bots | Joined with starting balance and top-up only when low | Required varied first top-up occurs immediately after insertion and before activity logs |
| Admin-added bots | Entered as pending and could become selectable | Remain blocked and are onboarded by the next coordinated engine pulse before any play |
| Direct matching | Pools mainly checked available balance | Named-bot, skill and activity pools invoke first-top-up readiness helpers before selection |
| First top-up | Triggered only below configurable balance threshold | Always required regardless of starting balance; base remains varied 400–1,600 |
| Promotion | Applied on first low-balance top-up | Applies to the required first top-up when enabled; Admin can pause it and base top-up still completes |
| Record | Base/bonus/total/reason/count | Also retains `requiredFirst`, `prePlay` and `firstTopupAt` |
| Feed | Potential row per onboarding top-up | Bulk onboarding suppresses spam and writes one summary row |
| Admin visibility | Top-up history only | Live readiness cards show complete, blocked and total bot top-up counts; Analytics shows ready/pending |
| Later top-ups | Below default 500 | Unchanged, but only after first-top-up eligibility is complete |

Every game/activity path executes after the global gate, and direct-selection helpers enforce the same rule defensively. Base credits remain demo taps; first-top-up bonuses remain taps plus promotion cost; neither is house revenue.

## v10.6 live Admin synchronization

| Surface | Before | Delivered at v10.6 |
|---|---|---|
| Opening Admin | Header/footer navigated away from Player in the same tab | Admin opens in a new tab, so the normal Player engine remains loaded |
| Direct Admin load | No Player engine guaranteed | Admin embeds a one-pixel same-origin Player-engine fallback (`index.html?engine=1`) |
| Hidden-tab execution | Relied on throttled Player `setInterval` | Visible Admin sends a BroadcastChannel pulse every 1.8 seconds; hidden Player/fallback runs the full bot tick |
| Multiple Player instances | Each tab could attempt background simulation | Six-second localStorage leader lock allows one Player engine and failover |
| Shared persistence | Periodic localStorage writes and reciprocal render/save risk | Every bot tick persists immediately; remote renders suppress saves through `applyingRemoteState` |
| Admin live view | Storage refresh could be delayed and inputs paused full rendering | Admin reloads every state event, updates safe summaries while editing, and fully renders otherwise |
| Status | Generic SYSTEM LIVE label | BOT ENGINE LIVE / PLAYER CONNECTED · SYNCING / WAITING FOR PLAYER TAB |
| Bot scope | Could appear stopped after Admin navigation or timer throttling | Full Coin Toss, Catalog, Arcade+, social, transfer, top-up, growth, Series and tournament paths continue |

Coordination channel: `tossmatch_bot_live_v1`. Leader key: `tossmatch_bot_leader_v1`. Shared application state remains `tossmatch_v8`. BroadcastChannel is feature-detected; same-origin localStorage remains the state transport and fallback.

## v10.5 top-up analytics

| Surface | Before | Delivered at v10.5 |
|---|---|---|
| Player top-up record | Timestamp + base amount for RG usage | Timestamp, base, first bonus, campaign bonus, total bonus, credited total, campaign ID and source; legacy records remain readable |
| Player Wallet/Home | Top-up action and first-promo status | Four Wallet KPIs plus a ninth customizable “Top-up credited” Home KPI |
| Player Statistics | Game, payout and participation analytics | Adds top-up count, base/bonus/credited totals, average, largest, 7/30-day volume, bonus split/rate and recent records |
| Monthly statement | Base top-up total | Adds count, base, bonus and credited totals for the selected month |
| Admin header/Overview | Revenue, games, jackpot and operations KPIs | Adds combined Player/bot base volume, bonuses and event count |
| Admin Economy | Aggregate taps/sinks | Separates Player credits, bot credits, top-up promo credits and explicit zero top-up revenue |
| Admin Top-up Analytics | No dedicated page | Combined cards, Player/bot summaries, filtered/sorted Player records, 20-row pagination, recent bots and combined CSV export |
| Accounting | Top-ups treated as demo taps | Base credits remain liquidity taps; bonuses are tap + promo cost; no top-up is revenue, deposit or payment |

The application version is **v10.8**. Catalog, Arcade+, Feature Directory and Player command totals remain **33 / 20 / 101 / 72**; Admin screen navigation increases from 11 to **12**.

## v10.4 coin-use expansion

| Area | Before | Current v10.8 |
|---|---|---|
| P2P Catalog | 29 games | 33 games after CAT30 Three Dice Poker, CAT31 Last Digit, CAT32 Binary Code and CAT33 Coin Balance |
| Arcade+ | 16 modes | 20 modes after G17 Coin Pusher, G18 Tower Builder, G19 Match-3 Rush and G20 Mystery Vault |
| Non-wager coin uses | Shop, crates, trading, subscriptions, boosters and transfers | E6 crafting, E7 event tickets, E8 clan treasury and E9 room visual upgrades |
| Bot Arcade activity | All 16 modes | Dynamic mode list now includes all 20 modes |
| Command navigation | 45 exact games | 53 exact games in Player/Admin command palettes |
| Feature Directory | 78 Implemented / 3 Partial / 8 Suggested / 89 total | 90 Implemented / 3 Partial / 8 Suggested / 101 total |

### CAT30–CAT33 winner rules

| Code | Game | Winner / carry rule |
|---|---|---|
| CAT30 | Three Dice Poker | Triple beats pair, then higher total/high die; exact category/total tie splits |
| CAT31 | Last Digit Duel | Claimed proof-number last digit wins; unclaimed digit carries |
| CAT32 | Binary Code Duel | Lowest Hamming distance to proof H/T code wins; equal distance splits |
| CAT33 | Coin Balance Battle | Closest prediction to HEADS count in ten flips wins; equal distance splits |

### G17–G20 payout rules

| Code | Game | Published demo payout |
|---|---|---|
| G17 | Coin Pusher | Proof drops lead to 0×, 0.5×, 1×, 2×, 3× or 6× tray |
| G18 | Tower Builder | Floor 3/5/7 targets pay 1.6×/3×/7× only if every risk check passes |
| G19 | Match-3 Rush | Two matches 1.5×, four matches 4×, six+ matches 10× |
| G20 | Mystery Vault | One of five proof-selected keys; correct key pays 4.5× |

## v10.3 demo UX implementation

Per the demo-scope decision, only UX1–UX4 are implemented locally. All remaining cons and LiveOps/Trust/Operations ideas are deferred to production and retain their warnings/Suggested status.

| Code | Feature | Current v10.8 demo | Status |
|---|---|---|---:|
| UX1 | Accessibility Center | Persistent high contrast, reduced motion, 90–130% text scale, deuteranopia/protanopia/tritanopia presets, screen-reader hints and reset | ✅ |
| UX2 | Customizable Dashboard | Nine available KPI cards, including Top-up credited, and four Home sections with show/hide, reorder, persistence and reset; at least one item remains visible | ✅ |
| UX3 | Saved Bet & Game Presets | Up to 20 named Coin/Catalog/Arcade presets storing stake, game/side and Auto Bet stop; apply fills controls only and never auto-wagers | ✅ |
| UX4 | Smart Game Discovery | Explainable recommendations from favorites, unplayed variety, current game, Daily Trivia and Fishing collection; exact links and no auto-wager | ✅ |

**Directory after v10.3:** 78 Implemented · 3 Partial/demo-only · 8 Suggested · 89 total unique records.

**Still Suggested for production:** LIVE1–LIVE3, TRUST1–TRUST4 and OPS5.  
**Still production cons:** server ledger/RG authority, Admin/account security, independent fairness, safe rendering, durable persistence, certification, professional localization, disputes/privacy/device/incident infrastructure and browser accessibility certification.

## v10.2 cons review and Suggested roadmap

The synchronized cons review is maintained in `TossMatch_Cons_and_Roadmap.md`. The highest risks remain client-authoritative money/RG state, no protected Admin/account service, client-generated fairness secrets, unsafe local HTML interpolation, localStorage durability, uncertified game mathematics and missing identity/jurisdiction controls.

| Code | Suggested feature | Priority | Current status |
|---|---|---:|---|
| UX1 | Accessibility Center | P1 | Suggested — high contrast, reduced motion, text scale, colour-blind and screen-reader preferences |
| UX2 | Customizable Dashboard | P3 | Suggested — account/device-backed KPI and widget layouts |
| UX3 | Saved Bet & Game Presets | P2 | Suggested — named stake/game/Auto Bet presets with confirmations and RG checks |
| UX4 | Smart Game Discovery | P3 | Suggested — explainable, variety-aware and RG-aware recommendations |
| LIVE1 | Event Calendar & Scheduled Play | P2 | Suggested — timezone-aware tournaments, Cups, promotions and reminders |
| LIVE2 | Match Replay & Shareable Proof | P2 | Suggested — step replay, redacted proof package and share link |
| LIVE3 | Clan Seasons & Cooperative Quests | P3 | Suggested — divisions, shared goals, contribution ledger and archives |
| TRUST1 | Identity, Age & Jurisdiction Checks | P1 | Suggested — age gate, KYC status, geofencing and eligibility |
| TRUST2 | Privacy & Data Rights Center | P1 | Suggested — consent, export, correction, deletion and retention workflows |
| TRUST3 | Dispute & Support Case Center | P1 | Suggested — game/transaction case creation, proof, SLA and resolution |
| TRUST4 | Device & Session Management | P1 | Suggested — active sessions, revoke, unusual access and step-up verification |
| OPS5 | Status & Incident Center | P2 | Suggested — service health, incident timeline, notices and postmortems |

**Feature Directory after v10.2 review:** 74 Implemented · 3 Partial/demo-only · 12 Suggested · 89 total unique records.

### Principal cons requiring architecture work

1. Client-authoritative ledger, settlement, promotions and RG enforcement.
2. No protected account/Admin identity, RBAC or server-side TOTP enforcement.
3. Browser-generated fairness secrets and mutable retained proofs.
4. Unsafe interpolation of some local/user text into `innerHTML`.
5. localStorage concurrency, durability and cross-device limitations.
6. Monolithic HTML applications and incomplete full-browser/accessibility automation.
7. Uncertified game mathematics and locally simulated bot/human analytics.
8. Missing identity, privacy, dispute, device/session and incident workflows.

## v10.1 Catalog and Arcade+ game navigation

The values in this section record the v10.1 delivery baseline before the v10.4 game expansion.

| Surface | Before | Delivered at v10.1 |
|---|---|---|
| P2P Catalog | 29 horizontally scrolling tabs | Search by name/code/rule, four categories, Favorites filter, grouped quick jump, current-game favorite and visible-result count |
| Arcade+ | 16 horizontally scrolling tabs | Search by game/code/rule, four categories, Favorites filter, grouped quick jump, current-game favorite and visible-result count |
| Player command palette | 19 screen destinations | 19 screens plus all 29 Catalog and 16 Arcade+ exact-game destinations |
| Admin command palette | 11 Admin destinations | 11 Admin screens plus exact Player links for all 45 games |
| Deep linking | Feature Directory links | Exact-game command results reuse `tab` + `feature` query parameters and preserve existing deep links |
| Persistence | Active game only | Catalog and Arcade favorite IDs persist in shared settings |

**Catalog categories:** Side Picks (12), Numbers & Dice (8), Patterns & Territory (8), Cards (1).  
**Arcade categories:** Classic & Chance (6), P2P Duels (2), Puzzle & Picks (5), Daily & Collection (3).

## v10.0 navigation accessibility release

| Surface | Before | Current v10.8 |
|---|---|---|
| Player desktop | 19 grouped sidebar buttons | Sidebar search, grouped quick jump and searchable command palette retain all 19 destinations |
| Admin desktop | 11 grouped sidebar buttons | Sidebar search, grouped quick jump and searchable command palette now expose all 12 destinations |
| Keyboard | Tab/Enter only | Ctrl/⌘+K opens global navigation; `/` opens it when not typing; Escape closes it |
| Player mobile | Horizontally scrolling full menu | Fixed Home/Play/Catalog/Wallet dock plus More command palette |
| Admin mobile | Horizontally scrolling full menu | Fixed Overview/Live Ops/Directory/Trust dock plus More command palette |
| State feedback | Active sidebar tab | Sidebar, quick-jump select and mobile dock synchronize after every navigation action |
| Accessibility | Basic buttons | Dialog roles, aria labels, visible focus/hover states and search empty states |

## v9.9 Phase 2 delivery summary

The values in this section are the historical v9.9 Trust Center delivery baseline.

| Area | Before | Delivered at v9.9 |
|---|---|---|
| Directory completion | 63 Implemented / 6 Partial / 8 Suggested | 74 Implemented / 3 production-required Partial / 0 Suggested |
| Platform | No install/language/API/push flow | PWA assets, five languages, API explorer/OpenAPI and notification center |
| Security | Fairness only; 2FA/anti-cheat suggested | TOTP demo, anti-cheat scans, fairness and monthly statements |
| Responsible Gaming | Loss limit/60-second local lock | Deposit/session limits, cool-off, durable exclusion and reality graph/reminders |
| Promotions | Admin metadata only | Player claim/activation, one-claim enforcement and Admin metrics |
| Analytics | Command Center snapshot | Retained five-second sample series, KPIs, chart and JSON export |

## Audit corrections retained in v10.4

| Finding | Before | Current |
|---|---|---|
| Sink ratio | Sinks plus gross revenue were counted | Uses recorded sinks once |
| Catalog gross | Some admin gross paths omitted Catalog fees | Catalog included everywhere |
| Raffle | Ticket cost and house cut could both be recognized | Tickets enter pool; only 20% house cut is revenue |
| Direct game payouts | Prize cost missing from house cost | Wheel/Scratch/Dice payouts record taps and promo cost |
| Trading sale | Simulated buyer did not pay | Solvent bot pays, receives item; player 90%, house 10% |

## Demo-only items requiring production services

| Item | Current demo | Production requirement |
|---|---|---|
| Admin authorization | Direct local admin page | RBAC, MFA and protected server routes |
| Fairness server seed | Generated in browser | Independent commitment/reveal service |
| Multiplayer | Bots/local state | Authenticated realtime matchmaking |
| Priority support / early access | Entitlement status | Support/ticketing and release-access services |
| Persistence | localStorage | Transactional database and conflict handling |
| User text safety | Local `innerHTML` templates | Escaping/sanitization and CSP |

## v9.9 Phase 2 — Platform, Security, Responsible Gaming and service completion

| Code | Feature | Current v10.8 demo implementation | Status |
|---|---|---|---:|
| OPS-4 | Promotions Manager | Admin scheduling/pause/delete plus Player credit/cash-drop claims, next-top-up activation, one-claim tracking and Admin claim metrics | ✅ |
| RG-D | Demo RG Controls | Loss limit, deposit/session limits, cool-off, durable exclusion, reality graph, bank and Auto Bet stop | ✅ |
| T1 | Installable PWA / Mobile App | Manifest, theme metadata, 192/512 icons, install readiness and offline service-worker cache | ✅ |
| T2 | Multi-language | Persistent English, Hindi, Bengali, Tamil and Telugu primary navigation/Home translation | ✅ |
| T3 | Public API | In-browser status/leaderboard/results/fairness explorer, API-key rotation, request log and OpenAPI file | ⚠️ Server API/auth required |
| T4 | Real-time Analytics Dashboard | Cross-tab live bot-engine pulses plus retained player/game/revenue/queue/social/Arcade samples, Admin KPIs/chart/export | ✅ |
| T5 | Push Notifications | Browser permission, alert preferences, local Notification API/fallback and history | ⚠️ Remote push backend required |
| SEC1 | Two-Factor Authentication | Web Crypto HMAC-SHA1 six-digit TOTP enrollment, ±one-window verification and verified disable | ⚠️ Account/backend enforcement required |
| SEC2 | Anti-Cheat Detection | Player/Admin scans for impossible balances, extreme win rate, duplicate proof, malformed payout and unsafe Turbo | ✅ |
| SEC3 | Public Fairness Page | Standalone proof verification without account access | ✅ |
| SEC4 | Monthly Activity Statements | Monthly preview plus JSON/CSV download and simulated email log | ✅ |
| RG1 | Deposit Limits | Daily/weekly/monthly persisted limits, usage, immediate decreases, delayed increases/removal and top-up enforcement | ✅ |
| RG2 | Session Time Limits | Persisted maximum duration, new-game block and enforced cool-off | ✅ |
| RG3 | Durable Self-Exclusion | Timed/permanent shared-state exclusion with no early Player/Admin undo | ✅ |
| RG4 | Reality Check Graph | Configurable reminders, capped P/L points, graph and explicit session up/down callout | ✅ |

**Feature Directory after Phase 2:** 74 Implemented · 3 Partial/demo-only · 0 Suggested · 77 total unique records.

### Phase 2 production boundary

The three Partial records have complete local demonstration flows but cannot be production-complete in a static browser app: Public API needs authenticated server routes, Push Notifications need a remote push/subscription service, and 2FA needs protected account secrets and server-side enforcement. PWA offline caching is genuine when served from a secure origin; all other trust features remain local-state demonstrations until backed by server authority.

## Recommended next phase — production deployment foundation

1. Server-authoritative ledger, RG and settlement.
2. Authenticated account/Admin services, RBAC, MFA and device/session control.
3. TRUST1 identity/age/jurisdiction eligibility.
4. TRUST2 privacy/data-rights workflows.
5. TRUST3 dispute/support case management.
6. TRUST4 device/session management.
7. LIVE1/LIVE2/OPS5 durable event and incident services, followed by LIVE3.
8. Modular TypeScript, schema validation, Playwright, axe-core and certification.
