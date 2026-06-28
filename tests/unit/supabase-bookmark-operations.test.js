/**
 * @fileoverview Unit tests for bookmark operations
 * @module tests/unit/supabase-bookmark-operations
 * @description Tests for BookmarkOperations class
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BookmarkOperations } from '../../utils/supabase-bookmark-operations.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

// Mock dependencies
vi.mock('../../utils/error-handler.js', () => ({
  default: {
    createError: vi.fn((message, type, context) => {
      const error = new Error(message);
      error.type = type;
      error.context = context;
      return error;
    }),
    handle: vi.fn(),
    ERROR_TYPES: {
      AUTH: 'AUTH',
      VALIDATION: 'VALIDATION',
      NETWORK: 'NETWORK',
    },
  },
}));

vi.mock('../../utils/bookmark-transformer.js', () => ({
  default: {
    validate: vi.fn(() => ({ isValid: true, errors: [] })),
    toSupabaseFormat: vi.fn((bookmark, userId) => ({
      ...bookmark,
      user_id: userId,
    })),
  },
}));

describe('BookmarkOperations', () => {
  let bookmarkOps;
  let mockSupabase;
  let mockConfig;
  let mockPendingRequests;
  let mockTokenRefreshHandler;

  const setQueryResult = (chain, result) => {
    chain.then = (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    BookmarkTransformer.validate.mockReturnValue({ isValid: true, errors: [] });
    BookmarkTransformer.toSupabaseFormat.mockImplementation(
      (bookmark, userId) => ({
        ...bookmark,
        user_id: userId,
      }),
    );

    // Mock Supabase client with proper chaining (thenable builder pattern)
    const createChainableMock = () => {
      const chain = {
        from: vi.fn(() => chain),
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => chain),
        range: vi.fn(() => chain),
        or: vi.fn(() => chain),
        overlaps: vi.fn(() => chain),
        then: (onFulfilled, onRejected) =>
          Promise.resolve({ data: [], error: null }).then(
            onFulfilled,
            onRejected,
          ),
      };
      return chain;
    };

    mockSupabase = createChainableMock();

    // Mock config
    mockConfig = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    // Mock pending requests map
    mockPendingRequests = new Map();

    // Mock token refresh handler
    mockTokenRefreshHandler = {
      executeWithRefresh: vi.fn(operation => operation()),
    };

    bookmarkOps = new BookmarkOperations(
      mockSupabase,
      mockConfig,
      mockPendingRequests,
      mockTokenRefreshHandler,
    );
  });

  describe('constructor', () => {
    test('should initialize with all dependencies', () => {
      expect(bookmarkOps.supabase).toBe(mockSupabase);
      expect(bookmarkOps.config).toBe(mockConfig);
      expect(bookmarkOps.pendingRequests).toBe(mockPendingRequests);
      expect(bookmarkOps.tokenRefreshHandler).toBe(mockTokenRefreshHandler);
    });

    test('should work without token refresh handler', () => {
      const ops = new BookmarkOperations(
        mockSupabase,
        mockConfig,
        mockPendingRequests,
      );
      expect(ops.tokenRefreshHandler).toBeNull();
    });
  });

  describe('saveBookmark', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.saveBookmark({})).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should throw error when validation fails', async () => {
      BookmarkTransformer.validate.mockReturnValue({
        isValid: false,
        errors: ['URL is required'],
      });

      await expect(
        bookmarkOps.saveBookmark({
          url: '',
          title: 'Test',
          readStatus: 'read',
        }),
      ).rejects.toThrow('Invalid bookmark data');
    });

    test('should return existing bookmark if duplicate', async () => {
      const existingBookmark = {
        id: 'existing-id',
        url: 'https://example.com',
      };
      mockSupabase.single.mockResolvedValue({
        data: existingBookmark,
        error: null,
      });

      const result = await bookmarkOps.saveBookmark({
        url: 'https://example.com',
        title: 'Test',
        readStatus: 'read',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.id).toBe('existing-id');
    });

    test('should save new bookmark', async () => {
      const singlePromise = Promise.resolve({
        data: null,
        error: { code: 'PGRST116' },
      });
      const selectPromise = Promise.resolve({
        data: [{ id: 'new-id', url: 'https://example.com' }],
        error: null,
      });
      mockSupabase.single.mockImplementation(() => singlePromise);
      mockSupabase.select
        .mockReturnValueOnce(mockSupabase)
        .mockImplementationOnce(() => selectPromise);

      const bookmark = {
        url: 'https://example.com',
        title: 'Test',
        readStatus: 'read',
      };

      const result = await bookmarkOps.saveBookmark(bookmark);

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('should handle save errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockSupabase.select
        .mockReturnValueOnce(mockSupabase)
        .mockImplementationOnce(() =>
          Promise.resolve({
            data: null,
            error: new Error('Database error'),
          }),
        );

      await expect(
        bookmarkOps.saveBookmark({
          url: 'https://example.com',
          title: 'Test',
          readStatus: 'read',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getBookmarks', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.getBookmarks()).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should get bookmarks with default options', async () => {
      setQueryResult(mockSupabase, {
        data: [{ id: '1' }, { id: '2' }],
        error: null,
      });

      const result = await bookmarkOps.getBookmarks();

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result).toHaveLength(2);
    });

    test('should filter by status', async () => {
      setQueryResult(mockSupabase, {
        data: [],
        error: null,
      });

      await bookmarkOps.getBookmarks({ status: 'read' });

      expect(mockSupabase.eq).toHaveBeenCalledWith('read_status', 'read');
    });

    test('should filter by search', async () => {
      setQueryResult(mockSupabase, {
        data: [],
        error: null,
      });

      await bookmarkOps.getBookmarks({ search: 'test' });

      expect(mockSupabase.or).toHaveBeenCalled();
    });

    test('should filter by tags', async () => {
      setQueryResult(mockSupabase, {
        data: [],
        error: null,
      });

      await bookmarkOps.getBookmarks({ tags: ['tag1', 'tag2'] });

      expect(mockSupabase.overlaps).toHaveBeenCalledWith('tags', [
        'tag1',
        'tag2',
      ]);
    });

    test('should handle pagination', async () => {
      setQueryResult(mockSupabase, {
        data: [],
        error: null,
      });

      await bookmarkOps.getBookmarks({ page: 2, limit: 10 });

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
    });

    test('should handle errors', async () => {
      setQueryResult(mockSupabase, {
        data: null,
        error: new Error('Query error'),
      });

      await expect(bookmarkOps.getBookmarks()).rejects.toThrow();
    });
  });

  describe('getBookmarkByUrl', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(
        bookmarkOps.getBookmarkByUrl('https://example.com'),
      ).rejects.toThrow('User not authenticated');
    });

    test('should return bookmark when found', async () => {
      const bookmark = { id: '1', url: 'https://example.com' };
      mockSupabase.single.mockResolvedValue({
        data: bookmark,
        error: null,
      });

      const result = await bookmarkOps.getBookmarkByUrl('https://example.com');

      expect(result).toEqual(bookmark);
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'url',
        'https://example.com',
      );
    });

    test('should return null when not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await bookmarkOps.getBookmarkByUrl('https://example.com');

      expect(result).toBeNull();
    });

    test('should handle errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        bookmarkOps.getBookmarkByUrl('https://example.com'),
      ).rejects.toThrow();
    });
  });

  describe('updateBookmark', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.updateBookmark('id', {})).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should update bookmark', async () => {
      const updated = { id: '1', title: 'Updated' };
      mockSupabase.select.mockResolvedValue({
        data: [updated],
        error: null,
      });

      const result = await bookmarkOps.updateBookmark('1', {
        title: 'Updated',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updated);
    });

    test('should handle errors', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Update error'),
      });

      await expect(bookmarkOps.updateBookmark('1', {})).rejects.toThrow();
    });
  });

  describe('deleteBookmark', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.deleteBookmark('id')).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should delete bookmark', async () => {
      // Mock the final promise return
      const deleteChain = {
        eq: vi.fn(function (column) {
          if (column === 'user_id') {
            return Promise.resolve({
              data: null,
              error: null,
            });
          }
          return this;
        }),
      };
      mockSupabase.delete.mockReturnValue(deleteChain);
      mockSupabase.eq.mockReturnValueOnce(deleteChain);

      const result = await bookmarkOps.deleteBookmark('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle errors', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: new Error('Delete error'),
      });

      await expect(bookmarkOps.deleteBookmark('1')).rejects.toThrow();
    });
  });

  describe('getBookmarkById', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.getBookmarkById('id')).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should return bookmark when found', async () => {
      const bookmark = { id: '1', title: 'Test' };
      mockSupabase.single.mockResolvedValue({
        data: bookmark,
        error: null,
      });

      const result = await bookmarkOps.getBookmarkById('1');

      expect(result).toEqual(bookmark);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    test('should return null when not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await bookmarkOps.getBookmarkById('1');

      expect(result).toBeNull();
    });
  });

  describe('getBookmarkStats', () => {
    test('should throw error when not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkOps.getBookmarkStats()).rejects.toThrow(
        'User not authenticated',
      );
    });

    test('should return bookmark statistics', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: [
          { read_status: 'read' },
          { read_status: 'read' },
          { read_status: 'unread' },
        ],
        error: null,
      });

      const result = await bookmarkOps.getBookmarkStats();

      expect(result).toEqual({
        read: 2,
        unread: 1,
      });
    });

    test('should handle empty results', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await bookmarkOps.getBookmarkStats();

      expect(result).toEqual({});
    });
  });

  describe('request deduplication', () => {
    test('should deduplicate concurrent requests', async () => {
      let callCount = 0;
      mockSupabase.range.mockImplementation(() => {
        callCount++;
        setQueryResult(mockSupabase, {
          data: [{ id: callCount }],
          error: null,
        });
        return mockSupabase;
      });

      const promise1 = bookmarkOps.getBookmarks();
      const promise2 = bookmarkOps.getBookmarks();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Should only call once due to deduplication
      expect(callCount).toBe(1);
      expect(result1).toEqual(result2);
    });

    test('should remove failed requests from pending map', async () => {
      setQueryResult(mockSupabase, {
        data: null,
        error: new Error('Query error'),
      });

      await expect(bookmarkOps.getBookmarks()).rejects.toThrow('Query error');

      setQueryResult(mockSupabase, {
        data: [{ id: '1' }],
        error: null,
      });

      const result = await bookmarkOps.getBookmarks();

      expect(result).toEqual([{ id: '1' }]);
    });
  });
});
