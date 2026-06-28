/**
 * @fileoverview Supabase request and auth utilities
 * @module utils/supabase-request-utils
 * @description Shared helpers for auth guards and coalescing in-flight Supabase
 * API calls.
 */

import ErrorHandler from './error-handler.js';

/**
 * Require an authenticated Supabase user before an operation runs.
 *
 * @param {Object} config - Supabase config with auth helpers
 * @param {Function} config.isAuthenticated - Returns whether a user is signed in
 * @param {string} context - Error context string (e.g. `supabase-service.saveBookmark`)
 * @throws {Error} When user is not authenticated
 */
export function requireSupabaseAuth(config, context) {
  if (!config.isAuthenticated()) {
    throw ErrorHandler.createError(
      'User not authenticated',
      ErrorHandler.ERROR_TYPES.AUTH,
      context,
    );
  }
}

/**
 * Generate a unique key for request deduplication.
 *
 * Keys combine the method name, user id (or `anonymous`), and serialized
 * parameters so concurrent callers with the same inputs share one promise.
 *
 * @param {string} methodName - Name of the method being called
 * @param {any} params - Parameters for the method
 * @param {Object} config - Supabase config with auth helpers
 * @param {Function} config.isAuthenticated - Returns whether a user is signed in
 * @param {Function} config.getCurrentUser - Returns the current user object
 * @param {string} [userId] - Optional user ID to include in key
 * @returns {string} Unique request key
 */
export function getRequestKey(methodName, params, config, userId = null) {
  const paramKey = JSON.stringify(params || {});
  const userKey =
    userId ||
    (config.isAuthenticated() ? config.getCurrentUser()?.id : 'anonymous');
  return `${methodName}:${userKey}:${paramKey}`;
}

/**
 * Deduplicate a request by checking for in-flight requests with the same key.
 *
 * @param {Map<string, Promise<any>>} pendingRequests - Map of in-flight requests
 * @param {string} requestKey - Unique key for the request
 * @param {Function} requestFn - Function that performs the actual API call
 * @returns {Promise<any>} Promise that resolves with the request result
 */
export async function deduplicateRequest(
  pendingRequests,
  requestKey,
  requestFn,
) {
  const existingRequest = pendingRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = requestFn()
    .then(result => {
      pendingRequests.delete(requestKey);
      return result;
    })
    .catch(error => {
      pendingRequests.delete(requestKey);
      throw error;
    });

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}
