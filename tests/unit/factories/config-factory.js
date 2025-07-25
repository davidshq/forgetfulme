/**
 * @fileoverview Configuration test factories for unit tests
 * @module config-factory
 * @description Factory functions for creating configuration-related test data in unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import {
  TEST_SUPABASE_CONFIG,
  DEFAULT_STATUS_TYPES,
} from '../../shared/constants.js';

/**
 * Create a mock configuration object for unit tests
 * @param {Object} overrides - Override values for the configuration
 * @returns {Object} Mock configuration object
 */
export const createMockConfig = (overrides = {}) => ({
  supabase: TEST_SUPABASE_CONFIG,
  preferences: {
    customStatusTypes: DEFAULT_STATUS_TYPES,
  },
  auth: null,
  ...overrides,
});

/**
 * Create a mock Supabase configuration for unit tests
 * @param {Object} overrides - Override values for the Supabase configuration
 * @returns {Object} Mock Supabase configuration
 */
export const createMockSupabaseConfig = (overrides = {}) => ({
  url: TEST_SUPABASE_CONFIG.url,
  anonKey: TEST_SUPABASE_CONFIG.anonKey,
  ...overrides,
});

/**
 * Create a mock user preferences object for unit tests
 * @param {Object} overrides - Override values for the preferences
 * @returns {Object} Mock user preferences object
 */
export const createMockPreferences = (overrides = {}) => ({
  customStatusTypes: DEFAULT_STATUS_TYPES,
  theme: 'light',
  language: 'en',
  ...overrides,
});

/**
 * Create a mock Chrome storage object for unit tests
 * @param {Object} overrides - Override values for the storage
 * @returns {Object} Mock Chrome storage object
 */
export const createMockChromeStorage = (overrides = {}) => ({
  supabaseConfig: createMockSupabaseConfig(),
  customStatusTypes: DEFAULT_STATUS_TYPES,
  auth_session: null,
  ...overrides,
});

/**
 * Create a mock configuration error for unit tests
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Mock configuration error
 */
export const createMockConfigError = (
  message = 'Configuration error',
  code = 'CONFIG_ERROR'
) => ({
  message,
  code,
  status: 500,
  name: 'ConfigError',
});

/**
 * Create a mock configuration validation result for unit tests
 * @param {Object} overrides - Override values for the validation result
 * @returns {Object} Mock configuration validation result
 */
export const createMockConfigValidationResult = (overrides = {}) => ({
  isValid: true,
  errors: [],
  warnings: [],
  ...overrides,
});

/**
 * Create a mock configuration migration result for unit tests
 * @param {Object} overrides - Override values for the migration result
 * @returns {Object} Mock configuration migration result
 */
export const createMockConfigMigrationResult = (overrides = {}) => ({
  migrated: true,
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  changes: [],
  ...overrides,
});
