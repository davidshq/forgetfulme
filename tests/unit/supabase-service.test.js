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
  let mockChain;

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

    // Create mock chain object
    mockChain = {
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

    // Mock Supabase client with proper chaining
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue(mockChain),
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

      mockChain.single.mockResolvedValue({
        data: mockBookmark,
        error: null,
      });

      const result = await supabaseService.getBookmarkByUrl(
        'https://example.com'
      );

      expect(result).toEqual(mockBookmark);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookmarks');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockChain.eq).toHaveBeenCalledWith('url', 'https://example.com');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return null when bookmark does not exist', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const result = await supabaseService.getBookmarkByUrl(
        'https://example.com'
      );

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        supabaseService.getBookmarkByUrl('https://example.com')
      ).rejects.toThrow('Database error');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseConfig.isAuthenticated.mockReturnValue(false);

      await expect(
        supabaseService.getBookmarkByUrl('https://example.com')
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      // Create a new service instance for this test to avoid double initialization
      const testService = new SupabaseService(mockSupabaseConfig);

      // Reset the mocks to ensure clean state
      vi.clearAllMocks();

      // Re-setup the mocks for the new service instance
      mockSupabaseConfig.initialize.mockResolvedValue();
      mockSupabaseConfig.getSupabaseClient.mockReturnValue(mockSupabaseClient);

      // Ensure the supabase property is initially null
      expect(testService.supabase).toBeNull();

      await testService.initialize();

      // Debug: Check what's happening
      console.log(
        'mockSupabaseConfig.initialize called:',
        mockSupabaseConfig.initialize.mock.calls.length
      );
      console.log(
        'mockSupabaseConfig.getSupabaseClient called:',
        mockSupabaseConfig.getSupabaseClient.mock.calls.length
      );
      console.log('testService.supabase:', testService.supabase);
      console.log('mockSupabaseClient:', mockSupabaseClient);

      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();
      expect(mockSupabaseConfig.getSupabaseClient).toHaveBeenCalled();
      expect(testService.supabase).toBe(mockSupabaseClient);
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

      // Mock the internal _getBookmarkByUrl call to return existing bookmark
      mockChain.single.mockResolvedValue({
        data: existingBookmark,
        error: null,
      });

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
      expect(mockChain.insert).not.toHaveBeenCalled();
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

      // Set up the main mock chain to return no existing bookmark for _getBookmarkByUrl
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      // Create a separate mock for the insert query chain to avoid conflicts
      const insertMockChain = {
        select: vi.fn().mockResolvedValue({
          data: [newBookmark],
          error: null,
        }),
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

      // Mock from to return different chains for different calls
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call is for _getBookmarkByUrl - return the regular chain
          return mockChain;
        } else {
          // Second call is for insert - return the insert chain
          return insertMockChain;
        }
      });

      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        status: 'read',
        tags: ['test'],
      };

      const result = await supabaseService.saveBookmark(bookmark);

      expect(result).toEqual(newBookmark);
      expect(insertMockChain.insert).toHaveBeenCalled();
    });

    it('should validate bookmark data before saving', async () => {
      BookmarkTransformer.validate.mockReturnValue({
        isValid: false,
        errors: ['Invalid URL'],
      });

      const bookmark = {
        url: 'invalid-url',
        title: 'Test Bookmark',
      };

      await expect(supabaseService.saveBookmark(bookmark)).rejects.toThrow(
        'Invalid bookmark data: Invalid URL'
      );
      expect(BookmarkTransformer.validate).toHaveBeenCalledWith(bookmark);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseConfig.isAuthenticated.mockReturnValue(false);

      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
      };

      await expect(supabaseService.saveBookmark(bookmark)).rejects.toThrow(
        'User not authenticated'
      );
    });
  });
});
