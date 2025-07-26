/**
 * @fileoverview Main configuration manager for ForgetfulMe extension
 * @module config-manager
 * @description Coordinates all configuration management modules
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../error-handler.js';
import StorageManager from './modules/storage-manager.js';
import ValidationManager from './modules/validation-manager.js';
import MigrationManager from './modules/migration-manager.js';
import EventManager from './modules/event-manager.js';
import AuthManager from './modules/auth-manager.js';
import PreferencesManager from './modules/preferences-manager.js';

/**
 * Unified Configuration Manager for ForgetfulMe Extension
 * @class ConfigManager
 * @description Coordinates all configuration management modules
 *
 * @example
 * const configManager = new ConfigManager();
 * await configManager.initialize();
 *
 * // Get Supabase configuration
 * const supabaseConfig = await configManager.getSupabaseConfig();
 *
 * // Set custom status types
 * await configManager.setCustomStatusTypes(['read', 'important', 'review']);
 */
class ConfigManager {
  /**
   * Initialize the configuration manager
   * @constructor
   * @description Sets up the configuration manager with all modules
   */
  constructor() {
    /** @type {Object} Configuration object containing all settings */
    this.config = {
      /** @type {Object|null} Supabase configuration */
      supabase: null,
      /** @type {Object|null} User preferences */
      preferences: null,
      /** @type {Object|null} Authentication session */
      auth: null,
    };
    /** @type {boolean} Whether the manager has been initialized */
    this.initialized = false;

    // Initialize modules
    this.storage = new StorageManager(this);
    this.validation = new ValidationManager(this);
    this.migration = new MigrationManager(this);
    this.events = new EventManager(this);
    this.auth = new AuthManager(this);
    this.preferences = new PreferencesManager(this);

    // Expose listeners for backward compatibility
    Object.defineProperty(this, 'listeners', {
      get: () => this.events.listeners,
      enumerable: true,
    });
  }

  /**
   * Initialize configuration manager
   * @description Loads configuration from storage and validates settings
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load all configuration from storage
      await this.storage.loadAllConfig();

      // Validate configuration
      await this.validation.validateConfig();

      // Set up migration if needed
      await this.migration.migrateConfig();

      this.initialized = true;
      this.events.notifyListeners('initialized');
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-manager.initialize'
      );
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'config-manager.initialize'
      );
    }
  }

  /**
   * Get Supabase configuration
   * @returns {Promise<Object|null>} Supabase configuration object
   */
  async getSupabaseConfig() {
    await this.ensureInitialized();
    return this.config.supabase;
  }

  /**
   * Set Supabase configuration
   * @param {string} url - Supabase project URL
   * @param {string} anonKey - Supabase anon key
   * @description Saves Supabase configuration to storage
   */
  async setSupabaseConfig(url, anonKey) {
    await this.ensureInitialized();
    
    // Validate input
    this.validation.validateSupabaseConfig(url, anonKey);
    
    return await this.storage.setSupabaseConfig(url, anonKey);
  }

  /**
   * Check if Supabase is configured
   * @returns {Promise<boolean>} True if Supabase is configured
   */
  async isSupabaseConfigured() {
    await this.ensureInitialized();
    return this.config.supabase !== null;
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences object
   */
  async getPreferences() {
    await this.ensureInitialized();
    return this.config.preferences;
  }

  /**
   * Set user preferences
   * @param {Object} preferences - Preferences object to save
   * @description Saves user preferences to storage
   */
  async setPreferences(preferences) {
    await this.ensureInitialized();
    return await this.preferences.setPreferences(preferences);
  }

  /**
   * Get custom status types
   * @returns {Promise<Array>} Array of custom status types
   */
  async getCustomStatusTypes() {
    await this.ensureInitialized();
    return this.config.preferences.customStatusTypes;
  }

  /**
   * Set custom status types
   * @param {Array} statusTypes - Array of status type strings
   * @description Saves custom status types to preferences
   */
  async setCustomStatusTypes(statusTypes) {
    await this.ensureInitialized();
    return await this.preferences.setCustomStatusTypes(statusTypes);
  }

  /**
   * Add custom status type
   * @param {string} statusType - Status type to add
   * @description Adds a new status type to the list
   */
  async addCustomStatusType(statusType) {
    await this.ensureInitialized();
    return await this.preferences.addCustomStatusType(statusType);
  }

  /**
   * Remove custom status type
   * @param {string} statusType - Status type to remove
   * @description Removes a status type from the list
   */
  async removeCustomStatusType(statusType) {
    await this.ensureInitialized();
    return await this.preferences.removeCustomStatusType(statusType);
  }

  /**
   * Get authentication session
   * @returns {Promise<Object|null>} Authentication session object
   */
  async getAuthSession() {
    await this.ensureInitialized();
    return this.config.auth;
  }

  /**
   * Set authentication session
   * @param {Object|null} session - Authentication session object
   * @description Saves authentication session to storage
   */
  async setAuthSession(session) {
    await this.ensureInitialized();
    return await this.auth.setAuthSession(session);
  }

  /**
   * Clear authentication session
   * @description Removes authentication session from storage
   */
  async clearAuthSession() {
    await this.ensureInitialized();
    return await this.auth.clearAuthSession();
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if user is authenticated
   */
  async isAuthenticated() {
    await this.ensureInitialized();
    return this.config.auth !== null;
  }

  /**
   * Initialize default settings
   * @description Sets up default configuration values
   */
  async initializeDefaultSettings() {
    return await this.storage.initializeDefaultSettings();
  }

  /**
   * Export configuration
   * @returns {Promise<Object>} Configuration export object
   * @description Exports all configuration data for backup
   */
  async exportConfig() {
    await this.ensureInitialized();
    return await this.storage.exportConfig();
  }

  /**
   * Import configuration
   * @param {Object} configData - Configuration data to import
   * @description Imports configuration data from backup
   */
  async importConfig(configData) {
    await this.ensureInitialized();
    return await this.storage.importConfig(configData);
  }

  /**
   * Add event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function to execute
   * @description Registers a callback for configuration events
   */
  addListener(event, callback) {
    this.events.addListener(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name to remove listener from
   * @param {Function} callback - Callback function to remove
   * @description Removes a specific event listener
   */
  removeListener(event, callback) {
    this.events.removeListener(event, callback);
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name to notify
   * @param {*} data - Data to pass to listeners
   * @description Executes all registered callbacks for an event
   */
  notifyListeners(event, data) {
    this.events.notifyListeners(event, data);
  }

  /**
   * Ensure manager is initialized
   * @description Initializes manager if not already done
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Reset configuration to defaults
   * @description Clears all configuration and resets to defaults
   */
  async reset() {
    return await this.storage.reset();
  }

  /**
   * Get configuration summary
   * @returns {Object} Summary object with configuration status
   * @description Returns a summary of current configuration state
   */
  getConfigSummary() {
    return {
      initialized: this.initialized,
      supabaseConfigured: this.config.supabase !== null,
      hasAuthSession: this.config.auth !== null,
      statusTypesCount: this.config.preferences?.customStatusTypes?.length || 0,
    };
  }

  // Legacy methods for backward compatibility
  async loadAllConfig() {
    return await this.storage.loadAllConfig();
  }

  async validateConfig() {
    return await this.validation.validateConfig();
  }

  async migrateConfig() {
    return await this.migration.migrateConfig();
  }
}

// Export for use in other files
export default ConfigManager; 