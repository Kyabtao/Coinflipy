/**
 * Background Bot Tick Routines & Live State Polling — FlipArena v12.0
 * Phase 4: UI Humanization & Targeted Render
 * 
 * Periodic bot ticks invoke renderTick() to ensure background/hidden tabs
 * remain untouched while keeping state synchronized.
 */

import { BotChannel, createStorageSync } from './api/game.js';
import { renderTick, renderTab } from './render.js';

// Configuration
const SYNC_CONFIG = {
  tickInterval: 2000,      // Base tick interval (ms)
  fastTickInterval: 200,   // Turbo mode interval
  syncInterval: 5000,      // Storage sync interval
  maxTurbo: 1000           // Maximum turbo multiplier
};

const BOT_CHANNEL_NAME = 'tossmatch_bot_live_v1';

/**
 * Sync manager class
 */
class SyncManager {
  constructor() {
    this.tickTimer = null;
    this.syncTimer = null;
    this.turbo = 1;
    this.isRunning = false;
    this.tickCount = 0;
    
    // Cross-tab communication
    this.channel = createBotChannel(BOT_CHANNEL_NAME);
    this.storage = createStorageSync('tossmatch_state_v1');
    
    // Listeners
    this.tickListeners = new Set();
    
    this._setupChannel();
    this._setupVisibilityHandler();
  }

  /**
   * Start sync loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this._startTicks();
    this._startSync();
    
    console.log('[Sync] Started');
  }

  /**
   * Stop sync loop
   */
  stop() {
    this.isRunning = false;
    
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    console.log('[Sync] Stopped');
  }

  /**
   * Set turbo multiplier for fast simulation
   * @param {number} multiplier - Turbo multiplier (1-1000)
   */
  setTurbo(multiplier) {
    this.turbo = Math.min(Math.max(1, multiplier), SYNC_CONFIG.maxTurbo);
    
    // Restart tick loop with new interval
    if (this.isRunning) {
      this._startTicks();
    }
  }

  /**
   * Subscribe to tick events
   * @param {Function} listener - Tick listener
   * @returns {Function} Unsubscribe
   */
  onTick(listener) {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  /**
   * Send pulse to other tabs
   * @param {Object} data - Pulse data
   */
  pulse(data = {}) {
    this.channel.post({
      type: 'bot-tick',
      t: Date.now(),
      tick: this.tickCount,
      ...data
    });
  }

  /**
   * Trigger a single tick manually
   */
  tick() {
    this._doTick();
  }

  /**
   * Start tick loop
   * @private
   */
  _startTicks() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    
    const interval = Math.max(50, SYNC_CONFIG.tickInterval / this.turbo);
    this.tickTimer = setInterval(() => this._doTick(), interval);
  }

  /**
   * Start sync loop
   * @private
   */
  _startSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => this._doSync(), SYNC_CONFIG.syncInterval);
  }

  /**
   * Execute tick
   * @private
   */
  _doTick() {
    this.tickCount++;
    
    // Notify listeners
    this.tickListeners.forEach(fn => {
      try {
        fn(this.tickCount);
      } catch (e) {
        console.error('[Sync] Tick listener error:', e);
      }
    });
    
    // Targeted render - only update chrome and active tab
    renderTick();
    
    // Pulse to other tabs
    this.pulse({ active: true });
  }

  /**
   * Sync state from storage
   * @private
   */
  _doSync() {
    const storedState = this.storage.get();
    if (storedState && storedState !== S) {
      // State changed in another tab, re-render
      render();
    }
  }

  /**
   * Setup BroadcastChannel listener
   * @private
   */
  _setupChannel() {
    this.channel.on('bot-tick', (msg) => {
      if (msg.tick !== this.tickCount) {
        // Tick from another tab, may need to update
        if (document.visibilityState === 'visible') {
          renderTick();
        }
      }
    });

    this.channel.on('admin-pulse', (msg) => {
      // Admin tab alive signal
      lastPlayerAliveAt = msg.t;
    });

    this.channel.on('state-update', (msg) => {
      // Full state update from another tab
      if (msg.state) {
        Object.assign(S, msg.state);
        render();
      }
    });
  }

  /**
   * Setup visibility change handler
   * @private
   */
  _setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, sync and render
        this._doSync();
        renderTick();
      }
      // Hidden tabs don't need active rendering
    });
  }

  /**
   * Get current tick count
   * @returns {number}
   */
  getTickCount() {
    return this.tickCount;
  }

  /**
   * Get turbo multiplier
   * @returns {number}
   */
  getTurbo() {
    return this.turbo;
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// Legacy compatibility
export const startSync = () => syncManager.start();
export const stopSync = () => syncManager.stop();
export const setTurbo = (mult) => syncManager.setTurbo(mult);
export const onTick = (fn) => syncManager.onTick(fn);
export const pulse = (data) => syncManager.pulse(data);

// Global reference
if (typeof globalThis !== 'undefined') {
  globalThis.syncManager = syncManager;
  globalThis.startSync = startSync;
  globalThis.stopSync = stopSync;
  globalThis.setTurbo = setTurbo;
}
