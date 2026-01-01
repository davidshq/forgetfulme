/**
 * @fileoverview Vitest setup file for ForgetfulMe Chrome Extension tests
 * @module vitest-setup
 * @description Provides comprehensive mocking for Chrome APIs and DOM elements for unit testing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { createMockConsole } from './tests/helpers/mocks/console.js';
import { createMockChrome } from './tests/helpers/mocks/chrome-api.js';
import { createMockErrorHandler } from './tests/helpers/mocks/error-handler.js';
import {
  createMockElement,
  createMockDocument,
  createMockWindow,
} from './tests/helpers/mocks/dom.js';
import { createMockUIComponents } from './tests/helpers/mocks/ui-components.js';

// Mock console methods for testing
global.console = createMockConsole();

// Mock Chrome API for testing
global.chrome = createMockChrome();

// Create DOM mocks
const mockElementFactory = createMockElement;
global.document = createMockDocument(mockElementFactory);
global.window = createMockWindow(global.document);

// Mock UIComponents
global.UIComponents = createMockUIComponents(global.document);

// Mock fetch
global.fetch = vi.fn();

// Mock setTimeout and setInterval to work synchronously in tests
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

global.setTimeout = vi.fn((callback, delay) => {
  if (delay === 0) {
    callback();
  } else {
    // Use the original setTimeout to avoid infinite recursion
    const timer = originalSetTimeout(callback, delay);
    return timer;
  }
  return Math.random();
});

global.setInterval = vi.fn((callback, delay) => {
  // Use the original setInterval to avoid infinite recursion
  const timer = originalSetInterval(callback, delay);
  return timer;
});

global.clearTimeout = vi.fn();
global.clearInterval = vi.fn();

// Mock ErrorHandler
global.ErrorHandler = createMockErrorHandler();

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset DOM
  global.document.body = global.document.createElement('body');
  global.document.head = global.document.createElement('head');

  // Reset Chrome API mocks
  Object.keys(global.chrome).forEach(key => {
    if (typeof global.chrome[key] === 'object' && global.chrome[key] !== null) {
      Object.keys(global.chrome[key]).forEach(subKey => {
        if (typeof global.chrome[key][subKey] === 'function') {
          global.chrome[key][subKey].mockClear();
        }
      });
    }
  });
});

// Cleanup after tests
afterEach(() => {
  // Clean up any remaining timeouts
  vi.clearAllTimers();
});
