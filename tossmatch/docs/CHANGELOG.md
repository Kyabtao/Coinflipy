# TossMatch Changelog

## v13.0 — Admin Alignment, Ledger Audit & Cleanup (Phases 2–6)

- **Safe money math** — new shared module `js/shared/money.js` (built on the
  `src/js/utils/math.js` subunit primitives). Every fee, rake, payout, escrow,
  refund, deposit, withdrawal, vault move, transfer and Admin adjustment now
  runs through integer-subunit math that rounds exactly once, and through
  `debitWallet()` / `creditWallet()` / `debitBot()` / `creditBot()`.
- **Ledger invariants** — `ledgerAudit()` verifies non-negative whole-coin
  balances, escrow integrity, duplicate-settlement detection, well-formed ledger
  rows and the reconciliation formula
  `net profit = gross revenue − total costs (promo + comps + rakeback + referral)`. `enforceWalletInvariants()`
  repairs drift on boot and on every reconcile.
- **Concurrency** — `withWalletLock()` serialises wallet-critical sections, so
  rapid clicks and overlapping bot ticks can never double-spend.
- **Admin ↔ Player alignment** — new *Game parameters* panel (minimum stake,
  stake ceiling, payout cap, house edge, flip animation speed, Auto Bet stop)
  that the player app reads live; freeze/unfreeze for the demo player and every
  simulated player; per-player bet history in the record drawer; live player
  session monitor.
- **Revenue dashboard** — new *Commercial → Revenue* screen with volume/NGR
  tiles, daily and weekly SVG charts, a reconciliation readout, and CSV + JSON
  exports of the merged transaction log.
- **Component library wired** — `src/components` (button, card, modal, badge,
  input) and `src/css/variables.css` are now used by the app; the Revenue screen
  builds its tiles and buttons from them.
- **Targeted rendering** — `renderChrome()` / `renderTab()` / `renderTick()`
  (player) and `renderAdminChrome()` / `renderAdminTab()` / `renderAdminTick()`
  (admin). Tab switches and background bot ticks now repaint only the active
  screen.
- **Human labels** — internal codes (`B1–B4`, `UX1–UX4`, `G21–G23`,
  `CAT18–CAT33`, `E6–E9`, `S1–S7`) removed from every user-visible string; the
  Feature Directory shows the human category and its search index ignores codes.
- **Navigation redesign** — icon chips, gold/purple active accent bars with
  glow, gradient header hairline, hover polish, `:focus-visible` rings and
  `min-width` guards for the horizontal mobile tab bar.
- **Cleanup** — 29 paths (~7.9 MB) deleted: the `old data/` workspace archives,
  the superseded single-file prototypes and mock data under `docs/legacy/`, and
  the unreferenced duplicate component stylesheets. Full register in
  `doc/CLEANUP_AND_ARCHITECTURE.md`.
- **Audit** — `tools/audit.js` extended (targeted rendering, component wiring,
  human labels, Admin ↔ Player alignment, repository hygiene) and two new
  harnesses added: `tools/ledger-simulation.mjs` (money math, concurrency,
  invariants) and `tools/boot-smoke.mjs` (headless jsdom boot + screen walk).
  `tossmatch/docs/audit-loop-v13.0.log` records **20/20 clean passes** —
  157 checks per pass, 3,140 assertions, 0 failures.

### Phase 7 — New features, redesigned navigation and real-world Admin console
- **P2P catalog +3** — CAT34 Byte War, CAT35 Sum of Four and CAT36 High Card Duel
  (36 catalog games total), with proof resolvers, groups and Admin command entries.
- **Arcade Zone +2** — G24 Roulette (16-pocket proof wheel, 2×/2×/15×, house zero)
  and G25 Blackjack Hit-or-Stand (natural 3×, win 2×, push 1×; 25 arcade modes).
