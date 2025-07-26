/**
 * @fileoverview Validation manager for configuration data
 * @module validation-manager
 * @description Handles all configuration validation logic
 */

import ErrorHandler from '../../error-handler.js';

/**
 * Validation Manager for Configuration Data
 * @class ValidationManager
 * @description Manages all configuration validation logic
 */
class ValidationManager {
  /**
   * Initialize the validation manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Validate configuration
   * @description Validates loaded configuration data
   */
  async validateConfig() {
    // Validate Supabase configuration if present
    if (this.configManager.config.supabase) {
      if (!this.configManager.config.supabase.url || !this.configManager.config.supabase.anonKey) {
        throw ErrorHandler.createError(
          'Invalid Supabase configuration: missing URL or anon key',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'validation-manager.validateConfig'
        );
      }

      if (!this.configManager.config.supabase.url.startsWith('https://')) {
        throw ErrorHandler.createError(
          'Invalid Supabase URL: must start with https://',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'validation-manager.validateConfig'
        );
      }

      if (!this.configManager.config.supabase.anonKey.startsWith('eyJ')) {
        throw ErrorHandler.createError(
          'Invalid anon key format',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'validation-manager.validateConfig'
        );
      }
    }

    // Validate preferences
    if (!Array.isArray(this.configManager.config.preferences.customStatusTypes)) {
      this.configManager.config.preferences.customStatusTypes = [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ];
    }
  }

  /**
   * Validate Supabase configuration parameters
   * @param {string} url - Supabase project URL
   * @param {string} anonKey - Supabase anon key
   * @throws {Error} If validation fails
   */
  validateSupabaseConfig(url, anonKey) {
    if (!url || !anonKey) {
      throw ErrorHandler.createError(
        'Both URL and anon key are required',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateSupabaseConfig'
      );
    }

    if (!url.startsWith('https://')) {
      throw ErrorHandler.createError(
        'URL must start with https://',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateSupabaseConfig'
      );
    }

    if (!anonKey.startsWith('eyJ')) {
      throw ErrorHandler.createError(
        'Invalid anon key format',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateSupabaseConfig'
      );
    }
  }

  /**
   * Validate status types array
   * @param {Array} statusTypes - Array of status type strings
   * @throws {Error} If validation fails
   */
  validateStatusTypes(statusTypes) {
    if (!Array.isArray(statusTypes)) {
      throw ErrorHandler.createError(
        'Status types must be an array',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateStatusTypes'
      );
    }
  }

  /**
   * Validate individual status type
   * @param {string} statusType - Status type to validate
   * @throws {Error} If validation fails
   */
  validateStatusType(statusType) {
    if (!statusType || typeof statusType !== 'string') {
      throw ErrorHandler.createError(
        'Status type must be a non-empty string',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateStatusType'
      );
    }
  }

  /**
   * Validate configuration data for import
   * @param {Object} configData - Configuration data to validate
   * @throws {Error} If validation fails
   */
  validateImportData(configData) {
    if (!configData || typeof configData !== 'object') {
      throw ErrorHandler.createError(
        'Invalid configuration data',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'validation-manager.validateImportData'
      );
    }
  }
}

export default ValidationManager; 