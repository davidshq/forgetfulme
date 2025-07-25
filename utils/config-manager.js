/**
 * @fileoverview Configuration manager for ForgetfulMe extension
 * @module config-manager
 * @description Manages extension configuration, preferences, and storage operations
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './error-handler.js';

/**
 * Unified Configuration Manager for ForgetfulMe Extension
 * @class ConfigManager
 * @description Consolidates all configuration logic and storage operations
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
   * @description Sets up the configuration manager with initial state and listener management
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
    /** @type {Set} Set of event listeners */
    this.listeners = new Set();
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
      await this.loadAllConfig();

      // Validate configuration
      await this.validateConfig();

      // Set up migration if needed
      await this.migrateConfig();

      this.initialized = true;
      this.notifyListeners('initialized');
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'config-manager.initialize');
      throw ErrorHandler.createError(errorResult.userMessage, errorResult.errorInfo.type, 'config-manager.initialize');
    }
  }

  /**
   * Load all configuration from storage
   * @description Retrieves all configuration data from Chrome sync storage
   */
  async loadAllConfig() {
    try {
      console.log('ConfigManager: Loading all config from Chrome storage...');
      console.log('ConfigManager: chrome object exists?', typeof chrome !== 'undefined');
      console.log('ConfigManager: chrome.storage exists?', typeof chrome !== 'undefined' && chrome.storage);
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('ConfigManager: Chrome APIs not available, using defaults');
        this.config.supabase = null;
        this.config.preferences = {
          customStatusTypes: [
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ],
        };
        this.config.auth = null;
        return;
      }
      
      const result = await chrome.storage.sync.get([
        'supabaseConfig',
        'customStatusTypes',
        'auth_session',
      ]);
      console.log('ConfigManager: Chrome storage result:', result);

      this.config.supabase = result.supabaseConfig || null;
      this.config.preferences = {
        customStatusTypes: result.customStatusTypes || [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
        ],
      };
      this.config.auth = result.auth_session || null;
      
      console.log('ConfigManager: Final config:', this.config);
    } catch (error) {
      console.error('ConfigManager: Error loading config:', error);
      const errorResult = ErrorHandler.handle(error, 'config-manager.loadAllConfig');
      throw ErrorHandler.createError(errorResult.userMessage, errorResult.errorInfo.type, 'config-manager.loadAllConfig');
    }
  }

  /**
   * Validate configuration
   * @description Validates loaded configuration data
   */
  async validateConfig() {
    // Validate Supabase configuration if present
    if (this.config.supabase) {
      if (!this.config.supabase.url || !this.config.supabase.anonKey) {
        throw ErrorHandler.createError(
          'Invalid Supabase configuration: missing URL or anon key',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'config-manager.validateConfig'
        );
      }

      if (!this.config.supabase.url.startsWith('https://')) {
        throw ErrorHandler.createError(
          'Invalid Supabase URL: must start with https://',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'config-manager.validateConfig'
        );
      }

      if (!this.config.supabase.anonKey.startsWith('eyJ')) {
        throw ErrorHandler.createError(
          'Invalid anon key format',
          ErrorHandler.ERROR_TYPES.VALIDATION,
          'config-manager.validateConfig'
        );
      }
    }

    // Validate preferences
    if (!Array.isArray(this.config.preferences.customStatusTypes)) {
      this.config.preferences.customStatusTypes = [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ];
    }
  }

  /**
   * Migrate configuration to latest version
   * @description Handles configuration migration between versions
   */
  async migrateConfig() {
    try {
      // Check if migration is needed
      const migrationVersion = await this.getMigrationVersion();

      if (migrationVersion < 1) {
        // Migrate to version 1
        await this.migrateToVersion1();
        await this.setMigrationVersion(1);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'config-manager.migrateConfig');
      // Don't throw - migration errors shouldn't break the app
    }
  }

  /**
   * Migrate to version 1 configuration
   * @description Performs migration to version 1 format
   */
  async migrateToVersion1() {
    // Migration logic for version 1
    // This is where we'd handle any breaking changes in configuration format
    // Migrating configuration to version 1
  }

  /**
   * Get current migration version
   * @returns {Promise<number>} Current migration version
   */
  async getMigrationVersion() {
    try {
      const result = await chrome.storage.sync.get(['configVersion']);
      return result.configVersion || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Set migration version
   * @param {number} version - Version number to set
   */
  async setMigrationVersion(version) {
    try {
      await chrome.storage.sync.set({ configVersion: version });
    } catch (error) {
      // Error setting migration version
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
    if (!url || !anonKey) {
      throw ErrorHandler.createError(
        'Both URL and anon key are required',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.setSupabaseConfig'
      );
    }

    if (!url.startsWith('https://')) {
      throw ErrorHandler.createError(
        'URL must start with https://',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.setSupabaseConfig'
      );
    }

    if (!anonKey.startsWith('eyJ')) {
      throw ErrorHandler.createError(
        'Invalid anon key format',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.setSupabaseConfig'
      );
    }

    // Update configuration
    this.config.supabase = { url, anonKey };

    // Save to storage
    await chrome.storage.sync.set({
      supabaseConfig: this.config.supabase,
    });

    this.notifyListeners('supabaseConfigChanged', this.config.supabase);

    return { success: true, message: 'Configuration saved successfully' };
  }

  /**
   * Check if Supabase is configured
   * @returns {Promise<boolean>} True if Supabase is configured
   */
  async isSupabaseConfigured() {
    await this.ensureInitialized();
    console.log('ConfigManager: isSupabaseConfigured called, supabase config:', this.config.supabase);
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

    // Merge with existing preferences
    this.config.preferences = {
      ...this.config.preferences,
      ...preferences,
    };

    // Save to storage
    await chrome.storage.sync.set({
      customStatusTypes: this.config.preferences.customStatusTypes,
    });

    this.notifyListeners('preferencesChanged', this.config.preferences);
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

    if (!Array.isArray(statusTypes)) {
      throw ErrorHandler.createError(
        'Status types must be an array',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.setCustomStatusTypes'
      );
    }

    this.config.preferences.customStatusTypes = statusTypes;

    // Save to storage
    await chrome.storage.sync.set({
      customStatusTypes: statusTypes,
    });

    this.notifyListeners('statusTypesChanged', statusTypes);
  }

  /**
   * Add custom status type
   * @param {string} statusType - Status type to add
   * @description Adds a new status type to the list
   */
  async addCustomStatusType(statusType) {
    await this.ensureInitialized();

    if (!statusType || typeof statusType !== 'string') {
      throw ErrorHandler.createError(
        'Status type must be a non-empty string',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.addCustomStatusType'
      );
    }

    const currentTypes = this.config.preferences.customStatusTypes;
    if (!currentTypes.includes(statusType)) {
      currentTypes.push(statusType);
      await this.setCustomStatusTypes(currentTypes);
    }
  }

  /**
   * Remove custom status type
   * @param {string} statusType - Status type to remove
   * @description Removes a status type from the list
   */
  async removeCustomStatusType(statusType) {
    await this.ensureInitialized();

    const currentTypes = this.config.preferences.customStatusTypes;
    const updatedTypes = currentTypes.filter(type => type !== statusType);
    await this.setCustomStatusTypes(updatedTypes);
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

    this.config.auth = session;

    // Save to storage
    await chrome.storage.sync.set({
      auth_session: session,
    });

    this.notifyListeners('authSessionChanged', session);

    // Notify all contexts via runtime message
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: session,
        })
        .catch(error => {
          ErrorHandler.handle(error, 'config-manager.setAuthSession.runtime');
        });
    } catch (error) {
      ErrorHandler.handle(error, 'config-manager.setAuthSession');
    }
  }

  /**
   * Clear authentication session
   * @description Removes authentication session from storage
   */
  async clearAuthSession() {
    await this.ensureInitialized();

    this.config.auth = null;

    // Remove from storage
    await chrome.storage.sync.remove(['auth_session']);

    this.notifyListeners('authSessionChanged', null);

    // Notify all contexts via runtime message
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: null,
        })
        .catch(error => {
          ErrorHandler.handle(error, 'config-manager.clearAuthSession.runtime');
        });
    } catch (error) {
      ErrorHandler.handle(error, 'config-manager.clearAuthSession');
    }
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
    try {
      const defaultSettings = {
        customStatusTypes: [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
        ],
      };

      await chrome.storage.sync.set(defaultSettings);

      // Update local config
      this.config.preferences = defaultSettings;

      // Default settings initialized successfully
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'config-manager.initializeDefaultSettings');
      throw ErrorHandler.createError(errorResult.userMessage, errorResult.errorInfo.type, 'config-manager.initializeDefaultSettings');
    }
  }

  /**
   * Export configuration
   * @returns {Promise<Object>} Configuration export object
   * @description Exports all configuration data for backup
   */
  async exportConfig() {
    await this.ensureInitialized();

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      supabase: this.config.supabase,
      preferences: this.config.preferences,
      auth: this.config.auth,
    };
  }

  /**
   * Import configuration
   * @param {Object} configData - Configuration data to import
   * @description Imports configuration data from backup
   */
  async importConfig(configData) {
    await this.ensureInitialized();

    if (!configData || typeof configData !== 'object') {
      throw ErrorHandler.createError(
        'Invalid configuration data',
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'config-manager.importConfig'
      );
    }

    // Validate imported data
    if (configData.supabase) {
      await this.setSupabaseConfig(
        configData.supabase.url,
        configData.supabase.anonKey
      );
    }

    if (configData.preferences) {
      await this.setPreferences(configData.preferences);
    }

    if (configData.auth) {
      await this.setAuthSession(configData.auth);
    }

    return { success: true, message: 'Configuration imported successfully' };
  }

  /**
   * Add event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function to execute
   * @description Registers a callback for configuration events
   */
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name to remove listener from
   * @param {Function} callback - Callback function to remove
   * @description Removes a specific event listener
   */
  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name to notify
   * @param {*} data - Data to pass to listeners
   * @description Executes all registered callbacks for an event
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          // Error in config listener
        }
      }
    }
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
    try {
      await chrome.storage.sync.clear();
      this.config = {
        supabase: null,
        preferences: null,
        auth: null,
      };
      this.initialized = false;
      this.notifyListeners('configReset');
    } catch (error) {
      // Error resetting configuration
      throw error;
    }
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
}

// Export for use in other files
export default ConfigManager;
