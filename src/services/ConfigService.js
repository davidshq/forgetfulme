/**
 * @fileoverview Configuration management service for the ForgetfulMe extension
 */

import { DEFAULT_STATUS_TYPES } from '../utils/constants.js';
import { withServicePatterns } from '../utils/serviceHelpers.js';

/**
 * Service for managing application configuration
 */
export class ConfigService extends withServicePatterns(class {}) {
  /**
   * @param {StorageService} storageService - Storage service
   * @param {ValidationService} validationService - Validation service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(storageService, validationService, errorService) {
    super();
    this.storageService = storageService;
    this.validationService = validationService;
    this.errorService = errorService;
    this.configCache = null;
    this.statusTypesCache = null;
  }

  /**
   * Get Supabase configuration with priority:
   * 1. Options page configuration (Chrome storage) - highest priority
   * 2. Environment variables (development fallback)
   * 3. Null (configuration required)
   * @returns {Promise<Object|null>} Supabase configuration or null if not set
   */
  async getSupabaseConfig() {
    try {
      if (this.configCache) {
        return this.configCache;
      }

      // Priority 1: Check Chrome storage (options page configuration)
      const storageConfig = await this.storageService.getSupabaseConfig();

      if (storageConfig) {
        // Validate stored config
        const validation = this.validationService.validateConfig(storageConfig);
        if (validation.isValid) {
          this.configCache = validation.data;
          console.log('[ConfigService] Using options page configuration');
          return this.configCache;
        } else {
          // Invalid config, clear it
          await this.clearSupabaseConfig();
        }
      }

      // Priority 2: Check environment variables (development fallback)
      const envConfig = await this.getEnvironmentConfig();
      if (envConfig) {
        const validation = this.validationService.validateConfig(envConfig);
        if (validation.isValid) {
          this.configCache = validation.data;
          console.log('[ConfigService] Using environment variable configuration');
          return this.configCache;
        }
      }

      // Priority 3: No configuration found
      return null;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.getSupabaseConfig');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Get configuration from environment variables (development only)
   * @returns {Promise<Object|null>} Environment configuration or null
   * @private
   */
  async getEnvironmentConfig() {
    try {
      // Skip dynamic imports in ServiceWorker context where they're not allowed
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.ServiceWorkerGlobalScope !== 'undefined' &&
        globalThis instanceof globalThis.ServiceWorkerGlobalScope
      ) {
        console.log(
          '[ConfigService] Environment config not available: import() not allowed in ServiceWorker context'
        );
        return null;
      }

      // Try to load the local config file
      const { SUPABASE_CONFIG } = await import('../../supabase-config.local.js');

      if (SUPABASE_CONFIG && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        // Check if it's been configured (not placeholder values)
        if (
          SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co' &&
          SUPABASE_CONFIG.anonKey !== 'your-anon-key-here'
        ) {
          return {
            supabaseUrl: SUPABASE_CONFIG.url,
            supabaseAnonKey: SUPABASE_CONFIG.anonKey
          };
        }
      }

      return null;
    } catch (error) {
      // Config file doesn't exist or has errors - this is fine
      console.log('[ConfigService] Environment config not available:', error.message);
      return null;
    }
  }

  /**
   * Set Supabase configuration
   * @param {Object} config - Configuration object
   * @param {string} config.supabaseUrl - Supabase project URL
   * @param {string} config.supabaseAnonKey - Supabase anonymous key
   * @returns {Promise<void>}
   */
  async setSupabaseConfig(config) {
    try {
      // Validate configuration
      const validation = this.validationService.validateConfig(config);
      if (!validation.isValid) {
        this.handleAndThrow(
          new Error(`Invalid configuration: ${validation.errors.join(', ')}`),
          'ConfigService.setSupabaseConfig'
        );
      }

      // Test connection before saving
      const isValid = await this.testSupabaseConnection(validation.data);
      if (!isValid) {
        this.handleAndThrow(
          new Error('Could not connect to Supabase with provided configuration'),
          'ConfigService.setSupabaseConfig'
        );
      }

      // Save validated config
      await this.storageService.setSupabaseConfig(validation.data);
      this.configCache = validation.data;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.setSupabaseConfig');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Clear Supabase configuration
   * @returns {Promise<void>}
   */
  async clearSupabaseConfig() {
    try {
      await this.storageService.remove('supabase_config', true);
      this.configCache = null;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.clearSupabaseConfig');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Test Supabase connection
   * @param {Object} config - Configuration to test
   * @returns {Promise<boolean>} Whether connection is valid
   */
  async testSupabaseConnection(config) {
    try {
      if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
        return false;
      }

      // Simple connection test by attempting to create a client and make a basic request
      const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Supabase returns 200 for valid connection, even without specific endpoint
      return response.status === 200 || response.status === 404; // 404 is OK for root endpoint
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Supabase is configured
   * @returns {Promise<boolean>} Whether Supabase is configured
   */
  async isSupabaseConfigured() {
    const config = await this.getSupabaseConfig();
    return config !== null;
  }

  /**
   * Get status types with defaults
   * @returns {Promise<Object[]>} Array of status types
   */
  async getStatusTypes() {
    try {
      if (this.statusTypesCache) {
        return this.statusTypesCache;
      }

      let statusTypes = await this.storageService.getStatusTypes();

      if (!statusTypes || !Array.isArray(statusTypes) || statusTypes.length === 0) {
        // Initialize with defaults
        console.log('[ConfigService] Initializing with default status types');
        statusTypes = [...DEFAULT_STATUS_TYPES];
        await this.setStatusTypes(statusTypes);
      }

      this.statusTypesCache = statusTypes;
      return statusTypes;
    } catch (error) {
      this.errorService.handle(error, 'ConfigService.getStatusTypes');
      // Return defaults as fallback to avoid breaking the UI
      console.warn('[ConfigService] Failed to get status types, using defaults');
      return [...DEFAULT_STATUS_TYPES];
    }
  }

  /**
   * Set status types
   * @param {Object[]} statusTypes - Array of status type objects
   * @returns {Promise<void>}
   */
  async setStatusTypes(statusTypes) {
    try {
      // Validate status types
      const validatedTypes = this.validateStatusTypes(statusTypes);

      await this.storageService.setStatusTypes(validatedTypes);
      this.statusTypesCache = validatedTypes;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.setStatusTypes');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Add a new status type
   * @param {Object} statusType - Status type to add
   * @returns {Promise<Object>} Added status type
   */
  async addStatusType(statusType) {
    try {
      const currentTypes = (await this.storageService.get('status_types')) || [];

      // Validate new status type
      const validation = this.validationService.validateStatusType(statusType);
      if (!validation.isValid) {
        this.handleAndThrow(new Error(validation.errors.join(', ')), 'ConfigService.addStatusType');
      }

      const validated = validation.data;

      // Check for duplicate ID
      if (currentTypes.find(type => type.id === validated.id)) {
        this.handleAndThrow(
          new Error(`Status type with ID '${validated.id}' already exists`),
          'ConfigService.addStatusType'
        );
      }

      const updatedTypes = [...currentTypes, validated];
      await this.storageService.set('status_types', updatedTypes);
      this.statusTypesCache = updatedTypes;

      return validated;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.addStatusType');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Update an existing status type
   * @param {string} id - Status type ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async updateStatusType(id, updates) {
    try {
      const currentTypes = await this.getStatusTypes();
      const index = currentTypes.findIndex(type => type.id === id);

      if (index === -1) {
        this.handleAndThrow(
          new Error(`Status type with ID '${id}' not found`),
          'ConfigService.updateStatusType'
        );
      }

      const updatedType = { ...currentTypes[index], ...updates, id }; // Preserve ID
      const validated = this.validateStatusType(updatedType);

      const updatedTypes = [...currentTypes];
      updatedTypes[index] = validated;

      await this.setStatusTypes(updatedTypes);
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.updateStatusType');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Remove a status type
   * @param {string} id - Status type ID to remove
   * @returns {Promise<void>}
   */
  async removeStatusType(id) {
    try {
      const currentTypes = (await this.storageService.get('status_types')) || [];
      const typeToRemove = currentTypes.find(type => type.id === id);

      if (!typeToRemove) {
        // If type doesn't exist, just save the current types unchanged
        await this.storageService.set('status_types', currentTypes);
        return;
      }

      if (typeToRemove.is_default) {
        this.handleAndThrow(
          new Error('Cannot remove default status type'),
          'ConfigService.removeStatusType'
        );
      }

      const updatedTypes = currentTypes.filter(type => type.id !== id);
      await this.storageService.set('status_types', updatedTypes);
      this.statusTypesCache = updatedTypes;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.removeStatusType');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Get default status type
   * @returns {Promise<Object>} Default status type
   */
  async getDefaultStatusType() {
    const statusTypes = await this.getStatusTypes();
    return statusTypes.find(type => type.is_default) || statusTypes[0];
  }

  /**
   * Reset status types to defaults
   * @returns {Promise<void>}
   */
  async resetStatusTypesToDefaults() {
    try {
      const defaultTypes = [...DEFAULT_STATUS_TYPES];
      await this.setStatusTypes(defaultTypes);
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.resetStatusTypesToDefaults');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    try {
      const preferences = await this.storageService.get('user_preferences');
      if (!preferences) {
        return {
          defaultView: 'list',
          pageSize: 20,
          theme: 'light',
          showConfirmations: true
        };
      }
      return preferences;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.getUserPreferences');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<void>}
   */
  async updateUserPreferences(preferences) {
    try {
      const current = await this.getUserPreferences();
      const updated = { ...current, ...preferences };

      // Validate preferences
      const validated = this.validateUserPreferences(updated);

      await this.storageService.setUserPreferences(validated);
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.updateUserPreferences');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Reset user preferences to defaults
   * @returns {Promise<void>}
   */
  async resetUserPreferences() {
    try {
      const defaults = this.storageService.getDefaultPreferences();
      await this.storageService.setUserPreferences(defaults);
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.resetUserPreferences');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Validate status types array
   * @param {Object[]} statusTypes - Status types to validate
   * @returns {Object[]} Validated status types
   * @private
   */
  validateStatusTypes(statusTypes) {
    if (!Array.isArray(statusTypes)) {
      this.handleAndThrow(
        new Error('Status types must be an array'),
        'ConfigService.validateStatusTypes'
      );
    }

    if (statusTypes.length === 0) {
      this.handleAndThrow(
        new Error('At least one status type is required'),
        'ConfigService.validateStatusTypes'
      );
    }

    const validatedTypes = statusTypes.map(type => this.validateStatusType(type));

    // Ensure exactly one default
    const defaults = validatedTypes.filter(type => type.is_default);
    if (defaults.length === 0) {
      validatedTypes[0].is_default = true;
    } else if (defaults.length > 1) {
      // Keep only the first default
      validatedTypes.forEach((type, index) => {
        if (index > 0) type.is_default = false;
      });
    }

    // Check for duplicate IDs
    const ids = validatedTypes.map(type => type.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      this.handleAndThrow(
        new Error('Status type IDs must be unique'),
        'ConfigService.validateStatusTypes'
      );
    }

    return validatedTypes;
  }

  /**
   * Validate single status type using ValidationService
   * @param {Object} statusType - Status type to validate
   * @returns {Object} Validated status type
   * @private
   */
  validateStatusType(statusType) {
    const result = this.validationService.validateStatusType(statusType);

    if (!result.isValid) {
      this.handleAndThrow(
        new Error(result.errors?.[0] || 'Status type validation failed'),
        'ConfigService.validateStatusType'
      );
    }

    // Add is_default property for ConfigService compatibility
    return {
      ...result.data,
      is_default: Boolean(statusType.is_default)
    };
  }

  /**
   * Validate user preferences
   * @param {Object} preferences - Preferences to validate
   * @returns {Object} Validated preferences
   * @private
   */
  validateUserPreferences(preferences) {
    const defaults = this.storageService.getDefaultPreferences();
    const validated = { ...defaults };

    // Validate each preference
    if (preferences.defaultStatus && typeof preferences.defaultStatus === 'string') {
      validated.defaultStatus = preferences.defaultStatus.trim().toLowerCase();
    }

    if (typeof preferences.autoSync === 'boolean') {
      validated.autoSync = preferences.autoSync;
    }

    if (preferences.syncInterval && ['fast', 'normal', 'slow'].includes(preferences.syncInterval)) {
      validated.syncInterval = preferences.syncInterval;
    }

    if (typeof preferences.showNotifications === 'boolean') {
      validated.showNotifications = preferences.showNotifications;
    }

    if (typeof preferences.compactView === 'boolean') {
      validated.compactView = preferences.compactView;
    }

    if (
      preferences.itemsPerPage &&
      Number.isInteger(preferences.itemsPerPage) &&
      preferences.itemsPerPage > 0 &&
      preferences.itemsPerPage <= 100
    ) {
      validated.itemsPerPage = preferences.itemsPerPage;
    }

    if (
      preferences.sortBy &&
      ['created_at', 'updated_at', 'title', 'url'].includes(preferences.sortBy)
    ) {
      validated.sortBy = preferences.sortBy;
    }

    if (preferences.sortOrder && ['asc', 'desc'].includes(preferences.sortOrder)) {
      validated.sortOrder = preferences.sortOrder;
    }

    if (preferences.theme && ['light', 'dark', 'system'].includes(preferences.theme)) {
      validated.theme = preferences.theme;
    }

    return validated;
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.configCache = null;
    this.statusTypesCache = null;
  }

  /**
   * Get configuration summary for debugging
   * @returns {Promise<Object>} Configuration summary
   */
  async getConfigSummary() {
    try {
      const [supabaseConfigured, statusTypes, preferences] = await Promise.all([
        this.isSupabaseConfigured(),
        this.getStatusTypes(),
        this.getUserPreferences()
      ]);

      return {
        supabaseConfigured,
        statusTypesCount: statusTypes.length,
        defaultStatusType: statusTypes.find(type => type.is_default)?.id || 'none',
        preferences: {
          autoSync: preferences.autoSync,
          syncInterval: preferences.syncInterval,
          itemsPerPage: preferences.itemsPerPage,
          theme: preferences.theme
        }
      };
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'ConfigService.getConfigSummary');
      return { error: errorInfo.message };
    }
  }
}
