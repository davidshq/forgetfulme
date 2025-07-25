/**
 * @fileoverview Bookmark test factories for unit tests
 * @module bookmark-factory
 * @description Factory functions for creating bookmark-related test data in unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TEST_BOOKMARK, DEFAULT_STATUS_TYPES } from '../../shared/constants.js';

/**
 * Create a mock bookmark object for unit tests
 * @param {Object} overrides - Override values for the bookmark
 * @returns {Object} Mock bookmark object
 */
export const createMockBookmark = (overrides = {}) => ({
  id: TEST_BOOKMARK.id,
  url: TEST_BOOKMARK.url,
  title: TEST_BOOKMARK.title,
  status: TEST_BOOKMARK.status,
  tags: TEST_BOOKMARK.tags,
  notes: TEST_BOOKMARK.notes,
  createdAt: TEST_BOOKMARK.createdAt,
  updatedAt: TEST_BOOKMARK.updatedAt,
  ...overrides
});

/**
 * Create a mock bookmark list for unit tests
 * @param {number} count - Number of bookmarks to create
 * @param {Object} baseOverrides - Base override values for all bookmarks
 * @returns {Array<Object>} Array of mock bookmark objects
 */
export const createMockBookmarkList = (count = 3, baseOverrides = {}) => {
  const bookmarks = [];
  for (let i = 0; i < count; i++) {
    bookmarks.push(createMockBookmark({
      id: `bookmark-${i + 1}`,
      title: `Test Bookmark ${i + 1}`,
      url: `https://example.com/test-${i + 1}`,
      status: DEFAULT_STATUS_TYPES[i % DEFAULT_STATUS_TYPES.length],
      ...baseOverrides
    }));
  }
  return bookmarks;
};

/**
 * Create a mock bookmark form data for unit tests
 * @param {Object} overrides - Override values for the form data
 * @returns {Object} Mock bookmark form data
 */
export const createMockBookmarkFormData = (overrides = {}) => ({
  url: TEST_BOOKMARK.url,
  title: TEST_BOOKMARK.title,
  status: TEST_BOOKMARK.status,
  tags: TEST_BOOKMARK.tags,
  notes: TEST_BOOKMARK.notes,
  ...overrides
});

/**
 * Create a mock bookmark search result for unit tests
 * @param {Object} overrides - Override values for the search result
 * @returns {Object} Mock bookmark search result
 */
export const createMockBookmarkSearchResult = (overrides = {}) => ({
  data: createMockBookmarkList(2),
  count: 2,
  error: null,
  ...overrides
});

/**
 * Create a mock bookmark error for unit tests
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Mock bookmark error
 */
export const createMockBookmarkError = (message = 'Bookmark operation failed', code = 'BOOKMARK_ERROR') => ({
  message,
  code,
  status: 400,
  name: 'BookmarkError'
});

/**
 * Create a mock bookmark transformer result for unit tests
 * @param {Object} overrides - Override values for the transformer result
 * @returns {Object} Mock bookmark transformer result
 */
export const createMockBookmarkTransformerResult = (overrides = {}) => ({
  transformed: true,
  bookmark: createMockBookmark(),
  errors: [],
  ...overrides
}); 