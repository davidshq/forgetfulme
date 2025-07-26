/**
 * @fileoverview Unit tests for modular Supabase service
 * @module supabase-service-modular.test
 * @description Tests the modular Supabase service structure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import SupabaseService from '../../supabase-service/index.js';

// Mock dependencies
vi.mock('../../utils/error-handler.js', () => ({
  default: {
    createError: vi.fn(),
    handle: vi.fn(),
    ERROR_TYPES: {
      AUTH: 'AUTH',
      VALIDATION: 'VALIDATION',
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
    transformMultiple: vi.fn((bookmarks, userId) =>
      bookmarks.map(b => ({ ...b, user_id: userId }))
    ),
  },
}));

describe('SupabaseService Modular Structure', () => {
  let supabaseService;
  let mockConfig;
  let mockSupabaseClient;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock config
    mockConfig = {
      initialize: vi.fn().mockResolvedValue(),
      getSupabaseClient: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    // Create mock Supabase client
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
      upsert: vi.fn().mockReturnThis(),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
      removeChannel: vi.fn(),
    };

    mockConfig.getSupabaseClient.mockReturnValue(mockSupabaseClient);

    // Create service instance
    supabaseService = new SupabaseService(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize all modules correctly', async () => {
      // Mock successful database responses
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi
          .fn()
          .mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
        update: vi
          .fn()
          .mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
        delete: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi
          .fn()
          .mockResolvedValue({ data: [{ id: 'test-user-id' }], error: null }),
      });

      await supabaseService.initialize();

      expect(mockConfig.initialize).toHaveBeenCalled();
      expect(mockConfig.getSupabaseClient).toHaveBeenCalled();
    });

    it('should set up all modules with the Supabase client', async () => {
      await supabaseService.initialize();

      // Verify that all modules have access to the client
      expect(supabaseService.bookmarkOperations.supabase).toBe(
        mockSupabaseClient
      );
      expect(supabaseService.bookmarkQueries.supabase).toBe(mockSupabaseClient);
      expect(supabaseService.bookmarkStats.supabase).toBe(mockSupabaseClient);
      expect(supabaseService.userPreferences.supabase).toBe(mockSupabaseClient);
      expect(supabaseService.realtimeManager.supabase).toBe(mockSupabaseClient);
      expect(supabaseService.importExport.supabase).toBe(mockSupabaseClient);
    });
  });

  describe('Module Delegation', () => {
    beforeEach(async () => {
      await supabaseService.initialize();
    });

    it('should delegate bookmark operations to the bookmark operations module', async () => {
      const mockBookmark = { url: 'https://example.com', title: 'Test' };
      const mockResponse = { id: 'test-id', ...mockBookmark };

      // Mock the bookmark operations module
      supabaseService.bookmarkOperations.saveBookmark = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await supabaseService.saveBookmark(mockBookmark);

      expect(
        supabaseService.bookmarkOperations.saveBookmark
      ).toHaveBeenCalledWith(mockBookmark);
      expect(result).toEqual(mockResponse);
    });

    it('should delegate bookmark queries to the bookmark queries module', async () => {
      const mockOptions = { page: 1, limit: 10 };
      const mockBookmarks = [{ id: '1', title: 'Test' }];

      // Mock the bookmark queries module
      supabaseService.bookmarkQueries.getBookmarks = vi
        .fn()
        .mockResolvedValue(mockBookmarks);

      const result = await supabaseService.getBookmarks(mockOptions);

      expect(supabaseService.bookmarkQueries.getBookmarks).toHaveBeenCalledWith(
        mockOptions
      );
      expect(result).toEqual(mockBookmarks);
    });

    it('should delegate user preferences to the user preferences module', async () => {
      const mockPreferences = { theme: 'dark' };
      const mockResponse = { id: 'test-user-id', preferences: mockPreferences };

      // Mock the user preferences module
      supabaseService.userPreferences.saveUserPreferences = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await supabaseService.saveUserPreferences(mockPreferences);

      expect(
        supabaseService.userPreferences.saveUserPreferences
      ).toHaveBeenCalledWith(mockPreferences);
      expect(result).toEqual(mockResponse);
    });

    it('should delegate real-time subscriptions to the realtime manager', () => {
      const mockCallback = vi.fn();
      const mockSubscription = { id: 'subscription-1' };

      // Mock the realtime manager
      supabaseService.realtimeManager.subscribeToBookmarks = vi
        .fn()
        .mockReturnValue(mockSubscription);

      const result = supabaseService.subscribeToBookmarks(mockCallback);

      expect(
        supabaseService.realtimeManager.subscribeToBookmarks
      ).toHaveBeenCalledWith(mockCallback);
      expect(result).toEqual(mockSubscription);
    });

    it('should delegate import/export to the import export module', async () => {
      const mockExportData = {
        bookmarks: [],
        preferences: {},
        exportDate: '2024-01-01',
      };

      // Mock the import export module
      supabaseService.importExport.exportData = vi
        .fn()
        .mockResolvedValue(mockExportData);

      const result = await supabaseService.exportData();

      expect(supabaseService.importExport.exportData).toHaveBeenCalled();
      expect(result).toEqual(mockExportData);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await supabaseService.initialize();
    });

    it('should delegate authentication checks to the initializer', () => {
      const result = supabaseService.isAuthenticated();

      expect(mockConfig.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delegate user retrieval to the initializer', () => {
      const result = supabaseService.getCurrentUser();

      expect(mockConfig.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual({ id: 'test-user-id' });
    });
  });
});
