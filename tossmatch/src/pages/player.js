/**
 * Player Page Entry — FlipArena v12.0
 * Phase 1: Modularization
 * 
 * Player view DOM binding and event handlers
 */

import { playerState } from '../js/state/player.js';
import { syncManager } from '../js/sync.js';
import { renderChrome, renderTab, render } from '../js/render.js';
import { formatIndian, formatDelta, timeAgo } from '../js/utils/format.js';
import { validateBet, validateTaunt } from '../js/utils/sanitize.js';
import { createButton, createChip } from '../components/button/button.js';
import { createStatTile, createStatGrid } from '../components/card/card.js';
import { createBetSelector, createSideSelector } from '../components/input/input.js';
import { createBadge, createResultBadge } from '../components/badge/badge.js';
import { showToast } from '../components/modal/modal.js';

// State references
let S = {};  // Global state
let activeTab = 'home';

// ============================================================
// INITIALIZATION
// ============================================================

export function initPlayer() {
  loadState();
  setupEventListeners();
  setupNavigation();
  setupGameControls();
  setupThemeToggle();
  setupCommandPalette();
  
  // Start background sync
  syncManager.start();
  
  // Initial render
  render();
  
  // Subscribe to state changes
  playerState.subscribe((state, prev) => {
    renderChrome();
    if (state.activeTab !== prev.activeTab) {
      renderTab(state.activeTab);
    }
  });
}

function loadState() {
  // Load from global state (set by the HTML)
  if (typeof window.S !== 'undefined') {
    S = window.S;
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;

  // Tab click handling
  tabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab[data-tab]');
    if (!tabBtn) return;

    const tabName = tabBtn.dataset.tab;
    switchTab(tabName);
  });

  // Quick jump select
  const navJump = document.getElementById('playerNavJump');
  if (navJump) {
    navJump.addEventListener('change', () => {
      if (navJump.value) {
        switchTab(navJump.value);
        navJump.value = '';
      }
    });
  }

  // Go tab buttons
  document.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-go-tab]');
    if (goBtn) {
      switchTab(goBtn.dataset.goTab);
    }
  });
}

function switchTab(tabName) {
  // Update active state
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });

  activeTab = tabName;
  playerState.setAt('activeTab', tabName);

  // Targeted render
  renderTab(tabName);

  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('tab', tabName);
  history.replaceState({}, '', url);
}

// ============================================================
// GAME CONTROLS
// ============================================================

function setupGameControls() {
  // Side selection
  const pickHeads = document.getElementById('pickHeads');
  const pickTails = document.getElementById('pickTails');

  if (pickHeads) {
    pickHeads.addEventListener('click', () => selectSide('heads'));
  }
  if (pickTails) {
    pickTails.addEventListener('click', () => selectSide('tails'));
  }

  // Post bet
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
    postBtn.addEventListener('click', postBet);
  }

  // Random button
  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    randomBtn.addEventListener('click', randomBet);
  }

  // Quick stake chips
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.qchip[data-stake]');
    if (chip) {
      const stake = parseInt(chip.dataset.stake);
      const stakeInput = document.getElementById('stakeInput');
      if (stakeInput) {
        stakeInput.value = stake;
        updateChipStates(stake);
      }
    }
  });

  // Toggles
  setupToggles();

  // Turbo controls
  setupTurboControls();
}

function selectSide(side) {
  const heads = document.getElementById('pickHeads');
  const tails = document.getElementById('pickTails');

  if (heads) heads.classList.toggle('active', side === 'heads');
  if (tails) tails.classList.toggle('active', side === 'tails');

  playerState.setAt('selectedSide', side);
}

function updateChipStates(stake) {
  document.querySelectorAll('.qchip[data-stake]').forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.dataset.stake) === stake);
  });
}

function postBet() {
  const stakeInput = document.getElementById('stakeInput');
  const stake = parseInt(stakeInput?.value) || 0;

  // Validate
  const limits = { min: 10, max: 1000 };
  const validation = validateBet(stake, limits, playerState.getBalance());

  if (!validation.valid) {
    showToast(validation.message, 'error');
    return;
  }

  const side = playerState.getAt('selectedSide');
  if (!side) {
    showToast('Please select HEADS or TAILS first', 'warning');
    return;
  }

  // Deduct and place bet
  playerState.deduct(stake, 'main');

  // Simulate game
  simulateGame(side, stake);
}

function randomBet() {
  const stakeInput = document.getElementById('stakeInput');
  const stake = parseInt(stakeInput?.value) || 100;
  const side = Math.random() > 0.5 ? 'heads' : 'tails';

  selectSide(side);

  const heads = document.getElementById('pickHeads');
  const tails = document.getElementById('pickTails');
  if (heads) heads.classList.toggle('active', side === 'heads');
  if (tails) tails.classList.toggle('active', side === 'tails');
}

