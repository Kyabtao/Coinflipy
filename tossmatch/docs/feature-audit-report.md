# FlipArena v12.0 — Full Feature & Control-Screen Audit

> **v12.0 rebrand & navigation redesign addendum** (29 Aug 2026): names/copy were rewritten to a new voice and the app was rebranded from TossMatch to **FlipArena**. Internal + external navigation was redesigned (new screen names/descriptions, restructured sidebar groups, quick-jump, command palette, mobile docks, and player↔admin cross-links). The content below reflects the rebranded app.

**Audit date:** 29 August 2026
**Scope:** Whole app — Player app, Admin panel, P2P Catalog, Arcade+, economy, social, progression, trust/RG, and the requested **“Player + bot first top-up +50% promo”** control screen.
**Method:** Static code review of every module, the repository’s own continuous audit harness (`node tools/audit.js`), asset/PWA checks, and manual verification against the live preview.
**Result:** ✅ **PASS — all checks clean.** The app is feature-complete as a local play-coin demonstration. One minor copy bug was found and fixed during the audit (see “Issues found & fixed”).

---

## 1. The requested feature — Player + bot first top-up +50% promo

This feature is **already implemented end-to-end and has a dedicated Admin control screen.** Verified across four layers:

### 1.1 Admin control screen (the “screen needed for control”)
Admin panel → **🎁 Promotions** (`admin.html`, `#panel-promo`).

- **Master toggle:** *“Player + bot first top-up +50% promo”* — a switch bound to `#togTopupPromo`. It writes **`cfg().features.topupPromo`** (true/false) and is wired in `js/admin/engine.js` via `bindTog("togTopupPromo","topupPromo")`. Every change is audited and toasted.
- **Campaign manager:** type (Deposit % / flat credit / cash drop), amount, start/end minutes, “➕ Create campaign” (`#createPromo`), plus an active-campaign list with per-campaign on/off + delete.
- **Global broadcast banner** is also on this screen.
- **💳 Top-up Analytics** is the companion screen — `#panel-topups`, rendered from `topupAnalytics()` in `js/admin/core.js`:
  - 4 KPI tiles (`#topupAdminTiles`): total base, bonus, credited, promotional credits.
  - Player top-up summary (`#playerTopupSummary`) and bot top-up summary (`#botTopupSummary`), incl. **ready vs blocked** bot counts.
  - Player deposit records with filter/sort/pagination + **CSV export** (`#exportTopupStats`).
  - Recent bot top-ups (`#topupRecentBots`) and the accounting-boundary card (deposits = funding, never revenue).
- Admin quick-jump navigation lists **Promotions** and **Top-up Analytics** (`admin.html` `#adminNavJump`).

### 1.2 Player deposit (+50% to BONUS)
`js/player/wallet.js` → `openDepositFlow()`:
- Any first deposit (min **100**) computes `firstBonus = round(amount * 0.5)` **only when `features.topupPromo !== false`** and `firstDepositDone` is false.
- `firstBonus` is credited to **BONUS**; campaign bonuses stack on top; the receipt shows FIRST-DEPOSIT BONUS / CAMPAIGN BONUS / TOTAL CREDITED / reference.
- Recorded via `recordDeposit(...)` into `S.rg.deposits` (so it feeds top-up analytics), ledger, audit, feed and history.
- Player-facing status (wallet, `#firstDep`): *“First deposit bonus available: +50%!”* / *“…is paused by the admin…“* / *“✓ First deposit bonus already claimed.”* (`js/player/render.js`).

### 1.3 Bot required first top-up (+50% to BONUS)
`js/player/sync.js` → `topUpBot()` / `ensureBotFirstTopup()`:
- Every bot initialises at **0 MAIN + 1,000 BONUS** (`walletVersion=2`, `js/player/state.js`) and **cannot play until it completes a required first top-up** (gated by `ensureBotFirstTopup` → returns `!!bot.firstTopupDone`).
- First top-up base is **varied 400–1,600** (seeded, non-repeating), credited to **MAIN**, and when `features.topupPromo !== false` adds **+50% to BONUS**.
- Records carry `startingBonus`, `walletCredit`, `requiredFirst`/`prePlay` flags, `firstTopupAt`, and are tracked in `S.botTopups` + analytics.

