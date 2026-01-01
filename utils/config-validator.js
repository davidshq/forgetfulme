/**
 * @fileoverview Configuration validation utility
 * @module config-validator
 * @description Validates configuration data
 */

import ErrorHandler from './error-handler.js';

/**
 * Validate Supabase configuration
 * @param {Object} supabaseConfig - Supabase configuration object
 * @throws {Error} When validation fails
 */
export function validateSupabaseConfig(supabaseConfig) {
  if (!supabaseConfig) {
    return; // No config to validate
  }

  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw ErrorHandler.createError(
      'Invalid Supabase configuration: missing URL or anon key',
      ErrorHandler.ERROR_TYPES.VALIDATION,
      'config-validator.validateSupabaseConfig',
    );
  }

  if (!supabaseConfig.url.startsWith('https://')) {
    throw ErrorHandler.createError(
      'Invalid Supabase URL: must start with https://',
      ErrorHandler.ERROR_TYPES.VALIDATION,
      'config-validator.validateSupabaseConfig',
    );
  }

  if (!supabaseConfig.anonKey.startsWith('eyJ')) {
    throw ErrorHandler.createError(
      'Invalid anon key format',
      ErrorHandler.ERROR_TYPES.VALIDATION,
      'config-validator.validateSupabaseConfig',
    );
  }
}

/**
 * Validate preferences configuration
 * @param {Object} preferences - Preferences object
 * @returns {Object} Validated preferences with defaults
 */
export function validatePreferences(preferences) {
  if (!preferences || !Array.isArray(preferences.customStatusTypes)) {
    return {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
    };
  }

  return preferences;
}
