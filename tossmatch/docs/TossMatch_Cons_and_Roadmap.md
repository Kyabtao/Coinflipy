# TossMatch v11.0 — Cons, Risks and New-Feature Roadmap

**Review date:** 28 August 2026 (v11.0 unified merge; supersedes the 25 August 2026 v10.8 review)  
**Scope:** Player v11.0, Admin v11.0, PWA/API support files, Feature Directory, game systems and documentation  
**Status key:** Critical · High · Medium · Low

## Executive summary

TossMatch is feature-complete as a local play-coin demonstration, with 33 P2P Catalog games, 23 Arcade+ modes (including the restored G21–G23 classics), autonomous bots with a full withdrawal economy, social/economy/progression systems, Platform/Security/RG demos and accessible navigation. The v11.0 unified merge resolved the cross-version gaps (bot withdrawals, Player Directory, unreachable classic games, unmerged image assets). The complete current-state rules and inventories are consolidated in `TossMatch_Complete_Feature_and_Rules_Specification.md` and authoritative DOCX Appendices V–Z, with Appendix Z controlling the v10.8 delta. Its main weaknesses are not missing local UI; they are trust, durability, production security, independent fairness, accessibility verification and operational scalability.

Following the demo-scope decision, only the four UX proposals are implemented in v10.3. The remaining eight LiveOps, Trust and Operations proposals stay clearly Suggested for production. Feature Directory totals become **90 Implemented · 3 Partial · 8 Suggested · 101 total**.

## What is already strong

- Broad, synchronized Player/Admin demo coverage.
- Live cross-tab bot execution: Admin opens separately, pulses the full Player engine and receives immediate state updates.
- Mandatory first-top-up eligibility: no bot enters games or autonomous activity before its first varied top-up.
- Standardized bot wallet: 0 starting MAIN, 1,000 starting BONUS and separate MAIN/BONUS reporting.
- Complete P2P waiting/manual/auto-bot Catalog model.
- Separate Player Directory and Leaderboard.
- Player-vs-bot Series Cups plus unattended bot-vs-bot Cups, and bot-filled tournaments with no real-player requirement.
- Rich history/statistics, including Player/bot top-up analytics and Admin result visibility.
- Dedicated Admin Top-up Analytics with filtered/paginated Player records, bot summaries and CSV export.
- Configurable Auto Bet stop, bot top-up trigger and automatic roster growth.
- Searchable screen and game navigation with deep links.
- Working local PWA, language, API, notification, TOTP, analytics, statement, promotion and RG demonstrations.
- Explicit demo/production boundaries in the Feature Register and audit report.

## Cons and risk register

