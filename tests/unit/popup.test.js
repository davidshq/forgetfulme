import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../helpers/register-page-mocks.js';
import {
  configureUIComponentStubs,
  PAGE_ERROR_HANDLER_RESULT,
} from '../helpers/vi-module-mocks.js';

/**
 * @fileoverview Unit tests for ForgetfulMePopup using Kent Dodds testing methodology
 * @module popup.test
 * @description Tests for the main popup interface using Kent Dodds' testing principles:
 *
 * 1. Test behavior, not implementation details
 * 2. Use proper async/await patterns for callback testing
 * 3. Mock at the right level (module boundaries)
 * 4. Focus on user interactions and outcomes
 * 5. Use descriptive test names that explain the scenario
 *
 * Key methodology applied:
 * - For async callbacks (like UIMessages.confirm), capture the callback
 * - Use setTimeout(0) to allow async operations to start
 * - Manually trigger callbacks to simulate user interactions
 * - Test the actual behavior rather than internal implementation
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

vi.mock('../../utils/app-initializer.js', () => ({
  initializeApp: vi.fn().mockResolvedValue(),
}));

// Mock component modules
vi.mock('../../components/quick-add.js', () => ({
  QuickAdd: class MockQuickAdd {
    constructor() {
      this.createFormCard = vi
        .fn()
        .mockReturnValue(document.createElement('article'));
      this.getFormValues = vi
        .fn()
        .mockReturnValue({ status: 'read', tags: '' });
      this.clearForm = vi.fn();
    }
  },
}));

vi.mock('../../components/recent-list.js', () => ({
  RecentList: class MockRecentList {
    constructor(options = {}) {
      this.onPageChange = options.onPageChange;
      this.createCard = vi.fn().mockReturnValue(document.createElement('div'));
      this.loadRecentEntries = vi.fn();
      this.displayBookmarks = vi.fn();
      this.showError = vi.fn();
      this.container = null;
    }
  },
}));

vi.mock('../../components/status-selector.js', () => ({
  StatusSelector: class MockStatusSelector {
    constructor() {
      this.loadCustomStatusTypes = vi.fn();
    }
  },
}));

// Import the module under test AFTER mocking
import ForgetfulMePopup from '../../popup.js';
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';
import SupabaseService from '../../supabase-service.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';
import * as bookmarkEditView from '../../components/bookmark-edit-view.js';
import { STORAGE_KEYS, RECENT_LIST_LIMIT } from '../../utils/constants.js';

describe('ForgetfulMePopup', () => {
  let popup;
  let mockSupabaseService;
  let mockUIComponents;
  let mockUIMessages;
  let mockErrorHandler;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Get references to mocked modules
    mockUIComponents = UIComponents;
    mockUIMessages = UIMessages;
    mockErrorHandler = ErrorHandler;

    ErrorHandler.handle = vi.fn().mockReturnValue(PAGE_ERROR_HANDLER_RESULT);

    // Mock BookmarkTransformer.fromCurrentTab
    BookmarkTransformer.fromCurrentTab = vi.fn().mockReturnValue({
      url: 'https://example.com',
      title: 'Test Page',
      read_status: 'read',
      tags: ['test'],
    });

    // Create a new instance of SupabaseService and ensure methods are vi.fn() instances
    mockSupabaseService = new SupabaseService({}, { initialize: vi.fn() });
    mockSupabaseService.saveBookmark = vi.fn();
    mockSupabaseService.updateBookmark = vi.fn();
    mockSupabaseService.getBookmarks = vi.fn();
    mockSupabaseService.deleteBookmark = vi.fn();
    mockSupabaseService.getBookmarkById = vi.fn();

    // Mock DOM elements - create consistent elements
    const mockAppContainer = document.createElement('div');
    const mockReadStatus = document.createElement('select');
    const mockTags = document.createElement('input');
    const mockSettingsBtn = document.createElement('button');
    const mockRecentList = document.createElement('div');
    const mockEditReadStatus = document.createElement('select');
    const mockEditTags = document.createElement('input');

    configureUIComponentStubs(mockUIComponents, {
      getElement: id => {
        if (id === 'app') return mockAppContainer;
        if (id === 'read-status') return mockReadStatus;
        if (id === 'tags') return mockTags;
        if (id === 'settings-btn') return mockSettingsBtn;
        if (id === 'recent-list') return mockRecentList;
        if (id === 'edit-read-status') return mockEditReadStatus;
        if (id === 'edit-tags') return mockEditTags;
        return null;
      },
    });

    // Mock chrome tabs
    chrome.tabs.query.mockResolvedValue([
      {
        url: 'https://example.com',
        title: 'Test Page',
      },
    ]);

    // Create popup instance using factory method
    popup = await ForgetfulMePopup.create();

    // Ensure appContainer is set (in case initializeElements didn't run properly)
    if (!popup.appContainer) {
      popup.appContainer = mockAppContainer;
    }

    // Replace the popup's service instances with our mocked ones
    popup.supabaseService = mockSupabaseService;
    popup.supabaseConfig = {
      isConfigured: vi.fn().mockResolvedValue(true),
      initialize: vi.fn().mockResolvedValue(),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('markAsRead', () => {
    it('should save new bookmark when no duplicate exists', async () => {
      // Mock successful save
      mockSupabaseService.saveBookmark.mockResolvedValue({
        id: 'new-bookmark-id',
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
      });

      popup.quickAdd.getFormValues.mockReturnValue({
        status: 'read',
        tags: 'test, tags',
      });

      await popup.markAsRead();

      expect(mockSupabaseService.saveBookmark).toHaveBeenCalled();
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        'Page marked as read!',
        expect.any(Object),
      );
    });

    it('should show edit interface when duplicate bookmark exists', async () => {
      const existingBookmark = {
        id: 'existing-bookmark-id',
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
        tags: ['existing'],
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock duplicate save
      mockSupabaseService.saveBookmark.mockResolvedValue({
        ...existingBookmark,
        isDuplicate: true,
      });

      popup.quickAdd.getFormValues.mockReturnValue({
        status: 'read',
        tags: 'test, tags',
      });

      // Mock UI components for edit interface
      mockUIComponents.createButton.mockReturnValue(
        document.createElement('button'),
      );
      mockUIComponents.createSection.mockReturnValue(
        document.createElement('div'),
      );
      mockUIComponents.createForm.mockReturnValue(
        document.createElement('form'),
      );

      await popup.markAsRead();

      expect(mockSupabaseService.saveBookmark).toHaveBeenCalled();
      expect(mockUIMessages.success).not.toHaveBeenCalled();
      // Should show edit interface instead of success message
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Test error');
      mockSupabaseService.saveBookmark.mockRejectedValue(mockError);

      popup.quickAdd.getFormValues.mockReturnValue({
        status: 'read',
        tags: 'test, tags',
      });

      await popup.markAsRead();

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        mockError,
        'popup.markAsRead',
      );
      expect(mockUIMessages.error).toHaveBeenCalledWith(
        'Test error message',
        expect.any(Object),
      );
    });
  });

  describe('consumePendingMarkAsRead', () => {
    it('clears pending only after a successful shortcut save', async () => {
      const pending = {
        url: 'https://example.com',
        requestedAt: Date.now(),
      };

      chrome.storage.session.get.mockResolvedValue({
        [STORAGE_KEYS.PENDING_MARK_AS_READ]: pending,
      });

      mockSupabaseService.saveBookmark.mockResolvedValue({
        id: 'new-bookmark-id',
        url: 'https://example.com',
        title: 'Test Page',
        read_status: 'read',
      });

      popup.quickAdd.getFormValues.mockReturnValue({
        status: 'read',
        tags: '',
      });

      await popup.consumePendingMarkAsRead();

      expect(mockSupabaseService.saveBookmark).toHaveBeenCalled();
      expect(chrome.storage.session.remove).toHaveBeenCalledWith(
        STORAGE_KEYS.PENDING_MARK_AS_READ,
      );
    });

    it('keeps pending when mark-as-read fails', async () => {
      chrome.storage.session.get.mockResolvedValue({
        [STORAGE_KEYS.PENDING_MARK_AS_READ]: {
          url: 'https://example.com',
          requestedAt: Date.now(),
        },
      });

      mockSupabaseService.saveBookmark.mockRejectedValue(
        new Error('Save failed'),
      );

      popup.quickAdd.getFormValues.mockReturnValue({
        status: 'read',
        tags: '',
      });

      await popup.consumePendingMarkAsRead();

      expect(chrome.storage.session.remove).not.toHaveBeenCalled();
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark successfully', async () => {
      const bookmarkId = 'test-bookmark-id';

      // Mock successful update
      mockSupabaseService.updateBookmark.mockResolvedValue({
        id: bookmarkId,
        read_status: 'good-reference',
        tags: ['updated', 'tags'],
      });

      vi.spyOn(bookmarkEditView, 'getBookmarkEditFormData').mockReturnValue({
        read_status: 'good-reference',
        tags: ['updated', 'tags'],
        updated_at: '2024-01-01T00:00:00.000Z',
      });

      await popup.updateBookmark(bookmarkId);

      expect(mockSupabaseService.updateBookmark).toHaveBeenCalledWith(
        bookmarkId,
        {
          read_status: 'good-reference',
          tags: ['updated', 'tags'],
          updated_at: expect.any(String),
        },
      );
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        'Bookmark updated successfully!',
        expect.any(Object),
      );
    });

    it('should handle update errors', async () => {
      const bookmarkId = 'test-bookmark-id';
      const mockError = new Error('Update failed');
      mockSupabaseService.updateBookmark.mockRejectedValue(mockError);

      vi.spyOn(bookmarkEditView, 'getBookmarkEditFormData').mockReturnValue({
        read_status: 'read',
        tags: ['test'],
        updated_at: '2024-01-01T00:00:00.000Z',
      });

      await popup.updateBookmark(bookmarkId);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        mockError,
        'popup.updateBookmark',
      );
      expect(mockUIMessages.error).toHaveBeenCalledWith(
        'Test error message',
        expect.any(Object),
      );
    });
  });

  describe('loadRecentEntries', () => {
    it('loads the requested page with the recent list limit', async () => {
      const bookmarks = Array.from(
        { length: RECENT_LIST_LIMIT },
        (_, index) => ({
          id: `bookmark-${index}`,
          title: `Example ${index}`,
          read_status: 'read',
        }),
      );
      mockSupabaseService.getBookmarks.mockResolvedValue(bookmarks);

      await popup.loadRecentEntries(2);

      expect(mockSupabaseService.getBookmarks).toHaveBeenCalledWith({
        page: 2,
        limit: RECENT_LIST_LIMIT,
      });
      expect(popup.recentList.displayBookmarks).toHaveBeenCalledWith(
        bookmarks,
        { page: 2, hasNextPage: true },
      );
    });

    it('returns to page 1 when a later page is empty', async () => {
      mockSupabaseService.getBookmarks
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'bookmark-1', title: 'Example' }]);

      await popup.loadRecentEntries(2);

      expect(mockSupabaseService.getBookmarks).toHaveBeenNthCalledWith(1, {
        page: 2,
        limit: RECENT_LIST_LIMIT,
      });
      expect(mockSupabaseService.getBookmarks).toHaveBeenNthCalledWith(2, {
        page: 1,
        limit: RECENT_LIST_LIMIT,
      });
      expect(popup.recentPage).toBe(1);
    });

    it('shows an error state when loading fails', async () => {
      const mockError = new Error('Load failed');
      mockSupabaseService.getBookmarks.mockRejectedValue(mockError);

      await popup.loadRecentEntries();

      expect(popup.recentList.showError).toHaveBeenCalledWith(
        'Error loading entries',
      );
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        mockError,
        'popup.loadRecentEntries',
      );
    });
  });

  describe('showMainInterface', () => {
    it('reloads custom status types after rebuilding the main UI', async () => {
      const customTypes = ['read', 'archived'];
      popup.configManager.getCustomStatusTypes.mockResolvedValue(customTypes);

      popup.showMainInterface();

      await vi.waitFor(() => {
        expect(popup.statusSelector.loadCustomStatusTypes).toHaveBeenCalledWith(
          customTypes,
        );
      });
    });
  });

  describe('Bookmark Management', () => {
    it('should open bookmark management in new tab', () => {
      const mockTabsCreate = vi.fn();
      global.chrome.tabs.create = mockTabsCreate;
      global.chrome.runtime.getURL = vi
        .fn()
        .mockReturnValue('chrome-extension://test/bookmark-management.html');

      popup.showBookmarkManagement();

      expect(mockTabsCreate).toHaveBeenCalledWith({
        url: 'chrome-extension://test/bookmark-management.html',
      });
    });
  });
});
