import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPopupTestInstance, createAuthUITestInstance, createTestData, createAssertionHelpers } from '../helpers/test-factories.js';
import { setupModuleMocks } from '../helpers/test-utils.js';

// Setup module mocks at the top level due to Vitest hoisting
setupModuleMocks();

/**
 * Example test file demonstrating the enhanced test utilities
 * This shows how to use the new test factories and utilities
 */

describe('Enhanced Test Utilities Example', () => {
  describe('Popup Tests with Enhanced Utilities', () => {
    let testContext;

    beforeEach(async () => {
      // Use the new factory to create a complete test instance
      testContext = await createPopupTestInstance();
    });

    afterEach(() => {
      testContext.cleanup();
    });

    it('should save new bookmark when no duplicate exists', async () => {
      const { popup, mocks, domElements } = testContext;
      
      // Setup mocks for successful save
      mocks.supabaseService.saveBookmark.mockResolvedValue(
        createTestData.bookmark({
          id: 'new-bookmark-id',
          url: 'https://example.com',
          title: 'Test Page',
        })
      );

      mocks.uiComponents.DOM.getValue
        .mockReturnValueOnce('read')
        .mockReturnValueOnce('test, tags');

      // Mock BookmarkTransformer to return the expected data
      const BookmarkTransformer = (await import('../../utils/bookmark-transformer.js')).default;
      BookmarkTransformer.fromCurrentTab.mockReturnValue({
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
        tags: ['test', 'tags'],
      });

      // Execute
      await popup.markAsRead();

      // Assert that saveBookmark was called with the right data
      expect(mocks.supabaseService.saveBookmark).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
        tags: ['test', 'tags'],
      });
    });

    it('should handle network errors gracefully', async () => {
      const { popup, mocks } = testContext;
      
      // Setup mocks for network error
      mocks.supabaseService.saveBookmark.mockRejectedValue(
        new Error('Network error')
      );

      // Ensure error handler returns proper structure
      const ErrorHandler = (await import('../../utils/error-handler.js')).default;
      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'NETWORK',
          severity: 'HIGH',
          message: 'Network error',
          context: 'popup.markAsRead',
          originalError: new Error('Network error')
        },
        userMessage: 'Network error occurred',
        shouldRetry: false,
        shouldShowToUser: true,
        technicalMessage: 'Network error',
      });

      // Execute
      await popup.markAsRead();

      // Assert that error handler was called
      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'popup.markAsRead'
      );
    });
  });

  describe('Auth UI Tests with Enhanced Utilities', () => {
    let testContext;

    beforeEach(async () => {
      // Use the new factory to create a complete auth UI test instance
      testContext = await createAuthUITestInstance();
    });

    afterEach(() => {
      testContext.cleanup();
    });

    it('should handle successful login', async () => {
      const { authUI, mocks, container } = testContext;
      
      // Setup mocks for successful login
      mocks.supabaseConfig.signIn.mockResolvedValue({
        user: createTestData.user(),
        session: { access_token: 'test-token' }
      });

      mocks.uiComponents.DOM.getValue
        .mockReturnValueOnce('test@example.com')
        .mockReturnValueOnce('password123');

      // Execute
      await authUI.handleLogin(container);

      // Assert
      expect(mocks.supabaseConfig.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      
      // Assert that success message was shown
      expect(mocks.uiMessages.success).toHaveBeenCalledWith(
        'Login successful!',
        expect.any(Object)
      );
    });

    it('should validate required fields', async () => {
      const { authUI, mocks, container } = testContext;
      
      // Setup mocks for empty values
      mocks.uiComponents.DOM.getValue.mockReturnValue('');

      // Execute
      await authUI.handleLogin(container);

      // Assert that error message was shown
      expect(mocks.uiMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        expect.any(Object)
      );
    });
  });

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
        title: 'Custom Page',
        tags: ['custom'],
      });
      
      expect(bookmark.url).toBe('https://custom.com');
      expect(bookmark.title).toBe('Custom Page');
      expect(bookmark.tags).toEqual(['custom']);
      expect(bookmark.id).toBe('test-bookmark-id'); // Default preserved
    });

    it('should create user data', () => {
      const user = createTestData.user({
        email: 'custom@example.com',
      });
      
      expect(user).toEqual({
        id: 'test-user-id',
        email: 'custom@example.com',
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    it('should create tab data', () => {
      const tab = createTestData.tab({
        url: 'https://tab.com',
        title: 'Tab Page',
      });
      
      expect(tab).toEqual({
        id: 1,
        url: 'https://tab.com',
        title: 'Tab Page',
        active: true,
      });
    });

    it('should create error data', () => {
      const error = createTestData.error({
        message: 'Custom error',
        type: 'NETWORK',
        severity: 'HIGH',
      });
      
      expect(error).toEqual({
        message: 'Custom error',
        type: 'NETWORK',
        context: 'test',
        severity: 'HIGH',
      });
    });
  });

  describe('Custom Mock Examples', () => {
    it('should use custom mocks', async () => {
      // Create custom mocks
      const customMocks = {
        supabaseService: {
          saveBookmark: vi.fn().mockResolvedValue({
            id: 'custom-id',
            url: 'https://custom.com',
          }),
          getBookmarks: vi.fn().mockResolvedValue([]),
        },
        uiMessages: {
          success: vi.fn(),
          error: vi.fn(),
        },
      };

      // Use custom mocks in test instance
      const testContext = await createPopupTestInstance(customMocks);
      
      expect(testContext.mocks.supabaseService.saveBookmark).toBe(customMocks.supabaseService.saveBookmark);
      expect(testContext.mocks.uiMessages.success).toBe(customMocks.uiMessages.success);
      
      testContext.cleanup();
    });
  });
}); 