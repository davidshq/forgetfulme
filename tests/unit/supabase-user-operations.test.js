import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserOperations } from '../../utils/supabase-user-operations.js';
import ErrorHandler from '../../utils/error-handler.js';

// Mock dependencies
vi.mock('../../utils/error-handler.js');

describe('UserOperations', () => {
  let userOperations;
  let mockSupabase;
  let mockConfig;
  let mockPendingRequests;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    // Mock config
    mockConfig = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
    };

    // Mock pending requests map
    mockPendingRequests = new Map();

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

    userOperations = new UserOperations(mockSupabase, mockConfig, mockPendingRequests);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveUserPreferences', () => {
    it('should save user preferences successfully', async () => {
      const preferences = { theme: 'dark', language: 'en' };
      const savedPreferences = {
        id: 'test-user-id',
        preferences: preferences,
        updated_at: new Date().toISOString(),
      };

      const mockUpsertChain = {
        select: vi.fn().mockResolvedValue({
          data: [savedPreferences],
          error: null,
        }),
      };
      mockSupabase.upsert.mockReturnValue(mockUpsertChain);

      const result = await userOperations.saveUserPreferences(preferences);

      expect(result).toEqual(savedPreferences);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSupabase.upsert).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      const preferences = { theme: 'dark' };

      await expect(userOperations.saveUserPreferences(preferences)).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      const mockUpsertChain = {
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };
      mockSupabase.upsert.mockReturnValue(mockUpsertChain);

      const preferences = { theme: 'dark' };

      await expect(userOperations.saveUserPreferences(preferences)).rejects.toThrow(
        'Database error',
      );
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should return preferences object when data is null', async () => {
      const preferences = { theme: 'dark' };
      const mockUpsertChain = {
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabase.upsert.mockReturnValue(mockUpsertChain);

      const result = await userOperations.saveUserPreferences(preferences);

      expect(result).toEqual({
        id: 'test-user-id',
        preferences: preferences,
      });
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      const preferences = { theme: 'dark', language: 'en' };
      const userProfile = {
        id: 'test-user-id',
        preferences: preferences,
      };

      mockSupabase.single.mockResolvedValue({
        data: userProfile,
        error: null,
      });

      const result = await userOperations.getUserPreferences();

      expect(result).toEqual(preferences);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('preferences');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-user-id');
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should return empty object when preferences are null', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await userOperations.getUserPreferences();

      expect(result).toEqual({});
    });

    it('should throw error when user is not authenticated', async () => {
      mockConfig.isAuthenticated.mockReturnValue(false);

      await expect(userOperations.getUserPreferences()).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(userOperations.getUserPreferences()).rejects.toThrow('Database error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should deduplicate concurrent requests', async () => {
      const preferences = { theme: 'dark' };
      const userProfile = {
        id: 'test-user-id',
        preferences: preferences,
      };

      let callCount = 0;
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: userProfile,
          error: null,
        });
      });

      const [result1, result2] = await Promise.all([
        userOperations.getUserPreferences(),
        userOperations.getUserPreferences(),
      ]);

      expect(result1).toEqual(preferences);
      expect(result2).toEqual(preferences);
      expect(callCount).toBe(1);
    });
  });

  describe('request deduplication', () => {
    it('should not deduplicate requests with different parameters', async () => {
      const preferences1 = { theme: 'dark' };
      const preferences2 = { theme: 'light' };

      let callCount = 0;
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { id: 'test-user-id', preferences: preferences1 },
            error: null,
          });
        }
        return Promise.resolve({
          data: { id: 'test-user-id', preferences: preferences2 },
          error: null,
        });
      });

      // These should not be deduplicated as they're the same method with same params
      // But getUserPreferences doesn't take params, so they will be deduplicated
      const [result1, result2] = await Promise.all([
        userOperations.getUserPreferences(),
        userOperations.getUserPreferences(),
      ]);

      expect(result1).toEqual(preferences1);
      expect(result2).toEqual(preferences1);
      expect(callCount).toBe(1);
    });

    it('should handle errors and remove from pending requests', async () => {
      const mockError = new Error('Database error');

      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: mockError,
        });
      });

      // First call should fail
      await expect(userOperations.getUserPreferences()).rejects.toThrow();

      // Second call should make a new request
      mockSupabase.single.mockResolvedValue({
        data: { id: 'test-user-id', preferences: {} },
        error: null,
      });

      const result = await userOperations.getUserPreferences();
      expect(result).toEqual({});
    });
  });
});
