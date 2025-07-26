/**
 * @fileoverview Supabase service for ForgetfulMe extension (Backward Compatibility Wrapper)
 * @module supabase-service
 * @description Backward compatibility wrapper for the modular Supabase service
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 * @deprecated Use the modular service from './supabase-service/index.js' instead
 */

import SupabaseService from './supabase-service/index.js';

/**
 * Supabase service for ForgetfulMe extension (Backward Compatibility)
 * @class SupabaseService
 * @description Backward compatibility wrapper that delegates to the modular service
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
class SupabaseServiceWrapper {
  /**
   * Initialize the Supabase service with configuration
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up the service with all modules using dependency injection
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseService} The modular Supabase service instance */
    this.service = new SupabaseService(supabaseConfig);
  }

  /**
   * Initialize the Supabase service
   * @description Initializes all modules and sets up the service
   * @throws {Error} When initialization fails
   */
  async initialize() {
    await this.service.initialize();
  }

  /**
   * Get the Supabase client (for testing purposes)
   * @returns {Object|null} The Supabase client instance
   */
  get supabase() {
    return this.service.supabase;
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
    return this.service.saveBookmark(bookmark);
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
    return this.service.getBookmarks(options);
  }

  /**
   * Get bookmark by URL
   * @param {string} url - The URL to search for
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkByUrl(url) {
    return this.service.getBookmarkByUrl(url);
  }

  /**
   * Update bookmark data
   * @param {string} bookmarkId - The bookmark ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated bookmark object
   * @throws {Error} When user is not authenticated
   */
  async updateBookmark(bookmarkId, updates) {
    return this.service.updateBookmark(bookmarkId, updates);
  }

  /**
   * Delete bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} When user is not authenticated
   */
  async deleteBookmark(bookmarkId) {
    return this.service.deleteBookmark(bookmarkId);
  }

  /**
   * Get bookmark by ID
   * @param {string} bookmarkId - The bookmark ID to retrieve
   * @returns {Promise<Object|null>} Bookmark object or null if not found
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkById(bookmarkId) {
    return this.service.getBookmarkById(bookmarkId);
  }

  /**
   * Get bookmark statistics
   * @returns {Promise<Object>} Object with status counts
   * @throws {Error} When user is not authenticated
   */
  async getBookmarkStats() {
    return this.service.getBookmarkStats();
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<Object>} Saved preferences object
   * @throws {Error} When user is not authenticated
   */
  async saveUserPreferences(preferences) {
    return this.service.saveUserPreferences(preferences);
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences object
   * @throws {Error} When user is not authenticated
   */
  async getUserPreferences() {
    return this.service.getUserPreferences();
  }

  /**
   * Subscribe to bookmark changes
   * @param {Function} callback - Callback function for bookmark changes
   * @returns {Object} Subscription object
   * @throws {Error} When user is not authenticated
   */
  subscribeToBookmarks(callback) {
    return this.service.subscribeToBookmarks(callback);
  }

  /**
   * Unsubscribe from real-time channel
   * @param {string} channelName - Name of the channel to unsubscribe from
   * @description Removes subscription and cleans up resources
   */
  unsubscribe(channelName) {
    return this.service.unsubscribe(channelName);
  }

  /**
   * Export all user data
   * @returns {Promise<Object>} Object containing bookmarks, preferences, and metadata
   * @throws {Error} When user is not authenticated
   */
  async exportData() {
    return this.service.exportData();
  }

  /**
   * Import user data
   * @param {Object} importData - Data object containing bookmarks and preferences
   * @returns {Promise<boolean>} True if import was successful
   * @throws {Error} When user is not authenticated or import fails
   */
  async importData(importData) {
    return this.service.importData(importData);
  }
}

// Export for use in other files
export default SupabaseServiceWrapper;
