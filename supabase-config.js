/**
 * @fileoverview Supabase configuration manager for ForgetfulMe extension
 * @module supabase-config
 * @description Manages Supabase configuration, authentication, and client setup
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ConfigManager from './utils/config-manager.js';
import ErrorHandler from './utils/error-handler.js';

/**
 * Supabase configuration manager for ForgetfulMe extension
 * @class SupabaseConfig
 * @description Manages Supabase configuration, authentication, and client setup
 *
 * @example
 * const supabaseConfig = new SupabaseConfig();
 * await supabaseConfig.initialize();
 *
 * if (supabaseConfig.isConfigured()) {
 *   const client = supabaseConfig.getSupabaseClient();
 *   // Use client for database operations
 * }
 */
class SupabaseConfig {
  /**
   * Initialize the Supabase configuration manager
   * @constructor
   * @description Sets up the configuration manager with initial state and dependencies
   */
  constructor() {
    /** @type {ConfigManager} Configuration manager instance */
    this.configManager = new ConfigManager();
    /** @type {string|null} Supabase project URL */
    this.supabaseUrl = null;
    /** @type {string|null} Supabase anonymous key */
    this.supabaseAnonKey = null;

    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
    /** @type {Object|null} Supabase auth instance */
    this.auth = null;
    /** @type {Object|null} Current user object */
    this.user = null;
    /** @type {Object|null} Current session object */
    this.session = null;

    /** @type {boolean} Whether configuration has been loaded */
    this.configLoaded = false;
  }

  /**
   * Load Supabase configuration from storage or environment variables
   * @async
   * @method loadConfiguration
   * @description Loads configuration from Chrome storage or environment variables for development
   * @throws {Error} When configuration loading fails
   *
   * @example
   * await supabaseConfig.loadConfiguration();
   * if (supabaseConfig.supabaseUrl) {
   *   console.log('Configuration loaded successfully');
   * }
   */
  async loadConfiguration() {
    if (this.configLoaded) {
      return;
    }

    try {
      await this.configManager.initialize();
      const supabaseConfig = await this.configManager.getSupabaseConfig();

      if (supabaseConfig) {
        this.supabaseUrl = supabaseConfig.url;
        this.supabaseAnonKey = supabaseConfig.anonKey;
        this.configLoaded = true;
        return;
      }

      // Fallback to environment variables (for development)
      // Note: These won't work in extension context, but useful for development
      if (typeof process !== 'undefined' && process.env) {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        this.configLoaded = true;
        return;
      }

      // If no configuration found, don't show error - just mark as not configured
      this.configLoaded = true;
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-config.loadConfiguration');
      this.configLoaded = true;
    }
  }

  showSetupInstructions() {
    // Supabase configuration not found - setup instructions would be shown here
  }

  async setConfiguration(url, anonKey) {
    try {
      await this.configManager.initialize();
      const result = await this.configManager.setSupabaseConfig(url, anonKey);

      // Update local configuration
      this.supabaseUrl = url;
      this.supabaseAnonKey = anonKey;
      this.configLoaded = true;

      return result;
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'supabase-config.setConfiguration'
      );
      return { success: false, message: errorResult.userMessage };
    }
  }

  async getConfiguration() {
    await this.loadConfiguration();
    return await this.configManager.getSupabaseConfig();
  }

  async initialize() {
    try {
      // Load configuration if not already loaded
      await this.loadConfiguration();

      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        return false; // Not configured, but not an error
      }

      // Wait for Supabase client to be available
      let attempts = 0;
      const maxAttempts = 10;

      while (typeof supabase === 'undefined' && attempts < maxAttempts) {
        // Waiting for Supabase library to load...
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // Check if Supabase client is available
      if (typeof supabase === 'undefined') {
        // Supabase client not loaded after waiting
        return false;
      }

      // Use the globally available Supabase client
      // Creating Supabase client
      this.supabase = supabase.createClient(
        this.supabaseUrl,
        this.supabaseAnonKey
      );
      this.auth = this.supabase.auth;

      // Verify the client was created properly
      if (!this.supabase || typeof this.supabase.from !== 'function') {
        // Supabase client not properly initialized
        return false;
      }

      // Check for existing session
      const {
        data: { session },
      } = await this.auth.getSession();
      if (session) {
        this.session = session;
        this.user = session.user;
        return true;
      }

      return false;
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-config.initialize');
      return false;
    }
  }

  async signIn(email, password) {
    try {
      if (!this.auth) {
        throw ErrorHandler.createError(
          'Supabase not initialized',
          ErrorHandler.ERROR_TYPES.CONFIG,
          'supabase-config.signIn'
        );
      }

      const { data, error } = await this.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.session = data.session;
      this.user = data.user;
      return data;
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'supabase-config.signIn');
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'supabase-config.signIn'
      );
    }
  }

  async signUp(email, password) {
    try {
      if (!this.auth) {
        throw ErrorHandler.createError(
          'Supabase not initialized',
          ErrorHandler.ERROR_TYPES.CONFIG,
          'supabase-config.signUp'
        );
      }

      const { data, error } = await this.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'supabase-config.signUp');
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'supabase-config.signUp'
      );
    }
  }

  async signOut() {
    try {
      if (!this.auth) {
        return;
      }

      await this.auth.signOut();
      this.session = null;
      this.user = null;
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'supabase-config.signOut');
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'supabase-config.signOut'
      );
    }
  }

  isAuthenticated() {
    return this.user !== null && this.session !== null;
  }

  getCurrentUser() {
    return this.user;
  }

  getSupabaseClient() {
    return this.supabase;
  }

  async isConfigured() {
    await this.loadConfiguration();
    return await this.configManager.isSupabaseConfigured();
  }
}

// Export for use in other files
export default SupabaseConfig;
