/**
 * Badge Component — FlipArena v12.0
 * Status indicators, win/loss pills, balance chips
 */

/**
 * Badge variants
 */
export const BADGE_VARIANTS = {
  on: 'on',           // Green - active/success
  off: 'off',         // Gray - inactive
  warn: 'warn',       // Amber - warning/pending
  danger: 'danger',   // Red - error/danger
  info: 'info',       // Blue - info
  gold: 'gold',       // Gold - special
  purple: 'purple'    // Purple - special
};

/**
 * Creates a status badge
 * @param {Object} options - Badge options
 * @param {string} options.text - Badge text
 * @param {keyof BADGE_VARIANTS} [options.variant='on'] - Badge variant
 * @param {boolean} [options.pulse=false] - Pulse animation
 * @returns {HTMLSpanElement}
 */
export function createBadge({
  text,
  variant = 'on',
  pulse = false
} = {}) {
  const badge = document.createElement('span');
  badge.className = 'tag ' + BADGE_VARIANTS[variant];

  if (pulse) {
    badge.classList.add('pulse');
    badge.style.position = 'relative';
  }

  badge.textContent = text;

  return badge;
}

/**
 * Creates a live status indicator
 * @param {boolean} [isLive=true] - Whether it's live
 * @returns {HTMLSpanElement}
 */
export function createLiveBadge(isLive = true) {
  const badge = document.createElement('span');
  badge.className = 'status-pill live';
  badge.textContent = 'LIVE';

  if (!isLive) {
    badge.style.background = 'var(--mut)';
    badge.textContent = 'OFFLINE';
  }

  return badge;
}

/**
 * Creates a win/loss indicator
 * @param {'WIN' | 'LOSE' | 'DRAW' | 'CARRY'} result - Game result
 * @returns {HTMLSpanElement}
 */
export function createResultBadge(result) {
  const variant = {
    WIN: 'on',
    LOSE: 'danger',
    DRAW: 'warn',
    CARRY: 'purple'
  }[result] || 'off';

  return createBadge({ text: result, variant });
}

/**
 * Creates a VIP tier badge
 * @param {Object} options - VIP badge options
 * @param {string} options.name - Tier name
 * @param {string} options.color - Tier color (hex or gradient)
 * @param {number} [options.tier] - Tier number
 * @returns {HTMLSpanElement}
 */
export function createVipBadge({
  name,
  color,
  tier = null
} = {}) {
  const badge = document.createElement('span');
  badge.className = 'vip-dot';
  badge.style.background = color;
  badge.style.display = 'inline-block';
  badge.style.width = '10px';
  badge.style.height = '10px';
  badge.style.borderRadius = '50%';
  badge.title = `VIP ${tier || ''} ${name}`;

  return badge;
}

/**
 * Creates a balance chip (wallet indicator)
 * @param {Object} options - Balance chip options
 * @param {string} options.label - Chip label (e.g., 'Main', 'Bonus')
 * @param {number} options.value - Balance value
 * @param {string} [options.color='gold'] - Chip accent color
 * @returns {HTMLDivElement}
 */
export function createBalanceChip({
  label,
  value,
  color = 'gold'
} = {}) {
  const chip = document.createElement('div');
  chip.className = 'wallet-chip';
  chip.title = `${label} balance`;

  chip.innerHTML = `
    <div>
      <div class="wcl" style="color: var(--${color})">${label}</div>
      <div class="wcv">${typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
    </div>
  `;

  return chip;
}

/**
 * Creates a feature code badge (internal reference)
 * @param {string} code - Feature code (e.g., 'B1', 'UX1')
 * @returns {HTMLSpanElement}
 */
export function createFeatureCode(code) {
  const badge = document.createElement('span');
  badge.className = 'feature-code';
  badge.textContent = code;
  badge.style.fontSize = '10px';
  badge.style.padding = '2px 6px';
  badge.style.borderRadius = '4px';
  badge.style.background = 'var(--bg3)';

  return badge;
}

/**
 * Creates a jackpot status indicator
 * @param {Object} options - Jackpot options
 * @param {number} options.pool - Current pool amount
 * @param {boolean} options.armed - Whether jackpot is armed
 * @param {number} options.threshold - Arming threshold
 * @returns {HTMLDivElement}
 */
export function createJackpotIndicator({
  pool,
  armed,
  threshold
} = {}) {
  const indicator = document.createElement('div');
  indicator.className = 'jp-meter';

  const poolFormatted = typeof pool === 'number' ? pool.toLocaleString('en-IN') : pool;

  indicator.innerHTML = `
    <div>
      <div class="jpl">🎰 Jackpot</div>
      <div class="jpv" style="color: ${armed ? 'var(--green)' : 'var(--gold)'}">${poolFormatted}</div>
    </div>
    ${armed ? '<span class="tag warn" style="margin-left:8px">ARMED</span>' : ''}
  `;

  return indicator;
}
