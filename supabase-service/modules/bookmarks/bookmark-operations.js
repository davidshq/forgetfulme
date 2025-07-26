/**
 * @fileoverview Bookmark operations for Supabase service
 * @module bookmark-operations
 * @description Handles bookmark CRUD operations (Create, Update, Delete)
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';
import BookmarkTransformer from '../../../utils/bookmark-transformer.js';

/**
 * Bookmark operations for Supabase service
 * @class BookmarkOperations
 * @description Manages bookmark CRUD operations with validation and transformation
 */
export class BookmarkOperations {
  /**
   * Initialize the bookmark operations
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the operations with configuration
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
    /** @type {Object|null} Reference to bookmark queries for internal use */
    this.bookmarkQueries = null;
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
   * Set the bookmark queries reference for internal use
   * @param {Object} bookmarkQueries - Bookmark queries instance
   * @description Sets the queries reference for internal bookmark lookups
   */
  setBookmarkQueries(bookmarkQueries) {
    this.bookmarkQueries = bookmarkQueries;
  }

  /**
   * Save a bookmark to the database
   * @param {Object} bookmark - The bookmark object to save
   * @param {string} bookmark.url - The URL of the bookmark
   * @param {string} bookmark.title - The title of the bookmark
   * @param {string} [bookmark.description] - Optional description
   * @param {string} bookmark.readStatus - The read status (e.g., 'read', 'good_reference')
   * @param {string[]} [bookmark.tags] - Optional array of tags
   * @returns {Promise<Object>} The saved bookmark object
   * @throws {Error} When user is not authenticated or validation fails
   */
  async saveBookmark(bookmark) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-operations.saveBookmark'
      );
    }

    // Validate bookmark data before transformation
    const validation = BookmarkTransformer.validate(bookmark);
    if (!validation.isValid) {
      throw ErrorHandler.createError(
        `Invalid bookmark data: ${validation.errors.join(', ')}`,
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'bookmark-operations.saveBookmark'
      );
    }

    const userId = this.config.getCurrentUser().id;

    // Check if bookmark already exists using the public method
    const existingBookmark = await this._getBookmarkByUrl(bookmark.url);

    if (existingBookmark) {
      // Return existing bookmark with a flag indicating it's a duplicate
      return {
        ...existingBookmark,
        isDuplicate: true,
      };
    }

    const bookmarkData = BookmarkTransformer.toSupabaseFormat(bookmark, userId);

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .insert(bookmarkData)
        .select();

      if (error) throw error;
      return data?.[0] || bookmarkData;
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-operations.saveBookmark');
      throw error;
    }
  }

  /**
   * Update bookmark data
   * @param {string} bookmarkId - The bookmark ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated bookmark object
   * @throws {Error} When user is not authenticated
   */
  async updateBookmark(bookmarkId, updates) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-operations.updateBookmark'
      );
    }

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookmarkId)
        .eq('user_id', this.config.getCurrentUser().id)
        .select();

      if (error) throw error;
      return data?.[0] || { id: bookmarkId, ...updates };
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-operations.updateBookmark');
      throw error;
    }
  }

  /**
   * Delete bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} When user is not authenticated
   */
  async deleteBookmark(bookmarkId) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'bookmark-operations.deleteBookmark'
      );
    }

    try {
      const { error } = await this.supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', this.config.getCurrentUser().id);

      if (error) throw error;
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'bookmark-operations.deleteBookmark');
      throw error;
    }
  }

  /**
   * Get bookmark by URL (private method for internal use)
   * @param {string} url - The URL to search for
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @private
   */
  async _getBookmarkByUrl(url) {
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
      ErrorHandler.handle(error, 'bookmark-operations._getBookmarkByUrl');
      throw error;
    }
  }
} 