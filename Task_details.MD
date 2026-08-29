# Agent Directive: Coinflipy Full-Stack Modularization, Admin Alignment & 20-Pass Audit

**Target Repository:** `https://github.com/Kyabtao/Coinflipy`  
**Execution Mode:** Autonomous Full-Stack Refactor, Architecture Overhaul, and Continuous Self-Healing Audit Loop

---

## 1. Directory Restructuring & Atomic Componentization

### 1.1 Target Repository Tree
Restructure the flat layout into a modular, decoupled architecture:

```text
Coinflipy/
├── assets/
│   ├── icons/                  # Consolidated SVG icons (coin, wallet, trophy, admin, settings)
│   └── images/                 # Favicons and static graphical assets
├── doc/                        # Comprehensive architecture, cleanup, and audit documentation
├── src/
│   ├── components/             # Reusable UI component modules
│   │   ├── button/             # Standardized button variants, states, and sizes
│   │   ├── card/               # Game cards, metrics widgets, flip displays
│   │   ├── modal/              # Base modals, alerts, and confirmation dialogs
│   │   ├── badge/              # Status indicators, win/loss pills, balance chips
│   │   └── input/              # Bet steppers, value inputs, selectors
│   ├── css/
│   │   ├── variables.css       # Design tokens (colors, palette, spacing, radii, shadows)
│   │   ├── reset.css           # Global resets and typography defaults
│   │   ├── global.css          # Shared layouts, grids, flex containers, utility classes
│   │   ├── player/
│   │   │   └── app.css         # Player-specific styles (gold accents, glow, layout)
│   │   └── admin/
│   │       └── app.css         # Admin-specific styles (purple accents, command panels)
│   ├── js/
│   │   ├── api/                # Network abstraction, endpoints, and SSE/WS listeners
│   │   ├── state/              # Global state (user session, balance, active game state)
│   │   ├── utils/              # Math calculations, coin formatters, sanitizers
│   │   ├── render.js           # Targeted DOM render orchestrator
│   │   ├── sync.js             # Background bot tick routines and periodic polling
│   │   ├── admin/
│   │   │   └── core.js         # Admin directory logic, search indexing, metrics engines
│   │   └── player/
│   │       └── helpers.js      # Player utility hubs, cosmetic crafting, and helpers
│   └── pages/
│       ├── player.js           # Player view controller and event delegation
│       └── admin.js            # Admin view controller and event delegation
├── views/
│   ├── player.html             # Clean player page skeleton mounting components
│   └── admin.html              # Overhauled administration dashboard
└── index.html                  # Landing entry skeleton

1.2 Reusable Component Framework
 * Replace repetitive markup across pages with reusable components using Vanilla JS factories or Native Web Components (e.g., <app-button>).
 * Provide standard button variants: primary, secondary, accent, danger, loading, and disabled.
 * Ensure components accept configuration options (e.g., label, variant, size, className, icon, onClick) so any button or card can be instantiated anywhere without duplicate HTML/CSS.
2. Admin Interface Alignment with player.html
 * Catalog Player Features: Extract every player status, bet option, coin flip animation control, multiplier, user attribute, balance field, and transaction trigger from views/player.html.
 * Mirror Player Controls in Admin: Expand views/admin.html and src/pages/admin.js to provide full visibility and real-time management over all parameters found in the player interface:
   * Live monitoring of active player sessions, balances, and betting activity.
   * Game parameter controls: minimum/maximum bet bounds, win odds/house edge, payout multipliers, and animation speed overrides.
   * Player management: manual balance credits/debits, account freeze/unfreeze toggles, and detailed bet history logs.
   * Consistent and responsive styling aligned with design tokens.
3. Revenue Logic, Ledger & Transaction Audit
 * Safe Arithmetic: Eliminate floating-point calculation errors by using safe integer math (subunits/cents) or deterministic rounding utilities across all coin calculations.
 * Ledger Invariants: Enforce zero-negative-balance constraints and prevent race-condition exploits (such as double-spending on rapid click inputs).
 * Mathematical Reconciliation: Validate and enforce the core ledger formula:
   
 * Admin Revenue Dashboard: Provide real-time analytics for Total Volume and Net Platform Profit, along with daily/weekly charts and exportable transaction logs (CSV and JSON).
4. UI Humanization & Targeted Component Rendering
4.1 Human Labels Sweep (Zero User-Visible Internal Codes)
 * Admin Feature Directory (src/js/admin/core.js): Display human-readable categories (${x.cat}) on card badges instead of internal codes (${x.code}, e.g., S1, CAT18, G21). Strip internal codes from the search index so only human names are matched.
 * Admin Release Grid (views/admin.html): Replace raw codes B1–B4, UX1–UX4, and G21/G22/G23 with human descriptions (e.g., "Feature ideas", "dashboard, presets, accessibility and discovery", and "Crash, Hi-Lo and Mines").
 * Player Release Grid (views/player.html): Remove all B1–B4 and UX1–UX4 references from release-card copy and humanize all section comments.
 * Coin Utility Hub (src/js/player/helpers.js): Clean up card headers (e.g., change E6 · Cosmetic Crafting to Cosmetic Crafting).
 * Data Boundary: Restrict .code references strictly to internal data-model keys and private-room invite codes.
4.2 Website & Navigation Redesign (Token-Driven, Theme-Adaptive)
 * Player Sidebar (views/player.html + src/css/player/app.css):
   * Add icon chips to group labels: 🏠 Home, 🎮 Play, 🤝 Community, 📈 Progress & Economy, ⚙️ Account.
   * Add a gold accent bar + subtle glow to the active tab.
   * Add a gradient header hairline and hover polish on buttons, cards, and toasts.
 * Admin Sidebar (views/admin.html + src/css/admin/app.css):
   * Add icon chips to group labels: ⌁ Command, 💹 Commercial, 🎯 Engagement, 🛡️ Governance.
   * Add a purple accent bar to the active tab and accessible :focus-visible outlines.
 * Theme Adaptability & Mobile Breakpoints:
   * Anchor styles to existing --gold and --purple RGB tokens to ensure full palette compatibility across themes.
   * Protect mobile breakpoints with min-width media queries so labels remain hidden on horizontal mobile tab bars.
4.3 Targeted Refresh (Isolated Component Rerendering)
 * Exported Render Handlers in src/js/render.js:
   * renderChrome(): Renders header, wallet, coin, and jackpot tickers.
   * renderTab(tab): Renders only the active tab's specific DOM widgets.
   * renderTick(): Updates renderChrome() and the active tab's live widgets only.
   * render(): Full initialization, boot, and theme-switch cycle.
 * Tab Switching: Update activeTab on tab click and trigger renderTab(activeTab) without running a monolithic full-page rerender.
 * Background Sync (src/js/sync.js): Route periodic bot ticks through renderTick() so background/hidden panels remain untouched.
 * Scope & Safety: Register and export renderChrome, renderTab, and renderTick on globalThis, and verify all element IDs referenced by renderChrome exist in the DOM.
5. Execution & 20-Pass Continuous Audit Loop
Run an automated internal verification and expansion loop across the refactored codebase:
 * Per-Round Checkpoints:
   * Verify zero runtime console errors, missing assets, or broken module imports.
   * Confirm uniform rendering and styling of reusable UI components across all views.
   * Verify complete elimination of user-visible internal codes.
   * Validate targeted rendering behavior: verify renderTab() and renderTick() isolate DOM changes without reflow thrashing.
   * Run simulated concurrent betting cycles to confirm zero ledger drift and floating-point accuracy.
   * Verify real-time synchronization between actions in views/admin.html and changes in views/player.html.
 * Feature Discovery & Enhancement Step:
   * In each round, evaluate the system for missing quality-of-life enhancements (e.g., sound toggles, win streaks, quick bet chips, rake summaries).
   * If an enhancement is added, implement it across components, player, and admin pages, and reset the clean streak counter to 0.
 * Self-Healing Rule:
   * If any syntax error, UI defect, accounting mismatch, or exposed internal code is discovered, fix it immediately and reset the clean streak counter to 0.
 * Audit Completion:
   * Complete 20 consecutive passes with zero defects and no remaining feature additions before advancing to the final cleanup phase.
6. Legacy File Deletion & Documentation Generation (doc/)
Once the 20-pass audit has passed with zero defects:
 * Purge Unused & Legacy Files:
   * Sweep the entire repository and delete all dead, deprecated, duplicate, or unreferenced files (e.g., old monolithic scripts, unreferenced CSS files, obsolete mock data, superseded prototypes).
   * Ensure the repository contains only clean, active, and modular assets.
 * Generate Documentation in doc/ Folder:
   * Create a doc/ folder in the repository root.
   * Author a comprehensive markdown file named doc/CLEANUP_AND_ARCHITECTURE.md detailing:
     * Deleted Files Register: A complete itemized table of all deleted legacy/unused files, including the reason for deletion.
     * Component Catalog: A guide on how each atomic component (e.g., button, card, modal, input) is structured and how to instantiate it across pages.
     * Admin & Player Integration: A summary of mirrored controls and real-time state synchronization hooks.
     * Ledger & Revenue Audit Summary: Documentation of the safe integer math implementation, reconciliation formula, and concurrency test results.
     * Audit Confirmation: A log confirming the completion of the 20 consecutive error-free audit passes.

