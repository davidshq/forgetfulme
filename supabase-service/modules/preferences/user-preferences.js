/**
 * @fileoverview User preferences for Supabase service
 * @module user-preferences
 * @description Handles user preferences management
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * User preferences for Supabase service
 * @class UserPreferences
 * @description Manages user preferences operations
 */
export class UserPreferences {
  /**
   * Initialize the user preferences
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the preferences with configuration
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
  }

  /**
   * Set the Supabase client instance
   * @param {Object} supabaseClient - Supabase client instance
   * @description Sets the client for database operations
   */
  setSupabaseClient(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<Object>} Saved preferences object
   * @throws {Error} When user is not authenticated
   */
  async saveUserPreferences(preferences) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'user-preferences.saveUserPreferences'
      );
    }

    const userId = this.config.getCurrentUser().id;

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      return data?.[0] || { id: userId, preferences };
    } catch (error) {
      ErrorHandler.handle(error, 'user-preferences.saveUserPreferences');
      throw error;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences object
   * @throws {Error} When user is not authenticated
   */
  async getUserPreferences() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'user-preferences.getUserPreferences'
      );
    }

    const userId = this.config.getCurrentUser().id;

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.preferences || {};
    } catch (error) {
      ErrorHandler.handle(error, 'user-preferences.getUserPreferences');
      throw error;
    }
  }
} 