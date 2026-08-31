# Cleanup & Architecture — FlipArena v13.0

This document records the **Phase 1–6** modernisation of the Coinflipy /
FlipArena play-coin demo: the modular architecture, the reusable component
library, the Admin ↔ Player integration, the ledger and revenue audit, the
20-pass continuous audit confirmation and the complete register of files
deleted during the cleanup sweep.

Everything described here is verified automatically on every run of

```bash
npm i                          # once — installs jsdom for the headless boot smoke
bash tools/run-audit-loop.sh 50
```

| Harness | What it proves | Command |
|---|---|---|
| `tools/audit.js` | module graph + ESM parse, DOM ids, assets, service-worker precache completeness, JS hygiene, accessible names on every form control, human labels, targeted rendering, component wiring, Admin ↔ Player alignment, repository hygiene | `node tools/audit.js` |
| `tools/ledger-simulation.mjs` | safe integer math, escrow conservation, concurrency/double-spend, ledger invariants, reconciliation formula | `node tools/ledger-simulation.mjs` |
| `tools/boot-smoke.mjs` | both apps boot headlessly, every screen paints, tabs swap without errors, a bet settles, the theme palette works end to end, Admin screens (including Revenue) render, zero console output | `node tools/boot-smoke.mjs` |
| `tools/test-new-features.mjs` | catalog/arcade games, hubs, economy, privacy and persistence flows | `node tools/test-new-features.mjs` |

---

## 1. Repository map

The deployable application lives in `tossmatch/` (GitHub Pages serves it from
the repository root, with `index.html` redirecting into it). Inside it the
tree follows the target architecture:

```text
tossmatch/
├── index.html              # views/player.html — player page skeleton
├── admin.html              # views/admin.html — admin dashboard
├── icons/, img/            # assets — favicons, PWA icons, photographic coin/logo art
├── css/
│   ├── player/app.css      # player theme + layout (gold accents)
│   ├── admin/app.css       # admin theme + command panels (purple accents)
│   └── shared/theme.css    # shared theme engine + palette UI
├── js/
│   ├── shared/
│   │   ├── runtime.js      # shared runtime state (single source of truth)
│   │   ├── theme.js        # shared theme engine
│   │   └── money.js        # safe money math, wallet invariants, ledger audit
│   ├── player/…            # state, data, bots, crypto, helpers, render,
│   │                       # theme, games, wallet, misc, sync, boot
│   └── admin/…             # core, render, theme, engine, banking, sync, boot
├── src/
│   ├── components/         # atomic UI components (button, card, modal, badge, input)
│   ├── css/variables.css   # design tokens linked by both pages
│   ├── js/utils/math.js    # subunit money primitives (+ format/sanitize utilities)
│   └── pages/, js/render.js, js/sync.js, js/api/, js/state/  # design-system layer
└── docs/                   # active documentation + audit logs
doc/                        # this cleanup & architecture record
tools/                      # audit harnesses
```

`views/player.html` and `views/admin.html` are `tossmatch/index.html` and
`tossmatch/admin.html`; `assets/` maps to `tossmatch/icons/` and
`tossmatch/img/`. They were intentionally **not** renamed so the published
Pages URLs (`…/Coinflipy/tossmatch/`, `…/Coinflipy/tossmatch/admin.html`) keep
working.

---

## 2. Deleted files register

Every path below was unreferenced, superseded or duplicated. All remain
reachable through Git history.