- **Event Calendar (LIVE1 → demo)** — Social Hub *Events* tab: daily trivia, weekly
  raffle, live auto-tournaments, season/VIP resets and active campaigns in one
  timezone-aware schedule (local + UTC) with persisted per-event reminders.
- **Career Milestones (P6)** — twelve lifetime goals (games, wins, wager, jackpots,
  level, achievements) with one-time BONUS claims that survive Prestige.
- **Auction House (E10)** — three weekly cosmetic lots, autonomous bot bidding,
  winner pays at the hammer and the house keeps a 10% hammer fee recognised as
  `house.auctionFees` in the revenue fund-source register.
- **Revenue fund-source register** — Admin Revenue now classifies every source as
  REVENUE / COST / FUNDING / CASH-OUT / LIABILITY with % of gross and an NGR total;
  the ledger audit verifies `net = gross − (promo + comps + rakeback + referral)`.
- **Navigation redesign (both apps)** — collapsible nav groups with persisted state,
  live badges (open bets, friend requests; Admin approvals, cash-out triggers,
  campaigns), a Recent row (last 4 screens), and search that flattens groups.
- **Leaderboard & Roster list controls** — name/country filter, sort modes and
  Prev/Next pagination on the player Leaderboard (10/page) and Player Roster (12/page).
- **UI copy cleanup** — every internal spec code (CAT23, G24, S1, T1, SEC2, RG1,
  OPS4, AC-*) removed from visible buttons, nav, headings and descriptions in both
  apps and rewritten as human-readable copy.
- **Home stability** — live ticks now update KPI values in place (tabular
  numerals) and rebuild Home cards only when their data changes, eliminating the
  full-screen reflow/shake on every bot tick.
- **Real-world Admin console** — session-gated sign-in (admin / flip2026) with
  2FA demo code 246810, RBAC roles (Super Admin, Finance, Operations, Support),
  header profile + logout, new **Approvals** screen (KYC player verify/reset plus
  simulated request queue, review-flag triage, freeze and exclusion controls,
  decision history — all audit-logged) and new **Settings** screen (house
  economics, role switching, maintenance, engine speed, factory reset).
- **All-page stability** — shared `patchHTML` / `withPatchedDom` DOM patcher merges
  background-tick `innerHTML` writes in place when the structure is unchanged, so
  every player and Admin screen stays still on live data (no full-screen reflow,
  no lost focus/scroll) instead of only Home.
- **Unified player/bot Admin screens** — *Top-up Analytics* becomes **Top-ups &
  Deposits — Players and Bots** (one stats block + one records table with an All /
  Players / Bots filter, unified search, sorts, pagination, CSV export); the
  Withdrawals ledger merges bot cash-outs and player withdrawals into one table
  with Player/Bot badges and the same filter.
- **Four new Admin screens (17 → 21)** — **Reports & Analytics** (7-day revenue
  and cash-flow charts, revenue mix, busiest games, CSV/JSON export), **Games &
  Content** (36 catalog games with plays, fee contribution and per-game
  enable/disable), **Referrals** (referral code, referred roster, 5% house payout,
  register action) and **Announcements** (create/publish/unpublish/delete in-app
  announcements that appear on player Homes), all wired into nav, RBAC, command
  palette and the feature directory (ADM-4…ADM-7).
- **Continuous audit loop** — `run-audit-loop.sh` now runs the full stack
  (static audit + boot smoke + feature regression) for 20 consecutive passes;
  log in `tossmatch/docs/audit-loop-v13.0.log`.
- **Support & Messaging screen (new, 21 → 22)** — unified ticket inbox for
  player and bot reporters with Player/Bot badges, filter, status filter,
  reply and close (audit-logged), open-ticket nav badge, and a compose panel
  that delivers platform messages (direct/broadcast) to the player Services
  hub's new **Support** tab (contact form + "My tickets" + platform messages).
- **Admin user management (Settings)** — console accounts with role select,
  enable/disable and add-user; the primary Super Admin is protected from
  demotion/disable; all changes audit-logged.
