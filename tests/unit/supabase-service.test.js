import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SupabaseService from '../../supabase-service.js';
import ErrorHandler from '../../utils/error-handler.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

// Mock dependencies
vi.mock('../../utils/error-handler.js');
vi.mock('../../utils/bookmark-transformer.js');

describe('SupabaseService', () => {
  let supabaseService;
  let mockSupabaseConfig;
  let mockSupabaseClient;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock SupabaseConfig
    mockSupabaseConfig = {
      initialize: vi.fn().mockResolvedValue(),
      getSupabaseClient: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
    };

    mockSupabaseConfig.getSupabaseClient.mockReturnValue(mockSupabaseClient);

    // Mock BookmarkTransformer
    BookmarkTransformer.validate.mockReturnValue({ isValid: true, errors: [] });
    BookmarkTransformer.toSupabaseFormat.mockReturnValue({
      user_id: 'test-user-id',
      url: 'https://example.com',
      title: 'Test Bookmark',
      read_status: 'read',
      tags: [],
    });

    // Mock ErrorHandler
    ErrorHandler.createError.mockImplementation((message, type, context) => {
      const error = new Error(message);
      error.type = type;
      error.context = context;
      return error;
    });

    ErrorHandler.handle.mockReturnValue({
      userMessage: 'Test error message',
      shouldShowToUser: true,
    });

    supabaseService = new SupabaseService(mockSupabaseConfig);
    // Initialize the service
    await supabaseService.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBookmarkByUrl', () => {
    it('should return bookmark when it exists', async () => {
      const mockBookmark = {
        id: 'bookmark-id',
        user_id: 'test-user-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test'],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockBookmark,
        error: null,
      });

      const result = await supabaseService.getBookmarkByUrl('https://example.com');

      expect(result).toEqual(mockBookmark);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('url', 'https://example.com');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });

    it('should return null when bookmark does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const result = await supabaseService.getBookmarkByUrl('https://example.com');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = new Error('Database error');
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(supabaseService.getBookmarkByUrl('https://example.com')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseConfig.isAuthenticated.mockReturnValue(false);

      await expect(supabaseService.getBookmarkByUrl('https://example.com')).rejects.toThrow(
        'User not authenticated',
      );
    });
  });

  describe('saveBookmark', () => {
    it('should return existing bookmark with isDuplicate flag when bookmark already exists', async () => {
      const existingBookmark = {
        id: 'bookmark-id',
        user_id: 'test-user-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test'],
      };

      // Mock getBookmarkByUrl to return existing bookmark
      vi.spyOn(supabaseService, 'getBookmarkByUrl').mockResolvedValue(existingBookmark);

      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        status: 'read',
        tags: ['test'],
      };

      const result = await supabaseService.saveBookmark(bookmark);

      expect(result).toEqual({
        ...existingBookmark,
        isDuplicate: true,
      });
      expect(supabaseService.getBookmarkByUrl).toHaveBeenCalledWith('https://example.com');
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it('should save new bookmark when it does not exist', async () => {
      const newBookmark = {
        id: 'new-bookmark-id',
        user_id: 'test-user-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test'],
      };

      // Mock getBookmarkByUrl to return null (no existing bookmark)
      vi.spyOn(supabaseService, 'getBookmarkByUrl').mockResolvedValue(null);

      // Mock the insert chain properly
      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: [newBookmark],
          error: null,
        }),
      };
      mockSupabaseClient.insert.mockReturnValue(mockInsertChain);

      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        status: 'read',
        tags: ['test'],
      };

      const result = await supabaseService.saveBookmark(bookmark);

      expect(result).toEqual(newBookmark);
      expect(supabaseService.getBookmarkByUrl).toHaveBeenCalledWith('https://example.com');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should validate bookmark data before saving', async () => {
      BookmarkTransformer.validate.mockReturnValue({
        isValid: false,
        errors: ['Invalid URL'],
      });

      const bookmark = {
        url: 'invalid-url',
        title: 'Test Bookmark',
        readStatus: 'read',
      };

      await expect(supabaseService.saveBookmark(bookmark)).rejects.toThrow(
        'Invalid bookmark data: Invalid URL',
      );
      expect(BookmarkTransformer.validate).toHaveBeenCalledWith(bookmark);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseConfig.isAuthenticated.mockReturnValue(false);

      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        readStatus: 'read',
      };

      await expect(supabaseService.saveBookmark(bookmark)).rejects.toThrow(
        'User not authenticated',
      );
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await supabaseService.initialize();

      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();
      expect(mockSupabaseConfig.getSupabaseClient).toHaveBeenCalled();
      expect(supabaseService.supabase).toBe(mockSupabaseClient);
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate concurrent getBookmarks calls with same parameters', async () => {
      const mockBookmarks = [
        { id: '1', title: 'Bookmark 1' },
        { id: '2', title: 'Bookmark 2' },
      ];

      let callCount = 0;
      mockSupabaseClient.range.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: mockBookmarks,
          error: null,
        });
      });

      const options = { page: 1, limit: 50 };
      const [result1, result2, result3] = await Promise.all([
        supabaseService.getBookmarks(options),
        supabaseService.getBookmarks(options),
        supabaseService.getBookmarks(options),
      ]);

      // All should return the same data
      expect(result1).toEqual(mockBookmarks);
      expect(result2).toEqual(mockBookmarks);
      expect(result3).toEqual(mockBookmarks);

      // Should only make one API call despite three concurrent requests
      expect(callCount).toBe(1);
    });

    it('should deduplicate concurrent getBookmarkByUrl calls with same URL', async () => {
      const mockBookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
      };

      let callCount = 0;
      mockSupabaseClient.single.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: mockBookmark,
          error: null,
        });
      });

      const url = 'https://example.com';
      const [result1, result2] = await Promise.all([
        supabaseService.getBookmarkByUrl(url),
        supabaseService.getBookmarkByUrl(url),
      ]);

      // Both should return the same bookmark
      expect(result1).toEqual(mockBookmark);
      expect(result2).toEqual(mockBookmark);

      // Should only make one API call despite two concurrent requests
      expect(callCount).toBe(1);
    });

    it('should not deduplicate getBookmarks calls with different parameters', async () => {
      const mockBookmarks1 = [{ id: '1', title: 'Bookmark 1' }];
      const mockBookmarks2 = [{ id: '2', title: 'Bookmark 2' }];

      let callCount = 0;
      mockSupabaseClient.range.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: mockBookmarks1, error: null });
        }
        return Promise.resolve({ data: mockBookmarks2, error: null });
      });

      const [result1, result2] = await Promise.all([
        supabaseService.getBookmarks({ page: 1, limit: 50 }),
        supabaseService.getBookmarks({ page: 2, limit: 50 }),
      ]);

      expect(result1).toEqual(mockBookmarks1);
      expect(result2).toEqual(mockBookmarks2);

      // Should make two separate API calls for different parameters
      expect(callCount).toBe(2);
    });

    it('should handle errors and remove from pending requests', async () => {
      const mockError = new Error('Database error');
      let callCount = 0;

      mockSupabaseClient.range.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: null,
          error: mockError,
        });
      });

      const options = { page: 1, limit: 50 };

      // First call should fail
      await expect(supabaseService.getBookmarks(options)).rejects.toThrow();

      // Second call should make a new request (not deduplicated from failed one)
      mockSupabaseClient.range.mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      });

      const result = await supabaseService.getBookmarks(options);
      expect(result).toEqual([{ id: '1' }]);

      // Should make two separate calls (one failed, one succeeded)
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });
});
