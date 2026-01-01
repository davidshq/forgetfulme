/**
 * @fileoverview Retry utility functions
 * @module utils/retry-utils
 * @description Provides retry logic with exponential backoff for async operations.
 * Network failures and transient errors should be handled consistently using this utility.
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { RETRY_CONFIG } from './constants.js';

/**
 * Retry an async function with exponential backoff.
 * Use this for network operations, database queries, and other transient failures.
 *
 * **Retry Strategy:**
 * - Uses exponential backoff: delays increase as 1000ms, 2000ms, 4000ms, etc.
 * - Default: 3 retry attempts (3 total attempts)
 * - Only retries on errors; successful calls return immediately
 *
 * **When to Use:**
 * - Network operations (API calls, fetch requests)
 * - Database operations that may fail due to transient issues
 * - Service initialization that depends on network connectivity
 * - Any operation where ErrorHandler.shouldRetry() returns true
 *
 * **When NOT to Use:**
 * - Validation errors (user input issues)
 * - Configuration errors (missing required settings)
 * - UI errors (DOM manipulation issues)
 * - Operations that should fail fast without retries
 *
 * **Integration with ErrorHandler:**
 * This utility works with ErrorHandler.shouldRetry() to determine if an error
 * should be retried. Network and database errors are automatically retryable.
 *
 * @param {Function} fn - Async function to retry. Must return a Promise.
 * @param {number} [maxRetries=3] - Maximum number of retry attempts (default from RETRY_CONFIG)
 * @param {number} [baseDelay=1000] - Base delay in milliseconds (default from RETRY_CONFIG)
 * @returns {Promise<any>} Result of the function call
 * @throws {Error} The last error if all retries are exhausted
 *
 * @example
 * // Basic usage with default retry config
 * await retryWithBackoff(() => supabaseService.initialize());
 *
 * @example
 * // Custom retry configuration
 * await retryWithBackoff(
 *   () => supabaseService.saveBookmark(bookmark),
 *   5,  // maxRetries
 *   1000  // baseDelay (1 second)
 * );
 *
 * @example
 * // With error handling integration
 * try {
 *   await retryWithBackoff(() => supabaseService.getBookmarks());
 * } catch (error) {
 *   const errorResult = ErrorHandler.handle(error, 'bookmark.load');
 *   if (errorResult.shouldRetry) {
 *     // Show retry UI to user
 *     UIMessages.showWithRetry(errorResult.userMessage, retryFunction, container);
 *   }
 * }
 */
export async function retryWithBackoff(
  fn,
  maxRetries = RETRY_CONFIG.MAX_RETRIES,
  baseDelay = RETRY_CONFIG.BASE_DELAY,
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
