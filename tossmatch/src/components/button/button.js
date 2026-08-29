/**
 * Button Component — FlipArena v12.0
 * Standardized button with variants, sizes, loading/disabled states
 */

/**
 * @typedef {'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'gold' | 'green' | 'purple'} ButtonVariant
 * @typedef {'sm' | 'md' | 'lg'} ButtonSize
 */

const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-purple',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  gold: 'btn-gold',
  green: 'btn-green',
  purple: 'btn-purple'
};

const BUTTON_SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg'
};

/**
 * Creates a button element with standardized styling
 * @param {Object} options - Button options
 * @param {string} options.label - Button text
 * @param {ButtonVariant} [options.variant='primary'] - Button variant
 * @param {ButtonSize} [options.size='md'] - Button size
 * @param {string} [options.icon] - Icon emoji/text
 * @param {boolean} [options.disabled=false] - Disabled state
 * @param {boolean} [options.loading=false] - Loading state
 * @param {string} [options.class] - Additional CSS classes
 * @param {Function} [options.onclick] - Click handler
 * @returns {HTMLButtonElement}
 */
export function createButton({
  label = '',
  variant = 'primary',
  size = 'md',
  icon = '',
  disabled = false,
  loading = false,
  class: additionalClass = '',
  onclick = null
} = {}) {
  const btn = document.createElement('button');
  btn.className = [
    'btn',
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
    BUTTON_SIZES[size] || '',
    additionalClass
  ].filter(Boolean).join(' ');

  btn.disabled = disabled || loading;

  if (icon) {
    btn.innerHTML = `${icon}${label ? ' ' + label : ''}`;
  } else {
    btn.textContent = label;
  }

  if (loading) {
    btn.classList.add('btn-loading');
    btn.dataset.loading = 'true';
  }

  if (onclick) {
    btn.addEventListener('click', onclick);
  }

  return btn;
}

/**
 * Creates a quick chip button (preset selector)
 * @param {Object} options - Chip options
 * @param {string|number} options.value - Chip value
 * @param {boolean} [options.active=false] - Active state
 * @param {Function} [options.onclick] - Click handler
 * @returns {HTMLButtonElement}
 */
export function createChip({
  value,
  active = false,
  onclick = null
} = {}) {
  const chip = document.createElement('button');
  chip.className = 'qchip' + (active ? ' active' : '');
  chip.dataset.value = value;
  chip.textContent = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

  if (onclick) {
    chip.addEventListener('click', onclick);
  }

  return chip;
}

/**
 * Creates an icon-only button
 * @param {Object} options - Icon button options
 * @param {string} options.icon - Icon emoji
 * @param {string} [options.title] - Tooltip text
 * @param {string} [options.class] - Additional classes
 * @param {Function} [options.onclick] - Click handler
 * @returns {HTMLButtonElement}
 */
export function createIconButton({
  icon,
  title = '',
  class: additionalClass = '',
  onclick = null
} = {}) {
  const btn = document.createElement('button');
  btn.className = 'icon-btn' + (additionalClass ? ' ' + additionalClass : '');
  btn.innerHTML = icon;
  btn.title = title;

  if (onclick) {
    btn.addEventListener('click', onclick);
  }

  return btn;
}

/**
 * Creates a toggle switch
 * @param {Object} options - Toggle options
 * @param {boolean} [options.checked=false] - Initial state
 * @param {Function} [options.onchange] - Change handler
 * @returns {HTMLElement}
 */
export function createToggle({
  checked = false,
  onchange = null
} = {}) {
  const wrapper = document.createElement('label');
  wrapper.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;

  const slider = document.createElement('span');
  slider.className = 'slider';

  wrapper.appendChild(input);
  wrapper.appendChild(slider);

  if (onchange) {
    input.addEventListener('change', (e) => onchange(e.target.checked));
  }

  return wrapper;
}

// Export constants for reference
export { BUTTON_VARIANTS, BUTTON_SIZES };