function simulateGame(side, stake) {
  const result = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
  const win = (side === 'heads' && result === 'HEADS') || (side === 'tails' && result === 'TAILS');
  const fee = Math.round(stake * 0.05);
  const payout = win ? stake * 2 - fee : 0;
  const delta = payout - stake;

  // Update state
  if (win) {
    playerState.credit(payout, 'main');
  }

  // Record game
  playerState.recordGame({
    result: win ? 'WIN' : 'LOSE',
    stake,
    fee,
    delta,
    jackpot: false,
    playerPick: side.toUpperCase(),
    oppPick: result
  });

  // Show result
  showGameResult(result, win, delta);
}

function showGameResult(result, win, delta) {
  const coin = document.getElementById('coin');
  const status = document.getElementById('matchStatus');
  const banner = document.getElementById('resultBanner');
  const actions = document.getElementById('resultActions');

  if (coin) {
    coin.classList.add(result === 'HEADS' ? 'land-heads' : 'land-tails');
  }

  if (status) {
    status.textContent = win ? 'You WIN!' : 'You LOSE';
    status.style.color = win ? 'var(--green)' : 'var(--red)';
  }

  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML = `
      <span style="font-size: 48px">${result === 'HEADS' ? '🪙' : '💿'}</span>
      <span>${result}</span>
      <span class="${win ? 'text-green' : 'text-red'}">${formatDelta(delta)}</span>
    `;
  }

  if (actions) {
    actions.style.display = 'flex';
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="resetGameState()">Play Again</button>
    `;
  }

  // Update chrome
  renderChrome();
}

window.resetGameState = function() {
  const coin = document.getElementById('coin');
  const status = document.getElementById('matchStatus');
  const banner = document.getElementById('resultBanner');
  const actions = document.getElementById('resultActions');

  if (coin) {
    coin.classList.remove('land-heads', 'land-tails');
  }
  if (status) {
    status.textContent = 'Pick a side and stake, then post your bet.';
    status.style.color = '';
  }
  if (banner) banner.style.display = 'none';
  if (actions) actions.style.display = 'none';

  playerState.setAt('selectedSide', null);
};

// ============================================================
// TOGGLES
// ============================================================

function setupToggles() {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.tog');
    if (toggle) {
      toggle.classList.toggle('active');
      const isActive = toggle.classList.contains('active');
      
      if (toggle.id === 'togPrivate') {
        playerState.setAt('settings.isPrivate', isActive);
        toggle.textContent = isActive ? '🔒 Private' : '🔓 Public';
      } else if (toggle.id === 'togSound') {
        playerState.setAt('settings.sound', isActive);
        toggle.textContent = isActive ? '🔊 Sound' : '🔇 Sound';
      } else if (toggle.id === 'togInstant') {
        playerState.setAt('settings.instant', isActive);
        toggle.textContent = isActive ? '⚡ Instant' : '⏳ Normal';
      } else if (toggle.id === 'togAuto') {
        toggleAutoBet(isActive);
        toggle.textContent = isActive ? '🔁 Auto Bet ON' : '🔁 Auto Bet';
      }
    }
  });
}

function toggleAutoBet(enabled) {
  playerState.setAt('settings.autoBet', enabled);
  const config = document.getElementById('autoBetConfig');
  if (config) {
    config.style.display = enabled ? 'block' : 'none';
  }
}

// ============================================================
// TURBO CONTROLS
// ============================================================

function setupTurboControls() {
  document.querySelectorAll('[data-turbo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const turbo = parseInt(btn.dataset.turbo);
      
      document.querySelectorAll('[data-turbo]').forEach(b => {
        b.classList.toggle('on', b.dataset.turbo === btn.dataset.turbo);
      });

      syncManager.setTurbo(turbo);
      playerState.setAt('turbo', turbo);
    });
  });
}

// ============================================================
// THEME & APPEARANCE
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
  playerState.setAt('settings.theme', next);
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
  const cmdBtn = document.getElementById('playerCommandBtn');
  const cmdBg = document.getElementById('playerCommandBg');
  const cmdClose = document.getElementById('playerCommandClose');
  const cmdSearch = document.getElementById('playerCommandSearch');

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

  if (cmdSearch) {
    cmdSearch.addEventListener('input', (e) => {
      filterCommands(e.target.value);
    });
  }

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      cmdBg?.classList.add('show');
      cmdSearch?.focus();
    }
  });
}

function filterCommands(query) {
  const list = document.getElementById('playerCommandList');
  if (!list) return;

  const q = query.toLowerCase();
  const items = list.querySelectorAll('button');

  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = !q || text.includes(q) ? '' : 'none';
  });
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Tab change listener
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab && tab.classList.contains('tab')) {
      switchTab(tab.dataset.tab);
    }
  });

  // Form inputs
  document.addEventListener('change', (e) => {
    if (e.target.id === 'stakeInput') {
      updateChipStates(parseInt(e.target.value));
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'r' || e.key === 'R') {
      randomBet();
    } else if (e.key === 'Enter' && activeTab === 'play') {
      postBet();
    }
  });
}

// ============================================================
// EXPORTS
// ============================================================

export { switchTab, renderChrome, renderTab };

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPlayer);
}
