/**
 * @fileoverview Test factories for shared test data and assertion helpers
 * @module test-factories
 */

import { expect } from 'vitest';

/**
 * Creates test data for common scenarios
 */
export const createTestData = {
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

  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  tab: (overrides = {}) => ({
    id: 1,
    url: 'https://example.com',
    title: 'Test Page',
    active: true,
    ...overrides,
  }),

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
 * @param {Object} mocks
 */
export const createAssertionHelpers = mocks => ({
  assertErrorHandling: (expectedContext = 'test') => {
    expect(mocks.errorHandler.handle).toHaveBeenCalledWith(
      expect.any(Error),
      expectedContext,
    );

    const errorResult = mocks.errorHandler.handle.mock.results[0].value;
    expect(mocks.uiMessages.error).toHaveBeenCalledWith(
      errorResult.userMessage,
      expect.anything(),
    );
  },

  assertSuccessMessage: expectedMessage => {
    expect(mocks.uiMessages.success).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything(),
    );
  },

  assertLoadingMessage: expectedMessage => {
    expect(mocks.uiMessages.loading).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything(),
    );
  },

  assertBookmarkSaved: expectedBookmark => {
    expect(mocks.supabaseService.saveBookmark).toHaveBeenCalledWith(
      expect.objectContaining(expectedBookmark),
    );
  },

  assertBookmarkUpdated: (bookmarkId, expectedUpdates) => {
    expect(mocks.supabaseService.updateBookmark).toHaveBeenCalledWith(
      bookmarkId,
      expect.objectContaining(expectedUpdates),
    );
  },
});
