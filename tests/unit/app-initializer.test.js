import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeApp } from '../../utils/app-initializer.js';

/**
 * @fileoverview Unit tests for app-initializer utility
 * @module app-initializer.test
 * @description Tests for application initialization logic
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Mock dependencies
vi.mock('../../utils/retry-utils.js', () => ({
  retryWithBackoff: vi.fn(),
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn(),
  },
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    error: vi.fn(),
  },
}));

import { retryWithBackoff } from '../../utils/retry-utils.js';
import ErrorHandler from '../../utils/error-handler.js';
import UIMessages from '../../utils/ui-messages.js';

describe('app-initializer', () => {
  let mockSupabaseConfig;
  let mockSupabaseService;
  let mockAuthStateManager;
  let mockOnConfigured;
  let mockOnAuthenticated;
  let mockOnUnauthenticated;
  let mockAppContainer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock objects
    mockSupabaseConfig = {
      isConfigured: vi.fn(),
    };

    mockSupabaseService = {
      initialize: vi.fn(),
    };

    mockAuthStateManager = {
      isAuthenticated: vi.fn(),
    };

    mockOnConfigured = vi.fn();
    mockOnAuthenticated = vi.fn();
    mockOnUnauthenticated = vi.fn();
    mockAppContainer = document.createElement('div');

    // Setup default mock behaviors
    retryWithBackoff.mockImplementation(fn => fn());
    ErrorHandler.handle.mockReturnValue({
      errorInfo: {
        type: 'UNKNOWN',
        severity: 'MEDIUM',
        message: 'Test error',
        context: 'test',
        originalError: new Error('Test error'),
      },
      userMessage: 'Test error message',
      shouldRetry: false,
      shouldShowToUser: true,
    });
  });

  describe('initializeApp', () => {
    it('should call onConfigured when Supabase is not configured', async () => {
      mockSupabaseConfig.isConfigured.mockResolvedValue(false);

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(mockSupabaseConfig.isConfigured).toHaveBeenCalled();
      expect(mockOnConfigured).toHaveBeenCalled();
      expect(mockSupabaseService.initialize).not.toHaveBeenCalled();
      expect(mockOnAuthenticated).not.toHaveBeenCalled();
      expect(mockOnUnauthenticated).not.toHaveBeenCalled();
    });

    it('should initialize Supabase and call onAuthenticated when user is authenticated', async () => {
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockResolvedValue();
      mockAuthStateManager.isAuthenticated.mockResolvedValue(true);

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(mockSupabaseConfig.isConfigured).toHaveBeenCalled();
      expect(retryWithBackoff).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSupabaseService.initialize).toHaveBeenCalled();
      expect(mockAuthStateManager.isAuthenticated).toHaveBeenCalled();
      expect(mockOnAuthenticated).toHaveBeenCalled();
      expect(mockOnUnauthenticated).not.toHaveBeenCalled();
      expect(mockOnConfigured).not.toHaveBeenCalled();
    });

    it('should initialize Supabase and call onUnauthenticated when user is not authenticated', async () => {
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockResolvedValue();
      mockAuthStateManager.isAuthenticated.mockResolvedValue(false);

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(mockSupabaseConfig.isConfigured).toHaveBeenCalled();
      expect(retryWithBackoff).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSupabaseService.initialize).toHaveBeenCalled();
      expect(mockAuthStateManager.isAuthenticated).toHaveBeenCalled();
      expect(mockOnUnauthenticated).toHaveBeenCalled();
      expect(mockOnAuthenticated).not.toHaveBeenCalled();
      expect(mockOnConfigured).not.toHaveBeenCalled();
    });

    it('should use retryWithBackoff for Supabase initialization', async () => {
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockResolvedValue();
      mockAuthStateManager.isAuthenticated.mockResolvedValue(true);

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(retryWithBackoff).toHaveBeenCalledWith(expect.any(Function));
      const retryFunction = retryWithBackoff.mock.calls[0][0];
      await retryFunction();
      expect(mockSupabaseService.initialize).toHaveBeenCalled();
    });

    it('should handle errors and show error message when shouldShowToUser is true', async () => {
      const testError = new Error('Initialization failed');
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockRejectedValue(testError);

      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'NETWORK',
          severity: 'MEDIUM',
          message: 'Initialization failed',
          context: 'test.initializeApp',
          originalError: testError,
        },
        userMessage: 'Failed to initialize',
        shouldRetry: false,
        shouldShowToUser: true,
      });

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(ErrorHandler.handle).toHaveBeenCalledWith(testError, 'test.initializeApp');
      expect(UIMessages.error).toHaveBeenCalledWith('Failed to initialize', mockAppContainer);
      expect(mockOnConfigured).toHaveBeenCalled();
    });

    it('should handle errors without showing message when shouldShowToUser is false', async () => {
      const testError = new Error('Initialization failed');
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockRejectedValue(testError);

      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'NETWORK',
          severity: 'LOW',
          message: 'Initialization failed',
          context: 'test.initializeApp',
          originalError: testError,
        },
        userMessage: 'Failed to initialize',
        shouldRetry: false,
        shouldShowToUser: false,
      });

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(ErrorHandler.handle).toHaveBeenCalledWith(testError, 'test.initializeApp');
      expect(UIMessages.error).not.toHaveBeenCalled();
      expect(mockOnConfigured).toHaveBeenCalled();
    });

    it('should handle errors when appContainer is not provided', async () => {
      const testError = new Error('Initialization failed');
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockRejectedValue(testError);

      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'NETWORK',
          severity: 'MEDIUM',
          message: 'Initialization failed',
          context: 'test.initializeApp',
          originalError: testError,
        },
        userMessage: 'Failed to initialize',
        shouldRetry: false,
        shouldShowToUser: true,
      });

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: null,
        context: 'test.initializeApp',
      });

      expect(ErrorHandler.handle).toHaveBeenCalledWith(testError, 'test.initializeApp');
      expect(UIMessages.error).not.toHaveBeenCalled();
      expect(mockOnConfigured).toHaveBeenCalled();
    });

    it('should use default context when not provided', async () => {
      mockSupabaseConfig.isConfigured.mockResolvedValue(false);

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
      });

      expect(mockSupabaseConfig.isConfigured).toHaveBeenCalled();
      expect(mockOnConfigured).toHaveBeenCalled();
    });

    it('should handle errors during isConfigured check', async () => {
      const testError = new Error('Config check failed');
      mockSupabaseConfig.isConfigured.mockRejectedValue(testError);

      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'CONFIG',
          severity: 'MEDIUM',
          message: 'Config check failed',
          context: 'test.initializeApp',
          originalError: testError,
        },
        userMessage: 'Configuration check failed',
        shouldRetry: false,
        shouldShowToUser: true,
      });

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(ErrorHandler.handle).toHaveBeenCalledWith(testError, 'test.initializeApp');
      expect(mockOnConfigured).toHaveBeenCalled();
    });

    it('should handle errors during authentication check', async () => {
      const testError = new Error('Auth check failed');
      mockSupabaseConfig.isConfigured.mockResolvedValue(true);
      mockSupabaseService.initialize.mockResolvedValue();
      mockAuthStateManager.isAuthenticated.mockRejectedValue(testError);

      ErrorHandler.handle.mockReturnValue({
        errorInfo: {
          type: 'AUTH',
          severity: 'MEDIUM',
          message: 'Auth check failed',
          context: 'test.initializeApp',
          originalError: testError,
        },
        userMessage: 'Authentication check failed',
        shouldRetry: false,
        shouldShowToUser: true,
      });

      await initializeApp({
        supabaseConfig: mockSupabaseConfig,
        supabaseService: mockSupabaseService,
        authStateManager: mockAuthStateManager,
        onConfigured: mockOnConfigured,
        onAuthenticated: mockOnAuthenticated,
        onUnauthenticated: mockOnUnauthenticated,
        appContainer: mockAppContainer,
        context: 'test.initializeApp',
      });

      expect(ErrorHandler.handle).toHaveBeenCalledWith(testError, 'test.initializeApp');
      expect(mockOnConfigured).toHaveBeenCalled();
    });
  });
});
