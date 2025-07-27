/**
 * @fileoverview UI Messages for ForgetfulMe extension
 * @module ui-messages
 * @description Provides user-friendly message display and confirmation dialogs
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './error-handler.js';

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
      // No container provided - message cannot be displayed
      return;
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type} animate-fade-in`;
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');

    // Create message structure
    const iconEl = document.createElement('div');
    iconEl.className = 'message-icon';

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = message;

    // Set default icons based on type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    iconEl.textContent = options.icon || icons[type] || icons.info;

    // Create close button if not auto-dismissing
    let closeBtn = null;
    if (options.persistent || options.timeout === 0) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'message-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close message');
      closeBtn.onclick = () => this.removeMessage(messageEl);
    }

    // Assemble message
    messageEl.appendChild(iconEl);
    messageEl.appendChild(contentEl);
    if (closeBtn) {
      messageEl.appendChild(closeBtn);
    }

    // Add to container
    try {
      // Remove existing messages of same type if specified
      if (options.replace) {
        const existingMessages = container.querySelectorAll(`.message-${type}`);
        existingMessages.forEach(msg => this.removeMessage(msg));
      }

      container.appendChild(messageEl);
    } catch {
      // Error adding message to container
      return;
    }

    // Auto-remove after timeout (unless persistent)
    if (!options.persistent && options.timeout !== 0) {
      const timeout = options.timeout || this.getDefaultTimeout(type);
      setTimeout(() => {
        this.removeMessage(messageEl);
      }, timeout);
    }

    return messageEl;
  }

  /**
   * Remove a message element with animation
   * @param {HTMLElement} messageEl - Message element to remove
   */
  static removeMessage(messageEl) {
    if (!messageEl || !messageEl.parentNode) return;

    // Add fade out animation
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'translateY(-10px)';
    messageEl.style.transition = 'all 0.3s ease-out';

    setTimeout(() => {
      if (messageEl.parentNode) {
        try {
          messageEl.parentNode.removeChild(messageEl);
        } catch {
          // Ignore removal errors
        }
      }
    }, 300);
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
   * @param {Object} _options - Additional options (unused)
   */
  static loading(message, container, _options = {}) {
    if (!container) {
      // No container provided - loading message cannot be displayed
      return;
    }

    // Create loading message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message message-loading animate-fade-in';
    messageEl.setAttribute('role', 'status');
    messageEl.setAttribute('aria-live', 'polite');
    messageEl.setAttribute('aria-busy', 'true');

    // Create progress element
    const progress = document.createElement('progress');
    progress.setAttribute('aria-label', 'Loading');

    // Add to message
    messageEl.appendChild(progress);

    // Add message text if provided
    if (message) {
      const textEl = document.createElement('div');
      textEl.className = 'message-text';
      textEl.textContent = message;
      messageEl.appendChild(textEl);
    }

    // Add to container
    try {
      // Remove existing loading messages
      const existingLoading = container.querySelectorAll(
        '.message-loading, .loading-state, .ui-message-loading'
      );
      existingLoading.forEach(loading => this.removeMessage(loading));

      container.appendChild(messageEl);
    } catch (error) {
      ErrorHandler.handle(error, 'ui-messages.loading');
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

    const messages = container.querySelectorAll(
      '.message, .ui-message, .loading-state'
    );
    messages.forEach(message => {
      // Remove immediately without animation for clear operation
      if (message.parentNode) {
        try {
          message.parentNode.removeChild(message);
        } catch {
          // Ignore removal errors
        }
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
   * @param {Object} _options - Additional options (unused)
   */
  static showWithRetry(message, retryFunction, container, _options = {}) {
    const messageEl = this.error(message, container, _options);

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
          { className: 'message-retry-btn' }
        );
        messageEl.appendChild(retryBtn);
      } else {
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.className = 'message-retry-btn';
        retryBtn.addEventListener('click', () => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
          try {
            retryFunction();
          } catch (error) {
            // Safe console logging with fallback
            if (typeof console !== 'undefined' && console.error) {
              console.error('Retry function failed:', error);
            }
          }
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
    // Check if UIComponents is available globally or in window
    const UIComponentsAvailable =
      typeof UIComponents !== 'undefined' ||
      (typeof window !== 'undefined' && window.UIComponents);
    const UIComponentsRef = UIComponentsAvailable
      ? UIComponents || window.UIComponents
      : null;

    if (
      UIComponentsRef &&
      UIComponentsRef.createConfirmDialog &&
      UIComponentsRef.showModal
    ) {
      const confirmEl = UIComponentsRef.createConfirmDialog(
        message,
        onConfirm,
        onCancel,
        options
      );
      UIComponentsRef.showModal(confirmEl);
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
