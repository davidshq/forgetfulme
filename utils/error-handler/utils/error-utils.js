/**
 * @fileoverview Error Utilities for ForgetfulMe Extension
 * @module error-utils
 * @description Shared error handling utilities and helper functions
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Utilities for ForgetfulMe Extension
 * @class ErrorUtils
 * @description Provides utility functions for error handling
 *
 * @example
 * const utils = new ErrorUtils();
 * const error = utils.createError('Custom error', 'VALIDATION', 'form.submit');
 * const validation = utils.validateInput('test@example.com', 'email');
 */
export class ErrorUtils {
  /**
   * Initialize error utilities
   */
  constructor() {
    // Validation patterns
    this.validationPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/.+/,
      password: /^.{6,}$/,
    };

    // Error types for createError method
    this.errorTypes = {
      NETWORK: 'NETWORK',
      AUTH: 'AUTH',
      VALIDATION: 'VALIDATION',
      DATABASE: 'DATABASE',
      CONFIG: 'CONFIG',
      UI: 'UI',
      UNKNOWN: 'UNKNOWN',
    };
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {string} context - Error context
   * @returns {Error} - Standardized error object
   */
  createError(message, type = this.errorTypes.UNKNOWN, context = 'unknown') {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Validate and sanitize user input
   * @param {string} input - User input
   * @param {string} type - Input type (email, url, text, password, etc.)
   * @returns {Object} - Validation result
   */
  validateInput(input, type = 'text') {
    const trimmed = input.trim();

    switch (type) {
      case 'email':
        return this._validateEmail(trimmed);

      case 'url':
        return this._validateUrl(trimmed);

      case 'password':
        return this._validatePassword(trimmed);

      case 'text':
      default:
        return this._validateText(trimmed);
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   * @private
   */
  _validateEmail(email) {
    const isValid = this.validationPatterns.email.test(email);
    return {
      isValid,
      message: isValid ? null : 'Please enter a valid email address.',
    };
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {Object} - Validation result
   * @private
   */
  _validateUrl(url) {
    try {
      new URL(url);
      return {
        isValid: true,
        message: null,
      };
    } catch {
      return {
        isValid: false,
        message: 'Please enter a valid URL.',
      };
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   * @private
   */
  _validatePassword(password) {
    const isValid = this.validationPatterns.password.test(password);
    return {
      isValid,
      message: isValid ? null : 'Password must be at least 6 characters.',
    };
  }

  /**
   * Validate text input
   * @param {string} text - Text to validate
   * @returns {Object} - Validation result
   * @private
   */
  _validateText(text) {
    const isValid = text.length > 0;
    return {
      isValid,
      message: isValid ? null : 'This field is required.',
    };
  }

  /**
   * Check if an object is an Error instance
   * @param {*} obj - Object to check
   * @returns {boolean} - Whether object is an Error
   */
  isError(obj) {
    return obj instanceof Error;
  }

  /**
   * Extract error information from various error formats
   * @param {*} error - Error object or string
   * @returns {Object} - Standardized error information
   */
  extractErrorInfo(error) {
    if (this.isError(error)) {
      return {
        message: error.message,
        stack: error.stack,
        type: error.type || 'UNKNOWN',
        context: error.context || 'unknown',
        timestamp: error.timestamp || new Date().toISOString(),
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        stack: null,
        type: 'UNKNOWN',
        context: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: 'Unknown error occurred',
      stack: null,
      type: 'UNKNOWN',
      context: 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format error for logging
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {string} - Formatted error string
   */
  formatErrorForLogging(error, context = 'unknown') {
    const errorInfo = this.extractErrorInfo(error);
    return `[${errorInfo.type}] [${context}] ${errorInfo.message}`;
  }

  /**
   * Add custom validation pattern
   * @param {string} name - Pattern name
   * @param {RegExp} pattern - Regular expression pattern
   */
  addValidationPattern(name, pattern) {
    if (pattern instanceof RegExp) {
      this.validationPatterns[name] = pattern;
    }
  }

  /**
   * Get all validation patterns
   * @returns {Object} - All validation patterns
   */
  getValidationPatterns() {
    return { ...this.validationPatterns };
  }

  /**
   * Get all error types
   * @returns {Object} - All error types
   */
  getErrorTypes() {
    return { ...this.errorTypes };
  }
} 