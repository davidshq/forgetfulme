/**
 * @fileoverview Unit tests for BookmarkService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookmarkService } from '../../../src/services/BookmarkService.js';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null })
    }))
  }))
}));

describe('BookmarkService', () => {
  let bookmarkService;
  let mockAuthService;
  let mockStorageService;
  let mockConfigService;
  let mockValidationService;
  let mockErrorService;

  beforeEach(() => {
    // Mock AuthService
    mockAuthService = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 'user-123' }),
      isAuthenticated: vi.fn().mockReturnValue(true)
    };

    // Mock StorageService
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      getBookmarkCache: vi.fn(),
      setBookmarkCache: vi.fn(),
      clearBookmarkCache: vi.fn()
    };

    // Mock ConfigService
    mockConfigService = {
      getSupabaseConfig: vi.fn().mockResolvedValue({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-key'
      }),
      getStatusTypes: vi.fn().mockResolvedValue([
        { id: 'read', name: 'Read' },
        { id: 'unread', name: 'Unread' }
      ])
    };

    // Mock ValidationService
    mockValidationService = {
      validateBookmark: vi.fn(),
      validateUrl: vi.fn().mockReturnValue(true),
      validateStatusType: vi.fn().mockReturnValue(true)
    };

    // Mock ErrorService
    mockErrorService = {
      handle: vi.fn().mockReturnValue({
        message: 'Mock error message',
        category: 'DATABASE',
        severity: 'HIGH'
      })
    };

    bookmarkService = new BookmarkService(
      mockAuthService,
      mockStorageService,
      mockConfigService,
      mockValidationService,
      mockErrorService
    );
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(bookmarkService.authService).toBe(mockAuthService);
      expect(bookmarkService.storageService).toBe(mockStorageService);
      expect(bookmarkService.configService).toBe(mockConfigService);
      expect(bookmarkService.validationService).toBe(mockValidationService);
      expect(bookmarkService.errorService).toBe(mockErrorService);
      expect(bookmarkService.supabaseClient).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with Supabase client', async () => {
      await bookmarkService.initialize();

      expect(mockConfigService.getSupabaseConfig).toHaveBeenCalled();
      expect(bookmarkService.supabaseClient).toBeTruthy();
    });

    it('should throw error when config not found', async () => {
      mockConfigService.getSupabaseConfig.mockResolvedValue(null);

      await expect(bookmarkService.initialize()).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalled();
    });
  });

  describe('createBookmark', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
      mockValidationService.validateBookmark.mockReturnValue({ isValid: true });
    });

    it('should create bookmark successfully', async () => {
      const bookmarkData = {
        url: 'https://example.com',
        title: 'Test Title',
        status: 'read'
      };

      const mockCreatedBookmark = {
        id: 'bookmark-123',
        ...bookmarkData,
        user_id: 'user-123',
        created_at: new Date().toISOString()
      };

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCreatedBookmark,
                error: null
              })
            })
          })
        })
      };

      const result = await bookmarkService.createBookmark(bookmarkData);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockValidationService.validateBookmark).toHaveBeenCalledWith(bookmarkData);
      expect(mockStorageService.clearBookmarkCache).toHaveBeenCalledWith('user-123');
    });

    it('should handle validation error', async () => {
      const bookmarkData = { url: 'invalid-url' };
      mockValidationService.validateBookmark.mockReturnValue({
        isValid: false,
        errors: ['Invalid URL format']
      });

      await expect(bookmarkService.createBookmark(bookmarkData)).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkService.createBookmark({})).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalled();
    });
  });

  describe('getBookmarks', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should get bookmarks successfully', async () => {
      const mockBookmarks = [
        { id: '1', url: 'https://example1.com', title: 'Test 1' },
        { id: '2', url: 'https://example2.com', title: 'Test 2' }
      ];

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockBookmarks,
                  error: null
                })
              })
            })
          })
        })
      };

      const result = await bookmarkService.getBookmarks();

      expect(result.bookmarks).toEqual(mockBookmarks);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should use cached bookmarks when available', async () => {
      const cachedBookmarks = [
        { id: '1', url: 'https://cached.com', title: 'Cached' }
      ];

      mockStorageService.getBookmarkCache.mockResolvedValue(cachedBookmarks);

      const result = await bookmarkService.getBookmarks();

      expect(result.bookmarks).toEqual(cachedBookmarks);
      expect(mockStorageService.getBookmarkCache).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateBookmark', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
      mockValidationService.validateBookmark.mockReturnValue({ isValid: true });
    });

    it('should update bookmark successfully', async () => {
      const bookmarkId = 'bookmark-123';
      const updateData = { title: 'Updated Title' };
      const mockUpdatedBookmark = {
        id: bookmarkId,
        ...updateData,
        user_id: 'user-123'
      };

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUpdatedBookmark,
                  error: null
                })
              })
            })
          })
        })
      };

      const result = await bookmarkService.updateBookmark(bookmarkId, updateData);

      expect(result).toEqual(mockUpdatedBookmark);
      expect(mockStorageService.clearBookmarkCache).toHaveBeenCalledWith('user-123');
    });

    it('should require authentication', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await expect(bookmarkService.updateBookmark('id', {})).rejects.toThrow('Mock error message');
    });
  });

  describe('deleteBookmark', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should delete bookmark successfully', async () => {
      const bookmarkId = 'bookmark-123';

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })
      };

      await bookmarkService.deleteBookmark(bookmarkId);

      expect(mockStorageService.clearBookmarkCache).toHaveBeenCalledWith('user-123');
    });
  });

  describe('searchBookmarks', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should search bookmarks successfully', async () => {
      const searchTerm = 'test';
      const mockResults = [
        { id: '1', title: 'Test Result', url: 'https://test.com' }
      ];

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockResults,
                    error: null
                  })
                })
              })
            })
          })
        })
      };

      const result = await bookmarkService.searchBookmarks(searchTerm);

      expect(result.bookmarks).toEqual(mockResults);
      expect(result.searchTerm).toBe(searchTerm);
    });
  });

  describe('getBookmarkStats', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should get bookmark statistics', async () => {
      const mockStats = [
        { status: 'read', count: 5 },
        { status: 'unread', count: 3 }
      ];

      bookmarkService.supabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockStats,
              error: null
            })
          })
        })
      };

      const result = await bookmarkService.getBookmarkStats();

      expect(result).toEqual({
        totalBookmarks: 8,
        byStatus: {
          read: 5,
          unread: 3
        }
      });
    });
  });
});