- **Backup & restore (Settings)** — point-in-time state snapshots (five
  newest retained in the browser) with create/restore/delete; restore mutates
  the live state in place so no module reference is invalidated.
- **Feature directory** — ADM-8 (Support & Messaging) and ADM-9 (Admin Users
  & Backups); regression suite extended to 94 checks.

## v12.0 — Modular Code Structure

- Restructured the two single-file apps (`index.html`, `admin.html`) into reusable **native ES modules** (`<script type="module">` + `import`/`export`).
- Split the inline CSS into dedicated stylesheets: `css/player/app.css`, `css/admin/app.css` and a shared `css/shared/theme.css`.
- Extracted the shared theme engine into `js/shared/theme.js` and shared runtime state into `js/shared/runtime.js`, both imported by the player and admin apps.
- Split the player app into `core`, `data`, `bots`, `crypto`, `state`, `helpers`, `render`, `theme`, `games`, `wallet`, `misc`, `sync`, `boot` + `main.js`.
- Split the admin app into `core`, `render`, `theme`, `engine`, `banking`, `sync`, `boot` + `main.js`.
- Cross-module mutable state is held in the shared runtime on `globalThis`; module top-level wiring is deferred into per-module `bind()` calls so module evaluation order cannot change app behavior.
- Kept module evaluation order identical to the original single-file execution order (verified by the audit harness + Node module-load smoke test).
- Bumped the service worker to `tossmatch-v12.0`, precaching every `js/` and `css/` module.
- Updated `tools/audit.js` to (a) validate the module structure, ESM parse, import resolution and `type="module"` entrypoints, (b) keep every existing accounting, theme and asset check by scanning the concatenated module bundle, and (c) keep the shared-theme runtime smoke test.
- Audit loop: `tossmatch/docs/audit-loop-v12.0.log` records **20/20 clean passes** as the release gate.

## v11.0 — Unified Merge Release

- Merged all five project workspaces (spec document set, demo/admin uploads, combined v1 set, modular redesign, v10.8 single-file app) into one cohesive project.
- Made the v10.8 single-file application the unified functional base; archived every historical document under `docs/legacy`.
- Ported the bot-withdrawal economy loop from the modular redesign: personal 3,000–5,000 MAIN cash-out triggers, `withdrawAt`/`withdraws`/`withdrawTotal` bot fields, `wdCool` pacing, coin-sink accounting and a `withdrawals` ledger.
- Added Admin-configurable `wdMin`, `wdMax` and `wdTickChance` with 3,000/5,000/0.35 defaults.
- Added a 13th Admin screen — Withdrawals — with paid/eligible/trigger KPIs, statistics, House P&L impact, filtered and paginated ledger, closest-to-cash-out table, "Process eligible now" action and CSV export.
- Added a 14th Admin screen — Player Directory — with the demo player plus full simulated roster, MAIN/BONUS split, records, net, level, top-up and withdrawal columns, search, sorting and pagination.
- Updated house P&L everywhere (Overview, Economy, Withdrawals, storage-event refresh) to deduct bot withdrawals from gross revenue.
- Returned the real coin photographs as the Photoreal coin skin (legendary, 800 coins) and the photographic header logo, both from the modular redesign assets.
- Unified the icon set (favicon.png, icon-192, icon-512 png/jpg) and the image assets (logo, coin-heads, coin-tails) with service-worker caching for all new files.
- Fixed the Statistics "Best streak" tile reading the non-existent `stats.bestStreak` (now the live `S.bestStreak`).
- Guarded the Admin RNG chart against environments without a 2D canvas context.
- Feature Directory grew to 103 records (OPS-5 Bot Withdrawals, OPS-6 Player Directory) with dynamic totals.
- Restored the classic provably-fair bank games Crash, Hi-Lo and Mines as Arcade+ modes G21–G23; they were fully implemented in the codebase but unreachable after the v10 hub restructure.
- Crash includes the published 97% RTP curve and auto cash-out; Hi-Lo banks 1.7× streaks; Mines reveals gems on a 5×5 board with proof-placed mines — all three settle to the wallet, keep proofs, write game history and retain jackpot hooks.
- Extended autonomous bot Arcade activity to the restored modes (23 total Arcade+ modes).
- Renamed the project identity to TossMatch v11.0 across the player app, admin panel, manifest, service worker and welcome feed.

