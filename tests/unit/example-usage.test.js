/**
 * @fileoverview Enhanced Test Utilities Example
 * @module example-usage-test
 * @description Demonstrates proper usage of test factories and utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestData, createAssertionHelpers } from '../helpers/test-factories.js';

/**
 * Enhanced Test Utilities Example
 * @description Demonstrates proper usage of test factories and utilities
 */

describe('Enhanced Test Utilities Example', () => {
  describe('Test Data Factory Examples', () => {
    it('should create bookmark data with defaults', () => {
      const bookmark = createTestData.bookmark();

      expect(bookmark).toEqual({
        id: 'test-bookmark-id',
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
        tags: ['test', 'example'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should create bookmark data with overrides', () => {
      const bookmark = createTestData.bookmark({
        url: 'https://custom.com',
        title: 'Custom Bookmark',
        tags: ['custom'],
      });

      expect(bookmark.url).toBe('https://custom.com');
      expect(bookmark.title).toBe('Custom Bookmark');
      expect(bookmark.tags).toEqual(['custom']);
      expect(bookmark.id).toBe('test-bookmark-id'); // Default preserved
    });

    it('should create user data', () => {
      const user = createTestData.user();

      expect(user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should create tab data', () => {
      const tab = createTestData.tab();

      expect(tab).toEqual({
        id: 1,
        url: 'https://example.com',
        title: 'Test Page',
        active: true,
      });
    });

    it('should create error data', () => {
      const error = createTestData.error();

      expect(error).toEqual({
        message: 'Test error message',
        type: 'UNKNOWN',
        context: 'test',
        severity: 'MEDIUM',
      });
    });
  });

  describe('Assertion Helper Examples', () => {
    let mocks;
    let assertions;

    beforeEach(() => {
      mocks = {
        uiMessages: {
          success: vi.fn(),
          error: vi.fn(),
          loading: vi.fn(),
        },
        supabaseService: {
          saveBookmark: vi.fn(),
          updateBookmark: vi.fn(),
        },
        errorHandler: {
          handle: vi.fn(),
        },
      };
      assertions = createAssertionHelpers(mocks);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should assert success message', () => {
      mocks.uiMessages.success('Test success', document.createElement('div'));

      assertions.assertSuccessMessage('Test success');
    });

    it('should assert loading message', () => {
      mocks.uiMessages.loading('Loading...', document.createElement('div'));

      assertions.assertLoadingMessage('Loading...');
    });

    it('should assert bookmark saved', () => {
      const bookmarkData = createTestData.bookmark({
        url: 'https://example.com',
        title: 'Test Bookmark',
      });

      mocks.supabaseService.saveBookmark(bookmarkData);

      assertions.assertBookmarkSaved(bookmarkData);
    });

    it('should assert bookmark updated', () => {
      const bookmarkId = 'test-id';
      const updateData = { title: 'Updated Title' };

      mocks.supabaseService.updateBookmark(bookmarkId, updateData);

      assertions.assertBookmarkUpdated(bookmarkId, updateData);
    });

    it('should assert error handling', () => {
      const error = new Error('Test error');
      mocks.errorHandler.handle.mockReturnValue({
        userMessage: 'User friendly error',
        shouldShowToUser: true,
      });

      mocks.errorHandler.handle(error, 'test-context');
      mocks.uiMessages.error('User friendly error', document.createElement('div'));

      assertions.assertErrorHandling('test-context');
    });
  });

  describe('Custom Mock Examples', () => {
    it('should use custom mocks', async () => {
      // Create custom mocks
      const customMocks = {
        supabaseService: {
          saveBookmark: vi.fn().mockResolvedValue(
            createTestData.bookmark({
              id: 'custom-id',
              url: 'https://custom.com',
            }),
          ),
        },
        uiMessages: {
          success: vi.fn(),
          error: vi.fn(),
        },
      };

      // Verify custom mocks work
      const result = await customMocks.supabaseService.saveBookmark();
      expect(result.id).toBe('custom-id');
      expect(result.url).toBe('https://custom.com');

      customMocks.uiMessages.success('Test message');
      expect(customMocks.uiMessages.success).toHaveBeenCalledWith('Test message');
    });
  });
});
