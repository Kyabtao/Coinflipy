/**
 * Player State Management — FlipArena v12.0
 * User session, balance, active game state
 */

// Default player state structure
const DEFAULT_STATE = {
  wallet: {
    main: 1000,
    bonus: 250,
    referral: 50,
    rakeback: 0,
    bank: 0
  },
  level: 1,
  xp: 0,
  monthWagered: 0,
  quests: {
    settle: 0,
    win: 0,
    cup: 0,
    claimed: {}
  },
  streak: 0,
  bestStreak: 0,
  games: [],
  stats: {
    games: 0,
    wins: 0,
    losses: 0,
    biggestStake: 0,
    jackpots: 0,
    net: 0,
    bestWin: 0,
    cupsWon: 0,
    trnysWon: 0
  },
  waiting: [],
  cups: [],
  jackpot: 120,
  playerName: '',
  settings: {
    sound: true,
    instant: false,
    autoRebetStop: -200,
    theme: 'dark'
  }
};

/**
 * Player state store
 */
class PlayerState {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = new Set();
    this.saveKey = 'fliparena_player_state_v1';
    this.load();
  }

  /**
   * Get current state
   * @returns {Object}
   */
  get() {
    return this.state;
  }

  /**
   * Get specific state path
   * @param {string} path - Dot-notation path (e.g., 'wallet.main')
   * @param {*} fallback - Default value
   * @returns {*}
   */
  getAt(path, fallback = null) {
    const keys = path.split('.');
    let value = this.state;
    for (const key of keys) {
      if (value == null) return fallback;
      value = value[key];
    }
    return value !== undefined ? value : fallback;
  }

  /**
   * Update state
   * @param {Object|Function} updates - New state or updater function
   */
  set(updates) {
    const prev = { ...this.state };
    if (typeof updates === 'function') {
      this.state = updates(this.state);
    } else {
      this.state = { ...this.state, ...updates };
    }
    this.notify(prev);
    this.save();
  }

  /**
   * Update specific state path
   * @param {string} path - Dot-notation path
   * @param {*} value - New value
   */
  setAt(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    let target = this.state;
    for (const key of keys) {
      if (target[key] == null) target[key] = {};
      target = target[key];
    }
    const prev = target[last];
    target[last] = value;
    this.notify({ [path]: { prev, current: value } });
    this.save();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Change listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   * @param {Object} prev - Previous state
   */
  notify(prev) {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, prev);
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }

  /**
   * Save state to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem(this.saveKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }

  /**
   * Reset to default state
   */
  reset() {
    this.state = { ...DEFAULT_STATE };
    this.save();
  }

  /**
   * Get total playable balance
   * @returns {number}
   */
  getBalance() {
    const w = this.state.wallet;
    return (w.main || 0) + (w.bonus || 0) + (w.referral || 0) + (w.rakeback || 0);
  }

  /**
   * Deduct from wallet
   * @param {number} amount - Amount to deduct
   * @param {string} [segment='main'] - Wallet segment
   * @returns {boolean} Success
   */
  deduct(amount, segment = 'main') {
    const wallet = this.state.wallet;
    if ((wallet[segment] || 0) < amount) return false;
    wallet[segment] -= amount;
    this.notify({ wallet: { prev: wallet, current: wallet } });
    this.save();
    return true;
  }

  /**
   * Add to wallet
   * @param {number} amount - Amount to add
   * @param {string} [segment='main'] - Wallet segment
   */
  credit(amount, segment = 'main') {
    const wallet = this.state.wallet;
    wallet[segment] = (wallet[segment] || 0) + amount;
    this.notify({ wallet: { prev: wallet, current: wallet } });
    this.save();
  }

  /**
   * Update game statistics
   * @param {Object} result - Game result
   */
  recordGame(result) {
    const stats = this.state.stats;
    stats.games++;
    if (result.delta > 0) stats.wins++;
    else if (result.delta < 0) stats.losses++;
    if (result.stake > stats.biggestStake) stats.biggestStake = result.stake;
    if (result.jackpot) stats.jackpots++;
    if (result.delta > stats.bestWin) stats.bestWin = result.delta;
    stats.net += result.delta;
    
    this.state.games.unshift({
      ...result,
      t: Date.now()
    });
    
    // Keep last 100 games
    if (this.state.games.length > 100) {
      this.state.games = this.state.games.slice(0, 100);
    }
    
    this.save();
  }
}

// Singleton instance
export const playerState = new PlayerState();

// Export for convenience
export const {
  get: getPlayerState,
  getAt: getPlayerAt,
  set: setPlayerState,
  setAt: setPlayerAt,
  subscribe: subscribePlayer,
  getBalance: getPlayerBalance,
  deduct: deductPlayer,
  credit: creditPlayer,
  recordGame: recordPlayerGame,
  reset: resetPlayerState
} = playerState;
