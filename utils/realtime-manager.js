/**
 * @fileoverview Real-time manager for Supabase subscriptions
 * @module realtime-manager
 * @description Manages Supabase real-time subscriptions and channel cleanup
 */

/**
 * Real-time manager for handling subscriptions
 * @class RealtimeManager
 * @description Manages Supabase real-time subscriptions and channel cleanup
 */
export class RealtimeManager {
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
        },
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