| ID | Severity | Con / limitation | Current consequence | Recommended correction / roadmap link |
|---|---|---|---|---|
| CON-01 | Critical | Wallets, escrow, settlement, promotion claims and RG controls are client-authoritative | Browser tools/localStorage can alter balances, outcomes, limits and claims | Server-authoritative transactional ledger, idempotent settlement and immutable events |
| CON-02 | Critical | Admin has no authentication, RBAC or MFA boundary | Anyone who can load Admin under the origin can change operational state | Protected Admin service, least-privilege roles, MFA and approvals |
| CON-03 | High | “Server” fairness secret is created in the same client | Commitment/reveal is educational, not independently trustworthy | Independent commitment service and external verification |
| CON-04 | High | Some chat, room, clan, broadcast and history values enter `innerHTML` | Networked untrusted text could cause markup/script injection | Central output encoding, `textContent`, sanitization and CSP |
| CON-05 | High | Persistence uses one mutable localStorage record | Cross-tab writes can conflict; storage can be cleared or corrupted | Database persistence, versioned schemas, optimistic locking and recovery |
| CON-06 | High | Deposit/session limits and self-exclusion are locally enforced | Reload/device changes can bypass production-intended protection | Identity-level server RG service; TRUST1 supports eligibility context |
| CON-07 | High | Game probability tables and payout rules are not independently certified | Unsuitable for regulated or real-value deployment | Mathematical review, simulation evidence and certification |
| CON-08 | High | Identity, age and jurisdiction eligibility are absent | No age gate, KYC status, geofencing or region-specific restrictions | **TRUST1** Identity, Age & Jurisdiction Checks |
| CON-09 | Medium | Player and Admin applications are large monolithic HTML files | Regression risk, difficult isolated testing and slower maintenance | Modular TypeScript architecture and schema validation |
| CON-10 | Medium | Full browser, device and accessibility automation is unavailable | DOM stubs cannot verify focus trap, screen readers, install prompts or permissions | Playwright + axe-core; **UX1** Accessibility Center |
| CON-11 | Medium | Translation covers primary navigation/Home, not every rule and long-form screen | Inconsistent multilingual experience | Translation workflow, reviewed copy and locale QA |
| CON-12 | Medium | Bot and human activity share local counts | Simulated population could be mistaken for real registrations/DAU | Separate bot/human dimensions in analytics and public labels |
| CON-13 | Medium | API, remote Push and account-enforced TOTP remain Partial | Local demos work, but closed-app delivery/account protection do not | Authenticated API gateway, push service and account secret custody |
| CON-14 | Medium | Histories are capped and locally mutable | Old records disappear and cannot support authoritative disputes | Durable event archive; **LIVE2** Replay & Shareable Proof; **TRUST3** Case Center |
| CON-15 | Medium | Initial raffle bot tickets remain seeded demo liquidity | Not every initial ticket has a debited participant ledger entry | Individual ticket events and pool-conservation tests |
| CON-16 | Medium | Promotions lack segmentation, eligibility and budget caps | Every local player sees the same campaign and Admin cannot target safely | Eligibility rules, audience previews, budget/claim caps and approval flow |
| CON-17 | Medium | No privacy/data-rights workflow | No consent ledger, correction, deletion or retention request tracking | **TRUST2** Privacy & Data Rights Center |
| CON-18 | Medium | No support/dispute workflow from a game or transaction | Proof exists, but players cannot open and track a case | **TRUST3** Dispute & Support Case Center |
| CON-19 | Medium | No device/session inventory | Users cannot inspect/revoke sessions or see unusual access | **TRUST4** Device & Session Management |
| CON-20 | Medium | No public incident/status workflow | Maintenance banner exists without incident timeline or postmortem | **OPS5** Status & Incident Center |
| CON-21 | Medium | Clan seasons and shared progression are not automated | Clan activity lacks durable divisions, contribution ledger and archived rewards | **LIVE3** Clan Seasons & Cooperative Quests |
| CON-22 | Fixed v10.3 | Home layout was fixed | Players can now choose/reorder eight KPI cards and four Home sections | **UX2 implemented** |
| CON-23 | Fixed v10.3 | Frequent configurations had to be rebuilt manually | Up to 20 named Coin/Catalog/Arcade presets now fill controls without auto-wagering | **UX3 implemented** |
| CON-24 | Low | Discovery is search/favorite-driven only | New or underused games may remain hard to discover | **UX4** Explainable Smart Game Discovery |
| CON-25 | Low | Events are distributed across tournaments, promotions and notifications | Players lack a single timezone-aware schedule | **LIVE1** Event Calendar & Scheduled Play |
| CON-26 | Low | Command palettes can initially contain many rows | Search is effective, but first-open density may be high | Add recent/favorite-first ranking after account persistence |

## UX implementation and remaining Suggested features

