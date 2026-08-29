/**
 * Modal Component — FlipArena v12.0
 * Base modals, alerts, confirmation dialogues
 */

let activeModal = null;

/**
 * Creates and shows a modal dialog
 * @param {Object} options - Modal options
 * @param {string} [options.title] - Modal title
 * @param {string|HTMLElement} options.content - Modal content
 * @param {Array<Object>} [options.buttons] - Array of button configs
 * @param {boolean} [options.closable=true] - Show close button
 * @param {string} [options.class] - Additional modal classes
 * @returns {HTMLDivElement} The modal element
 */
export function createModal({
  title = '',
  content = '',
  buttons = [],
  closable = true,
  class: additionalClass = ''
} = {}) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg show';
  bg.id = 'modalBg';

  const modal = document.createElement('div');
  modal.className = 'modal' + (additionalClass ? ' ' + additionalClass : '');
  modal.id = 'modalContent';

  if (title) {
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h3>${title}</h3>
      ${closable ? '<button class="icon-btn modal-close">✕</button>' : ''}
    `;
    modal.appendChild(header);
  }

  if (typeof content === 'string') {
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = content;
    modal.appendChild(body);
  } else if (content instanceof HTMLElement) {
    modal.appendChild(content);
  }

  if (buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.display = 'flex';
    footer.style.gap = '8px';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '16px';

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'btn btn-' + (btn.variant || 'ghost');
      button.textContent = btn.label;
      if (btn.onclick) {
        button.addEventListener('click', () => {
          btn.onclick();
          if (btn.closeOnClick !== false) {
            closeModal();
          }
        });
      }
      footer.appendChild(button);
    });

    modal.appendChild(footer);
  }

  bg.appendChild(modal);

  // Event handlers
  if (closable) {
    bg.addEventListener('click', (e) => {
      if (e.target === bg) closeModal();
    });
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', handleEscape);

  activeModal = bg;
  document.body.appendChild(bg);

  return modal;
}

/**
 * Closes the active modal
 */
export function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('show');
    setTimeout(() => {
      activeModal?.remove();
      activeModal = null;
    }, 300);
  }
  document.removeEventListener('keydown', handleEscape);
}

function handleEscape(e) {
  if (e.key === 'Escape' && activeModal) {
    closeModal();
  }
}

/**
 * Shows an alert dialog
 * @param {string} message - Alert message
 * @param {string} [type='info'] - Alert type (info, success, warning, error)
 * @param {Function} [onclose] - Close callback
 */
export function showAlert(message, type = 'info', onclose = null) {
  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  createModal({
    title: iconMap[type] + ' ' + type.charAt(0).toUpperCase() + type.slice(1),
    content: `<p>${message}</p>`,
    buttons: [{
      label: 'OK',
      variant: 'primary',
      onclick: onclose
    }]
  });
}

/**
 * Shows a confirmation dialog
 * @param {Object} options - Confirm options
 * @param {string} options.message - Confirmation message
 * @param {string} [options.confirmLabel='Confirm'] - Confirm button label
 * @param {string} [options.cancelLabel='Cancel'] - Cancel button label
 * @param {string} [options.confirmVariant='danger'] - Confirm button variant
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger'
} = {}) {
  return new Promise((resolve) => {
    createModal({
      title: '⚠️ Confirm',
      content: `<p>${message}</p>`,
      buttons: [
        {
          label: cancelLabel,
          variant: 'ghost',
          onclick: () => resolve(false)
        },
        {
          label: confirmLabel,
          variant: confirmVariant,
          onclick: () => resolve(true)
        }
      ]
    });
  });
}

/**
 * Shows a toast notification
 * @param {string} message - Toast message
 * @param {number} [duration=2800] - Duration in ms
 */
export function showToast(message, duration = 2800) {
  const container = document.getElementById('toasts') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = '.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toasts';
  document.body.appendChild(container);
  return container;
}
