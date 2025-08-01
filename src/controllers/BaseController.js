/**
 * @fileoverview Base controller class with common functionality
 */

import {
  $,
  show,
  hide,
  setText,
  createElement,
  clearElement,
  setTrustedHTML
} from '../utils/dom.js';
import { formatDate } from '../utils/formatting.js';
import { TIMEOUTS } from '../utils/constants.js';

/**
 * Base controller class for common functionality
 */
export class BaseController {
  /**
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(errorService) {
    this.errorService = errorService;
    this.cleanupFunctions = [];
    this.messageTimeout = null;
  }

  /**
   * Initialize the controller
   * @returns {Promise<void>}
   */
  async initialize() {
    // Override in subclasses
  }

  /**
   * Cleanup resources when controller is destroyed
   */
  destroy() {
    // Clear all event listeners and timeouts
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions = [];

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  /**
   * Add a cleanup function to be called on destroy
   * @param {Function} cleanupFn - Cleanup function
   */
  addCleanup(cleanupFn) {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * Show a message to the user
   * @param {string} text - Message text
   * @param {string} [type='info'] - Message type: success, error, warning, info
   * @param {number} [duration=TIMEOUTS.MESSAGE_DEFAULT] - Duration in milliseconds (0 for permanent)
   */
  showMessage(text, type = 'info', duration = TIMEOUTS.MESSAGE_DEFAULT) {
    try {
      const messageArea = $('#message-area');
      if (!messageArea) {
        console.warn('Message area not found');
        return;
      }

      // Create message element
      const message = createElement(
        'div',
        {
          className: `message ${type}`,
          'data-testid': `message-${type}`
        },
        text
      );

      // Add to message area
      messageArea.appendChild(message);

      // Auto-remove after duration
      let autoRemoveTimeout = null;
      if (duration > 0) {
        autoRemoveTimeout = setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, duration);
      }

      // Add click to dismiss
      const dismissHandler = () => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
        if (autoRemoveTimeout) {
          clearTimeout(autoRemoveTimeout);
          autoRemoveTimeout = null;
        }
      };
      message.addEventListener('click', dismissHandler);

      // Add cleanup for both event listener and timeout
      this.addCleanup(() => {
        message.removeEventListener('click', dismissHandler);
        if (autoRemoveTimeout) {
          clearTimeout(autoRemoveTimeout);
          autoRemoveTimeout = null;
        }
        // Remove message from DOM if still present
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      });
    } catch (error) {
      console.error('Error showing message:', error);
    }
  }

  /**
   * Show success message
   * @param {string} text - Message text
   * @param {number} [duration=TIMEOUTS.MESSAGE_SUCCESS] - Duration in milliseconds
   */
  showSuccess(text, duration = TIMEOUTS.MESSAGE_SUCCESS) {
    this.showMessage(text, 'success', duration);
  }

  /**
   * Show error message
   * @param {string} text - Message text
   * @param {number} [duration=7000] - Duration in milliseconds
   */
  showError(text, duration = 7000) {
    this.showMessage(text, 'error', duration);
  }

  /**
   * Show warning message
   * @param {string} text - Message text
   * @param {number} [duration=TIMEOUTS.MESSAGE_WARNING] - Duration in milliseconds
   */
  showWarning(text, duration = TIMEOUTS.MESSAGE_WARNING) {
    this.showMessage(text, 'warning', duration);
  }