| Path | Kind | Reason for deletion |
|---|---|---|
|`old data/workspace-01a02c10-b8b9-79f3-bb0a-5a88849c9eec.zip`|file|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`old data/workspace-01a02ef9-0fa6-7b77-a302-bd36e3b7210a.zip`|file|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`old data/workspace-01a02f89-5928-79f1-982b-76e3ad367d03.zip`|file|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`old data/workspace-01a03733-364e-7d37-8722-7a82f942c98d.zip`|file|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`old data/workspace-01a03749-8933-7d78-aad5-35c16657d368.zip`|file|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`old data`|dir|Source workspace archives (7.9 MB) — their content was merged into the unified app in v11.0/v12.0; retained in Git history.|
|`tossmatch/docs/legacy/combined-v1-clean.html`|file|Historical intermediate single-file build; superseded by the modular ES-module app.|
|`tossmatch/docs/legacy/combined-v1.html`|file|Historical intermediate single-file build; superseded by the modular ES-module app.|
|`tossmatch/docs/legacy/toss-bet-business-rules.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-cons-audit-1.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-cons-audit-2.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-cons-audit-3.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-cons-audit-4.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-demo.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-features-categories.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-features.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-features.json`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-full.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-games-catalog.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-roadmap-v1.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-roadmap.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/toss-bet-v5.html`|file|Superseded single-file prototype from the pre-merge `toss-bet` spec set; the unified player/admin apps replace it.|
|`tossmatch/docs/legacy/tossmatch-admin.html`|file|Early single-file admin page; superseded by `tossmatch/admin.html`.|
|`tossmatch/docs/legacy/tossmatch-demo-v1.html`|file|Early single-file demo of the player app; superseded by `tossmatch/index.html`.|
|`tossmatch/docs/legacy/tossmatch-demo.html`|file|Early single-file demo of the player app; superseded by `tossmatch/index.html`.|
|`tossmatch/src/css/reset.css`|file|Unreferenced legacy asset.|
|`tossmatch/src/css/global.css`|file|Unreferenced legacy asset.|
|`tossmatch/src/css/player/app.css`|file|Unreferenced legacy asset.|
|`tossmatch/src/css/admin/app.css`|file|Unreferenced legacy asset.|

Net effect: **29 paths / ~7.9 MB** removed from the working tree, and every
remaining file is either linked by a page, imported by a module, or part of the
active documentation set.

---

## 3. Component catalog

`src/components/*` are dependency-free factories (no framework, no build step).
They are used by the Admin Revenue dashboard and available to any page.

### 3.1 Button — `src/components/button/button.js`

```js
import { createButton, createChip, createIconButton, createToggle }
  from "../src/components/button/button.js";

const save = createButton({
  label: "Save rates", variant: "primary", size: "sm", icon: "💾",
  onclick: () => saveRates()
});
save.disabled = true;                       // disabled state
createButton({ label: "Working…", loading: true });   // loading state
createChip({ value: 250, active: stake === 250, onclick: () => setStake(250) });
```

Variants: `primary`, `secondary`, `accent`, `danger`, `ghost`, `gold`, `green`,
`purple`. Sizes: `sm`, `md`, `lg`. States: `disabled`, `loading`.

### 3.2 Card — `src/components/card/card.js`

```js
import { createCard, createStatTile, createStatGrid, createKVRow }
  from "../src/components/card/card.js";

host.appendChild(createStatGrid([
  { icon: "🎯", value: "1,20,400", label: "Lifetime wagered volume", color: "blue" },
  { icon: "💰", value: "9,410",    label: "Net platform profit",     color: "green" },
]));
const card = createCard({ title: "📦 Exportable transaction logs", premium: true });
```

### 3.3 Modal — `src/components/modal/modal.js`

`createModal({ title, body, actions })`, `showAlert()`, `showConfirm()` and
`showToast()` wrap the existing `.modal-bg` / toast markup so any module can
raise a dialog without duplicating HTML.

### 3.4 Badge — `src/components/badge/badge.js`

`createBadge({ text, variant, pulse })`, `createLiveBadge()`,
`createResultBadge(result)`, `createVipBadge({ tier, name })`,
`createBalanceChip({ label, amount })`. Variants: `on`, `off`, `warn`,
`danger`, `info`, `gold`, `purple`.

### 3.5 Input — `src/components/input/input.js`

`createNumberInput({ value, min, max, step, onchange })` (with −/+ steppers),
`createBetSelector({ presets, value, min, max })`, `createSideSelector()`,
`createSearchInput()`, `createToggleButton()`.

### 3.6 Utilities — `src/js/utils/`

* `math.js` — **subunit money primitives** (`SUBUNIT`, `toSubunits`,
  `fromSubunits`, `pctOfSubunits`, `allocateSubunits`, `roundCoin`,
  `nonNegativeCoin`) plus statistical/formatting helpers. Imported by
  `js/shared/money.js`, so it is live production code, not a sample.
* `format.js` — Indian-locale currency, durations, time-ago.
* `sanitize.js` — username / taunt / stake / room-code validation.

---

## 4. Admin ↔ Player integration

### 4.1 Mirrored controls (Admin writes, Player reads)

| Admin control (`Rates & Jackpot → Game parameters`) | Player effect |
|---|---|
| Minimum stake | `checkGuards()` rejects smaller stakes (`cfg().stakeMin`) |
| Maximum stake ceiling | `maxStake()` clamps the level curve (`cfg().stakeMax`) |
| Payout cap per game | Caps arcade payouts in `settleGameWin()` and coin-toss payouts in `settleFlip()` |
| House edge (%) | `houseEdge()` derives the arcade return-to-player (`cfg().edgePct`) |
| Flip animation (ms) | `animateFlip()` uses the override (`cfg().animMs`) |
| Auto Bet default stop | Player Auto Bet threshold |

Pre-existing mirrored controls (fee rates, jackpot configuration, feature
toggles, VIP table, level rewards, promotions and the broadcast banner) were
retained.

### 4.2 Player management

* **Live session monitor** (`Rates & Jackpot`) — balances, career net, open
  escrowed bets, frozen counters, last session sample and last ledger movement.
* **Freeze / unfreeze** — the demo player account (`S.frozen.you`) and every
  simulated player (`bot.frozen`). Frozen simulated players are excluded from
  `readyBotPool()`, bot-vs-bot games, transfers and shop activity; a frozen demo
  player is blocked in `checkGuards()`.
* **Manual credit / debit** — Admin wallet adjustment through
  `creditWallet()` / `debitWallet()` with the zero-negative invariant.
* **Per-player bet history** — the record inspector drawer merges coin-toss
  history and P2P/catalog history for the selected player.
* **Player directory** — searchable, sortable, paginated roster.

### 4.3 Real-time synchronisation hooks

* `localStorage` (`tossmatch_v8`) is the shared store; the Admin listens for
  `storage` events and repaints through `renderAdminTick()`.
* `BroadcastChannel` (`tossmatch_bot_live_v1`) carries bot-engine pulses and
  player-alive heartbeats, so the bot engine keeps running while Admin is open.
* `applyingRemoteState` guards prevent save/refresh feedback loops.

### 4.4 Targeted rendering

| Handler | Scope |
|---|---|
| `renderChrome()` | header, wallet chip, jackpot ticker, toggles, coin/theme state |
| `renderTab(tab)` | only the widgets owned by that tab (`TAB_RENDERERS` map) |
| `renderTick()` | `renderChrome()` + `renderTab(activeTab)` — used by background bot ticks |
| `render()` | full boot: chrome, every tab, hub mounting, theme, accessibility |

The tab click handler sets `activeTab` and calls `renderTab()` (player) or
`renderAdminTab()` (admin) instead of a monolithic repaint; background ticks
route through `renderTick()`, so hidden panels and half-typed inputs survive.
`renderChrome()` resolves elements through a guarding `el()` helper that warns
instead of throwing if an id has not mounted yet.

---

## 5. Ledger & revenue audit

### 5.1 Safe integer math

Money is computed in **integer subunits** (1 coin = 100 subunits) inside
`js/shared/money.js`, which wraps `src/js/utils/math.js`. Percentages and
multipliers are scaled to integers and **rounded exactly once** at the coin
boundary — rounding twice (subunits, then coins) turned `92 × 3.8% = 3.496`
into `4` instead of `3`, which the simulation caught and fixed.

```js
pct(pot, cfg().feePct)   // integer-scaled, single round, half-up
sub(pot, fee)            // whole-coin subtraction
allocate(pot, [1, 1])    // splits never lose or invent a coin
```

Coin-toss settlement, P2P/catalog settlement, escrow, refunds, shop spends,
deposits, withdrawals, vault moves, peer transfers and Admin adjustments all
route through `debitWallet()` / `creditWallet()` / `debitBot()` / `creditBot()`.

### 5.2 Ledger invariants

`ledgerAudit()` (shared by the Admin Revenue screen and the audit harness)
asserts:

1. every wallet segment is a finite, non-negative, whole number of coins;
2. every simulated player wallet obeys the zero-negative rule;
3. the jackpot pool is non-negative;
4. **Net platform profit = Gross revenue − Promotional cost − Comps**;
5. **Gross revenue = Coin Toss fees + P2P fees + Cup rakes + Tournament rakes + Shop + Transfer fees**;
6. taps (coins created) and sinks (coins removed) are non-negative;
7. every open bet's escrow split still adds up to its stake;
8. no duplicate settled game ids (double-settlement detection);
9. ledger rows are well formed (finite timestamp, delta, balance).

`enforceWalletInvariants()` repairs drift (negative or fractional balances) and
runs on player boot and on every `reconcileHouse()`.

### 5.3 Concurrency

`withWalletLock(fn)` serialises every wallet-critical section through a promise
queue, so rapid clicks, bot ticks and cross-tab events can never observe the
same starting balance. Escrow is validated in full **before** any segment is
debited, and a failed MAIN-balance check no longer silently consumes bonus
funds.

### 5.4 Simulation results (`tools/ledger-simulation.mjs`)

| Check | Result |
|---|---|
| Subunit percentage math vs exact integer arithmetic — 20,000 pots | 0 drift |
| Fractional inputs round half-up to whole coins (`0.1, 0.7, 1.005, 2.675, 33.333, 999.999`) | `0, 1, 1, 3, 33, 1000` |
| Allocation of 100 across three weights | `34 + 33 + 33 = 100` |
| 5,000 escrow + refund round-trips | every segment conserved exactly |
| Debit larger than balance | rejected, balance untouched |
| 200 concurrent 100-coin stakes against a 5,000-coin wallet | exactly 50 succeed, 0 negative balances, remainder 0 |
| Clean state passes all invariants | pass |
| Negative wallet / negative bot balance / bad escrow split / duplicate game id | each detected |
| Invariant repair | no-op when healthy, clamps drift to zero |
| `net = gross − promo − comps` across 2,000 randomised houses | 0 failures |
| Transaction log / series / chart | wagers, payouts, fees merged; 14 labelled buckets; accessible SVG |

### 5.5 Admin Revenue dashboard

New **Commercial → Revenue** screen:

* tiles — lifetime wagered volume, gross revenue, net platform profit, promo +
  comps (built with `createStatGrid`);
* daily (14 buckets) and weekly (8 buckets) volume and revenue charts rendered
  as inline, accessible SVG (`revenueChartSVG`);
* reconciliation panel stating and verifying the NGR formula, cash-in / cash-out
  and the live invariant verdict;
* exports — **transaction log CSV**, **transaction log JSON** (with
  reconciliation + volume metadata) and a **revenue summary CSV**.

---

## 6. Human labels (zero user-visible internal codes)

* Feature Directory cards show the human **category** badge (`${x.cat}`)
  instead of the internal code, and the search index matches only name,
  description, category and status.
* Release grids, hub headings, arcade/catalog quick-jump options, command
  palette descriptions and the Admin game lists no longer print `B1–B4`,
  `UX1–UX4`, `G21–G23`, `CAT18–CAT33`, `E6–E9` or `S1–S7`.
* `.code` now survives only as an internal data-model key, plus private-room
  invite codes — both explicitly allowed by the audit.
* Navigation was redesigned with icon chips (🏠 🎮 🤝 📈 ⚙️ player;
  ⌁ 💹 🎯 🛡️ admin), gold/purple active accent bars with glow, a gradient
  header hairline, hover polish on cards/buttons/toasts, `:focus-visible`
  outlines, and `min-width` guards so group labels stay hidden on the horizontal
  mobile tab bar.

---

## 7. Audit confirmation

**20 consecutive clean passes completed — 0 defects, 0 remaining feature
additions.**

* Log: `tossmatch/docs/audit-loop-v13.0.log`
* Command: `bash tools/run-audit-loop.sh 20`
* Date: 2026-08-29
* Result line: `RESULT: 20/20 clean — audit satisfied.`
* Coverage: **157 checks per pass · 3,140 assertions across the run · 0 failures**
  (static/hygiene audit, ledger & concurrency simulation, headless boot smoke).

Per-round checkpoints satisfied on every pass:

1. zero runtime console errors, missing assets or broken module imports;
2. uniform rendering/styling of the reusable components across both views;
3. complete elimination of user-visible internal codes;
4. `renderTab()` / `renderTick()` isolate DOM changes (verified by comparing an
   inactive panel's HTML before and after a tick);
5. simulated concurrent betting cycles show zero ledger drift and exact
   integer arithmetic;
6. Admin changes (stake bounds, payout cap, house edge, animation speed,
   freeze/unfreeze) are read by the player app from shared state;
7. repository hygiene — every path in the deletion register is gone.
