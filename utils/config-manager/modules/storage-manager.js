/**
 * @fileoverview Storage manager for configuration data
 * @module storage-manager
 * @description Handles all Chrome storage operations for configuration
 */

import ErrorHandler from '../../error-handler.js';

/**
 * Storage Manager for Configuration Data
 * @class StorageManager
 * @description Manages all Chrome storage operations for configuration
 */
class StorageManager {
  /**
   * Initialize the storage manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Load all configuration from storage
   * @description Retrieves all configuration data from Chrome sync storage
   */
  async loadAllConfig() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        this.configManager.config.supabase = null;
        this.configManager.config.preferences = {
          customStatusTypes: [
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ],
        };
        this.configManager.config.auth = null;
        return;
      }

      const result = await chrome.storage.sync.get([
        'supabaseConfig',
        'customStatusTypes',
        'auth_session',
      ]);

      this.configManager.config.supabase = result.supabaseConfig || null;
      this.configManager.config.preferences = {
        customStatusTypes: result.customStatusTypes || [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
        ],
      };
      this.configManager.config.auth = result.auth_session || null;
    } catch (error) {
      console.error('StorageManager: Error loading config:', error);
      const errorResult = ErrorHandler.handle(
        error,
        'storage-manager.loadAllConfig'
      );
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'storage-manager.loadAllConfig'
      );
    }
  }

  /**
   * Set Supabase configuration
   * @param {string} url - Supabase project URL
   * @param {string} anonKey - Supabase anon key
   * @returns {Promise<Object>} Success result
   */
  async setSupabaseConfig(url, anonKey) {
    // Update configuration
    this.configManager.config.supabase = { url, anonKey };

    // Save to storage
    await chrome.storage.sync.set({
      supabaseConfig: this.configManager.config.supabase,
    });

    this.configManager.events.notifyListeners(
      'supabaseConfigChanged',
      this.configManager.config.supabase
    );

    return { success: true, message: 'Configuration saved successfully' };
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
      this.configManager.config.preferences = defaultSettings;

      // Default settings initialized successfully
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'storage-manager.initializeDefaultSettings'
      );
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'storage-manager.initializeDefaultSettings'
      );
    }
  }

  /**
   * Export configuration
   * @returns {Promise<Object>} Configuration export object
   * @description Exports all configuration data for backup
   */
  async exportConfig() {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      supabase: this.configManager.config.supabase,
      preferences: this.configManager.config.preferences,
      auth: this.configManager.config.auth,
    };
  }

  /**
   * Import configuration
   * @param {Object} configData - Configuration data to import
   * @returns {Promise<Object>} Success result
   * @description Imports configuration data from backup
   */
  async importConfig(configData) {
    // Validate imported data
    this.configManager.validation.validateImportData(configData);

    // Validate imported data
    if (configData.supabase) {
      this.configManager.validation.validateSupabaseConfig(
        configData.supabase.url,
        configData.supabase.anonKey
      );
      await this.setSupabaseConfig(
        configData.supabase.url,
        configData.supabase.anonKey
      );
    }

    if (configData.preferences) {
      await this.configManager.preferences.setPreferences(
        configData.preferences
      );
    }

    if (configData.auth) {
      await this.configManager.auth.setAuthSession(configData.auth);
    }

    return { success: true, message: 'Configuration imported successfully' };
  }

  /**
   * Reset configuration to defaults
   * @description Clears all configuration and resets to defaults
   */
  async reset() {
    try {
      await chrome.storage.sync.clear();
      this.configManager.config = {
        supabase: null,
        preferences: null,
        auth: null,
      };
      this.configManager.initialized = false;
      this.configManager.events.notifyListeners('configReset');
    } catch (error) {
      throw error;
    }
  }
}

export default StorageManager;
