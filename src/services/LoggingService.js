/**
 * @fileoverview Simplified logging service for the ForgetfulMe extension
 */

import { withServicePatterns } from '../utils/serviceHelpers.js';

/**
 * Log levels in order of severity (higher number = more severe)
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

/**
 * Default logging configuration
 */
export const DEFAULT_LOG_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  maxStoredLogs: 100 // Simple ring buffer for debugging
};

/**
 * Simplified logging service with console output and basic ring buffer
 */
export class LoggingService extends withServicePatterns(class {}) {
  /**
   * @param {StorageService} [_storageService] - Optional storage service (unused in simplified version)
   * @param {ErrorService} [errorService] - Optional error service for integration
   */
  constructor(_storageService = null, errorService = null) {
    super();
    this.errorService = errorService;
    this.config = { ...DEFAULT_LOG_CONFIG };
    this.logBuffer = [];
    this.initialized = false;
  }

  /**
   * Initialize logging service with configuration
   * @param {Object} [customConfig] - Custom logging configuration
   * @returns {Promise<void>}
   */
  async initialize(customConfig = {}) {
    try {
      this.config = { ...DEFAULT_LOG_CONFIG, ...customConfig };
      this.initialized = true;
      this.info('LoggingService', 'Logging service initialized');
    } catch (error) {
      console.error('[LoggingService] Failed to initialize:', error);
      this.initialized = true; // Allow operation with defaults
    }
  }

  /**
   * Update logging configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.info('LoggingService', 'Configuration updated');
  }

  /**
   * Log a debug message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  debug(context, message, data = null) {
    this.log(LOG_LEVELS.DEBUG, context, message, data);
  }

  /**
   * Log an info message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  info(context, message, data = null) {
    this.log(LOG_LEVELS.INFO, context, message, data);
  }

  /**
   * Log a warning message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  warn(context, message, data = null) {
    this.log(LOG_LEVELS.WARN, context, message, data);
  }

  /**
   * Log an error message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional data
   */
  error(context, message, error = null) {
    this.log(LOG_LEVELS.ERROR, context, message, error);
  }

  /**
   * Log a critical message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional data
   */
  critical(context, message, error = null) {
    this.log(LOG_LEVELS.CRITICAL, context, message, error);
  }

  /**
   * Core logging method
   * @param {number} level - Log level
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   */
  log(level, context, message, data = null) {
    if (!this.initialized) {
      console.log(`[${context}] ${message}`, data || '');
      return;
    }

    // Check if this log level should be processed
    if (level < this.config.level) {
      return;
    }

    // Create simple log entry for ring buffer
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data
    };

    // Store in ring buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.config.maxStoredLogs) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxStoredLogs);
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(level, context, message, data);
    }

    // Integrate with ErrorService for ERROR and CRITICAL levels
    if (level >= LOG_LEVELS.ERROR && this.errorService && data instanceof Error) {
      try {
        this.errorService.handle(data, context);
      } catch (error) {
        console.error('[LoggingService] Failed to integrate with ErrorService:', error);
      }
    }
  }

  /**
   * Output log entry to console
   * @param {number} level - Log level
   * @param {string} context - Context
   * @param {string} message - Message
   * @param {any} data - Additional data
   */
  outputToConsole(level, context, message, data) {
    const prefix = context ? `[${context}]` : '';
    const fullMessage = `${prefix} ${message}`;
    const output = data ? [fullMessage, data] : [fullMessage];

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(...output);
        break;
      case LOG_LEVELS.INFO:
        console.log(...output);
        break;
      case LOG_LEVELS.WARN:
        console.warn(...output);
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.CRITICAL:
        console.error(...output);
        break;
      default:
        console.log(...output);
    }
  }

  /**
   * Get recent log entries (for debugging)
   * @param {number} [limit=50] - Number of entries to return
   * @returns {Array} Recent log entries
   */
  getRecentLogs(limit = 50) {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.logBuffer = [];
    this.info('LoggingService', 'Log buffer cleared');
  }

  /**
   * Clean up resources when service is destroyed
   */
  destroy() {
    this.logBuffer = [];
    this.initialized = false;
  }
}
