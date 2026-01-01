/**
 * @fileoverview Unit tests for config validator
 * @module tests/unit/config-validator
 * @description Tests for configuration validation functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { validateSupabaseConfig, validatePreferences } from '../../utils/config-validator.js';

// Mock ErrorHandler
vi.mock('../../utils/error-handler.js', () => ({
  default: {
    createError: vi.fn((message, type, context) => {
      const error = new Error(message);
      error.type = type;
      error.context = context;
      return error;
    }),
    ERROR_TYPES: {
      VALIDATION: 'VALIDATION',
    },
  },
}));

describe('ConfigValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateSupabaseConfig', () => {
    test('should not throw when config is null', () => {
      expect(() => validateSupabaseConfig(null)).not.toThrow();
    });

    test('should not throw when config is undefined', () => {
      expect(() => validateSupabaseConfig(undefined)).not.toThrow();
    });

    test('should throw when URL is missing', () => {
      const config = { anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' };

      expect(() => validateSupabaseConfig(config)).toThrow('Invalid Supabase configuration');
    });

    test('should throw when anonKey is missing', () => {
      const config = { url: 'https://example.supabase.co' };

      expect(() => validateSupabaseConfig(config)).toThrow('Invalid Supabase configuration');
    });

    test('should throw when URL does not start with https://', () => {
      const config = {
        url: 'http://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      };

      expect(() => validateSupabaseConfig(config)).toThrow('Invalid Supabase URL');
    });

    test('should throw when anonKey does not start with eyJ', () => {
      const config = {
        url: 'https://example.supabase.co',
        anonKey: 'invalid-key',
      };

      expect(() => validateSupabaseConfig(config)).toThrow('Invalid anon key format');
    });

    test('should not throw when config is valid', () => {
      const config = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      };

      expect(() => validateSupabaseConfig(config)).not.toThrow();
    });

    test('should validate URL with path', () => {
      const config = {
        url: 'https://example.supabase.co/rest/v1',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      };

      expect(() => validateSupabaseConfig(config)).not.toThrow();
    });

    test('should validate anonKey with full JWT format', () => {
      const config = {
        url: 'https://example.supabase.co',
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk2ODAwMCwiZXhwIjoxOTU2NTQ0MDAwfQ.signature',
      };

      expect(() => validateSupabaseConfig(config)).not.toThrow();
    });
  });

  describe('validatePreferences', () => {
    test('should return default preferences when preferences is null', () => {
      const result = validatePreferences(null);

      expect(result).toEqual({
        customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
      });
    });

    test('should return default preferences when preferences is undefined', () => {
      const result = validatePreferences(undefined);

      expect(result).toEqual({
        customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
      });
    });

    test('should return default preferences when customStatusTypes is not an array', () => {
      const preferences = { customStatusTypes: 'not-an-array' };

      const result = validatePreferences(preferences);

      expect(result).toEqual({
        customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
      });
    });

    test('should return preferences when valid', () => {
      const preferences = {
        customStatusTypes: ['read', 'unread', 'archived'],
      };

      const result = validatePreferences(preferences);

      expect(result).toEqual(preferences);
    });

    test('should return preferences with empty customStatusTypes array', () => {
      const preferences = {
        customStatusTypes: [],
      };

      const result = validatePreferences(preferences);

      expect(result).toEqual(preferences);
    });

    test('should preserve additional properties in preferences', () => {
      const preferences = {
        customStatusTypes: ['read', 'unread'],
        theme: 'dark',
        language: 'en',
      };

      const result = validatePreferences(preferences);

      expect(result).toEqual(preferences);
    });
  });
});
