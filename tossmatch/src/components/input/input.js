/**
 * Input Component — FlipArena v12.0
 * Bet selectors, number steppers, text inputs
 */

/**
 * Creates a number input with stepper controls
 * @param {Object} options - Number input options
 * @param {number} [options.value=0] - Initial value
 * @param {number} [options.min=0] - Minimum value
 * @param {number} [options.max=999999] - Maximum value
 * @param {number} [options.step=1] - Step value
 * @param {string} [options.placeholder] - Placeholder text
 * @param {Function} [options.onchange] - Change handler
 * @returns {HTMLDivElement}
 */
export function createNumberInput({
  value = 0,
  min = 0,
  max = 999999,
  step = 1,
  placeholder = '',
  onchange = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'stake-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'stake-input';
  input.value = value;
  input.min = min;
  input.max = max;
  input.step = step;
  if (placeholder) input.placeholder = placeholder;

  const decrement = document.createElement('button');
  decrement.className = 'stepper-btn';
  decrement.textContent = '−';
  decrement.addEventListener('click', () => {
    const newValue = Math.max(min, (parseFloat(input.value) || 0) - step);
    input.value = newValue;
    if (onchange) onchange(newValue);
  });

  const increment = document.createElement('button');
  increment.className = 'stepper-btn';
  increment.textContent = '+';
  increment.addEventListener('click', () => {
    const newValue = Math.min(max, (parseFloat(input.value) || 0) + step);
    input.value = newValue;
    if (onchange) onchange(newValue);
  });

  input.addEventListener('change', () => {
    let val = parseFloat(input.value) || 0;
    val = Math.max(min, Math.min(max, val));
    input.value = val;
    if (onchange) onchange(val);
  });

  wrapper.appendChild(decrement);
  wrapper.appendChild(input);
  wrapper.appendChild(increment);

  return wrapper;
}

/**
 * Creates a bet selector with quick chips
 * @param {Object} options - Bet selector options
 * @param {Array<number>} [options.presets=[50, 100, 250, 500, 1000]] - Quick select values
 * @param {number} [options.value=100] - Initial value
 * @param {number} [options.min=10] - Minimum bet
 * @param {number} [options.max=1000] - Maximum bet
 * @param {number} [options.step=10] - Step value
 * @param {Function} [options.onchange] - Change handler
 * @returns {HTMLDivElement}
 */
export function createBetSelector({
  presets = [50, 100, 250, 500, 1000],
  value = 100,
  min = 10,
  max = 1000,
  step = 10,
  onchange = null
} = {}) {
  const container = document.createElement('div');

  // Quick chips
  const chips = document.createElement('div');
  chips.className = 'qchips';
  chips.style.justifyContent = 'flex-start';
  chips.style.marginTop = '10px';

  presets.forEach(preset => {
    const chip = document.createElement('button');
    chip.className = 'qchip' + (value === preset ? ' active' : '');
    chip.textContent = preset.toLocaleString('en-IN');
    chip.dataset.stake = preset;
    chip.addEventListener('click', () => {
      container.querySelectorAll('.qchip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const input = container.querySelector('.stake-input');
      if (input) input.value = preset;
      if (onchange) onchange(preset);
    });
    chips.appendChild(chip);
  });

  // Main input
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'stake-input';
  input.id = 'stakeInput';
  input.value = value;
  input.min = min;
  input.max = max;
  input.step = step;

  input.addEventListener('change', () => {
    let val = parseFloat(input.value) || 0;
    val = Math.max(min, Math.min(max, val));
    val = Math.round(val / step) * step;
    input.value = val;
    
    // Update chip active state
    container.querySelectorAll('.qchip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.stake) === val);
    });
    
    if (onchange) onchange(val);
  });

  container.appendChild(input);
  container.appendChild(chips);

  return container;
}

/**
 * Creates a side selector (Heads/Tails)
 * @param {Object} options - Side selector options
 * @param {Function} [options.onchange] - Change handler (receives 'heads' | 'tails')
 * @returns {HTMLDivElement}
 */
export function createSideSelector({
  onchange = null
} = {}) {
  const container = document.createElement('div');
  container.className = 'side-pick';

  const heads = document.createElement('button');
  heads.className = 'side-btn heads';
  heads.id = 'pickHeads';
  heads.innerHTML = '<span class="s-ico">🪙</span>HEADS<span class="s-sub">even byte</span>';
  heads.addEventListener('click', () => selectSide('heads'));

  const tails = document.createElement('button');
  tails.className = 'side-btn tails';
  tails.id = 'pickTails';
  tails.innerHTML = '<span class="s-ico">💿</span>TAILS<span class="s-sub">odd byte</span>';
  tails.addEventListener('click', () => selectSide('tails'));

  let selected = null;

  function selectSide(side) {
    selected = side;
    heads.classList.toggle('active', side === 'heads');
    tails.classList.toggle('active', side === 'tails');
    if (onchange) onchange(side);
  }

  container.appendChild(heads);
  container.appendChild(tails);

  return container;
}

/**
 * Creates a search input
 * @param {Object} options - Search input options
 * @param {string} [options.placeholder='Search...'] - Placeholder text
 * @param {number} [options.debounce=300] - Debounce delay
 * @param {Function} [options.oninput] - Input handler
 * @returns {HTMLInputElement}
 */
export function createSearchInput({
  placeholder = 'Search...',
  debounce = 300,
  oninput = null
} = {}) {
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.placeholder = placeholder;

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (oninput) oninput(input.value);
    }, debounce);
  });

  return input;
}

/**
 * Creates a toggle button (on/off state)
 * @param {Object} options - Toggle options
 * @param {string} options.label - Button label
 * @param {boolean} [options.active=false] - Initial state
 * @param {string} [options.icon] - Icon emoji
 * @param {Function} [options.onclick] - Click handler
 * @returns {HTMLButtonElement}
 */
export function createToggleButton({
  label,
  active = false,
  icon = '',
  onclick = null
} = {}) {
  const button = document.createElement('button');
  button.className = 'tog' + (active ? ' active' : '');
  button.innerHTML = icon ? `${icon} ${label}` : label;

  button.addEventListener('click', () => {
    button.classList.toggle('active');
    if (onclick) onclick(button.classList.contains('active'));
  });

  return button;
}
