/**
 * @fileoverview Unit tests for ErrorService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorService } from '../../../src/services/ErrorService.js';

describe('ErrorService', () => {
  let errorService;

  beforeEach(() => {
    errorService = new ErrorService();
    // Clear error log between tests
    errorService.errorLog.length = 0;
  });

  describe('handle', () => {
    it('should handle network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const result = errorService.handle(networkError, 'TestContext.networkCall');

      expect(result.category).toBe('NETWORK');
      expect(result.severity).toBe('MEDIUM');
      expect(result.message).toBe('Unable to connect. Please check your internet connection and try again.');
      expect(result.retryable).toBe(true);
      expect(result.actions).toContain('Check internet connection');
    });

    it('should handle authentication errors correctly', () => {
      const authError = new Error('Invalid JWT token');
      const result = errorService.handle(authError, 'AuthService.signIn');

      expect(result.category).toBe('AUTH');
      expect(result.severity).toBe('HIGH');
      expect(result.message).toBe('Authentication failed. Please sign in again.');
      expect(result.retryable).toBe(true);
      expect(result.actions).toContain('Sign out and sign in again');
    });

    it('should handle validation errors correctly', () => {
      const validationError = new Error('Invalid email format');
      const result = errorService.handle(validationError, 'ValidationService.validateEmail');

      expect(result.category).toBe('VALIDATION');
      expect(result.severity).toBe('LOW');
      expect(result.message).toBe('Please check your input and try again.');
      expect(result.retryable).toBe(false);
      expect(result.actions).toContain('Review the form for errors');
    });

    it('should handle database errors correctly', () => {
      const dbError = new Error('Connection timeout');
      const result = errorService.handle(dbError, 'BookmarkService.save');

      expect(result.category).toBe('DATABASE');
      expect(result.severity).toBe('HIGH');
      expect(result.message).toBe('Database error occurred. Please try again.');
      expect(result.retryable).toBe(true);
      expect(result.actions).toContain('Try again in a few moments');
    });

    it('should handle configuration errors correctly', () => {
      const configError = new Error('Missing Supabase URL');
      const result = errorService.handle(configError, 'ConfigService.getSupabaseConfig');

      expect(result.category).toBe('CONFIG');
      expect(result.severity).toBe('CRITICAL');
      expect(result.message).toBe('Configuration error. Please check your settings.');
      expect(result.retryable).toBe(false);
      expect(result.actions).toContain('Go to Options and verify settings');
    });

    it('should handle storage errors correctly', () => {
      const storageError = new Error('Storage quota exceeded');
      const result = errorService.handle(storageError, 'StorageService.set');

      expect(result.category).toBe('STORAGE');
      expect(result.severity).toBe('MEDIUM');
      expect(result.message).toBe('Storage error occurred. Please free up space and try again.');
      expect(result.retryable).toBe(true);
      expect(result.actions).toContain('Clear browser data or cache');
    });

    it('should handle permission errors correctly', () => {
      const permissionError = new Error('Permission denied');
      const result = errorService.handle(permissionError, 'BackgroundService.updateBadge');

      expect(result.category).toBe('PERMISSION');
      expect(result.severity).toBe('HIGH');
      expect(result.message).toBe('Permission denied. Please check extension permissions.');
      expect(result.retryable).toBe(false);
      expect(result.actions).toContain('Check Chrome extension permissions');
    });

    it('should handle unknown errors correctly', () => {
      const unknownError = new Error('Something weird happened');
      const result = errorService.handle(unknownError, 'UnknownService.unknownMethod');

      expect(result.category).toBe('UNKNOWN');
      expect(result.severity).toBe('MEDIUM');
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.retryable).toBe(true);
      expect(result.actions).toContain('Try refreshing the page');
    });

    it('should handle string errors', () => {
      const stringError = 'Something went wrong';
      const result = errorService.handle(stringError, 'TestContext.stringError');

      expect(result.category).toBe('UNKNOWN');
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.code).toBeDefined();
    });

    it('should generate unique error codes', () => {
      const error1 = new Error('Test error');
      const error2 = new Error('Test error');
      
      const result1 = errorService.handle(error1, 'TestContext.method1');
      const result2 = errorService.handle(error2, 'TestContext.method2');

      expect(result1.code).not.toBe(result2.code);
      expect(result1.code).toMatch(/^TES-[A-Z0-9]+-[a-z0-9]+$/);
    });

    it('should log errors', () => {
      const error = new Error('Test error');
      errorService.handle(error, 'TestContext.logTest');

      expect(errorService.errorLog).toHaveLength(1);
      expect(errorService.errorLog[0]).toMatchObject({
        category: expect.any(String),
        severity: expect.any(String),
        message: expect.any(String),
        code: expect.any(String),
        original: {
          message: 'Test error',
          stack: expect.any(String)
        }
      });
    });

    it('should maintain log size limit', () => {
      const maxLogSize = errorService.maxLogSize;
      
      // Add more errors than the limit
      for (let i = 0; i < maxLogSize + 5; i++) {
        errorService.handle(new Error(`Test error ${i}`), 'TestContext.logLimit');
      }

      expect(errorService.errorLog).toHaveLength(maxLogSize);
      // Should keep the most recent errors
      expect(errorService.errorLog[0].original.message).toMatch(/Test error [0-9]+/);
    });
  });

  describe('categorizeError', () => {
    it('should categorize network errors correctly', () => {
      expect(errorService.isNetworkError(new Error('fetch failed'), 'fetch failed')).toBe(true);
      expect(errorService.isNetworkError(new Error('network error'), 'network error')).toBe(true);
      expect(errorService.isNetworkError(new TypeError('fetch'), 'fetch')).toBe(true);
      expect(errorService.isNetworkError(new Error('timeout'), 'timeout')).toBe(true);
    });

    it('should categorize auth errors correctly', () => {
      expect(errorService.isAuthError(new Error('unauthorized'), 'unauthorized')).toBe(true);
      expect(errorService.isAuthError(new Error('Invalid JWT'), 'Invalid JWT')).toBe(true);
      expect(errorService.isAuthError(new Error('403 forbidden'), '403 forbidden')).toBe(true);
      expect(errorService.isAuthError(new Error('auth failed'), 'auth failed')).toBe(true);
    });

    it('should categorize validation errors correctly', () => {
      expect(errorService.isValidationError(new Error('invalid email'), 'invalid email')).toBe(true);
      expect(errorService.isValidationError(new Error('required field'), 'required field')).toBe(true);
      expect(errorService.isValidationError(new Error('validation failed'), 'validation failed')).toBe(true);
    });

    it('should categorize database errors correctly', () => {
      expect(errorService.isDatabaseError(new Error('connection failed'), 'connection failed')).toBe(true);
      expect(errorService.isDatabaseError(new Error('query error'), 'query error')).toBe(true);
      expect(errorService.isDatabaseError(new Error('database timeout'), 'database timeout')).toBe(true);
    });

    it('should categorize config errors correctly', () => {
      expect(errorService.isConfigError(new Error('missing config'), 'missing config')).toBe(true);
      expect(errorService.isConfigError(new Error('invalid URL'), 'invalid URL')).toBe(true);
      expect(errorService.isConfigError(new Error('Supabase config missing'), 'Supabase config missing')).toBe(true);
    });

    it('should categorize storage errors correctly', () => {
      expect(errorService.isStorageError(new Error('quota exceeded'), 'quota exceeded')).toBe(true);
      expect(errorService.isStorageError(new Error('storage error'), 'storage error')).toBe(true);
      expect(errorService.isStorageError(new Error('cache full'), 'cache full')).toBe(true);
    });

    it('should categorize permission errors correctly', () => {
      expect(errorService.isPermissionError(new Error('permission denied'), 'permission denied')).toBe(true);
      expect(errorService.isPermissionError(new Error('access denied'), 'access denied')).toBe(true);
      expect(errorService.isPermissionError(new Error('forbidden'), 'forbidden')).toBe(true);
    });
  });

  describe('generateErrorCode', () => {
    it('should generate codes with correct format', () => {
      const code = errorService.generateErrorCode(new Error('test'), 'TestContext.method');
      expect(code).toMatch(/^TES-[A-Z0-9]+-[a-z0-9]+$/);
    });

    it('should generate different codes for different contexts', () => {
      const error = new Error('same error');
      const code1 = errorService.generateErrorCode(error, 'Context1.method');
      const code2 = errorService.generateErrorCode(error, 'Context2.method');
      
      expect(code1.substring(0, 3)).toBe('CON');
      expect(code2.substring(0, 3)).toBe('CON');
      expect(code1).not.toBe(code2);
    });
  });

  describe('getErrorLog', () => {
    it('should return error log entries', () => {
      errorService.handle(new Error('Test 1'), 'Context1');
      errorService.handle(new Error('Test 2'), 'Context2');

      const log = errorService.getErrorLog();
      expect(log).toHaveLength(2);
      expect(log[0].original.message).toBe('Test 1');
      expect(log[1].original.message).toBe('Test 2');
    });

    it('should return filtered error log entries', () => {
      errorService.handle(new Error('Test 1'), 'Context1');
      errorService.handle(new Error('Auth error'), 'AuthService.signIn');
      errorService.handle(new Error('Test 3'), 'Context3');

      const authLog = errorService.getErrorLog('AUTH');
      expect(authLog).toHaveLength(1);
      expect(authLog[0].category).toBe('AUTH');
    });
  });

  describe('clearErrorLog', () => {
    it('should clear all error log entries', () => {
      errorService.handle(new Error('Test 1'), 'Context1');
      errorService.handle(new Error('Test 2'), 'Context2');

      expect(errorService.getErrorLog()).toHaveLength(2);
      
      errorService.clearErrorLog();
      expect(errorService.getErrorLog()).toHaveLength(0);
    });
  });
});