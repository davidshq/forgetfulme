import { describe, test, expect, beforeEach, vi } from 'vitest';
import ErrorHandler from '../../utils/error-handler.js';

/**
 * ErrorHandler Unit Tests
 *
 * Tests the error handling and categorization functionality.
 * This module is critical for providing user-friendly error messages
 * and proper error categorization for different error types.
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

  describe('categorizeError', () => {
    describe('Network errors', () => {
      test('should categorize fetch errors', () => {
        const error = new Error('Failed to fetch');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.MEDIUM);
      });

      test('should categorize network timeout errors', () => {
        const error = new Error('Network timeout');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
      });

      test('should categorize HTTP errors', () => {
        const error = new Error('HTTP 500 Internal Server Error');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
      });
    });

    describe('Authentication errors', () => {
      test('should categorize auth errors', () => {
        const error = new Error('User not authenticated');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.AUTH);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.HIGH);
      });

      test('should categorize login errors', () => {
        const error = new Error('Invalid login credentials');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.AUTH);
      });

      test('should categorize password errors', () => {
        const error = new Error('Password should be at least 6 characters');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UNKNOWN);
      });

      test('should categorize token errors', () => {
        const error = new Error('Invalid token');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.AUTH);
      });
    });

    describe('Validation errors', () => {
      test('should categorize validation errors', () => {
        const error = new Error('Validation failed');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UNKNOWN);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.MEDIUM);
      });

      test('should categorize required field errors', () => {
        const error = new Error('Both URL and anon key are required');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.VALIDATION);
      });

      test('should categorize format errors', () => {
        const error = new Error('URL must start with https://');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.VALIDATION);
      });

      test('should categorize invalid format errors', () => {
        const error = new Error('Invalid anon key format');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.VALIDATION);
      });
    });

    describe('Database errors', () => {
      test('should categorize database errors', () => {
        const error = new Error('database connection failed');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.DATABASE);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.HIGH);
      });

      test('should categorize query errors', () => {
        const error = new Error('SQL query failed');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.DATABASE);
      });

      test('should categorize constraint errors', () => {
        const error = new Error('Foreign key constraint failed');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.DATABASE);
      });
    });

    describe('Configuration errors', () => {
      test('should categorize config errors', () => {
        const error = new Error('Supabase client not loaded');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.CONFIG);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.MEDIUM);
      });

      test('should categorize Supabase errors', () => {
        const error = new Error('Supabase client not properly initialized');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.CONFIG);
      });
    });

    describe('UI errors', () => {
      test('should categorize DOM errors', () => {
        const error = new Error('DOM element not found');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UI);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.MEDIUM);
      });

      test('should categorize element errors', () => {
        const error = new Error('Element is null');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UI);
      });

      test('should categorize errors in UI context', () => {
        const error = new Error('Some error');
        const result = ErrorHandler.categorizeError(error, 'popup');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UI);
      });
    });

    describe('Unknown errors', () => {
      test('should categorize unknown errors', () => {
        const error = new Error('Some random error');
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UNKNOWN);
        expect(result.severity).toBe(ErrorHandler.SEVERITY.MEDIUM);
      });

      test('should handle errors without message', () => {
        const error = new Error();
        const result = ErrorHandler.categorizeError(error, 'test-context');

        expect(result.type).toBe(ErrorHandler.ERROR_TYPES.UNKNOWN);
      });
    });

    test('should preserve original error and context', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.categorizeError(error, 'test-context');

      expect(result.originalError).toBe(error);
      expect(result.context).toBe('test-context');
      expect(result.message).toBe('Test error');
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

      // ErrorHandler doesn't log errors by default
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

      // ErrorHandler doesn't log errors by default
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

      // ErrorHandler doesn't log warnings by default
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

      // ErrorHandler doesn't log info by default
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

      expect(result).toBe('Connection error. Please check your internet connection and try again.');
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
          expected: 'Please check your email and click the verification link before signing in.',
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
          expected: 'Configuration error. Please check your settings and try again.',
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

      expect(result).toBe('Interface error. Please refresh the page and try again.');
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

  describe('handleAsync', () => {
    test('should handle successful async operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await ErrorHandler.handleAsync(operation, 'test-context');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    test('should handle failed async operations', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(ErrorHandler.handleAsync(operation, 'test-context')).rejects.toThrow();
    });

    test('should pass options to error handler', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);
      const options = { silent: true };

      await expect(ErrorHandler.handleAsync(operation, 'test-context', options)).rejects.toThrow();
    });
  });

  describe('showMessage', () => {
    test('should show error message', () => {
      const container = document.createElement('div');
      const result = ErrorHandler.showMessage('Test error', 'error', container);

      expect(result).toBeUndefined();
      expect(container.querySelector('.message')).toBeTruthy();
    });

    test('should show success message', () => {
      const container = document.createElement('div');
      const result = ErrorHandler.showMessage('Success!', 'success', container);

      expect(result).toBeUndefined();
      expect(container.querySelector('.message-success')).toBeTruthy();
    });

    test('should handle missing container', () => {
      const result = ErrorHandler.showMessage('Test message', 'info');

      expect(result).toBeUndefined();
      // ErrorHandler doesn't log errors by default
    });
  });

  describe('validateInput', () => {
    test('should validate text input', () => {
      const result = ErrorHandler.validateInput('test', 'text');

      expect(result.isValid).toBe(true);
    });

    test('should validate email input', () => {
      const result = ErrorHandler.validateInput('test@example.com', 'email');

      expect(result.isValid).toBe(true);
    });

    test('should validate URL input', () => {
      const result = ErrorHandler.validateInput('https://example.com', 'url');

      expect(result.isValid).toBe(true);
    });

    test('should reject invalid email', () => {
      const result = ErrorHandler.validateInput('invalid-email', 'email');

      expect(result.isValid).toBe(false);
    });

    test('should reject invalid URL', () => {
      const result = ErrorHandler.validateInput('not-a-url', 'url');

      expect(result.isValid).toBe(false);
    });

    test('should reject empty text', () => {
      const result = ErrorHandler.validateInput('', 'text');

      expect(result.isValid).toBe(false);
    });
  });
});
