/**
 * @fileoverview Authentication test factories for integration tests
 * @module auth-factory
 * @description Factory functions for creating authentication-related test data in Playwright integration tests
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
 * Create authenticated state for integration tests
 * @param {Object} overrides - Override values for the authenticated state
 * @returns {Object} Chrome storage data for authenticated state
 */
export const createAuthenticatedState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig,
  },
  auth_session: {
    user: { ...TEST_USER, ...overrides.user },
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    ...overrides.auth_session,
  },
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});

/**
 * Create unconfigured state for integration tests
 * @param {Object} overrides - Override values for the unconfigured state
 * @returns {Object} Chrome storage data for unconfigured state
 */
export const createUnconfiguredState = (overrides = {}) => ({
  supabaseConfig: null,
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});

/**
 * Create configured but unauthenticated state for integration tests
 * @param {Object} overrides - Override values for the configured state
 * @returns {Object} Chrome storage data for configured but unauthenticated state
 */
export const createConfiguredState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig,
  },
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});

/**
 * Create invalid configuration state for integration tests
 * @param {Object} overrides - Override values for the invalid configuration
 * @returns {Object} Chrome storage data for invalid configuration state
 */
export const createInvalidConfigState = (overrides = {}) => ({
  supabaseConfig: {
    url: 'https://invalid.supabase.co',
    anonKey: 'invalid-key',
    ...overrides.supabaseConfig,
  },
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});

/**
 * Create expired session state for integration tests
 * @param {Object} overrides - Override values for the expired session
 * @returns {Object} Chrome storage data for expired session state
 */
export const createExpiredSessionState = (overrides = {}) => ({
  supabaseConfig: {
    url: TEST_SUPABASE_CONFIG.url,
    anonKey: TEST_SUPABASE_CONFIG.anonKey,
    ...overrides.supabaseConfig,
  },
  auth_session: {
    user: { ...TEST_USER, ...overrides.user },
    access_token: 'expired-access-token',
    refresh_token: 'expired-refresh-token',
    expires_at: Date.now() - 3600000, // Expired 1 hour ago
    ...overrides.auth_session,
  },
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides,
});
