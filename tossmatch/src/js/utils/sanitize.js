/**
 * Input Sanitizers — FlipArena v12.0
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string for safe HTML display
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize for use in HTML attributes
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitizeAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/["'<&>]/g, '');
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, message?: string}}
 */
export function validateUsername(username) {
  if (!username || username.length < 2) {
    return { valid: false, message: 'Username must be at least 2 characters' };
  }
  if (username.length > 24) {
    return { valid: false, message: 'Username must be 24 characters or less' };
  }
  if (!/^[a-zA-Z0-9_\s]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

/**
 * Validate taunt message
 * @param {string} taunt - Taunt message
 * @returns {{valid: boolean, message?: string}}
 */
export function validateTaunt(taunt) {
  if (!taunt) return { valid: true }; // Optional
  if (taunt.length > 24) {
    return { valid: false, message: 'Taunt must be 24 characters or less' };
  }
  if (/[<>]/.test(taunt)) {
    return { valid: false, message: 'Taunt contains invalid characters' };
  }
  return { valid: true };
}

/**
 * Validate bet amount
 * @param {number} amount - Bet amount
 * @param {Object} limits - Bet limits
 * @param {number} limits.min - Minimum bet
 * @param {number} limits.max - Maximum bet
 * @param {number} [balance] - Available balance
 * @returns {{valid: boolean, message?: string}}
 */
export function validateBet(amount, limits, balance = Infinity) {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Bet amount must be greater than 0' };
  }
  if (amount < limits.min) {
    return { valid: false, message: `Minimum bet is ${limits.min}` };
  }
  if (amount > limits.max) {
    return { valid: false, message: `Maximum bet is ${limits.max}` };
  }
  if (amount > balance) {
    return { valid: false, message: 'Insufficient balance' };
  }
  return { valid: true };
}

/**
 * Validate room/invite code format
 * @param {string} code - Room code
 * @returns {{valid: boolean, message?: string}}
 */
export function validateRoomCode(code) {
  if (!code || code.length < 4) {
    return { valid: false, message: 'Room code must be at least 4 characters' };
  }
  if (code.length > 12) {
    return { valid: false, message: 'Room code must be 12 characters or less' };
  }
  if (!/^[A-Z0-9-]+$/i.test(code)) {
    return { valid: false, message: 'Room code can only contain letters, numbers, and hyphens' };
  }
  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, message?: string}}
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Sanitize search/filter input
 * @param {string} input - User input
 * @returns {string}
 */
export function sanitizeSearch(input) {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

/**
 * Validate hex color
 * @param {string} color - Color value
 * @returns {{valid: boolean, message?: string}}
 */
export function validateColor(color) {
  if (!color) return { valid: false, message: 'Color is required' };
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return { valid: true };
  }
  if (/^rgb\(/.test(color)) {
    return { valid: true };
  }
  return { valid: false, message: 'Invalid color format' };
}

/**
 * Clamp numeric input to range
 * @param {number} value - Input value
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function clampInput(value, min, max) {
  const num = parseFloat(value) || min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Parse and validate JSON safely
 * @param {string} json - JSON string
 * @param {*} fallback - Fallback value
 * @returns {*}
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
