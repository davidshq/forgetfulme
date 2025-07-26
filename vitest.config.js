/**
 * @fileoverview Vitest configuration for ForgetfulMe Chrome Extension
 * @module vitest-config
 * @description Configuration for unit testing with Vitest including coverage and test setup
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for ForgetfulMe Chrome Extension
 * @type {import('vitest').UserConfig}
 * @description Comprehensive test configuration with coverage reporting and proper test environment setup
 */
export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Test file patterns
    include: ['tests/unit/**/*.test.js'],
    exclude: [
      'tests/popup.test.js',
      'tests/options.test.js',
      'tests/auth.test.js',
      'tests/helpers/**',
      '**/node_modules/**',
    ],

    // Setup files
    setupFiles: ['./vitest.setup.js'],
    
    // Ensure JSDOM environment is properly configured
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/popup.test.js',
        'tests/options.test.js',
        'tests/auth.test.js',
        'tests/helpers/**',
        'tests/unit/**/*.test.js',
        'vitest.config.js',
        'vitest.setup.js',
        'playwright.config.js',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Verbose output
    reporters: ['verbose'],

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true,

    // Global test setup
    globals: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '.',
    },
  },
});
