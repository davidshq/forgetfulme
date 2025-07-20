import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ForgetfulMePopup from '../../popup.js';

// Mock dependencies
vi.mock('../../utils/ui-components.js');
vi.mock('../../utils/auth-state-manager.js');
vi.mock('../../utils/error-handler.js');
vi.mock('../../utils/ui-messages.js');
vi.mock('../../utils/config-manager.js');
vi.mock('../../utils/bookmark-transformer.js');
vi.mock('../../supabase-config.js');
vi.mock('../../supabase-service.js');
vi.mock('../../auth-ui.js');

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

describe('ForgetfulMePopup', () => {
  let popup;
  let mockSupabaseService;
  let mockUIComponents;
  let mockUIMessages;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock UIComponents
    mockUIComponents = {
      DOM: {
        ready: vi.fn().mockResolvedValue(),
        getElement: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(),
      },
      createButton: vi.fn(),
      createForm: vi.fn(),
      createSection: vi.fn(),
      createContainer: vi.fn(),
    };

    // Mock UIMessages
    mockUIMessages = {
      success: vi.fn(),
      error: vi.fn(),
    };

    // Mock ErrorHandler
    const mockErrorHandler = {
      handle: vi.fn().mockReturnValue({
        userMessage: 'Test error message',
        shouldShowToUser: true,
      }),
    };

    // Mock SupabaseService
    mockSupabaseService = {
      initialize: vi.fn().mockResolvedValue(),
      saveBookmark: vi.fn(),
      getBookmarks: vi.fn(),
      updateBookmark: vi.fn(),
    };

    // Mock other dependencies
    const mockConfigManager = {
      initialize: vi.fn().mockResolvedValue(),
      getCustomStatusTypes: vi.fn().mockResolvedValue([]),
    };

    const mockAuthStateManager = {
      initialize: vi.fn().mockResolvedValue(),
      isAuthenticated: vi.fn().mockResolvedValue(true),
      addListener: vi.fn(),
    };

    const mockSupabaseConfig = {
      isConfigured: vi.fn().mockResolvedValue(true),
      initialize: vi.fn().mockResolvedValue(),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    const mockAuthUI = {
      showLoginForm: vi.fn(),
    };

    // Mock the modules
    vi.doMock('../../utils/ui-components.js', () => mockUIComponents);
    vi.doMock('../../utils/ui-messages.js', () => mockUIMessages);
    vi.doMock('../../utils/error-handler.js', () => mockErrorHandler);
    vi.doMock('../../supabase-service.js', () => ({
      default: vi.fn().mockImplementation(() => mockSupabaseService),
    }));
    vi.doMock('../../utils/config-manager.js', () => ({
      default: vi.fn().mockImplementation(() => mockConfigManager),
    }));
    vi.doMock('../../utils/auth-state-manager.js', () => ({
      default: vi.fn().mockImplementation(() => mockAuthStateManager),
    }));
    vi.doMock('../../supabase-config.js', () => ({
      default: vi.fn().mockImplementation(() => mockSupabaseConfig),
    }));
    vi.doMock('../../auth-ui.js', () => ({
      default: vi.fn().mockImplementation(() => mockAuthUI),
    }));

    // Mock DOM elements
    const mockAppContainer = document.createElement('div');
    mockUIComponents.DOM.getElement.mockImplementation((id) => {
      if (id === 'app') return mockAppContainer;
      if (id === 'read-status') return document.createElement('select');
      if (id === 'tags') return document.createElement('input');
      if (id === 'settings-btn') return document.createElement('button');
      if (id === 'recent-list') return document.createElement('div');
      return null;
    });

    // Mock chrome tabs
    chrome.tabs.query.mockResolvedValue([{
      url: 'https://example.com',
      title: 'Test Page',
    }]);

    // Create popup instance
    popup = new ForgetfulMePopup();
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
      expect(mockUIMessages.success).toHaveBeenCalledWith('Page marked as read!', expect.any(HTMLElement));
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

      expect(mockUIMessages.error).toHaveBeenCalled();
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
      expect(mockUIMessages.success).toHaveBeenCalledWith('Bookmark updated successfully!', expect.any(HTMLElement));
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

      expect(mockUIMessages.error).toHaveBeenCalled();
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
}); 