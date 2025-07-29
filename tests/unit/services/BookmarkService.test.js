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

      // Mock the saveToDatabase method instead of mocking Supabase client
      vi.spyOn(bookmarkService, 'saveToDatabase').mockResolvedValue(mockCreatedBookmark);
      vi.spyOn(bookmarkService, 'updateCache').mockResolvedValue();
      vi.spyOn(bookmarkService, 'generateId').mockReturnValue('bookmark-123');

      const result = await bookmarkService.createBookmark(bookmarkData);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockValidationService.validateBookmark).toHaveBeenCalledWith(bookmarkData, ['read', 'unread']);
      expect(bookmarkService.updateCache).toHaveBeenCalled();
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

      // Mock storage service to return null (no cache)
      mockStorageService.getBookmarkCache.mockReturnValue(null);
      
      // Mock searchBookmarks method
      vi.spyOn(bookmarkService, 'searchBookmarks').mockResolvedValue({
        items: mockBookmarks,
        total: 2,
        page: 1,
        pageSize: 20,
        hasMore: false
      });

      const result = await bookmarkService.getBookmarks();

      expect(result.items).toEqual(mockBookmarks);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should use cached bookmarks when available', async () => {
      const cachedBookmarks = [
        { id: '1', url: 'https://cached.com', title: 'Cached' }
      ];

      mockStorageService.getBookmarkCache.mockReturnValue(cachedBookmarks);

      const result = await bookmarkService.getBookmarks();

      expect(result.bookmarks).toEqual(cachedBookmarks);
      expect(mockStorageService.getBookmarkCache).toHaveBeenCalledWith();
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
      const existingBookmark = {
        id: bookmarkId,
        title: 'Original Title',
        url: 'https://example.com',
        user_id: 'user-123'
      };
      const mockUpdatedBookmark = {
        ...existingBookmark,
        ...updateData,
        updated_at: expect.any(String)
      };

      // Mock methods
      vi.spyOn(bookmarkService, 'getBookmarkById').mockResolvedValue(existingBookmark);
      vi.spyOn(bookmarkService, 'saveToDatabase').mockResolvedValue(mockUpdatedBookmark);
      vi.spyOn(bookmarkService, 'updateCache').mockResolvedValue();

      const result = await bookmarkService.updateBookmark(bookmarkId, updateData);

      expect(result).toEqual(mockUpdatedBookmark);
      expect(bookmarkService.updateCache).toHaveBeenCalled();
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

      // Mock global fetch for delete operation
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });

      // Mock updateCache method
      vi.spyOn(bookmarkService, 'updateCache').mockResolvedValue();

      await bookmarkService.deleteBookmark(bookmarkId);

      expect(bookmarkService.updateCache).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('searchBookmarks', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should search bookmarks successfully', async () => {
      const searchOptions = { searchTerm: 'test' };
      const mockResults = [
        { id: '1', title: 'Test Result', url: 'https://test.com' }
      ];

      // Mock validation service
      mockValidationService.validateSearchOptions = vi.fn().mockReturnValue({
        isValid: true,
        data: searchOptions
      });

      // Mock global fetch and helper methods
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResults)
      });

      vi.spyOn(bookmarkService, 'buildSearchQuery').mockReturnValue('select=*&user_id=eq.user-123');
      vi.spyOn(bookmarkService, 'getTotalCount').mockResolvedValue(1);

      const result = await bookmarkService.searchBookmarks(searchOptions);

      expect(result.items).toEqual(mockResults);
      expect(result.total).toBe(1);
    });
  });

  describe('getBookmarkStats', () => {
    beforeEach(async () => {
      await bookmarkService.initialize();
    });

    it('should get bookmark statistics', async () => {
      const mockBookmarks = [
        { status: 'read', tags: ['tag1'], created_at: new Date().toISOString() },
        { status: 'read', tags: ['tag2'], created_at: new Date().toISOString() },
        { status: 'read', tags: ['tag1'], created_at: new Date().toISOString() },
        { status: 'read', tags: [], created_at: new Date().toISOString() },
        { status: 'read', tags: ['tag2'], created_at: new Date().toISOString() },
        { status: 'unread', tags: ['tag1'], created_at: new Date().toISOString() },
        { status: 'unread', tags: [], created_at: new Date().toISOString() },
        { status: 'unread', tags: ['tag3'], created_at: new Date().toISOString() }
      ];

      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBookmarks)
      });

      const result = await bookmarkService.getBookmarkStats();

      expect(result.total).toBe(8);
      expect(result.byStatus.read).toBe(5);
      expect(result.byStatus.unread).toBe(3);
      expect(result.byTag.tag1).toBe(3);
      expect(result.byTag.tag2).toBe(2);
      expect(result.byTag.tag3).toBe(1);
    });
  });
});