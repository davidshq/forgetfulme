import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as handlers from '../../../../bookmark-management/events/handlers.js';
import SimpleModal from '../../../../utils/simple-modal.js';

// Mock SimpleModal
vi.mock('../../../../utils/simple-modal.js', () => ({
  default: {
    confirm: vi.fn((message, onConfirm, onCancel, options) => {
      // For testing, we'll track the calls
      return { message, onConfirm, onCancel, options };
    }),
  },
}));

// Mock chrome.tabs API
global.chrome = {
  tabs: {
    create: vi.fn(),
  },
};

describe('Bookmark Event Handlers', () => {
  let mockDependencies;

  beforeEach(() => {
    // Setup mock dependencies
    mockDependencies = {
      supabaseService: {
        getBookmarks: vi.fn(),
        deleteBookmark: vi.fn(),
        updateBookmark: vi.fn(),
      },
      UIComponents: {
        DOM: {
          getValue: vi.fn(),
          getElement: vi.fn(),
        },
      },
      UIMessages: {
        success: vi.fn(),
        error: vi.fn(),
      },
      ErrorHandler: {
        handle: vi.fn().mockReturnValue({
          userMessage: 'Test error message',
        }),
      },
      BookmarkTransformer: {
        toUIFormat: vi.fn(b => b),
      },
      appContainer: document.createElement('div'),
      displayBookmarks: vi.fn(),
      loadAllBookmarks: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteBookmark', () => {
    it('should show confirmation dialog with correct message', async () => {
      const bookmarkId = 'test-123';
      const bookmarkTitle = 'Test Bookmark';

      await handlers.deleteBookmark({
        ...mockDependencies,
        bookmarkId,
        bookmarkTitle,
      });

      expect(SimpleModal.confirm).toHaveBeenCalledTimes(1);
      const [message, , , options] = SimpleModal.confirm.mock.calls[0];

      expect(message).toContain(bookmarkTitle);
      expect(message).toContain('Are you sure');
      expect(message).toContain('cannot be undone');
      expect(options.confirmText).toBe('Delete');
      expect(options.cancelText).toBe('Cancel');
    });

    it('should delete bookmark when confirmed', async () => {
      const bookmarkId = 'test-123';
      const bookmarkTitle = 'Test Bookmark';

      mockDependencies.supabaseService.deleteBookmark.mockResolvedValue(true);

      await handlers.deleteBookmark({
        ...mockDependencies,
        bookmarkId,
        bookmarkTitle,
      });

      // Get the onConfirm callback from the mock
      const onConfirm = SimpleModal.confirm.mock.calls[0][1];

      // Call the confirm callback
      await onConfirm();

      expect(
        mockDependencies.supabaseService.deleteBookmark
      ).toHaveBeenCalledWith(bookmarkId);
      expect(mockDependencies.UIMessages.success).toHaveBeenCalledWith(
        'Bookmark deleted successfully!',
        mockDependencies.appContainer
      );
      expect(mockDependencies.loadAllBookmarks).toHaveBeenCalled();
    });

    it('should handle delete errors gracefully', async () => {
      const bookmarkId = 'test-123';
      const bookmarkTitle = 'Test Bookmark';
      const testError = new Error('Delete failed');

      mockDependencies.supabaseService.deleteBookmark.mockRejectedValue(
        testError
      );

      await handlers.deleteBookmark({
        ...mockDependencies,
        bookmarkId,
        bookmarkTitle,
      });

      // Get the onConfirm callback
      const onConfirm = SimpleModal.confirm.mock.calls[0][1];

      // Call the confirm callback
      await onConfirm();

      expect(mockDependencies.ErrorHandler.handle).toHaveBeenCalledWith(
        testError,
        'bookmark-management.deleteBookmark'
      );
      expect(mockDependencies.UIMessages.error).toHaveBeenCalledWith(
        'Test error message',
        mockDependencies.appContainer
      );
    });

    it('should not delete when cancelled', async () => {
      const bookmarkId = 'test-123';
      const bookmarkTitle = 'Test Bookmark';

      await handlers.deleteBookmark({
        ...mockDependencies,
        bookmarkId,
        bookmarkTitle,
      });

      // Get the onCancel callback
      const onCancel = SimpleModal.confirm.mock.calls[0][2];

      // Call the cancel callback
      onCancel();

      expect(
        mockDependencies.supabaseService.deleteBookmark
      ).not.toHaveBeenCalled();
      expect(mockDependencies.UIMessages.success).not.toHaveBeenCalled();
      expect(mockDependencies.loadAllBookmarks).not.toHaveBeenCalled();
    });
  });

  describe('openBookmark', () => {
    it('should use chrome.tabs.create when available', () => {
      const url = 'https://example.com';

      handlers.openBookmark({ url });

      expect(chrome.tabs.create).toHaveBeenCalledWith({ url });
    });

    it('should fall back to window.open when chrome.tabs is not available', () => {
      // Remove chrome.tabs temporarily
      const originalChrome = global.chrome;
      global.chrome = {};

      // Mock window.open
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      const url = 'https://example.com';
      handlers.openBookmark({ url });

      expect(mockOpen).toHaveBeenCalledWith(url, '_blank');

      // Restore
      global.chrome = originalChrome;
    });
  });

  describe('searchBookmarks', () => {
    it('should search with correct filters', async () => {
      mockDependencies.UIComponents.DOM.getValue.mockImplementation(id => {
        if (id === 'search-query') return 'test search';
        if (id === 'status-filter') return 'read';
        return '';
      });

      mockDependencies.supabaseService.getBookmarks.mockResolvedValue([
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' },
      ]);

      await handlers.searchBookmarks(mockDependencies);

      expect(
        mockDependencies.supabaseService.getBookmarks
      ).toHaveBeenCalledWith({
        limit: 100,
        search: 'test search',
        status: 'read',
      });

      expect(mockDependencies.displayBookmarks).toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      const testError = new Error('Search failed');
      mockDependencies.supabaseService.getBookmarks.mockRejectedValue(
        testError
      );

      await handlers.searchBookmarks(mockDependencies);

      expect(mockDependencies.ErrorHandler.handle).toHaveBeenCalledWith(
        testError,
        'bookmark-management.searchBookmarks'
      );
      expect(mockDependencies.UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark with new data', async () => {
      const bookmarkId = 'test-123';
      const showMainInterface = vi.fn();

      mockDependencies.UIComponents.DOM.getValue.mockImplementation(id => {
        if (id === 'edit-read-status') return 'good-reference';
        if (id === 'edit-tags') return 'tag1, tag2, tag3';
        return '';
      });

      mockDependencies.supabaseService.updateBookmark.mockResolvedValue(true);

      // Use fake timers to test setTimeout
      vi.useFakeTimers();

      await handlers.updateBookmark({
        ...mockDependencies,
        bookmarkId,
        showMainInterface,
      });

      expect(
        mockDependencies.supabaseService.updateBookmark
      ).toHaveBeenCalledWith(
        bookmarkId,
        expect.objectContaining({
          read_status: 'good-reference',
          tags: ['tag1', 'tag2', 'tag3'],
          updated_at: expect.any(String),
        })
      );

      expect(mockDependencies.UIMessages.success).toHaveBeenCalledWith(
        'Bookmark updated successfully!',
        mockDependencies.appContainer
      );

      // Fast forward past the timeout
      vi.advanceTimersByTime(1500);
      expect(showMainInterface).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle empty tags', async () => {
      const bookmarkId = 'test-123';

      mockDependencies.UIComponents.DOM.getValue.mockImplementation(id => {
        if (id === 'edit-read-status') return 'read';
        if (id === 'edit-tags') return ''; // Empty tags
        return '';
      });

      await handlers.updateBookmark({
        ...mockDependencies,
        bookmarkId,
        showMainInterface: vi.fn(),
      });

      const updateCall =
        mockDependencies.supabaseService.updateBookmark.mock.calls[0];
      expect(updateCall[1].tags).toEqual([]);
    });
  });
});
