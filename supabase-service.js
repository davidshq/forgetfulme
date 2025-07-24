/**
 * @fileoverview Supabase service for ForgetfulMe extension
 * @module supabase-service
 * @description Handles all Supabase database operations and real-time subscriptions
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './utils/error-handler.js';
import BookmarkTransformer from './utils/bookmark-transformer.js';

/**
 * Supabase service for ForgetfulMe extension
 * @class SupabaseService
 * @description Manages all Supabase database operations including bookmarks, user preferences,
 * and real-time subscriptions
 *
 * @example
 * const supabaseConfig = new SupabaseConfig();
 * const supabaseService = new SupabaseService(supabaseConfig);
 * await supabaseService.initialize();
 *
 * // Save a bookmark
 * const bookmark = await supabaseService.saveBookmark({
 *   url: 'https://example.com',
 *   title: 'Example Page',
 *   readStatus: 'read'
 * });
 */
class SupabaseService {
  /**
   * Initialize the Supabase service with configuration
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the service with Supabase configuration and real-time manager
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
    /** @type {RealtimeManager|null} Real-time subscription manager */
    this.realtimeManager = null;
  }

  /**
   * Initialize the Supabase service
   * @description Initializes the Supabase configuration and sets up the client and real-time manager
   * @throws {Error} When initialization fails
   */
  async initialize() {
    // Initializing SupabaseService...
    await this.config.initialize();
    this.supabase = this.config.getSupabaseClient();
    // Supabase client initialized successfully
    this.realtimeManager = new RealtimeManager(this.supabase);
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
        'supabase-service.saveBookmark'
      );
    }

    // Validate bookmark data before transformation
    const validation = BookmarkTransformer.validate(bookmark);
    if (!validation.isValid) {
      throw ErrorHandler.createError(
        `Invalid bookmark data: ${validation.errors.join(', ')}`,
        ErrorHandler.ERROR_TYPES.VALIDATION,
        'supabase-service.saveBookmark'
      );
    }

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
      const { data, error } = await this.supabase
        .from('bookmarks')
        .insert(bookmarkData)
        .select();

      if (error) throw error;
      return data?.[0] || bookmarkData;
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.saveBookmark');
      throw error;
    }
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
        'supabase-service.getBookmarks'
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
      ErrorHandler.handle(error, 'supabase-service.getBookmarks');
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
        'supabase-service.getBookmarkByUrl'
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
      ErrorHandler.handle(error, 'supabase-service.getBookmarkByUrl');
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
        'supabase-service.updateBookmark'
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
      ErrorHandler.handle(error, 'supabase-service.updateBookmark');
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
        'supabase-service.deleteBookmark'
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
      ErrorHandler.handle(error, 'supabase-service.deleteBookmark');
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
        'supabase-service.getBookmarkById'
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
      ErrorHandler.handle(error, 'supabase-service.getBookmarkById');
      throw error;
    }
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
        'supabase-service.getBookmarkStats'
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
      ErrorHandler.handle(error, 'supabase-service.getBookmarkStats');
      throw error;
    }
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
        'supabase-service.saveUserPreferences'
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
      ErrorHandler.handle(error, 'supabase-service.saveUserPreferences');
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
        'supabase-service.getUserPreferences'
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
      ErrorHandler.handle(error, 'supabase-service.getUserPreferences');
      throw error;
    }
  }

  /**
   * Subscribe to bookmark changes
   * @param {Function} callback - Callback function for bookmark changes
   * @returns {Object} Subscription object
   * @throws {Error} When user is not authenticated
   */
  subscribeToBookmarks(callback) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError(
        'User not authenticated',
        ErrorHandler.ERROR_TYPES.AUTH,
        'supabase-service.subscribeToBookmarks'
      );
    }

    const userId = this.config.getCurrentUser().id;
    return this.realtimeManager.subscribeToBookmarks(userId, callback);
  }

  /**
   * Unsubscribe from real-time channel
   * @param {string} channelName - Name of the channel to unsubscribe from
   * @description Removes subscription and cleans up resources
   */
  unsubscribe(channelName) {
    this.realtimeManager.unsubscribe(channelName);
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
        'supabase-service.exportData'
      );
    }

    try {
      const bookmarks = await this.getBookmarks({ limit: 10000 }); // Get all bookmarks
      const preferences = await this.getUserPreferences();

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
        'supabase-service.importData'
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
        await this.saveUserPreferences(importData.preferences);
      }

      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.importData');
      throw error;
    }
  }
}

/**
 * Real-time manager for handling subscriptions
 * @class RealtimeManager
 * @description Manages Supabase real-time subscriptions and channel cleanup
 */
class RealtimeManager {
  /**
   * Initialize the real-time manager
   * @constructor
   * @param {Object} supabase - Supabase client instance
   * @description Sets up subscription tracking
   */
  constructor(supabase) {
    this.supabase = supabase;
    this.subscriptions = new Map();
  }

  /**
   * Subscribe to bookmark changes for a user
   * @param {string} userId - User ID to subscribe for
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   * @description Creates real-time subscription for bookmark changes
   */
  subscribeToBookmarks(userId, callback) {
    const subscription = this.supabase
      .channel('bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('bookmarks', subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channelName - Name of the channel to unsubscribe from
   * @description Removes subscription and cleans up resources
   */
  unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      this.supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
    }
  }
}

// Export for use in other files
export default SupabaseService;
