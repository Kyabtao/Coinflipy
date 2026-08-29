/**
 * Admin Page Entry — FlipArena v12.0
 * Phase 1: Modularization
 * 
 * Admin dashboard DOM binding and event handlers
 */

import { syncManager } from '../js/sync.js';
import { renderChrome, renderTab, render } from '../js/render.js';
import { formatIndian, formatDelta, timeAgo } from '../js/utils/format.js';
import { createButton, createChip, createToggle } from '../components/button/button.js';
import { createStatTile, createStatGrid, createCard } from '../components/card/card.js';
import { createBadge } from '../components/badge/badge.js';
import { showToast, showConfirm } from '../components/modal/modal.js';

// State references
let S = {};  // Global state
let activeTab = 'dash';

// ============================================================
// INITIALIZATION
// ============================================================

export function initAdmin() {
  loadState();
  setupEventListeners();
  setupNavigation();
  setupCommandPalette();
  setupThemeToggle();
  setupAdminControls();
  
  // Start background sync (admin mode)
  syncManager.start();
  
  // Initial render
  render();
  
  // Admin live status pulse
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      pulseAdminStatus();
    }
  }, 1800);
}

function loadState() {
  if (typeof window.S !== 'undefined') {
    S = window.S;
  }
}

function pulseAdminStatus() {
  if (syncManager.channel) {
    syncManager.pulse({ type: 'admin-pulse', source: 'admin' });
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;

  tabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab[data-tab]');
    if (!tabBtn) return;

    const tabName = tabBtn.dataset.tab;
    switchTab(tabName);
  });

  // Quick jump
  const navJump = document.getElementById('adminNavJump');
  if (navJump) {
    navJump.addEventListener('change', () => {
      if (navJump.value) {
        switchTab(navJump.value);
        navJump.value = '';
      }
    });
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });

  activeTab = tabName;
  
  // Targeted render
  renderTab(tabName);

  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('tab', tabName);
  history.replaceState({}, '', url);
}

// ============================================================
// ADMIN CONTROLS
// ============================================================

function setupAdminControls() {
  // Quick actions
  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => handleQuickAction(btn.dataset.quick));
  });

  // Rate sliders
  setupRateSliders();

  // Toggle controls
  setupToggleControls();

  // Feature controls
  setupFeatureControls();

  // VIP editor
  setupVipEditor();

  // Level editor
  setupLevelEditor();

  // Bot config
  setupBotConfig();

  // Promotions
  setupPromotions();

  // Broadcast
  setupBroadcast();

  // Comp tool
  setupCompTool();

  // Wallet adjustments
  setupWalletAdjustments();

  // Export buttons
  setupExportButtons();

  // Reset
  setupResetButton();
}

function handleQuickAction(action) {
  switch (action) {
    case 'maintenance':
      toggleMaintenance();
      break;
    case 'seed':
      seedJackpot();
      break;
    case 'tournament':
      createTournament();
      break;
    case 'broadcast':
      openBroadcast();
      break;
    case 'export':
      exportState();
      break;
  }
}

function toggleMaintenance() {
  S.config.features.maintenance = !S.config.features.maintenance;
  showToast(S.config.features.maintenance ? 'Maintenance mode ON' : 'Maintenance mode OFF');
  saveState();
  renderChrome();
}

function seedJackpot() {
  S.jackpot += 500;
  showToast('Jackpot seeded +500');
  saveState();
  renderChrome();
}

function createTournament() {
  const trny = {
    id: Date.now(),
    size: 8,
    entry: 100,
    format: 'single',
    status: 'open',
    entrants: [],
    createdAt: Date.now()
  };
  S.trnys = S.trnys || [];
  S.trnys.push(trny);
  showToast('Tournament created');
  saveState();
}

function openBroadcast() {
  const broadcast = document.getElementById('broadcastInput');
  if (broadcast) {
    broadcast.focus();
  }
}

