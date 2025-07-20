import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  }
}));

vi.mock('../../utils/auth-state-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    addListener: vi.fn(),
  }))
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
    }
  }
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
    confirm: vi.fn(),
  }
}));

vi.mock('../../utils/config-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    getCustomStatusTypes: vi.fn().mockResolvedValue([]),
  }))
}));

vi.mock('../../utils/bookmark-transformer.js', () => ({
  default: {
    toUIFormat: vi.fn(),
    fromCurrentTab: vi.fn(),
  }
}));

vi.mock('../../supabase-config.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    isConfigured: vi.fn().mockResolvedValue(true),
    initialize: vi.fn().mockResolvedValue(),
    getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
  }))
}));

vi.mock('../../supabase-service.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    saveBookmark: vi.fn(),
    getBookmarks: vi.fn(),
    updateBookmark: vi.fn(),
    deleteBookmark: vi.fn(),
    getBookmarkById: vi.fn(),
  }))
}));

vi.mock('../../auth-ui.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    showLoginForm: vi.fn(),
  }))
}));

// Mock chrome API
global.chrome = {
  tabs: {
    query: vi.fn(),
  },
  runtime: {
    openOptionsPage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

// Import the module under test AFTER mocking
import ForgetfulMePopup from '../../popup.js';
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';
import SupabaseService from '../../supabase-service.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

describe('ForgetfulMePopup', () => {
  let popup;
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
        originalError: new Error('Test error message')
      },
      userMessage: 'Test error message',
      shouldRetry: false,
      shouldShowToUser: true,
    });

    // Mock BookmarkTransformer.fromCurrentTab
    BookmarkTransformer.fromCurrentTab = vi.fn().mockReturnValue({
      url: 'https://example.com',
      title: 'Test Page',
      read_status: 'read',
      tags: ['test'],
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
    mockUIComponents.DOM.getElement.mockImplementation((id) => {
      if (id === 'app') return mockAppContainer;
      if (id === 'read-status') return document.createElement('select');
      if (id === 'tags') return document.createElement('input');
      if (id === 'settings-btn') return document.createElement('button');
      if (id === 'recent-list') return document.createElement('div');
      if (id === 'edit-read-status') return document.createElement('select');
      if (id === 'edit-tags') return document.createElement('input');
      return null;
    });

    // Mock chrome tabs
    chrome.tabs.query.mockResolvedValue([{
      url: 'https://example.com',
      title: 'Test Page',
    }]);

    // Create popup instance
    popup = new ForgetfulMePopup();
    
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

      // Mock form values
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('read') // read-status
        .mockReturnValueOnce('test, tags'); // tags

      await popup.markAsRead();

      expect(mockSupabaseService.saveBookmark).toHaveBeenCalled();
      expect(mockUIMessages.success).toHaveBeenCalledWith('Page marked as read!', expect.any(Object));
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

      // Mock form values
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('read') // read-status
        .mockReturnValueOnce('test, tags'); // tags

      // Mock UI components for edit interface
      mockUIComponents.createButton.mockReturnValue(document.createElement('button'));
      mockUIComponents.createSection.mockReturnValue(document.createElement('div'));
      mockUIComponents.createForm.mockReturnValue(document.createElement('form'));

      await popup.markAsRead();

      expect(mockSupabaseService.saveBookmark).toHaveBeenCalled();
      expect(mockUIMessages.success).not.toHaveBeenCalled();
      // Should show edit interface instead of success message
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Test error');
      mockSupabaseService.saveBookmark.mockRejectedValue(mockError);

      // Mock form values
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('read') // read-status
        .mockReturnValueOnce('test, tags'); // tags

      await popup.markAsRead();

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(mockError, 'popup.markAsRead');
      expect(mockUIMessages.error).toHaveBeenCalledWith('Test error message', expect.any(Object));
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

      // Mock form values
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('good-reference') // edit-read-status
        .mockReturnValueOnce('updated, tags'); // edit-tags

      await popup.updateBookmark(bookmarkId);

      expect(mockSupabaseService.updateBookmark).toHaveBeenCalledWith(bookmarkId, {
        read_status: 'good-reference',
        tags: ['updated', 'tags'],
        updated_at: expect.any(String),
      });
      expect(mockUIMessages.success).toHaveBeenCalledWith('Bookmark updated successfully!', expect.any(Object));
    });

    it('should handle update errors', async () => {
      const bookmarkId = 'test-bookmark-id';
      const mockError = new Error('Update failed');
      mockSupabaseService.updateBookmark.mockRejectedValue(mockError);

      // Mock form values
      mockUIComponents.DOM.getValue
        .mockReturnValueOnce('read') // edit-read-status
        .mockReturnValueOnce('test'); // edit-tags

      await popup.updateBookmark(bookmarkId);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(mockError, 'popup.updateBookmark');
      expect(mockUIMessages.error).toHaveBeenCalledWith('Test error message', expect.any(Object));
    });
  });

  describe('formatStatus', () => {
    it('should format status correctly', () => {
      expect(popup.formatStatus('good-reference')).toBe('Good Reference');
      expect(popup.formatStatus('low-value')).toBe('Low Value');
      expect(popup.formatStatus('revisit-later')).toBe('Revisit Later');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const now = Date.now();
      expect(popup.formatTime(now)).toBe('Just now');
      
      const oneMinuteAgo = now - 60000;
      expect(popup.formatTime(oneMinuteAgo)).toBe('1m ago');
      
      const oneHourAgo = now - 3600000;
      expect(popup.formatTime(oneHourAgo)).toBe('1h ago');
    });
  });

  describe('Bookmark Management', () => {
    it('should open bookmark management in new tab', () => {
      const mockTabsCreate = vi.fn();
      global.chrome.tabs.create = mockTabsCreate;
      global.chrome.runtime.getURL = vi.fn().mockReturnValue('chrome-extension://test/bookmark-management.html');

      popup.showBookmarkManagement();

      expect(mockTabsCreate).toHaveBeenCalledWith({ 
        url: 'chrome-extension://test/bookmark-management.html' 
      });
    });
  });
}); 