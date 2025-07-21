/**
 * @fileoverview Unified Configuration Manager for ForgetfulMe Extension
 * @module config-manager
 * @description Consolidates all configuration logic and storage operations
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

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

  // Initialize configuration manager
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Load all configuration from storage
    await this.loadAllConfig();

    // Validate configuration
    await this.validateConfig();

    this.initialized = true;
    this.notifyListeners('initialized');
  }

  // Load all configuration from storage
  async loadAllConfig() {
    const result = await chrome.storage.sync.get([
      'supabaseConfig',
      'customStatusTypes',
      'auth_session',
    ]);

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
  }

  // Validate configuration
  async validateConfig() {
    // Validate Supabase configuration if present
    if (this.config.supabase) {
      if (!this.config.supabase.url || !this.config.supabase.anonKey) {
        throw new Error(
          'Invalid Supabase configuration: missing URL or anon key'
        );
      }

      if (!this.config.supabase.url.startsWith('https://')) {
        throw new Error('Invalid Supabase URL: must start with https://');
      }

      if (!this.config.supabase.anonKey.startsWith('eyJ')) {
        throw new Error('Invalid anon key format');
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

  // Supabase Configuration Methods
  async getSupabaseConfig() {
    await this.ensureInitialized();
    return this.config.supabase;
  }

  async setSupabaseConfig(url, anonKey) {
    await this.ensureInitialized();

    // Validate input
    if (!url || !anonKey) {
      throw new Error('Both URL and anon key are required');
    }

    if (!url.startsWith('https://')) {
      throw new Error('URL must start with https://');
    }

    if (!anonKey.startsWith('eyJ')) {
      throw new Error('Invalid anon key format');
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

  async isSupabaseConfigured() {
    await this.ensureInitialized();
    return this.config.supabase !== null;
  }

  // Preferences Methods
  async getPreferences() {
    await this.ensureInitialized();
    return this.config.preferences;
  }

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

  async getCustomStatusTypes() {
    await this.ensureInitialized();
    return this.config.preferences.customStatusTypes;
  }

  async setCustomStatusTypes(statusTypes) {
    await this.ensureInitialized();

    if (!Array.isArray(statusTypes)) {
      throw new Error('Status types must be an array');
    }

    this.config.preferences.customStatusTypes = statusTypes;

    // Save to storage
    await chrome.storage.sync.set({
      customStatusTypes: statusTypes,
    });

    this.notifyListeners('statusTypesChanged', statusTypes);
  }

  async addCustomStatusType(statusType) {
    await this.ensureInitialized();

    if (!statusType || typeof statusType !== 'string') {
      throw new Error('Status type must be a non-empty string');
    }

    const currentTypes = this.config.preferences.customStatusTypes;
    if (!currentTypes.includes(statusType)) {
      currentTypes.push(statusType);
      await this.setCustomStatusTypes(currentTypes);
    }
  }

  async removeCustomStatusType(statusType) {
    await this.ensureInitialized();

    const currentTypes = this.config.preferences.customStatusTypes;
    const updatedTypes = currentTypes.filter(type => type !== statusType);
    await this.setCustomStatusTypes(updatedTypes);
  }

  // Authentication Methods
  async getAuthSession() {
    await this.ensureInitialized();
    return this.config.auth;
  }

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
        .catch(_error => {
          // Ignore errors when no listeners are available
          // console.debug(
          //   'No runtime message listeners available:',
          //   error.message
          // );
        });
    } catch {
      // console.debug('Error sending auth state message:', error.message);
    }
  }

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
        .catch(() => {
          // Ignore errors when no listeners are available
          // console.debug(
          //   'No runtime message listeners available:',
          //   error.message
          // );
        });
    } catch {
      // console.debug('Error sending auth state message:', error.message);
    }
  }

  async isAuthenticated() {
    await this.ensureInitialized();
    return this.config.auth !== null;
  }

  // Default Settings Methods
  async initializeDefaultSettings() {
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

    // console.log('Default settings initialized');
  }

  // Export/Import Methods
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

  async importConfig(configData) {
    await this.ensureInitialized();

    if (!configData || typeof configData !== 'object') {
      throw new Error('Invalid configuration data');
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

  // Event Listener Methods
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch {
          // console.error('Error in config listener:', error);
        }
      }
    }
  }

  // Utility Methods
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async reset() {
    await chrome.storage.sync.clear();
    this.config = {
      supabase: null,
      preferences: null,
      auth: null,
    };
    this.initialized = false;
    this.notifyListeners('configReset');
  }

  // Get configuration summary for debugging
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
