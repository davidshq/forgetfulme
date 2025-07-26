/**
 * @fileoverview Service initializer for Supabase service
 * @module service-initializer
 * @description Handles Supabase client initialization and authentication
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Service initializer for Supabase service
 * @class ServiceInitializer
 * @description Manages Supabase client initialization and authentication state
 */
export class ServiceInitializer {
  /**
   * Initialize the service initializer
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the initializer with configuration
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
  }

  /**
   * Initialize the Supabase service
   * @description Initializes the Supabase configuration and sets up the client
   * @throws {Error} When initialization fails
   */
  async initialize() {
    // Initializing SupabaseService...
    await this.config.initialize();
    this.supabase = this.config.getSupabaseClient();
    // Supabase client initialized successfully
  }

  /**
   * Get the Supabase client instance
   * @returns {Object} Supabase client instance
   * @description Returns the initialized Supabase client
   */
  getSupabaseClient() {
    return this.supabase;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   * @description Checks authentication status
   */
  isAuthenticated() {
    return this.config.isAuthenticated();
  }

  /**
   * Get current user information
   * @returns {Object|null} Current user object or null if not authenticated
   * @description Returns current user information
   */
  getCurrentUser() {
    return this.config.getCurrentUser();
  }
}
