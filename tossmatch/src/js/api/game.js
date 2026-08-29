/**
 * API Fetch Handlers — FlipArena v12.0
 * Centralized API calls and WebSocket/SSE listeners
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  baseUrl: '', // Uses same-origin for demo
  timeout: 10000,
  retries: 3
};

/**
 * Generic fetch wrapper with retry logic
 * @param {string} url - Endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export async function apiFetch(url, options = {}) {
  const { retries = API_CONFIG.retries, timeout = API_CONFIG.timeout, ...fetchOpts } = options;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await sleep(100 * Math.pow(2, attempt)); // Exponential backoff
    }
  }
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise<Object>}
 */
export async function apiPost(endpoint, data = {}) {
  return apiFetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} [params] - Query parameters
 * @returns {Promise<Object>}
 */
export async function apiGet(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoint}?${query}` : endpoint;
  return apiFetch(url);
}

/**
 * Simulated game result generation (demo mode)
 * Uses Web Crypto API for provably fair results
 */
export async function generateGameResult(makerSeed, takerSeed, gameId, amount, side) {
  // For demo, we simulate the result client-side
  const encoder = new TextEncoder();
  
  const makerData = encoder.encode(`${makerSeed}:${gameId}:${amount}:${side}`);
  const takerData = encoder.encode(`${takerSeed}:${gameId}:${amount}:${side}`);
  
  const makerHash = await crypto.subtle.digest('SHA-256', makerData);
  const takerHash = await crypto.subtle.digest('SHA-256', takerData);
  
  // Convert to BigInt for combination
  const makerInt = bigIntFromBuffer(makerHash);
  const takerInt = bigIntFromBuffer(takerHash);
  const combined = makerInt + takerInt;
  
  // Final hash
  const combinedData = encoder.encode(combined.toString() + ':' + gameId);
  const finalHash = await crypto.subtle.digest('SHA-256', combinedData);
  
  // Get first byte for result
  const resultByte = new Uint8Array(finalHash)[0];
  const result = resultByte % 2 === 0 ? 'HEADS' : 'TAILS';
  const isJackpot = resultByte === 0;
  
  return {
    result,
    isJackpot,
    finalHash: bufferToHex(finalHash),
    makerHash: bufferToHex(makerHash),
    takerHash: bufferToHex(takerHash),
    resultByte
  };
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert ArrayBuffer to BigInt
 */
function bigIntFromBuffer(buffer) {
  let result = BigInt(0);
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i++) {
    result = (result << BigInt(8)) + BigInt(view.getUint8(i));
  }
  return result;
}

/**
 * BroadcastChannel wrapper for cross-tab communication
 */
export class BotChannel {
  constructor(channelName) {
    this.channelName = channelName;
    this.channel = typeof BroadcastChannel !== 'undefined' 
      ? new BroadcastChannel(channelName) 
      : null;
    this.listeners = new Map();
  }

  /**
   * Send message to other tabs
   * @param {Object} message - Message to send
   */
  post(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * Subscribe to messages
   * @param {string} type - Message type
   * @param {Function} handler - Message handler
   * @returns {Function} Unsubscribe
   */
  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);

    if (this.channel && !this._bound) {
      this._bound = true;
      this.channel.onmessage = (e) => {
        const type = e.data?.type;
        if (type && this.listeners.has(type)) {
          this.listeners.get(type).forEach(h => h(e.data));
        }
      };
    }

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  /**
   * Close the channel
   */
  close() {
    this.channel?.close();
    this.listeners.clear();
  }
}

/**
 * LocalStorage event listener for cross-tab sync
 */
export class StorageSync {
  constructor(key) {
    this.key = key;
    this.listeners = [];
    this._setupListener();
  }

  _setupListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.key) {
        try {
          const value = JSON.parse(e.newValue);
          this.listeners.forEach(fn => fn(value));
        } catch {}
      }
    });
  }

  /**
   * Get current value
   * @returns {*}
   */
  get() {
    try {
      return JSON.parse(localStorage.getItem(this.key));
    } catch {
      return null;
    }
  }

  /**
   * Set value
   * @param {*} value - Value to store
   */
  set(value) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  /**
   * Subscribe to changes
   * @param {Function} listener - Change listener
   * @returns {Function} Unsubscribe
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Export channel factory
export function createBotChannel(name) {
  return new BotChannel(name);
}

export function createStorageSync(key) {
  return new StorageSync(key);
}
