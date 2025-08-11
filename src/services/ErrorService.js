/**
 * @fileoverview Simplified error handling service for the ForgetfulMe extension
 */

import { ERROR_CATEGORIES, ERROR_SEVERITY } from '../utils/constants.js';

/**
 * Simplified error handling and user-friendly message generation
 */
export class ErrorService {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 50; // Reduced from 100
  }

  /**
   * Handle an error and return user-friendly information
   * @param {Error|string} error - Error to handle
   * @param {string} [context] - Context where error occurred
   * @returns {ErrorInfo} Processed error information
   */
  handle(error, context = 'Unknown') {
    const errorInfo = this.categorizeError(error, context);
    this.logError(errorInfo, error);
    return errorInfo;
  }

  /**
   * Categorize error and create user-friendly info
   * @param {Error|string} error - Original error
   * @param {string} context - Error context
   * @returns {ErrorInfo} Categorized error information
   */
  categorizeError(error, context) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.generateErrorCode(error, context);

    // Check config errors first since they can contain database-related words
    if (this.isConfigError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.CONFIG,
        ERROR_SEVERITY.CRITICAL,
        'Configuration error. Please check your settings.',
        errorCode,
        false,
        [
          'Go to Options and verify settings',
          'Check Supabase URL and API key',
          'Contact support if needed'
        ]
      );
    }

    if (this.isAuthError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.AUTH,
        ERROR_SEVERITY.HIGH,
        'Authentication failed. Please sign in again.',
        errorCode,
        true,
        ['Sign out and sign in again', 'Check your credentials', 'Clear browser data if needed']
      );
    }

    // Check database errors after config (to handle database timeouts correctly)
    if (this.isDatabaseError(error, errorMessage, context)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.DATABASE,
        ERROR_SEVERITY.HIGH,
        'Database error occurred. Please try again.',
        errorCode,
        true,
        ['Try again in a few moments', 'Check your connection', 'Contact support if error persists']
      );
    }

    if (this.isNetworkError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.NETWORK,
        ERROR_SEVERITY.MEDIUM,
        'Unable to connect. Please check your internet connection and try again.',
        errorCode,
        true,
        [
          'Check internet connection',
          'Try again in a few moments',
          'Contact support if problem persists'
        ]
      );
    }

    if (this.isValidationError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.VALIDATION,
        ERROR_SEVERITY.LOW,
        'Please check your input and try again.',
        errorCode,
        false,
        [
          'Review the form for errors',
          'Ensure all required fields are filled',
          'Check field formats'
        ]
      );
    }

    if (this.isStorageError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.STORAGE,
        ERROR_SEVERITY.MEDIUM,
        'Storage error occurred. Please free up space and try again.',
        errorCode,
        true,
        ['Clear browser data or cache', 'Try again', 'Free up storage space']
      );
    }

    if (this.isPermissionError(error, errorMessage)) {
      return this.createErrorInfo(
        ERROR_CATEGORIES.PERMISSION,
        ERROR_SEVERITY.HIGH,
        'Permission denied. Please check extension permissions.',
        errorCode,
        false,
        ['Check Chrome extension permissions', 'Reload the extension', 'Contact support if needed']
      );
    }

    // Default fallback
    return this.createErrorInfo(
      ERROR_CATEGORIES.UNKNOWN,
      ERROR_SEVERITY.MEDIUM,
      'An unexpected error occurred. Please try again.',
      errorCode,
      true,
      ['Try again', 'Try refreshing the page', 'Contact support with error code']
    );
  }

  /**
   * Create standardized error info object
   * @param {string} category - Error category
   * @param {string} severity - Error severity
   * @param {string} message - User-friendly message
   * @param {string} code - Error code
   * @param {boolean} retryable - Whether error is retryable
   * @param {string[]} actions - Specific actions for this error type
   * @returns {Object} Error info object
   */
  createErrorInfo(category, severity, message, code, retryable, actions) {
    return {
      category,
      severity,
      message,
      code,
      retryable,
      actions
    };
  }

  /**
   * Check if error is network-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is network-related
   */
  isNetworkError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch failed') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection') ||
      (error instanceof TypeError && message.includes('fetch'))
    );
  }

  /**
   * Check if error is authentication-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is auth-related
   */
  isAuthError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('auth failed') ||
      lowerMessage.includes('auth error') ||
      lowerMessage.includes('jwt') ||
      lowerMessage.includes('token') ||
      lowerMessage.includes('401') ||
      lowerMessage.includes('403')
    );
  }

  /**
   * Check if error is database-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @param {string} context - Error context
   * @returns {boolean} Whether error is database-related
   */
  isDatabaseError(error, message, context) {
    const lowerMessage = message.toLowerCase();
    const isDatabaseContext = context && context.includes('BookmarkService');

    return (
      isDatabaseContext ||
      lowerMessage.includes('database') ||
      lowerMessage.includes('supabase') ||
      lowerMessage.includes('query') ||
      lowerMessage.includes('connection failed') ||
      lowerMessage.includes('500')
    );
  }

  /**
   * Check if error is configuration-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is config-related
   */
  isConfigError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('config') ||
      lowerMessage.includes('invalid url') ||
      lowerMessage.includes('api key') ||
      lowerMessage.includes('not configured') ||
      lowerMessage.includes('missing supabase') ||
      lowerMessage.includes('supabase url') ||
      lowerMessage.includes('supabase key') ||
      lowerMessage.includes('supabase config')
    );
  }

  /**
   * Check if error is validation-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is validation-related
   */
  isValidationError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('invalid input') ||
      lowerMessage.includes('invalid email') ||
      lowerMessage.includes('required field') ||
      lowerMessage.includes('400')
    );
  }

  /**
   * Check if error is storage-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is storage-related
   */
  isStorageError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('storage') ||
      lowerMessage.includes('quota exceeded') ||
      lowerMessage.includes('disk full') ||
      lowerMessage.includes('cache full')
    );
  }

  /**
   * Check if error is permission-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is permission-related
   */
  isPermissionError(error, message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('permission denied') ||
      lowerMessage.includes('access denied') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('not allowed')
    );
  }

  /**
   * Generate unique error code
   * @param {Error|string} error - Original error
   * @param {string} context - Error context
   * @returns {string} Error code
   */
  generateErrorCode(error, context) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 4);
    const contextCode = context
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 3);
    return `${contextCode}-${timestamp.toUpperCase()}-${random}`;
  }

  /**
   * Log error for debugging
   * @param {ErrorInfo} errorInfo - Processed error info
   * @param {Error|string} originalError - Original error
   */
  logError(errorInfo, originalError) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      code: errorInfo.code,
      category: errorInfo.category,
      severity: errorInfo.severity,
      message: errorInfo.message,
      original:
        originalError instanceof Error
          ? { message: originalError.message, stack: originalError.stack }
          : { message: String(originalError) }
    };

    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Always log to console for debugging
    console.error(`[${errorInfo.code}] ${errorInfo.message}`, originalError);
  }

  /**
   * Get recent error log entries (for debugging)
   * @param {number} [limit=10] - Number of entries to return
   * @returns {Array} Recent error log entries
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get error log entries with optional filtering
   * @param {string} [category] - Filter by category
   * @returns {Array} Error log entries
   */
  getErrorLog(category) {
    if (category) {
      return this.errorLog.filter(entry => entry.category === category);
    }
    return [...this.errorLog];
  }

  /**
   * Clear error log entries
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}
