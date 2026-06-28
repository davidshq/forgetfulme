import { describe, test, expect, beforeEach, vi } from 'vitest';
import ErrorHandler from '../../utils/error-handler.js';

/**
 * ErrorHandler Unit Tests
 *
 * Tests error handling orchestration (handle, logging, user messages, retry policy).
 * Categorization is covered in error-categorizer.test.js.
 */

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
};

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.console = mockConsole;
  });

  describe('Constants', () => {
    test('should have all expected error types', () => {
      expect(ErrorHandler.ERROR_TYPES).toEqual({
        NETWORK: 'NETWORK',
        AUTH: 'AUTH',
        VALIDATION: 'VALIDATION',
        DATABASE: 'DATABASE',
        CONFIG: 'CONFIG',
        UI: 'UI',
        UNKNOWN: 'UNKNOWN',
      });
    });

    test('should have all expected severity levels', () => {
      expect(ErrorHandler.SEVERITY).toEqual({
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
      });
    });
  });

  describe('handle', () => {
    test('should handle and categorize errors', () => {
      const error = new Error('Network timeout');
      const result = ErrorHandler.handle(error, 'test-context');

      expect(result).toHaveProperty('errorInfo');
      expect(result).toHaveProperty('userMessage');
      expect(result).toHaveProperty('shouldRetry');
      expect(result).toHaveProperty('shouldShowToUser');
      expect(result.errorInfo.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
    });

    test('should log errors appropriately', () => {
      const error = new Error('Test error');
      ErrorHandler.handle(error, 'test-context');

      // ErrorHandler doesn't log warnings by default
    });

    test('should handle errors silently when requested', () => {
      const error = new Error('Test error');
      ErrorHandler.handle(error, 'test-context', { silent: true });

      expect(mockConsole.warn).not.toHaveBeenCalled();
    });
  });

  describe('logError', () => {
    test('should log critical errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        severity: ErrorHandler.SEVERITY.CRITICAL,
        message: 'Critical error',
        context: 'test',
        originalError: new Error('Critical error'),
      };

      ErrorHandler.logError(errorInfo);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[test] Critical error',
        errorInfo.originalError,
      );
    });

    test('should log high severity errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.AUTH,
        severity: ErrorHandler.SEVERITY.HIGH,
        message: 'Auth error',
        context: 'test',
        originalError: new Error('Auth error'),
      };

      ErrorHandler.logError(errorInfo);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[test] Auth error',
        errorInfo.originalError,
      );
    });

    test('should log medium severity errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        severity: ErrorHandler.SEVERITY.MEDIUM,
        message: 'Network error',
        context: 'test',
        originalError: new Error('Network error'),
      };

      ErrorHandler.logError(errorInfo);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[test] Network error',
        errorInfo.originalError,
      );
    });

    test('should log low severity errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.VALIDATION,
        severity: ErrorHandler.SEVERITY.LOW,
        message: 'Validation error',
        context: 'test',
        originalError: new Error('Validation error'),
      };

      ErrorHandler.logError(errorInfo);

      expect(mockConsole.warn).toHaveBeenCalledWith('[test] Validation error');
    });

    test('should not log when silent option is true', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        severity: ErrorHandler.SEVERITY.MEDIUM,
        message: 'Network error',
        context: 'test',
        originalError: new Error('Network error'),
      };

      ErrorHandler.logError(errorInfo, { silent: true });

      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('getUserMessage', () => {
    test('should return technical message when requested', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        message: 'Technical error message',
      };

      const result = ErrorHandler.getUserMessage(errorInfo, {
        showTechnical: true,
      });

      expect(result).toBe('Technical error message');
    });

    test('should return user-friendly network error message', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        message: 'Network timeout',
      };

      const result = ErrorHandler.getUserMessage(errorInfo);

      expect(result).toBe(
        'Connection error. Please check your internet connection and try again.',
      );
    });

    test('should return user-friendly auth error messages', () => {
      const testCases = [
        {
          message: 'Invalid login credentials',
          expected: 'Invalid email or password. Please try again.',
        },
        {
          message: 'User already registered',
          expected: 'An account with this email already exists.',
        },
        {
          message: 'Password should be at least 6 characters',
          expected: 'Password must be at least 6 characters.',
        },
        {
          message: 'Email not confirmed',
          expected:
            'Please check your email and click the verification link before signing in.',
        },
        {
          message: 'User not authenticated',
          expected: 'Please sign in to continue.',
        },
      ];

      testCases.forEach(({ message, expected }) => {
        const errorInfo = {
          type: ErrorHandler.ERROR_TYPES.AUTH,
          message,
        };

        const result = ErrorHandler.getUserMessage(errorInfo);

        expect(result).toBe(expected);
      });
    });

    test('should return user-friendly validation error messages', () => {
      const testCases = [
        {
          message: 'Both URL and anon key are required',
          expected: 'Please enter both the Project URL and anon key.',
        },
        {
          message: 'URL must start with https://',
          expected: 'Project URL must start with https://',
        },
        {
          message: 'Invalid anon key format',
          expected: 'Please check your anon key format.',
        },
        {
          message: 'Please fill in all fields',
          expected: 'Please fill in all required fields.',
        },
      ];

      testCases.forEach(({ message, expected }) => {
        const errorInfo = {
          type: ErrorHandler.ERROR_TYPES.VALIDATION,
          message,
        };

        const result = ErrorHandler.getUserMessage(errorInfo);

        expect(result).toBe(expected);
      });
    });

    test('should return default auth error message for unknown auth errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.AUTH,
        message: 'Unknown auth error',
      };

      const result = ErrorHandler.getUserMessage(errorInfo);

      expect(result).toBe('Authentication error. Please try signing in again.');
    });

    test('should return user-friendly database error message', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.DATABASE,
        message: 'Database connection failed',
      };

      const result = ErrorHandler.getUserMessage(errorInfo);

      expect(result).toBe(
        'Data error. Please try again or contact support if the problem persists.',
      );
    });

    test('should return user-friendly config error messages', () => {
      const testCases = [
        {
          message: 'Supabase client not loaded',
          expected: 'Configuration error. Please check your Supabase settings.',
        },
        {
          message: 'Config error',
          expected:
            'Configuration error. Please check your settings and try again.',
        },
      ];

      testCases.forEach(({ message, expected }) => {
        const errorInfo = {
          type: ErrorHandler.ERROR_TYPES.CONFIG,
          message,
        };

        const result = ErrorHandler.getUserMessage(errorInfo);

        expect(result).toBe(expected);
      });
    });

    test('should return user-friendly UI error message', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UI,
        message: 'DOM element not found',
      };

      const result = ErrorHandler.getUserMessage(errorInfo);

      expect(result).toBe(
        'Interface error. Please refresh the page and try again.',
      );
    });

    test('should return user-friendly unknown error message', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UNKNOWN,
        message: 'Some unexpected error',
      };

      const result = ErrorHandler.getUserMessage(errorInfo);

      expect(result).toBe(
        'An unexpected error occurred. Please refresh the page and try again. If the problem persists, contact support.',
      );
    });
  });

  describe('shouldRetry', () => {
    test('should retry network errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(true);
    });

    test('should retry auth errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.AUTH,
        severity: ErrorHandler.SEVERITY.HIGH,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(true);
    });

    test('should not retry validation errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.VALIDATION,
        severity: ErrorHandler.SEVERITY.LOW,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(false);
    });

    test('should retry database errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.DATABASE,
        severity: ErrorHandler.SEVERITY.HIGH,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(true);
    });

    test('should not retry config errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.CONFIG,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(false);
    });

    test('should not retry UI errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UI,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(false);
    });

    test('should not retry unknown errors', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UNKNOWN,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldRetry(errorInfo);

      expect(result).toBe(false);
    });
  });

  describe('shouldShowToUser', () => {
    test('should show auth errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.AUTH,
        severity: ErrorHandler.SEVERITY.HIGH,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(true);
    });

    test('should show validation errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.VALIDATION,
        severity: ErrorHandler.SEVERITY.LOW,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(true);
    });

    test('should show config errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.CONFIG,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(true);
    });

    test('should not show network errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.NETWORK,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(false);
    });

    test('should not show database errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.DATABASE,
        severity: ErrorHandler.SEVERITY.HIGH,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(false);
    });

    test('should not show UI errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UI,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(false);
    });

    test('should not show unknown errors to user', () => {
      const errorInfo = {
        type: ErrorHandler.ERROR_TYPES.UNKNOWN,
        severity: ErrorHandler.SEVERITY.MEDIUM,
      };

      const result = ErrorHandler.shouldShowToUser(errorInfo);

      expect(result).toBe(false);
    });
  });

  describe('createError', () => {
    test('should create error with default type and context', () => {
      const result = ErrorHandler.createError('Test error');

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UNKNOWN);
      expect(result.context).toBe('unknown');
    });

    test('should create error with custom type and context', () => {
      const result = ErrorHandler.createError(
        'Test error',
        ErrorHandler.ERROR_TYPES.NETWORK,
        'test-context',
      );

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
      expect(result.context).toBe('test-context');
    });
  });
});
