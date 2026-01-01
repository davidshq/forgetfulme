/**
 * @fileoverview Bookmark operations for Supabase service
 * @module supabase-bookmark-operations
 * @description Handles all bookmark CRUD operations
 */

import ErrorHandler from './error-handler.js';
import BookmarkTransformer from './bookmark-transformer.js';

/**
 * Bookmark operations for Supabase service
 * @class BookmarkOperations
 * @description Manages all bookmark database operations
 */
export class BookmarkOperations {
  /**
   * Initialize bookmark operations
   * @constructor
   * @param {Object} supabase - Supabase client instance
   * @param {Object} config - Supabase config instance
   * @param {Map} pendingRequests - Map for request deduplication
   * @param {Object} [tokenRefreshHandler=null] - Token refresh handler instance
   */
  constructor(supabase, config, pendingRequests, tokenRefreshHandler = null) {
    this.supabase = supabase;
    this.config = config;
    this.pendingRequests = pendingRequests;
    this.tokenRefreshHandler = tokenRefreshHandler;
  }

  /**
   * Generate a unique key for request deduplication
   * @private
   * @param {string} methodName - Name of the method being called
   * @param {any} params - Parameters for the method
   * @param {string} [userId] - Optional user ID to include in key
   * @returns {string} Unique request key
   */
  _getRequestKey(methodName, params, userId = null) {
    const paramKey = JSON.stringify(params || {});
    const userKey =
      userId || (this.config.isAuthenticated() ? this.config.getCurrentUser()?.id : 'anonymous');
    return `${methodName}:${userKey}:${paramKey}`;
  }

  /**
   * Deduplicate a request by checking for in-flight requests with the same key
   * @private
   * @param {string} requestKey - Unique key for the request
   * @param {Function} requestFn - Function that performs the actual API call
   * @returns {Promise<any>} Promise that resolves with the request result
   */
  async _deduplicateRequest(requestKey, requestFn) {
    // Check if a request with this key is already in progress
    const existingRequest = this.pendingRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = requestFn()
      .then(result => {
        // Remove from pending requests on success
        this.pendingRequests.delete(requestKey);
        return result;
      })
      .catch(error => {
        // Remove from pending requests on error
        this.pendingRequests.delete(requestKey);
        throw error;
      });

    // Store the promise for deduplication
    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  /**
   * Execute a bookmark operation with token refresh handling
   * @private
   * @param {Function} operation - Operation to execute
   * @param {string} context - Context for error handling
   * @returns {Promise<any>} Result of operation
   */
  async _executeWithTokenRefresh(operation, context) {
    if (this.tokenRefreshHandler) {
      return this.tokenRefreshHandler.executeWithRefresh(operation, context);
    }
    return operation();
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
        'supabase-service.saveBookmark',
      );
    }

    // Validate bookmark data before transformation
    const validation = BookmarkTransformer.validate(bookmark);
    if (!validation.isValid) {
      throw ErrorHandler.createError(
        `Invalid bookmark data: ${validation.errors.join(', ')}`,
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'supabase-service.saveBookmark',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;

      // Check if bookmark already exists
      const existingBookmark = await this.getBookmarkByUrl(bookmark.url);

      if (existingBookmark) {
        // Return existing bookmark with a flag indicating it's a duplicate
        return {
          ...existingBookmark,
          isDuplicate: true,
        };
      }

      const bookmarkData = BookmarkTransformer.toSupabaseFormat(bookmark, userId);

      try {
        const { data, error } = await this.supabase.from('bookmarks').insert(bookmarkData).select();

        if (error) throw error;
        return data?.[0] || bookmarkData;
      } catch (error) {
        ErrorHandler.handle(error, 'supabase-service.saveBookmark');
        throw error;
      }
    }, 'supabase-service.saveBookmark');
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
        'supabase-service.getBookmarks',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;
      const requestKey = this._getRequestKey('getBookmarks', options, userId);

      return this._deduplicateRequest(requestKey, async () => {
        const { page = 1, limit = 50, status = null, search = null, tags = null } = options;

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
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
          }

          if (tags && tags.length > 0) {
            query = query.overlaps('tags', tags);
          }

          const { data, error } = await query;
          if (error) throw error;

          return data || [];
        } catch (error) {
          ErrorHandler.handle(error, 'supabase-service.getBookmarks');
          throw error;
        }
      });
    }, 'supabase-service.getBookmarks');
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
        'supabase-service.getBookmarkByUrl',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;
      const requestKey = this._getRequestKey('getBookmarkByUrl', { url }, userId);

      return this._deduplicateRequest(requestKey, async () => {
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
          ErrorHandler.handle(error, 'supabase-service.getBookmarkByUrl');
          throw error;
        }
      });
    }, 'supabase-service.getBookmarkByUrl');
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
        'supabase-service.updateBookmark',
      );
    }

    return this._executeWithTokenRefresh(async () => {
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
        ErrorHandler.handle(error, 'supabase-service.updateBookmark');
        throw error;
      }
    }, 'supabase-service.updateBookmark');
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
        'supabase-service.deleteBookmark',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      try {
        const { error } = await this.supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId)
          .eq('user_id', this.config.getCurrentUser().id);

        if (error) throw error;
        return true;
      } catch (error) {
        ErrorHandler.handle(error, 'supabase-service.deleteBookmark');
        throw error;
      }
    }, 'supabase-service.deleteBookmark');
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
        'supabase-service.getBookmarkById',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;
      const requestKey = this._getRequestKey('getBookmarkById', { bookmarkId }, userId);

      return this._deduplicateRequest(requestKey, async () => {
        try {
          const { data, error } = await this.supabase
            .from('bookmarks')
            .select('*')
            .eq('id', bookmarkId)
            .eq('user_id', userId)
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
          ErrorHandler.handle(error, 'supabase-service.getBookmarkById');
          throw error;
        }
      });
    }, 'supabase-service.getBookmarkById');
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
        'supabase-service.getBookmarkStats',
      );
    }

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;
      const requestKey = this._getRequestKey('getBookmarkStats', {}, userId);

      return this._deduplicateRequest(requestKey, async () => {
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
          ErrorHandler.handle(error, 'supabase-service.getBookmarkStats');
          throw error;
        }
      });
    }, 'supabase-service.getBookmarkStats');
  }
}
