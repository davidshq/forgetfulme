/**
 * @fileoverview Unit tests for error validator
 * @module tests/unit/error-validator
 * @description Tests for input validation functionality
 */

import { describe, test, expect } from 'vitest';
import { validateInput } from '../../utils/error-validator.js';

describe('ErrorValidator', () => {
  describe('validateInput', () => {
    describe('email validation', () => {
      test('should validate valid email addresses', () => {
        const result = validateInput('test@example.com', 'email');

        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      test('should reject invalid email addresses', () => {
        const result = validateInput('invalid-email', 'email');

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid email address.');
      });

      test('should reject email without @ symbol', () => {
        const result = validateInput('testexample.com', 'email');

        expect(result.isValid).toBe(false);
      });

      test('should reject email without domain', () => {
        const result = validateInput('test@', 'email');

        expect(result.isValid).toBe(false);
      });

      test('should trim whitespace from email', () => {
        const result = validateInput('  test@example.com  ', 'email');

        expect(result.isValid).toBe(true);
      });
    });

    describe('URL validation', () => {
      test('should validate valid URLs', () => {
        const result = validateInput('https://example.com', 'url');

        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      test('should validate HTTP URLs', () => {
        const result = validateInput('http://example.com', 'url');

        expect(result.isValid).toBe(true);
      });

      test('should reject invalid URLs', () => {
        const result = validateInput('not-a-url', 'url');

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please enter a valid URL.');
      });

      test('should reject empty URLs', () => {
        const result = validateInput('', 'url');

        expect(result.isValid).toBe(false);
      });

      test('should trim whitespace from URLs', () => {
        const result = validateInput('  https://example.com  ', 'url');

        expect(result.isValid).toBe(true);
      });
    });

    describe('password validation', () => {
      test('should validate passwords with 6 or more characters', () => {
        const result = validateInput('password123', 'password');

        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      test('should validate passwords with exactly 6 characters', () => {
        const result = validateInput('123456', 'password');

        expect(result.isValid).toBe(true);
      });

      test('should reject passwords with less than 6 characters', () => {
        const result = validateInput('12345', 'password');

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Password must be at least 6 characters.');
      });

      test('should reject empty passwords', () => {
        const result = validateInput('', 'password');

        expect(result.isValid).toBe(false);
      });

      test('should trim whitespace from passwords', () => {
        const result = validateInput('  password123  ', 'password');

        expect(result.isValid).toBe(true);
      });
    });

    describe('text validation', () => {
      test('should validate non-empty text', () => {
        const result = validateInput('some text', 'text');

        expect(result.isValid).toBe(true);
        expect(result.message).toBeNull();
      });

      test('should reject empty text', () => {
        const result = validateInput('', 'text');

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('This field is required.');
      });

      test('should reject whitespace-only text', () => {
        const result = validateInput('   ', 'text');

        expect(result.isValid).toBe(false);
      });

      test('should trim whitespace from text', () => {
        const result = validateInput('  valid text  ', 'text');

        expect(result.isValid).toBe(true);
      });
    });

    describe('default validation', () => {
      test('should use text validation for unknown types', () => {
        const result = validateInput('some value', 'unknown-type');

        expect(result.isValid).toBe(true);
      });

      test('should reject empty input for unknown types', () => {
        const result = validateInput('', 'unknown-type');

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('This field is required.');
      });

      test('should use text validation when type is not provided', () => {
        const result = validateInput('some value');

        expect(result.isValid).toBe(true);
      });
    });
  });
});
