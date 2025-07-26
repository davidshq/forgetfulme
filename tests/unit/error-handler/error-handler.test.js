/**
 * @fileoverview Integration tests for Error Handler Module
 * @module error-handler.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ErrorHandler, {
  ErrorHandler as ErrorHandlerClass,
} from '../../../utils/error-handler/index.js';

describe('ErrorHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ErrorHandlerClass();
  });

  describe('static properties', () => {
    it('should have ERROR_TYPES', () => {
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

    it('should have SEVERITY', () => {
      expect(ErrorHandler.SEVERITY).toEqual({
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with all modules', () => {
      expect(handler.categorizer).toBeDefined();
      expect(handler.logger).toBeDefined();
      expect(handler.messages).toBeDefined();
      expect(handler.retry).toBeDefined();
      expect(handler.display).toBeDefined();
      expect(handler.utils).toBeDefined();
    });

    it('should accept configuration options', () => {
      const customHandler = new ErrorHandlerClass({
        logging: {
          enabled: false,
          level: 'HIGH',
        },
      });
      expect(customHandler.logger.enabled).toBe(false);
      expect(customHandler.logger.level).toBe('HIGH');
    });
  });

  describe('handle', () => {
    it('should handle network errors', () => {
      const error = new Error('Failed to fetch data');
      const result = handler.handle(error, 'api.fetch');

      expect(result.errorInfo.type).toBe('NETWORK');
      expect(result.errorInfo.severity).toBe('MEDIUM');
      expect(result.userMessage).toBe(
        'Connection error. Please check your internet connection and try again.'
      );
      expect(result.shouldRetry).toBe(true);
      expect(result.shouldShowToUser).toBe(false);
    });

    it('should handle auth errors', () => {
      const error = new Error('User not authenticated');
      const result = handler.handle(error, 'auth.login');

      expect(result.errorInfo.type).toBe('AUTH');
      expect(result.errorInfo.severity).toBe('HIGH');
      expect(result.userMessage).toBe('Please sign in to continue.');
      expect(result.shouldRetry).toBe(true);
      expect(result.shouldShowToUser).toBe(true);
    });

    it('should handle validation errors', () => {
      const error = new Error('Both URL and anon key are required');
      const result = handler.handle(error, 'form.submit');

      expect(result.errorInfo.type).toBe('VALIDATION');
      expect(result.errorInfo.severity).toBe('LOW');
      expect(result.userMessage).toBe(
        'Please enter both the Project URL and anon key.'
      );
      expect(result.shouldRetry).toBe(false);
      expect(result.shouldShowToUser).toBe(true);
    });

    it('should handle database errors', () => {
      const error = new Error('Database query failed');
      const result = handler.handle(error, 'db.query');

      expect(result.errorInfo.type).toBe('DATABASE');
      expect(result.errorInfo.severity).toBe('HIGH');
      expect(result.userMessage).toBe(
        'Data error. Please try again or contact support if the problem persists.'
      );
      expect(result.shouldRetry).toBe(true);
      expect(result.shouldShowToUser).toBe(false);
    });

    it('should handle config errors', () => {
      const error = new Error('Supabase client not loaded');
      const result = handler.handle(error, 'config.init');

      expect(result.errorInfo.type).toBe('CONFIG');
      expect(result.errorInfo.severity).toBe('MEDIUM');
      expect(result.userMessage).toBe(
        'Configuration error. Please check your Supabase settings.'
      );
      expect(result.shouldRetry).toBe(false);
      expect(result.shouldShowToUser).toBe(true);
    });

    it('should handle UI errors', () => {
      const error = new Error('DOM element not found');
      const result = handler.handle(error, 'ui.render');

      expect(result.errorInfo.type).toBe('UI');
      expect(result.errorInfo.severity).toBe('MEDIUM');
      expect(result.userMessage).toBe(
        'Interface error. Please refresh the page and try again.'
      );
      expect(result.shouldRetry).toBe(false);
      expect(result.shouldShowToUser).toBe(false);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unexpected error occurred');
      const result = handler.handle(error, 'unknown.context');

      expect(result.errorInfo.type).toBe('UNKNOWN');
      expect(result.errorInfo.severity).toBe('MEDIUM');
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
      expect(result.shouldRetry).toBe(false);
      expect(result.shouldShowToUser).toBe(false);
    });

    it('should respect silent logging option', () => {
      const error = new Error('Test error');
      const spy = vi.spyOn(handler.logger, 'logError');

      handler.handle(error, 'test.context', { silent: true });

      expect(spy).toHaveBeenCalledWith(expect.any(Object), { silent: true });
    });

    it('should respect showTechnical option', () => {
      const error = new Error('Technical error message');
      const result = handler.handle(error, 'test.context', {
        showTechnical: true,
      });

      expect(result.userMessage).toBe('Technical error message');
    });
  });

  describe('createError', () => {
    it('should create standardized error object', () => {
      const error = handler.createError(
        'Test error',
        'VALIDATION',
        'test.context'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('VALIDATION');
      expect(error.context).toBe('test.context');
      expect(error.timestamp).toBeDefined();
    });

    it('should use default values when not provided', () => {
      const error = handler.createError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('UNKNOWN');
      expect(error.context).toBe('unknown');
    });
  });

  describe('handleAsync', () => {
    it('should handle successful async operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await handler.handleAsync(operation, 'test.context');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle async operations that throw errors', async () => {
      const error = new Error('Async operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleAsync(operation, 'test.context')
      ).rejects.toThrow();
    });

    it('should re-throw with user-friendly message for showable errors', async () => {
      const error = new Error('User not authenticated');
      const operation = vi.fn().mockRejectedValue(error);

      try {
        await handler.handleAsync(operation, 'auth.login');
      } catch (thrownError) {
        expect(thrownError.message).toBe('Please sign in to continue.');
        expect(thrownError.type).toBe('AUTH');
        expect(thrownError.context).toBe('auth.login');
      }
    });

    it('should re-throw original error for non-showable errors', async () => {
      const error = new Error('Database query failed');
      const operation = vi.fn().mockRejectedValue(error);

      try {
        await handler.handleAsync(operation, 'db.query');
      } catch (thrownError) {
        expect(thrownError).toBe(error);
      }
    });
  });

  describe('showMessage', () => {
    it('should delegate to display module', () => {
      const spy = vi.spyOn(handler.display, 'showMessage');
      const container = document.createElement('div');

      handler.showMessage('Test message', 'error', container, {
        timeout: 5000,
      });

      expect(spy).toHaveBeenCalledWith('Test message', 'error', container, {
        timeout: 5000,
      });
    });

    it('should handle null container gracefully', () => {
      const spy = vi.spyOn(handler.display, 'showMessage');

      handler.showMessage('Test message', 'error', null);

      expect(spy).toHaveBeenCalledWith('Test message', 'error', null, {});
    });
  });

  describe('validateInput', () => {
    it('should delegate to utils module', () => {
      const result = handler.validateInput('test@example.com', 'email');

      expect(result.isValid).toBe(true);
      expect(result.message).toBeNull();
    });

    it('should validate invalid email', () => {
      const result = handler.validateInput('invalid-email', 'email');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter a valid email address.');
    });
  });

  describe('default instance', () => {
    it('should provide static-like access to error handler', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error, 'test.context');

      expect(result.errorInfo).toBeDefined();
      expect(result.userMessage).toBeDefined();
      expect(result.shouldRetry).toBeDefined();
      expect(result.shouldShowToUser).toBeDefined();
    });

    it('should have static properties', () => {
      expect(ErrorHandler.ERROR_TYPES).toBeDefined();
      expect(ErrorHandler.SEVERITY).toBeDefined();
    });

    it('should support all public methods', () => {
      expect(typeof ErrorHandler.handle).toBe('function');
      expect(typeof ErrorHandler.createError).toBe('function');
      expect(typeof ErrorHandler.handleAsync).toBe('function');
      expect(typeof ErrorHandler.showMessage).toBe('function');
      expect(typeof ErrorHandler.validateInput).toBe('function');
    });
  });
});
