# TossMatch v13.0 — Release Notes

**Documentation revision:** 29 August 2026
**Scope:** new P2P/Arcade/social/progression/economy features, full revenue funding-source accounting, redesigned navigation (player + Admin), and a real-world Admin console (login, RBAC, approvals, settings).

## 1. New features

### P2P Games — 36 catalog games (was 33)
| Code | Game | Rule | Resolution |
|---|---|---|---|
| CAT34 | Byte War | Each side reads three independent proof bytes | Higher byte-sum wins; equal sums split |
| CAT35 | Sum of Four | Entrants predict a 0–1020 total | Closest to the sum of four proof bytes wins; equal distance splits |
| CAT36 | High Card Duel | Each side takes a proof-derived card (byte mod 13 + 2 → 2–A) | Higher rank wins; equal ranks split |

All three use the shared 3-party merged-hash proof, waiting-room escrow, per-game
history and Admin command-palette entries. Grouping: `bytewar`/`sumfour` under
*Numbers & Dice*, `highcard` under *Cards*.

### Arcade Zone — 25 modes (was 23)
| Code | Game | Rule | Payouts |
|---|---|---|---|
| G24 | Roulette | 16-pocket proof wheel: seven RED, seven BLACK, GREEN (15), house zero (0, always 0×) | RED/BLACK 2×, GREEN 15× |
| G25 | Blackjack | Two-card proof deal (A = 11/soft, J–K = 10); one-shot HIT (draw one) or STAND; dealer draws one while under 17 | Natural 3×, win 2×, push 1×, bust/lose 0× |

Colour EV is −12.5% (7/16 of each colour) and GREEN −6.25% (1/16 at 15×).

### Social Hub — Event Calendar (LIVE1 → Implemented, demo)
The *Events* tab consolidates every scheduled opportunity with local **and**
UTC timestamps, countdowns and per-event reminders (persisted by event id):
daily trivia (end of day), weekly raffle (next Sunday 20:00 local), live
auto-tournaments, season end, VIP month reset and active campaigns.

### Progress+ — Career Milestones (P6)
Twelve lifetime goals with one-time BONUS rewards: 10/50/150/400 games,
25/100 wins, 50k/250k lifetime wager, first jackpot, level 10/25, 10
achievements. Because they read career totals, milestones survive Prestige
resets. Claims are history-logged and subscription-multiplied like quests.

### Economy+ — Auction House (E10)
- Three cosmetic lots refresh every week (ISO week key), opening bids 50–150.
- Bots bid autonomously on each background tick (step 10–50 above the high).
- The player may outbid at any time (≥ high + 10, capped by available MAIN).
- **Hammer:** the highest bidder pays in MAIN at close; the house keeps a
  **10% hammer fee** → `house.auctionFees` (revenue). A player win grants the
  cosmetic; a bot win credits the bot's shop. Voided lots (no bidder /
  insolvent winner) return the lot to the rotation. History keeps the last 24
  hammers for Admin telemetry.

## 2. Revenue — complete funding-source accounting

`reconciliation()` (shared/money.js) classifies every source:

| Line | Treatment |
|---|---|
| Toss fees, catalog fees, cup rakes, tournament rakes, shop, transfer fees, **auction fees** | REVENUE (gross) |
| Promo cost, comps, **rakeback paid** (booked at claim), **referral payouts** | COST |
| Player deposits, bot deposits | FUNDING (cash-in — never revenue) |
| Bot withdrawals, player withdrawals | CASH-OUT (never an expense) |
| Jackpot pool | LIABILITY (funded from fees, paid from the pool) |
| **NGR** | gross − costs |

Surfaced in: Admin Revenue (4 tiles + 16-line register with % of gross),
Dashboard P&L rows (auction/rakeback/referral), Withdrawals P&L, the revenue
simulator (`simAuction` input + ~2% referral share), both CSV exports
(Treatment column) and the reconciliation readout. The ledger audit now
verifies `net = gross − (promo + comps + rakeback + referral)`.

## 3. Navigation redesign (both apps)

- **Collapsible groups** — 5 player groups (Home / Play / Community / Progress
  & Economy / Account) and 4 Admin groups (Command / Commercial / Engagement /
  Governance); collapse state persists per group.
- **Live badges** — player: open bets on *Live Lobby*, friend requests on
  *Social Hub*; Admin: pending KYC + unresolved flags on *Approvals*,
  bots within 300 of their cash-out trigger on *Withdrawals*, active campaigns
  on *Promotions*. Badges refresh on every tick.
- **Recent row** — the player's last four visited screens render as chips
  above the groups (current screen excluded), persisted in settings.
- **Search flattens groups** — typing hides group headers and expands
  everything so matches are visible; clearing restores the saved layout.
- **List controls** — the player Leaderboard and Player Roster now have name
  (roster: country) filter, five roster sort modes, and Prev/Next pagination
  (10 leaderboard rows / 12 roster cards per page).
- Group headers, counts, badges and the recent row are keyboard-accessible
  with focus rings; the mobile horizontal fallback stays flat.

## 5. UI polish and stability

- **No internal codes in the UI** — every spec code (CAT23, G24, S1, T1, SEC2,
  RG1, OPS4, …) has been removed from visible buttons, nav labels, headings and
  descriptions in both apps and rewritten as human-readable copy (catalog game
  tabs now show the rule edge, e.g. "3 bytes each", instead of "CAT34";
  anti-cheat findings read "Extreme win rate" instead of "AC-WINRATE").
- **Home no longer shakes** — live ticks update KPI values in place (tabular
  numerals), and the opportunities, VIP and feed cards rebuild only when their
  data actually changes, so the layout never reflows on a bot tick.


## 7. v13.1 increment — Admin expansion and all-page stability

