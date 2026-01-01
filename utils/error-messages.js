/**
 * @fileoverview User-friendly error messages
 * @module error-messages
 * @description Provides user-friendly error messages based on error type
 */

/**
 * Error types
 * @type {Object}
 */
const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  CONFIG: 'CONFIG',
  UI: 'UI',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Get user-friendly error message
 * @param {Object} errorInfo - Categorized error information
 * @param {Object} options - Additional options
 * @returns {string} - User-friendly error message
 */
export function getUserMessage(errorInfo, options = {}) {
  const { type, message } = errorInfo;
  const showTechnical = options.showTechnical || false;

  // If technical details are requested, return the original message
  if (showTechnical) {
    return message;
  }

  // User-friendly messages based on error type
  const messageMap = {
    [ERROR_TYPES.NETWORK]: message.includes('offline')
      ? 'You are currently offline. Operations will be queued and processed when you are back online.'
      : 'Connection error. Please check your internet connection and try again.',

    [ERROR_TYPES.AUTH]: getAuthMessage(message),

    [ERROR_TYPES.VALIDATION]: getValidationMessage(message),

    [ERROR_TYPES.DATABASE]:
      'Data error. Please try again or contact support if the problem persists.',

    [ERROR_TYPES.CONFIG]: getConfigMessage(message),

    [ERROR_TYPES.UI]: 'Interface error. Please refresh the page and try again.',

    [ERROR_TYPES.UNKNOWN]:
      'An unexpected error occurred. Please refresh the page and try again. If the problem persists, contact support.',
  };

  return messageMap[type] || messageMap[ERROR_TYPES.UNKNOWN];
}

/**
 * Get authentication-specific error message
 * @param {string} message - Original error message
 * @returns {string} User-friendly auth error message
 */
function getAuthMessage(message) {
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
  if (
    message.includes('Token refresh has failed permanently') ||
    message.includes('Invalid refresh token') ||
    message.includes('refresh_token_not_found')
  ) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('Session expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('JWT expired') || message.includes('token') || message.includes('session')) {
    return 'Your session has expired. Please sign in again.';
  }
  return 'Authentication error. Please try signing in again.';
}

/**
 * Get validation-specific error message
 * @param {string} message - Original error message
 * @returns {string} User-friendly validation error message
 */
function getValidationMessage(message) {
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
}

/**
 * Get configuration-specific error message
 * @param {string} message - Original error message
 * @returns {string} User-friendly config error message
 */
function getConfigMessage(message) {
  if (message.includes('Supabase client not loaded')) {
    return 'Configuration error. Please check your Supabase settings.';
  }
  return 'Configuration error. Please check your settings and try again.';
}
