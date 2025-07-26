/**
 * @fileoverview Error Display Module for ForgetfulMe Extension
 * @module error-display
 * @description Handles error message display in the user interface
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Display for ForgetfulMe Extension
 * @class ErrorDisplay
 * @description Handles displaying error messages in the user interface
 *
 * @example
 * const display = new ErrorDisplay();
 * display.showMessage('Error message', 'error', container, { timeout: 5000 });
 */
export class ErrorDisplay {
  /**
   * Initialize error display
   */
  constructor() {
    // Default timeout values for different message types
    this.defaultTimeouts = {
      error: 10000,
      warning: 8000,
      info: 5000,
      success: 3000,
    };

    // CSS classes for different message types
    this.messageClasses = {
      error: 'message message-error',
      warning: 'message message-warning',
      info: 'message message-info',
      success: 'message message-success',
    };
  }

  /**
   * Show error message in UI
   * @param {string} message - Error message
   * @param {string} type - Message type (error, warning, info, success)
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   * @param {number} options.timeout - Auto-remove timeout in milliseconds
   * @param {boolean} options.persistent - Whether message should persist until manually removed
   */
  showMessage(message, type = 'error', container = null, options = {}) {
    if (!container) {
      // No container provided - message cannot be displayed
      return;
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = this.messageClasses[type] || this.messageClasses.error;
    messageDiv.textContent = message;

    // Add to container
    container.appendChild(messageDiv);

    // Auto-remove after timeout unless persistent
    if (!options.persistent) {
      const timeout = options.timeout || this.defaultTimeouts[type] || this.defaultTimeouts.error;
      setTimeout(() => {
        this._removeMessage(messageDiv);
      }, timeout);
    }

    return messageDiv;
  }

  /**
   * Remove a specific message element
   * @param {HTMLElement} messageElement - Message element to remove
   */
  removeMessage(messageElement) {
    this._removeMessage(messageElement);
  }

  /**
   * Remove all messages from a container
   * @param {HTMLElement} container - Container to clear messages from
   * @param {string} type - Optional message type to filter by
   */
  clearMessages(container, type = null) {
    if (!container) return;

    const selector = type 
      ? `.${this.messageClasses[type].split(' ')[1]}` 
      : '.message';
    
    const messages = container.querySelectorAll(selector);
    messages.forEach(message => this._removeMessage(message));
  }

  /**
   * Show multiple messages at once
   * @param {Array<Object>} messages - Array of message objects
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  showMessages(messages, container, options = {}) {
    if (!container || !Array.isArray(messages)) return;

    const messageElements = [];
    messages.forEach(({ message, type = 'error' }) => {
      const element = this.showMessage(message, type, container, options);
      if (element) messageElements.push(element);
    });

    return messageElements;
  }

  /**
   * Create a dismissible message with close button
   * @param {string} message - Error message
   * @param {string} type - Message type
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Message element with close button
   */
  showDismissibleMessage(message, type = 'error', container = null, options = {}) {
    if (!container) return null;

    // Create message wrapper
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `${this.messageClasses[type] || this.messageClasses.error} dismissible`;

    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    messageWrapper.appendChild(messageText);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close message');
    closeButton.addEventListener('click', () => {
      this._removeMessage(messageWrapper);
    });

    messageWrapper.appendChild(closeButton);

    // Add to container
    container.appendChild(messageWrapper);

    // Auto-remove after timeout unless persistent
    if (!options.persistent) {
      const timeout = options.timeout || this.defaultTimeouts[type] || this.defaultTimeouts.error;
      setTimeout(() => {
        this._removeMessage(messageWrapper);
      }, timeout);
    }

    return messageWrapper;
  }

  /**
   * Remove message element from DOM
   * @param {HTMLElement} messageElement - Message element to remove
   * @private
   */
  _removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }

  /**
   * Set custom timeout for message type
   * @param {string} type - Message type
   * @param {number} timeout - Timeout in milliseconds
   */
  setDefaultTimeout(type, timeout) {
    if (typeof timeout === 'number' && timeout >= 0) {
      this.defaultTimeouts[type] = timeout;
    }
  }

  /**
   * Set custom CSS class for message type
   * @param {string} type - Message type
   * @param {string} className - CSS class name
   */
  setMessageClass(type, className) {
    this.messageClasses[type] = className;
  }

  /**
   * Get current default timeouts
   * @returns {Object} - Current default timeouts
   */
  getDefaultTimeouts() {
    return { ...this.defaultTimeouts };
  }

  /**
   * Get current message classes
   * @returns {Object} - Current message classes
   */
  getMessageClasses() {
    return { ...this.messageClasses };
  }
} 