- **No screen shake anywhere** — a new shared DOM patcher
  (`patchHTML` / `withPatchedDom` in `js/shared/runtime.js`) routes every
  background-tick `innerHTML` write in both apps through a structure-aware
  merge: when the new markup has the same element skeleton, only changed
  text and attributes update in place (no reflow, no lost focus or scroll);
  structural changes (rows appearing/disappearing) still replace normally.
  Player `renderTick` and Admin `renderAdminTick` both run inside it, so
  Home, Lobby, Wallet, Stats, Season, Shop — and every Admin screen — stay
  still while live data moves.
- **Unified player/bot screens** — *Top-up Analytics* is now
  **Top-ups & Deposits — Players and Bots**: one statistics block and one
  records table covering player deposits and bot top-ups together, with an
  All / Players / Bots filter, unified search, five sorts, pagination and
  CSV export. The separate player and bot cards are gone. The *Withdrawals*
  ledger is unified the same way — bot cash-outs and player withdrawals in
  one table with Player/Bot badges and an All / Players / Bots filter.
- **Four new Admin screens (17 → 21)**:
  - **Reports & Analytics** — 7-day revenue and deposit/cash-out bar
    charts, all-time revenue mix, busiest games, and one-click CSV/JSON
    report exports.
  - **Games & Content** — all 36 catalog games with plays, fee contribution
    (amount + share) and a live enable/disable switch per game, filter and
    sort, paginated.
  - **Referrals** — the demo player's referral code, referred-player
    roster, 5% house referral payout, and a register action that joins a
    new referred player to the live network.
  - **Announcements** — create, publish, unpublish and delete in-app
    announcements; a published announcement appears at the top of every
    player's Home (live across tabs via shared state).
- **Nav & RBAC** — the four screens are wired into the grouped nav
  (Command 6, Commercial 7, Engagement 4, Governance 4), quick-jump select,
  command palette, feature directory (ADM-4…ADM-7) and role scopes.

## 4. Real-world Admin console

- **Login gate** — `#adminLoginOverlay` blocks the console until sign-in.
  Demo credentials **admin / flip2026**, 2FA demo code **246810**. Sessions
  persist in `sessionStorage` (`fa_admin_session`) per browser tab.
- **RBAC roles** — *Super Admin* (22 screens), *Finance* (dash, economy,
  revenue, top-ups, withdrawals, promotions, audit, reports, referrals),
  *Operations* (dash, live ops, players, feature hub/directory, engagement,
  approvals, promotions, games & content, announcements, support),
  *Support* (dash, players, approvals, trust, support). Out-of-scope tabs are hidden,
  the jump select and command palette stay consistent, and an active
  out-of-scope screen redirects to the role's first screen.
- **Approvals screen** (new) — player KYC approve/reset (audit-logged), a
  simulated 3-request KYC queue with approve/decline, automated review-flag
  triage (filter, clear/escalate), freeze/unfreeze and a persistent exclusion
  list, plus a decision history. Nav badge = pending KYC + unresolved flags.
- **Settings screen** (new) — house economics (toss fee, cup/tournament rake,
  jackpot arm/pay, stake range), administrator role switching, maintenance
  mode, engine speed and a factory reset. All changes audit-logged.
- **Header** — dynamic profile (initials, user, role) with logout.


## 8. v13.2 increment — Support, admin users and backups

- **Support & Messaging screen (new, 21 → 22)** — one unified ticket inbox
  for reporters from both the demo player and the bot network: Player/Bot
  badges, filter, status filter (open / replied / closed), reply and
  close actions (all audit-logged), a nav badge for open tickets, plus a
  compose panel that sends platform messages (direct or broadcast).
- **Player-side support** — the Services hub gains a **Support** tab:
  "Contact Support" files a ticket that appears in the Admin inbox
  immediately (shared state), "Messages from the platform" shows Admin
  messages, and "My tickets" tracks each ticket's status and reply.
- **Admin user management (Settings)** — console accounts with role
  select, enable/disable and add-user controls; the primary Super Admin
  is protected from demotion or disable. Every change is audit-logged.
- **Backup & restore (Settings)** — point-in-time snapshots of the whole
  demo state, kept in the browser (five newest retained) with create /
  restore / delete; restore mutates the live state in place so no
  reference is invalidated.
- **Directory** — ADM-8 (Support & Messaging) and ADM-9 (Admin Users &
  Backups) added to the feature directory.

## 6. Verification

- `node tools/audit.js` — static + boot audit clean (module structure, ids,
  asset references, no internal codes in visible copy, both apps boot).
- `node tools/boot-smoke.mjs` — 25/25 (boot, all 19 player tabs, all 22 Admin
  screens, live bet + ledger invariants, Admin revenue screen).
- `node tools/test-new-features.mjs` — 94/94 (event calendar + reminders,
  milestone claims, full auction flow incl. 10% fee, 36/25 game counts,
  nav groups/badges/recent/search, per-page tick stability incl. structure
  change, Admin login, wrong-password rejection, RBAC scoping over 22
  screens, KYC queue decisions, settings persistence, Admin groups, unified
  top-up/withdrawal tables + All/Players/Bots filters, Reports charts and
  exports, Games & Content enable/disable, Referrals registration,
  Announcements publish → player Home banner → unpublish, Support ticket
  flow end-to-end (player files → Admin inbox → reply → close → filter,
  Admin message → player hub), Admin users add/role/disable with primary
  protection, backup create/restore/delete round-trip).
- `bash tools/run-audit-loop.sh 20` — 20 consecutive clean passes of the
  full stack (audit + boot-smoke + new-features); log in
  `tossmatch/docs/audit-loop-v13.0.log`.
- Admin demo access: **admin / flip2026**, 2FA **246810**.
