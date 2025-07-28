/**
 * @fileoverview Unit tests for StorageService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../../../src/services/StorageService.js';
import { ErrorService } from '../../../src/services/ErrorService.js';

describe('StorageService', () => {
  let storageService;
  let mockErrorService;

  beforeEach(() => {
    mockErrorService = new ErrorService();
    storageService = new StorageService(mockErrorService);

    // Reset chrome mocks
    vi.clearAllMocks();
    
    // Setup default chrome storage mocks
    global.chrome.storage.sync.get.mockResolvedValue({});
    global.chrome.storage.sync.set.mockResolvedValue();
    global.chrome.storage.sync.remove.mockResolvedValue();
    global.chrome.storage.sync.clear.mockResolvedValue();
    
    global.chrome.storage.local.get.mockResolvedValue({});
    global.chrome.storage.local.set.mockResolvedValue();
    global.chrome.storage.local.remove.mockResolvedValue();
    global.chrome.storage.local.clear.mockResolvedValue();
  });

  describe('get', () => {
    it('should get value from sync storage by default', async () => {
      const testData = { key1: 'value1', key2: 'value2' };
      global.chrome.storage.sync.get.mockResolvedValue(testData);

      const result = await storageService.get(['key1', 'key2']);

      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toEqual(testData);
    });

    it('should get value from local storage when specified', async () => {
      const testData = { key1: 'value1' };
      global.chrome.storage.local.get.mockResolvedValue(testData);

      const result = await storageService.get('key1', { area: 'local' });

      expect(global.chrome.storage.local.get).toHaveBeenCalledWith('key1');
      expect(result).toEqual(testData);
    });

    it('should handle single key as string', async () => {
      const testData = { key1: 'value1' };
      global.chrome.storage.sync.get.mockResolvedValue(testData);

      const result = await storageService.get('key1');

      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith('key1');
      expect(result).toEqual(testData);
    });

    it('should return default value when key not found', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({});

      const result = await storageService.get('nonexistent', { defaultValue: 'default' });

      expect(result).toBe('default');
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      global.chrome.storage.sync.get.mockRejectedValue(error);

      await expect(storageService.get('key1')).rejects.toThrow('Storage error');
    });
  });

  describe('set', () => {
    it('should set value in sync storage by default', async () => {
      const testData = { key1: 'value1', key2: 'value2' };

      await storageService.set(testData);

      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(testData);
    });

    it('should set value in local storage when specified', async () => {
      const testData = { key1: 'value1' };

      await storageService.set(testData, { area: 'local' });

      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(testData);
    });

    it('should handle single key-value pair', async () => {
      await storageService.set('key1', 'value1');

      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ key1: 'value1' });
    });

    it('should validate data size', async () => {
      const largeData = { key1: 'x'.repeat(10000) };

      await expect(storageService.set(largeData)).rejects.toThrow('Data too large for storage');
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      global.chrome.storage.sync.set.mockRejectedValue(error);

      await expect(storageService.set({ key1: 'value1' })).rejects.toThrow('Storage error');
    });
  });

  describe('remove', () => {
    it('should remove keys from sync storage by default', async () => {
      await storageService.remove(['key1', 'key2']);

      expect(global.chrome.storage.sync.remove).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should remove keys from local storage when specified', async () => {
      await storageService.remove('key1', { area: 'local' });

      expect(global.chrome.storage.local.remove).toHaveBeenCalledWith('key1');
    });

    it('should handle single key as string', async () => {
      await storageService.remove('key1');

      expect(global.chrome.storage.sync.remove).toHaveBeenCalledWith('key1');
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      global.chrome.storage.sync.remove.mockRejectedValue(error);

      await expect(storageService.remove('key1')).rejects.toThrow('Storage error');
    });
  });

  describe('clear', () => {
    it('should clear sync storage by default', async () => {
      await storageService.clear();

      expect(global.chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should clear local storage when specified', async () => {
      await storageService.clear({ area: 'local' });

      expect(global.chrome.storage.local.clear).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      global.chrome.storage.sync.clear.mockRejectedValue(error);

      await expect(storageService.clear()).rejects.toThrow('Storage error');
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage information', async () => {
      // Mock getBytesInUse
      global.chrome.storage.sync.getBytesInUse = vi.fn().mockResolvedValue(1000);
      global.chrome.storage.local.getBytesInUse = vi.fn().mockResolvedValue(2000);

      const result = await storageService.getStorageUsage();

      expect(result).toEqual({
        sync: {
          used: 1000,
          quota: 102400, // Default sync quota
          percentUsed: expect.any(Number)
        },
        local: {
          used: 2000,
          quota: 5242880, // Default local quota
          percentUsed: expect.any(Number)
        }
      });

      expect(result.sync.percentUsed).toBeCloseTo((1000 / 102400) * 100);
      expect(result.local.percentUsed).toBeCloseTo((2000 / 5242880) * 100);
    });

    it('should handle missing getBytesInUse API', async () => {
      global.chrome.storage.sync.getBytesInUse = undefined;
      global.chrome.storage.local.getBytesInUse = undefined;

      const result = await storageService.getStorageUsage();

      expect(result.sync.used).toBe(0);
      expect(result.local.used).toBe(0);
    });
  });

  describe('cache operations', () => {
    beforeEach(() => {
      storageService.cache.clear();
    });

    describe('setCache', () => {
      it('should store data in cache with TTL', () => {
        const testData = { key: 'value' };
        storageService.setCache('test-key', testData, 5000);

        const cached = storageService.cache.get('test-key');
        expect(cached.data).toEqual(testData);
        expect(cached.expires).toBeGreaterThan(Date.now());
      });

      it('should use default TTL when not specified', () => {
        const testData = { key: 'value' };
        storageService.setCache('test-key', testData);

        const cached = storageService.cache.get('test-key');
        expect(cached.expires).toBeGreaterThan(Date.now() + 290000); // Close to 5 minutes
      });
    });

    describe('getCache', () => {
      it('should return cached data if not expired', () => {
        const testData = { key: 'value' };
        storageService.setCache('test-key', testData, 5000);

        const result = storageService.getCache('test-key');
        expect(result).toEqual(testData);
      });

      it('should return null for expired cache', () => {
        const testData = { key: 'value' };
        storageService.setCache('test-key', testData, -1000); // Expired

        const result = storageService.getCache('test-key');
        expect(result).toBeNull();
      });

      it('should return null for non-existent cache', () => {
        const result = storageService.getCache('non-existent');
        expect(result).toBeNull();
      });

      it('should cleanup expired entries', () => {
        storageService.setCache('expired-key', { data: 'test' }, -1000);
        storageService.setCache('valid-key', { data: 'test' }, 5000);

        storageService.getCache('expired-key');

        expect(storageService.cache.has('expired-key')).toBe(false);
        expect(storageService.cache.has('valid-key')).toBe(true);
      });
    });

    describe('clearCache', () => {
      it('should clear all cache entries', () => {
        storageService.setCache('key1', { data: 'test1' });
        storageService.setCache('key2', { data: 'test2' });

        expect(storageService.cache.size).toBe(2);

        storageService.clearCache();

        expect(storageService.cache.size).toBe(0);
      });
    });

    describe('cache size management', () => {
      it('should evict oldest entries when cache is full', () => {
        const maxSize = storageService.maxCacheSize;
        
        // Fill cache to max size
        for (let i = 0; i < maxSize; i++) {
          storageService.setCache(`key-${i}`, { data: `value-${i}` });
        }

        expect(storageService.cache.size).toBe(maxSize);

        // Add one more entry
        storageService.setCache('new-key', { data: 'new-value' });

        expect(storageService.cache.size).toBe(maxSize);
        expect(storageService.cache.has('key-0')).toBe(false); // Oldest evicted
        expect(storageService.cache.has('new-key')).toBe(true); // New entry exists
      });
    });
  });

  describe('bookmark cache operations', () => {
    describe('setBookmarkCache', () => {
      it('should cache bookmark data', () => {
        const bookmarks = [
          { id: '1', title: 'Test 1', url: 'https://test1.com' },
          { id: '2', title: 'Test 2', url: 'https://test2.com' }
        ];

        storageService.setBookmarkCache('user-123', bookmarks);

        const cached = storageService.getCache('bookmarks:user-123');
        expect(cached).toEqual(bookmarks);
      });
    });

    describe('getBookmarkCache', () => {
      it('should return cached bookmark data', () => {
        const bookmarks = [
          { id: '1', title: 'Test 1', url: 'https://test1.com' }
        ];

        storageService.setBookmarkCache('user-123', bookmarks);
        const result = storageService.getBookmarkCache('user-123');

        expect(result).toEqual(bookmarks);
      });

      it('should return null when no cache exists', () => {
        const result = storageService.getBookmarkCache('user-nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('clearBookmarkCache', () => {
      it('should clear bookmark cache for specific user', () => {
        storageService.setBookmarkCache('user-123', [{ id: '1' }]);
        storageService.setBookmarkCache('user-456', [{ id: '2' }]);
        storageService.setCache('other-cache', { data: 'test' });

        storageService.clearBookmarkCache('user-123');

        expect(storageService.getBookmarkCache('user-123')).toBeNull();
        expect(storageService.getBookmarkCache('user-456')).not.toBeNull();
        expect(storageService.getCache('other-cache')).not.toBeNull();
      });

      it('should clear all bookmark cache when no user specified', () => {
        storageService.setBookmarkCache('user-123', [{ id: '1' }]);
        storageService.setBookmarkCache('user-456', [{ id: '2' }]);
        storageService.setCache('other-cache', { data: 'test' });

        storageService.clearBookmarkCache();

        expect(storageService.getBookmarkCache('user-123')).toBeNull();
        expect(storageService.getBookmarkCache('user-456')).toBeNull();
        expect(storageService.getCache('other-cache')).not.toBeNull();
      });
    });
  });

  describe('data serialization', () => {
    it('should handle circular references in stored data', async () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      await expect(storageService.set({ circular: circularObj }))
        .rejects.toThrow('Cannot store circular references');
    });

    it('should validate JSON serialization', () => {
      const validData = { key: 'value', number: 123, array: [1, 2, 3] };
      expect(() => storageService.validateDataSize(validData)).not.toThrow();

      const invalidData = { func: () => {} };
      expect(() => storageService.validateDataSize(invalidData)).toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle chrome storage API errors gracefully', async () => {
      const storageError = new Error('QUOTA_EXCEEDED');
      global.chrome.storage.sync.set.mockRejectedValue(storageError);

      await expect(storageService.set({ key: 'value' })).rejects.toThrow('QUOTA_EXCEEDED');
    });

    it('should handle missing chrome storage API', async () => {
      global.chrome.storage.sync = undefined;

      await expect(storageService.get('key')).rejects.toThrow('Chrome storage API not available');
    });
  });
});