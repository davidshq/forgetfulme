/**
 * @fileoverview Unit tests for BackgroundService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackgroundService } from '../../../src/background/BackgroundService.js';
import { AuthService } from '../../../src/services/AuthService.js';
import { BookmarkService } from '../../../src/services/BookmarkService.js';
import { ConfigService } from '../../../src/services/ConfigService.js';
import { StorageService } from '../../../src/services/StorageService.js';
import { ErrorService } from '../../../src/services/ErrorService.js';

// Mock the Supabase library
vi.mock('../../../src/lib/supabase.js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
      setSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

describe('BackgroundService', () => {
  let backgroundService;
  let mockAuthService;
  let mockBookmarkService;
  let mockConfigService;
  let mockStorageService;
  let mockErrorService;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock services
    mockErrorService = new ErrorService();
    mockStorageService = new StorageService(mockErrorService);
    mockConfigService = new ConfigService(mockStorageService, mockErrorService);
    mockAuthService = new AuthService(null, mockStorageService, mockErrorService); // null database for service worker
    mockBookmarkService = new BookmarkService(null, mockStorageService, mockAuthService, mockErrorService); // null database for service worker

    // Setup service mocks
    vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(false);
    vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(mockBookmarkService, 'findBookmarkByUrl').mockResolvedValue(null);
    vi.spyOn(mockBookmarkService, 'initialize').mockResolvedValue();
    vi.spyOn(mockConfigService, 'getStatusTypes').mockResolvedValue([]);
    vi.spyOn(mockErrorService, 'handle').mockImplementation((error, context) => ({
      message: error.message,
      context,
      category: 'GENERAL'
    }));

    // Create BackgroundService instance
    backgroundService = new BackgroundService(
      mockAuthService,
      mockBookmarkService,
      mockConfigService,
      mockStorageService,
      mockErrorService
    );

    // Setup Chrome API mocks with defaults
    global.chrome = {
      runtime: {
        onInstalled: { addListener: vi.fn() },
        onStartup: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn() },
        openOptionsPage: vi.fn(),
        getManifest: vi.fn().mockReturnValue({ version: '1.0.0' }),
        id: 'test-extension-id',
        sendMessage: vi.fn().mockResolvedValue()
      },
      commands: {
        onCommand: { addListener: vi.fn() }
      },
      tabs: {
        onActivated: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
        query: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
        sendMessage: vi.fn().mockResolvedValue()
      },
      action: {
        onClicked: { addListener: vi.fn() },
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn()
      },
      notifications: {
        create: vi.fn(),
        clear: vi.fn()
      }
    };
  });

  describe('initialize', () => {
    it('should initialize the service successfully', async () => {
      await backgroundService.initialize();

      expect(backgroundService.isInitialized).toBe(true);
      expect(global.chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
      expect(global.chrome.runtime.onStartup.addListener).toHaveBeenCalled();
      expect(global.chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(global.chrome.commands.onCommand.addListener).toHaveBeenCalled();
      expect(global.chrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(global.chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', async () => {
      await backgroundService.initialize();
      
      // Clear mock calls
      vi.clearAllMocks();
      
      // Try to initialize again
      await backgroundService.initialize();

      expect(global.chrome.runtime.onInstalled.addListener).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      // Remove a required Chrome API to trigger error handling
      global.chrome.runtime.onInstalled = undefined;

      await backgroundService.initialize();

      // The service still initializes but logs the error
      expect(backgroundService.isInitialized).toBe(true);
    });

    it('should initialize services if Supabase is configured', async () => {
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(true);

      await backgroundService.initialize();

      expect(mockConfigService.isSupabaseConfigured).toHaveBeenCalled();
      expect(backgroundService.isInitialized).toBe(true);
    });
  });

  describe('Extension Lifecycle Management', () => {
    let installedCallback;
    let startupCallback;

    beforeEach(async () => {
      await backgroundService.initialize();
      
      // Get the registered callbacks
      installedCallback = global.chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      startupCallback = global.chrome.runtime.onStartup.addListener.mock.calls[0][0];
    });

    describe('handleInstalled', () => {
      it('should handle first time installation', async () => {
        const details = { reason: 'install' };
        
        await installedCallback(details);

        expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalled();
        expect(global.chrome.notifications.create).toHaveBeenCalledWith(
          expect.stringContaining('forgetfulme_'),
          expect.objectContaining({
            type: 'basic',
            title: 'ForgetfulMe Installed',
            message: expect.stringContaining('start tracking websites')
          })
        );
        expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      });

      it('should handle extension update', async () => {
        const details = { reason: 'update', previousVersion: '0.9.0' };
        
        await installedCallback(details);

        expect(global.chrome.runtime.openOptionsPage).not.toHaveBeenCalled();
        expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      });

      it('should handle installation errors gracefully', async () => {
        const details = { reason: 'install' };
        global.chrome.runtime.openOptionsPage.mockImplementation(() => {
          throw new Error('Failed to open options');
        });

        // Should not throw even if opening options fails
        await installedCallback(details);
        
        // The error is caught internally, badge should still be updated
        expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      });
    });

    describe('handleStartup', () => {
      it('should reinitialize on startup if needed', async () => {
        // Set initialized to false to trigger re-initialization
        backgroundService.isInitialized = false;
        
        // Call startup handler
        const startupHandler = backgroundService.handleStartup.bind(backgroundService);
        await startupHandler();

        expect(backgroundService.isInitialized).toBe(true);
      });

      it('should not reinitialize if already initialized', async () => {
        backgroundService.isInitialized = true;
        vi.clearAllMocks();
        
        await startupCallback();

        expect(global.chrome.runtime.onInstalled.addListener).not.toHaveBeenCalled();
      });
    });
  });

  describe('Message Handling', () => {
    let messageCallback;

    beforeEach(async () => {
      await backgroundService.initialize();
      messageCallback = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
    });

    it('should handle GET_CURRENT_TAB message', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      global.chrome.tabs.query.mockResolvedValue([mockTab]);
      
      const sendResponse = vi.fn();
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'GET_CURRENT_TAB' },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(global.chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(sendResponse).toHaveBeenCalledWith({ tab: mockTab });
    });

    it('should handle MARK_CURRENT_PAGE message', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      global.chrome.tabs.query.mockResolvedValue([mockTab]);
      
      const sendResponse = vi.fn();
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'MARK_CURRENT_PAGE', data: {} },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle UPDATE_BADGE message', async () => {
      const sendResponse = vi.fn();
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'UPDATE_BADGE', data: { text: 'R', color: '#00FF00' } },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'R' });
      expect(global.chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#00FF00' });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle SHOW_NOTIFICATION message', async () => {
      const sendResponse = vi.fn();
      const notificationData = {
        title: 'Test Notification',
        message: 'Test message'
      };
      
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'SHOW_NOTIFICATION', data: notificationData },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.stringContaining('forgetfulme_'),
        expect.objectContaining({
          type: 'basic',
          title: 'Test Notification',
          message: 'Test message'
        })
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle unknown message types', async () => {
      const sendResponse = vi.fn();
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'UNKNOWN_TYPE' },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown message type' });
    });

    it('should handle message errors', async () => {
      global.chrome.tabs.query.mockRejectedValue(new Error('Query failed'));
      
      const sendResponse = vi.fn();
      const promise = new Promise(resolve => {
        messageCallback(
          { type: 'GET_CURRENT_TAB' },
          { tab: { id: 1 } },
          (response) => {
            sendResponse(response);
            resolve();
          }
        );
      });
      
      await promise;

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Query failed' });
    });
  });

  describe('Keyboard Shortcut Handling', () => {
    let commandCallback;

    beforeEach(async () => {
      await backgroundService.initialize();
      commandCallback = global.chrome.commands.onCommand.addListener.mock.calls[0][0];
    });

    it('should handle mark_as_read command when not configured', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(false);
      
      // Call the markCurrentPageAsRead directly since that's what gets tested
      await backgroundService.markCurrentPageAsRead(mockTab);

      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Setup Required',
          message: expect.stringContaining('configure ForgetfulMe')
        })
      );
    });

    it('should handle mark_as_read command when not authenticated', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(true);
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(false);
      
      // Call the markCurrentPageAsRead directly
      await backgroundService.markCurrentPageAsRead(mockTab);

      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Sign In Required',
          message: expect.stringContaining('sign in to bookmark')
        })
      );
    });

    it('should handle mark_as_read command when authenticated', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(true);
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      
      // Call the markCurrentPageAsRead directly
      await backgroundService.markCurrentPageAsRead(mockTab);

      // Service worker can't access Supabase directly, so it shows a notification
      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Use Extension Popup',
          message: expect.stringContaining('Click the ForgetfulMe icon')
        })
      );
      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should handle mark_as_read command with invalid tab', async () => {
      await commandCallback('mark_as_read', null);

      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Cannot Mark Page',
          message: 'No valid page to bookmark'
        })
      );
    });

    it('should handle command errors', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example' };
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockRejectedValue(new Error('Config error'));
      
      // Call the markCurrentPageAsRead directly
      await backgroundService.markCurrentPageAsRead(mockTab);

      expect(mockErrorService.handle).toHaveBeenCalled();
      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Error',
          message: 'Failed to mark page as read'
        })
      );
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      await backgroundService.initialize();
    });

    it('should show notification with default options', () => {
      backgroundService.showNotification({
        title: 'Test Title',
        message: 'Test Message'
      });

      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.stringContaining('forgetfulme_'),
        expect.objectContaining({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Test Title',
          message: 'Test Message'
        })
      );
    });

    it('should auto-clear notification after 5 seconds', () => {
      vi.useFakeTimers();
      
      backgroundService.showNotification({
        title: 'Test Title',
        message: 'Test Message'
      });

      const notificationId = global.chrome.notifications.create.mock.calls[0][0];
      
      // Fast-forward time
      vi.advanceTimersByTime(5000);

      expect(global.chrome.notifications.clear).toHaveBeenCalledWith(notificationId);
      
      vi.useRealTimers();
    });

    it('should handle notification errors gracefully', () => {
      global.chrome.notifications = undefined;
      
      // Should not throw
      expect(() => {
        backgroundService.showNotification({
          title: 'Test Title',
          message: 'Test Message'
        });
      }).not.toThrow();
    });
  });

  describe('Badge Updates', () => {
    beforeEach(async () => {
      await backgroundService.initialize();
    });

    it('should update badge with text and color', () => {
      backgroundService.updateBadge('R', '#FF0000');

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'R' });
      expect(global.chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#FF0000' });
    });

    it('should clear badge with default values', () => {
      backgroundService.updateBadge();

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(global.chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4F46E5' });
    });

    it('should handle badge update errors gracefully', () => {
      global.chrome.action = undefined;
      
      // Should not throw
      expect(() => {
        backgroundService.updateBadge('R', '#FF0000');
      }).not.toThrow();
    });
  });

  describe('Tab Context Awareness', () => {
    let tabActivatedCallback;
    let tabUpdatedCallback;

    beforeEach(async () => {
      await backgroundService.initialize();
      tabActivatedCallback = global.chrome.tabs.onActivated.addListener.mock.calls[0][0];
      tabUpdatedCallback = global.chrome.tabs.onUpdated.addListener.mock.calls[0][0];
    });

    it('should update context on tab activation', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(mockBookmarkService, 'findBookmarkByUrl').mockResolvedValue(null);
      
      await tabActivatedCallback({ tabId: 1, windowId: 1 });

      expect(global.chrome.tabs.get).toHaveBeenCalledWith(1);
    });

    it('should update badge for bookmarked pages', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(mockBookmarkService, 'findBookmarkByUrl').mockResolvedValue({
        id: '123',
        url: 'https://example.com',
        status: 'read'
      });
      vi.spyOn(mockConfigService, 'getStatusTypes').mockResolvedValue([
        { id: 'read', name: 'Read', color: '#00FF00' }
      ]);
      
      // Call the internal method directly to test the logic
      await backgroundService.updateTabContext(1);

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'R' });
      expect(global.chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#00FF00' });
    });

    it('should clear badge for non-bookmarked pages', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(mockBookmarkService, 'findBookmarkByUrl').mockResolvedValue(null);
      
      // Call the internal method directly to test the logic
      await backgroundService.updateTabContext(1);

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should handle tab update with URL change', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      
      await tabUpdatedCallback(1, { url: 'https://example.com' }, {});

      expect(global.chrome.tabs.get).toHaveBeenCalledWith(1);
    });

    it('should handle tab update on complete', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      
      await tabUpdatedCallback(1, { status: 'complete' }, {});

      expect(global.chrome.tabs.get).toHaveBeenCalledWith(1);
    });

    it('should not update context when not authenticated', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(false);
      
      await tabActivatedCallback({ tabId: 1, windowId: 1 });

      expect(global.chrome.tabs.get).not.toHaveBeenCalled();
    });

    it('should handle tab context errors gracefully', async () => {
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      global.chrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      // Should not throw
      await tabActivatedCallback({ tabId: 1, windowId: 1 });
      
      // Verify no badge update was attempted
      expect(global.chrome.action.setBadgeText).not.toHaveBeenCalled();
    });
  });

  describe('Extension Info Reporting', () => {
    it('should return extension info when not initialized', () => {
      const info = backgroundService.getExtensionInfo();

      expect(info.id).toBe('test-extension-id');
      expect(info.version).toBe('1.0.0');
      expect(info.isInitialized).toBe(false);
      expect(info.isAuthenticated).toBe(false);
      expect(info.isConfigured).toBeInstanceOf(Promise);
    });

    it('should return extension info when initialized and authenticated', async () => {
      await backgroundService.initialize();
      vi.spyOn(mockAuthService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(mockConfigService, 'isSupabaseConfigured').mockResolvedValue(true);
      
      const info = backgroundService.getExtensionInfo();

      expect(info.id).toBe('test-extension-id');
      expect(info.version).toBe('1.0.0');
      expect(info.isInitialized).toBe(true);
      expect(info.isAuthenticated).toBe(true);
      expect(info.isConfigured).toBeInstanceOf(Promise);
      
      // Check the promise resolves to true
      await expect(info.isConfigured).resolves.toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('should send message to specific tab', async () => {
      const message = { type: 'TEST', data: {} };
      const tabId = 123;
      global.chrome.tabs.sendMessage = vi.fn().mockResolvedValue({ success: true });
      
      const result = await backgroundService.sendMessage(message, { tabId });

      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
      expect(result).toEqual({ success: true });
    });

    it('should send message via runtime', async () => {
      const message = { type: 'TEST', data: {} };
      global.chrome.runtime.sendMessage.mockResolvedValue({ success: true });
      
      const result = await backgroundService.sendMessage(message);

      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
      expect(result).toEqual({ success: true });
    });

    it('should handle send message errors', async () => {
      const message = { type: 'TEST', data: {} };
      global.chrome.runtime.sendMessage.mockRejectedValue(new Error('Send failed'));
      
      const result = await backgroundService.sendMessage(message);

      expect(result).toBeNull();
    });
  });

  describe('Auth State Change', () => {
    it('should handle user sign in', async () => {
      vi.spyOn(mockBookmarkService, 'initialize').mockResolvedValue();
      
      await backgroundService.handleAuthStateChange({ id: 'user123', email: 'test@example.com' });

      expect(mockBookmarkService.initialize).toHaveBeenCalled();
    });

    it('should handle user sign out', async () => {
      await backgroundService.handleAuthStateChange(null);

      expect(global.chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should handle auth state change errors', async () => {
      vi.spyOn(mockBookmarkService, 'initialize').mockRejectedValue(new Error('Init failed'));
      
      // Should not throw
      await expect(
        backgroundService.handleAuthStateChange({ id: 'user123', email: 'test@example.com' })
      ).resolves.not.toThrow();
    });
  });

  describe('Browser Action Clicked', () => {
    let actionClickedCallback;

    beforeEach(async () => {
      await backgroundService.initialize();
      actionClickedCallback = global.chrome.action.onClicked.addListener.mock.calls[0][0];
    });

    it('should handle action clicked (fallback)', () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      
      // Should not throw
      expect(() => actionClickedCallback(mockTab)).not.toThrow();
    });
  });
});