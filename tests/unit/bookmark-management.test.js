import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatStatus, formatTime } from '../../utils/formatters.js';

/**
 * @fileoverview Unit tests for BookmarkManagementPage using Kent Dodds testing methodology
 * @module bookmark-management.test
 * @description Tests for the bookmark management page using Kent Dodds' testing principles
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Mock dependencies BEFORE importing the module under test
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      ready: vi.fn().mockResolvedValue(),
      getElement: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn(),
      querySelector: vi.fn(),
    },
    createButton: vi.fn(),
    createForm: vi.fn(),
    createSection: vi.fn(),
    createContainer: vi.fn(),
    createListItem: vi.fn(),
    createList: vi.fn(),
  },
}));

vi.mock('../../utils/auth-state-manager.js', () => ({
  default: class MockAuthStateManager {
    constructor() {
      this.initialize = vi.fn().mockResolvedValue();
      this.isAuthenticated = vi.fn().mockResolvedValue(true);
      this.addListener = vi.fn();
    }
  },
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn(),
    ERROR_TYPES: {
      NETWORK: 'NETWORK',
      AUTH: 'AUTH',
      VALIDATION: 'VALIDATION',
      DATABASE: 'DATABASE',
      CONFIG: 'CONFIG',
      UI: 'UI',
      UNKNOWN: 'UNKNOWN',
    },
    SEVERITY: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    },
  },
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('../../utils/config-manager.js', () => ({
  default: class MockConfigManager {
    constructor() {
      this.initialize = vi.fn().mockResolvedValue();
      this.getCustomStatusTypes = vi.fn().mockResolvedValue([]);
    }
  },
}));

vi.mock('../../utils/bookmark-transformer.js', () => ({
  default: {
    toUIFormat: vi.fn(),
    fromCurrentTab: vi.fn(),
  },
}));

vi.mock('../../supabase-config.js', () => ({
  default: class MockSupabaseConfig {
    constructor() {
      this.isConfigured = vi.fn().mockResolvedValue(true);
      this.initialize = vi.fn().mockResolvedValue();
      this.getCurrentUser = vi.fn().mockReturnValue({ id: 'test-user-id' });
    }
  },
}));

vi.mock('../../supabase-service.js', () => ({
  default: class MockSupabaseService {
    constructor() {
      this.initialize = vi.fn().mockResolvedValue();
      this.saveBookmark = vi.fn();
      this.getBookmarks = vi.fn();
      this.updateBookmark = vi.fn();
      this.deleteBookmark = vi.fn();
      this.getBookmarkById = vi.fn();
    }
  },
}));

// Mock chrome API
global.chrome = {
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    openOptionsPage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

// Import the module under test AFTER mocking
import BookmarkManagementPage from '../../bookmark-management.js';
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';
import SupabaseService from '../../supabase-service.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

describe('BookmarkManagementPage', () => {
  let page;
  let mockSupabaseService;
  let mockUIComponents;
  let mockUIMessages;
  let mockErrorHandler;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Get references to mocked modules
    mockUIComponents = UIComponents;
    mockUIMessages = UIMessages;
    mockErrorHandler = ErrorHandler;

    // Directly replace the ErrorHandler.handle method to ensure it returns the correct structure
    ErrorHandler.handle = vi.fn().mockReturnValue({
      errorInfo: {
        type: 'UNKNOWN',
        severity: 'MEDIUM',
        message: 'Test error message',
        context: 'test',
        originalError: new Error('Test error message'),
      },
      userMessage: 'Test error message',
      shouldRetry: false,
      shouldShowToUser: true,
    });

    // Mock BookmarkTransformer.toUIFormat
    BookmarkTransformer.toUIFormat = vi.fn().mockImplementation(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      status: bookmark.read_status,
      tags: bookmark.tags,
      created_at: bookmark.created_at,
    }));

    // Create a new instance of SupabaseService and ensure methods are vi.fn() instances
    mockSupabaseService = new SupabaseService();
    mockSupabaseService.saveBookmark = vi.fn();
    mockSupabaseService.updateBookmark = vi.fn();
    mockSupabaseService.getBookmarks = vi.fn();
    mockSupabaseService.deleteBookmark = vi.fn();
    mockSupabaseService.getBookmarkById = vi.fn();

    // Mock DOM elements
    const mockAppContainer = document.createElement('div');
    mockUIComponents.DOM.getElement.mockImplementation(id => {
      if (id === 'app') return mockAppContainer;
      return null;
    });

    // Create page instance
    page = new BookmarkManagementPage();

    // Replace the page's service instances with our mocked ones
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
    it('should load all bookmarks successfully', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          url: 'https://example.com',
          title: 'Test Bookmark 1',
          read_status: 'read',
          tags: ['test'],
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'bookmark-2',
          url: 'https://example2.com',
          title: 'Test Bookmark 2',
          read_status: 'good-reference',
          tags: ['important'],
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabaseService.getBookmarks.mockResolvedValue(mockBookmarks);

      // Mock UI components
      mockUIComponents.createButton.mockReturnValue(
        document.createElement('button')
      );
      mockUIComponents.createSection.mockReturnValue(
        document.createElement('div')
      );
      mockUIComponents.createForm.mockReturnValue(
        document.createElement('form')
      );
      mockUIComponents.createList.mockReturnValue(document.createElement('ul'));
      mockUIComponents.createListItem.mockReturnValue(
        document.createElement('li')
      );

      // Mock document.getElementById for bookmarks list
      const mockBookmarksList = document.createElement('ul');
      document.getElementById = vi.fn().mockReturnValue(mockBookmarksList);

      await page.loadAllBookmarks();

      expect(mockSupabaseService.getBookmarks).toHaveBeenCalledWith({
        limit: 100,
      });
      expect(BookmarkTransformer.toUIFormat).toHaveBeenCalledTimes(2);
    });

    it('should search bookmarks with filters', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          url: 'https://example.com',
          title: 'Test Bookmark',
          read_status: 'read',
          tags: ['test'],
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseService.getBookmarks.mockResolvedValue(mockBookmarks);
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('test') // search-query
        .mockReturnValueOnce('read'); // status-filter

      // Mock document.getElementById for bookmarks list
      const mockBookmarksList = document.createElement('ul');
      document.getElementById = vi.fn().mockReturnValue(mockBookmarksList);

      await page.searchBookmarks();

      expect(mockSupabaseService.getBookmarks).toHaveBeenCalledWith({
        limit: 100,
        search: 'test',
        status: 'read',
      });
    });

    it('should delete a bookmark with confirmation', async () => {
      mockSupabaseService.deleteBookmark.mockResolvedValue(true);

      // Mock confirmation dialog to immediately call the confirm callback
      mockUIMessages.confirm.mockImplementation((message, confirmCallback) => {
        confirmCallback();
      });

      // Mock loadAllBookmarks to prevent errors
      page.loadAllBookmarks = vi.fn().mockResolvedValue();

      await page.deleteBookmark('bookmark-1', 'Test Bookmark');

      expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledWith(
        'bookmark-1'
      );
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        'Bookmark deleted successfully!',
        expect.any(Object)
      );
      expect(page.loadAllBookmarks).toHaveBeenCalled();
    });

    it('should handle bookmark deletion errors', async () => {
      const mockError = new Error('Delete failed');
      mockSupabaseService.deleteBookmark.mockRejectedValue(mockError);

      // Mock confirmation dialog to immediately call the confirm callback
      mockUIMessages.confirm.mockImplementation((message, confirmCallback) => {
        confirmCallback();
      });

      await page.deleteBookmark('bookmark-1', 'Test Bookmark');

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        mockError,
        'bookmark-management.deleteBookmark'
      );
      expect(mockUIMessages.error).toHaveBeenCalledWith(
        'Test error message',
        expect.any(Object)
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

    it('should delete selected bookmarks successfully', async () => {
      // Arrange: Set up the test scenario
      const mockCheckboxes = [
        { checked: true, dataset: { bookmarkId: '1' } },
        { checked: true, dataset: { bookmarkId: '2' } },
      ];

      // Mock successful delete operations
      mockSupabaseService.deleteBookmark.mockResolvedValue(true);

      // Mock DOM query to return selected checkboxes
      document.querySelectorAll = vi.fn().mockImplementation(selector => {
        if (selector === '.bookmark-checkbox:checked') {
          return mockCheckboxes;
        }
        return [];
      });

      // Mock loadAllBookmarks to prevent errors
      page.loadAllBookmarks = vi.fn().mockResolvedValue();

      // Ensure appContainer is set
      page.appContainer = document.createElement('div');

      // Mock confirmation dialog to capture the callback
      let confirmCallback;
      mockUIMessages.confirm.mockImplementation(
        (message, callback, _cancelCallback, _container) => {
          confirmCallback = callback;
        }
      );

      // Act: Call the method
      page.deleteSelectedBookmarks();

      // Wait a bit for the async operation to start
      await new Promise(resolve => setTimeout(resolve, 0));

      // Now call the confirm callback to simulate user confirmation
      await confirmCallback();

      // Assert: Verify the expected behavior
      expect(mockUIMessages.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete 2 bookmark(s)? This action cannot be undone.',
        expect.any(Function),
        expect.any(Function),
        expect.any(Object)
      );

      // Verify delete operations were called for each selected bookmark
      expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledTimes(2);
      expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledWith('1');
      expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledWith('2');

      // Verify success message was shown
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        '2 bookmark(s) deleted successfully!',
        expect.any(Object)
      );

      // Verify bookmarks were reloaded
      expect(page.loadAllBookmarks).toHaveBeenCalled();
    });

    it('should export selected bookmarks', async () => {
      const mockCheckboxes = [{ checked: true, dataset: { bookmarkId: '1' } }];

      const mockBookmark = {
        id: '1',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseService.getBookmarkById.mockResolvedValue(mockBookmark);
      document.querySelectorAll = vi.fn().mockReturnValue(mockCheckboxes);

      // Mock URL.createObjectURL and related functions
      const mockBlob = {};
      const mockUrl = 'blob:test';
      global.Blob = vi.fn().mockReturnValue(mockBlob);
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement and related functions
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      document.createElement = vi.fn().mockReturnValue(mockAnchor);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      await page.exportSelectedBookmarks();

      expect(mockSupabaseService.getBookmarkById).toHaveBeenCalledWith('1');
      expect(mockUIMessages.success).toHaveBeenCalledWith(
        '1 bookmark(s) exported successfully!',
        expect.any(Object)
      );
    });
  });

  describe('Shared Formatters', () => {
    it('should format status correctly', () => {
      expect(formatStatus('good-reference')).toBe('Good Reference');
      expect(formatStatus('low-value')).toBe('Low Value');
      expect(formatStatus('revisit-later')).toBe('Revisit Later');
    });

    it('should format time correctly', () => {
      const now = Date.now();
      expect(formatTime(now)).toBe('Just now');

      const oneMinuteAgo = now - 60000;
      expect(formatTime(oneMinuteAgo)).toBe('1m ago');

      const oneHourAgo = now - 3600000;
      expect(formatTime(oneHourAgo)).toBe('1h ago');
    });
  });
});
