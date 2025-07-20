// Centralized Error Handler for ForgetfulMe Extension
class ErrorHandler {
  // Error types for categorization
  static ERROR_TYPES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    DATABASE: 'DATABASE',
    CONFIG: 'CONFIG',
    UI: 'UI',
    UNKNOWN: 'UNKNOWN',
  };

  // Error severity levels
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
    const errorInfo = this.categorizeError(error, context);
    this.logError(errorInfo, options);
    const userMessage = this.getUserMessage(errorInfo, options);

    return {
      errorInfo,
      userMessage,
      shouldRetry: this.shouldRetry(errorInfo),
      shouldShowToUser: this.shouldShowToUser(errorInfo),
    };
  }

  /**
   * Categorize error based on error message and context
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @returns {Object} - Categorized error information
   */
  static categorizeError(error, context) {
    const message = error.message || error.toString();
    const stack = error.stack || '';

    // Network errors
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('HTTP') ||
      message.includes('timeout') ||
      message.includes('Failed to fetch')
    ) {
      return {
        type: this.ERROR_TYPES.NETWORK,
        severity: this.SEVERITY.MEDIUM,
        message,
        context,
        originalError: error,
      };
    }

    // Authentication errors
    if (
      message.includes('auth') ||
      message.includes('login') ||
      message.includes('sign') ||
      message.includes('password') ||
      message.includes('token') ||
      message.includes('session') ||
      message.includes('User not authenticated')
    ) {
      return {
        type: this.ERROR_TYPES.AUTH,
        severity: this.SEVERITY.HIGH,
        message,
        context,
        originalError: error,
      };
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('format') ||
      message.includes('Both URL and anon key are required') ||
      message.includes('URL must start with https://') ||
      message.includes('Invalid anon key format')
    ) {
      return {
        type: this.ERROR_TYPES.VALIDATION,
        severity: this.SEVERITY.LOW,
        message,
        context,
        originalError: error,
      };
    }

    // Database errors
    if (
      message.includes('database') ||
      message.includes('query') ||
      message.includes('table') ||
      message.includes('column') ||
      message.includes('constraint') ||
      message.includes('foreign key')
    ) {
      return {
        type: this.ERROR_TYPES.DATABASE,
        severity: this.SEVERITY.HIGH,
        message,
        context,
        originalError: error,
      };
    }

    // Configuration errors
    if (
      message.includes('config') ||
      message.includes('supabase') ||
      message.includes('Supabase client not loaded') ||
      message.includes('Supabase client not properly initialized')
    ) {
      return {
        type: this.ERROR_TYPES.CONFIG,
        severity: this.SEVERITY.MEDIUM,
        message,
        context,
        originalError: error,
      };
    }

    // UI errors
    if (
      message.includes('DOM') ||
      message.includes('element') ||
      message.includes('null') ||
      message.includes('undefined') ||
      context.includes('ui') ||
      context.includes('popup') ||
      context.includes('options')
    ) {
      return {
        type: this.ERROR_TYPES.UI,
        severity: this.SEVERITY.MEDIUM,
        message,
        context,
        originalError: error,
      };
    }

    // Unknown error
    return {
      type: this.ERROR_TYPES.UNKNOWN,
      severity: this.SEVERITY.MEDIUM,
      message,
      context,
      originalError: error,
    };
  }

  /**
   * Log error with appropriate level
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   */
  static logError(errorInfo, options = {}) {
    const { type, severity, message, context, originalError } = errorInfo;
    const silent = options.silent || false;

    if (silent) return;

    const logMessage = `[${type}] [${severity}] ${context}: ${message}`;

    switch (severity) {
      case this.SEVERITY.CRITICAL:
        console.error(logMessage, originalError);
        break;
      case this.SEVERITY.HIGH:
        console.error(logMessage, originalError);
        break;
      case this.SEVERITY.MEDIUM:
        console.warn(logMessage, originalError);
        break;
      case this.SEVERITY.LOW:
        console.info(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Categorized error information
   * @param {Object} options - Additional options
   * @returns {string} - User-friendly error message
   */
  static getUserMessage(errorInfo, options = {}) {
    const { type, message, context } = errorInfo;
    const showTechnical = options.showTechnical || false;

    // If technical details are requested, return the original message
    if (showTechnical) {
      return message;
    }

    // User-friendly messages based on error type
    switch (type) {
      case this.ERROR_TYPES.NETWORK:
        return 'Connection error. Please check your internet connection and try again.';

      case this.ERROR_TYPES.AUTH:
        if (message.includes('Invalid login credentials')) {
          return 'Invalid email or password. Please try again.';
        }
        if (message.includes('User already registered')) {
          return 'An account with this email already exists.';
        }
        if (message.includes('Password should be at least')) {
          return 'Password must be at least 6 characters.';
        }
        if (message.includes('Email not confirmed')) {
          return 'Please check your email and click the verification link before signing in.';
        }
        if (message.includes('User not authenticated')) {
          return 'Please sign in to continue.';
        }
        return 'Authentication error. Please try signing in again.';

      case this.ERROR_TYPES.VALIDATION:
        if (message.includes('Both URL and anon key are required')) {
          return 'Please enter both the Project URL and anon key.';
        }
        if (message.includes('URL must start with https://')) {
          return 'Project URL must start with https://';
        }
        if (message.includes('Invalid anon key format')) {
          return 'Please check your anon key format.';
        }
        if (message.includes('Please fill in all fields')) {
          return 'Please fill in all required fields.';
        }
        return 'Please check your input and try again.';

      case this.ERROR_TYPES.DATABASE:
        return 'Data error. Please try again or contact support if the problem persists.';

      case this.ERROR_TYPES.CONFIG:
        if (message.includes('Supabase client not loaded')) {
          return 'Configuration error. Please check your Supabase settings.';
        }
        return 'Configuration error. Please check your settings and try again.';

      case this.ERROR_TYPES.UI:
        return 'Interface error. Please refresh the page and try again.';

      case this.ERROR_TYPES.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determine if operation should be retried
   * @param {Object} errorInfo - Categorized error information
   * @returns {boolean} - Whether to retry
   */
  static shouldRetry(errorInfo) {
    const { type, severity } = errorInfo;

    // Retry network errors and some auth errors
    if (type === this.ERROR_TYPES.NETWORK) {
      return true;
    }

    // Don't retry validation errors or critical errors
    if (
      type === this.ERROR_TYPES.VALIDATION ||
      severity === this.SEVERITY.CRITICAL
    ) {
      return false;
    }

    // Retry medium severity errors once
    return severity === this.SEVERITY.MEDIUM;
  }

  /**
   * Determine if error should be shown to user
   * @param {Object} errorInfo - Categorized error information
   * @returns {boolean} - Whether to show to user
   */
  static shouldShowToUser(errorInfo) {
    const { type, severity } = errorInfo;

    // Always show critical and high severity errors
    if (
      severity === this.SEVERITY.CRITICAL ||
      severity === this.SEVERITY.HIGH
    ) {
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

    // Don't show low severity or unknown errors to user
    return false;
  }

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {string} context - Error context
   * @returns {Error} - Standardized error object
   */
  static createError(
    message,
    type = this.ERROR_TYPES.UNKNOWN,
    context = 'unknown'
  ) {
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
  static showMessage(message, type = 'error', container = null, options = {}) {
    if (!container) {
      // Fallback to console if no container provided
      console.error(`[UI] ${message}`);
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
    const trimmed = input.trim();

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(trimmed),
          message: emailRegex.test(trimmed)
            ? null
            : 'Please enter a valid email address.',
        };

      case 'url':
        try {
          new URL(trimmed);
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

      case 'password':
        return {
          isValid: trimmed.length >= 6,
          message:
            trimmed.length >= 6
              ? null
              : 'Password must be at least 6 characters.',
        };

      case 'text':
      default:
        return {
          isValid: trimmed.length > 0,
          message: trimmed.length > 0 ? null : 'This field is required.',
        };
    }
  }
}

// Export for use in other files
window.ErrorHandler = ErrorHandler;
