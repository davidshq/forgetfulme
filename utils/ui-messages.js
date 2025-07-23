/**
 * @fileoverview UI Message Handler for ForgetfulMe Extension
 * @module ui-messages
 * @description Provides centralized message display functionality for user feedback
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * UI Message Handler for ForgetfulMe Extension
 * @class UIMessages
 * @description Provides centralized message display functionality for user feedback
 *
 * @example
 * // Show a success message
 * UIMessages.success('Bookmark saved successfully!', container);
 *
 * // Show an error message
 * UIMessages.error('Failed to save bookmark', container);
 *
 * // Show a confirmation dialog
 * UIMessages.confirm('Delete this bookmark?', onConfirm, onCancel, container);
 */
class UIMessages {
  /**
   * Available message types for UI feedback
   * @static
   * @type {Object}
   * @property {string} SUCCESS - Success message type
   * @property {string} ERROR - Error message type
   * @property {string} WARNING - Warning message type
   * @property {string} INFO - Information message type
   */
  static MESSAGE_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  };

  /**
   * Show a message in the UI
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, warning, info)
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static show(message, type = 'info', container = null, options = {}) {
    if (!container) {
      console.warn(
        'UIMessages.show: No container provided, falling back to console'
      );
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `ui-message ui-message-${type}`;
    messageEl.textContent = message;

    // Add icon if specified
    if (options.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'ui-message-icon';
      iconEl.textContent = options.icon;
      messageEl.insertBefore(iconEl, messageEl.firstChild);
    }

    // Add to container
    try {
      container.appendChild(messageEl);
    } catch {
      console.warn(
        'UIMessages.show: Error adding message to container, falling back to console'
      );
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    // Auto-remove after timeout
    const timeout = options.timeout || this.getDefaultTimeout(type);
    setTimeout(() => {
      if (messageEl.parentNode) {
        try {
          messageEl.parentNode.removeChild(messageEl);
        } catch {
          // Ignore removal errors
        }
      }
    }, timeout);

    return messageEl;
  }

  /**
   * Show success message
   * @param {string} message - Success message
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static success(message, container, options = {}) {
    return this.show(message, this.MESSAGE_TYPES.SUCCESS, container, {
      icon: '✅',
      ...options,
    });
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static error(message, container, options = {}) {
    return this.show(message, this.MESSAGE_TYPES.ERROR, container, {
      icon: '❌',
      ...options,
    });
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static warning(message, container, options = {}) {
    return this.show(message, this.MESSAGE_TYPES.WARNING, container, {
      icon: '⚠️',
      ...options,
    });
  }

  /**
   * Show info message
   * @param {string} message - Info message
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static info(message, container, options = {}) {
    return this.show(message, this.MESSAGE_TYPES.INFO, container, {
      icon: 'ℹ️',
      ...options,
    });
  }

  /**
   * Show loading message with Pico progress indicator
   * @param {string} message - Loading message
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static loading(message, container, options = {}) {
    if (!container) {
      console.warn(
        'UIMessages.loading: No container provided, falling back to console'
      );
      console.log(`[LOADING] ${message}`);
      return;
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'ui-message ui-message-loading';
    messageEl.setAttribute('aria-busy', 'true');

    // Add Pico progress indicator
    const progress = document.createElement('progress');
    progress.setAttribute('aria-label', 'Loading');
    progress.className = 'loading-progress';
    messageEl.appendChild(progress);

    // Add message text
    if (message) {
      const textEl = document.createElement('span');
      textEl.className = 'ui-message-text';
      textEl.textContent = message;
      messageEl.appendChild(textEl);
    }

    // Add to container
    try {
      container.appendChild(messageEl);
    } catch {
      console.warn(
        'UIMessages.loading: Error adding message to container, falling back to console'
      );
      console.log(`[LOADING] ${message}`);
      return;
    }

    // Don't auto-remove loading messages (timeout: 0)
    return messageEl;
  }

  /**
   * Clear all messages from container
   * @param {HTMLElement} container - Container element
   */
  static clear(container) {
    if (!container) return;

    const messages = container.querySelectorAll('.ui-message');
    messages.forEach(message => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    });
  }

  /**
   * Get default timeout for message type
   * @param {string} type - Message type
   * @returns {number} - Timeout in milliseconds
   */
  static getDefaultTimeout(type) {
    switch (type) {
      case this.MESSAGE_TYPES.ERROR:
        return 10000; // 10 seconds for errors
      case this.MESSAGE_TYPES.WARNING:
        return 8000; // 8 seconds for warnings
      case this.MESSAGE_TYPES.SUCCESS:
        return 5000; // 5 seconds for success
      case this.MESSAGE_TYPES.INFO:
        return 6000; // 6 seconds for info
      default:
        return 5000;
    }
  }

  /**
   * Show message with retry functionality
   * @param {string} message - Error message
   * @param {Function} retryFunction - Function to retry
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static showWithRetry(message, retryFunction, container, options = {}) {
    const messageEl = this.error(message, container, options);

    if (retryFunction) {
      // Use UIComponents if available, otherwise fall back to manual creation
      if (typeof UIComponents !== 'undefined') {
        const retryBtn = UIComponents.createButton(
          'Retry',
          () => {
            if (messageEl.parentNode) {
              messageEl.parentNode.removeChild(messageEl);
            }
            retryFunction();
          },
          'ui-message-retry-btn'
        );
        messageEl.appendChild(retryBtn);
      } else {
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.className = 'ui-message-retry-btn';
        retryBtn.addEventListener('click', () => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
          retryFunction();
        });
        messageEl.appendChild(retryBtn);
      }
    }

    return messageEl;
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Function to call on confirm
   * @param {Function} onCancel - Function to call on cancel
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static confirm(message, onConfirm, onCancel, container, options = {}) {
    // Use UIComponents if available, otherwise fall back to manual creation
    if (typeof UIComponents !== 'undefined') {
      const confirmEl = UIComponents.createConfirmDialog(
        message,
        onConfirm,
        onCancel,
        options
      );
      UIComponents.showModal(confirmEl);
      return confirmEl;
    }

    // Fallback to manual creation (legacy support)
    const confirmEl = document.createElement('div');
    confirmEl.className = 'ui-confirm';

    const messageEl = document.createElement('div');
    messageEl.className = 'ui-confirm-message';
    messageEl.textContent = message;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'ui-confirm-buttons';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = options.confirmText || 'Confirm';
    confirmBtn.className = 'ui-confirm-btn ui-confirm-btn-primary';
    confirmBtn.addEventListener('click', () => {
      if (confirmEl.parentNode) {
        confirmEl.parentNode.removeChild(confirmEl);
      }
      if (onConfirm) onConfirm();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = options.cancelText || 'Cancel';
    cancelBtn.className = 'ui-confirm-btn ui-confirm-btn-secondary';
    cancelBtn.addEventListener('click', () => {
      if (confirmEl.parentNode) {
        confirmEl.parentNode.removeChild(confirmEl);
      }
      if (onCancel) onCancel();
    });

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    confirmEl.appendChild(messageEl);
    confirmEl.appendChild(buttonContainer);

    container.appendChild(confirmEl);

    return confirmEl;
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Message type
   * @param {Object} options - Additional options
   */
  static toast(message, type = 'info', options = {}) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.textContent = message;

    toastContainer.appendChild(toastEl);

    // Auto-remove after timeout
    const timeout = options.timeout || this.getDefaultTimeout(type);
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, timeout);

    return toastEl;
  }
}

// Export for use in other files
export default UIMessages;
