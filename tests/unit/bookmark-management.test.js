import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
      querySelectorAll: vi.fn(),
    },
    createButton: vi.fn(),
    createForm: vi.fn(),
    createFormField: vi.fn(),
    createSection: vi.fn(),
    createContainer: vi.fn(),
    createListItem: vi.fn(),
    createCard: vi.fn(),
    createFormCard: vi.fn(),
    createListCard: vi.fn(),
    createHeaderWithNav: vi.fn(),
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

// Mock component modules
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

    // Mock UI component methods to return proper DOM elements
    mockUIComponents.createButton.mockReturnValue(
      document.createElement('button'),
    );
    mockUIComponents.createForm.mockReturnValue(document.createElement('form'));
    mockUIComponents.createFormField.mockReturnValue(
      document.createElement('input'),
    );
    mockUIComponents.createSection.mockReturnValue(
      document.createElement('section'),
    );
    mockUIComponents.createContainer.mockReturnValue(
      document.createElement('div'),
    );
    mockUIComponents.createListItem.mockReturnValue(
      document.createElement('li'),
    );
    mockUIComponents.createCard.mockReturnValue(
      document.createElement('article'),
    );
    mockUIComponents.createFormCard.mockReturnValue(
      document.createElement('article'),
    );
    // createListCard needs to return an element with a .card-list child
    mockUIComponents.createListCard.mockImplementation(() => {
      const card = document.createElement('article');
      const cardList = document.createElement('div');
      cardList.className = 'card-list';
      card.appendChild(cardList);
      return card;
    });
    mockUIComponents.createHeaderWithNav.mockReturnValue(
      document.createElement('header'),
    );

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
    // load/search/bulk flows live on BookmarkManagementCoordinator — see
    // bookmark-management-coordinator.test.js

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
  });
});
