/**
 * @fileoverview Centralized Error Handler for ForgetfulMe Extension
 * @module error-handler
 * @description Provides comprehensive error handling, categorization, and user-friendly error messages
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { categorizeError } from './error-categorizer.js';
import { getUserMessage } from './error-messages.js';
import { validateInput } from './error-validator.js';

/**
 * Centralized Error Handler for ForgetfulMe Extension
 * @class ErrorHandler
 * @description Handles error categorization, logging, and user-friendly error messages
 *
 * @example
 * // Handle an error
 * const result = ErrorHandler.handle(error, 'popup.initialize');
 * console.log(result.userMessage);
 *
 * // Create a custom error
 * const error = ErrorHandler.createError('Custom error message', ErrorHandler.ERROR_TYPES.VALIDATION);
 */
class ErrorHandler {
  /**
   * Error types for categorization
   * @static
   * @type {Object}
   * @property {string} NETWORK - Network-related errors
   * @property {string} AUTH - Authentication-related errors
   * @property {string} VALIDATION - Data validation errors
   * @property {string} DATABASE - Database operation errors
   * @property {string} CONFIG - Configuration errors
   * @property {string} UI - User interface errors
   * @property {string} UNKNOWN - Unknown or uncategorized errors
   */
  static ERROR_TYPES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    DATABASE: 'DATABASE',
    CONFIG: 'CONFIG',
    UI: 'UI',
    UNKNOWN: 'UNKNOWN',
  };

  /**
   * Error severity levels
   * @static
   * @type {Object}
   * @property {string} LOW - Low severity errors (e.g., validation warnings)
   * @property {string} MEDIUM - Medium severity errors (e.g., network issues)
   * @property {string} HIGH - High severity errors (e.g., authentication failures)
   * @property {string} CRITICAL - Critical errors (e.g., data corruption)
   */
  static SEVERITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  };

  /**
   * Main error handling method
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @param {Object} options - Additional options
   * @returns {Object} - Error information and user message
   */
  static handle(error, context = 'unknown', options = {}) {
    const errorInfo = categorizeError(error, context);
    this.logError(errorInfo, options);
    const userMessage = getUserMessage(errorInfo, options);

    return {
      errorInfo,
      userMessage,
      shouldRetry: this.shouldRetry(errorInfo),
      shouldShowToUser: this.shouldShowToUser(errorInfo),
    };
  }

  /**
   * Log error with appropriate level
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   */
  static logError(errorInfo, options = {}) {
    const { severity } = errorInfo;
    const silent = options.silent || false;

    if (silent) return;

    // Log error based on severity level
    switch (severity) {
      case this.SEVERITY.CRITICAL:
      case this.SEVERITY.HIGH:
        // Critical/High severity errors logged
        break;
      case this.SEVERITY.MEDIUM:
        // Medium severity warnings logged
        break;
      case this.SEVERITY.LOW:
        // Low severity info logged
        break;
      default:
        // Default error logging
        break;
    }
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   * @returns {string} - User-friendly error message
   */
  static getUserMessage(errorInfo, options = {}) {
    return getUserMessage(errorInfo, options);
  }

  /**
   * Determine if operation should be retried.
   * This method works with retry-utils.js to provide consistent retry behavior.
   *
   * **Retryable Errors:**
   * - Network errors (connection failures, timeouts, fetch errors)
   * - Database errors (transient database issues, connection problems)
   * - Auth errors (token refresh failures, session expiration)
   *
   * **Non-Retryable Errors:**
   * - Validation errors (invalid user input, data format issues)
   * - Configuration errors (missing settings, invalid config)
   * - UI errors (DOM manipulation failures)
   *
   * **Usage with retryWithBackoff:**
   * ```javascript
   * const errorResult = ErrorHandler.handle(error, context);
   * if (errorResult.shouldRetry) {
   *   await retryWithBackoff(() => operation());
   * }
   * ```
   *
   * @param {Object} errorInfo - Categorized error information from handle()
   * @param {string} errorInfo.type - Error type (NETWORK, DATABASE, AUTH, etc.)
   * @returns {boolean} - Whether to retry the operation
   */
  static shouldRetry(errorInfo) {
    const { type } = errorInfo;

    // Retry network errors and database errors
    if (type === this.ERROR_TYPES.NETWORK || type === this.ERROR_TYPES.DATABASE) {
      return true;
    }

    // Don't retry validation errors, config errors, or UI errors
    if (
      type === this.ERROR_TYPES.VALIDATION ||
      type === this.ERROR_TYPES.CONFIG ||
      type === this.ERROR_TYPES.UI
    ) {
      return false;
    }

    // Retry auth errors
    if (type === this.ERROR_TYPES.AUTH) {
      return true;
    }

    return false;
  }

  /**
   * Determine if error should be shown to user
   * @param {Object} errorInfo - Categorized error information
   * @returns {boolean} - Whether to show to user
   */
  static shouldShowToUser(errorInfo) {
    const { type, severity } = errorInfo;

    // Show config errors to user
    if (type === this.ERROR_TYPES.CONFIG) {
      return true;
    }

    // Show validation errors to help user fix input
    if (type === this.ERROR_TYPES.VALIDATION) {
      return true;
    }

    // Show auth errors to guide user
    if (type === this.ERROR_TYPES.AUTH) {
      return true;
    }

    // Don't show database errors to user
    if (type === this.ERROR_TYPES.DATABASE) {
      return false;
    }

    // Show high severity errors
    if (severity === this.SEVERITY.HIGH) {
      return true;
    }

    return false;
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {string} context - Error context
   * @returns {Error} - Standardized error object
   */
  static createError(message, type = this.ERROR_TYPES.UNKNOWN, context = 'unknown') {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Handle async operations with automatic error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Operation context
   * @param {Object} options - Additional options
   * @returns {Promise} - Promise that resolves with result or rejects with handled error
   */
  static async handleAsync(operation, context, options = {}) {
    try {
      return await operation();
    } catch (error) {
      const errorResult = this.handle(error, context, options);

      if (errorResult.shouldShowToUser) {
        // Re-throw with user-friendly message
        throw this.createError(errorResult.userMessage, errorResult.errorInfo.type, context);
      } else {
        // Log but don't show to user
        throw error;
      }
    }
  }

  /**
   * Show error message in UI
   * @param {string} message - Error message
   * @param {string} type - Message type (error, warning, info, success)
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Additional options
   */
  static showMessage(message, type = 'error', container = null, options = {}) {
    if (!container) {
      // No container provided - message cannot be displayed
      return;
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    // Add to container
    container.appendChild(messageDiv);

    // Auto-remove after timeout
    const timeout = options.timeout || (type === 'error' ? 10000 : 5000);
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, timeout);
  }

  /**
   * Validate and sanitize user input
   * @param {string} input - User input
   * @param {string} type - Input type (email, url, text, etc.)
   * @returns {Object} - Validation result
   */
  static validateInput(input, type = 'text') {
    return validateInput(input, type);
  }
}

// Export for use in other files
export default ErrorHandler;
