## Summary

This PR implements Phase 1 (Directory Restructuring) and Phase 4 (UI Humanization & Targeted Rendering) of the comprehensive refactoring task.

### Phase 1: Directory Restructuring

Created modular directory structure:
- `src/components/` - Reusable UI components (button, card, modal, badge, input)
- `src/css/` - Design system files (variables, reset, global, player/admin themes)
- `src/js/` - Core modules (api, state, utils, render, sync)
- `src/pages/` - Page entry points (player, admin)

### Phase 4: Targeted Rendering

Implemented targeted DOM render orchestration:
- `renderChrome()` - Updates header, wallet balance, coin counters, jackpot tickers
- `renderTab(tab)` - Updates only the active tab's specific DOM widgets
- `renderTick()` - Updates chrome and active tab live widgets only
- `render()` - Full boot, initialization, and theme evaluation

Tab switching now updates activeTab state and invokes renderTab() without triggering monolithic re-renders.

### Components Implemented

**Button Component:**
- Variants: primary, secondary, accent, danger, ghost, gold, green, purple
- Sizes: sm, md, lg
- States: loading, disabled

**Card Component:**
- Standard cards with premium variant
- Stat tiles and grids
- Game cards
- Coin flip display

**Modal Component:**
- Alert, confirmation, and toast notifications
- Modal backdrop and close handlers

**Badge Component:**
- Status badges with variants
- Live indicators
- Win/loss result badges
- VIP tier badges
- Balance chips

**Input Component:**
- Bet selectors with quick chips
- Side selectors (Heads/Tails)
- Number steppers
- Search inputs

### Utilities Added

- **Math:** Safe integer operations, percentage calculations, clamping
- **Format:** Currency formatting (Indian locale), time ago, duration
- **Sanitize:** Input validation for username, taunt, bet amount, room codes

### CSS Foundation

- Design tokens in `variables.css` (palette, spacing, shadows, radii)
- CSS reset and base styles in `reset.css`
- Global utilities in `global.css`
- Player sidebar with gold accent bar + glow styling
- Admin sidebar with purple accent bar styling

### Cross-Tab Sync

BroadcastChannel-based communication for:
- Bot engine pulse signals
- State synchronization between tabs
- Admin live status monitoring

---

This is the first PR of the refactoring task. Future PRs will address:
- Phase 2: Admin alignment with player view
- Phase 3: Revenue and ledger audit
- Phase 5: Audit expansion and healing loop