| Code | Priority | Feature | v10.3 decision | Status |
|---|---:|---|---|---:|
| UX1 | Demo | Accessibility Center | Implemented high contrast, reduced motion, 90–130% text scale, three colour-vision presets and screen-reader hints | Implemented |
| UX2 | Demo | Customizable Dashboard | Implemented choose/reorder/hide/reset for eight KPI cards and four Home sections | Implemented |
| UX3 | Demo | Saved Bet & Game Presets | Implemented up to 20 named Coin/Catalog/Arcade presets; apply fills controls only and retains all RG/game checks | Implemented |
| UX4 | Demo | Smart Game Discovery | Implemented explainable favorites, variety, current-game, daily and collection recommendations with exact links | Implemented |
| LIVE1 | Production | Event Calendar & Scheduled Play | Defer to production services and account-backed scheduling | Suggested |
| LIVE2 | Production | Match Replay & Shareable Proof | Defer to durable server event/proof archive | Suggested |
| LIVE3 | Production | Clan Seasons & Cooperative Quests | Defer to server seasons, contribution ledger and rewards | Suggested |
| TRUST1 | Production | Identity, Age & Jurisdiction Checks | Defer to compliant identity/KYC/geofencing providers | Suggested |
| TRUST2 | Production | Privacy & Data Rights Center | Defer to authoritative consent, retention and request workflows | Suggested |
| TRUST3 | Production | Dispute & Support Case Center | Defer to durable case/SLA/support services | Suggested |
| TRUST4 | Production | Device & Session Management | Defer to authenticated account/session infrastructure | Suggested |
| OPS5 | Production | Status & Incident Center | Defer to production observability and incident services | Suggested |

## v10.8 bot starting-wallet implementation

All source seed definitions, procedural roster generation, auto-created bots and Admin-created bots now initialize at **0 MAIN + 1,000 BONUS**. Existing saved bots receive a one-time `walletVersion=2` migration that resets prior MAIN/top-up state to the same starting wallet and makes them pending for the required first top-up.

The 1,000 starting BONUS is accounted once as a tap and promotion cost. The required first top-up remains varied 400–1,600 but credits MAIN only; its optional +50% promotion credits BONUS only. Bot profiles and Admin now separate MAIN, BONUS and total wallet, while analytics/history/CSV separate starting bonus, first-promo bonus and complete wallet credit.

This intentionally resets existing local bot liquidity and creates a large one-time promotional tap for the roster. The BONUS balance is separately retained and does not alter the configured MAIN low-balance threshold. Production requires segmented server wallets, explicit bonus-spend rules, migration controls, reconciliation and budget approval.

## v10.7 required bot first-top-up implementation

Every existing/imported bot is now bulk-onboarded by the coordinated engine leader before the first full bot tick. Auto-created bots top up immediately after insertion, while Admin-added bots remain blocked until the next engine pulse onboards them. Named-bot, skill-match and activity-pool helpers defensively require `firstTopupDone`, so a pending bot cannot be selected to play first.

The required first top-up ignores the low-balance threshold and uses the existing varied 400–1,600 base calculation. If the Admin first-top-up promotion is enabled, the bot receives +50%; if paused, the base top-up still completes and the bot becomes eligible. Records retain required/pre-play flags and first-top-up time. Admin Live Operations and Top-up Analytics expose ready versus blocked bot counts.

This increases initial demo taps substantially because the full seeded roster must top up before activation. That is intentional for the requested simulation but reinforces the production requirement for explicit bot-ledger classification, non-revenue treatment, budget controls and bot/human analytics separation.

## v10.6 live Admin synchronization implementation

Player Admin links now open Admin in a new tab, preserving the normal Player engine. Admin also embeds a one-pixel same-origin Player-engine fallback for direct Admin loads. Visible Admin sends `admin-pulse` messages every 1.8 seconds through `tossmatch_bot_live_v1`; a hidden Player/fallback responds by running the full existing bot tick and immediately persisting shared state. A six-second `tossmatch_bot_leader_v1` lock prevents duplicate Player engines and permits failover.

Admin reloads `tossmatch_v8` on each state event and visibly reports BOT ENGINE LIVE, PLAYER CONNECTED · SYNCING or WAITING FOR PLAYER TAB. Remote render paths set `applyingRemoteState`, preventing Player/Admin save feedback loops and stale overwrite. When an Admin form field has focus, safe cards and summaries still refresh without replacing that input.

