/**
 * @fileoverview Error categorization utility
 * @module error-categorizer
 * @description Categorizes errors by type and severity
 */

/**
 * Error types for categorization
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
 * Error severity levels
 * @type {Object}
 */
const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Categorize error based on error message and context
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @returns {Object} - Categorized error information
 */
export function categorizeError(error, context) {
  const message = error.message || error.toString();

  // Network errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('HTTP') ||
    message.includes('timeout') ||
    message.includes('Failed to fetch')
  ) {
    return {
      type: ERROR_TYPES.NETWORK,
      severity: SEVERITY.MEDIUM,
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
    message.includes('User not authenticated') ||
    message.includes('JWT expired') ||
    message.includes('refresh_token') ||
    message.includes('Session expired') ||
    error.code === 'PGRST116' ||
    error.code === 'invalid_grant'
  ) {
    return {
      type: ERROR_TYPES.AUTH,
      severity: SEVERITY.HIGH,
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
      type: ERROR_TYPES.VALIDATION,
      severity: SEVERITY.LOW,
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
      type: ERROR_TYPES.DATABASE,
      severity: SEVERITY.HIGH,
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
      type: ERROR_TYPES.CONFIG,
      severity: SEVERITY.MEDIUM,
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
      type: ERROR_TYPES.UI,
      severity: SEVERITY.MEDIUM,
      message,
      context,
      originalError: error,
    };
  }

  // Unknown error
  return {
    type: ERROR_TYPES.UNKNOWN,
    severity: SEVERITY.MEDIUM,
    message,
    context,
    originalError: error,
  };
}