  /**
   * Show info message
   * @param {string} text - Message text
   * @param {number} [duration=TIMEOUTS.MESSAGE_INFO] - Duration in milliseconds
   */
  showInfo(text, duration = TIMEOUTS.MESSAGE_INFO) {
    this.showMessage(text, 'info', duration);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
      while (messageArea.firstChild) {
        messageArea.removeChild(messageArea.firstChild);
      }
    }
  }

  /**
   * Handle error and show user-friendly message
   * @param {Error|string} error - Error to handle
   * @param {string} context - Context where error occurred
   * @param {string} [fallbackMessage] - Fallback message if error handling fails
   */
  handleError(error, context, fallbackMessage = 'An unexpected error occurred') {
    try {
      const errorInfo = this.errorService.handle(error, context);
      this.showError(errorInfo.message);

      // Log detailed error for debugging
      console.error(`[${context}] ${errorInfo.code}:`, error);

      return errorInfo;
    } catch (handlingError) {
      console.error('Error in error handling:', handlingError);
      this.showError(fallbackMessage);
      return null;
    }
  }

  /**
   * Show loading state
   * @param {string|Element} target - Target element or selector
   * @param {string} [message='Loading...'] - Loading message
   */
  showLoading(target, message = 'Loading...') {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    // Create loading content
    const loadingContent = createElement(
      'div',
      {
        className: 'loading-state',
        'data-testid': 'loading-state'
      },
      [createElement('div', { className: 'loading-spinner' }), createElement('p', {}, message)]
    );

    // Store original content
    element.dataset.originalContent = element.innerHTML;

    // Replace with loading
    clearElement(element);
    element.appendChild(loadingContent);
  }

  /**
   * Hide loading state and restore original content
   * @param {string|Element} target - Target element or selector
   */
  hideLoading(target) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;

    // Restore original content
    if (element.dataset.originalContent) {
      setTrustedHTML(element, element.dataset.originalContent);
      delete element.dataset.originalContent;
    }
  }

  /**
   * Show/hide elements based on condition
   * @param {string|Element} element - Element or selector
   * @param {boolean} condition - Whether to show or hide
   */
  toggleElement(element, condition) {
    const el = typeof element === 'string' ? $(element) : element;
    if (!el) return;

    if (condition) {
      show(el);
    } else {
      hide(el);
    }
  }

  /**
   * Set text content safely
   * @param {string|Element} element - Element or selector
   * @param {string} text - Text to set
   */
  setText(element, text) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el) {
      setText(el, text);
    }
  }

  /**
   * Add event listener with automatic cleanup
   * @param {Element} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {boolean|Object} [options] - Event options
   */
  addEventListener(element, event, handler, options = false) {
    if (!element) return;

    element.addEventListener(event, handler, options);

    // Add cleanup function
    this.addCleanup(() => {
      element.removeEventListener(event, handler, options);
    });
  }

  /**
   * Safely execute an async operation with error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Context for error handling
   * @param {string} [loadingTarget] - Element to show loading state
   * @param {string} [loadingMessage] - Loading message
   * @returns {Promise<*>} Operation result or null if error
   */
  async safeExecute(operation, context, loadingTarget = null, loadingMessage = 'Loading...') {
    try {
      if (loadingTarget) {
        this.showLoading(loadingTarget, loadingMessage);
      }

      const result = await operation();

      if (loadingTarget) {
        this.hideLoading(loadingTarget);
      }

      return result;
    } catch (error) {
      if (loadingTarget) {
        this.hideLoading(loadingTarget);
      }

      this.handleError(error, context);
      return null;
    }
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @param {string} [format='relative'] - Format type
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'relative') {
    return formatDate(date, format);
  }

  /**
   * Debounce a function call
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;

    const debouncedFn = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };

    // Add cleanup
    this.addCleanup(() => {
      clearTimeout(timeoutId);
    });

    return debouncedFn;
  }

  /**
   * Create a status indicator element
   * @param {Object} statusType - Status type configuration
   * @returns {Element} Status indicator element
   */
  createStatusIndicator(statusType) {
    if (!statusType) return createElement('span', {}, '');

    const indicator = createElement(
      'span',
      {
        className: 'status-indicator',
        'data-status': statusType.id
      },
      [
        createElement('span', {
          className: 'status-dot',
          style: `background-color: ${statusType.color}`
        }),
        createElement('span', {}, statusType.name)
      ]
    );

    indicator.style.backgroundColor = `${statusType.color}20`; // 20% opacity
    indicator.style.color = statusType.color;
    indicator.style.borderColor = `${statusType.color}40`; // 40% opacity

    return indicator;
  }

  /**
   * Create tag elements
   * @param {string[]} tags - Array of tags
   * @returns {Element} Tag container element
   */
  createTagElements(tags) {
    if (!tags || tags.length === 0) {
      return createElement('div', { className: 'tag-list' });
    }

    const tagElements = tags.map(tag => createElement('span', { className: 'tag' }, tag));

    return createElement('div', { className: 'tag-list' }, tagElements);
  }

  /**
   * Validate form data
   * @param {HTMLFormElement} form - Form element
   * @returns {Object|null} Form data object or null if invalid
   */
  getFormData(form) {
    if (!form) return null;

    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }

    return data;
  }

  /**
   * Reset form to initial state
   * @param {HTMLFormElement} form - Form element
   */
  resetForm(form) {
    if (!form) return;

    form.reset();

    // Clear any validation messages
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.remove());

    // Remove error classes
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(el => el.classList.remove('error'));
  }

  /**
   * Open URL in new tab
   * @param {string} url - URL to open
   */
  openInNewTab(url) {
    if (!url) return;

    try {
      if (chrome && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      this.handleError(error, 'BaseController.openInNewTab');
    }
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Whether copy was successful
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = createElement('textarea', { value: text });
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (error) {
      this.handleError(error, 'BaseController.copyToClipboard');
      return false;
    }
  }
}