## v10.8 — Bot Starting Wallet

- Changed every hand-authored bot seed balance to 0 MAIN.
- Changed procedural roster generation to 0 MAIN instead of random starting MAIN.
- Added a separate `bonusBalance` initialized to exactly 1,000 for every bot.
- Added one-time `walletVersion=2` migration for existing/imported bots: 0 MAIN, 1,000 BONUS and pending required first top-up.
- Changed auto-created and Admin-created bots to the same 0 MAIN / 1,000 BONUS starting wallet.
- Added one-time starting BONUS accounting as a tap and promotion cost with `startingBonusAccounted` and `startingBonusAt`.
- Required varied first top-up base 400–1,600 now credits MAIN only.
- Optional +50% first-top-up promotion now credits BONUS only.
- Added `startingBonus` and `walletCredit` to required bot top-up records.
- Updated Player bot profiles with separate MAIN, BONUS and Total wallet cards.
- Updated Admin Live Operations with aggregate bot MAIN and BONUS cards.
- Updated Top-up Analytics to separate starting BONUS from first-promo BONUS and include complete wallet credit.
- Updated bot top-up history and combined CSV export with distinct starting/promo bonus columns.
- Preserved the required-first-top-up-before-play gate and v10.6 live Admin synchronization.
- Updated Feature Directory descriptions, specification, Feature Register, Cons/Roadmap, DOCX Appendix Z, service-worker cache and audit report.

## v10.7 — Required Bot First Top-up

- Added a mandatory eligibility gate: every bot must complete one first top-up before any game or autonomous activity.
- Bulk-onboards all existing/imported pending bots before the coordinated engine’s first full bot tick and before initial Player play availability.
- Applies the existing varied 400–1,600 base calculation to required first top-ups regardless of starting balance.
- Applies the +50% first-top-up promotion when Admin leaves it enabled; if paused, the base first top-up still completes and unlocks the bot.
- Added `ensureBotFirstTopup`, `ensureAllBotsFirstTopups` and `readyBotPool` defensive eligibility helpers.
- Updated named-bot, skill-match and balance/activity pools to require first-top-up completion before selection.
- Auto-created bots now top up immediately after insertion and before their network/activity logs.
- Admin-added bots remain blocked until the next live coordinated engine pulse performs their required first top-up.
- Added `requiredFirst`, `prePlay` and `firstTopupAt` record/state details.
- Bulk onboarding suppresses individual feed spam and writes one eligibility-summary feed row.
- Added Admin Live Operations cards for first-top-up complete, blocked-before-play and total bot top-up counts.
- Added ready/pending totals to Admin Top-up Analytics.
- Preserved later low-balance top-ups under the Admin-configurable threshold, default 500.
- Preserved accounting: base is a demo tap, first bonus is tap plus promotion cost, and no bot top-up is house revenue.
- Updated Feature Directory descriptions, full specification, Feature Register, Cons/Roadmap, DOCX Appendix Y, service-worker cache and audit report.

## v10.6 — Live Admin Bot Synchronization

