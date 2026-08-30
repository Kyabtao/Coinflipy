/**
 * Targeted DOM Render Orchestration — FlipArena v12.0
 * Phase 4: UI Humanization & Targeted Render
 * 
 * Exports: renderChrome(), renderTab(), renderTick(), render()
 */

/**
 * Format number for display
 * @param {number} n - Number to format
 * @returns {string}
 */
function fmt(n) {
  return Math.round(n || 0).toLocaleString('en-IN');
}

// ============================================================
// RENDER CHROME — Header, wallet, counters, jackpot
// ============================================================
export function renderChrome() {
  // Wallet balance
  const mainEl = document.getElementById('mainVal');
  if (mainEl) {
    const balance = (S?.wallet?.main || 0) + (S?.wallet?.bonus || 0);
    mainEl.textContent = fmt(balance);
  }

  // Jackpot ticker
  const jpEl = document.getElementById('jpVal');
  if (jpEl) {
    jpEl.textContent = fmt(S?.jackpot || 0);
  }

  // Admin header stats
  const hNet = document.getElementById('hNet');
  const hTopups = document.getElementById('hTopups');
  const hPool = document.getElementById('hPool');
  const hGames = document.getElementById('hGames');

  if (hNet) hNet.textContent = fmt(cfg()?.house?.netRevenue || 0);
  if (hTopups) hTopups.textContent = fmt(topupAnalytics()?.combined?.base || 0);
  if (hPool) hPool.textContent = fmt(S?.jackpot || 0);
  if (hGames) hGames.textContent = fmt(S?.global?.totalGames || 0);

  // VIP tier badge
  const vipEl = document.getElementById('headerVip');
  if (vipEl) {
    vipEl.textContent = getVipTierName();
  }
}

/**
 * Get current VIP tier name
 * @returns {string}
 */
function getVipTierName() {
  const tiers = cfg()?.vip || [];
  const wagered = S?.monthWagered || 0;
  let currentTier = tiers[0]?.name || 'Starter';
  for (const tier of tiers) {
    if (wagered >= tier.wagered) {
      currentTier = tier.name;
    }
  }
  return currentTier + ' VIP';
}

// ============================================================
// RENDER TAB — Active tab's specific DOM widgets only
// ============================================================
const TAB_RENDERERS = {
  home: renderHomeTab,
  play: renderPlayTab,
  lobby: renderLobbyTab,
  leaderboard: renderLeaderboardTab,
  players: renderPlayersTab,
  games: renderGamesTab,
  series: renderSeriesTab,
  // Admin tabs
  dash: renderDashTab,
  ops: renderOpsTab,
  people: renderPeopleTab,
  features: renderFeaturesTab,
  directory: renderDirectoryTab,
  rates: renderRatesTab,
  econ: renderEconTab,
  topups: renderTopupsTab,
  withdraw: renderWithdrawTab,
  promo: renderPromoTab,
  vip: renderVipTab,
  trny: renderTrnyTab,
  audit: renderAuditTab,
  trust: renderTrustTab,
  season: renderSeasonTab,
  wallet: renderWalletTab,
  stats: renderStatsTab,
  history: renderHistoryTab,
  shop: renderShopTab,
  verify: renderVerifyTab,
  services: renderServicesTab,
  updates: renderUpdatesTab,
  community: renderCommunityTab,
  newgames: renderNewGamesTab,
  progressionplus: renderProgressionTab,
  economyplus: renderEconomyTab
};

export function renderTab(tabName) {
  const renderer = TAB_RENDERERS[tabName];
  if (renderer) {
    renderer();
  }
}

/**
 * Render Home tab (minimal updates)
 */
function renderHomeTab() {
  const feed = document.getElementById('homeFeed');
  if (feed && S?.feed) {
    feed.innerHTML = S.feed.slice(0, 10).map(f => `
      <div class="feed-item">
        <span class="ft">${timeAgo(f.t)}</span>
        ${f.msg}
      </div>
    `).join('') || '<div class="muted">No recent activity</div>';
  }
}

/**
 * Render Play tab
 */
function renderPlayTab() {
  const status = document.getElementById('matchStatus');
  if (status) {
    status.textContent = 'Pick a side and stake, then post your bet.';
  }
}

/**
 * Render Lobby tab
 */
function renderLobbyTab() {
  const waitList = document.getElementById('waitList');
  const feed = document.getElementById('feed');
  
  if (waitList && S?.waiting) {
    waitList.innerHTML = S.waiting.length 
      ? S.waiting.slice(0, 10).map(w => `<div class="wait-item">${w.name || 'Player'} · ${fmt(w.stake)}</div>`).join('')
      : '<div class="muted">No waiting bets</div>';
  }
  
  if (feed && S?.feed) {
    feed.innerHTML = S.feed.slice(0, 20).map(f => `<div class="feed-item"><span class="ft">${timeAgo(f.t)}</span>${f.msg}</div>`).join('');
  }
}

/**
 * Render Leaderboard tab
 */
