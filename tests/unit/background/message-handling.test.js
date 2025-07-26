import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Background Message Handling Workflows', () => {
  let mockSendResponse;
  let mockSender;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock complete Chrome APIs (external dependencies)
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
      tabs: {
        query: vi.fn(),
        get: vi.fn(),
        onUpdated: {
          addListener: vi.fn(),
        },
        onActivated: {
          addListener: vi.fn(),
        },
      },
      notifications: {
        create: vi.fn(),
      },
      action: {
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn(),
        onClicked: {
          addListener: vi.fn(),
        },
      },
      commands: {
        onCommand: {
          addListener: vi.fn(),
        },
      },
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
        onInstalled: {
          addListener: vi.fn(),
        },
      },
    };

    mockSendResponse = vi.fn();
    mockSender = {
      tab: {
        id: 123,
        url: 'https://example.com',
        title: 'Example Page',
      },
    };
  });

  describe('MARK_AS_READ Message Workflow', () => {
    test('should mark page as read for authenticated user', async () => {
      // Setup authenticated user state
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123', email: 'test@example.com' },
            access_token: 'valid-token',
          },
          supabaseConfig: {
            url: 'https://test.supabase.co',
            anonKey: 'test-key',
          },
        });
      });

      // Import background script after mocking
      const { handleMessage } = await import('../../../background.js');

      const message = {
        type: 'MARK_AS_READ',
        url: 'https://example.com',
        title: 'Example Page',
      };

      await handleMessage(message, mockSender, mockSendResponse);

      // Test successful marking workflow
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        message: 'Page marked as read successfully',
      });

      // Test notification creation
      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'ForgetfulMe',
          message: expect.stringContaining('marked as read'),
        })
      );
    });

    test('should handle unauthenticated user gracefully', async () => {
      // Setup unauthenticated state
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({}); // No auth session
      });

      const { handleMessage } = await import('../../../background.js');

      const message = {
        type: 'MARK_AS_READ',
        url: 'https://example.com',
      };

      await handleMessage(message, mockSender, mockSendResponse);

      // Test authentication error workflow
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('authenticate'),
      });
    });

    test('should validate required message fields', async () => {
      const { handleMessage } = await import('../../../background.js');

      const invalidMessages = [
        { type: 'MARK_AS_READ' }, // Missing URL
        { type: 'MARK_AS_READ', url: '' }, // Empty URL
        { type: 'MARK_AS_READ', url: 'invalid-url' }, // Invalid URL format
      ];

      for (const invalidMessage of invalidMessages) {
        const response = vi.fn();
        await handleMessage(invalidMessage, mockSender, response);

        expect(response).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid'),
        });
      }
    });
  });

  describe('Real Background Script Integration', () => {
    test('should import and initialize background script without errors', async () => {
      // This tests actual background.js initialization
      expect(async () => {
        await import('../../../background.js');
      }).not.toThrow();

      // Verify Chrome API event listeners were registered
      expect(global.chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(global.chrome.commands.onCommand.addListener).toHaveBeenCalled();
      expect(global.chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    });

    test('should handle real message types from background script', async () => {
      // Test that background script exposes message handling
      const backgroundModule = await import('../../../background.js');

      // Check if the module exports what we expect
      expect(backgroundModule).toBeDefined();

      // Test that runtime message listener was set up
      expect(global.chrome.runtime.onMessage.addListener).toHaveBeenCalled();

      // Get the actual message handler from background script
      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      expect(typeof messageHandler).toBe('function');
    });
  });

  describe('Error Handling Workflow', () => {
    test('should handle unknown message types gracefully', async () => {
      await import('../../../background.js');

      // Get the real message handler
      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

      const message = { type: 'UNKNOWN_TYPE' };

      await messageHandler(message, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Unknown message type'),
      });
    });

    test('should handle malformed messages', async () => {
      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

      const invalidMessages = [
        null,
        undefined,
        {},
        { type: '' },
        { type: null },
      ];

      for (const invalidMessage of invalidMessages) {
        const response = vi.fn();
        await messageHandler(invalidMessage, mockSender, response);

        expect(response).toHaveBeenCalledWith({
          success: false,
          error: expect.stringMatching(/invalid|missing|required/i),
        });
      }
    });
  });

  describe('Chrome API Integration', () => {
    test('should call Chrome storage APIs correctly', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: { user: { id: 'user123' } },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

      await messageHandler(
        { type: 'GET_STATUS', url: 'https://example.com' },
        mockSender,
        mockSendResponse
      );

      // Should have called Chrome storage API
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });

    test('should handle Chrome API errors gracefully', async () => {
      // Mock Chrome API failure
      global.chrome.storage.sync.get.mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

      await messageHandler(
        { type: 'MARK_AS_READ', url: 'https://example.com' },
        mockSender,
        mockSendResponse
      );

      // Should handle Chrome API errors gracefully
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Extension context'),
      });
    });
  });
});
