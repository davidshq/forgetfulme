/**
 * @fileoverview Unit tests for bookmark management coordinator
 * @module tests/unit/bookmark-management-coordinator
 * @description Tests for BookmarkManagementCoordinator class
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BookmarkManagementCoordinator } from '../../utils/bookmark-management-coordinator.js';
import { BOOKMARK_LIST_LIMIT } from '../../utils/constants.js';

import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';

// Mock dependencies
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      getElement: vi.fn(id => {
        if (id === 'bookmarks-list') {
          return document.createElement('ul');
        }
        return null;
      }),
    },
  },
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn((_error, _context) => ({
      userMessage: 'Error message',
      shouldShowToUser: true,
    })),
  },
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    confirm: vi.fn((_message, onConfirm, _onCancel, _container) => {
      if (onConfirm) {
        return onConfirm();
      }
      return undefined;
    }),
  },
}));

describe('BookmarkManagementCoordinator', () => {
  let coordinator;
  let mockPage;

  async function waitForConfirmCallback() {
    const confirmResult = UIMessages.confirm.mock.results.at(-1)?.value;
    if (confirmResult) {
      await confirmResult;
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    UIComponents.DOM.getElement.mockImplementation(id => {
      if (id === 'bookmarks-list') {
        return document.createElement('ul');
      }
      return null;
    });

    // Create a mock page object
    mockPage = {
      supabaseService: {
        getBookmarks: vi.fn(),
        deleteBookmark: vi.fn(),
        getBookmarkById: vi.fn(),
      },
      searchFilter: {
        getFilters: vi.fn(() => ({
          search: 'test',
          status: 'read',
          limit: BOOKMARK_LIST_LIMIT,
        })),
      },
      bookmarkList: {
        displayBookmarks: vi.fn(),
        removeBookmarkItem: vi.fn(),
      },
      bulkActions: {
        getSelectedIds: vi.fn(() => ['id1', 'id2']),
        updateBulkActions: vi.fn(),
        exportSelectedBookmarks: vi.fn(),
        downloadExport: vi.fn(),
      },
      appContainer: document.createElement('div'),
    };

    coordinator = new BookmarkManagementCoordinator(mockPage);
  });

  describe('constructor', () => {
    test('should initialize with page instance', () => {
      expect(coordinator.page).toBe(mockPage);
    });
  });

  describe('loadAllBookmarks', () => {
    test('should load and display all bookmarks', async () => {
      const mockBookmarks = [
        { id: '1', title: 'Bookmark 1' },
        { id: '2', title: 'Bookmark 2' },
      ];

      mockPage.supabaseService.getBookmarks.mockResolvedValue(mockBookmarks);

      await coordinator.loadAllBookmarks();

      expect(mockPage.supabaseService.getBookmarks).toHaveBeenCalledWith({
        limit: BOOKMARK_LIST_LIMIT,
      });
      expect(mockPage.bookmarkList.displayBookmarks).toHaveBeenCalledWith(
        mockBookmarks,
        expect.anything(),
      );
      expect(mockPage.bulkActions.updateBulkActions).toHaveBeenCalled();
    });

    test('should handle errors when loading bookmarks', async () => {
      const mockError = new Error('Failed to load');
      mockPage.supabaseService.getBookmarks.mockRejectedValue(mockError);

      const UIMessages = (await import('../../utils/ui-messages.js')).default;

      await coordinator.loadAllBookmarks();

      expect(UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('displayBookmarks', () => {
    test('should display bookmarks in the list', () => {
      const bookmarks = [
        { id: '1', title: 'Bookmark 1' },
        { id: '2', title: 'Bookmark 2' },
      ];

      coordinator.displayBookmarks(bookmarks);

      expect(mockPage.bookmarkList.displayBookmarks).toHaveBeenCalledWith(
        bookmarks,
        expect.anything(),
      );
      expect(mockPage.bulkActions.updateBulkActions).toHaveBeenCalled();
    });

    test('should handle missing bookmarks list element', () => {
      UIComponents.DOM.getElement.mockReturnValueOnce(null);

      const bookmarks = [{ id: '1', title: 'Bookmark 1' }];

      coordinator.displayBookmarks(bookmarks);

      // Should not throw, but also should not call displayBookmarks
      expect(mockPage.bookmarkList.displayBookmarks).not.toHaveBeenCalled();
    });
  });

  describe('searchBookmarks', () => {
    test('should search bookmarks with filters', async () => {
      const mockBookmarks = [{ id: '1', title: 'Test Bookmark' }];
      mockPage.supabaseService.getBookmarks.mockResolvedValue(mockBookmarks);

      await coordinator.searchBookmarks();

      expect(mockPage.searchFilter.getFilters).toHaveBeenCalled();
      expect(mockPage.supabaseService.getBookmarks).toHaveBeenCalledWith({
        search: 'test',
        status: 'read',
        limit: BOOKMARK_LIST_LIMIT,
      });
      expect(mockPage.bookmarkList.displayBookmarks).toHaveBeenCalled();
    });

    test('should handle errors when searching', async () => {
      const mockError = new Error('Search failed');
      mockPage.supabaseService.getBookmarks.mockRejectedValue(mockError);

      const UIMessages = (await import('../../utils/ui-messages.js')).default;

      await coordinator.searchBookmarks();

      expect(UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('deleteSelectedBookmarks', () => {
    test('should delete selected bookmarks', async () => {
      mockPage.bulkActions.getSelectedIds.mockReturnValue(['id1', 'id2']);
      mockPage.supabaseService.deleteBookmark.mockResolvedValue(true);

      await coordinator.deleteSelectedBookmarks();
      await waitForConfirmCallback();

      expect(UIMessages.confirm).toHaveBeenCalled();
      expect(mockPage.supabaseService.deleteBookmark).toHaveBeenCalledTimes(2);
      expect(mockPage.supabaseService.deleteBookmark).toHaveBeenCalledWith(
        'id1',
      );
      expect(mockPage.supabaseService.deleteBookmark).toHaveBeenCalledWith(
        'id2',
      );
      expect(mockPage.bookmarkList.removeBookmarkItem).toHaveBeenCalledTimes(2);
      expect(UIMessages.success).toHaveBeenCalled();
    });

    test('should not delete when no bookmarks are selected', async () => {
      mockPage.bulkActions.getSelectedIds.mockReturnValue([]);

      await coordinator.deleteSelectedBookmarks();

      expect(mockPage.supabaseService.deleteBookmark).not.toHaveBeenCalled();
    });

    test('should handle errors when deleting', async () => {
      mockPage.bulkActions.getSelectedIds.mockReturnValue(['id1']);
      const mockError = new Error('Delete failed');
      mockPage.supabaseService.deleteBookmark.mockRejectedValue(mockError);

      await coordinator.deleteSelectedBookmarks();
      await waitForConfirmCallback();

      expect(UIMessages.error).toHaveBeenCalled();
    });

    test('should update bulk actions after deletion', async () => {
      mockPage.bulkActions.getSelectedIds.mockReturnValue(['id1']);
      mockPage.supabaseService.deleteBookmark.mockResolvedValue(true);

      await coordinator.deleteSelectedBookmarks();
      await waitForConfirmCallback();

      expect(mockPage.bulkActions.updateBulkActions).toHaveBeenCalled();
    });
  });

  describe('exportSelectedBookmarks', () => {
    test('should export selected bookmarks', async () => {
      const mockExportData = {
        bookmarks: [
          { id: 'id1', title: 'Bookmark 1' },
          { id: 'id2', title: 'Bookmark 2' },
        ],
      };

      mockPage.bulkActions.exportSelectedBookmarks.mockResolvedValue(
        mockExportData,
      );
      mockPage.bulkActions.getSelectedIds.mockReturnValue(['id1', 'id2']);

      const UIMessages = (await import('../../utils/ui-messages.js')).default;

      await coordinator.exportSelectedBookmarks();

      expect(mockPage.bulkActions.exportSelectedBookmarks).toHaveBeenCalled();
      expect(mockPage.bulkActions.downloadExport).toHaveBeenCalledWith(
        mockExportData,
      );
      expect(UIMessages.success).toHaveBeenCalled();
    });

    test('should not export when exportData is null', async () => {
      mockPage.bulkActions.exportSelectedBookmarks.mockResolvedValue(null);

      await coordinator.exportSelectedBookmarks();

      expect(mockPage.bulkActions.downloadExport).not.toHaveBeenCalled();
    });

    test('should handle errors when exporting', async () => {
      const mockError = new Error('Export failed');
      mockPage.bulkActions.exportSelectedBookmarks.mockRejectedValue(mockError);

      const UIMessages = (await import('../../utils/ui-messages.js')).default;

      await coordinator.exportSelectedBookmarks();

      expect(UIMessages.error).toHaveBeenCalled();
    });
  });
});
