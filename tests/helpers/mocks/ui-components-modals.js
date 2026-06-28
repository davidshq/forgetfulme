/**
 * @fileoverview Modal UI component mocks
 * @module mocks/ui-components-modals
 * @description Modal mocks for the public UIComponents facade (confirmDialog, showModal)
 */

import { vi } from 'vitest';

/**
 * Creates modal UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Modal component mocks
 */
export const createModalComponents = document => ({
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
    if (onConfirm) {
      confirmBtn.addEventListener('click', onConfirm);
    }
    footer.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = options?.cancelText || 'Cancel';
    cancelBtn.className = 'secondary';
    if (onCancel) {
      cancelBtn.addEventListener('click', onCancel);
    }
    footer.appendChild(cancelBtn);

    article.appendChild(footer);
    dialog.appendChild(article);

    return dialog;
  }),
  showModal: vi.fn(modal => {
    modal.classList.add('ui-modal-show');
  }),
});
