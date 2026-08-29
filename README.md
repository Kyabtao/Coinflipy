# TossMatch — Unified Project (v11.0)

This repository contains the **single, cohesive result of merging five separate
workspaces** of the same website project — a local, offline-capable, play-coin
P2P coin-games demonstration ("TossMatch").

## What was merged

| # | Archive (workspace zip) | Contents | Fate in the unified project |
|---|---|---|---|
| 1 | `workspace-01a02c10…` | Original `toss-bet` spec set: business rules, games catalog, feature list/JSON, roadmap, 4 cons audits, system documentation, demos (`toss-bet-demo/full/v5`) | Spec source of truth; archived in `tossmatch/docs/legacy/` |
| 2 | `workspace-01a02ef9…` | `tossmatch-demo.html` + `tossmatch-admin.html` (early app) + spec uploads | Historical demo archived; newer duplicates from archive 5 used where identical-purpose |
| 3 | `workspace-01a02f89…` | `combined-v1` merged single-file app + spec uploads | Historical intermediate version archived |
| 4 | `workspace-01a03733…` | **Modular redesign**: `index.html` + `admin.html` + `css/` + `js/{data,core,engine,player,admin}.js`, real coin/logo photographs, full icon set, project documentation PDF | Its unique features were **ported into the unified app** (bot withdrawals, player directory, coin photography); its assets are now the shared `img/` and `icons/` sets |
| 5 | `workspace-01a03749…` | **TossMatch v10.8** single-file player app + 12-screen admin + full documentation set (Feature Register, Specification, Cons & Roadmap, Audit Report, DOCX, changelog) + `api/openapi.json` | Functional **base of the unified project** — the most feature-complete line |

## The unified app (`tossmatch/`)

The app is now structured as **reusable ES modules with split CSS** instead of
a single inline `<style>` + `<script>` per page.

- `index.html` — complete player application: Coin Toss with escrow + provable
  fairness, 33 P2P catalog games, 20+ Arcade+ games, Series/Cups/Tournaments,
  social hub, VIP & season, shop, wallet, statistics, history, verifier, safety
  & services, accessibility center, 5 languages, command palette.
- `admin.html` — 14-screen operations command center (Overview, Live Ops,
  Players, Feature Hub, Feature Directory, Rates & Jackpot, Economy, Top-up
  Analytics, **Withdrawals**, Promotions, VIP & Levels, Tournaments, Audit &
  Data, Trust Center) with live bot-engine sync.
- `css/` — split stylesheets: `player/app.css`, `admin/app.css`, and the
  shared `shared/theme.css` (theme engine palette UI + modern polish used by
  both apps).
- `js/` — ES modules organized by app and concern:
  - `js/shared/` — shared runtime state (`runtime.js`) and the shared theme
    engine (`theme.js`), imported by both apps.
  - `js/player/` — `core`, `data`, `bots`, `crypto`, `state`, `helpers`,
    `render`, `theme`, `games`, `wallet`, `misc`, `sync`, `boot`, plus the
    `main.js` entry that imports them in execution order.
  - `js/admin/` — `core`, `render`, `theme`, `engine`, `banking`, `sync`,
    `boot`, plus the `main.js` entry.
- `manifest.webmanifest`, `sw.js` — installable PWA with offline cache
  (the service worker now precaches every `js/` and `css/` module).
- `api/openapi.json` — public demo API specification for the API explorer.
- `icons/`, `img/` — unified icon and image assets.
- `docs/` — the consolidated documentation set (changelog, feature register,
  rules specification, cons & roadmap, audit report, project documentation).
- `docs/legacy/` — every historical document from archives 1–3, preserved.

## Features unified in v11.0

1. **Bot withdrawals** (from the modular redesign): each bot has a personal
   3,000–5,000 MAIN cash-out trigger; withdrawals leave the bot wallet, count
   as coin sinks, and are deducted from house revenue. New Admin screen with
   ledger, statistics, "process eligible now" and CSV export.
2. **Admin Player Directory** (from the modular redesign): searchable,
   sortable, paginated roster table (demo player + all simulated bots).
3. **Photoreal coin skin + photographic logo** (from the modular redesign
   assets): the real coin photographs return as a legendary shop skin.
4. All v10.8 functionality: live Admin sync, required bot first top-ups,
   0 MAIN + 1,000 BONUS bot wallets, top-up analytics, 103 Feature Directory
   records, accessibility center, dashboard customization, presets and
   recommendations.
5. Bug fixes found during the merge audit (e.g. Statistics "Best streak" tile
   read a non-existent field; RNG chart canvas guard).

## Running

Because the app now uses **native ES modules** (`<script type="module">` plus
`import`/`export`), it must be served over **HTTP(S)** — e.g. GitHub Pages or a
local static server:

```bash
cd tossmatch
python3 -m http.server 8000
# then open http://127.0.0.1:8000/
```

Opening `tossmatch/index.html` via the `file://` protocol will **not** load the
ES module scripts (browsers block module loading from `file://`). The app is
fully offline-capable once loaded (service worker + localStorage). The Admin
panel opens from the header link in a new tab and shares the same state
(`localStorage` key `tossmatch_v8`) with the player app.

## Deploy on GitHub Pages

GitHub Pages is not enabled on this repository yet (no Actions workflow,
no Pages site, no deployments). The app is static HTML (no build). To publish it:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch **main**, folder **/** (root), then **Save**.

GitHub then serves `https://kyabtao.github.io/Coinflipy/` (root `index.html`
redirects into `tossmatch/`). Direct URLs:

- Player: `https://kyabtao.github.io/Coinflipy/tossmatch/`
- Admin: `https://kyabtao.github.io/Coinflipy/tossmatch/admin.html`

`_config.yml` excludes the `old data/` zip archives from the Pages build.
Paths in the app, manifest, and service worker are relative, so they work
under the project-site base URL.

Optional: to publish **only** `tossmatch/` as the site root (so `/` is the
player app), add `.github/workflows/deploy-pages.yml` with the official
Pages artifact actions (`actions/upload-pages-artifact` +
`actions/deploy-pages`), set Pages source to **GitHub Actions**, and upload
path `tossmatch`. See `tossmatch/docs/github-pages-workflow.md`.

> Play coins only. This is a local demonstration — not a payment, gambling or
> fairness service. Real-money operation requires licensing, KYC/AML, certified
> randomness and legal counsel (see `docs/`).

## Audit

The merged project was verified with a 50-pass automated audit loop
(`audit/` harness outside this app folder): JS syntax validation, boot tests,
full tab/screen walks, live game settlement, state invariants, resource and
PWA checks across both apps, executed 50 consecutive times with zero errors.