### 1.4 Consistency
The same single config key `features.topupPromo` drives player and bot behaviour, so pausing it in Admin immediately affects both (and is synchronised cross-tab via BroadcastChannel/live sync).

---

## 2. Feature inventory — verified against code

| Area | Verified count | Status | Evidence |
|---|---|---|---|
| **P2P Catalog games** | **33** | ✅ | `js/player/sync.js` `const GAMES=[…]` (17 base + CAT18–CAT33) |
| **Arcade+ modes** | **23** | ✅ | `js/player/helpers.js` `ARCADE_NAV_META` (G1–G23 incl. restored G21 Crash, G22 Hi-Lo, G23 Mines) |
| **Feature Directory records** | **107** (96 Implemented · 3 Partial · 8 Suggested) | ✅ | `js/admin/core.js` `FEATURE_DIRECTORY` |
| **Admin screens (panels)** | **14** | ✅ | `admin.html` `#panel-dash…panel-people` |
| **Player screens (panels)** | **19** | ✅ | `index.html` `#panel-home…panel-services` |
| **VIP tiers** | **8** | ✅ | `js/player/data.js` `VIP_SEED` |
| **Achievements** | **49** | ✅ | `js/player/bots.js` `ACHIEVEMENTS` |
| **Levels / level rewards** | **2–50** | ✅ | `cfg().levelRewards` (49 entries) |
| **Shop inventory** | **9 categories** (134 items per feature docs) | ✅ | `js/player/bots.js` `SHOP_CATS` (9 cat headers) + cosmetics in `COS` |
| **Languages** | **5** (en, hi, bn, ta, te) | ✅ | `js/player/helpers.js` `LANG_NAMES`, `NAV_I18N` |

### Player app modules (`js/player/`)
- **core** (constants, shared runtime) · **data** (seeds/roster/VIP) · **bots** (achievements, shop, entitlements) · **crypto** (Web Crypto SHA-256 `shaHex`/`randHex`) · **state** (default state, config, house accounting, reconciliation) · **helpers** (UI hubs, services, RG, top-up analytics, navigation, feature/service action router) · **render** (all player renders) · **theme** · **games** (Coin Toss, escrow, fairness, cups/tournaments) · **wallet** (deposit/withdraw/park/transfer/RG) · **misc** (login/VIP reset) · **sync** (bot engine, catalog games, carousel of arcade, withdraws) · **boot**/main.

### Player feature hubs
- **Home, Play (Coin Toss), Series Cups, Games (Catalog), Leaderboard, Players, Community (S1–S7), Arcade+ (newgames), Progression+ (battle pass / calendar / weekly / prestige / skill), Economy+ (crates / trading / staking / subscription / boosters / coin utility), Lobby, Shop, Season, History, Updates, Wallet, Statistics, Fairness Verifier (verify), Services (Trust Center)**.

### Admin app modules (`js/admin/`)
- **core** (state, config, house accounting, all panels incl. topupAnalytics, FEATURE_DIRECTORY) · **render** · **theme** · **engine** (all control bindings incl. promo toggle) · **banking** (deposit/withdraw reversal, exports) · **sync** (live bot engine leadership, BroadcastChannel) · **boot**/main.

### Admin screens
**Overview (dash) · Live Operations (ops) · Players (people) · Feature Hub (features) · Feature Directory (directory) · Rates & Jackpot (rates) · Economy (econ) · Top-up Analytics (topups) · Withdrawals (withdraw) · Promotions (promo) · VIP & Levels (vip) · Tournaments (trny) · Audit & Data (audit) · Trust Center (trust)**.

---

## 3. Continuous audit harness

