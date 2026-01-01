/**
 * @fileoverview Unit tests for error categorizer
 * @module tests/unit/error-categorizer
 * @description Tests for error categorization functionality
 */

import { describe, test, expect } from 'vitest';
import { categorizeError } from '../../utils/error-categorizer.js';

describe('ErrorCategorizer', () => {
  describe('categorizeError', () => {
    test('should categorize network errors', () => {
      const error = new Error('Failed to fetch');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('NETWORK');
      expect(result.severity).toBe('MEDIUM');
      expect(result.message).toBe('Failed to fetch');
      expect(result.context).toBe('test-context');
      expect(result.originalError).toBe(error);
    });

    test('should categorize network timeout errors', () => {
      const error = new Error('Request timeout');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('NETWORK');
      expect(result.severity).toBe('MEDIUM');
    });

    test('should categorize HTTP errors', () => {
      const error = new Error('HTTP 500 error');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('NETWORK');
    });

    test('should categorize authentication errors', () => {
      const error = new Error('User not authenticated');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('AUTH');
      expect(result.severity).toBe('HIGH');
    });

    test('should categorize JWT expired errors', () => {
      const error = new Error('JWT expired');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('AUTH');
      expect(result.severity).toBe('HIGH');
    });

    test('should categorize token refresh errors', () => {
      const error = new Error('refresh_token not found');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('AUTH');
    });

    test('should categorize auth errors by code', () => {
      const error = { message: 'Auth error', code: 'PGRST116' };
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('AUTH');
    });

    test('should categorize validation errors', () => {
      const error = new Error('Invalid input format');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('VALIDATION');
      expect(result.severity).toBe('LOW');
    });

    test('should categorize required field errors', () => {
      const error = new Error('Field is required');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('VALIDATION');
    });

    test('should categorize Supabase validation errors', () => {
      const error = new Error('Both URL and anon key are required');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('VALIDATION');
    });

    test('should categorize database errors', () => {
      const error = new Error('Database query failed');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('DATABASE');
      expect(result.severity).toBe('HIGH');
    });

    test('should categorize foreign key constraint errors', () => {
      const error = new Error('Foreign key constraint violation');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('DATABASE');
    });

    test('should categorize configuration errors', () => {
      const error = new Error('Supabase client not loaded');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('CONFIG');
      expect(result.severity).toBe('MEDIUM');
    });

    test('should categorize UI errors', () => {
      const error = new Error('DOM element not found');
      const result = categorizeError(error, 'ui-context');

      expect(result.type).toBe('UI');
      expect(result.severity).toBe('MEDIUM');
    });

    test('should categorize UI errors by context', () => {
      const error = new Error('Some error');
      const result = categorizeError(error, 'popup-context');

      expect(result.type).toBe('UI');
    });

    test('should categorize unknown errors', () => {
      const error = new Error('Some unexpected error');
      const result = categorizeError(error, 'test-context');

      expect(result.type).toBe('UNKNOWN');
      expect(result.severity).toBe('MEDIUM');
    });

    test('should handle errors without message property', () => {
      const error = { toString: () => 'String representation' };
      const result = categorizeError(error, 'test-context');

      expect(result.message).toBe('String representation');
      expect(result.type).toBe('UNKNOWN');
    });

    test('should preserve original error', () => {
      const error = new Error('Test error');
      const result = categorizeError(error, 'test-context');

      expect(result.originalError).toBe(error);
    });
  });
});
