/**
 * @fileoverview Main Error Handler for ForgetfulMe Extension
 * @module error-handler
 * @description Coordinates error handling modules and provides unified error handling interface
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { ErrorCategorizer } from './modules/error-categorizer.js';
import { ErrorLogger } from './modules/error-logger.js';
import { ErrorMessages } from './modules/error-messages.js';
import { ErrorRetry } from './modules/error-retry.js';
import { ErrorDisplay } from './modules/error-display.js';
import { ErrorUtils } from './utils/error-utils.js';

/**
 * Main Error Handler for ForgetfulMe Extension
 * @class ErrorHandler
 * @description Coordinates error handling modules and provides unified error handling interface
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
   * Initialize error handler with dependencies
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.categorizer = new ErrorCategorizer();
    this.logger = new ErrorLogger(options.logging);
    this.messages = new ErrorMessages();
    this.retry = new ErrorRetry();
    this.display = new ErrorDisplay();
    this.utils = new ErrorUtils();
  }

  /**
   * Main error handling method
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @param {Object} options - Additional options
   * @returns {Object} - Error information and user message
   */
  handle(error, context = 'unknown', options = {}) {
    const errorInfo = this.categorizer.categorizeError(error, context);
    this.logger.logError(errorInfo, options);
    const userMessage = this.messages.getUserMessage(errorInfo, options);

    return {
      errorInfo,
      userMessage,
      shouldRetry: this.retry.shouldRetry(errorInfo),
      shouldShowToUser: this.retry.shouldShowToUser(errorInfo),
    };
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {string} context - Error context
   * @returns {Error} - Standardized error object
   */
  createError(
    message,
    type = ErrorHandler.ERROR_TYPES.UNKNOWN,
    context = 'unknown'
  ) {
    return this.utils.createError(message, type, context);
  }

  /**
   * Handle async operations with automatic error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Operation context
   * @param {Object} options - Additional options
   * @returns {Promise} - Promise that resolves with result or rejects with handled error
   */
  async handleAsync(operation, context, options = {}) {
    try {
      return await operation();
    } catch (error) {
      const errorResult = this.handle(error, context, options);

      if (errorResult.shouldShowToUser) {
        // Re-throw with user-friendly message
        throw this.createError(
          errorResult.userMessage,
          errorResult.errorInfo.type,
          context
        );
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
  showMessage(message, type = 'error', container = null, options = {}) {
    this.display.showMessage(message, type, container, options);
  }

  /**
   * Validate and sanitize user input
   * @param {string} input - User input
   * @param {string} type - Input type (email, url, text, etc.)
   * @returns {Object} - Validation result
   */
  validateInput(input, type = 'text') {
    return this.utils.validateInput(input, type);
  }
}

// Create default instance for static-like usage
const defaultHandler = new ErrorHandler();

// Add static properties to the default instance for backward compatibility
defaultHandler.ERROR_TYPES = ErrorHandler.ERROR_TYPES;
defaultHandler.SEVERITY = ErrorHandler.SEVERITY;

// Export both the class and default instance
export { ErrorHandler };
export default defaultHandler;
