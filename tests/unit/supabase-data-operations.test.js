import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataOperations } from '../../utils/supabase-data-operations.js';
import ErrorHandler from '../../utils/error-handler.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

// Mock dependencies
vi.mock('../../utils/error-handler.js');
vi.mock('../../utils/bookmark-transformer.js');

describe('DataOperations', () => {
  let dataOperations;
  let mockSupabase;
  let mockConfig;
  let mockBookmarkOperations;
  let mockUserOperations;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };

    // Mock config
    mockConfig = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    // Mock bookmark operations
    mockBookmarkOperations = {
      getBookmarks: vi.fn(),
    };

    // Mock user operations
    mockUserOperations = {
      getUserPreferences: vi.fn(),
      saveUserPreferences: vi.fn(),
    };

    // Mock BookmarkTransformer
    BookmarkTransformer.transformMultiple = vi.fn();

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

    dataOperations = new DataOperations(
      mockSupabase,
      mockConfig,
      mockBookmarkOperations,
      mockUserOperations,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportData', () => {
    it('should export all user data successfully', async () => {
      const mockBookmarks = [
        { id: '1', title: 'Bookmark 1' },
        { id: '2', title: 'Bookmark 2' },
      ];
      const mockPreferences = { theme: 'dark', language: 'en' };

      mockBookmarkOperations.getBookmarks.mockResolvedValue(mockBookmarks);
      mockUserOperations.getUserPreferences.mockResolvedValue(mockPreferences);

      const result = await dataOperations.exportData();

      expect(result).toHaveProperty('bookmarks');
      expect(result).toHaveProperty('preferences');
      expect(result).toHaveProperty('exportDate');
      expect(result).toHaveProperty('version');
      expect(result.bookmarks).toEqual(mockBookmarks);
      expect(result.preferences).toEqual(mockPreferences);
      expect(result.version).toBe('1.0.0');
      expect(mockBookmarkOperations.getBookmarks).toHaveBeenCalledWith({ limit: 10000 });
      expect(mockUserOperations.getUserPreferences).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(dataOperations.exportData()).rejects.toThrow('User not authenticated');
    });

    it('should handle errors during export', async () => {
      const mockError = new Error('Export failed');
      mockBookmarkOperations.getBookmarks.mockRejectedValue(mockError);

      await expect(dataOperations.exportData()).rejects.toThrow('Export failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('importData', () => {
    it('should import bookmarks and preferences successfully', async () => {
      const importData = {
        bookmarks: [{ url: 'https://example.com', title: 'Test', status: 'read' }],
        preferences: { theme: 'dark' },
      };

      const transformedBookmarks = [
        {
          user_id: 'test-user-id',
          url: 'https://example.com',
          title: 'Test',
          read_status: 'read',
        },
      ];

      BookmarkTransformer.transformMultiple.mockReturnValue(transformedBookmarks);

      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: transformedBookmarks,
          error: null,
        }),
      };
      mockSupabase.insert.mockReturnValue(mockInsertChain);
      mockUserOperations.saveUserPreferences.mockResolvedValue({});

      const result = await dataOperations.importData(importData);

      expect(result).toBe(true);
      expect(BookmarkTransformer.transformMultiple).toHaveBeenCalledWith(
        importData.bookmarks,
        'test-user-id',
        { preserveTimestamps: true, setDefaults: false },
      );
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockUserOperations.saveUserPreferences).toHaveBeenCalledWith(importData.preferences);
    });

    it('should import only bookmarks when preferences are not provided', async () => {
      const importData = {
        bookmarks: [{ url: 'https://example.com', title: 'Test', status: 'read' }],
      };

      const transformedBookmarks = [
        {
          user_id: 'test-user-id',
          url: 'https://example.com',
          title: 'Test',
          read_status: 'read',
        },
      ];

      BookmarkTransformer.transformMultiple.mockReturnValue(transformedBookmarks);

      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: transformedBookmarks,
          error: null,
        }),
      };
      mockSupabase.insert.mockReturnValue(mockInsertChain);

      const result = await dataOperations.importData(importData);

      expect(result).toBe(true);
      expect(mockUserOperations.saveUserPreferences).not.toHaveBeenCalled();
    });

    it('should import only preferences when bookmarks are not provided', async () => {
      const importData = {
        preferences: { theme: 'dark' },
      };

      mockUserOperations.saveUserPreferences.mockResolvedValue({});

      const result = await dataOperations.importData(importData);

      expect(result).toBe(true);
      expect(mockSupabase.insert).not.toHaveBeenCalled();
      expect(mockUserOperations.saveUserPreferences).toHaveBeenCalledWith(importData.preferences);
    });

    it('should handle empty bookmarks array', async () => {
      const importData = {
        bookmarks: [],
        preferences: { theme: 'dark' },
      };

      mockUserOperations.saveUserPreferences.mockResolvedValue({});

      const result = await dataOperations.importData(importData);

      expect(result).toBe(true);
      expect(mockSupabase.insert).not.toHaveBeenCalled();
      expect(mockUserOperations.saveUserPreferences).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      const importData = {
        bookmarks: [{ url: 'https://example.com', title: 'Test' }],
      };

      await expect(dataOperations.importData(importData)).rejects.toThrow('User not authenticated');
    });

    it('should handle errors during bookmark import', async () => {
      const importData = {
        bookmarks: [{ url: 'https://example.com', title: 'Test', status: 'read' }],
      };

      const transformedBookmarks = [
        {
          user_id: 'test-user-id',
          url: 'https://example.com',
          title: 'Test',
          read_status: 'read',
        },
      ];

      BookmarkTransformer.transformMultiple.mockReturnValue(transformedBookmarks);

      const mockError = new Error('Import failed');
      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };
      mockSupabase.insert.mockReturnValue(mockInsertChain);

      await expect(dataOperations.importData(importData)).rejects.toThrow('Import failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should handle errors during preferences import', async () => {
      const importData = {
        preferences: { theme: 'dark' },
      };

      const mockError = new Error('Preferences import failed');
      mockUserOperations.saveUserPreferences.mockRejectedValue(mockError);

      await expect(dataOperations.importData(importData)).rejects.toThrow(
        'Preferences import failed',
      );
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });
});
