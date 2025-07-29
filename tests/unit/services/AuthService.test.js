/**
 * @fileoverview Unit tests for AuthService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/services/AuthService.js';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
      setSession: vi.fn()
    }
  }))
}));

describe('AuthService', () => {
  let authService;
  let mockConfigService;
  let mockStorageService;
  let mockErrorService;

  beforeEach(() => {
    // Mock ConfigService
    mockConfigService = {
      getSupabaseConfig: vi.fn()
    };

    // Mock StorageService
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      getUserSession: vi.fn(),
      setUserSession: vi.fn(),
      clearUserSession: vi.fn(),
      clearBookmarkCache: vi.fn()
    };

    // Mock ErrorService
    mockErrorService = {
      handle: vi.fn().mockReturnValue({
        message: 'Mock error message',
        category: 'AUTH',
        severity: 'HIGH'
      })
    };

    authService = new AuthService(mockConfigService, mockStorageService, mockErrorService);
    
    // Mock private methods to avoid dependency issues
    authService.restoreSession = vi.fn().mockResolvedValue();
    authService.handleAuthSuccess = vi.fn().mockImplementation((session) => {
      // Simulate what the real handleAuthSuccess does
      authService.currentUser = {
        id: session.user.id,
        email: session.user.email,
        access_token: session.access_token
      };
    });
    authService.handleAuthSignOut = vi.fn().mockImplementation(() => {
      authService.currentUser = null;
    });
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(authService.configService).toBe(mockConfigService);
      expect(authService.storageService).toBe(mockStorageService);
      expect(authService.errorService).toBe(mockErrorService);
      expect(authService.currentUser).toBeNull();
      expect(authService.authChangeListeners).toBeInstanceOf(Set);
      expect(authService.supabaseClient).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with valid config', async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      mockConfigService.getSupabaseConfig.mockResolvedValue(mockConfig);
      mockStorageService.get.mockResolvedValue(null);

      await authService.initialize();

      expect(mockConfigService.getSupabaseConfig).toHaveBeenCalled();
      expect(authService.supabaseClient).toBeTruthy();
    });

    it('should throw error when config not found', async () => {
      mockConfigService.getSupabaseConfig.mockResolvedValue(null);

      await expect(authService.initialize()).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    beforeEach(async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      mockConfigService.getSupabaseConfig.mockResolvedValue(mockConfig);
      mockStorageService.get.mockResolvedValue(null);
      await authService.initialize();
    });

    it('should sign in successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123'
      };

      // Mock the auth signInWithPassword method
      authService.supabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      };

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        access_token: 'token-123'
      });
      expect(authService.handleAuthSuccess).toHaveBeenCalledWith(mockSession);
    });

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' };

      authService.supabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { session: null },
            error: mockError
          })
        }
      };

      await expect(authService.signIn('test@example.com', 'wrongpassword')).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalledWith(expect.any(Error), 'AuthService.signIn');
    });
  });

  describe('signUp', () => {
    beforeEach(async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      mockConfigService.getSupabaseConfig.mockResolvedValue(mockConfig);
      mockStorageService.get.mockResolvedValue(null);
      await authService.initialize();
    });

    it('should sign up successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123'
      };

      authService.supabaseClient = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { 
              user: mockSession.user, 
              session: mockSession 
            },
            error: null
          })
        }
      };

      const result = await authService.signUp('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        access_token: 'token-123'
      });
      expect(authService.handleAuthSuccess).toHaveBeenCalledWith(mockSession);
    });

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already exists' };

      authService.supabaseClient = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError
          })
        }
      };

      await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalledWith(expect.any(Error), 'AuthService.signUp');
    });
  });

  describe('signOut', () => {
    beforeEach(async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      mockConfigService.getSupabaseConfig.mockResolvedValue(mockConfig);
      mockStorageService.get.mockResolvedValue(null);
      await authService.initialize();
    });

    it('should sign out successfully', async () => {
      authService.currentUser = { id: 'user-123' };

      authService.supabaseClient = {
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: null
          })
        }
      };

      await authService.signOut();

      expect(authService.handleAuthSignOut).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      authService.currentUser = mockUser;

      const result = authService.getCurrentUser();

      expect(result).toBe(mockUser);
    });

    it('should return null when no user', () => {
      authService.currentUser = null;

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      authService.currentUser = { id: 'user-123' };

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      authService.currentUser = null;

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('addAuthChangeListener', () => {
    it('should add auth change listener', () => {
      const mockCallback = vi.fn();

      const unsubscribe = authService.addAuthChangeListener(mockCallback);

      expect(authService.authChangeListeners.has(mockCallback)).toBe(true);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove auth change listener when unsubscribed', () => {
      const mockCallback = vi.fn();

      const unsubscribe = authService.addAuthChangeListener(mockCallback);
      unsubscribe();

      expect(authService.authChangeListeners.has(mockCallback)).toBe(false);
    });
  });
});