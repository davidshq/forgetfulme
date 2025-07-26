/**
 * @fileoverview Bookmark queries for Supabase service
 * @module bookmark-queries
 * @description Handles bookmark retrieval operations and filtering
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * Bookmark queries for Supabase service
 * @class BookmarkQueries
 * @description Manages bookmark retrieval operations with filtering and pagination
 */
export class BookmarkQueries {
  /**
   * Initialize the bookmark queries
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the queries with configuration
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
   * Get bookmarks with filtering and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=50] - Number of bookmarks per page
   * @param {string} [options.status] - Filter by read status
   * @param {string} [options.search] - Search in title and description
   * @param {string[]} [options.tags] - Filter by tags
   * @returns {Promise<Array>} Array of bookmark objects
   * @throws {Error} When user is not authenticated
   */
  async getBookmarks(options = {}) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-queries.getBookmarks'
      );
    }

    const userId = this.config.getCurrentUser().id;

    const {
      page = 1,
      limit = 50,
      status = null,
      search = null,
      tags = null,
    } = options;

    try {
      // Creating query with supabase client

      let query = this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) {
        query = query.eq('read_status', status);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-queries.getBookmarks');
      throw error;
    }
  }

  /**
   * Get bookmark by URL
   * @param {string} url - The URL to search for
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkByUrl(url) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-queries.getBookmarkByUrl'
      );
    }

    const userId = this.config.getCurrentUser().id;

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('url', url)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - bookmark doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-queries.getBookmarkByUrl');
      throw error;
    }
  }

  /**
   * Get bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to retrieve
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkById(bookmarkId) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-queries.getBookmarkById'
      );
    }

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('*')
        .eq('id', bookmarkId)
        .eq('user_id', this.config.getCurrentUser().id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - bookmark doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-queries.getBookmarkById');
      throw error;
    }
  }
} 