/**
 * @fileoverview Template for Supabase configuration
 * @module supabase-config-template
 * @description Template file for local Supabase configuration - copy to supabase-config.local.js and fill in credentials
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 * @warning This file should NOT be committed to version control
 */

/**
 * Template for Supabase configuration
 * @class SupabaseConfigTemplate
 * @description Template class for local Supabase configuration
 *
 * @example
 * // Copy this file to supabase-config.local.js and update credentials
 * const config = new SupabaseConfigTemplate();
 * config.supabaseUrl = 'https://your-project.supabase.co';
 * config.supabaseAnonKey = 'your-anon-public-key-here';
 */
class SupabaseConfigTemplate {
  /**
   * Initialize the template configuration
   * @constructor
   * @description Sets up the template with placeholder credentials that should be replaced
   */
  constructor() {
    /** @type {string} Supabase project URL - replace with your actual URL */
    this.supabaseUrl = 'https://your-project.supabase.co';
    /** @type {string} Supabase anonymous key - replace with your actual key */
    this.supabaseAnonKey = 'your-anon-public-key-here';

    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
    /** @type {Object|null} Supabase auth instance */
    this.auth = null;
    /** @type {Object|null} Current user object */
    this.user = null;
    /** @type {Object|null} Current session object */
    this.session = null;
  }

  async initialize() {
    try {
      // Check if Supabase client is available
      if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase client not loaded. Please include the Supabase library.');
      }

      // Use the globally available Supabase client
      this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
      this.auth = this.supabase.auth;

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
      console.error('Error initializing Supabase:', error);
      return false;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.session = data.session;
      this.user = data.user;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email, password) {
    try {
      const { data, error } = await this.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.session = null;
      this.user = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
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

  isConfigured() {
    return this.supabaseUrl !== null && this.supabaseAnonKey !== null;
  }
}

// Export for use in other files
window.SupabaseConfig = SupabaseConfigTemplate;
