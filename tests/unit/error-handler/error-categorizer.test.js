/**
 * @fileoverview Unit tests for Error Categorizer Module
 * @module error-categorizer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorCategorizer } from '../../../utils/error-handler/modules/error-categorizer.js';

describe('ErrorCategorizer', () => {
  let categorizer;

  beforeEach(() => {
    categorizer = new ErrorCategorizer();
  });

  describe('ERROR_TYPES', () => {
    it('should have all required error types', () => {
      expect(ErrorCategorizer.ERROR_TYPES).toEqual({
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

  describe('SEVERITY', () => {
    it('should have all required severity levels', () => {
      expect(ErrorCategorizer.SEVERITY).toEqual({
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
      });
    });
  });

  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = new Error('Failed to fetch data from API');
      const result = categorizer.categorizeError(error, 'api.fetch');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.NETWORK);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.MEDIUM);
      expect(result.message).toBe('Failed to fetch data from API');
      expect(result.context).toBe('api.fetch');
      expect(result.originalError).toBe(error);
    });

    it('should categorize authentication errors', () => {
      const error = new Error('User not authenticated');
      const result = categorizer.categorizeError(error, 'auth.login');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.AUTH);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.HIGH);
      expect(result.message).toBe('User not authenticated');
      expect(result.context).toBe('auth.login');
    });

    it('should categorize validation errors', () => {
      const error = new Error('Both URL and anon key are required');
      const result = categorizer.categorizeError(error, 'form.submit');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.VALIDATION);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.LOW);
      expect(result.message).toBe('Both URL and anon key are required');
      expect(result.context).toBe('form.submit');
    });

    it('should categorize database errors', () => {
      const error = new Error('Database query failed');
      const result = categorizer.categorizeError(error, 'db.query');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.DATABASE);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.HIGH);
      expect(result.message).toBe('Database query failed');
      expect(result.context).toBe('db.query');
    });

    it('should categorize configuration errors', () => {
      const error = new Error('Supabase client not loaded');
      const result = categorizer.categorizeError(error, 'config.init');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.CONFIG);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.MEDIUM);
      expect(result.message).toBe('Supabase client not loaded');
      expect(result.context).toBe('config.init');
    });

    it('should categorize UI errors by message', () => {
      const error = new Error('DOM element not found');
      const result = categorizer.categorizeError(error, 'ui.render');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.UI);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.MEDIUM);
      expect(result.message).toBe('DOM element not found');
      expect(result.context).toBe('ui.render');
    });

    it('should categorize UI errors by context', () => {
      const error = new Error('Something went wrong');
      const result = categorizer.categorizeError(error, 'popup.initialize');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.UI);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.MEDIUM);
      expect(result.message).toBe('Something went wrong');
      expect(result.context).toBe('popup.initialize');
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Unexpected error occurred');
      const result = categorizer.categorizeError(error, 'unknown.context');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.UNKNOWN);
      expect(result.severity).toBe(ErrorCategorizer.SEVERITY.MEDIUM);
      expect(result.message).toBe('Unexpected error occurred');
      expect(result.context).toBe('unknown.context');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error message';
      const result = categorizer.categorizeError(error, 'test.context');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.UNKNOWN);
      expect(result.message).toBe('String error message');
      expect(result.originalError).toBe(error);
    });

    it('should handle errors without message', () => {
      const error = new Error();
      const result = categorizer.categorizeError(error, 'test.context');

      expect(result.type).toBe(ErrorCategorizer.ERROR_TYPES.UNKNOWN);
      expect(result.message).toBe('Error');
      expect(result.originalError).toBe(error);
    });
  });

  describe('_matchesPatterns', () => {
    it('should match patterns case-insensitively', () => {
      const message = 'NETWORK TIMEOUT ERROR';
      const patterns = ['timeout', 'network'];
      
      expect(categorizer._matchesPatterns(message, patterns)).toBe(true);
    });

    it('should return false when no patterns match', () => {
      const message = 'Some random error';
      const patterns = ['timeout', 'network', 'auth'];
      
      expect(categorizer._matchesPatterns(message, patterns)).toBe(false);
    });

    it('should handle empty patterns array', () => {
      const message = 'Some error';
      const patterns = [];
      
      expect(categorizer._matchesPatterns(message, patterns)).toBe(false);
    });
  });

  describe('_isUIContext', () => {
    it('should identify UI contexts', () => {
      expect(categorizer._isUIContext('ui.render')).toBe(true);
      expect(categorizer._isUIContext('popup.initialize')).toBe(true);
      expect(categorizer._isUIContext('options.save')).toBe(true);
    });

    it('should identify non-UI contexts', () => {
      expect(categorizer._isUIContext('api.fetch')).toBe(false);
      expect(categorizer._isUIContext('auth.login')).toBe(false);
      expect(categorizer._isUIContext('db.query')).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      expect(categorizer._isUIContext('UI.RENDER')).toBe(true);
      expect(categorizer._isUIContext('Popup.Initialize')).toBe(true);
    });
  });

  describe('_createErrorInfo', () => {
    it('should create standardized error info object', () => {
      const error = new Error('Test error');
      const result = categorizer._createErrorInfo(
        'TEST',
        'HIGH',
        'Test error',
        'test.context',
        error
      );

      expect(result).toEqual({
        type: 'TEST',
        severity: 'HIGH',
        message: 'Test error',
        context: 'test.context',
        originalError: error,
      });
    });
  });
}); 