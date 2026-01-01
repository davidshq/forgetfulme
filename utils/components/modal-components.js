/**
 * @fileoverview Modal and dialog component creation utilities
 * @module components/modal-components
 * @description Provides modal and dialog creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';

/**
 * Create a confirmation dialog using Pico's dialog system
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Confirm handler
 * @param {Function} onCancel - Cancel handler
 * @param {Object} options - Dialog options
 * @returns {HTMLElement}
 */
export function createConfirmDialog(message, onConfirm, onCancel, options = {}) {
  const actions = [
    {
      text: options.confirmText || 'Confirm',
      onClick: () => {
        closeModal(dialog);
        if (onConfirm) onConfirm();
      },
      className: 'primary',
    },
    {
      text: options.cancelText || 'Cancel',
      onClick: () => {
        closeModal(dialog);
        if (onCancel) onCancel();
      },
      className: 'secondary',
    },
  ];

  const dialog = createModal(options.title || 'Confirm', message, actions, {
    showClose: false,
    className: 'confirm-dialog',
    ...options,
  });

  return dialog;
}

/**
 * Create a modal dialog using Pico's dialog system
 * @param {string} title - Modal title
 * @param {HTMLElement|string} content - Modal content
 * @param {Array} actions - Array of action buttons
 * @param {Object} options - Modal options
 * @returns {HTMLElement}
 */
export function createModal(title, content, actions = [], options = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = options.className || '';

  // Create article container for Pico styling
  const article = document.createElement('article');

  // Add header if title is provided
  if (title) {
    const header = document.createElement('header');
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    header.appendChild(titleEl);
    article.appendChild(header);
  }

  // Add main content
  const mainContent = document.createElement('div');
  if (typeof content === 'string') {
    mainContent.innerHTML = content;
  } else {
    mainContent.appendChild(content);
  }
  article.appendChild(mainContent);

  // Add footer with actions if provided
  if (actions.length > 0) {
    const footer = document.createElement('footer');
    actions.forEach(action => {
      const button = createButton(
        action.text,
        action.onClick,
        action.className || 'outline',
        action.options || {},
      );
      footer.appendChild(button);
    });
    article.appendChild(footer);
  }

  // Add close button if not disabled
  if (options.showClose !== false) {
    const closeBtn = createButton('×', () => closeModal(dialog), 'outline', {
      'aria-label': 'Close modal',
      title: 'Close',
    });
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '1rem';
    closeBtn.style.right = '1rem';
    article.appendChild(closeBtn);
  }

  dialog.appendChild(article);

  // Add backdrop click to close
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      closeModal(dialog);
    }
  });

  return dialog;
}

/**
 * Close a modal dialog
 * @param {HTMLElement} modal - Modal element
 */
export function closeModal(modal) {
  if (modal && modal.tagName === 'DIALOG') {
    modal.close();
  }
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

/**
 * Show a modal dialog
 * @param {HTMLElement} modal - Modal element
 */
export function showModal(modal) {
  if (modal && modal.tagName === 'DIALOG') {
    modal.showModal();
  } else {
    document.body.appendChild(modal);
  }
}
