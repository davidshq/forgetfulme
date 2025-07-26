/**
 * @fileoverview Error Logging Module for ForgetfulMe Extension
 * @module error-logger
 * @description Handles error logging with appropriate severity levels
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Logger for ForgetfulMe Extension
 * @class ErrorLogger
 * @description Handles error logging with configurable severity levels
 *
 * @example
 * const logger = new ErrorLogger({ enabled: true });
 * logger.logError(errorInfo, { silent: false });
 */
export class ErrorLogger {
  /**
   * Initialize error logger
   * @param {Object} options - Logging configuration options
   * @param {boolean} options.enabled - Whether logging is enabled
   * @param {string} options.level - Minimum log level to output
   */
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || 'MEDIUM';
    this.logLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
  }

  /**
   * Log error with appropriate level
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   * @param {boolean} options.silent - Whether to suppress logging
   */
  logError(errorInfo, options = {}) {
    const { type, severity, message, context } = errorInfo;
    const silent = options.silent || false;

    if (silent || !this.enabled) return;

    // Check if error should be logged based on severity level
    if (!this._shouldLog(severity)) return;

    const logMessage = this._formatLogMessage(type, severity, message, context);

    // Log error based on severity level
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        this._logCritical(logMessage, errorInfo);
        break;
      case 'MEDIUM':
        this._logWarning(logMessage, errorInfo);
        break;
      case 'LOW':
        this._logInfo(logMessage, errorInfo);
        break;
      default:
        this._logDefault(logMessage, errorInfo);
        break;
    }
  }

  /**
   * Check if error should be logged based on severity level
   * @param {string} severity - Error severity level
   * @returns {boolean} - Whether error should be logged
   * @private
   */
  _shouldLog(severity) {
    const errorLevel = this.logLevels[severity] || 0;
    const minLevel = this.logLevels[this.level] || 0;
    return errorLevel >= minLevel;
  }

  /**
   * Format log message
   * @param {string} type - Error type
   * @param {string} severity - Error severity
   * @param {string} message - Error message
   * @param {string} context - Error context
   * @returns {string} - Formatted log message
   * @private
   */
  _formatLogMessage(type, severity, message, context) {
    return `[${type}] [${severity}] ${context}: ${message}`;
  }

  /**
   * Log critical errors
   * @param {string} message - Log message
   * @param {Object} errorInfo - Error information
   * @private
   */
  _logCritical(message, errorInfo) {
    // Critical errors should be logged with full details
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(message, {
        error: errorInfo.originalError,
        stack: errorInfo.originalError?.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log high severity warnings
   * @param {string} message - Log message
   * @param {Object} errorInfo - Error information
   * @private
   */
  _logWarning(message, errorInfo) {
    // High severity warnings logged with context
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(message, {
        context: errorInfo.context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log medium severity info
   * @param {string} message - Log message
   * @param {Object} errorInfo - Error information
   * @private
   */
  _logInfo(message, errorInfo) {
    // Medium severity info logged
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info(message, {
        context: errorInfo.context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log default errors
   * @param {string} message - Log message
   * @param {Object} errorInfo - Error information
   * @private
   */
  _logDefault(message, errorInfo) {
    // Default error logging
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(message, {
        context: errorInfo.context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Set minimum log level
   * @param {string} level - Minimum log level
   */
  setLevel(level) {
    if (this.logLevels[level]) {
      this.level = level;
    }
  }
} 