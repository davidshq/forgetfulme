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
import UIComponents from './ui-components.js';

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
   * Remove existing transient messages from a container
   * @param {HTMLElement} container - Container element
   */
  static clearMessages(container) {
    if (!container) {
      return;
    }

    container.querySelectorAll('.ui-message').forEach(messageEl => {
      if (typeof messageEl.remove === 'function') {
        messageEl.remove();
      } else if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    });
  }

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

    if (!options.append) {
      this.clearMessages(container);
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `ui-message ui-message-${type}`;
    messageEl.setAttribute('role', 'status');
    messageEl.setAttribute(
      'aria-live',
      type === 'error' ? 'assertive' : 'polite',
    );
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
      // Error adding message to container
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

    this.clearMessages(container);

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'ui-message ui-message-loading';
    messageEl.setAttribute('aria-busy', 'true');
    messageEl.setAttribute('role', 'status');
    messageEl.setAttribute('aria-live', 'polite');

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
    } catch (error) {
      ErrorHandler.handle(error, 'ui-messages.loading');
      return;
    }

    // Don't auto-remove loading messages (timeout: 0)
    return messageEl;
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
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Function to call on confirm
   * @param {Function} onCancel - Function to call on cancel
   * @param {HTMLElement} [_container] - Unused; kept for call-site compatibility
   * @param {Object} options - Additional options
   */
  static confirm(message, onConfirm, onCancel, _container, options = {}) {
    const confirmEl = UIComponents.createConfirmDialog(
      message,
      onConfirm,
      onCancel,
      options,
    );

    UIComponents.showModal(confirmEl);
    return confirmEl;
  }
}

// Export for use in other files
export default UIMessages;
