/**
 * @fileoverview Error Categorization Module for ForgetfulMe Extension
 * @module error-categorizer
 * @description Handles error categorization based on error messages and context
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Categorizer for ForgetfulMe Extension
 * @class ErrorCategorizer
 * @description Categorizes errors based on error messages and context
 *
 * @example
 * const categorizer = new ErrorCategorizer();
 * const errorInfo = categorizer.categorizeError(error, 'popup.initialize');
 */
export class ErrorCategorizer {
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
   * Initialize error categorizer
   */
  constructor() {
    // Initialize categorization patterns
    this.networkPatterns = [
      'fetch',
      'network',
      'timeout',
      'Failed to fetch',
      'connection refused',
      'network error',
      'connection error',
    ];

    this.authPatterns = [
      'auth',
      'login',
      'sign',
      'password',
      'token',
      'session',
      'User not authenticated',
    ];

    this.validationPatterns = [
      'validation',
      'invalid',
      'required',
      'format',
      'Both URL and anon key are required',
      'URL must start with https://',
      'Invalid anon key format',
      'Invalid Supabase URL: must start with https://',
      'Invalid Supabase configuration: missing URL or anon key',
    ];

    this.databasePatterns = [
      'database',
      'query',
      'table',
      'column',
      'constraint',
      'foreign key',
    ];

    this.configPatterns = [
      'config',
      'supabase',
      'Supabase client not loaded',
      'Supabase client not properly initialized',
    ];

    this.uiPatterns = [
      'DOM',
      'element',
      'null',
      'undefined',
    ];
  }

  /**
   * Categorize error based on error message and context
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @returns {Object} - Categorized error information
   */
  categorizeError(error, context) {
    const message = error.message || error.toString();

    // Network errors
    if (this._matchesPatterns(message, this.networkPatterns)) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.NETWORK,
        ErrorCategorizer.SEVERITY.MEDIUM,
        message,
        context,
        error
      );
    }

    // Authentication errors
    if (this._matchesPatterns(message, this.authPatterns)) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.AUTH,
        ErrorCategorizer.SEVERITY.HIGH,
        message,
        context,
        error
      );
    }

    // Validation errors
    if (this._matchesPatterns(message, this.validationPatterns)) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.VALIDATION,
        ErrorCategorizer.SEVERITY.LOW,
        message,
        context,
        error
      );
    }

    // Database errors
    if (this._matchesPatterns(message, this.databasePatterns)) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.DATABASE,
        ErrorCategorizer.SEVERITY.HIGH,
        message,
        context,
        error
      );
    }

    // Configuration errors
    if (this._matchesPatterns(message, this.configPatterns)) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.CONFIG,
        ErrorCategorizer.SEVERITY.MEDIUM,
        message,
        context,
        error
      );
    }

    // UI errors
    if (
      this._matchesPatterns(message, this.uiPatterns) ||
      this._isUIContext(context)
    ) {
      return this._createErrorInfo(
        ErrorCategorizer.ERROR_TYPES.UI,
        ErrorCategorizer.SEVERITY.MEDIUM,
        message,
        context,
        error
      );
    }

    // Unknown error
    return this._createErrorInfo(
      ErrorCategorizer.ERROR_TYPES.UNKNOWN,
      ErrorCategorizer.SEVERITY.MEDIUM,
      message,
      context,
      error
    );
  }

  /**
   * Check if message matches any patterns
   * @param {string} message - Error message
   * @param {Array<string>} patterns - Patterns to match against
   * @returns {boolean} - Whether message matches any pattern
   * @private
   */
  _matchesPatterns(message, patterns) {
    return patterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if context is UI-related
   * @param {string} context - Error context
   * @returns {boolean} - Whether context is UI-related
   * @private
   */
  _isUIContext(context) {
    const uiContexts = ['ui', 'popup', 'options'];
    return uiContexts.some(uiContext =>
      context.toLowerCase().includes(uiContext.toLowerCase())
    );
  }

  /**
   * Create standardized error info object
   * @param {string} type - Error type
   * @param {string} severity - Error severity
   * @param {string} message - Error message
   * @param {string} context - Error context
   * @param {Error} originalError - Original error object
   * @returns {Object} - Standardized error info
   * @private
   */
  _createErrorInfo(type, severity, message, context, originalError) {
    return {
      type,
      severity,
      message,
      context,
      originalError,
    };
  }
} 