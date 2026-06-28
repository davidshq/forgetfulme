import { describe, it, expect, vi } from 'vitest';
import {
  getRequestKey,
  deduplicateRequest,
  requireSupabaseAuth,
} from '../../utils/supabase-request-utils.js';
import ErrorHandler from '../../utils/error-handler.js';

describe('supabase-request-utils', () => {
  describe('requireSupabaseAuth', () => {
    it('should not throw when user is authenticated', () => {
      const config = {
        isAuthenticated: vi.fn().mockReturnValue(true),
      };

      expect(() =>
        requireSupabaseAuth(config, 'supabase-service.saveBookmark'),
      ).not.toThrow();
    });

    it('should throw auth error when user is not authenticated', () => {
      const config = {
        isAuthenticated: vi.fn().mockReturnValue(false),
      };

      expect(() =>
        requireSupabaseAuth(config, 'supabase-service.getBookmarks'),
      ).toThrow('User not authenticated');

      try {
        requireSupabaseAuth(config, 'supabase-service.getBookmarks');
      } catch (error) {
        expect(error.type).toBe(ErrorHandler.ERROR_TYPES.AUTH);
        expect(error.context).toBe('supabase-service.getBookmarks');
      }
    });
  });

  describe('getRequestKey', () => {
    it('should include explicit userId in the key', () => {
      const config = {
        isAuthenticated: vi.fn(),
        getCurrentUser: vi.fn(),
      };

      const key = getRequestKey('getBookmarks', { page: 1 }, config, 'user-1');

      expect(key).toBe('getBookmarks:user-1:{"page":1}');
      expect(config.isAuthenticated).not.toHaveBeenCalled();
    });

    it('should resolve userId from config when authenticated', () => {
      const config = {
        isAuthenticated: vi.fn().mockReturnValue(true),
        getCurrentUser: vi.fn().mockReturnValue({ id: 'current-user' }),
      };

      const key = getRequestKey('getUserPreferences', {}, config);

      expect(key).toBe('getUserPreferences:current-user:{}');
    });

    it('should use anonymous when not authenticated and no userId provided', () => {
      const config = {
        isAuthenticated: vi.fn().mockReturnValue(false),
        getCurrentUser: vi.fn(),
      };

      const key = getRequestKey('getBookmarks', null, config);

      expect(key).toBe('getBookmarks:anonymous:{}');
    });
  });

  describe('deduplicateRequest', () => {
    it('should deduplicate concurrent requests with the same key', async () => {
      const pendingRequests = new Map();
      let callCount = 0;
      const requestFn = vi.fn(async () => {
        callCount++;
        return `result-${callCount}`;
      });

      const [result1, result2] = await Promise.all([
        deduplicateRequest(pendingRequests, 'key-1', requestFn),
        deduplicateRequest(pendingRequests, 'key-1', requestFn),
      ]);

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-1');
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(pendingRequests.size).toBe(0);
    });

    it('should not deduplicate requests with different keys', async () => {
      const pendingRequests = new Map();
      const requestFn = vi
        .fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');

      const [result1, result2] = await Promise.all([
        deduplicateRequest(pendingRequests, 'key-1', requestFn),
        deduplicateRequest(pendingRequests, 'key-2', requestFn),
      ]);

      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(requestFn).toHaveBeenCalledTimes(2);
    });

    it('should remove failed requests from pending map', async () => {
      const pendingRequests = new Map();
      const error = new Error('request failed');
      const failingFn = vi.fn().mockRejectedValue(error);
      const successFn = vi.fn().mockResolvedValue('ok');

      await expect(
        deduplicateRequest(pendingRequests, 'key-1', failingFn),
      ).rejects.toThrow('request failed');
      expect(pendingRequests.size).toBe(0);

      const result = await deduplicateRequest(
        pendingRequests,
        'key-1',
        successFn,
      );

      expect(result).toBe('ok');
      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });
});
