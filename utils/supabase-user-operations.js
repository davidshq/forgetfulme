/**
 * @fileoverview User operations for Supabase service
 * @module supabase-user-operations
 * @description Handles user preferences operations
 */

import ErrorHandler from './error-handler.js';

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
   */
  constructor(supabase, config, pendingRequests) {
    this.supabase = supabase;
    this.config = config;
    this.pendingRequests = pendingRequests;
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
        'supabase-service.saveUserPreferences',
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
        'supabase-service.getUserPreferences',
      );
    }

    const userId = this.config.getCurrentUser().id;
    const requestKey = this._getRequestKey('getUserPreferences', {}, userId);

    return this._deduplicateRequest(requestKey, async () => {
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
  }
}
