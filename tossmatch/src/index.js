/**
 * FlipArena Module Index — v12.0
 * Phase 1: Modularization
 * 
 * Central export point for all modules
 */

// Components
export * from './components/button/button.js';
export * from './components/card/card.js';
export * from './components/modal/modal.js';
export * from './components/badge/badge.js';
export * from './components/input/input.js';

// State Management
export { playerState } from './js/state/player.js';

// API Layer
export { apiFetch, apiPost, apiGet, generateGameResult, BotChannel, createBotChannel, createStorageSync } from './js/api/game.js';

// Utilities
export * from './js/utils/math.js';
export * from './js/utils/format.js';
export * from './js/utils/sanitize.js';

// Render
export { renderChrome, renderTab, renderTick, render } from './js/render.js';

// Sync
export { syncManager, startSync, stopSync, setTurbo, onTick, pulse } from './js/sync.js';

// Pages
export { initPlayer, switchTab } from './pages/player.js';
export { initAdmin } from './pages/admin.js';