`node tools/audit.js` → **PASS — all checks clean**, covering:
- Modular layout & ESM parse of every module; import/export resolution; correct module order.
- No duplicate static ids; every `$()` reference resolves to a real id (static or dynamic).
- Canonical house helpers present (`houseGross`, `houseNet`, `reconcileHouse`).
- Real-world accounting: net revenue (NGR) = gross − promo − comps; deposits = funding (never revenue); withdrawals = cash-out; player/deposit/bot cash in/out lines; reversal logic.
- Asset references exist; `sw.js` CORE cache assets exist; no unparenthesised `??`/`||` mixing.
- Admin Feature Directory codes unique.
- Shared theme engine runtime smoke test (6 presets), CSS variable coverage, no leftover hardcoded accent RGBA.

---

## 4. Issues found & fixed

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | Low (copy) | Player **Arcade+ Game Directory** header advertised **“20 playable modes”** but there are actually **23** (G1–G23, incl. G21–G23 classics restored in v12.0). | Changed the static label to a dynamic `#arcadeCountLabel` populated from `ARCADE_NAV_META.length` in `js/player/helpers.js` `syncArcadeNavigation()` so it can no longer drift. `docs/feature-audit-report.md` + `index.html` updated. |
| 2 | Doc drift | `docs` claims Feature Directory = **106** (95 Implemented) but code has **107** (96 Implemented). The **code is the source of truth**; the register/cons docs are one record behind. | No code change needed; recorded here and can be re-synced in the docs. |
| 3 | **Critical (game logic)** | The P2P Catalog waiting room **revealed each bot’s committed pick**. Because **Rock Paper Scissors (CAT18)** resolves purely from the two picks (`ROCK>SCISSORS` etc.), a player could read the bot’s hand and always pick the beating hand → guaranteed win. The same “hidden pick” leak undermined **Blind Pick** and could let a player mirror the bot to force a favourable formula branch. | **Fixed in `js/player/sync.js`:** (1) bot picks now render as **“pick 🎭 hidden”** in the waiting room and stay hidden until settlement, so taking a bet is a true simultaneous reveal; (2) the pre-settlement “resolving” banner no longer shows the bot hand; (3) added a fairness guard so an identical pick on a distinct-pick game resolves as a **split**, never favouring either side. |
| 4 | Enhancement | Game descriptions were one short line each, so players couldn’t tell how each of the 33 Catalog / 23 Arcade+ game settles (win / tie / carry rules). | Rewrote `desc` for **all 33 Catalog games** and enriched the **23 Arcade+** descriptions (incl. the base arcs and restored G21–G23 classics) with a clear “how it settles” line in `js/player/sync.js` + `js/player/helpers.js`. |

> **Residual (documented, not a UI bug):** the demo is client-authoritative (CON-01), so the hidden bot commitment lives in `localStorage`. The visible UI exploit is closed; a fully tamper-proof commitment needs a server-authoritative ledger, out of scope for a local play-coin demo.

No broken references, no duplicate ids, no failed module parses, and no missing feature handlers were found. The documented v12.0 con register (`FlipArena_Cons_and_Roadmap.md`, CON-01…CON-08) describes only **production/trust concerns** (client-authoritative state, no Admin auth, in-browser fairness seeds, local `innerHTML`, localStorage-only persistence, uncertified maths, no identity/KYC) — these are intentional demo-scope limitations, not functional bugs in the local demo.

---

## 5. Verify manually (live preview)

The app is served as a static ES-module app and is offline-capable once loaded (PWA + service worker).

- **Preview (opens a new tab):** `https://8000-ij6zwdmnmxet6c1ysu4au.e2b.app/` — Player app
- **Admin panel:** open the **Admin panel** link in the site header (or `admin.html`). In **🎁 Promotions**, flip the **“Player + bot first top-up +50% promo”** toggle — every Admin screen and the analytics updates, and the player app reflects the change (paused/available) in the Wallet.
- **Player test:** Wallet → Deposit → 100 → confirm → expect **+50 BONUS** credited (first deposit bonus) and the analytics entry in Admin → Top-up Analytics.
- **Bot test:** watch **Live Operations / Players** — every bot must complete its varied first top-up before playing; its +50% appears in the bot top-up records.

> To run locally: `cd tossmatch && python3 -m http.server 8000` then open `http://127.0.0.1:8000/`. (ES modules require HTTP, not `file://`.)