- Changed Player header/footer Admin links to open Admin in a new tab so the normal Player bot engine is not unloaded.
- Added a one-pixel same-origin Player-engine fallback inside Admin for direct Admin loads or Player-tab failover.
- Added BroadcastChannel coordination through `tossmatch_bot_live_v1`; visible Admin sends an engine pulse every 1.8 seconds.
- Hidden Player/fallback instances respond to Admin pulses by running the complete existing bot tick instead of relying only on browser-throttled hidden-tab intervals.
- Added the six-second `tossmatch_bot_leader_v1` localStorage leader lock so only one Player instance simulates at a time and another can take over after closure/throttling.
- Persisted shared `tossmatch_v8` state immediately after every completed bot tick and emitted bot-tick telemetry for Admin status.
- Added Admin live status: BOT ENGINE LIVE, PLAYER CONNECTED · SYNCING or WAITING FOR PLAYER TAB.
- Updated Admin storage handling so live cards/pages refresh immediately; safe summaries keep refreshing while an Admin input remains focused.
- Added `applyingRemoteState` guards to Player/Admin save paths to prevent cross-tab render/save feedback loops and stale overwrites.
- Retained the full bot scope while Admin is visible: Coin Toss, Catalog, Arcade+, social actions, transfers, top-ups, roster growth, Series Cups and tournaments.
- Updated current documentation, Feature Directory descriptions, DOCX Appendix X, service-worker cache and audit report.

## v10.5 — Top-up Analytics

- Expanded Player top-up records from timestamp/base-only entries to base, first-top-up bonus, campaign bonus, total bonus, total credited, campaign ID and source while retaining legacy-record compatibility.
- Added Player Wallet cards for top-up count, base coins, bonus coins and total credited.
- Added a ninth customizable Player Home KPI for Top-up credited and migrated pre-v10.5 saved dashboards once.
- Expanded Player Statistics cards and page with top-up count, base/bonus/credited totals, average, largest, 7/30-day volume, first/campaign bonus split, bonus rate and recent records.
- Expanded monthly activity statements with top-up count, base, bonus and credited totals.
- Added Admin header and Overview cards for combined Player/bot top-up volume, bonuses and event count.
- Expanded Admin Economy cards with Player top-up credits, bot top-up credits, promotional credits and explicit zero top-up revenue.
- Added a dedicated 12th Admin screen, Top-up Analytics, with combined cards, Player/bot summaries, filtered/sorted Player records, 20-row pagination, recent bot records and combined CSV export.
- Preserved the accounting boundary: Player/bot base credits are demo liquidity taps, bonuses are taps plus promotion cost, and top-ups are never house revenue, deposits or payments.
- Kept game and feature totals unchanged at 33 Catalog, 20 Arcade+, 101 Feature Directory records and 72 Player command entries.
- Updated Player/Admin descriptions, complete specification, Feature Register, Cons/Roadmap, DOCX Appendix W, service-worker cache and audit report.

## v10.4 — Coin-Use Expansion

- Added four P2P Catalog games using the existing escrow, waiting room, manual take, automatic bot join, bot-vs-bot, proof, fee and history architecture.
- Added CAT30 Three Dice Poker, CAT31 Last Digit Duel, CAT32 Binary Code Duel and CAT33 Coin Balance Battle.
- Added four proof-driven Arcade+ modes with wallet settlement, published payout rules, histories and bot activity.
- Added G17 Coin Pusher, G18 Tower Builder, G19 Match-3 Rush and G20 Mystery Vault.
- Added E6 Cosmetic Crafting with uncommon/rare/epic recipes and retained results.
- Added E7 Event Ticket Packs as persistent non-payout demo utility tokens.
- Added E8 non-withdrawable Clan Treasury contributions and utility levels without house revenue or wagering advantage.
- Added E9 Basic/Neon/Royal/Cosmic Private Room visual upgrades with no gameplay advantage.
- Expanded Player/Admin exact-game command navigation to 33 Catalog and 20 Arcade+ games.
- Updated Feature Directory totals to 90 Implemented, 3 Partial, 8 Suggested and 101 unique records.
- Kept LIVE1–LIVE3, TRUST1–TRUST4 and OPS5 Suggested for production.
- Updated Player/Admin, Cons/Roadmap report, Feature Register, project documentation and audit report.
- Added `TossMatch_Complete_Feature_and_Rules_Specification.md` as the consolidated authoritative v10.4 Markdown specification.
- Added authoritative DOCX Appendix V with complete 33-game Catalog rules, 20 Arcade controls/payouts/proof boundaries, eight VIP tiers, 49 achievements, all level 2–50 rewards, the 134-item shop inventory and all 101 Feature Directory records.
- Documented exact E6–E9 prices and boundaries, Coin Toss proof/matching/Auto Bet/Turbo controls, bots, navigation, histories, Admin, accounting, RG and production deferrals without changing the application release number.
- Updated the DOCX cover metadata/document map and synchronized documentation fingerprints and delivery validation.

