/**
 * Formatter Utilities — FlipArena v12.0
 * Currency, date, and display formatters
 */

/**
 * Format number as locale string
 * @param {number} value - Number to format
 * @param {Object} [options] - Intl.NumberFormat options
 * @returns {string}
 */
export function fmt(value, options = {}) {
  return Math.round(value || 0).toLocaleString('en-IN', options);
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {number|Date} time - Timestamp or Date
 * @returns {string}
 */
export function timeAgo(time) {
  const now = Date.now();
  const timestamp = time instanceof Date ? time.getTime() : time;
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: days > 365 ? 'numeric' : undefined
  });
}

/**
 * Format duration in human readable form
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format date for display
 * @param {number|Date} time - Timestamp or Date
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(time, options = {}) {
  const date = time instanceof Date ? time : new Date(time);
  const defaults = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleString('en-IN', { ...defaults, ...options });
}

/**
 * Format time only
 * @param {number|Date} time - Timestamp or Date
 * @returns {string}
 */
export function formatTime(time) {
  const date = time instanceof Date ? time : new Date(time);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format game result with styling
 * @param {string} result - Game result
 * @returns {string} HTML string
 */
export function formatResult(result) {
  const styles = {
    WIN: 'color: var(--green)',
    LOSE: 'color: var(--red)',
    DRAW: 'color: var(--amber)',
    CARRY: 'color: var(--purple)'
  };
  return `<span style="${styles[result] || ''}; font-weight: 700">${result}</span>`;
}

/**
 * Format P/L delta with sign
 * @param {number} delta - Change value
 * @returns {string}
 */
export function formatDelta(delta) {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${fmt(delta)}`;
}

/**
 * Format hash for display (truncated)
 * @param {string} hash - Full hash
 * @param {number} [chars=8] - Characters to show on each side
 * @returns {string}
 */
export function formatHash(hash, chars = 8) {
  if (!hash || hash.length < chars * 2) return hash || '';
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format bytes to human readable
 * @param {number} bytes - Number of bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param {number} n - Number
 * @returns {string}
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format rank with medal for top 3
 * @param {number} rank - Rank number
 * @returns {string}
 */
export function formatRank(rank) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) return medals[rank];
  return `#${rank}`;
}
