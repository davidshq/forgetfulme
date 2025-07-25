/**
 * @fileoverview Playwright-specific test factories for integration/E2E tests
 * @module playwright-factories
 * @description Factory functions for creating test data in Playwright integration/E2E tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TEST_USER, TEST_AUTH_SESSION, TEST_SUPABASE_CONFIG } from '../../shared/constants.js';

/**
 * Create authenticated state for Playwright integration tests
 * @function createAuthenticatedState
 * @param {Object} overrides - Override values for the authenticated state
 * @returns {Object} Chrome storage data for authenticated state
 * @description Creates authenticated state for Playwright integration/E2E testing
 */
export const createAuthenticatedState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig
  },
  auth_session: {
    user: { ...TEST_USER, ...overrides.user },
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    ...overrides.auth_session
  },
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  // Add the config structure that ConfigManager expects
  config: {
    supabase: {
      url: TEST_SUPABASE_CONFIG.url,
      anonKey: TEST_SUPABASE_CONFIG.anonKey,
      ...overrides.supabaseConfig
    },
    preferences: {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
    },
    auth: {
      user: { ...TEST_USER, ...overrides.user },
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      ...overrides.auth_session
    }
  },
  ...overrides
});

/**
 * Create unconfigured state for Playwright integration tests
 * @function createUnconfiguredState
 * @param {Object} overrides - Override values for the unconfigured state
 * @returns {Object} Chrome storage data for unconfigured state
 * @description Creates unconfigured state for Playwright integration/E2E testing
 */
export const createUnconfiguredState = (overrides = {}) => ({
  supabaseConfig: null,
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  // Add the config structure that ConfigManager expects
  config: {
    supabase: null,
    preferences: {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
    },
    auth: null
  },
  ...overrides
});

/**
 * Create configured but unauthenticated state for Playwright integration tests
 * @function createConfiguredState
 * @param {Object} overrides - Override values for the configured state
 * @returns {Object} Chrome storage data for configured but unauthenticated state
 * @description Creates configured but unauthenticated state for Playwright integration/E2E testing
 */
export const createConfiguredState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig
  },
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  // Add the config structure that ConfigManager expects
  config: {
    supabase: {
      url: TEST_SUPABASE_CONFIG.url,
      anonKey: TEST_SUPABASE_CONFIG.anonKey,
      ...overrides.supabaseConfig
    },
    preferences: {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
    },
    auth: null
  },
  ...overrides
});

/**
 * Create invalid configuration state for Playwright integration tests
 * @function createInvalidConfigState
 * @param {Object} overrides - Override values for the invalid config state
 * @returns {Object} Chrome storage data for invalid configuration state
 * @description Creates invalid configuration state for Playwright integration/E2E testing
 */
export const createInvalidConfigState = (overrides = {}) => ({
  supabaseConfig: {
    url: 'https://invalid.supabase.co',
    anonKey: 'invalid-key',
    ...overrides.supabaseConfig
  },
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  config: {
    supabase: {
      url: 'https://invalid.supabase.co',
      anonKey: 'invalid-key',
      ...overrides.supabaseConfig
    },
    preferences: {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
    },
    auth: null
  },
  ...overrides
});

/**
 * Create expired session state for Playwright integration tests
 * @function createExpiredSessionState
 * @param {Object} overrides - Override values for the expired session state
 * @returns {Object} Chrome storage data for expired session state
 * @description Creates expired session state for Playwright integration/E2E testing
 */
export const createExpiredSessionState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig
  },
  auth_session: {
    user: { ...TEST_USER, ...overrides.user },
    access_token: 'expired-access-token',
    refresh_token: 'expired-refresh-token',
    expires_at: Date.now() - 3600000, // Expired 1 hour ago
    ...overrides.auth_session
  },
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  config: {
    supabase: {
      url: TEST_SUPABASE_CONFIG.url,
      anonKey: TEST_SUPABASE_CONFIG.anonKey,
      ...overrides.supabaseConfig
    },
    preferences: {
      customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
    },
    auth: {
      user: { ...TEST_USER, ...overrides.user },
      access_token: 'expired-access-token',
      refresh_token: 'expired-refresh-token',
      expires_at: Date.now() - 3600000,
      ...overrides.auth_session
    }
  },
  ...overrides
});

/**
 * Create bookmark data for Playwright integration tests
 * @function createBookmarkData
 * @param {Object} overrides - Override values for the bookmark data
 * @returns {Object} Bookmark data for integration tests
 * @description Creates bookmark data for Playwright integration/E2E testing
 */