## v10.3 — Demo UX Improvements

- Implemented only UX1–UX4 in the demo; all other cons and roadmap items remain documented for production.
- Added UX1 Accessibility Center with persistent high contrast, reduced motion, 90–130% text scale, three colour-vision presets, screen-reader hints and reset.
- Added UX2 Customizable Dashboard with eight KPI choices, four Home sections, show/hide, reordering, persistence and reset.
- Added UX3 Saved Bet & Game Presets with up to 20 named Coin/Catalog/Arcade presets.
- Preset application fills controls and opens the selected game but never places a wager; all RG and game guards remain active.
- Added UX4 Smart Game Discovery with explainable favorite, variety, current-game, daily and collection recommendations.
- Updated Feature Directory totals to 78 Implemented, 3 Partial, 8 Suggested and 89 unique records.
- Kept LIVE1–LIVE3, TRUST1–TRUST4 and OPS5 Suggested for production deployment.
- Updated Player What’s New, Admin consistency details, Cons/Roadmap report, Feature Register, project documentation and audit report.

## v10.2 — Cons Review and New-Feature Roadmap

- Completed a synchronized review of product, UX, security, fairness, persistence, RG, compliance, operations and engineering disadvantages.
- Added `TossMatch_Cons_and_Roadmap.md` with 26 prioritized cons/risks, consequences and recommended corrections.
- Added 12 clearly Suggested Feature Directory records across UX & Accessibility, LiveOps & Social, Trust & Compliance and Operations.
- Added UX1 Accessibility Center, UX2 Customizable Dashboard, UX3 Saved Presets and UX4 Smart Game Discovery.
- Added LIVE1 Event Calendar, LIVE2 Match Replay & Shareable Proof and LIVE3 Clan Seasons & Cooperative Quests.
- Added TRUST1 Identity/Age/Jurisdiction, TRUST2 Privacy & Data Rights, TRUST3 Dispute & Support and TRUST4 Device & Session Management.
- Added OPS5 Status & Incident Center.
- Updated Feature Directory totals to 74 Implemented, 3 Partial, 12 Suggested and 89 unique records.
- Kept every new idea explicitly non-playable until implementation and validation exist.
- Synchronized Player What’s New, Admin consistency details, Feature Register, project documentation and audit report.

## v10.1 — Catalog and Arcade+ Game Navigation

- Added P2P Catalog search across game name, code, rule description, edge and category.
- Grouped 29 Catalog games into Side Picks, Numbers & Dice, Patterns & Territory and Cards.
- Added Catalog category/Favorites filtering, grouped quick jump, visible-result count and persistent favorites.
- Added Arcade+ search across game title, G-code, rule description and category.
- Grouped 16 Arcade+ games into Classic & Chance, P2P Duels, Puzzle & Picks and Daily & Collection.
- Added Arcade category/Favorites filtering, grouped quick jump, visible-result count and persistent favorites.
- Expanded the Player command palette from screen-level navigation to exact access for all 45 games.
- Expanded the Admin command palette with exact Player deep links for all 29 Catalog and 16 Arcade+ games.
- Preserved existing waiting rooms, game controls, histories, bot activity, Feature Directory and query-parameter deep links.
- Updated Player What’s New, Admin consistency details, Feature Register, documentation and audit report.

## v10.0 — Player and Admin Navigation Accessibility

