/**
 * @fileoverview Bookmark test factories for integration tests
 * @module bookmark-factory
 * @description Factory functions for creating bookmark-related test data in Playwright integration tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TEST_BOOKMARK, DEFAULT_STATUS_TYPES } from '../../shared/constants.js';

/**
 * Create bookmark form data for integration tests
 * @param {Object} overrides - Override values for the form data
 * @returns {Object} Bookmark form data
 */
export const createBookmarkFormData = (overrides = {}) => ({
  url: TEST_BOOKMARK.url,
  title: TEST_BOOKMARK.title,
  status: TEST_BOOKMARK.status,
  tags: TEST_BOOKMARK.tags,
  notes: TEST_BOOKMARK.notes,
  ...overrides
});

/**
 * Create bookmark search data for integration tests
 * @param {Object} overrides - Override values for the search data
 * @returns {Object} Bookmark search data
 */
export const createBookmarkSearchData = (overrides = {}) => ({
  query: 'test',
  status: 'read',
  tags: 'integration',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides
});

/**
 * Create bookmark filter data for integration tests
 * @param {Object} overrides - Override values for the filter data
 * @returns {Object} Bookmark filter data
 */
export const createBookmarkFilterData = (overrides = {}) => ({
  status: DEFAULT_STATUS_TYPES[0],
  tags: ['test', 'integration'],
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  ...overrides
});

/**
 * Create bookmark edit data for integration tests
 * @param {Object} overrides - Override values for the edit data
 * @returns {Object} Bookmark edit data
 */
export const createBookmarkEditData = (overrides = {}) => ({
  title: 'Updated Test Bookmark',
  status: 'good-reference',
  tags: 'updated, test, integration',
  notes: 'Updated notes for testing',
  ...overrides
});

/**
 * Create bookmark bulk operation data for integration tests
 * @param {Object} overrides - Override values for the bulk operation data
 * @returns {Object} Bookmark bulk operation data
 */
export const createBookmarkBulkData = (overrides = {}) => ({
  bookmarkIds: ['bookmark-1', 'bookmark-2', 'bookmark-3'],
  action: 'delete', // or 'export', 'update-status'
  newStatus: 'read',
  ...overrides
});

/**
 * Create bookmark export data for integration tests
 * @param {Object} overrides - Override values for the export data
 * @returns {Object} Bookmark export data
 */
export const createBookmarkExportData = (overrides = {}) => ({
  format: 'json', // or 'csv', 'html'
  includeMetadata: true,
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  ...overrides
}); 