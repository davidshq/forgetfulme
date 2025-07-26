/**
 * @fileoverview Error Messages Module for ForgetfulMe Extension
 * @module error-messages
 * @description Generates user-friendly error messages based on error types
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Messages for ForgetfulMe Extension
 * @class ErrorMessages
 * @description Generates user-friendly error messages based on error categorization
 *
 * @example
 * const messages = new ErrorMessages();
 * const userMessage = messages.getUserMessage(errorInfo, { showTechnical: false });
 */
export class ErrorMessages {
  /**
   * Initialize error messages
   */
  constructor() {
    // Define user-friendly messages for different error types
    this.messages = {
      NETWORK:
        'Connection error. Please check your internet connection and try again.',
      DATABASE:
        'Data error. Please try again or contact support if the problem persists.',
      UI: 'Interface error. Please refresh the page and try again.',
      UNKNOWN: 'An unexpected error occurred. Please try again.',
    };

    // Define specific auth error messages
    this.authMessages = {
      'Invalid login credentials':
        'Invalid email or password. Please try again.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least': 'Password must be at least 6 characters.',
      'Email not confirmed':
        'Please check your email and click the verification link before signing in.',
      'User not authenticated': 'Please sign in to continue.',
      default: 'Authentication error. Please try signing in again.',
    };

    // Define specific validation error messages
    this.validationMessages = {
      'Both URL and anon key are required':
        'Please enter both the Project URL and anon key.',
      'URL must start with https://': 'Project URL must start with https://',
      'Invalid anon key format': 'Please check your anon key format.',
      'Please fill in all fields': 'Please fill in all required fields.',
      'Invalid Supabase configuration: missing URL or anon key':
        'Configuration error. Please check your settings and try again.',
      'Invalid Supabase URL: must start with https://':
        'Configuration error. Please check your settings and try again.',
      default: 'Please check your input and try again.',
    };

    // Define specific config error messages
    this.configMessages = {
      'Supabase client not loaded':
        'Configuration error. Please check your Supabase settings.',
      'Invalid Supabase configuration: missing URL or anon key':
        'Configuration error. Please check your settings and try again.',
      'Invalid Supabase URL: must start with https://':
        'Configuration error. Please check your settings and try again.',
      default: 'Configuration error. Please check your settings and try again.',
    };
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   * @param {boolean} options.showTechnical - Whether to show technical details
   * @returns {string} - User-friendly error message
   */
  getUserMessage(errorInfo, options = {}) {
    const { type, message } = errorInfo;
    const showTechnical = options.showTechnical || false;

    // If technical details are requested, return the original message
    if (showTechnical) {
      return message;
    }

    // Get user-friendly message based on error type
    switch (type) {
      case 'NETWORK':
        return this.messages.NETWORK;

      case 'AUTH':
        return this._getAuthMessage(message);

      case 'VALIDATION':
        return this._getValidationMessage(message);

      case 'DATABASE':
        return this.messages.DATABASE;

      case 'CONFIG':
        return this._getConfigMessage(message);

      case 'UI':
        return this.messages.UI;

      case 'UNKNOWN':
      default:
        return this.messages.UNKNOWN;
    }
  }

  /**
   * Get authentication-specific error message
   * @param {string} message - Original error message
   * @returns {string} - User-friendly auth message
   * @private
   */
  _getAuthMessage(message) {
    // Check for specific auth error patterns
    for (const [pattern, userMessage] of Object.entries(this.authMessages)) {
      if (pattern === 'default') continue;
      if (message.includes(pattern)) {
        return userMessage;
      }
    }
    return this.authMessages.default;
  }

  /**
   * Get validation-specific error message
   * @param {string} message - Original error message
   * @returns {string} - User-friendly validation message
   * @private
   */
  _getValidationMessage(message) {
    // Check for specific validation error patterns
    for (const [pattern, userMessage] of Object.entries(
      this.validationMessages
    )) {
      if (pattern === 'default') continue;
      if (message.includes(pattern)) {
        return userMessage;
      }
    }
    return this.validationMessages.default;
  }

  /**
   * Get configuration-specific error message
   * @param {string} message - Original error message
   * @returns {string} - User-friendly config message
   * @private
   */
  _getConfigMessage(message) {
    // Check for specific config error patterns
    for (const [pattern, userMessage] of Object.entries(this.configMessages)) {
      if (pattern === 'default') continue;
      if (message.includes(pattern)) {
        return userMessage;
      }
    }
    return this.configMessages.default;
  }

  /**
   * Add custom error message for specific pattern
   * @param {string} type - Error type
   * @param {string} pattern - Error pattern to match
   * @param {string} message - User-friendly message
   */
  addCustomMessage(type, pattern, message) {
    switch (type) {
      case 'AUTH':
        this.authMessages[pattern] = message;
        break;
      case 'VALIDATION':
        this.validationMessages[pattern] = message;
        break;
      case 'CONFIG':
        this.configMessages[pattern] = message;
        break;
      default:
        this.messages[type] = message;
        break;
    }
  }

  /**
   * Get all available error messages
   * @returns {Object} - All error messages organized by type
   */
  getAllMessages() {
    return {
      general: this.messages,
      auth: this.authMessages,
      validation: this.validationMessages,
      config: this.configMessages,
    };
  }
}