- Added searchable desktop sidebars for all 19 Player and 11 Admin destinations.
- Added grouped quick-jump selectors for common Play, Account, Operations, Commercial and Governance screens.
- Added searchable global command palettes for Player and Admin.
- Added Ctrl/⌘+K command-palette access, `/` access when not typing and Escape-to-close behavior.
- Added mobile Player dock for Home, Coin Toss, Catalog, Wallet and More.
- Added mobile Admin dock for Overview, Live Operations, Feature Directory, Trust Center and More.
- Synchronized active sidebar, quick-jump and mobile-dock state after every navigation action.
- Added dialog labels, close controls, keyboard focus, search empty states and responsive navigation styling.
- Updated Player What’s New, Admin consistency details, Feature Register, documentation and audit report.

## v9.9 — Remaining Features Phase 2: Trust Center

- Added a Player Safety & Services screen and an Admin Trust Center with direct Feature Directory links.
- Added installable PWA assets: manifest, theme metadata, 192/512 icons, service-worker registration and offline cache.
- Added persistent English, Hindi, Bengali, Tamil and Telugu primary navigation/Home translations.
- Added an in-browser Public API explorer for status, leaderboard, results and fairness with key rotation, request history and an OpenAPI file.
- Added browser notification permission/preferences, local test alerts and notification history, with a production push-service boundary.
- Added Web Crypto HMAC-SHA1 six-digit TOTP enrollment, verification and verified disable demo.
- Added Player/Admin anti-cheat scans for impossible balances, extreme win rate, duplicate proofs, malformed payouts and unsafe Turbo use.
- Added five-second realtime analytics samples, Admin KPIs/chart and JSON export.
- Added monthly activity statement preview, JSON/CSV downloads and simulated email delivery log.
- Completed promotions with Player credit/cash-drop claims, next-top-up deposit-campaign activation and one-claim tracking.
- Added enforced daily/weekly/monthly deposit limits with immediate decreases and delayed increases/removal.
- Added persistent session duration limits and enforced cool-off before new games.
- Replaced the transient lock with timed/permanent durable self-exclusion that Player/Admin cannot end early.
- Added configurable reality-check reminders, retained session P/L points, graph and explicit up/down callout.
- Updated the Feature Directory to 74 Implemented, 3 production-service Partial and 0 Suggested records.
- Synchronized Player/Admin, Feature Register, changelog, project documentation and audit report.

## v9.8 — Remaining Features Phase 1: Game Expansion

- Promoted CAT18–CAT29 from Suggested records to 12 playable P2P Catalog games.
- Reused the complete Catalog operating model for every new game: escrow, per-game waiting room, manual take, automatic bot join, bot postings, bot-vs-bot settlement, post-fee payout, proof, carry/split rules, player history and Admin result visibility.
- Added working winner determination for RPS, Closest to 21, Triple Coin Majority, Sequence Builder, Dice Sum Duel, Colour Spectrum, Prime vs Composite, Median Battle, Streak Survivor, Territory Capture, Modulo Four and Poker High.
- Promoted G7–G16 to 10 playable Arcade+ demos with controls, published reward rules, proof retention, wallet/economy settlement and history.
- Added Plinko, Mini Slots, Quick Keno, Bingo Rush, Treasure Hunt, Memory Match, Drop Ball, Daily Trivia, Fishing Reel and Penalty Shootout.
- Expanded autonomous bot Arcade activity from six to all 16 implemented Arcade+ modes.
- Added Admin/Player deep links for each of the 22 new games.
- Updated the Feature Directory to 63 Implemented, 6 Partial and 8 Suggested records.
- Synchronized Player What’s New, Admin consistency details, Feature Register, documentation and audit report.

## v9.7 — Active Bot Network, Progression and Shop Expansion

