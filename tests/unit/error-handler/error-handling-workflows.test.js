import { describe, test, expect, beforeEach, vi } from 'vitest';
import ErrorHandler from '../../../utils/error-handler/index.js';

describe('Error Handling Workflows', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    container.id = 'error-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('User-Facing Error Scenarios', () => {
    test('should handle network failure during bookmark save', () => {
      // Simulate real network error
      const networkError = new Error('Failed to fetch');
      networkError.name = 'TypeError';

      const result = ErrorHandler.handle(networkError, 'bookmark.save');

      // Test user experience - what they see and can do
      expect(result.userMessage).toContain('connection');
      expect(result.shouldRetry).toBe(true);
      expect(result.shouldShowToUser).toBe(true);
    });

    test('should provide helpful message for authentication failures', () => {
      const authError = new Error('JWT token expired');

      const result = ErrorHandler.handle(authError, 'auth.verify');

      // Test that users get actionable guidance
      expect(result.userMessage).toContain('sign in');
      expect(result.shouldShowToUser).toBe(true);
      expect(result.errorInfo.type).toBe('AUTH');
    });

    test('should validate user input with clear feedback', () => {
      const validationError = new Error('Invalid URL format');

      const result = ErrorHandler.handle(validationError, 'config.validate');

      // Test validation provides clear next steps
      expect(result.userMessage).toContain('URL');
      expect(result.shouldRetry).toBe(false); // User needs to fix input
      expect(result.shouldShowToUser).toBe(true);
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should support retry mechanism for recoverable errors', async () => {
      let attempts = 0;
      const retryableOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary network error');
        }
        return 'success';
      };

      // Test retry functionality
      try {
        await ErrorHandler.handleAsync(retryableOperation, 'test.operation');
      } catch (error) {
        const result = ErrorHandler.handle(error, 'test.operation');

        if (result.shouldRetry) {
          // Simulate retry
          const retryResult = await retryableOperation();
          expect(retryResult).toBe('success');
        }
      }

      expect(attempts).toBeGreaterThan(1);
    });

    test('should prevent infinite retries for persistent failures', () => {
      const persistentError = new Error('Configuration missing');

      const result = ErrorHandler.handle(persistentError, 'config.load');

      // Test that configuration errors don't suggest retry
      expect(result.shouldRetry).toBe(false);
      expect(result.userMessage).toContain('configuration');
    });
  });

  describe('Error Display Integration', () => {
    test('should display errors in UI container', () => {
      const error = new Error('Test error message');
      const result = ErrorHandler.handle(error, 'test.context');

      if (result.shouldShowToUser) {
        // Test actual UI integration
        ErrorHandler.showMessage(result.userMessage, 'error', container);

        const errorElement = container.querySelector('[role="alert"]');
        expect(errorElement).toBeTruthy();
        expect(errorElement.textContent).toContain(result.userMessage);
      }
    });

    test('should handle missing container gracefully', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error, 'test.context');

      // Test graceful degradation
      expect(() => {
        ErrorHandler.showMessage(result.userMessage, 'error', null);
      }).not.toThrow();
    });
  });

  describe('Real Extension Error Scenarios', () => {
    test('should handle Chrome API permission errors', () => {
      const permissionError = new Error('Cannot access chrome.storage');
      permissionError.name = 'Error';

      const result = ErrorHandler.handle(permissionError, 'chrome.storage');

      // Test Chrome extension specific error handling
      expect(result.userMessage).toBeDefined();
      expect(result.errorInfo.type).toBe('CONFIG');
    });

    test('should handle Supabase connection failures', () => {
      const supabaseError = new Error('Failed to connect to Supabase');
      supabaseError.status = 503;

      const result = ErrorHandler.handle(supabaseError, 'supabase.connect');

      // Test backend service error handling
      expect(result.shouldRetry).toBe(true);
      expect(result.userMessage).toContain('connection');
    });

    test('should handle malformed bookmark data', () => {
      const dataError = new Error('Invalid bookmark format');

      const result = ErrorHandler.handle(dataError, 'bookmark.validate');

      // Test data validation error handling
      expect(result.errorInfo.type).toBe('VALIDATION');
      expect(result.shouldShowToUser).toBe(true);
      expect(result.userMessage).toContain('bookmark');
    });
  });

  describe('Error Categorization Accuracy', () => {
    test('should correctly identify network errors', () => {
      const networkErrors = [
        new Error('fetch failed'),
        new Error('Network timeout'),
        new Error('Connection refused'),
      ];

      networkErrors.forEach(error => {
        const result = ErrorHandler.handle(error, 'network.test');
        expect(result.errorInfo.type).toBe('NETWORK');
      });
    });

    test('should correctly identify authentication errors', () => {
      const authErrors = [
        new Error('Unauthorized'),
        new Error('Invalid token'),
        new Error('Authentication failed'),
      ];

      authErrors.forEach(error => {
        const result = ErrorHandler.handle(error, 'auth.test');
        expect(result.errorInfo.type).toBe('AUTH');
      });
    });
  });

  describe('Error Context Preservation', () => {
    test('should preserve original error details for debugging', () => {
      const originalError = new Error('Original message');
      originalError.stack = 'Error stack trace...';
      originalError.code = 'CUSTOM_CODE';

      const result = ErrorHandler.handle(originalError, 'test.context');

      // Test that debugging information is preserved
      expect(result.errorInfo.originalError).toBe(originalError);
      expect(result.errorInfo.context).toBe('test.context');
      expect(result.errorInfo.message).toBe('Original message');
    });

    test('should add timestamp for error tracking', () => {
      const error = new Error('Test error');
      const beforeTime = Date.now();

      const result = ErrorHandler.handle(error, 'test.context');

      const afterTime = Date.now();

      // Test error tracking capabilities
      expect(result.errorInfo.timestamp).toBeDefined();
      const errorTime = new Date(result.errorInfo.timestamp).getTime();
      expect(errorTime).toBeGreaterThanOrEqual(beforeTime);
      expect(errorTime).toBeLessThanOrEqual(afterTime);
    });
  });
});
