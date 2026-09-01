# FlipArena (TossMatch) — Play-Coin P2P Coin-Games Demo · v13.3

> **A complete, offline-capable, play-money coin-game universe built as a
> static web app:** a 19-screen player application, a 23-screen operations
> admin console, 36 proof-resolved P2P catalog games, 25 arcade modes, a live
> simulated bot economy, full house accounting — and a self-auditing toolchain
> that proves every pass clean.

This repository is the **single, cohesive result of merging five separate
workspaces** of the same website project, followed by a full-stack
modularization, an admin-alignment overhaul and a continuous audit program
(directive: [`Task_details.MD`](Task_details.MD); record:
[`doc/CLEANUP_AND_ARCHITECTURE.md`](doc/CLEANUP_AND_ARCHITECTURE.md)).

| | |
|---|---|
| **Product** | FlipArena (internally “TossMatch”) |
| **Type** | Local, offline-first **play-coin demonstration** — no real money |
| **Stack** | Vanilla HTML + CSS + **native ES modules** — no framework, **no build step** |
| **State** | Browser `localStorage` (`tossmatch_v8`) — zero servers, zero accounts |
| **Installable** | Yes — PWA (manifest + service worker, precaches every module) |
| **Deploy** | Static hosting — GitHub Pages workflow included |
| **Audit status** | **50/50 consecutive clean passes — 15,750 assertions, 0 failures** |
| **Demo admin login** | `admin` / `flip2026`, 2FA `246810` |

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Entry points](#2-entry-points)
3. [Repository layout](#3-repository-layout)
4. [The player app](#4-the-player-app)
5. [The admin console](#5-the-admin-console)
6. [Architecture](#6-architecture)
7. [Money, ledger & fairness](#7-money-ledger--fairness)
8. [Live cross-tab bot engine](#8-live-cross-tab-bot-engine)
9. [Feature history](#9-feature-history)
10. [Audit & verification](#10-audit--verification)
11. [Deploying to GitHub Pages](#11-deploying-to-github-pages)
12. [Documentation index](#12-documentation-index)
13. [Repository tooling & hygiene](#13-repository-tooling--hygiene)
14. [Disclaimer](#14-disclaimer)

---

## 1. Quick start

The app uses **native ES modules** (`<script type="module">`), so it must be
served over **HTTP(S)** — opening the HTML files via `file://` will not work
(browsers block module loading from `file://`).

**Requirements:** any modern browser; for the audit harness, Node.js 18+.

```bash
# Option A — Python (no install)
cd tossmatch
python3 -m http.server 8000
# Player app → http://127.0.0.1:8000/
# Admin console → http://127.0.0.1:8000/admin.html

# Option B — Node
npx serve tossmatch
```

Then open the player app, and open the **Admin** console from the header link
(it opens in a new tab and shares the same state). Admin demo credentials:
**admin / flip2026**, 2FA demo code **246810**.

No dependencies are needed to *run* the app. The only dependency (`jsdom`) is
for the headless audit harness:

```bash
npm i        # once — installs jsdom for the headless boot smoke
npm test     # static audit + boot smoke + feature regression suite
```

Once loaded, the app is **fully offline-capable** (service worker +
localStorage): every screen, game and admin tool works without a network.

## 2. Entry points

| What | Path | Notes |
|---|---|---|
| Repo landing page | `index.html` | Meta-refresh redirect into `tossmatch/` |
| **Player app** | `tossmatch/index.html` | 19 screens, PWA entry (`manifest.webmanifest`, `sw.js`) |
| **Admin console** | `tossmatch/admin.html` | 23 operations screens, login-gated |
| Public demo API spec | `tossmatch/api/openapi.json` | Consumed by the in-app API explorer |
| Audit harness | `tools/` | See [§10](#10-audit--verification) |
| Architecture record | `doc/CLEANUP_AND_ARCHITECTURE.md` | Cleanup register + full architecture |

Published URLs (once GitHub Pages is enabled, see [§11](#11-deploying-to-github-pages)):

- Site root: `https://kyabtao.github.io/Coinflipy/` (serves the player app)
- Admin: `https://kyabtao.github.io/Coinflipy/admin.html`

## 3. Repository layout

```text
Coinflipy/
├── index.html                  # Landing page — redirects into tossmatch/
├── tossmatch/                  # The deployable, self-contained static PWA
│   ├── index.html              #   Player application (19 screens)
│   ├── admin.html              #   Admin console (23 screens, login + RBAC)
│   ├── manifest.webmanifest    #   PWA manifest (installable, standalone)
│   ├── sw.js                   #   Service worker — precaches every js/css module
│   ├── css/
│   │   ├── player/app.css      #   Player theme + layout (gold accents)
│   │   ├── admin/app.css       #   Admin theme + command panels (purple accents)
│   │   └── shared/theme.css    #   Shared theme engine + palette UI
│   ├── js/
│   │   ├── shared/             #   runtime.js (single source of truth), theme.js,
│   │   │                       #   money.js (safe money/ledger), progress.js
│   │   ├── player/             #   core, data, bots, crypto, state, helpers,
│   │   │                       #   render, theme, games, wallet, misc, sync,
│   │   │                       #   boot, catalog100, arcade100 + main.js entry
│   │   └── admin/              #   core, render, theme, engine, banking, plus,
│   │                           #   sync, boot + main.js entry
│   ├── src/                    #   Design-system layer
│   │   ├── components/         #     Atomic factories: button, card, modal, badge, input
│   │   ├── css/variables.css   #     Design tokens (colors, spacing, radii, shadows)
│   │   ├── js/utils/           #     math (subunit money), format, sanitize
│   │   ├── js/{api,state}, js/{render,sync}.js, pages/
│   ├── api/openapi.json        #   Demo API specification for the API explorer
│   ├── icons/                  #   favicon + PWA icons (192/512, png/jpg)
│   ├── img/                    #   Photographic coin (heads/tails) + logo assets
│   └── docs/                   #   The consolidated documentation set + audit logs
│       └── legacy/             #   Historical documents from the source archives
├── tools/                      #   Audit harness (see §10)
├── doc/                        #   CLEANUP_AND_ARCHITECTURE.md (deletion register,
│                               #   component catalog, integration, ledger audit)
├── .github/workflows/          #   GitHub Pages deploy workflow
├── _config.yml                 #   Keeps tools/doc out of branch-based Pages builds
├── package.json                #   ESM, jsdom dev dependency, npm scripts
├── Task_details.MD             #   The original full-stack refactor directive
├── PR_BODY.md                  #   Record of the Phases 2–6 pull request
└── SECURITY.md                 #   GitHub security-policy template
```

**Naming note:** the original project brief targets `views/`, `src/` and
`assets/` at the repository root. In this unified layout `views/player.html`
is `tossmatch/index.html`, `views/admin.html` is `tossmatch/admin.html`, and
`assets/` maps to `tossmatch/icons/` + `tossmatch/img/`. They were
intentionally **not** renamed so the published Pages URLs keep working.

## 4. The player app

`tossmatch/index.html` — 19 grouped screens under collapsible navigation
(🏠 Home · 🎮 Play · 🤝 Community · 📈 Progress & Economy · ⚙️ Account), with
live badges, a Recent row, search-that-flattens-groups, a global command
palette (Ctrl/⌘+K) and a mobile dock.

| Area | What’s inside |
|---|---|
| **Coin Toss (flagship)** | Escrowed P2P flips with commit–reveal provable fairness, manual take, auto-match, bot-vs-bot, Auto Bet with session stop, 1000× Turbo, house fee, jackpot hook |
| **36 P2P catalog games** | RPS Duel, Closest to 21, Dice Sum Duel, Territory Capture, Poker High, Byte War, Sum of Four, High Card Duel, … — every one with waiting-room escrow, per-game history, carry/split rules and 3-party merged-hash proofs |
| **25 Arcade+ modes** | Crash, Hi-Lo, Mines, Plinko, Mini Slots, Keno, Bingo, Roulette (16-pocket proof wheel), Blackjack (one-shot), Mystery Vault, … — proof-driven, wallet-settled, bot-played |
| **Series Cups & Tournaments** | Bo3/Bo5/Bo7/Advantage cups (incl. unattended bot-vs-bot), bot-filled brackets, VIP entry discounts, 75/25 prize splits |
| **Wallet** | Segmented MAIN / BONUS / REFERRAL / RAKEBACK / BANK balances, escrow, transfers & gifting with caps, deposits, withdrawals, vault |
| **Social hub** | Friends, private rooms, profiles, spectator mode, gifting, lobby chat, clans, leaderboard & roster (filter/sort/paginate), **event calendar** with persisted reminders, **support tab** (tickets + platform messages) |
| **Progression** | 8 VIP tiers with monthly reset, 49 achievements, level rewards to 50, quests, season pass, Prestige, 12 career milestones |
| **Economy+** | Shop (130+ cosmetics incl. the legendary **Photoreal coin skin** from real coin photography), cosmetic crafting, **auction house** (3 weekly lots, autonomous bot bidding, 10% hammer fee to the house), event tickets, clan treasury, private-room upgrades, referrals |
| **Trust & safety** | Verifier (fairness proofs), anti-cheat scans, RG toolkit (deposit/session limits, reality checks, cool-off, durable self-exclusion), accessibility center (contrast, motion, text scale, colour-vision presets) |
| **Platform** | 5 languages (EN/HI/BN/TA/TE), customizable Home dashboard, saved bet presets, smart game discovery, notifications demo, TOTP demo, monthly statements, in-app public API explorer, **Privacy tab** (download/erase my data), PWA install |

## 5. The admin console

`tossmatch/admin.html` — a real-world-style operations console, gated by
sign-in and role-based access.

**Access control**

- **Login gate** — session overlay, demo credentials `admin` / `flip2026`,
  2FA demo code `246810`; sessions persist per tab (`sessionStorage`).
- **RBAC roles** — Super Admin (all 23 screens), Finance, Operations,
  Support; out-of-scope screens are hidden and redirects are enforced.

**The screens** (grouped ⌁ Command · 💹 Commercial · 🎯 Engagement · 🛡️ Governance):

| Group | Screens |
|---|---|
| Command | Overview · Live Ops (bot engine status) · Players (directory, freeze/unfreeze, credit/debit, bet history, session monitor) · Feature Hub · Feature Directory (100+ records) · Reports & Analytics |
| Commercial | Rates & Jackpot (stake bounds, payout cap, house edge, animation speed) · Economy · **Revenue** (fund-source register, NGR reconciliation, CSV/JSON exports) · Top-ups & Deposits (unified players+bots) · Withdrawals (unified ledger, triggers, “process eligible now”) · Promotions · Referrals |
| Engagement | VIP & Levels · Tournaments · Games & Content (per-game enable/disable) · Announcements |
| Governance | Audit & Data · Trust Center · Approvals (KYC queue, flag triage, exclusions) · Support & Messaging · Compliance & Privacy (checksummed reports, data export/erasure) · Settings (house economics, roles, maintenance mode, admin users, backups, factory reset) |

Live nav badges (pending KYC, cash-out triggers, active campaigns, open
tickets) refresh on every tick, and every sensitive action is written to the
audit log.

## 6. Architecture

- **Native ES modules, no build.** Two HTML shells load `js/player/main.js`
  and `js/admin/main.js`, which import their modules in a verified execution
  order. Cross-module mutable state lives on a shared runtime on `globalThis`;
  top-level wiring is deferred into per-module `bind()` calls so evaluation
  order can’t change behavior.
- **Targeted rendering.** `renderChrome()` (header/wallet/jackpot),
  `renderTab(tab)` (only the active tab’s widgets), `renderTick()` (chrome +
  active tab, used by background bot ticks) and full `render()`. A shared
  structure-aware DOM patcher (`patchHTML` / `withPatchedDom`) merges
  background-tick writes in place — **no screen shake, no lost focus or
  scroll** on any of the 42 screens.
- **Shared design system.** `src/components/*` are dependency-free factories
  (button, card, modal, badge, input) and `src/css/variables.css` holds the
  design tokens; both apps’ styles anchor to `--gold` / `--purple` RGB tokens
  driving the theme engine (6 presets + custom palette editor).
- **Human labels only.** Zero internal spec codes appear in the UI — the
  audit fails the build if one is reintroduced. Every form control carries an
  accessible name.
- **Offline PWA.** The service worker precaches all 49 files derived from the
  real import graph (the audit derives the same graph, so the list cannot
  silently drift).

## 7. Money, ledger & fairness

- **Safe integer math.** Money is computed in **integer subunits**
  (1 coin = 100 subunits) in `js/shared/money.js` over
  `src/js/utils/math.js`. Percentages/multipliers are integer-scaled and
  rounded **exactly once** at the coin boundary (the harness caught a real
  double-rounding bug: `92 × 3.8% = 3.496` becoming `4` instead of `3`).
- **Single movement path.** Every coin movement — escrow, refunds, settlement,
  shop spends, deposits, withdrawals, vault moves, transfers, admin
  adjustments — goes through `debitWallet()` / `creditWallet()` /
  `debitBot()` / `creditBot()`.
- **Invariants.** `ledgerAudit()` asserts: finite non-negative whole-coin
  balances everywhere; escrow splits conserve; no duplicate settled game ids;
  well-formed ledger rows; non-negative jackpot pool; and the reconciliation
  formula **`net = gross − (promo + comps + rakeback + referral)`**.
  `enforceWalletInvariants()` repairs drift on boot and every reconcile.
- **Concurrency.** `withWalletLock()` serialises every wallet-critical
  section, so rapid clicks and overlapping bot ticks can never double-spend
  (verified: 200 concurrent stakes against one wallet → exactly 50 succeed).
- **Revenue fund-source register.** Every source is classified REVENUE /
  COST / FUNDING / CASH-OUT / LIABILITY with an NGR total — surfaced in the
  Revenue screen, P&L rows, simulator, and CSV exports with a Treatment
  column.
- **Provable fairness (demo).** 3-party merged-hash proofs (commit before,
  reveal after) resolve every catalog/arcade game; the player-side verifier
  re-checks them locally.

## 8. Live cross-tab bot engine

- `localStorage` key **`tossmatch_v8`** is the shared store; Admin listens for
  `storage` events and repaints via `renderAdminTick()`.
- `BroadcastChannel` **`tossmatch_bot_live_v1`** carries engine pulses: a
  visible Admin tab pulses every 1.8 s and hidden Player instances run full
  bot ticks in response (bypassing throttled hidden-tab timers).
- A 6-second leader lock (**`tossmatch_bot_leader_v1`**) guarantees exactly
  one simulating instance; `applyingRemoteState` guards prevent save/render
  feedback loops.
- Bots have real economies: 0 MAIN + 1,000 BONUS start, a mandatory first
  top-up (400–1,600, +50% promo) before play, low-balance top-ups, personal
  3,000–5,000 MAIN cash-out triggers, withdrawals that count as coin sinks and
  deduct from house revenue — plus autonomous auction bidding, gifting, chat,
  clans and arcade play.

## 9. Feature history

### The five-way unification (v11.0–v12.0)

| # | Source workspace | Contents | Fate in the unified project |
|---|---|---|---|
| 1 | `workspace-01a02c10…` | Original `toss-bet` spec set: business rules, games catalog, feature list/JSON, roadmap, 4 cons audits, system docs, demos | Spec absorbed into the unified docs; demos superseded and purged in v13.0 |
| 2 | `workspace-01a02ef9…` | Early `tossmatch-demo.html` + `tossmatch-admin.html` + spec uploads | Superseded by the unified player/admin apps; purged in v13.0 |
| 3 | `workspace-01a02f89…` | `combined-v1` merged single-file app + spec uploads | Historical intermediate version; purged in v13.0 |
| 4 | `workspace-01a03733…` | **Modular redesign**: split css/js, real coin/logo photographs, icon set, docs PDF | Unique features **ported in** (bot withdrawals, player directory, coin photography); assets became the shared `img/` + `icons/` |
| 5 | `workspace-01a03749…` | **TossMatch v10.8** single-file player app + 12-screen admin + full documentation set + `api/openapi.json` | **Functional base** of the unified project |

The source archives were removed from the working tree in the v13.0 cleanup
(29 paths, ~7.9 MB, all itemised in `doc/CLEANUP_AND_ARCHITECTURE.md`) and
remain reachable in Git history.

### Release line

| Release | Headline |
|---|---|
| v8.x → v9.x | VIP tiers; 23 B1–B4 social/game/progression/economy features; premium UI + admin command center; history & statistics; accessibility nav & mobile dock |
| v9.8–v9.9 | 12 catalog + 10 arcade promotions to playable; Trust Center, RG toolkit, PWA, languages, API explorer |
| v10.x | Command palettes; accessibility center, dashboard customization, presets, recommendations; top-up analytics; live admin bot sync; required bot first top-ups; 0+1,000 bot wallets |
| **v11.0** | **Unified merge** — bot withdrawal economy, Admin Player Directory, Crash/Hi-Lo/Mines restored, photoreal coin skin; 106 directory records |
| **v12.0** | **Modular code structure** — native ES modules, split CSS, shared runtime/theme, SW precache of every module |
| **v13.0** | **Admin alignment + ledger audit + cleanup** — safe money math, invariants, revenue dashboard, human labels, targeted rendering, component library, 29-path purge; +3 catalog games (36), +2 arcade modes (25), event calendar, career milestones, auction house, nav redesign, real-world Admin console |
| v13.1 | All-page stability (DOM patcher), unified top-up/withdrawal tables, **+4 screens** (Reports, Games & Content, Referrals, Announcements) |
| v13.2 | Support & Messaging (two-way tickets), admin user management, backup & restore (5 snapshots) |
| v13.3 | Compliance & Privacy screen (checksummed reports), player data portability & erasure — **23 admin screens** |
| v13.0.1 | Palette modal restored, offline precache completed (49 files), 105 accessible names added, reproducible npm tooling |

Full detail: [`tossmatch/docs/CHANGELOG.md`](tossmatch/docs/CHANGELOG.md) and
[`tossmatch/docs/TossMatch_v13.0_Release_Notes.md`](tossmatch/docs/TossMatch_v13.0_Release_Notes.md).

## 10. Audit & verification

Every part of the project is verified by the harness in `tools/`. One command
runs the whole stack — static audit, headless boot smoke and the feature
regression suite — 50 consecutive times, and every pass must be clean:

```bash
npm i                          # once — installs jsdom for the headless boot smoke
npm test                       # one pass: audit + boot smoke + feature suite
bash tools/run-audit-loop.sh 50
```

| Harness | What it proves |
|---|---|
| `tools/audit.js` | Module graph + ESM parse, DOM ids, assets, service-worker precache completeness (derived from the real import graph), JS hygiene, accessible names on every form control, human labels, targeted rendering, component wiring, Admin ↔ Player alignment, repository hygiene |
| `tools/boot-smoke.mjs` | Both apps boot headlessly in jsdom: all 19 player tabs and 23 admin screens paint, tabs swap without errors, a bet settles, the theme palette works end to end, zero console output |
| `tools/ledger-simulation.mjs` | Safe integer money math (20,000 pots, 0 drift), escrow conservation (5,000 round-trips), concurrency/double-spend (200 concurrent stakes), ledger invariants, reconciliation across 2,000 randomized houses |
| `tools/test-new-features.mjs` | 104 checks — catalog/arcade games, calendar, milestones, auctions, nav, RBAC, KYC, support flow, referrals, announcements, backups, compliance reports, privacy export/erasure |

Latest run: **50/50 clean passes — 315 checks per pass — 15,750 assertions,
0 failures** (log: `tossmatch/docs/audit-loop-v13.0.log`,
`RESULT: 50/50 clean — audit satisfied.`).

npm scripts: `npm run audit` · `npm run smoke` · `npm test` ·
`npm run audit:loop`.

## 11. Deploying to GitHub Pages

The app is static HTML with **no build step**, and this repository now ships a
ready-made workflow (`.github/workflows/deploy-pages.yml`) that publishes
`tossmatch/` as the site root. To enable it:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — the `Deploy GitHub Pages`
   action checks out the repo and uploads `tossmatch/` as the Pages artifact.

GitHub then serves:

- Player: `https://kyabtao.github.io/Coinflipy/`
- Admin: `https://kyabtao.github.io/Coinflipy/admin.html`

All paths in the app, manifest and service worker are **relative**, so they
work under the project-site base URL. A `.nojekyll` file keeps module paths
untouched.

<details>
<summary>Alternative: branch-based deployment (serve the whole repository)</summary>

1. **Settings → Pages → Source → Deploy from a branch**.
2. Branch **main**, folder **/** (root), **Save**.
3. `https://kyabtao.github.io/Coinflipy/` runs the root `index.html`, which
   redirects into `tossmatch/`; direct URLs are `…/tossmatch/` and
   `…/tossmatch/admin.html`.

`_config.yml` excludes `tools/`, `doc/`, `.git/` and `.github/` from the
Jekyll build so only the site ships.

</details>

## 12. Documentation index

| Document | Contents |
|---|---|
| [`doc/CLEANUP_AND_ARCHITECTURE.md`](doc/CLEANUP_AND_ARCHITECTURE.md) | Repository map, 29-path deletion register, component catalog, Admin ↔ Player integration, ledger audit, audit confirmation |
| [`tossmatch/docs/CHANGELOG.md`](tossmatch/docs/CHANGELOG.md) | Full version history v8.2 → v13.3 |
| [`tossmatch/docs/TossMatch_v13.0_Release_Notes.md`](tossmatch/docs/TossMatch_v13.0_Release_Notes.md) | v13.0–v13.3 feature detail and verification results |
| [`tossmatch/docs/TossMatch_Complete_Feature_and_Rules_Specification.md`](tossmatch/docs/TossMatch_Complete_Feature_and_Rules_Specification.md) | Authoritative feature & rules specification |
| [`tossmatch/docs/TossMatch_Feature_Register.md`](tossmatch/docs/TossMatch_Feature_Register.md) | Feature-by-feature status register (100+ records) |
| [`tossmatch/docs/TossMatch_Cons_and_Roadmap.md`](tossmatch/docs/TossMatch_Cons_and_Roadmap.md) | Prioritised cons/risks (client-authoritative state, production trust gaps) and the production roadmap |
| [`tossmatch/docs/TossMatch_Audit_Report.md`](tossmatch/docs/TossMatch_Audit_Report.md) | v11.0 unified-merge audit report |
| [`tossmatch/docs/MERGE_REPORT.md`](tossmatch/docs/MERGE_REPORT.md) | Five-workspace merge record |
| [`tossmatch/docs/feature-audit-report.md`](tossmatch/docs/feature-audit-report.md) | Feature-level audit evidence |
| [`tossmatch/docs/github-pages-workflow.md`](tossmatch/docs/github-pages-workflow.md) | Pages deployment guide |
| `tossmatch/docs/TossMatch_Project_Documentation.{pdf,docx}` | Full project documentation (Appendices V–Z) |
| `tossmatch/docs/audit-loop-v{11,12,13}.0.log` | Raw audit-loop evidence |
| [`tossmatch/docs/legacy/`](tossmatch/docs/legacy/) | Historical pre-merge documents, preserved |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting policy (template) |
| [`Task_details.MD`](Task_details.MD) | The original autonomous refactor & audit directive |
| [`PR_BODY.md`](PR_BODY.md) | The Phases 2–6 pull-request record |

## 13. Repository tooling & hygiene

- `package.json` — `"type": "module"`, single dev dependency (`jsdom`), and
  the reproducible scripts above (`npm i` is enough to set up the harness).
- `.gitignore` — `node_modules/`, `.DS_Store`, `*.log` (audit logs under
  `tossmatch/docs/` are force-kept as release evidence).
- `.nojekyll` inside `tossmatch/` — GitHub Pages serves module files as-is.

## 14. Disclaimer

> **Play coins only.** This is a local demonstration — not a payment, gambling
> or fairness service, and it intentionally keeps everything client-side.
> Real-money operation would require server-authoritative settlement,
> licensing, KYC/AML, certified randomness, security hardening and legal
> counsel — see the production boundaries in
> [`tossmatch/docs/TossMatch_Cons_and_Roadmap.md`](tossmatch/docs/TossMatch_Cons_and_Roadmap.md)
> and the Feature Register.