function exportState() {
  const data = JSON.stringify(S, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fliparena-state-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('State exported');
}

// ============================================================
// RATE SLIDERS
// ============================================================

function setupRateSliders() {
  const sliders = ['rngFee', 'rngCup', 'rngTrny', 'rngXf', 'rngJpFund', 'rngJpFloor', 'rngJpArm', 'rngJpPay'];
  
  sliders.forEach(id => {
    const slider = document.getElementById(id);
    if (!slider) return;

    slider.addEventListener('change', () => {
      applyRateChanges();
    });
  });

  // Save button
  const saveRates = document.getElementById('saveRates');
  if (saveRates) {
    saveRates.addEventListener('click', () => {
      applyRateChanges();
      showToast('Rates saved');
    });
  }

  // Reset
  const resetRates = document.getElementById('resetRates');
  if (resetRates) {
    resetRates.addEventListener('click', resetRatesToDefault);
  }
}

function applyRateChanges() {
  const fee = parseInt(document.getElementById('rngFee')?.value) || 5;
  const cup = parseInt(document.getElementById('rngCup')?.value) || 5;
  const trny = parseInt(document.getElementById('rngTrny')?.value) || 10;
  const xf = parseInt(document.getElementById('rngXf')?.value) || 2;

  S.config.feePct = fee;
  S.config.cupRakePct = cup;
  S.config.trnyRakePct = trny;
  S.config.transferFee = xf;

  saveState();
  audit('rate-change', `fee=${fee}% cup=${cup}% trny=${trny}% xf=${xf}%`);
}

function resetRatesToDefault() {
  S.config.feePct = 5;
  S.config.cupRakePct = 5;
  S.config.trnyRakePct = 10;
  S.config.transferFee = 2;

  // Update sliders
  const el = id => document.getElementById(id);
  if (el('rngFee')) el('rngFee').value = 5;
  if (el('rngCup')) el('rngCup').value = 5;
  if (el('rngTrny')) el('rngTrny').value = 10;
  if (el('rngXf')) el('rngXf').value = 2;

  saveState();
  showToast('Rates reset to defaults');
}

// ============================================================
// TOGGLE CONTROLS
// ============================================================

function setupToggleControls() {
  const toggles = {
    'togMaint': () => { S.config.features.maintenance = document.getElementById('togMaint')?.checked; },
    'togAuto': () => { S.config.features.autoMatch = document.getElementById('togAuto')?.checked; },
    'togBots': () => { S.config.features.bots = document.getElementById('togBots')?.checked; },
    'togBotGrowth': () => { S.config.features.botGrowth = document.getElementById('togBotGrowth')?.checked; },
    'togQuests': () => { S.config.features.quests = document.getElementById('togQuests')?.checked; },
    'togLogin': () => { S.config.features.dailyLogin = document.getElementById('togLogin')?.checked; },
    'togTopupPromo': () => { S.config.features.topupPromo = document.getElementById('togTopupPromo')?.checked; }
  };

  Object.entries(toggles).forEach(([id, handler]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        handler();
        saveState();
        audit('toggle', id);
      });
    }
  });
}

// ============================================================
// FEATURE CONTROLS
// ============================================================

function setupFeatureControls() {
  document.querySelectorAll('[data-feature-admin]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleFeatureAdmin(btn.dataset.featureAdmin);
    });
  });
}

function handleFeatureAdmin(action) {
  switch (action) {
    case 'seed-social':
      showToast('Demo friend added');
      break;
    case 'grant-pass':
      showToast('Premium pass granted');
      break;
    case 'expire-sub':
      showToast('Subscription expired');
      break;
    case 'advance-stake':
      showToast('Staking week advanced');
      break;
    case 'clear-chat':
      S.social = S.social || {};
      S.social.chat = [];
      saveState();
      showToast('Chat cleared');
      break;
    case 'reset-features':
      resetFeatureState();
      break;
  }
}

function resetFeatureState() {
  S.social = { friends: [], chat: [], privateRooms: [], friendRequests: [] };
  S.featureGames = {};
  S.engagement = { battlePass: {}, weekly: {}, prestige: 0 };
  S.economyPlus = { cratesOpened: 0, tradingListings: [], subscription: {}, boosters: {} };
  saveState();
  showToast('Feature state reset');
}

// ============================================================
// VIP EDITOR
// ============================================================

function setupVipEditor() {
  const saveVip = document.getElementById('saveVip');
  if (saveVip) {
    saveVip.addEventListener('click', saveVipChanges);
  }

  const resetVip = document.getElementById('resetVip');
  if (resetVip) {
    resetVip.addEventListener('click', resetVipToDefault);
  }

  const endVipMonth = document.getElementById('endVipMonth');
  if (endVipMonth) {
    endVipMonth.addEventListener('click', endVipMonthNow);
  }
}

function saveVipChanges() {
  // Read values from inputs
  document.querySelectorAll('[data-vip]').forEach(inp => {
    const idx = parseInt(inp.dataset.vip);
    const field = inp.dataset.f;
    if (S.config.vip[idx]) {
      if (field === 'name') {
        S.config.vip[idx].name = inp.value;
      } else if (field === 'wagered') {
        S.config.vip[idx].wagered = parseInt(inp.value) || 0;
      } else if (field === 'rakeback') {
        S.config.vip[idx].rakeback = Math.max(0, Math.min(20, parseInt(inp.value) || 0));
      }
    }
  });

  saveState();
  audit('vip-edit', 'VIP table updated');
  showToast('VIP tiers saved');
}