This fixes the local-demo continuity problem but is not a production distributed-systems solution. BroadcastChannel/localStorage locks are same-browser, best-effort coordination and do not replace a server scheduler, transactional state authority, WebSocket event stream or multi-device conflict handling.

## v10.5 top-up analytics implementation

Player Wallet, Home and Statistics now expose top-up count, base volume, promotional bonuses, credited total, averages, largest value, 7/30-day volume and recent activity. New Player top-ups retain a richer record while legacy amount-only records remain compatible. Monthly statements include count/base/bonus/credited totals.

Admin adds a 12th screen, **Top-up Analytics**, with combined Player/bot KPI cards, separate summaries, filtered/sorted/paginated Player records, recent bot records and CSV export. Header, Overview and Economy cards also expose top-up totals. The production warning is unchanged: all top-ups are local play-coin liquidity taps, bonuses are promotion cost, and none is a deposit, payment or house revenue.

## v10.4 coin-use implementation

The balanced demo expansion adds four P2P Catalog games, four Arcade+ modes and four non-wager coin utilities:

- CAT30 Three Dice Poker, CAT31 Last Digit Duel, CAT32 Binary Code Duel and CAT33 Coin Balance Battle.
- G17 Coin Pusher, G18 Tower Builder, G19 Match-3 Rush and G20 Mystery Vault.
- E6 Cosmetic Crafting, E7 Event Ticket Packs, E8 Clan Treasury and E9 Private Room Upgrades.

The new Catalog games retain two-player escrow/waiting/manual/auto-bot rules. Arcade games publish proof-driven payout tables. Crafting, tickets and room upgrades are house/coin sinks; Clan Treasury is a non-withdrawable social resource recorded as a sink but not house revenue. None bypasses RG or wallet guards.

## Demo-scope decision

Only UX1–UX4 are fixed in the demo. All other security, ledger, fairness, persistence, compliance, support, device/session, LiveOps and incident cons remain documented for production deployment. Their local-demo warnings must not be removed or presented as resolved.

## Architecture improvements that should accompany the roadmap

1. Server-authoritative ledger, escrow, RNG commitments and RG enforcement.
2. Authenticated account/Admin services with RBAC, MFA and device/session control.
3. Modular TypeScript packages for state, games, wallet, bots, social, RG and UI.
4. Schema migrations and transactional database persistence.
5. Deterministic unit tests for every win/split/carry/payout path.
6. Ledger-conservation and long-running bot/Turbo tests.
7. Playwright mobile/desktop/PWA tests and axe-core accessibility checks.
8. Central output encoding, CSP, rate limits and abuse controls.
9. Observability pipeline with bot/human dimensions and incident response.
10. Independent game mathematics, fairness and security audits.

## Recommended production sequence

### Production foundation

- Server-authoritative ledger, account/Admin security and RG enforcement.
- TRUST1, TRUST2, TRUST3 and TRUST4.

### Production LiveOps and transparency

- LIVE1, LIVE2 and OPS5.
- Durable event, case and incident services.

### Production social progression

- LIVE3 with server seasons, contribution ledger and archived rewards.

## Before/after summary

| Area | Before v10.3 | Current v10.8 |
|---|---|---|
| Cons | Distributed across audit warnings and appendices | One prioritized 26-item cons/risk register |
| Roadmap | 12 Suggested ideas from v10.2 | UX1–UX4 implemented; 8 production ideas remain Suggested |
| Feature Directory | 78 Implemented / 3 Partial / 8 Suggested / 89 total | 90 Implemented / 3 Partial / 8 Suggested / 101 total |
| Production boundary | Multiple warnings | Consolidated architecture, compliance, accessibility and operational plan |

The remaining eight Suggested features stay non-playable until production-backed screens, runtime flows, persistence, tests and synchronized documentation exist.