- Increased normal background activity from six to eight Coin Toss matches and from six to eight Catalog matches per cycle.
- Added autonomous bot friend requests, bot-to-bot connections, lobby chat and visible social activity for rooms, clans and gifting.
- Added bot activity across all six implemented Arcade+ modes with bot balances, P2P fees, direct-game costs/payouts and live activity logs.
- Unified bot top-ups under one Admin-configurable balance trigger, defaulting to 500, while retaining varied values and the first-top-up promotion.
- Added automatic bot creation with Admin controls for roster cap, growth interval and batch size, plus an immediate “Add bot now” action.
- Added a live player-network count that increases with the Player Directory as bots are created.
- Expanded progression from 29 to 49 achievements and from level 25 to level 50 rewards, with cosmetic milestones at levels 30, 40 and 50.
- Added filtering, sorting and 20-row pagination to the Admin Level Reward Manager.
- Added 38 shop items across all nine cosmetic categories and expanded bot purchasing to the full affordable inventory.
- Updated Player What’s New, Admin consistency details, Feature Directory, project documentation, Feature Register and audit report.

## v9.6 — Auto Bet and Feature Directory

- Added configurable Auto Bet session stop with default −200, presets and custom range.
- Added category-wise Admin Feature Directory with search, status filters and quick links.
- Added B5–B7 Platform, Security and Responsible Gaming roadmap items to the directory.
- Expanded the Feature Directory with 12 Suggested Catalog concepts (CAT18–CAT29) and 10 Suggested Arcade concepts (G7–G16), without presenting them as playable.
- Documented winner/outcome rules and the shared waiting-room, auto-bot, history, Admin visibility, fairness and production boundaries for the game roadmap.
- Updated Player What’s New, Admin consistency register, documentation, feature register and audit report.

## v9.5 — Feature consistency release

- Added player **What’s New** screen with verified before/after details.
- Added the admin release consistency register.
- Added synchronized `TossMatch_Feature_Register.md`.
- Updated project documentation and audit report to current release.
- Verified all 23 B1–B4 features and core game/platform features.
- Synchronized descriptions for P2P matching, VIP, history, statistics, mobile UI, admin and accounting fixes.

## v9.4 — Player history and advanced statistics

- Added 9-category player History screen.
- Added per-game Catalog history, Friend Challenge history, Private Room lifecycle/details, Clan games/tournaments, Arcade+, Progress+, Economy+ and Social records.
- Added history search, sorting, pagination, details and JSON export.
- Added lifetime wagered, total/max payout, fees, averages, ROI, game breakdown and payout trend.

## v9.3 — Mobile correction

- Fixed wrapped navigation and overlapping native controls.
- Added themed full-width form fields and block labels.
- Added one-row touch navigation and responsive Private Room forms.
- Corrected player/admin cards, tables, headers, drawers and feature layouts on narrow screens.

## v9.2 — Feature description correction

- Added structured descriptions, effort/revenue labels and “how it works” cards to all 23 B1–B4 features.
- Corrected Friend, Profile, Spectator, Gifting, Chat and Clan behaviour descriptions.
- Corrected new-game, progression and economy rule descriptions.

## v9.1 — Premium UI and admin command center

- Added Player Home dashboard and grouped responsive navigation.
- Added Admin Command Center, alerts, quick actions, Feature Hub and record drawer.
- Added premium dark visual system for player and admin.

## v9.0 — B1–B4 implementation

- Implemented 7 Social & Community features.
- Implemented 6 New Game Types.
- Implemented 5 Progression & Engagement features.
- Implemented 5 Economy & Monetization features.
- Accelerated Coin Toss and Catalog bot auto-matching.

## v8.3 — VIP implementation

- Implemented the explicit 8-tier VIP structure and benefit bundles.
- Added permanent cosmetics/emojis, tournament/shop discounts, priority queue, titles and monthly reset.

## v8.2 and earlier

- Added 17-game P2P Catalog, unattended bot-vs-bot Series/Tournaments alongside player-vs-bot play, 1000× Turbo, bot transfers/top-ups, advanced admin pagination and economy reporting.
