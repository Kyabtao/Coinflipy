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

/* ── Subunit (integer-cent) money math ─────────────────────────────────────
   Coins are stored as whole numbers, but percentages (fees, rake, rakeback,
   jackpot funding) produce fractional coins. To keep every ledger movement
   exact and reproducible, money is computed in integer subunits
   (1 coin = SUBUNIT subunits) and rounded half-up exactly once, at the
   boundary back to whole coins.                                            */

/** Number of subunits in one coin (like cents in a rupee). */
export const SUBUNIT = 100;

/** Convert coins to integer subunits (half-up, NaN-safe). */
export function toSubunits(coins) {
  const n = Number(coins) || 0;
  if (!isFinite(n)) return 0;
  return Math.round(n * SUBUNIT);
}

/** Convert integer subunits back to whole coins (half-up, NaN-safe). */
export function fromSubunits(subunits) {
  const n = Number(subunits) || 0;
  if (!isFinite(n)) return 0;
  return Math.round(n) / SUBUNIT;
}

/** Integer subunit addition. */
export function addSubunits(a, b) {
  return Math.round((Number(a) || 0) + (Number(b) || 0));
}

/** Integer subunit subtraction. */
export function subSubunits(a, b) {
  return Math.round((Number(a) || 0) - (Number(b) || 0));
}

/** Integer subunit multiplication by a scalar. */
export function mulSubunits(a, factor) {
  return Math.round((Number(a) || 0) * (Number(factor) || 0));
}

/** `pct`% of an amount expressed in subunits → subunits (half-up). */
export function pctOfSubunits(subunits, pct) {
  const n = Number(subunits) || 0, p = Number(pct) || 0;
  return Math.round((n * p) / 100);
}

/** Percentage of a value, rounded to `decimals` (default 2) decimal places. */
export function pctOf(value, pct, decimals = 2) {
  return pctOfSubunits(toSubunits(value), pct) / SUBUNIT;
}

/** Round a coin amount to whole coins, half-up, deterministically. */
export function roundCoin(coins) {
  return fromSubunits(toSubunits(coins));
}

/** Split an amount across weights without losing or inventing a subunit. */
export function allocateSubunits(subunits, weights = []) {
  const total = weights.reduce((s, w) => s + (Number(w) || 0), 0);
  if (total <= 0) return weights.map(() => 0);
  const out = weights.map(w => Math.floor((subunits * (Number(w) || 0)) / total));
  let rest = subunits - out.reduce((s, v) => s + v, 0);
  for (let i = 0; rest > 0 && i < out.length; i++, rest--) out[i] += 1;
  return out;
}

/** Clamp to a non-negative integer coin amount (never NaN, never negative). */
export function nonNegativeCoin(coins) {
  const n = Math.round(Number(coins) || 0);
  return n > 0 ? n : 0;
}

/** True when the value is a finite, safe integer number of coins. */
export function isSaneAmount(coins) {
  const n = Number(coins);
  return isFinite(n) && Math.abs(n) < 1e15;
}
