/**
 * @fileoverview Modal UI component mocks
 * @module mocks/ui-components-modals
 * @description Modal and dialog UI component mocks
 */

import { vi } from 'vitest';

/**
 * Creates modal UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Modal component mocks
 */
export const createModalComponents = document => ({
  createModal: vi.fn((title, content, actions, options) => {
    const dialog = document.createElement('dialog');
    dialog.className = options?.className || '';

    const article = document.createElement('article');

    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }

    const mainContent = document.createElement('div');
    if (typeof content === 'string') {
      mainContent.innerHTML = content;
    } else {
      mainContent.appendChild(content);
    }
    article.appendChild(mainContent);

    if (actions && actions.length > 0) {
      const footer = document.createElement('footer');
      actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.className = action.className || 'outline';
        footer.appendChild(button);
      });
      article.appendChild(footer);
    }

    if (options?.showClose !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.className = 'outline';
      closeBtn.setAttribute('aria-label', 'Close modal');
      article.appendChild(closeBtn);
    }

    dialog.appendChild(article);
    return dialog;
  }),
  createConfirmDialog: vi.fn((message, onConfirm, onCancel, options) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';

    const article = document.createElement('article');

    const header = document.createElement('header');
    const titleEl = document.createElement('h3');
    titleEl.textContent = options?.title || 'Confirm';
    header.appendChild(titleEl);
    article.appendChild(header);

    const mainContent = document.createElement('div');
    mainContent.textContent = message;
    article.appendChild(mainContent);

    const footer = document.createElement('footer');
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = options?.confirmText || 'Confirm';
    confirmBtn.className = 'primary';
    footer.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = options?.cancelText || 'Cancel';
    cancelBtn.className = 'secondary';
    footer.appendChild(cancelBtn);

    article.appendChild(footer);
    dialog.appendChild(article);

    return dialog;
  }),
  showModal: vi.fn(modal => {
    modal.classList.add('ui-modal-show');
  }),
  closeModal: vi.fn(modal => {
    modal.classList.remove('ui-modal-show');
  }),
  createTooltip: vi.fn((element, text, _position = 'top') => {
    const tooltip = document.createElement('div');
    tooltip.className = 'ui-tooltip';
    tooltip.textContent = text;
    return tooltip;
  }),
});
