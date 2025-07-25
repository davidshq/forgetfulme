/**
 * @fileoverview Modal and dialog components for ForgetfulMe extension
 * @module ui-components/modal-components
 * @description Provides modal, dialog, tooltip, and progress creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { ButtonComponents } from './button-components.js';

/**
 * Modal and dialog component creation utilities
 * @class ModalComponents
 * @description Provides modal, dialog, tooltip, and progress creation utilities
 *
 * @example
 * // Create a confirmation dialog
 * const dialog = ModalComponents.createConfirmDialog('Are you sure?', onConfirm, onCancel);
 *
 * // Create a modal
 * const modal = ModalComponents.createModal('Title', 'Content', actions);
 *
 * // Create a progress indicator
 * const progress = ModalComponents.createProgressIndicator('Loading...');
 */
export class ModalComponents {
  /**
   * Create a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   * @param {Object} options - Dialog options
   * @returns {HTMLElement}
   */
  static createConfirmDialog(message, onConfirm, onCancel, options = {}) {
    const actions = [
      {
        text: options.confirmText || 'Confirm',
        onClick: () => {
          this.closeModal(dialog);
          if (onConfirm) onConfirm();
        },
        className: 'primary',
      },
      {
        text: options.cancelText || 'Cancel',
        onClick: () => {
          this.closeModal(dialog);
          if (onCancel) onCancel();
        },
        className: 'secondary',
      },
    ];

    const dialog = this.createModal(
      options.title || 'Confirm',
      message,
      actions,
      {
        showClose: false,
        className: 'confirm-dialog',
        ...options,
      }
    );

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
  static createModal(title, content, actions = [], options = {}) {
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
        const button = ButtonComponents.createButton(
          action.text,
          action.onClick,
          action.className || 'outline',
          action.options || {}
        );
        footer.appendChild(button);
      });
      article.appendChild(footer);
    }

    // Add close button if not disabled
    if (options.showClose !== false) {
      const closeBtn = ButtonComponents.createButton(
        '×',
        () => this.closeModal(dialog),
        'outline',
        {
          'aria-label': 'Close modal',
          title: 'Close',
        }
      );
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '1rem';
      closeBtn.style.right = '1rem';
      article.appendChild(closeBtn);
    }

    dialog.appendChild(article);

    // Add backdrop click to close
    dialog.addEventListener('click', e => {
      if (e.target === dialog) {
        this.closeModal(dialog);
      }
    });

    return dialog;
  }

  /**
   * Close a modal dialog
   * @param {HTMLElement} modal - Modal element
   */
  static closeModal(modal) {
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
  static showModal(modal) {
    if (modal && modal.tagName === 'DIALOG') {
      modal.showModal();
    } else {
      document.body.appendChild(modal);
    }
  }

  /**
   * Create a tooltip
   * @param {HTMLElement} element - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {Object} options - Tooltip options
   */
  static createTooltip(element, text, options = {}) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;

    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip);
      this.positionTooltip(element, tooltip, options);
    });

    element.addEventListener('mouseleave', () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }

  /**
   * Position a tooltip relative to an element
   * @param {HTMLElement} element - Target element
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {Object} options - Positioning options
   */
  static positionTooltip(element, tooltip, options = {}) {
    const rect = element.getBoundingClientRect();
    const position = options.position || 'top';

    let top, left;

    switch (position) {
      case 'top':
        top = rect.top - tooltip.offsetHeight - 5;
        left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 5;
        left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
        left = rect.left - tooltip.offsetWidth - 5;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
        left = rect.right + 5;
        break;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Create a Pico progress indicator (indeterminate)
   * @param {string} ariaLabel - ARIA label for accessibility
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createProgressIndicator(ariaLabel = 'Loading', className = '') {
    const progress = document.createElement('progress');
    progress.setAttribute('aria-label', ariaLabel);
    progress.className = className.trim();
    // Indeterminate progress (no value attribute)
    return progress;
  }

  /**
   * Create a Pico progress bar with specific value
   * @param {number} value - Progress value (0-100)
   * @param {number} max - Maximum value (default: 100)
   * @param {string} ariaLabel - ARIA label for accessibility
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createProgressBar(
    value,
    max = 100,
    ariaLabel = 'Progress',
    className = ''
  ) {
    const progress = document.createElement('progress');
    progress.value = Math.min(Math.max(value, 0), max);
    progress.max = max;
    progress.setAttribute('aria-label', ariaLabel);
    progress.className = className.trim();
    return progress;
  }

  /**
   * Create a loading state with Pico progress indicator
   * @param {string} text - Loading text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createLoadingState(text = 'Loading...', className = '') {
    const container = document.createElement('div');
    container.className = `loading-state ${className}`.trim();

    const progress = this.createProgressIndicator(
      'Loading',
      'loading-progress'
    );
    container.appendChild(progress);

    if (text && text.trim()) {
      const textEl = document.createElement('div');
      textEl.className = 'loading-text';
      textEl.textContent = text;
      container.appendChild(textEl);
    }

    return container;
  }

  /**
   * Set busy state on an element using Pico's aria-busy attribute
   * @param {HTMLElement} element - Element to set busy state on
   * @param {boolean} isBusy - Whether element is busy
   */
  static setBusyState(element, isBusy) {
    if (isBusy) {
      element.setAttribute('aria-busy', 'true');
    } else {
      element.removeAttribute('aria-busy');
    }
  }

  /**
   * Create a status indicator
   * @param {string} status - Status type
   * @param {string} text - Status text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createStatusIndicator(status, text, className = '') {
    const indicator = document.createElement('div');
    indicator.className =
      `status-indicator status-${status} ${className}`.trim();

    const icon = document.createElement('span');
    icon.className = 'status-icon';

    // Set appropriate icon based on status
    switch (status) {
      case 'success':
        icon.textContent = '✓';
        break;
      case 'error':
        icon.textContent = '✗';
        break;
      case 'warning':
        icon.textContent = '⚠';
        break;
      case 'info':
        icon.textContent = 'ℹ';
        break;
      default:
        icon.textContent = '•';
    }

    const textEl = document.createElement('span');
    textEl.className = 'status-text';
    textEl.textContent = text;

    indicator.appendChild(icon);
    indicator.appendChild(textEl);

    return indicator;
  }

  /**
   * Create a tabbed interface
   * @param {Array} tabs - Tab configurations
   * @param {Object} options - Tab options
   * @returns {HTMLElement}
   */
  static createTabs(tabs, _options = {}) {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';

    const tabList = document.createElement('div');
    tabList.className = 'tab-list';

    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';

    tabs.forEach((tab, index) => {
      const tabButton = ButtonComponents.createButton(
        tab.title,
        () => this.switchTab(tabContainer, index),
        `tab-button ${index === 0 ? 'active' : ''}`
      );
      tabList.appendChild(tabButton);

      const tabPanel = document.createElement('div');
      tabPanel.className = `tab-panel ${index === 0 ? 'active' : ''}`;
      tabPanel.innerHTML = tab.content;
      tabContent.appendChild(tabPanel);
    });

    tabContainer.appendChild(tabList);
    tabContainer.appendChild(tabContent);

    return tabContainer;
  }

  /**
   * Switch between tabs
   * @param {HTMLElement} tabContainer - Tab container
   * @param {number} activeIndex - Index of active tab
   */
  static switchTab(tabContainer, activeIndex) {
    const buttons = tabContainer.querySelectorAll('.tab-button');
    const panels = tabContainer.querySelectorAll('.tab-panel');

    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex);
    });

    panels.forEach((panel, index) => {
      panel.classList.toggle('active', index === activeIndex);
    });
  }
}
