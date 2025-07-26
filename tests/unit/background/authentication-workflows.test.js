import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Background Authentication Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Chrome storage and runtime APIs
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
        },
      },
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
      },
      notifications: {
        create: vi.fn(),
      },
    };
  });

  describe('Authentication State Synchronization', () => {
    test('should sync authentication state across extension components', async () => {
      // Mock authentication change
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: {
              id: 'user123',
              email: 'test@example.com',
            },
            access_token: 'token123',
            expires_at: Date.now() + 3600000,
          },
        });
      });

      await import('../../../background.js');

      // Verify storage change listener is registered
      expect(global.chrome.storage.onChanged.addListener).toHaveBeenCalled();

      // Get the storage change handler
      const storageChangeHandler =
        global.chrome.storage.onChanged.addListener.mock.calls[0][0];

      // Simulate authentication state change
      const changes = {
        auth_session: {
          newValue: {
            user: { id: 'user456', email: 'newuser@example.com' },
            access_token: 'newtoken456',
          },
          oldValue: {
            user: { id: 'user123', email: 'test@example.com' },
            access_token: 'token123',
          },
        },
      };

      await storageChangeHandler(changes, 'sync');

      // Should handle authentication state change
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });

    test('should handle authentication expiration', async () => {
      // Mock expired session
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123' },
            access_token: 'expired-token',
            expires_at: Date.now() - 1000, // Expired 1 second ago
          },
        });
      });

      await import('../../../background.js');

      // Simulate message requiring authentication
      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      await messageHandler(
        { type: 'MARK_AS_READ', url: 'https://example.com' },
        { tab: { id: 123 } },
        mockSendResponse
      );

      // Should reject due to expired authentication
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringMatching(/expired|authentication|login/i),
      });
    });

    test('should clear session data on logout', async () => {
      await import('../../../background.js');

      const storageChangeHandler =
        global.chrome.storage.onChanged.addListener.mock.calls[0][0];

      // Simulate logout (session removal)
      const changes = {
        auth_session: {
          oldValue: {
            user: { id: 'user123' },
            access_token: 'token123',
          },
          newValue: undefined, // Session removed
        },
      };

      await storageChangeHandler(changes, 'sync');

      // Should clean up any cached authentication data
      expect(global.chrome.storage.sync.remove).toHaveBeenCalledWith(
        expect.arrayContaining(['cached_user_data', 'temp_session_data'])
      );
    });
  });

  describe('User Session Management', () => {
    test('should validate session tokens', async () => {
      // Mock session with token that needs validation
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123' },
            access_token: 'token-to-validate',
            expires_at: Date.now() + 3600000,
          },
          supabaseConfig: {
            url: 'https://test.supabase.co',
            anonKey: 'test-key',
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      // Request that requires valid session
      await messageHandler(
        { type: 'VALIDATE_SESSION' },
        { tab: { id: 123 } },
        mockSendResponse
      );

      // Should attempt session validation
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        valid: expect.any(Boolean),
      });
    });

    test('should handle session refresh workflow', async () => {
      // Mock session that needs refresh
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123' },
            access_token: 'old-token',
            refresh_token: 'refresh-token',
            expires_at: Date.now() + 300000, // Expires in 5 minutes
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      await messageHandler(
        { type: 'REFRESH_SESSION' },
        { tab: { id: 123 } },
        mockSendResponse
      );

      // Should update session in storage
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_session: expect.objectContaining({
            access_token: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Cross-Component Authentication', () => {
    test('should propagate authentication status to popup', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123', email: 'test@example.com' },
            access_token: 'token123',
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      // Popup requesting authentication status
      await messageHandler(
        { type: 'GET_AUTH_STATUS' },
        { tab: null }, // From popup, not content script
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        authenticated: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
      });
    });

    test('should handle authentication errors across components', async () => {
      // Mock authentication failure
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({}); // No authentication data
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      await messageHandler(
        { type: 'MARK_AS_READ', url: 'https://example.com' },
        { tab: { id: 123 } },
        mockSendResponse
      );

      // Should show authentication notification
      expect(global.chrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: expect.stringContaining('Authentication'),
          message: expect.stringMatching(/sign.?in|login|authenticate/i),
        })
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringMatching(/authenticate|login/i),
        requiresAuth: true,
      });
    });
  });

  describe('Supabase Integration Authentication', () => {
    test('should handle Supabase authentication workflow', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          supabaseConfig: {
            url: 'https://test.supabase.co',
            anonKey: 'supabase-anon-key',
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      // Simulate Supabase sign-in result
      await messageHandler(
        {
          type: 'SUPABASE_AUTH_CALLBACK',
          session: {
            user: { id: 'supabase-user-123', email: 'user@example.com' },
            access_token: 'supabase-jwt-token',
          },
        },
        { tab: { id: 123 } },
        mockSendResponse
      );

      // Should store Supabase session
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_session: expect.objectContaining({
            user: expect.objectContaining({
              id: 'supabase-user-123',
            }),
          }),
        })
      );
    });

    test('should handle Supabase configuration errors', async () => {
      // Mock missing or invalid Supabase config
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          supabaseConfig: {
            url: 'invalid-url',
            anonKey: '',
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      await messageHandler(
        { type: 'MARK_AS_READ', url: 'https://example.com' },
        { tab: { id: 123 } },
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringMatching(/configuration|setup|invalid/i),
      });
    });
  });

  describe('Security and Privacy', () => {
    test('should not expose sensitive authentication data', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'user123', email: 'test@example.com' },
            access_token: 'sensitive-token-123',
            refresh_token: 'sensitive-refresh-456',
          },
        });
      });

      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      // Request from content script (potentially untrusted)
      await messageHandler(
        { type: 'GET_AUTH_STATUS' },
        {
          tab: { id: 123, url: 'https://malicious-site.com' },
          origin: 'https://malicious-site.com',
        },
        mockSendResponse
      );

      // Should not include sensitive tokens in response
      const response = mockSendResponse.mock.calls[0][0];
      expect(response).not.toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    test('should validate message origins for authentication requests', async () => {
      await import('../../../background.js');

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSendResponse = vi.fn();

      // Authentication request from suspicious origin
      await messageHandler(
        { type: 'SUPABASE_AUTH_CALLBACK', session: { user: { id: 'test' } } },
        {
          tab: { id: 123, url: 'https://suspicious-site.com' },
          origin: 'https://suspicious-site.com',
        },
        mockSendResponse
      );

      // Should reject authentication from untrusted origins
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringMatching(/origin|security|unauthorized/i),
      });
    });
  });
});
