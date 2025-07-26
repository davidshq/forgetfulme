/**
 * @fileoverview Unit tests for Error Messages Module
 * @module error-messages.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorMessages } from '../../../utils/error-handler/modules/error-messages.js';

describe('ErrorMessages', () => {
  let messages;

  beforeEach(() => {
    messages = new ErrorMessages();
  });

  describe('constructor', () => {
    it('should initialize with default messages', () => {
      expect(messages.messages).toEqual({
        NETWORK: 'Connection error. Please check your internet connection and try again.',
        DATABASE: 'Data error. Please try again or contact support if the problem persists.',
        UI: 'Interface error. Please refresh the page and try again.',
        UNKNOWN: 'An unexpected error occurred. Please try again.',
      });
    });

    it('should initialize with auth messages', () => {
      expect(messages.authMessages).toEqual({
        'Invalid login credentials': 'Invalid email or password. Please try again.',
        'User already registered': 'An account with this email already exists.',
        'Password should be at least': 'Password must be at least 6 characters.',
        'Email not confirmed': 'Please check your email and click the verification link before signing in.',
        'User not authenticated': 'Please sign in to continue.',
        default: 'Authentication error. Please try signing in again.',
      });
    });

    it('should initialize with validation messages', () => {
      expect(messages.validationMessages).toEqual({
        'Both URL and anon key are required': 'Please enter both the Project URL and anon key.',
        'URL must start with https://': 'Project URL must start with https://',
        'Invalid anon key format': 'Please check your anon key format.',
        'Please fill in all fields': 'Please fill in all required fields.',
        'Invalid Supabase configuration: missing URL or anon key': 'Configuration error. Please check your settings and try again.',
        'Invalid Supabase URL: must start with https://': 'Configuration error. Please check your settings and try again.',
        default: 'Please check your input and try again.',
      });
    });

    it('should initialize with config messages', () => {
      expect(messages.configMessages).toEqual({
        'Supabase client not loaded': 'Configuration error. Please check your Supabase settings.',
        'Invalid Supabase configuration: missing URL or anon key': 'Configuration error. Please check your settings and try again.',
        'Invalid Supabase URL: must start with https://': 'Configuration error. Please check your settings and try again.',
        default: 'Configuration error. Please check your settings and try again.',
      });
    });
  });

  describe('getUserMessage', () => {
    it('should return technical message when showTechnical is true', () => {
      const errorInfo = {
        type: 'NETWORK',
        message: 'Failed to fetch data',
      };
      const options = { showTechnical: true };

      const result = messages.getUserMessage(errorInfo, options);
      expect(result).toBe('Failed to fetch data');
    });

    it('should return network error message', () => {
      const errorInfo = {
        type: 'NETWORK',
        message: 'Failed to fetch data',
      };

      const result = messages.getUserMessage(errorInfo);
      expect(result).toBe('Connection error. Please check your internet connection and try again.');
    });

    it('should return database error message', () => {
      const errorInfo = {
        type: 'DATABASE',
        message: 'Query failed',
      };

      const result = messages.getUserMessage(errorInfo);
      expect(result).toBe('Data error. Please try again or contact support if the problem persists.');
    });

    it('should return UI error message', () => {
      const errorInfo = {
        type: 'UI',
        message: 'Element not found',
      };

      const result = messages.getUserMessage(errorInfo);
      expect(result).toBe('Interface error. Please refresh the page and try again.');
    });

    it('should return unknown error message', () => {
      const errorInfo = {
        type: 'UNKNOWN',
        message: 'Unexpected error',
      };

      const result = messages.getUserMessage(errorInfo);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return unknown error message for undefined type', () => {
      const errorInfo = {
        type: 'UNDEFINED_TYPE',
        message: 'Some error',
      };

      const result = messages.getUserMessage(errorInfo);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('_getAuthMessage', () => {
    it('should return specific auth message for invalid credentials', () => {
      const message = 'Invalid login credentials provided';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('Invalid email or password. Please try again.');
    });

    it('should return specific auth message for user already registered', () => {
      const message = 'User already registered with this email';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('An account with this email already exists.');
    });

    it('should return specific auth message for password length', () => {
      const message = 'Password should be at least 6 characters';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('Password must be at least 6 characters.');
    });

    it('should return specific auth message for email not confirmed', () => {
      const message = 'Email not confirmed yet';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('Please check your email and click the verification link before signing in.');
    });

    it('should return specific auth message for user not authenticated', () => {
      const message = 'User not authenticated';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('Please sign in to continue.');
    });

    it('should return default auth message for unknown auth error', () => {
      const message = 'Some other auth error';
      const result = messages._getAuthMessage(message);
      expect(result).toBe('Authentication error. Please try signing in again.');
    });
  });

  describe('_getValidationMessage', () => {
    it('should return specific validation message for missing URL and key', () => {
      const message = 'Both URL and anon key are required';
      const result = messages._getValidationMessage(message);
      expect(result).toBe('Please enter both the Project URL and anon key.');
    });

    it('should return specific validation message for invalid URL format', () => {
      const message = 'URL must start with https://';
      const result = messages._getValidationMessage(message);
      expect(result).toBe('Project URL must start with https://');
    });

    it('should return specific validation message for invalid anon key', () => {
      const message = 'Invalid anon key format';
      const result = messages._getValidationMessage(message);
      expect(result).toBe('Please check your anon key format.');
    });

    it('should return specific validation message for missing fields', () => {
      const message = 'Please fill in all fields';
      const result = messages._getValidationMessage(message);
      expect(result).toBe('Please fill in all required fields.');
    });

    it('should return default validation message for unknown validation error', () => {
      const message = 'Some other validation error';
      const result = messages._getValidationMessage(message);
      expect(result).toBe('Please check your input and try again.');
    });
  });

  describe('_getConfigMessage', () => {
    it('should return specific config message for Supabase client not loaded', () => {
      const message = 'Supabase client not loaded';
      const result = messages._getConfigMessage(message);
      expect(result).toBe('Configuration error. Please check your Supabase settings.');
    });

    it('should return default config message for unknown config error', () => {
      const message = 'Some other config error';
      const result = messages._getConfigMessage(message);
      expect(result).toBe('Configuration error. Please check your settings and try again.');
    });
  });

  describe('addCustomMessage', () => {
    it('should add custom auth message', () => {
      messages.addCustomMessage('AUTH', 'Custom auth error', 'Custom auth message');
      expect(messages.authMessages['Custom auth error']).toBe('Custom auth message');
    });

    it('should add custom validation message', () => {
      messages.addCustomMessage('VALIDATION', 'Custom validation error', 'Custom validation message');
      expect(messages.validationMessages['Custom validation error']).toBe('Custom validation message');
    });

    it('should add custom config message', () => {
      messages.addCustomMessage('CONFIG', 'Custom config error', 'Custom config message');
      expect(messages.configMessages['Custom config error']).toBe('Custom config message');
    });

    it('should add custom general message', () => {
      messages.addCustomMessage('CUSTOM_TYPE', 'Custom error', 'Custom message');
      expect(messages.messages['CUSTOM_TYPE']).toBe('Custom message');
    });
  });

  describe('getAllMessages', () => {
    it('should return all message collections', () => {
      const result = messages.getAllMessages();
      
      expect(result).toHaveProperty('general');
      expect(result).toHaveProperty('auth');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('config');
      
      expect(result.general).toBe(messages.messages);
      expect(result.auth).toBe(messages.authMessages);
      expect(result.validation).toBe(messages.validationMessages);
      expect(result.config).toBe(messages.configMessages);
    });
  });
}); 