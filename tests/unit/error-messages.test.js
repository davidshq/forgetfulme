/**
 * @fileoverview Unit tests for error messages
 * @module tests/unit/error-messages
 * @description Tests for user-friendly error message generation
 */

import { describe, test, expect } from 'vitest';
import { getUserMessage } from '../../utils/error-messages.js';

describe('ErrorMessages', () => {
  describe('getUserMessage', () => {
    test('should return technical message when showTechnical is true', () => {
      const errorInfo = {
        type: 'NETWORK',
        message: 'Technical error details',
      };
      const result = getUserMessage(errorInfo, { showTechnical: true });

      expect(result).toBe('Technical error details');
    });

    test('should return user-friendly network message', () => {
      const errorInfo = {
        type: 'NETWORK',
        message: 'Connection failed',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Connection error. Please check your internet connection and try again.');
    });

    test('should return offline message for offline network errors', () => {
      const errorInfo = {
        type: 'NETWORK',
        message: 'You are offline',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe(
        'You are currently offline. Operations will be queued and processed when you are back online.',
      );
    });

    test('should return user-friendly auth message for invalid credentials', () => {
      const errorInfo = {
        type: 'AUTH',
        message: 'Invalid login credentials',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Invalid email or password. Please try again.');
    });

    test('should return user-friendly auth message for user already registered', () => {
      const errorInfo = {
        type: 'AUTH',
        message: 'User already registered',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('An account with this email already exists.');
    });

    test('should return user-friendly auth message for password length', () => {
      const errorInfo = {
        type: 'AUTH',
        message: 'Password should be at least 6 characters',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Password must be at least 6 characters.');
    });

    test('should return user-friendly auth message for session expired', () => {
      const errorInfo = {
        type: 'AUTH',
        message: 'Session expired',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Your session has expired. Please sign in again.');
    });

    test('should return user-friendly auth message for token refresh failure', () => {
      const errorInfo = {
        type: 'AUTH',
        message: 'Token refresh has failed permanently',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Your session has expired. Please sign in again.');
    });

    test('should return user-friendly validation message for required fields', () => {
      const errorInfo = {
        type: 'VALIDATION',
        message: 'Both URL and anon key are required',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Please enter both the Project URL and anon key.');
    });

    test('should return user-friendly validation message for URL format', () => {
      const errorInfo = {
        type: 'VALIDATION',
        message: 'URL must start with https://',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Project URL must start with https://');
    });

    test('should return user-friendly validation message for anon key format', () => {
      const errorInfo = {
        type: 'VALIDATION',
        message: 'Invalid anon key format',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Please check your anon key format.');
    });

    test('should return user-friendly database message', () => {
      const errorInfo = {
        type: 'DATABASE',
        message: 'Database error',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe(
        'Data error. Please try again or contact support if the problem persists.',
      );
    });

    test('should return user-friendly config message', () => {
      const errorInfo = {
        type: 'CONFIG',
        message: 'Supabase client not loaded',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Configuration error. Please check your Supabase settings.');
    });

    test('should return user-friendly UI message', () => {
      const errorInfo = {
        type: 'UI',
        message: 'DOM error',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe('Interface error. Please refresh the page and try again.');
    });

    test('should return user-friendly unknown error message', () => {
      const errorInfo = {
        type: 'UNKNOWN',
        message: 'Unexpected error',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe(
        'An unexpected error occurred. Please refresh the page and try again. If the problem persists, contact support.',
      );
    });

    test('should return unknown message for unrecognized error type', () => {
      const errorInfo = {
        type: 'UNRECOGNIZED',
        message: 'Some error',
      };
      const result = getUserMessage(errorInfo);

      expect(result).toBe(
        'An unexpected error occurred. Please refresh the page and try again. If the problem persists, contact support.',
      );
    });
  });
});
