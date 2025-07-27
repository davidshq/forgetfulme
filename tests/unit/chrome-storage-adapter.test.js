/**
 * @fileoverview Unit tests for ChromeStorageAdapter
 * @module chrome-storage-adapter-test
 * @description Comprehensive unit tests for Chrome storage adapter with dependency injection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChromeStorageAdapter from '../../utils/chrome-storage-adapter.js';
import ErrorHandler from '../../utils/error-handler.js';

describe('ChromeStorageAdapter', () => {
  let mockChrome;
  let mockStorage;
  let adapter;

  beforeEach(() => {
    // Create mock Chrome storage API
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    mockChrome = {
      storage: {
        sync: mockStorage,
        local: mockStorage,
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (adapter) {
      adapter = null;
    }
  });

  describe('constructor', () => {
    it('should initialize with default sync storage', () => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });

      expect(adapter.chrome).toBe(mockChrome);
      expect(adapter.storageArea).toBe('sync');
      expect(adapter.storage).toBe(mockChrome.storage.sync);
    });

    it('should initialize with local storage when specified', () => {
      adapter = new ChromeStorageAdapter({
        chrome: mockChrome,
        storageArea: 'local',
      });

      expect(adapter.storageArea).toBe('local');
      expect(adapter.storage).toBe(mockChrome.storage.local);
    });

    it('should throw error when Chrome APIs not available', () => {
      // Temporarily remove global chrome if it exists
      const originalChrome = global.chrome;
      delete global.chrome;

      try {
        expect(() => {
          new ChromeStorageAdapter({ chrome: null });
        }).toThrow('Chrome storage APIs not available');
      } finally {
        // Restore global chrome
        if (originalChrome) {
          global.chrome = originalChrome;
        }
      }
    });

    it('should throw error for invalid storage area', () => {
      expect(() => {
        new ChromeStorageAdapter({
          chrome: mockChrome,
          storageArea: 'invalid',
        });
      }).toThrow('Invalid storage area: invalid');
    });

    it('should use global chrome if available', () => {
      // Mock global chrome
      const globalChrome = { storage: { sync: {}, local: {} } };
      global.chrome = globalChrome;

      adapter = new ChromeStorageAdapter();
      expect(adapter.chrome).toBe(globalChrome);

      // Cleanup
      delete global.chrome;
    });
  });

  describe('getItem', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should get item from storage', async () => {
      const testKey = 'test_key';
      const testValue = 'test_value';
      mockStorage.get.mockResolvedValue({ [testKey]: testValue });

      const result = await adapter.getItem(testKey);

      expect(mockStorage.get).toHaveBeenCalledWith(testKey);
      expect(result).toBe(testValue);
    });

    it('should return null for non-existent key', async () => {
      const testKey = 'non_existent';
      mockStorage.get.mockResolvedValue({});

      const result = await adapter.getItem(testKey);

      expect(result).toBeNull();
    });

    it('should validate key and throw error for invalid key', async () => {
      await expect(adapter.getItem('')).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
      await expect(adapter.getItem(null)).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
      await expect(adapter.getItem(123)).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
    });

    it('should handle storage errors', async () => {
      const testError = new Error('Storage error');
      mockStorage.get.mockRejectedValue(testError);

      await expect(adapter.getItem('test')).rejects.toThrow();
    });
  });

  describe('setItem', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should set item in storage', async () => {
      const testKey = 'test_key';
      const testValue = 'test_value';
      mockStorage.set.mockResolvedValue();

      await adapter.setItem(testKey, testValue);

      expect(mockStorage.set).toHaveBeenCalledWith({ [testKey]: testValue });
    });

    it('should validate key and value', async () => {
      await expect(adapter.setItem('', 'value')).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
      await expect(adapter.setItem('key', undefined)).rejects.toThrow(
        'Storage value cannot be undefined'
      );
    });

    it('should reject circular references', async () => {
      const circular = {};
      circular.self = circular;

      await expect(adapter.setItem('key', circular)).rejects.toThrow(
        'Storage value must be JSON serializable'
      );
    });

    it('should handle storage errors', async () => {
      const testError = new Error('Storage error');
      mockStorage.set.mockRejectedValue(testError);

      await expect(adapter.setItem('test', 'value')).rejects.toThrow();
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should remove item from storage', async () => {
      const testKey = 'test_key';
      mockStorage.remove.mockResolvedValue();

      await adapter.removeItem(testKey);

      expect(mockStorage.remove).toHaveBeenCalledWith(testKey);
    });

    it('should validate key', async () => {
      await expect(adapter.removeItem('')).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
    });

    it('should handle storage errors', async () => {
      const testError = new Error('Storage error');
      mockStorage.remove.mockRejectedValue(testError);

      await expect(adapter.removeItem('test')).rejects.toThrow();
    });
  });

  describe('getItems', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should get multiple items from storage', async () => {
      const testKeys = ['key1', 'key2'];
      const testResult = { key1: 'value1', key2: 'value2' };
      mockStorage.get.mockResolvedValue(testResult);

      const result = await adapter.getItems(testKeys);

      expect(mockStorage.get).toHaveBeenCalledWith(testKeys);
      expect(result).toEqual(testResult);
    });

    it('should validate all keys', async () => {
      await expect(adapter.getItems(['valid', ''])).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
    });
  });

  describe('setItems', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should set multiple items in storage', async () => {
      const testItems = { key1: 'value1', key2: 'value2' };
      mockStorage.set.mockResolvedValue();

      await adapter.setItems(testItems);

      expect(mockStorage.set).toHaveBeenCalledWith(testItems);
    });

    it('should validate all keys and values', async () => {
      await expect(adapter.setItems({ '': 'value' })).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
      await expect(adapter.setItems({ key: undefined })).rejects.toThrow(
        'Storage value cannot be undefined'
      );
    });
  });

  describe('removeItems', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should remove multiple items from storage', async () => {
      const testKeys = ['key1', 'key2'];
      mockStorage.remove.mockResolvedValue();

      await adapter.removeItems(testKeys);

      expect(mockStorage.remove).toHaveBeenCalledWith(testKeys);
    });

    it('should validate all keys', async () => {
      await expect(adapter.removeItems(['valid', ''])).rejects.toThrow(
        'Storage key must be a non-empty string'
      );
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should clear all items from storage', async () => {
      mockStorage.clear.mockResolvedValue();

      await adapter.clear();

      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const testError = new Error('Storage error');
      mockStorage.clear.mockRejectedValue(testError);

      await expect(adapter.clear()).rejects.toThrow();
    });
  });

  describe('getAllItems', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should get all items from storage', async () => {
      const testResult = { key1: 'value1', key2: 'value2' };
      mockStorage.get.mockResolvedValue(testResult);

      const result = await adapter.getAllItems();

      expect(mockStorage.get).toHaveBeenCalledWith(null);
      expect(result).toEqual(testResult);
    });
  });

  describe('addChangeListener', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should add storage change listener', () => {
      const callback = vi.fn();
      const cleanup = adapter.addChangeListener(callback);

      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      // Test callback filtering
      const wrappedCallback =
        mockChrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = { key: { newValue: 'new', oldValue: 'old' } };

      // Should call callback for correct namespace
      wrappedCallback(changes, 'sync');
      expect(callback).toHaveBeenCalledWith(changes, 'sync');

      // Should not call callback for different namespace
      callback.mockClear();
      wrappedCallback(changes, 'local');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return cleanup function that removes listener', () => {
      const callback = vi.fn();
      const cleanup = adapter.addChangeListener(callback);

      cleanup();

      expect(mockChrome.storage.onChanged.removeListener).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should return storage area', () => {
      expect(adapter.getStorageArea()).toBe('sync');
    });

    it('should check availability', () => {
      expect(adapter.isAvailable()).toBe(true);

      // Test with a properly constructed adapter but with missing storage
      const partialChrome = { storage: { sync: null, local: null } };
      const noStorageAdapter = new ChromeStorageAdapter({
        chrome: partialChrome,
      });
      noStorageAdapter.storage = null; // Simulate missing storage after construction
      expect(noStorageAdapter.isAvailable()).toBe(false);
    });

    it('should get usage info when supported', async () => {
      mockStorage.getBytesInUse.mockResolvedValue(1024);

      const usage = await adapter.getUsage();

      expect(usage).toEqual({ bytesInUse: 1024 });
    });

    it('should return null usage when not supported', async () => {
      delete mockStorage.getBytesInUse;

      const usage = await adapter.getUsage();

      expect(usage).toBeNull();
    });

    it('should handle usage errors gracefully', async () => {
      mockStorage.getBytesInUse.mockRejectedValue(new Error('Usage error'));

      const usage = await adapter.getUsage();

      expect(usage).toBeNull();
    });
  });

  describe('validation methods', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should validate keys correctly', () => {
      expect(() => adapter.validateKey('valid_key')).not.toThrow();
      expect(() => adapter.validateKey('')).toThrow(
        'Storage key must be a non-empty string'
      );
      expect(() => adapter.validateKey('   ')).toThrow(
        'Storage key must be a non-empty string'
      );
      expect(() => adapter.validateKey(null)).toThrow(
        'Storage key must be a non-empty string'
      );
      expect(() => adapter.validateKey(123)).toThrow(
        'Storage key must be a non-empty string'
      );
    });

    it('should validate values correctly', () => {
      expect(() => adapter.validateValue('string')).not.toThrow();
      expect(() => adapter.validateValue(123)).not.toThrow();
      expect(() => adapter.validateValue({ key: 'value' })).not.toThrow();
      expect(() => adapter.validateValue(null)).not.toThrow();
      expect(() => adapter.validateValue(undefined)).toThrow(
        'Storage value cannot be undefined'
      );

      const circular = {};
      circular.self = circular;
      expect(() => adapter.validateValue(circular)).toThrow(
        'Storage value must be JSON serializable'
      );
    });
  });

  describe('error handling integration', () => {
    let mockErrorHandler;

    beforeEach(() => {
      mockErrorHandler = {
        handle: vi.fn().mockReturnValue({
          userMessage: 'Test error message',
          errorInfo: { type: 'TEST_ERROR' },
        }),
        createError: vi.fn().mockImplementation((message, type, context) => {
          const error = new Error(message);
          error.type = type;
          error.context = context;
          return error;
        }),
        ERROR_TYPES: {
          CONFIG: 'CONFIG',
          VALIDATION: 'VALIDATION',
        },
      };

      adapter = new ChromeStorageAdapter({
        chrome: mockChrome,
        errorHandler: mockErrorHandler,
      });
    });

    it('should use custom error handler', async () => {
      const testError = new Error('Storage error');
      mockStorage.get.mockRejectedValue(testError);

      await expect(adapter.getItem('test')).rejects.toThrow(
        'Test error message'
      );

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        testError,
        'chrome-storage-adapter.getItem'
      );
      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'Test error message',
        'TEST_ERROR',
        'chrome-storage-adapter.getItem'
      );
    });
  });

  describe('real-world usage scenarios', () => {
    beforeEach(() => {
      adapter = new ChromeStorageAdapter({ chrome: mockChrome });
    });

    it('should handle authentication session storage', async () => {
      const authSession = {
        user: { id: '123', email: 'test@example.com' },
        token: 'jwt-token-here',
        expiresAt: Date.now() + 3600000,
      };

      mockStorage.set.mockResolvedValue();
      mockStorage.get.mockResolvedValue({ auth_session: authSession });

      // Set auth session
      await adapter.setItem('auth_session', authSession);
      expect(mockStorage.set).toHaveBeenCalledWith({
        auth_session: authSession,
      });

      // Get auth session
      const retrieved = await adapter.getItem('auth_session');
      expect(retrieved).toEqual(authSession);
    });

    it('should handle user preferences storage', async () => {
      const preferences = {
        customStatusTypes: ['read', 'important', 'review'],
        theme: 'dark',
        notifications: true,
      };

      mockStorage.set.mockResolvedValue();
      mockStorage.get.mockResolvedValue({ user_preferences: preferences });

      await adapter.setItem('user_preferences', preferences);
      const retrieved = await adapter.getItem('user_preferences');

      expect(retrieved).toEqual(preferences);
    });

    it('should handle batch operations for data export', async () => {
      const exportData = {
        auth_session: { user: { id: '123' } },
        user_preferences: { theme: 'dark' },
        bookmarks: [{ id: 1, url: 'https://example.com' }],
      };

      mockStorage.get.mockResolvedValue(exportData);

      const allData = await adapter.getAllItems();
      expect(allData).toEqual(exportData);
    });
  });
});
