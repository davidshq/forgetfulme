/**
 * @fileoverview Unit tests for AuthStateManager with ChromeStorageAdapter
 * @module auth-state-manager-adapter-test
 * @description Tests for AuthStateManager using the new ChromeStorageAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AuthStateManager from '../../utils/auth-state-manager.js';
import ChromeStorageAdapter from '../../utils/chrome-storage-adapter.js';

describe('AuthStateManager with ChromeStorageAdapter', () => {
  let mockStorageAdapter;
  let mockChrome;
  let mockStorage;
  let authManager;
  let storageChangeCallback;

  beforeEach(() => {
    // Create mock Chrome storage
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    // Create mock storage adapter
    mockStorageAdapter = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      addChangeListener: vi.fn(),
      getStorageArea: vi.fn().mockReturnValue('sync'),
    };

    // Create mock Chrome runtime with storage
    mockChrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(),
      },
      storage: {
        sync: mockStorage,
        local: mockStorage,
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };

    // Mock the cleanup function returned by addChangeListener
    const mockCleanup = vi.fn();
    mockStorageAdapter.addChangeListener.mockImplementation(callback => {
      storageChangeCallback = callback;
      return mockCleanup;
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    if (authManager) {
      authManager.cleanup();
      authManager = null;
    }
  });

  describe('constructor', () => {
    it('should initialize with default storage adapter', () => {
      // Temporarily set global chrome for default adapter creation
      global.chrome = mockChrome;

      try {
        authManager = new AuthStateManager();

        expect(authManager.storageAdapter).toBeInstanceOf(ChromeStorageAdapter);
        expect(authManager.chrome).toBe(mockChrome);
        expect(authManager.initialized).toBe(false);
      } finally {
        delete global.chrome;
      }
    });

    it('should initialize with provided storage adapter', () => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });

      expect(authManager.storageAdapter).toBe(mockStorageAdapter);
      expect(authManager.chrome).toBe(mockChrome);
    });

    it('should initialize with chrome dependency provided', () => {
      authManager = new AuthStateManager({ chrome: mockChrome });

      expect(authManager.storageAdapter).toBeInstanceOf(ChromeStorageAdapter);
      expect(authManager.chrome).toBe(mockChrome);
      expect(authManager.authState).toBeNull();
      expect(authManager.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should load auth state from storage and set up listeners', async () => {
      const testAuthState = {
        user: { id: '123', email: 'test@example.com' },
        token: 'jwt-token',
      };

      mockStorageAdapter.getItem.mockResolvedValue(testAuthState);

      await authManager.initialize();

      expect(mockStorageAdapter.getItem).toHaveBeenCalledWith('auth_session');
      expect(mockStorageAdapter.addChangeListener).toHaveBeenCalled();
      expect(authManager.authState).toEqual(testAuthState);
      expect(authManager.initialized).toBe(true);
    });

    it('should handle null auth state from storage', async () => {
      mockStorageAdapter.getItem.mockResolvedValue(null);

      await authManager.initialize();

      expect(authManager.authState).toBeNull();
      expect(authManager.initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      mockStorageAdapter.getItem.mockResolvedValue(null);

      await authManager.initialize();
      await authManager.initialize(); // Second call

      expect(mockStorageAdapter.getItem).toHaveBeenCalledTimes(1);
    });

    it('should handle storage errors during initialization', async () => {
      const storageError = new Error('Storage initialization failed');
      mockStorageAdapter.getItem.mockRejectedValue(storageError);

      await expect(authManager.initialize()).rejects.toThrow();
    });
  });

  describe('getAuthState', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should return current auth state', async () => {
      const testAuthState = { user: { id: '123' } };
      mockStorageAdapter.getItem.mockResolvedValue(testAuthState);

      await authManager.initialize();
      const result = await authManager.getAuthState();

      expect(result).toEqual(testAuthState);
    });

    it('should ensure initialization before returning state', async () => {
      mockStorageAdapter.getItem.mockResolvedValue(null);

      const result = await authManager.getAuthState();

      expect(mockStorageAdapter.getItem).toHaveBeenCalledWith('auth_session');
      expect(result).toBeNull();
      expect(authManager.initialized).toBe(true);
    });
  });

  describe('setAuthState', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should save auth state and notify contexts', async () => {
      const testAuthState = {
        user: { id: '123', email: 'test@example.com' },
        token: 'jwt-token',
      };

      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.setItem.mockResolvedValue();

      await authManager.setAuthState(testAuthState);

      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'auth_session',
        testAuthState
      );
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: testAuthState,
      });
      expect(authManager.authState).toEqual(testAuthState);
    });

    it('should handle storage errors gracefully', async () => {
      const testAuthState = { user: { id: '123' } };
      const storageError = new Error('Storage failed');

      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.setItem.mockRejectedValue(storageError);

      await expect(authManager.setAuthState(testAuthState)).rejects.toThrow(
        'Failed to save authentication state to storage'
      );

      // Should still notify contexts even if storage fails
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: testAuthState,
      });
    });

    it('should notify listeners of auth state changes', async () => {
      const listener = vi.fn();
      const testAuthState = { user: { id: '123' } };

      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.setItem.mockResolvedValue();

      authManager.addListener('authStateChanged', listener);
      await authManager.setAuthState(testAuthState);

      expect(listener).toHaveBeenCalledWith(testAuthState);
    });
  });

  describe('clearAuthState', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should clear auth state and notify contexts', async () => {
      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.removeItem.mockResolvedValue();

      await authManager.clearAuthState();

      expect(mockStorageAdapter.removeItem).toHaveBeenCalledWith(
        'auth_session'
      );
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: null,
      });
      expect(authManager.authState).toBeNull();
    });

    it('should notify listeners when clearing auth state', async () => {
      const listener = vi.fn();

      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.removeItem.mockResolvedValue();

      authManager.addListener('authStateChanged', listener);
      await authManager.clearAuthState();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('storage change handling', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should handle storage changes from other contexts', async () => {
      const listener = vi.fn();
      mockStorageAdapter.getItem.mockResolvedValue(null);

      await authManager.initialize();
      authManager.addListener('authStateChanged', listener);

      // Simulate storage change from another context
      const newAuthState = { user: { id: '456' } };
      const changes = {
        auth_session: {
          newValue: newAuthState,
          oldValue: null,
        },
      };

      storageChangeCallback(changes, 'sync');

      expect(authManager.authState).toEqual(newAuthState);
      expect(listener).toHaveBeenCalledWith(newAuthState);
    });

    it('should not notify listeners if auth state has not changed', async () => {
      const listener = vi.fn();
      const authState = { user: { id: '123' } };

      mockStorageAdapter.getItem.mockResolvedValue(authState);

      await authManager.initialize();
      authManager.addListener('authStateChanged', listener);

      // Clear the listener call from initialization
      listener.mockClear();

      // Simulate storage change with same value
      const changes = {
        auth_session: {
          newValue: authState,
          oldValue: authState,
        },
      };

      storageChangeCallback(changes, 'sync');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should return true when user is authenticated', async () => {
      const authState = { user: { id: '123' } };
      mockStorageAdapter.getItem.mockResolvedValue(authState);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      mockStorageAdapter.getItem.mockResolvedValue(null);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAuthSummary', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should return complete auth summary', () => {
      const authState = {
        user: { id: '123', email: 'test@example.com' },
        token: 'jwt-token',
      };

      authManager.authState = authState;
      authManager.initialized = true;

      const summary = authManager.getAuthSummary();

      expect(summary).toEqual({
        isAuthenticated: true,
        hasSession: true,
        userId: '123',
        email: 'test@example.com',
        initialized: true,
        storageArea: 'sync',
      });
    });

    it('should return summary for unauthenticated state', () => {
      authManager.authState = null;
      authManager.initialized = true;

      const summary = authManager.getAuthSummary();

      expect(summary).toEqual({
        isAuthenticated: false,
        hasSession: false,
        userId: null,
        email: null,
        initialized: true,
        storageArea: 'sync',
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const mockCleanup = vi.fn();
      mockStorageAdapter.addChangeListener.mockReturnValue(mockCleanup);
      mockStorageAdapter.getItem.mockResolvedValue(null);

      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });

      await authManager.initialize();
      authManager.addListener('authStateChanged', vi.fn());

      expect(authManager.listeners.size).toBe(1);
      expect(authManager.initialized).toBe(true);

      authManager.cleanup();

      expect(mockCleanup).toHaveBeenCalled();
      expect(authManager.listeners.size).toBe(0);
      expect(authManager.initialized).toBe(false);
    });
  });

  describe('listener management', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should add and remove listeners correctly', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      authManager.addListener('authStateChanged', listener1);
      authManager.addListener('authStateChanged', listener2);

      expect(authManager.listeners.size).toBe(2);

      authManager.removeListener('authStateChanged', listener1);

      expect(authManager.listeners.size).toBe(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      authManager.addListener('authStateChanged', errorListener);
      authManager.addListener('authStateChanged', goodListener);

      // Should not throw when notifying listeners
      expect(() => {
        authManager.notifyListeners('authStateChanged', {
          user: { id: '123' },
        });
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('runtime message handling', () => {
    beforeEach(() => {
      authManager = new AuthStateManager({
        storageAdapter: mockStorageAdapter,
        chrome: mockChrome,
      });
    });

    it('should handle missing runtime gracefully', async () => {
      authManager.chrome = null;
      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.setItem.mockResolvedValue();

      // Should not throw when Chrome runtime is not available
      await expect(
        authManager.setAuthState({ user: { id: '123' } })
      ).resolves.not.toThrow();
    });

    it('should handle runtime message errors gracefully', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(
        new Error('Runtime error')
      );
      mockStorageAdapter.getItem.mockResolvedValue(null);
      mockStorageAdapter.setItem.mockResolvedValue();

      // Should not throw when runtime message fails
      await expect(
        authManager.setAuthState({ user: { id: '123' } })
      ).resolves.not.toThrow();
    });
  });
});
