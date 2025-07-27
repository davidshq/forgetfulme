/**
 * Enhanced tests for ForgetfulMe Background Service Worker with Dependency Injection
 * Tests the refactored background service with comprehensive Chrome API mocking
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedChromeMock, createMockErrorHandler, createTestDependencies } from '../helpers/chrome-mock-enhanced.js';

// Mock the global chrome object before importing background
const globalChromeMock = createEnhancedChromeMock();
global.chrome = globalChromeMock;

// Mock console methods to reduce noise
global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// Import the background service after setting up chrome mock
import { ForgetfulMeBackground } from '../../background.js';

describe('ForgetfulMe Background Service - Enhanced with Dependency Injection', () => {
  let background;
  let chromeMock;
  let errorHandlerMock;
  let cleanup;

  beforeEach(() => {
    // Create fresh dependency mocks
    const testSetup = createTestDependencies();
    chromeMock = testSetup.chromeMock;
    errorHandlerMock = testSetup.errorHandlerMock;
    cleanup = testSetup.cleanup;

    // Create background instance with mocked dependencies
    background = new ForgetfulMeBackground({
      chrome: chromeMock,
      errorHandler: errorHandlerMock,
      autoInit: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Dependency Injection Architecture', () => {
    test('should initialize with injected Chrome API mock', () => {
      expect(background.chrome).toBe(chromeMock);
      expect(background.errorHandler).toBe(errorHandlerMock);
    });

    test('should allow manual initialization for testing', async () => {
      // Create background without auto-init
      const testSetup = createTestDependencies();
      const manualBackground = new ForgetfulMeBackground({
        chrome: testSetup.chromeMock,
        errorHandler: testSetup.errorHandlerMock,
        autoInit: false
      });

      expect(manualBackground.chrome).toBe(testSetup.chromeMock);
      expect(manualBackground.authState).toBeNull();

      // Manually initialize
      await manualBackground.initializeAuthState();
      manualBackground.initializeEventListeners();

      // Verify event listeners were set up
      expect(testSetup.chromeMock.commands.onCommand.addListener).toHaveBeenCalled();
      expect(testSetup.chromeMock.runtime.onMessage.addListener).toHaveBeenCalled();
      
      // Cleanup
      testSetup.cleanup();
    });

    test('should work without Chrome API in test environment', () => {
      const testBackground = new ForgetfulMeBackground({
        chrome: null,
        errorHandler: createMockErrorHandler(),
        autoInit: false
      });

      expect(testBackground.chrome).toBeNull();
      // Should not crash when Chrome API is unavailable
    });
  });

  describe('Enhanced Chrome Commands API Testing', () => {
    test('should register keyboard shortcut listener correctly', () => {
      expect(chromeMock.commands.onCommand.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('should handle mark-as-read command with authentication', async () => {
      // Set up authenticated state
      await chromeMock.storage.sync.set({
        auth_session: {
          user: { id: 'test-user', email: 'test@example.com' },
          access_token: 'test-token'
        }
      });

      // Mock tabs.query to return a valid tab
      chromeMock.tabs.query.mockResolvedValue([{
        id: 1,
        url: 'https://example.com/article',
        title: 'Test Article',
        active: true
      }]);

      // Trigger the keyboard command
      chromeMock._triggerCommand('mark-as-read');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should show notification to open popup
      expect(chromeMock.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ForgetfulMe',
          message: 'Click the extension icon to mark this page as read'
        })
      );
    });

    test('should handle command for unauthenticated user', async () => {
      // Ensure no auth session
      await chromeMock.storage.sync.set({ auth_session: null });

      // Trigger the keyboard command
      chromeMock._triggerCommand('mark-as-read');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should show authentication notification
      expect(chromeMock.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ForgetfulMe',
          message: 'Please sign in to use keyboard shortcuts'
        })
      );
    });

    test('should ignore commands on browser pages', async () => {
      // Set up authenticated state
      await chromeMock.storage.sync.set({
        auth_session: {
          user: { id: 'test-user', email: 'test@example.com' },
          access_token: 'test-token'
        }
      });

      // Mock tabs.query to return a browser page
      chromeMock.tabs.query.mockResolvedValue([{
        id: 1,
        url: 'chrome://extensions/',
        title: 'Extensions',
        active: true
      }]);

      // Trigger the keyboard command
      chromeMock._triggerCommand('mark-as-read');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not show any notification for browser pages
      expect(chromeMock.notifications.create).not.toHaveBeenCalled();
    });
  });

  describe('Enhanced Message Handling', () => {
    test('should handle MARK_AS_READ message with proper validation', async () => {
      // Set up authenticated state
      await chromeMock.storage.sync.set({
        auth_session: {
          user: { id: 'test-user', email: 'test@example.com' },
          access_token: 'test-token'
        }
      });

      const sendResponse = vi.fn();
      const message = {
        type: 'MARK_AS_READ',
        url: 'https://example.com/test',
        title: 'Test Page'
      };

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should send success response
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        message: 'Page marked as read successfully'
      });

      // Should show success notification
      expect(chromeMock.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ForgetfulMe',
          message: expect.stringContaining('marked as read')
        })
      );
    });

    test('should validate URL format in MARK_AS_READ message', async () => {
      const sendResponse = vi.fn();
      const message = {
        type: 'MARK_AS_READ',
        url: 'invalid-url',
        title: 'Test Page'
      };

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should send error response for invalid URL
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid URL format'
      });
    });

    test('should require URL parameter for MARK_AS_READ', async () => {
      const sendResponse = vi.fn();
      const message = {
        type: 'MARK_AS_READ',
        title: 'Test Page'
        // Missing URL
      };

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should send error response for missing URL
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid URL parameter required for MARK_AS_READ'
      });
    });

    test('should handle GET_AUTH_STATE message', async () => {
      // Set up authenticated state
      const authState = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token'
      };
      await chromeMock.storage.sync.set({ auth_session: authState });

      const sendResponse = vi.fn();
      const message = { type: 'GET_AUTH_STATE' };

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should return auth state
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        authState: authState
      });
    });

    test('should handle invalid message format', async () => {
      const sendResponse = vi.fn();
      const message = null; // Invalid message

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should send error response
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid message format'
      });
    });

    test('should handle missing message type', async () => {
      const sendResponse = vi.fn();
      const message = { data: 'some data' }; // Missing type

      // Trigger message handling
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should send error response
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Missing or invalid message type'
      });
    });
  });

  describe('Enhanced Authentication State Management', () => {
    test('should initialize auth state from storage', async () => {
      const authState = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token'
      };

      // Set storage data before initialization
      await chromeMock.storage.sync.set({ auth_session: authState });

      // Create new background instance to test initialization
      const testSetup = createTestDependencies();
      const newBackground = new ForgetfulMeBackground({
        chrome: testSetup.chromeMock,
        errorHandler: testSetup.errorHandlerMock,
        autoInit: true
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(newBackground.authState).toEqual(authState);
      
      // Cleanup
      testSetup.cleanup();
    });

    test('should handle auth state changes from storage events', async () => {
      const newAuthState = {
        user: { id: 'new-user', email: 'new@example.com' },
        access_token: 'new-token'
      };

      // Trigger storage change
      await chromeMock.storage.sync.set({ auth_session: newAuthState });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should update internal auth state
      expect(background.authState).toEqual(newAuthState);

      // Should show success notification
      expect(chromeMock.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ForgetfulMe',
          message: 'Successfully signed in!'
        })
      );

      // Should update badge
      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
      expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ 
        color: '#4CAF50' 
      });
    });

    test('should handle auth state being cleared', async () => {
      // First set an auth state
      await chromeMock.storage.sync.set({
        auth_session: { user: { id: 'test' }, access_token: 'token' }
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Clear auth state
      await chromeMock.storage.sync.set({ auth_session: null });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should clear internal auth state
      expect(background.authState).toBeNull();

      // Should clear badge
      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('Enhanced Icon and Badge Management', () => {
    test('should update icon for saved URL', () => {
      background.updateIconForUrl('https://example.com', true);

      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
      expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ 
        color: '#4CAF50' 
      });
    });

    test('should update icon for unsaved URL', () => {
      background.updateIconForUrl('https://example.com', false);

      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '+' });
      expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ 
        color: '#2196F3' 
      });
    });

    test('should clear icon for browser pages', () => {
      background.updateIconForUrl(null, false);

      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    test('should handle icon update errors gracefully', () => {
      // Make setBadgeText throw an error
      chromeMock.action.setBadgeText.mockImplementation(() => {
        throw new Error('Badge update failed');
      });

      // Should not throw error
      expect(() => {
        background.updateIconForUrl('https://example.com', true);
      }).not.toThrow();
    });
  });

  describe('Enhanced Installation and Default Settings', () => {
    test('should initialize default settings on installation', async () => {
      // Trigger installation event
      chromeMock._triggerInstalled({ reason: 'install' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should save default status types
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: [
          'read',
          'good-reference', 
          'low-value',
          'revisit-later'
        ]
      });
    });

    test('should not reinitialize existing settings', async () => {
      // Set existing settings
      await chromeMock.storage.sync.set({
        customStatusTypes: ['existing-status']
      });

      // Reset call count
      chromeMock.storage.sync.set.mockClear();

      // Trigger installation
      chromeMock._triggerInstalled({ reason: 'install' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not call set again for existing settings
      expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    });

    test('should handle update installation without initializing defaults', async () => {
      // Trigger update event (not install)
      chromeMock._triggerInstalled({ reason: 'update' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not initialize defaults for updates
      expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('Enhanced Error Handling Integration', () => {
    test('should use injected error handler', async () => {
      // Create a new chrome mock that will cause an error
      const errorChromeMock = createEnhancedChromeMock();
      errorChromeMock.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const testErrorHandler = createMockErrorHandler();

      // Create new background to trigger initialization error
      new ForgetfulMeBackground({
        chrome: errorChromeMock,
        errorHandler: testErrorHandler,
        autoInit: true
      });

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call injected error handler
      expect(testErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'background.initializeAuthState'
      );
    });

    test('should handle message processing errors', async () => {
      // Force an error in message handling
      const sendResponse = vi.fn();
      const message = { type: 'MARK_AS_READ', url: 'https://example.com' };

      // Make storage.sync.get throw an error
      chromeMock.storage.sync.get.mockRejectedValue(new Error('Storage unavailable'));

      // Trigger message
      chromeMock._triggerMessage(message, {}, sendResponse);

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call error handler
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'background.handleMessage'
      );

      // Should send error response
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('error occurred')
      });
    });
  });

  describe('Enhanced URL Status Caching', () => {
    test('should cache URL status results', () => {
      const url = 'https://example.com/test';
      
      // Simulate URL status check result
      background.urlStatusCache.set(url, {
        isSaved: true,
        timestamp: Date.now()
      });

      expect(background.urlStatusCache.has(url)).toBe(true);
      expect(background.urlStatusCache.get(url).isSaved).toBe(true);
    });

    test('should clear URL cache when bookmark is saved', async () => {
      const url = 'https://example.com/test';
      
      // Add to cache
      background.urlStatusCache.set(url, {
        isSaved: false,
        timestamp: Date.now()
      });

      // Handle bookmark saved message
      const sendResponse = vi.fn();
      chromeMock._triggerMessage({
        type: 'BOOKMARK_SAVED',
        data: { url }
      }, {}, sendResponse);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cache should be cleared for this URL
      expect(background.urlStatusCache.has(url)).toBe(false);

      // Should update icon to saved state
      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
    });

    test('should handle cache timeout correctly', () => {
      const url = 'https://example.com/test';
      
      // Add expired cache entry
      background.urlStatusCache.set(url, {
        isSaved: true,
        timestamp: Date.now() - (10 * 60 * 1000) // 10 minutes ago
      });

      // Check if cache is considered expired (5 minute timeout)
      const cached = background.urlStatusCache.get(url);
      const isExpired = Date.now() - cached.timestamp > background.cacheTimeout;
      
      expect(isExpired).toBe(true);
    });
  });
});