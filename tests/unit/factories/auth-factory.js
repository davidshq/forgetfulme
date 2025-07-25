/**
 * @fileoverview Authentication test factories for unit tests
 * @module auth-factory
 * @description Factory functions for creating authentication-related test data in unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import {
  TEST_USER,
  TEST_AUTH_SESSION,
  TEST_SUPABASE_CONFIG,
} from '../../shared/constants.js';

/**
 * Create a mock authentication session for unit tests
 * @param {Object} overrides - Override values for the session
 * @returns {Object} Mock authentication session
 */
export const createMockAuthSession = (overrides = {}) => ({
  user: { ...TEST_USER },
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  ...overrides,
});

/**
 * Create a mock Supabase configuration for unit tests
 * @param {Object} overrides - Override values for the configuration
 * @returns {Object} Mock Supabase configuration
 */
export const createMockSupabaseConfig = (overrides = {}) => ({
  url: TEST_SUPABASE_CONFIG.url,
  anonKey: TEST_SUPABASE_CONFIG.anonKey,
  ...overrides,
});

/**
 * Create a mock user object for unit tests
 * @param {Object} overrides - Override values for the user
 * @returns {Object} Mock user object
 */
export const createMockUser = (overrides = {}) => ({
  id: TEST_USER.id,
  email: TEST_USER.email,
  name: TEST_USER.name,
  ...overrides,
});

/**
 * Create a mock Chrome storage object for unit tests
 * @param {Object} overrides - Override values for the storage
 * @returns {Object} Mock Chrome storage object
 */
export const createMockChromeStorage = (overrides = {}) => ({
  supabaseConfig: createMockSupabaseConfig(),
  auth_session: createMockAuthSession(),
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});

/**
 * Create a mock authentication error for unit tests
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Mock authentication error
 */
export const createMockAuthError = (
  message = 'Authentication failed',
  code = 'AUTH_ERROR'
) => ({
  message,
  code,
  status: 401,
  name: 'AuthError',
});

/**
 * Create a mock Supabase client for unit tests
 * @param {Object} overrides - Override values for the client
 * @returns {Object} Mock Supabase client
 */
export const createMockSupabaseClient = (overrides = {}) => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(),
  ...overrides,
});
