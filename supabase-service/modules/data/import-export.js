/**
 * @fileoverview Import/Export for Supabase service
 * @module import-export
 * @description Handles data import and export operations
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';
import BookmarkTransformer from '../../../utils/bookmark-transformer.js';

/**
 * Import/Export for Supabase service
 * @class ImportExport
 * @description Manages data import and export operations
 */
export class ImportExport {
  /**
   * Initialize the import/export module
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the import/export with configuration
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
   * Export all user data
   * @returns {Promise<Object>} Object containing bookmarks, preferences, and metadata
   * @throws {Error} When user is not authenticated
   */
  async exportData() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'import-export.exportData'
      );
    }

    try {
      // Get all bookmarks (using a large limit to get all data)
      const { data: bookmarks, error: bookmarksError } = await this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', this.config.getCurrentUser().id)
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;

      // Get user preferences
      const { data: preferences, error: preferencesError } = await this.supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', this.config.getCurrentUser().id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
      }

      return {
        bookmarks: bookmarks || [],
        preferences: preferences?.preferences || {},
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      ErrorHandler.handle(error, 'import-export.exportData');
      throw error;
    }
  }

  /**
   * Import user data
   * @param {Object} importData - Data object containing bookmarks and preferences
   * @returns {Promise<boolean>} True if import was successful
   * @throws {Error} When user is not authenticated or import fails
   */
  async importData(importData) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'import-export.importData'
      );
    }

    try {
      const userId = this.config.getCurrentUser().id;

      if (importData.bookmarks && importData.bookmarks.length > 0) {
        const transformedBookmarks = BookmarkTransformer.transformMultiple(
          importData.bookmarks,
          userId,
          { preserveTimestamps: true, setDefaults: false }
        );

        const { error } = await this.supabase
          .from('bookmarks')
          .insert(transformedBookmarks)
          .select();

        if (error) throw error;
      }

      if (importData.preferences) {
        await this._saveUserPreferences(importData.preferences);
      }

      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'import-export.importData');
      throw error;
    }
  }

  /**
   * Save user preferences (private method for internal use)
   * @param {Object} preferences - User preferences object
   * @returns {Promise<Object>} Saved preferences object
   * @private
   */
  async _saveUserPreferences(preferences) {
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
      ErrorHandler.handle(error, 'import-export._saveUserPreferences');
      throw error;
    }
  }
}
