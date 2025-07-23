/**
 * @fileoverview Test factories for creating specialized test instances
 * @module test-factories
 * @description Provides factory functions for creating specialized test instances with proper mocking
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';
import {
  setupTestWithMocks,
  setupModuleMocks,
  createMockElement,
} from './test-utils.js';

/**
 * Test factories for creating specialized test instances
 * @description These factories follow the recommended approach from ES_MODULE_MOCKING_ISSUE.md:
 * 1. Test individual utility modules separately (working approach)
 * 2. Use Playwright for integration testing (popup functionality)
 * 3. Focus on testing business logic in utility modules
 * 4. Accept ES module mocking limitations in Vitest
 *
 * Provides consistent setup patterns for different module types
 */

/**
 * Creates a complete auth UI test instance
 *
 * Tests the AuthUI module which handles authentication forms and user interactions.
 * This module is tested in isolation with mocked dependencies.
 *
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Promise<Object>} Complete auth UI test setup
 */
export const createAuthUITestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);

  // Create mock container
  const mockContainer = createMockElement('div', { id: 'test-container' });

  // Import the module under test AFTER mocking
  const AuthUI = (await import('../../auth-ui.js')).default;

  // Create auth UI instance
  const authUI = new AuthUI(
    mocks.supabaseConfig,
    vi.fn(), // onAuthSuccess
    mocks.authStateManager
  );

  return {
    authUI,
    mocks,
    container: mockContainer,
    cleanup,
  };
};

/**
 * Creates test data for common scenarios
 * @description Simple factory functions that create test objects - these are good to keep centralized
 */
export const createTestData = {
  /**
   * Creates sample bookmark data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample bookmark data
   */
  bookmark: (overrides = {}) => ({
    id: 'test-bookmark-id',
    url: 'https://example.com',
    title: 'Test Page',
    read_status: 'read',
    tags: ['test', 'example'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Creates sample user data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample user data
   */
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Creates sample tab data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample tab data
   */
  tab: (overrides = {}) => ({
    id: 1,
    url: 'https://example.com',
    title: 'Test Page',
    active: true,
    ...overrides,
  }),

  /**
   * Creates sample error data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample error data
   */
  error: (overrides = {}) => ({
    message: 'Test error message',
    type: 'UNKNOWN',
    context: 'test',
    severity: 'MEDIUM',
    ...overrides,
  }),
};

/**
 * Creates assertion helpers for common test patterns
 * @description Simple assertion patterns that are good to keep centralized
 */
export const createAssertionHelpers = mocks => ({
  /**
   * Asserts that error handling was called correctly
   * @param {string} expectedContext - Expected error context
   */
  assertErrorHandling: (expectedContext = 'test') => {
    expect(mocks.errorHandler.handle).toHaveBeenCalledWith(
      expect.any(Error),
      expectedContext
    );

    const errorResult = mocks.errorHandler.handle.mock.results[0].value;
    expect(mocks.uiMessages.error).toHaveBeenCalledWith(
      errorResult.userMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a success message was shown
   * @param {string} expectedMessage - Expected success message
   */
  assertSuccessMessage: expectedMessage => {
    expect(mocks.uiMessages.success).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a loading message was shown
   * @param {string} expectedMessage - Expected loading message
   */
  assertLoadingMessage: expectedMessage => {
    expect(mocks.uiMessages.loading).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a bookmark was saved correctly
   * @param {Object} expectedBookmark - Expected bookmark data
   */
  assertBookmarkSaved: expectedBookmark => {
    expect(mocks.supabaseService.saveBookmark).toHaveBeenCalledWith(
      expect.objectContaining(expectedBookmark)
    );
  },

  /**
   * Asserts that a bookmark was updated correctly
   * @param {string} bookmarkId - Expected bookmark ID
   * @param {Object} expectedUpdates - Expected update data
   */
  assertBookmarkUpdated: (bookmarkId, expectedUpdates) => {
    expect(mocks.supabaseService.updateBookmark).toHaveBeenCalledWith(
      bookmarkId,
      expect.objectContaining(expectedUpdates)
    );
  },
});
