/**
 * Math Utilities — FlipArena v12.0
 * Safe integer math and rounding helpers
 */

/**
 * Safe integer addition (prevents floating point errors)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number}
 */
export function safeAdd(a, b) {
  return Math.round((a || 0) + (b || 0));
}

/**
 * Safe integer subtraction (prevents floating point errors)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number}
 */
export function safeSub(a, b) {
  return Math.round((a || 0) - (b || 0));
}

/**
 * Safe integer multiplication
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number}
 */
export function safeMul(a, b) {
  return Math.round((a || 0) * (b || 0));
}

/**
 * Safe integer division with rounding
 * @param {number} a - Numerator
 * @param {number} b - Denominator
 * @param {number} [decimals=0] - Decimal places
 * @returns {number}
 */
export function safeDiv(a, b, decimals = 0) {
  const result = b ? (a || 0) / b : 0;
  return decimals ? Math.round(result * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.round(result);
}

/**
 * Calculate percentage with rounding
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} [decimals=2] - Decimal places
 * @returns {number}
 */
export function percentage(value, total, decimals = 2) {
  if (!total) return 0;
  return safeDiv(value * 100, total, decimals);
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to nearest step
 * @param {number} value - Value to round
 * @param {number} step - Step size
 * @returns {number}
 */
export function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate standard deviation
 * @param {number[]} values - Array of values
 * @returns {number}
 */
export function standardDeviation(values) {
  if (!values || values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate z-score for statistical analysis
 * @param {number} value - Observed value
 * @param {number} expected - Expected value (mean)
 * @param {number} stdDev - Standard deviation
 * @returns {number}
 */
export function zScore(value, expected, stdDev) {
  if (!stdDev) return 0;
  return (value - expected) / stdDev;
}

/**
 * Format number with Indian locale (lakhs/crores)
 * @param {number} value - Number to format
 * @param {number} [decimals=0] - Decimal places
 * @returns {string}
 */
export function formatIndian(value, decimals = 0) {
  return Math.round(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format as currency/coins
 * @param {number} value - Number to format
 * @param {string} [symbol='🪙'] - Currency symbol
 * @returns {string}
 */
export function formatCoins(value, symbol = '🪙') {
  return `${formatIndian(value)} ${symbol}`;
}

/**
 * Format percentage
 * @param {number} value - Decimal value (0-1)
 * @param {number} [decimals=1] - Decimal places
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Parse amount from input (handles comma formatting)
 * @param {string|number} input - Input value
 * @returns {number}
 */
export function parseAmount(input) {
  if (typeof input === 'number') return input;
  return parseInt(String(input).replace(/,/g, ''), 10) || 0;
}

/**
 * Validate amount is within bounds
 * @param {number} amount - Amount to validate
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @returns {{valid: boolean, message?: string}}
 */
export function validateAmount(amount, min, max) {
  if (amount < min) {
    return { valid: false, message: `Minimum amount is ${formatIndian(min)}` };
  }
  if (amount > max) {
    return { valid: false, message: `Maximum amount is ${formatIndian(max)}` };
  }
  return { valid: true };
}