export const createBookmarkData = (overrides = {}) => ({
  id: 'test-bookmark-id',
  url: 'https://example.com',
  title: 'Test Bookmark',
  read_status: 'read',
  tags: ['test'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

/**
 * Create bookmark list for Playwright integration tests
 * @function createBookmarkList
 * @param {number} count - Number of bookmarks to create
 * @param {Object} overrides - Override values for the bookmarks
 * @returns {Array} Array of bookmark data
 * @description Creates a list of bookmark data for Playwright integration/E2E testing
 */
export const createBookmarkList = (count = 3, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createBookmarkData({
      id: `test-bookmark-${index}`,
      url: `https://example${index}.com`,
      title: `Test Bookmark ${index}`,
      ...overrides
    })
  );
};

/**
 * Create user data for Playwright integration tests
 * @function createUserData
 * @param {Object} overrides - Override values for the user data
 * @returns {Object} User data for integration tests
 * @description Creates user data for Playwright integration/E2E testing
 */
export const createUserData = (overrides = {}) => ({
  id: TEST_USER.id,
  email: TEST_USER.email,
  name: TEST_USER.name,
  ...overrides
});

/**
 * Create authentication session for Playwright integration tests
 * @function createAuthSession
 * @param {Object} overrides - Override values for the auth session
 * @returns {Object} Authentication session for integration tests
 * @description Creates authentication session for Playwright integration/E2E testing
 */
export const createAuthSession = (overrides = {}) => ({
  user: createUserData(overrides.user),
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  ...overrides
});

/**
 * Create Supabase configuration for Playwright integration tests
 * @function createSupabaseConfig
 * @param {Object} overrides - Override values for the Supabase config
 * @returns {Object} Supabase configuration for integration tests
 * @description Creates Supabase configuration for Playwright integration/E2E testing
 */
export const createSupabaseConfig = (overrides = {}) => ({
  url: TEST_SUPABASE_CONFIG.url,
  anonKey: TEST_SUPABASE_CONFIG.anonKey,
  ...overrides
});

/**
 * Create test page data for Playwright integration tests
 * @function createTestPageData
 * @param {Object} overrides - Override values for the page data
 * @returns {Object} Test page data for integration tests
 * @description Creates test page data for Playwright integration/E2E testing
 */
export const createTestPageData = (overrides = {}) => ({
  url: 'https://example.com',
  title: 'Test Page',
  favicon: 'https://example.com/favicon.ico',
  ...overrides
});

/**
 * Create form data for Playwright integration tests
 * @function createFormData
 * @param {Object} data - Form field data
 * @returns {Object} Form data for integration tests
 * @description Creates form data for Playwright integration/E2E testing
 */
export const createFormData = (data = {}) => ({
  email: 'test@example.com',
  password: 'testpassword',
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-anon-key',
  ...data
});

/**
 * Create error response for Playwright integration tests
 * @function createErrorResponse
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code
 * @returns {Object} Error response for integration tests
 * @description Creates error response for Playwright integration/E2E testing
 */
export const createErrorResponse = (message = 'Test error', status = 500, code = 'TEST_ERROR') => ({
  error: {
    message,
    code,
    status,
    details: 'Test error details'
  }
});

/**
 * Create success response for Playwright integration tests
 * @function createSuccessResponse
 * @param {Object} data - Response data
 * @returns {Object} Success response for integration tests
 * @description Creates success response for Playwright integration/E2E testing
 */
export const createSuccessResponse = (data = {}) => ({
  success: true,
  data,
  message: 'Operation completed successfully'
});

/**
 * Create test environment configuration for Playwright integration tests
 * @function createTestEnvironmentConfig
 * @param {Object} overrides - Override values for the environment config
 * @returns {Object} Test environment configuration
 * @description Creates test environment configuration for Playwright integration/E2E testing
 */
export const createTestEnvironmentConfig = (overrides = {}) => ({
  baseUrl: 'http://localhost:3000',
  extensionId: 'test-extension-id',
  timeout: 10000,
  retries: 2,
  ...overrides
});

/**
 * Create test user credentials for Playwright integration tests
 * @function createTestCredentials
 * @param {Object} overrides - Override values for the credentials
 * @returns {Object} Test user credentials
 * @description Creates test user credentials for Playwright integration/E2E testing
 */
export const createTestCredentials = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'testpassword123',
  ...overrides
});

/**
 * Create test bookmark status for Playwright integration tests
 * @function createBookmarkStatus
 * @param {string} status - Bookmark status
 * @param {Object} overrides - Override values for the status
 * @returns {Object} Bookmark status data
 * @description Creates bookmark status data for Playwright integration/E2E testing
 */
export const createBookmarkStatus = (status = 'read', overrides = {}) => ({
  status,
  timestamp: new Date().toISOString(),
  user_id: TEST_USER.id,
  ...overrides
});

/**
 * Create test tag data for Playwright integration tests
 * @function createTagData
 * @param {string} name - Tag name
 * @param {Object} overrides - Override values for the tag
 * @returns {Object} Tag data
 * @description Creates tag data for Playwright integration/E2E testing
 */
export const createTagData = (name = 'test-tag', overrides = {}) => ({
  name,
  color: '#007bff',
  created_at: new Date().toISOString(),
  ...overrides
});

/**
 * Create test notification data for Playwright integration tests
 * @function createNotificationData
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {Object} overrides - Override values for the notification
 * @returns {Object} Notification data
 * @description Creates notification data for Playwright integration/E2E testing
 */
export const createNotificationData = (type = 'info', message = 'Test notification', overrides = {}) => ({
  type,
  message,
  title: 'Test Notification',
  timestamp: new Date().toISOString(),
  ...overrides
}); 