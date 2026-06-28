import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../helpers/register-page-mocks.js';
import {
  configureUIComponentStubs,
  PAGE_ERROR_HANDLER_RESULT,
} from '../helpers/vi-module-mocks.js';

/**
 * @fileoverview Unit tests for BookmarkManagementPage using Kent Dodds testing methodology
 * @module bookmark-management.test
 * @description Tests for the bookmark management page using Kent Dodds' testing principles
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

vi.mock('../../components/bookmark-list.js', () => ({
  BookmarkList: class MockBookmarkList {
    constructor() {
      this.displayBookmarks = vi.fn();
    }
  },
}));

vi.mock('../../components/search-filter.js', () => ({
  SearchFilter: class MockSearchFilter {
    constructor() {
      this.createSearchForm = vi
        .fn()
        .mockReturnValue(document.createElement('form'));
    }
  },
}));

vi.mock('../../components/bulk-actions.js', () => ({
  BulkActions: class MockBulkActions {
    constructor() {
      this.createBulkActionsCard = vi
        .fn()
        .mockReturnValue(document.createElement('article'));
      this.updateBulkActions = vi.fn();
      this.toggleSelectAll = vi.fn();
    }
  },
}));

vi.mock('../../components/bookmark-editor.js', () => ({
  BookmarkEditor: class MockBookmarkEditor {
    constructor() {
      this.showEditInterface = vi.fn();
      this.getUpdateData = vi.fn();
    }
  },
}));

import BookmarkManagementPage from '../../bookmark-management.js';
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';
import SupabaseService from '../../supabase-service.js';

describe('BookmarkManagementPage', () => {
  let page;
  let mockSupabaseService;
  let mockUIComponents;
  let mockUIMessages;
  let mockErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUIComponents = UIComponents;
    mockUIMessages = UIMessages;
    mockErrorHandler = ErrorHandler;

    ErrorHandler.handle = vi.fn().mockReturnValue(PAGE_ERROR_HANDLER_RESULT);

    mockSupabaseService = new SupabaseService();
    mockSupabaseService.saveBookmark = vi.fn();
    mockSupabaseService.updateBookmark = vi.fn();
    mockSupabaseService.getBookmarks = vi.fn();
    mockSupabaseService.deleteBookmark = vi.fn();
    mockSupabaseService.getBookmarkById = vi.fn();

    const mockAppContainer = document.createElement('div');
    configureUIComponentStubs(mockUIComponents, {
      getElement: id => {
        if (id === 'app') return mockAppContainer;
        return null;
      },
    });

    page = new BookmarkManagementPage();

    page.supabaseService = mockSupabaseService;
    page.supabaseConfig = {
      isConfigured: vi.fn().mockResolvedValue(true),
      initialize: vi.fn().mockResolvedValue(),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(page).toBeDefined();
      expect(page.supabaseService).toBeDefined();
      expect(page.supabaseConfig).toBeDefined();
    });
  });

  describe('Bookmark Management', () => {
    // load/search/bulk flows live on BookmarkManagementCoordinator — see
    // bookmark-management-coordinator.test.js

    it('should handle bookmark deletion errors', async () => {
      const mockError = new Error('Delete failed');
      mockSupabaseService.deleteBookmark.mockRejectedValue(mockError);

      mockUIMessages.confirm.mockImplementation((message, confirmCallback) => {
        confirmCallback();
      });

      await page.deleteBookmark('bookmark-1', 'Test Bookmark');

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        mockError,
        'bookmark-management.deleteBookmark',
      );
      expect(mockUIMessages.error).toHaveBeenCalledWith(
        'Test error message',
        expect.any(Object),
      );
    });

    it('should open bookmark in new tab', () => {
      const mockTabsCreate = vi.fn();
      global.chrome.tabs.create = mockTabsCreate;

      page.openBookmark('https://example.com');

      expect(mockTabsCreate).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });

    it('should restore list view after update without calling showMainInterface', async () => {
      const showListViewSpy = vi
        .spyOn(page, 'showListView')
        .mockResolvedValue(undefined);
      const showMainInterfaceSpy = vi.spyOn(page, 'showMainInterface');

      page.bookmarkEditor.getUpdateData = vi.fn().mockReturnValue({
        read_status: 'read',
        tags: [],
        updated_at: new Date().toISOString(),
      });
      page.savedListState = { searchQuery: 'test', statusFilter: 'read' };
      mockSupabaseService.updateBookmark.mockResolvedValue({});

      await page.updateBookmark('bookmark-1');

      expect(mockSupabaseService.updateBookmark).toHaveBeenCalledWith(
        'bookmark-1',
        expect.objectContaining({ read_status: 'read' }),
      );
      expect(showListViewSpy).toHaveBeenCalledWith({
        searchQuery: 'test',
        statusFilter: 'read',
      });
      expect(showMainInterfaceSpy).not.toHaveBeenCalled();
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        'Bookmark updated successfully!',
        expect.any(Object),
      );
    });
  });
});