function renderLeaderboardTab() {
  const lb = document.getElementById('leaderboard');
  if (lb) {
    lb.innerHTML = '<div class="muted">Sort options above to view leaderboard</div>';
  }
}

/**
 * Render Players tab
 */
function renderPlayersTab() {
  const grid = document.getElementById('playersGrid');
  const count = document.getElementById('botCount');
  
  if (count) count.textContent = S?.bots?.length || 0;
  
  if (grid && S?.bots) {
    grid.innerHTML = S.bots.slice(0, 20).map(b => `
      <div class="player-card">
        <span>${b.name}</span>
        <span class="muted">Lv.${b.level || 1}</span>
      </div>
    `).join('') || '<div class="muted">No players online</div>';
  }
}

// Placeholder renderers for other tabs
function renderGamesTab() {}
function renderSeriesTab() {}
function renderDashTab() {}
function renderOpsTab() {}
function renderPeopleTab() {}
function renderFeaturesTab() {}
function renderDirectoryTab() {}
function renderRatesTab() {}
function renderEconTab() {}
function renderTopupsTab() {}
function renderWithdrawTab() {}
function renderPromoTab() {}
function renderVipTab() {}
function renderTrnyTab() {}
function renderAuditTab() {}
function renderTrustTab() {}
function renderSeasonTab() {}
function renderWalletTab() {}
function renderStatsTab() {}
function renderHistoryTab() {}
function renderShopTab() {}
function renderVerifyTab() {}
function renderServicesTab() {}
function renderUpdatesTab() {}
function renderCommunityTab() {}
function renderNewGamesTab() {}
function renderProgressionTab() {}
function renderEconomyTab() {}

/**
 * Time ago formatter
 * @param {number} t - Timestamp
 * @returns {string}
 */
function timeAgo(t) {
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

// ============================================================
// RENDER TICK — Chrome + active tab live widgets only
// ============================================================
let lastActiveTab = 'home';

export function renderTick() {
  renderChrome();
  
  // Only update active tab
  const activeTab = getActiveTab();
  if (activeTab && activeTab !== lastActiveTab) {
    renderTab(activeTab);
    lastActiveTab = activeTab;
  }
  
  // Update any ticking elements in active tab
  updateTickingElements();
}

/**
 * Get currently active tab name
 * @returns {string|null}
 */
function getActiveTab() {
  const activeBtn = document.querySelector('.tab.active');
  return activeBtn?.dataset?.tab || null;
}

/**
 * Update elements that tick/animate
 */
function updateTickingElements() {
  // Jackpot animation
  const jpVal = document.getElementById('jpVal');
  if (jpVal && S?.jackpot !== undefined) {
    jpVal.textContent = fmt(S.jackpot);
  }
  
  // Feed updates
  const feed = document.getElementById('feed') || document.getElementById('homeFeed');
  if (feed && S?.feed) {
    // Only update if feed changed
    const newFeed = S.feed.slice(0, 20).map(f => `<div class="feed-item"><span class="ft">${timeAgo(f.t)}</span>${f.msg}</div>`).join('');
    if (feed.innerHTML !== newFeed) {
      feed.innerHTML = newFeed;
    }
  }
}

// ============================================================
// RENDER — Full boot, initialization, theme evaluation
// ============================================================
export function render() {
  // Full render for initial page load
  renderChrome();
  
  const activeTab = getActiveTab();
  if (activeTab) {
    renderTab(activeTab);
    lastActiveTab = activeTab;
  }
  
  // Theme evaluation
  evaluateTheme();
  
  // Setup tab change listeners
  setupTabListeners();
}

/**
 * Evaluate and apply theme
 */
function evaluateTheme() {
  const settings = S?.settings || {};
  const themeName = settings.themeName || 'midnight';
  
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  
  // Apply custom palette if exists
  if (settings.customPalette) {
    const { bg, card, accent, text } = settings.customPalette;
    if (bg) document.documentElement.style.setProperty('--bg', bg);
    if (card) document.documentElement.style.setProperty('--card', card);
    if (accent) document.documentElement.style.setProperty('--gold', accent);
    if (text) document.documentElement.style.setProperty('--text', text);
  }
}

/**
 * Setup tab change listeners for targeted rendering
 */
let tabListenersSetup = false;
function setupTabListeners() {
  if (tabListenersSetup) return;
  tabListenersSetup = true;
  
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab[data-tab]');
    if (tabBtn) {
      const newTab = tabBtn.dataset.tab;
      // Update state
      sessionStorage.setItem('currentTab', newTab);
      // Targeted render
      setTimeout(() => renderTab(newTab), 0);
      lastActiveTab = newTab;
    }
  });
}

// ============================================================
// EXPORTS — Expose on globalThis for compatibility
// ============================================================
if (typeof globalThis !== 'undefined') {
  globalThis.renderChrome = renderChrome;
  globalThis.renderTab = renderTab;
  globalThis.renderTick = renderTick;
  globalThis.render = render;
}
