/**
 * @fileoverview Unit tests for Error Utils Module
 * @module error-utils.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorUtils } from '../../../utils/error-handler/utils/error-utils.js';

describe('ErrorUtils', () => {
  let utils;

  beforeEach(() => {
    utils = new ErrorUtils();
  });

  describe('constructor', () => {
    it('should initialize with validation patterns', () => {
      expect(utils.validationPatterns).toHaveProperty('email');
      expect(utils.validationPatterns).toHaveProperty('url');
      expect(utils.validationPatterns).toHaveProperty('password');
    });

    it('should initialize with error types', () => {
      expect(utils.errorTypes).toEqual({
        NETWORK: 'NETWORK',
        AUTH: 'AUTH',
        VALIDATION: 'VALIDATION',
        DATABASE: 'DATABASE',
        CONFIG: 'CONFIG',
        UI: 'UI',
        UNKNOWN: 'UNKNOWN',
      });
    });
  });

  describe('createError', () => {
    it('should create standardized error object', () => {
      const error = utils.createError(
        'Test error',
        'VALIDATION',
        'test.context'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('VALIDATION');
      expect(error.context).toBe('test.context');
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });

    it('should use default values when not provided', () => {
      const error = utils.createError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('UNKNOWN');
      expect(error.context).toBe('unknown');
      expect(error.timestamp).toBeDefined();
    });

    it('should use provided error type', () => {
      const error = utils.createError('Test error', 'NETWORK', 'api.fetch');
      expect(error.type).toBe('NETWORK');
      expect(error.context).toBe('api.fetch');
    });
  });

  describe('validateInput', () => {
    describe('email validation', () => {
      it('should validate correct email format', () => {
        const result = utils.validateInput('test@example.com', 'email');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should reject invalid email format', () => {
        const result = utils.validateInput('invalid-email', 'email');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid email address.');
      });

      it('should reject empty email', () => {
        const result = utils.validateInput('', 'email');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid email address.');
      });

      it('should trim whitespace', () => {
        const result = utils.validateInput('  test@example.com  ', 'email');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });
    });

    describe('url validation', () => {
      it('should validate correct URL format', () => {
        const result = utils.validateInput('https://example.com', 'url');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should validate HTTP URL', () => {
        const result = utils.validateInput('http://example.com', 'url');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should reject invalid URL format', () => {
        const result = utils.validateInput('not-a-url', 'url');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid URL.');
      });

      it('should reject empty URL', () => {
        const result = utils.validateInput('', 'url');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid URL.');
      });

      it('should trim whitespace', () => {
        const result = utils.validateInput('  https://example.com  ', 'url');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });
    });

    describe('password validation', () => {
      it('should validate password with 6+ characters', () => {
        const result = utils.validateInput('password123', 'password');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should reject password with less than 6 characters', () => {
        const result = utils.validateInput('12345', 'password');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Password must be at least 6 characters.');
      });

      it('should reject empty password', () => {
        const result = utils.validateInput('', 'password');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Password must be at least 6 characters.');
      });

      it('should trim whitespace', () => {
        const result = utils.validateInput('  password123  ', 'password');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });
    });

    describe('text validation', () => {
      it('should validate non-empty text', () => {
        const result = utils.validateInput('Some text', 'text');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should reject empty text', () => {
        const result = utils.validateInput('', 'text');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('This field is required.');
      });

      it('should reject whitespace-only text', () => {
        const result = utils.validateInput('   ', 'text');
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('This field is required.');
      });

      it('should trim whitespace', () => {
        const result = utils.validateInput('  Some text  ', 'text');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });
    });

    describe('default validation', () => {
      it('should use text validation for unknown types', () => {
        const result = utils.validateInput('Some text', 'unknown_type');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      it('should use text validation when no type provided', () => {
        const result = utils.validateInput('Some text');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      const error = new Error('Test error');
      expect(utils.isError(error)).toBe(true);
    });

    it('should return false for non-Error objects', () => {
      expect(utils.isError('string')).toBe(false);
      expect(utils.isError(123)).toBe(false);
      expect(utils.isError({})).toBe(false);
      expect(utils.isError(null)).toBe(false);
      expect(utils.isError(undefined)).toBe(false);
    });
  });

  describe('extractErrorInfo', () => {
    it('should extract info from Error instance', () => {
      const error = new Error('Test error');
      error.type = 'VALIDATION';
      error.context = 'test.context';
      error.timestamp = '2024-01-01T00:00:00.000Z';

      const result = utils.extractErrorInfo(error);

      expect(result).toEqual({
        message: 'Test error',
        stack: error.stack,
        type: 'VALIDATION',
        context: 'test.context',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle Error without custom properties', () => {
      const error = new Error('Test error');
      const result = utils.extractErrorInfo(error);

      expect(result.message).toBe('Test error');
      expect(result.stack).toBe(error.stack);
      expect(result.type).toBe('UNKNOWN');
      expect(result.context).toBe('unknown');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle string errors', () => {
      const result = utils.extractErrorInfo('String error');

      expect(result).toEqual({
        message: 'String error',
        stack: null,
        type: 'UNKNOWN',
        context: 'unknown',
        timestamp: expect.any(String),
      });
    });

    it('should handle other types', () => {
      const result = utils.extractErrorInfo(123);

      expect(result).toEqual({
        message: 'Unknown error occurred',
        stack: null,
        type: 'UNKNOWN',
        context: 'unknown',
        timestamp: expect.any(String),
      });
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format error for logging', () => {
      const error = new Error('Test error');
      error.type = 'NETWORK';
      const result = utils.formatErrorForLogging(error, 'api.fetch');

      expect(result).toBe('[NETWORK] [api.fetch] Test error');
    });

    it('should handle error without type', () => {
      const error = new Error('Test error');
      const result = utils.formatErrorForLogging(error, 'test.context');

      expect(result).toBe('[UNKNOWN] [test.context] Test error');
    });
  });

  describe('addValidationPattern', () => {
    it('should add valid regex pattern', () => {
      const pattern = /^[A-Z]+$/;
      utils.addValidationPattern('uppercase', pattern);
      expect(utils.validationPatterns.uppercase).toBe(pattern);
    });

    it('should not add invalid pattern', () => {
      const originalPatterns = { ...utils.validationPatterns };
      utils.addValidationPattern('invalid', 'not-a-regex');
      expect(utils.validationPatterns).toEqual(originalPatterns);
    });
  });

  describe('getValidationPatterns', () => {
    it('should return copy of validation patterns', () => {
      const patterns = utils.getValidationPatterns();
      expect(patterns).toEqual(utils.validationPatterns);
      expect(patterns).not.toBe(utils.validationPatterns); // Should be a copy
    });
  });

  describe('getErrorTypes', () => {
    it('should return copy of error types', () => {
      const types = utils.getErrorTypes();
      expect(types).toEqual(utils.errorTypes);
      expect(types).not.toBe(utils.errorTypes); // Should be a copy
    });
  });
});