function resetVipToDefault() {
  S.config.vip = [
    { tier: 1, name: "Starter", wagered: 0, rakeback: 0, color: "#8d6e63" },
    { tier: 2, name: "Silver", wagered: 1000, rakeback: 4, color: "#c0c0c0" },
    { tier: 3, name: "Gold", wagered: 3000, rakeback: 6, color: "#ffd700" },
    { tier: 4, name: "Platinum", wagered: 8000, rakeback: 8, color: "#e5e4e2" },
    { tier: 5, name: "Diamond", wagered: 20000, rakeback: 12, color: "#b9f2ff" },
    { tier: 6, name: "Black Diamond", wagered: 50000, rakeback: 15, color: "linear-gradient(135deg,#111827,#f43f5e)" },
    { tier: 7, name: "Royal", wagered: 75000, rakeback: 17, color: "linear-gradient(135deg,#f43f5e,#fbbf24)" },
    { tier: 8, name: "Legend", wagered: 100000, rakeback: 20, color: "linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)" }
  ];
  saveState();
  showToast('VIP reset to v8 defaults');
  renderTab('vip');
}

function endVipMonthNow() {
  S.monthWagered = 0;
  S.vipMonthKey = new Date().toISOString().slice(0, 7);
  saveState();
  audit('vip-month-reset', 'Manual reset');
  showToast('VIP month ended');
}

// ============================================================
// LEVEL EDITOR
// ============================================================

function setupLevelEditor() {
  const saveLevels = document.getElementById('saveLevels');
  if (saveLevels) {
    saveLevels.addEventListener('click', () => {
      document.querySelectorAll('[data-level]').forEach(inp => {
        const level = parseInt(inp.dataset.level);
        S.config.levelRewards[level] = parseInt(inp.value) || 0;
      });
      saveState();
      showToast('Level rewards saved');
    });
  }
}

// ============================================================
// BOT CONFIG
// ============================================================

function setupBotConfig() {
  const saveBotConfig = document.getElementById('saveBotConfig');
  if (saveBotConfig) {
    saveBotConfig.addEventListener('click', () => {
      S.config.botTopupThreshold = parseInt(document.getElementById('botTopupThreshold')?.value) || 500;
      S.config.botGrowthMax = parseInt(document.getElementById('botGrowthMax')?.value) || 250;
      S.config.botGrowthIntervalSec = parseInt(document.getElementById('botGrowthInterval')?.value) || 15;
      S.config.botGrowthBatch = parseInt(document.getElementById('botGrowthBatch')?.value) || 1;
      saveState();
      showToast('Bot settings saved');
    });
  }

  const addBotNow = document.getElementById('addBotNow');
  if (addBotNow) {
    addBotNow.addEventListener('click', addBotNowAction);
  }
}

function addBotNowAction() {
  // Simulate adding a bot
  const newBot = {
    id: Date.now(),
    name: `Bot_${Math.random().toString(36).slice(2, 6)}`,
    balance: 0,
    bonusBalance: 1000,
    level: 1,
    online: true,
    firstTopupDone: false
  };
  S.bots = S.bots || [];
  S.bots.push(newBot);
  saveState();
  showToast(`Bot ${newBot.name} added`);
  renderTab('ops');
}

// ============================================================
// PROMOTIONS
// ============================================================

function setupPromotions() {
  const createPromo = document.getElementById('createPromo');
  if (createPromo) {
    createPromo.addEventListener('click', createPromotion);
  }
}

function createPromotion() {
  const type = document.getElementById('promoType')?.value || 'deposit';
  const amount = parseInt(document.getElementById('promoAmt')?.value) || 100;
  const start = parseInt(document.getElementById('promoStart')?.value) || 0;
  const end = parseInt(document.getElementById('promoEnd')?.value) || 60;

  const promo = {
    id: Date.now(),
    type,
    amount,
    start: Date.now() + start * 60000,
    end: end ? Date.now() + end * 60000 : 0,
    on: true
  };

  S.config.promotions = S.config.promotions || [];
  S.config.promotions.push(promo);
  saveState();
  showToast('Promotion created');
  renderTab('promo');
}

// ============================================================
// BROADCAST
// ============================================================

function setupBroadcast() {
  const setBc = document.getElementById('setBc');
  if (setBc) {
    setBc.addEventListener('click', () => {
      const msg = document.getElementById('broadcastInput')?.value || '';
      S.config.broadcast = msg;
      saveState();
      audit('broadcast', msg || '(cleared)');
      showToast(msg ? 'Broadcast set' : 'Broadcast cleared');
    });
  }

  const clearBc = document.getElementById('clearBc');
  if (clearBc) {
    clearBc.addEventListener('click', () => {
      S.config.broadcast = '';
      document.getElementById('broadcastInput').value = '';
      saveState();
      showToast('Broadcast cleared');
    });
  }
}

// ============================================================
// COMP TOOL
// ============================================================

function setupCompTool() {
  const giveComp = document.getElementById('giveComp');
  if (giveComp) {
    giveComp.addEventListener('click', giveCompensation);
  }
}

