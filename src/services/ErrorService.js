/**
 * @fileoverview Centralized error handling service for the ForgetfulMe extension
 */

import { ERROR_CATEGORIES, ERROR_SEVERITY } from '../utils/constants.js';

/**
 * Centralized error handling and user-friendly message generation
 */
export class ErrorService {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
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

    // Network errors
    if (this.isNetworkError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Unable to connect. Please check your internet connection and try again.',
        code: errorCode,
        retryable: true,
        actions: [
          'Check internet connection',
          'Try again in a few moments',
          'Contact support if problem persists'
        ]
      };
    }

    // Authentication errors
    if (this.isAuthError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.AUTH,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Authentication failed. Please sign in again.',
        code: errorCode,
        retryable: true,
        actions: [
          'Sign out and sign in again',
          'Check your credentials',
          'Clear browser data if needed'
        ]
      };
    }

    // Validation errors
    if (this.isValidationError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.VALIDATION,
        severity: ERROR_SEVERITY.LOW,
        message: 'Please check your input and try again.',
        code: errorCode,
        retryable: false,
        actions: [
          'Review the form for errors',
          'Ensure all required fields are filled',
          'Check field formats'
        ]
      };
    }

    // Database errors
    if (this.isDatabaseError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.DATABASE,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Database error occurred. Please try again.',
        code: errorCode,
        retryable: true,
        actions: [
          'Try again in a few moments',
          'Check your connection',
          'Contact support if problem persists'
        ]
      };
    }

    // Configuration errors
    if (this.isConfigError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.CONFIG,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Configuration error. Please check your settings.',
        code: errorCode,
        retryable: false,
        actions: [
          'Go to Options and verify settings',
          'Test your Supabase connection',
          'Reset to default configuration'
        ]
      };
    }

    // Storage errors
    if (this.isStorageError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.STORAGE,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Storage error occurred. Some data may not be saved.',
        code: errorCode,
        retryable: true,
        actions: ['Try again', 'Check available storage space', 'Clear extension data if needed']
      };
    }

    // Permission errors
    if (this.isPermissionError(error, errorMessage)) {
      return {
        category: ERROR_CATEGORIES.PERMISSION,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Permission denied. Please check extension permissions.',
        code: errorCode,
        retryable: false,
        actions: [
          'Check Chrome extension permissions',
          'Reload the extension',
          'Contact support if needed'
        ]
      };
    }

    // Unknown errors
    return {
      category: ERROR_CATEGORIES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      message: 'An unexpected error occurred. Please try again.',
      code: errorCode,
      retryable: true,
      actions: ['Try again', 'Reload the page', 'Contact support with error code']
    };
  }

  /**
   * Check if error is network-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is network-related
   */
  isNetworkError(error, message) {
    const networkIndicators = [
      'network error',
      'fetch failed',
      'connection refused',
      'timeout',
      'offline',
      'no internet',
      'dns error',
      'unreachable'
    ];

    const lowerMessage = message.toLowerCase();
    return (
      networkIndicators.some(indicator => lowerMessage.includes(indicator)) ||
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
    const authIndicators = [
      'unauthorized',
      'authentication',
      'invalid token',
      'expired token',
      'access denied',
      'forbidden',
      'login required',
      '401',
      '403'
    ];

    const lowerMessage = message.toLowerCase();
    return authIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if error is validation-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is validation-related
   */
  isValidationError(error, message) {
    const validationIndicators = [
      'validation',
      'invalid input',
      'required field',
      'bad request',
      'malformed',
      'invalid format',
      '400'
    ];

    const lowerMessage = message.toLowerCase();
    return validationIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if error is database-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is database-related
   */
  isDatabaseError(error, message) {
    const dbIndicators = [
      'database',
      'postgresql',
      'supabase',
      'query failed',
      'constraint violation',
      'duplicate key',
      'foreign key',
      '500'
    ];

    const lowerMessage = message.toLowerCase();
    return dbIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if error is configuration-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is config-related
   */
  isConfigError(error, message) {
    const configIndicators = [
      'configuration',
      'missing config',
      'invalid config',
      'supabase url',
      'api key',
      'not configured'
    ];

    const lowerMessage = message.toLowerCase();
    return configIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if error is storage-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is storage-related
   */
  isStorageError(error, message) {
    const storageIndicators = [
      'storage',
      'quota exceeded',
      'disk full',
      'save failed',
      'local storage'
    ];

    const lowerMessage = message.toLowerCase();
    return storageIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if error is permission-related
   * @param {Error|string} error - Error to check
   * @param {string} message - Error message
   * @returns {boolean} Whether error is permission-related
   */
  isPermissionError(error, message) {
    const permissionIndicators = [
      'permission',
      'not allowed',
      'blocked',
      'extension disabled',
      'manifest'
    ];

    const lowerMessage = message.toLowerCase();
    return permissionIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Generate unique error code
   * @param {Error|string} error - Original error
   * @param {string} context - Error context
   * @returns {string} Error code
   */
  generateErrorCode(error, context) {
    const timestamp = Date.now().toString(36);
    const contextCode = context
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 3);
    const errorHash = this.simpleHash(error instanceof Error ? error.message : String(error));

    return `${contextCode}-${errorHash}-${timestamp}`;
  }

  /**
   * Simple hash function for error messages
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
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
          ? {
            message: originalError.message,
            stack: originalError.stack
          }
          : { message: String(originalError) }
    };

    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${errorInfo.code}] ${errorInfo.message}`, originalError);
    }
  }

  /**
   * Get recent error log entries
   * @param {number} [limit=10] - Number of entries to return
   * @returns {Array} Recent error log entries
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics by category and severity
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byCategory: {},
      bySeverity: {},
      recent24h: 0
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.errorLog.forEach(entry => {
      // Count by category
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;

      // Count by severity
      stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;

      // Count recent errors
      if (new Date(entry.timestamp) > oneDayAgo) {
        stats.recent24h++;
      }
    });

    return stats;
  }
}
