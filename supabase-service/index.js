/**
 * @fileoverview Main Supabase service entry point
 * @module supabase-service
 * @description Main orchestrator for Supabase service modules
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { ServiceInitializer } from './modules/core/service-initializer.js';
import { BookmarkOperations } from './modules/bookmarks/bookmark-operations.js';
import { BookmarkQueries } from './modules/bookmarks/bookmark-queries.js';
import { BookmarkStats } from './modules/bookmarks/bookmark-stats.js';
import { UserPreferences } from './modules/preferences/user-preferences.js';
import { RealtimeManager } from './modules/realtime/realtime-manager.js';
import { ImportExport } from './modules/data/import-export.js';

/**
 * Supabase service for ForgetfulMe extension
 * @class SupabaseService
 * @description Main orchestrator that coordinates all Supabase service modules
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
   * @description Sets up the service with all modules using dependency injection
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;

    // Initialize modules with dependency injection
    this.initializer = new ServiceInitializer(supabaseConfig);
    this.bookmarkOperations = new BookmarkOperations(supabaseConfig);
    this.bookmarkQueries = new BookmarkQueries(supabaseConfig);
    this.bookmarkStats = new BookmarkStats(supabaseConfig);
    this.userPreferences = new UserPreferences(supabaseConfig);
    this.realtimeManager = new RealtimeManager(supabaseConfig);
    this.importExport = new ImportExport(supabaseConfig);
  }

  /**
   * Initialize the Supabase service
   * @description Initializes all modules and sets up the service
   * @throws {Error} When initialization fails
   */
  async initialize() {
    await this.initializer.initialize();

    // Initialize all modules with the configured client
    const supabaseClient = this.initializer.getSupabaseClient();
    this.supabase = supabaseClient; // Set the supabase property for backward compatibility

    this.bookmarkOperations.setSupabaseClient(supabaseClient);
    this.bookmarkQueries.setSupabaseClient(supabaseClient);
    this.bookmarkStats.setSupabaseClient(supabaseClient);
    this.userPreferences.setSupabaseClient(supabaseClient);
    this.realtimeManager.setSupabaseClient(supabaseClient);
    this.importExport.setSupabaseClient(supabaseClient);

    // Set cross-module references
    this.bookmarkOperations.setBookmarkQueries(this.bookmarkQueries);
  }

  // Bookmark Operations - Delegate to bookmark operations module
  async saveBookmark(bookmark) {
    return this.bookmarkOperations.saveBookmark(bookmark);
  }

  async updateBookmark(bookmarkId, updates) {
    return this.bookmarkOperations.updateBookmark(bookmarkId, updates);
  }

  async deleteBookmark(bookmarkId) {
    return this.bookmarkOperations.deleteBookmark(bookmarkId);
  }

  // Bookmark Queries - Delegate to bookmark queries module
  async getBookmarks(options = {}) {
    return this.bookmarkQueries.getBookmarks(options);
  }

  async getBookmarkByUrl(url) {
    return this.bookmarkQueries.getBookmarkByUrl(url);
  }

  async getBookmarkById(bookmarkId) {
    return this.bookmarkQueries.getBookmarkById(bookmarkId);
  }

  // Bookmark Stats - Delegate to bookmark stats module
  async getBookmarkStats() {
    return this.bookmarkStats.getBookmarkStats();
  }

  // User Preferences - Delegate to user preferences module
  async saveUserPreferences(preferences) {
    return this.userPreferences.saveUserPreferences(preferences);
  }

  async getUserPreferences() {
    return this.userPreferences.getUserPreferences();
  }

  // Realtime - Delegate to realtime manager module
  subscribeToBookmarks(callback) {
    return this.realtimeManager.subscribeToBookmarks(callback);
  }

  unsubscribe(channelName) {
    return this.realtimeManager.unsubscribe(channelName);
  }

  // Import/Export - Delegate to import export module
  async exportData() {
    return this.importExport.exportData();
  }

  async importData(importData) {
    return this.importExport.importData(importData);
  }

  // Utility methods - Delegate to initializer
  isAuthenticated() {
    return this.initializer.isAuthenticated();
  }

  getCurrentUser() {
    return this.initializer.getCurrentUser();
  }
}

export default SupabaseService;