function giveCompensation() {
  const amount = parseInt(document.getElementById('compAmt')?.value) || 50;
  const reason = document.getElementById('compReason')?.value || 'Goodwill';

  if (S.config.house.netRevenue < amount) {
    showToast('Insufficient house revenue for comp', 'error');
    return;
  }

  // Apply to player
  S.wallet.main = (S.wallet.main || 0) + amount;
  S.config.house.comps = (S.config.house.comps || 0) + amount;
  
  saveState();
  audit('comp', `${amount} coins - ${reason}`);
  showToast(`Comp of ${amount} coins given`);
  renderTab('econ');
}

// ============================================================
// WALLET ADJUSTMENTS
// ============================================================

function setupWalletAdjustments() {
  const walletAdjBtn = document.getElementById('walletAdjBtn');
  if (walletAdjBtn) {
    walletAdjBtn.addEventListener('click', () => {
      const key = document.getElementById('walletAdjKey')?.value || 'main';
      const amount = parseInt(document.getElementById('walletAdjAmt')?.value) || 100;

      S.wallet[key] = (S.wallet[key] || 0) + amount;
      saveState();
      audit('wallet-adjust', `${key} ${amount > 0 ? '+' : ''}${amount}`);
      showToast(`${key} adjusted by ${amount > 0 ? '+' : ''}${amount}`);
      renderTab('withdraw');
    });
  }
}

// ============================================================
// EXPORT BUTTONS
// ============================================================

function setupExportButtons() {
  const exportLedger = document.getElementById('exportLedger');
  if (exportLedger) {
    exportLedger.addEventListener('click', () => exportLedgerCsv());
  }

  const exportGames = document.getElementById('exportGames');
  if (exportGames) {
    exportGames.addEventListener('click', () => exportGamesJson());
  }

  const exportState = document.getElementById('exportState');
  if (exportState) {
    exportState.addEventListener('click', exportFullState);
  }
}

function exportLedgerCsv() {
  const rows = [['Time', 'Action', 'Detail']];
  (S.config.audit || []).forEach(a => {
    rows.push([new Date(a.t).toISOString(), a.action, a.detail || '']);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  downloadFile(csv, 'ledger.csv', 'text/csv');
  showToast('Ledger exported');
}

function exportGamesJson() {
  downloadFile(JSON.stringify(S.games, null, 2), 'games.json', 'application/json');
  showToast('Games exported');
}

function exportFullState() {
  downloadFile(JSON.stringify(S, null, 2), `state-${Date.now()}.json`, 'application/json');
  showToast('Full state exported');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// RESET
// ============================================================

function setupResetButton() {
  const resetAll = document.getElementById('resetAll');
  if (resetAll) {
    resetAll.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        message: 'This will reset ALL demo data including balances, games, and settings. This cannot be undone.',
        confirmLabel: 'Reset Everything'
      });

      if (confirmed) {
        localStorage.removeItem('tossmatch_v8');
        window.location.reload();
      }
    });
  }
}

// ============================================================
// THEME
// ============================================================

function setupThemeToggle() {
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  const paletteBtn = document.getElementById('paletteBtn');
  if (paletteBtn) {
    paletteBtn.addEventListener('click', openPalette);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  S.settings = S.settings || {};
  S.settings.theme = next;
  saveState();
}

function openPalette() {
  const bg = document.getElementById('paletteBg');
  if (bg) {
    bg.classList.toggle('show');
  }
}

// ============================================================
// COMMAND PALETTE
// ============================================================

function setupCommandPalette() {
  const cmdBtn = document.getElementById('adminCommandBtn');
  const cmdBg = document.getElementById('adminCommandBg');
  const cmdClose = document.getElementById('adminCommandClose');
  const cmdSearch = document.getElementById('adminCommandSearch');

  if (cmdBtn && cmdBg) {
    cmdBtn.addEventListener('click', () => {
      cmdBg.classList.add('show');
      cmdSearch?.focus();
    });
  }

  if (cmdClose && cmdBg) {
    cmdClose.addEventListener('click', () => {
      cmdBg.classList.remove('show');
    });
  }

  if (cmdBg) {
    cmdBg.addEventListener('click', (e) => {
      if (e.target === cmdBg) {
        cmdBg.classList.remove('show');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      cmdBg?.classList.add('show');
      cmdSearch?.focus();
    }
  });
}

// ============================================================
// UTILITIES
// ============================================================

function saveState() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tossmatch_v8', JSON.stringify(S));
  }
}

function audit(action, detail = '') {
  S.config.audit = S.config.audit || [];
  S.config.audit.unshift({ t: Date.now(), who: 'admin', action, detail });
  if (S.config.audit.length > 50) {
    S.config.audit.length = 50;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { switchTab, renderChrome, renderTab };

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAdmin);
}
