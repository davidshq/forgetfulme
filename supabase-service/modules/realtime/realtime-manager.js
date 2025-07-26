/**
 * @fileoverview Real-time manager for Supabase service
 * @module realtime-manager
 * @description Handles real-time subscriptions and channel management
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * Real-time manager for Supabase service
 * @class RealtimeManager
 * @description Manages Supabase real-time subscriptions and channel cleanup
 */
export class RealtimeManager {
  /**
   * Initialize the real-time manager
   * @constructor
   * @param {SupabaseConfig} supabaseConfig - The Supabase configuration instance
   * @description Sets up subscription tracking
   */
  constructor(supabaseConfig) {
    /** @type {SupabaseConfig} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Object|null} Supabase client instance */
    this.supabase = null;
    /** @type {Map} Map of active subscriptions */
    this.subscriptions = new Map();
  }

  /**
   * Set the Supabase client instance
   * @param {Object} supabaseClient - Supabase client instance
   * @description Sets the client for real-time operations
   */
  setSupabaseClient(supabaseClient) {
    this.supabase = supabaseClient;
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
        'realtime-manager.subscribeToBookmarks'
      );
    }

    const userId = this.config.getCurrentUser().id;
    return this._subscribeToBookmarks(userId, callback);
  }

  /**
   * Subscribe to bookmark changes for a user
   * @param {string} userId - User ID to subscribe for
   * @param {Function} callback - Callback function for changes
   * @returns {Object} Subscription object
   * @description Creates real-time subscription for bookmark changes
   * @private
   */
  _subscribeToBookmarks(userId, callback) {
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