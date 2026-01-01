/**
 * @fileoverview Data import/export operations for Supabase service
 * @module supabase-data-operations
 * @description Handles data import and export operations
 */

import ErrorHandler from './error-handler.js';
import BookmarkTransformer from './bookmark-transformer.js';

/**
 * Data operations for Supabase service
 * @class DataOperations
 * @description Manages data import and export operations
 */
export class DataOperations {
  /**
   * Initialize data operations
   * @constructor
   * @param {Object} supabase - Supabase client instance
   * @param {Object} config - Supabase config instance
   * @param {BookmarkOperations} bookmarkOperations - Bookmark operations instance
   * @param {UserOperations} userOperations - User operations instance
   */
  constructor(supabase, config, bookmarkOperations, userOperations) {
    this.supabase = supabase;
    this.config = config;
    this.bookmarkOperations = bookmarkOperations;
    this.userOperations = userOperations;
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
        'supabase-service.exportData',
      );
    }

    try {
      const bookmarks = await this.bookmarkOperations.getBookmarks({ limit: 10000 }); // Get all bookmarks
      const preferences = await this.userOperations.getUserPreferences();

      return {
        bookmarks: bookmarks,
        preferences: preferences,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.exportData');
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
        'supabase-service.importData',
      );
    }

    try {
      const userId = this.config.getCurrentUser().id;

      if (importData.bookmarks && importData.bookmarks.length > 0) {
        const transformedBookmarks = BookmarkTransformer.transformMultiple(
          importData.bookmarks,
          userId,
          { preserveTimestamps: true, setDefaults: false },
        );

        const { error } = await this.supabase
          .from('bookmarks')
          .insert(transformedBookmarks)
          .select();

        if (error) throw error;
      }

      if (importData.preferences) {
        await this.userOperations.saveUserPreferences(importData.preferences);
      }

      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.importData');
      throw error;
    }
  }
}
