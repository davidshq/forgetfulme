/**
 * @fileoverview Console mocks for Vitest setup
 * @module mocks/console
 * @description Provides mocked console methods that can be tracked in tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Mock console methods for testing
 * @function createMockConsole
 * @returns {Object} Mock console object with tracked methods
 * @description Provides mocked console methods that can be tracked in tests
 */
export const createMockConsole = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
});
