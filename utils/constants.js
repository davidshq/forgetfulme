/**
 * @fileoverview Application constants
 * @module utils/constants
 * @description Centralized constants for message types and other shared values
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Message types for Chrome extension runtime messaging
 * @type {Object}
 */
export const MESSAGE_TYPES = {
  MARK_AS_READ: 'MARK_AS_READ',
  BOOKMARK_SAVED: 'BOOKMARK_SAVED',
  BOOKMARK_UPDATED: 'BOOKMARK_UPDATED',
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  GET_CONFIG_SUMMARY: 'GET_CONFIG_SUMMARY',
  CHECK_URL_STATUS: 'CHECK_URL_STATUS',
  URL_STATUS_RESULT: 'URL_STATUS_RESULT',
};

/**
 * Default retry configuration for network operations.
 * Used by retry-utils.js to provide consistent retry behavior across the extension.
 *
 * **Configuration:**
 * - MAX_RETRIES: Maximum number of retry attempts (3 attempts total)
 * - BASE_DELAY: Base delay in milliseconds for exponential backoff
 *
 * **Retry Timing:**
 * With default config (MAX_RETRIES=3, BASE_DELAY=1000):
 * - Attempt 1: Immediate (initial attempt, attempt=0)
 * - Attempt 2: After 1000ms delay (1000 * 2^0) if attempt 1 fails
 * - Attempt 3: After 2000ms delay (1000 * 2^1) if attempt 2 fails
 *
 * **When to Override:**
 * - Critical operations may need more retries (e.g., MAX_RETRIES: 5)
 * - Fast operations may use shorter delays (e.g., BASE_DELAY: 500)
 * - Slow operations may use longer delays (e.g., BASE_DELAY: 2000)
 *
 * @type {Object}
 * @property {number} MAX_RETRIES - Maximum number of retry attempts (default: 3)
 * @property {number} BASE_DELAY - Base delay in milliseconds for exponential backoff (default: 1000)
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
};
