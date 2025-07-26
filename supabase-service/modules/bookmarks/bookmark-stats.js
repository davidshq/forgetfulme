/**
 * @fileoverview Bookmark statistics for Supabase service
 * @module bookmark-stats
 * @description Handles bookmark statistics and analytics
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * Bookmark statistics for Supabase service
 * @class BookmarkStats
 * @description Manages bookmark statistics and analytics operations
 */
export class BookmarkStats {
  /**
   * Initialize the bookmark stats
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the stats with configuration
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
   * Get bookmark statistics
   * @returns {Promise<Object>} Object with status counts
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkStats() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-stats.getBookmarkStats'
      );
    }

    const userId = this.config.getCurrentUser().id;

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('read_status')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).reduce((stats, bookmark) => {
        stats[bookmark.read_status] = (stats[bookmark.read_status] || 0) + 1;
        return stats;
      }, {});
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-stats.getBookmarkStats');
      throw error;
    }
  }
} 