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
import { RealtimeManager } from './utils/realtime-manager.js';
import { BookmarkOperations } from './utils/supabase-bookmark-operations.js';
import { UserOperations } from './utils/supabase-user-operations.js';
import { DataOperations } from './utils/supabase-data-operations.js';
import AuthTokenRefreshHandler from './utils/auth-token-refresh-handler.js';
import AuthStateManager from './utils/auth-state-manager.js';

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
    /** @type {Map<string, Promise>} Map of pending requests for deduplication */
    this.pendingRequests = new Map();
    /** @type {BookmarkOperations|null} Bookmark operations instance */
    this.bookmarkOperations = null;
    /** @type {UserOperations|null} User operations instance */
    this.userOperations = null;
    /** @type {DataOperations|null} Data operations instance */
    this.dataOperations = null;
    /** @type {AuthTokenRefreshHandler|null} Token refresh handler instance */
    this.tokenRefreshHandler = null;
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

    // Initialize auth state manager and token refresh handler
    const authStateManager = new AuthStateManager();
    await authStateManager.initialize();
    this.tokenRefreshHandler = new AuthTokenRefreshHandler(this.config, authStateManager);

    // Initialize operation modules
    this.bookmarkOperations = new BookmarkOperations(
      this.supabase,
      this.config,
      this.pendingRequests,
      this.tokenRefreshHandler,
    );
    this.userOperations = new UserOperations(this.supabase, this.config, this.pendingRequests);
    this.dataOperations = new DataOperations(
      this.supabase,
      this.config,
      this.bookmarkOperations,
      this.userOperations,
    );
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
    return this.bookmarkOperations.saveBookmark(bookmark);
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
    return this.bookmarkOperations.getBookmarks(options);
  }

  /**
   * Get bookmark by URL
   * @param {string} url - The URL to search for
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkByUrl(url) {
    return this.bookmarkOperations.getBookmarkByUrl(url);
  }

  /**
   * Update bookmark data
   * @param {string} bookmarkId - The bookmark ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated bookmark object
   * @throws {Error} When user is not authenticated
   */
  async updateBookmark(bookmarkId, updates) {
    return this.bookmarkOperations.updateBookmark(bookmarkId, updates);
  }

  /**
   * Delete bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} When user is not authenticated
   */
  async deleteBookmark(bookmarkId) {
    return this.bookmarkOperations.deleteBookmark(bookmarkId);
  }

  /**
   * Get bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to retrieve
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkById(bookmarkId) {
    return this.bookmarkOperations.getBookmarkById(bookmarkId);
  }

  /**
   * Get bookmark statistics
   * @returns {Promise<Object>} Object with status counts
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkStats() {
    return this.bookmarkOperations.getBookmarkStats();
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<Object>} Saved preferences object
   * @throws {Error} When user is not authenticated
   */
  async saveUserPreferences(preferences) {
    return this.userOperations.saveUserPreferences(preferences);
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences object
   * @throws {Error} When user is not authenticated
   */
  async getUserPreferences() {
    return this.userOperations.getUserPreferences();
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
        'supabase-service.subscribeToBookmarks',
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
    return this.dataOperations.exportData();
  }

  /**
   * Import user data
   * @param {Object} importData - Data object containing bookmarks and preferences
   * @returns {Promise<boolean>} True if import was successful
   * @throws {Error} When user is not authenticated or import fails
   */
  async importData(importData) {
    return this.dataOperations.importData(importData);
  }
}

// Export for use in other files
export default SupabaseService;
