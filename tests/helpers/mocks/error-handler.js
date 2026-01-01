/**
 * @fileoverview ErrorHandler mocks for Vitest setup
 * @module mocks/error-handler
 * @description Provides mocked ErrorHandler for unit testing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Mock ErrorHandler for testing
 * @function createMockErrorHandler
 * @returns {Object} Mock ErrorHandler object
 * @description Provides mocked ErrorHandler with predefined responses for testing
 */
export const createMockErrorHandler = () => ({
  handle: vi.fn((error, context) => ({
    shouldShowToUser: true,
    userMessage: error.message || 'An error occurred',
    technicalMessage: error.message,
    context: context,
  })),
  createError: vi.fn((message, type, context) => ({
    message,
    type,
    context,
    name: 'Error',
  })),
  ERROR_TYPES: {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    STORAGE: 'storage',
    UNKNOWN: 'unknown',
  },
});
