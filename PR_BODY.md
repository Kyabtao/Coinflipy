## Summary

Completes the remaining phases of the Coinflipy/FlipArena refactor directive in
`Task_details.MD`: **Phase 2** (Admin ↔ Player alignment), **Phase 3** (revenue,
ledger & transaction audit), **Phase 4** (humanization + targeted rendering),
**Phase 5** (20-pass continuous audit) and **Phase 6** (legacy deletion +
`doc/` documentation).

Full record: **`doc/CLEANUP_AND_ARCHITECTURE.md`**.

### Phase 3 — Ledger, revenue & transaction audit

* New shared module `js/shared/money.js` on top of the `src/js/utils/math.js`
  subunit primitives. Percentages and multipliers are integer-scaled and rounded
  **exactly once** at the coin boundary (a real double-rounding bug — `92 × 3.8%`
  becoming `4` instead of `3` — was caught by the new simulation and fixed).
* All coin movement (escrow, refund, settlement, shop spends, deposits,
  withdrawals, vault moves, transfers, Admin adjustments) goes through
  `debitWallet()` / `creditWallet()` / `debitBot()` / `creditBot()`.
* `ledgerAudit()` asserts non-negative whole-coin balances, escrow integrity,
  duplicate-settlement detection, well-formed rows and
  `net profit = gross revenue − promo − comps`; `enforceWalletInvariants()`
  repairs drift on boot and every reconcile.
* `withWalletLock()` serialises wallet-critical sections (double-click /
  rapid-click double-spend protection).

### Phase 2 — Admin ↔ Player alignment

* **Game parameters** (Rates & Jackpot): minimum stake, stake ceiling, payout
  cap, house edge, flip animation speed and Auto Bet stop — read live by the
  player app (`checkGuards`, `maxStake`, `settleFlip`, `settleGameWin`,
  `animateFlip`, `houseEdge`).
* **Player management**: freeze/unfreeze for the demo player and every simulated
  player (enforced in `checkGuards`, `readyBotPool`, bot games, transfers,
  shop), per-player bet history in the record drawer, live player session
  monitor, and manual credit/debit through the money module.
* **Revenue dashboard** (Commercial → Revenue): volume/NGR tiles, daily and
  weekly SVG charts, reconciliation readout, and **CSV + JSON exports** of the
  merged transaction log.

### Phase 4 — Humanization & targeted rendering

* `renderChrome()` / `renderTab()` / `renderTick()` (player) and
  `renderAdminChrome()` / `renderAdminTab()` / `renderAdminTick()` (admin);
  tab clicks and background bot ticks now repaint only the active screen
  (verified by comparing an inactive panel's HTML before/after a tick).
* Internal codes (`B1–B4`, `UX1–UX4`, `G21–G23`, `CAT18–CAT33`, `E6–E9`,
  `S1–S7`) are gone from every user-visible string; the Feature Directory shows
  the human category and its search index ignores codes. `.code` remains only
  as an internal data key and for private-room invite codes.
* Navigation redesign: icon chips, gold/purple active accent bars with glow,
  gradient header hairline, hover polish, `:focus-visible` rings, `min-width`
  guards for the mobile tab bar.
* The `src/components` library and `src/css/variables.css` are now wired into
  the app (the Revenue screen builds tiles and buttons from them).

### Phase 5 — 20-pass audit

`tools/run-audit-loop.sh 50` runs three harnesses per pass:

| Harness | Covers |
|---|---|
| `tools/audit.js` | module graph + ESM parse, DOM ids, assets, SW precache completeness, JS hygiene, accessible names on every form control, human labels, targeted rendering, component wiring, Admin ↔ Player alignment, repository hygiene |
| `tools/ledger-simulation.mjs` | safe integer math, escrow conservation, concurrency/double-spend, invariants, reconciliation formula |
| `tools/boot-smoke.mjs` | headless jsdom boot of both apps, all 34 screens, tab walks, a live bet, the theme palette end to end, Admin Revenue rendering, zero console output |

**Result: 50/50 clean passes — 315 checks per pass, 15,750 assertions, 0
failures** (`tossmatch/docs/audit-loop-v13.0.log`).

### Phase 6 — Cleanup & documentation

29 paths (~7.9 MB) deleted — `old data/` workspace archives, superseded
single-file prototypes/mock data under `docs/legacy/`, and unreferenced
duplicate component stylesheets. Every path is itemised with its reason in
`doc/CLEANUP_AND_ARCHITECTURE.md`, which also documents the architecture,
component catalog, integration hooks, ledger audit and audit confirmation.
`README.md` and `_config.yml` were updated for the new layout.

## Test plan

- [x] `node tools/audit.js` — all checks clean
- [x] `node tools/ledger-simulation.mjs` — 20/20 money + concurrency checks
- [x] `node tools/boot-smoke.mjs` — 35/35 headless boot checks (`npm i`)
- [x] `bash tools/run-audit-loop.sh 50` — 50/50 consecutive clean passes
