/**
 * Card Component — FlipArena v12.0
 * Game cards, stat widgets, flip displays
 */

/**
 * Creates a standard card container
 * @param {Object} options - Card options
 * @param {string} [options.title] - Card title
 * @param {string|HTMLElement} [options.content] - Card content
 * @param {boolean} [options.premium=false] - Premium styling
 * @param {string} [options.class] - Additional CSS classes
 * @returns {HTMLDivElement}
 */
export function createCard({
  title = '',
  content = '',
  premium = false,
  class: additionalClass = ''
} = {}) {
  const card = document.createElement('div');
  card.className = [
    'card',
    premium ? 'premium-card' : '',
    additionalClass
  ].filter(Boolean).join(' ');

  if (title) {
    const header = document.createElement('h3');
    header.textContent = title;
    card.appendChild(header);
  }

  if (content) {
    if (typeof content === 'string') {
      card.innerHTML += content;
    } else if (content instanceof HTMLElement) {
      card.appendChild(content);
    }
  }

  return card;
}

/**
 * Creates a stat tile
 * @param {Object} options - Stat tile options
 * @param {string|number} options.value - Display value
 * @param {string} options.label - Label text
 * @param {string} [options.color] - Color variant (green, red, blue, purple)
 * @param {string} [options.icon] - Icon emoji
 * @returns {HTMLDivElement}
 */
export function createStatTile({
  value,
  label,
  color = '',
  icon = ''
} = {}) {
  const tile = document.createElement('div');
  tile.className = 'stat-tile' + (color ? ' ' + color : '');

  if (icon) {
    const iconEl = document.createElement('div');
    iconEl.style.fontSize = '22px';
    iconEl.textContent = icon;
    tile.appendChild(iconEl);
  }

  const valueEl = document.createElement('div');
  valueEl.className = 'v';
  valueEl.textContent = typeof value === 'number' ? value.toLocaleString('en-IN') : value;
  tile.appendChild(valueEl);

  const labelEl = document.createElement('div');
  labelEl.className = 'k';
  labelEl.textContent = label;
  tile.appendChild(labelEl);

  return tile;
}

/**
 * Creates a stat tile grid
 * @param {Array<Object>} tiles - Array of stat tile options
 * @returns {HTMLDivElement}
 */
export function createStatGrid(tiles = []) {
  const grid = document.createElement('div');
  grid.className = 'grid4';
  grid.style.marginBottom = '16px';

  tiles.forEach(tile => {
    grid.appendChild(createStatTile(tile));
  });

  return grid;
}

/**
 * Creates a game card for the game catalog
 * @param {Object} options - Game card options
 * @param {string} options.name - Game name
 * @param {string} options.description - Game description
 * @param {string} [options.icon] - Game icon
 * @param {string} [options.category] - Category name
 * @param {boolean} [options.favorite=false] - Favorite state
 * @param {Function} [options.onclick] - Click handler
 * @returns {HTMLDivElement}
 */
export function createGameCard({
  name,
  description,
  icon = '🎲',
  category = '',
  favorite = false,
  onclick = null
} = {}) {
  const card = document.createElement('div');
  card.className = 'card game-card';
  card.style.cursor = 'pointer';

  if (favorite) {
    card.classList.add('favorite');
  }

  card.innerHTML = `
    <div class="game-card-header">
      <span class="game-icon">${icon}</span>
      ${category ? `<span class="game-category">${category}</span>` : ''}
      ${favorite ? '<span class="favorite-star">⭐</span>' : ''}
    </div>
    <h4 class="game-name">${name}</h4>
    <p class="game-desc muted">${description}</p>
  `;

  if (onclick) {
    card.addEventListener('click', onclick);
  }

  return card;
}

/**
 * Creates a key-value row
 * @param {Object} options - KV row options
 * @param {string} options.key - Key label
 * @param {string|number} options.value - Value
 * @param {string} [options.valueClass] - Additional value classes
 * @returns {HTMLDivElement}
 */
export function createKVRow({
  key,
  value,
  valueClass = ''
} = {}) {
  const row = document.createElement('div');
  row.className = 'kv-row';

  const keyEl = document.createElement('span');
  keyEl.className = 'k';
  keyEl.textContent = key;

  const valueEl = document.createElement('span');
  valueEl.className = 'v' + (valueClass ? ' ' + valueClass : '');
  valueEl.textContent = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

  row.appendChild(keyEl);
  row.appendChild(valueEl);

  return row;
}

/**
 * Creates a coin flip display
 * @param {Object} options - Coin options
 * @param {string} [options.skin='classic'] - Coin skin class
 * @param {string} [options.result] - 'heads' or 'tails'
 * @param {boolean} [options.spinning=false] - Spinning animation
 * @returns {HTMLDivElement}
 */
export function createCoinDisplay({
  skin = 'classic',
  result = null,
  spinning = false
} = {}) {
  const stage = document.createElement('div');
  stage.className = 'coin-stage';

  const coin = document.createElement('div');
  coin.className = `coin skin-${skin}` + (spinning ? ' spinning' : '');
  coin.id = 'coin';

  const heads = document.createElement('div');
  heads.className = 'face heads';
  heads.textContent = 'H';

  const tails = document.createElement('div');
  tails.className = 'face tails';
  tails.textContent = 'T';

  coin.appendChild(heads);
  coin.appendChild(tails);
  stage.appendChild(coin);

  if (result) {
    coin.dataset.result = result;
    if (result === 'HEADS') {
      coin.classList.add('land-heads');
    } else {
      coin.classList.add('land-tails');
    }
  }

  return stage;
}
