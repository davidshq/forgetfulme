/**
 * @fileoverview User operations for Supabase service
 * @module supabase-user-operations
 * @description Handles user preferences operations
 */

import ErrorHandler from './error-handler.js';
import {
  deduplicateRequest,
  getRequestKey,
  requireSupabaseAuth,
} from './supabase-request-utils.js';

/**
 * User operations for Supabase service
 * @class UserOperations
 * @description Manages user preferences operations
 */
export class UserOperations {
  /**
   * Initialize user operations
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
   * Execute a user operation with token refresh handling
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
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<Object>} Saved preferences object
   * @throws {Error} When user is not authenticated
   */
  async saveUserPreferences(preferences) {
    requireSupabaseAuth(this.config, 'supabase-service.saveUserPreferences');

    return this._executeWithTokenRefresh(async () => {
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
    }, 'supabase-service.saveUserPreferences');
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences object
   * @throws {Error} When user is not authenticated
   */
  async getUserPreferences() {
    requireSupabaseAuth(this.config, 'supabase-service.getUserPreferences');

    return this._executeWithTokenRefresh(async () => {
      const userId = this.config.getCurrentUser().id;
      const requestKey = getRequestKey(
        'getUserPreferences',
        {},
        this.config,
        userId,
      );

      return deduplicateRequest(this.pendingRequests, requestKey, async () => {
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
      });
    }, 'supabase-service.getUserPreferences');
  }
}
