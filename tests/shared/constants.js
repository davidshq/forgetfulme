/**
 * @fileoverview Shared constants for ForgetfulMe extension tests
 * @module test-constants
 * @description Common test data and constants used across unit and integration tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Test user data for authentication tests
 * @type {Object}
 */
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

/**
 * Test Supabase configuration
 * @type {Object}
 */
export const TEST_SUPABASE_CONFIG = {
  url: 'https://test.supabase.co',
  anonKey: 'test-anon-key'
};

/**
 * Test bookmark data
 * @type {Object}
 */
export const TEST_BOOKMARK = {
  id: 'test-bookmark-id',
  url: 'https://example.com/test-page',
  title: 'Test Page Title',
  status: 'read',
  tags: 'test, integration',
  notes: 'Test bookmark for integration testing',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

/**
 * Test authentication session
 * @type {Object}
 */
export const TEST_AUTH_SESSION = {
  user: TEST_USER,
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000 // 1 hour from now
};

/**
 * Default custom status types
 * @type {Array<string>}
 */
export const DEFAULT_STATUS_TYPES = [
  'read',
  'good-reference',
  'low-value',
  'revisit-later'
];

/**
 * Test error messages
 * @type {Object}
 */
export const TEST_ERROR_MESSAGES = {
  CONFIG_REQUIRED: 'Supabase configuration is required',
  AUTH_REQUIRED: 'Authentication is required',
  NETWORK_ERROR: 'Network connection failed',
  VALIDATION_ERROR: 'Invalid input provided'
};

/**
 * Test Chrome storage keys
 * @type {Object}
 */
export const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'supabaseConfig',
  AUTH_SESSION: 'auth_session',
  CUSTOM_STATUS_TYPES: 'customStatusTypes'
}; 