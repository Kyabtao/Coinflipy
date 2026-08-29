# TossMatch v11.0 — Merge Report

Every file from all five source archives, and where it lives in the unified
project. Source archives (in `old data/`):

1. `workspace-01a02c10-b8b9-79f3-bb0a-5a88849c9eec.zip` — **Spec document set**
2. `workspace-01a02ef9-0fa6-7b77-a302-bd36e3b7210a.zip` — **Demo + admin uploads**
3. `workspace-01a02f89-5928-79f1-982b-76e3ad367d03.zip` — **Combined-v1 set**
4. `workspace-01a03733-364e-7d37-8722-7a82f942c98d.zip` — **Modular redesign**
5. `workspace-01a03749-8933-7d78-aad5-35c16657d368.zip` — **v10.8 release** (functional base)

## Archive 1 — Spec document set (14 files)

| Source file | Unified location |
|---|---|
| toss-bet-business-rules.html | `docs/legacy/toss-bet-business-rules.html` |
| toss-bet-cons-audit.html | `docs/legacy/toss-bet-cons-audit-1.html` |
| toss-bet-cons-audit-2/3/4.html | `docs/legacy/` (unchanged names) |
| toss-bet-demo.html | `docs/legacy/toss-bet-demo.html` |
| toss-bet-features.html | `docs/legacy/toss-bet-features.html` |
| toss-bet-features-categories.html | `docs/legacy/` |
| toss-bet-features.json | `docs/legacy/` (machine-readable v8.0 feature list — used for the feature-gap cross-check) |
| toss-bet-full.html | `docs/legacy/` |
| toss-bet-games-catalog.html | `docs/legacy/` (20-game catalog — all games verified present in the app) |
| toss-bet-roadmap.html | `docs/legacy/toss-bet-roadmap-v1.html` (older revision) |
| toss-bet-system-documentation.md | `docs/legacy/` |
| toss-bet-v5.html | `docs/legacy/` |

## Archive 2 — Demo + admin uploads (7 files)

| Source file | Unified location |
|---|---|
| tossmatch-demo.html (early revision) | `docs/legacy/tossmatch-demo-v1.html` |
| tossmatch-admin.html (early revision) | superseded by archive 5's newer copy |
| uploads/toss-bet-business-rules.html | duplicate of archive 1 |
| uploads/toss-bet-features-categories.html | duplicate |
| uploads/toss-bet-features.json | duplicate |
| uploads/toss-bet-games-catalog.html | duplicate |
| uploads/toss-bet-roadmap.html (newer revision) | `docs/legacy/toss-bet-roadmap.html` |

## Archive 3 — Combined-v1 set (7 files)

| Source file | Unified location |
|---|---|
| uploads/combined-v1.html (== combined-v1-full-details.html) | `docs/legacy/combined-v1.html` |
| uploads/combined-v1-clean.html | `docs/legacy/combined-v1-clean.html` |
| uploads/toss-bet-* (5 files) | duplicates of archives 1–2 |

## Archive 4 — Modular redesign (20 files)

| Source file | Unified location |
|---|---|
| tossmatch/index.html + admin.html + css/app.css + js/{data,core,engine,player,admin}.js | Superseded as an app line; its **unique features were ported into the unified app**: bot-withdrawal engine (→ OPS-5 + Admin Withdrawals screen), Player Directory (→ OPS-6 + Admin Players screen), 5-language navigation basis, turbo controls. |
| tossmatch/img/logo.jpg, coin-heads.jpg, coin-tails.jpg | `img/` — used for the header logo and the new Photoreal coin skin |
| tossmatch/icons/favicon.png, icon-192.png, icon-512.png, icon-512.jpg | `icons/` — unified icon set; favicon + apple-touch-icon wired into index.html |
| tossmatch/manifest.webmanifest, sw.js | Superseded by the v11.0 versions (which add the new assets to the offline cache) |
| uploads/TossMatch_Project_Documentation.pdf | `docs/` |
| uploads/IMG_5398.jpeg, IMG_5399.jpeg | `docs/legacy/uploads/` |

## Archive 5 — v10.8 release (18 files) — functional base

| Source file | Unified location |
|---|---|
| tossmatch/index.html | `index.html` (+ v11.0 merge changes) |
| tossmatch/admin.html | `admin.html` (+ v11.0 merge changes) |
| tossmatch/manifest.webmanifest | `manifest.webmanifest` (icons extended) |
| tossmatch/sw.js | `sw.js` (cache `tossmatch-v11.0`, new assets) |
| tossmatch/api/openapi.json | `api/openapi.json` |
| tossmatch/icons/icon-192.png, icon-512.png | `icons/` |
| tossmatch/CHANGELOG.md | `docs/CHANGELOG.md` (+ v11.0 entry) |
| tossmatch/TossMatch_Audit_Report.md | `docs/TossMatch_Audit_Report.md` (rewritten for v11.0) |
| tossmatch/TossMatch_Complete_Feature_and_Rules_Specification.md | `docs/…` (+ §0 v11.0 addendum) |
| tossmatch/TossMatch_Cons_and_Roadmap.md | `docs/…` (+ v11.0 revision note) |
| tossmatch/TossMatch_Feature_Register.md | `docs/…` (+ v11.0 addendum) |
| tossmatch/TossMatch_Project_Documentation.docx | `docs/` |
| uploads/tossmatch-demo.html (newest revision) | `docs/legacy/tossmatch-demo.html` |
| uploads/tossmatch-admin.html (newest revision) | `docs/legacy/tossmatch-admin.html` |
| uploads/combined-v1-full-details.html | duplicate of archive 3 |
| uploads/toss-bet-games-catalog.html | duplicate |
| uploads/IMG_5391.png | `docs/legacy/uploads/` |

## Conflicts resolved

| Conflict | Resolution |
|---|---|
| Two app lines (modular redesign vs single-file v10.8) | v10.8 wins as the functional base (strict superset of features: +v10.5–v10.8 analytics, live sync, first-top-up gates); modular redesign's unique features ported into it |
| Duplicate spec documents across archives (differing revisions) | Newest revision kept under `docs/legacy/`; older roadmap kept as `-v1` |
| Two icon sets | Union of both (favicon, 192, 512 png + jpg); manifest lists all |
| Two wallet accounting models (`bal` vs `balance`) | v10.8 `balance`/`bonusBalance` model retained; withdrawal engine adapted to it |
| House P&L treatment of withdrawals | New `house.withdrawals` field, deducted in every net-revenue calculation |
| State schema `v` field | Bumped to 11.0 with backward-compatible merge in both apps |
| Crash/Hi-Lo/Mines dead code vs current hub architecture | Restored as Arcade+ G21–G23 hosted by the New Games hub (feature check finding) |

## Feature-gap analysis outcome

| Gap found in the newest version | Action |
|---|---|
| Bot withdrawals + Admin Withdrawals screen (only in modular redesign) | Implemented in player engine + admin (OPS-5) |
| Admin Players directory (only in modular redesign) | Implemented (OPS-6) |
| Crash, Hi-Lo, Mines implemented but unreachable | Restored as G21–G23 with bindings and hub hosting |
| Photographic coin/logo assets unused | Photoreal skin + header logo |
| `stats.bestStreak` undefined tile | Fixed to `S.bestStreak` |
| Command-palette undefined icons for fallback arcade entries | Complete icon map with default |
| Admin RNG chart canvas crash in non-canvas environments | Null guard |
