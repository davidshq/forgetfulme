/**
 * @fileoverview ESLint configuration for ForgetfulMe Chrome Extension
 * @module eslint-config
 * @description ESLint configuration with Chrome extension specific rules and Prettier integration
 */

import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

/**
 * ESLint configuration for ForgetfulMe Chrome Extension
 * @type {import('eslint').Linter.Config}
 */
export default [
  // Base recommended rules
  js.configs.recommended,

  // Main configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024, // Updated to latest
      sourceType: 'module',
      globals: {
        // Chrome Extension APIs
        chrome: 'readonly',
        browser: 'readonly',
        // Browser APIs
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Promise: 'readonly',
        JSON: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        requestAnimationFrame: 'readonly',
        location: 'readonly',
        Event: 'readonly',
        // Test globals (Vitest)
        global: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        // Node.js globals (for tests and config files)
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // Prettier integration - use 'warn' to avoid blocking on formatting
      'prettier/prettier': 'warn',

      // Security rules for Chrome extensions
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code quality
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn/error
      'prefer-const': 'error',
      'no-var': 'error',

      // Best practices
      eqeqeq: ['error', 'always', { null: 'ignore' }], // Allow == null for null/undefined checks
      curly: ['error', 'all'],
      'no-empty': ['error', { allowEmptyCatch: true }], // Allow empty catch blocks
      'no-irregular-whitespace': 'error',
      'no-throw-literal': 'error', // Must throw Error objects
      'prefer-promise-reject-errors': 'error', // Reject with Error objects

      // Modern JavaScript
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'prefer-destructuring': [
        'warn',
        {
          array: false, // Don't force array destructuring
          object: true, // Encourage object destructuring
        },
      ],

      // Maintainability
      complexity: ['warn', { max: 15 }], // Increased from 10 to 15
      'max-depth': ['warn', 5], // Increased from 4 to 5
      'max-lines': ['warn', 500], // Increased from 300 to 500
      'max-lines-per-function': ['warn', 100], // New: limit function length
      'max-params': ['warn', 5], // Increased from 4 to 5
      'max-nested-callbacks': ['warn', 4],

      // Code style (complementary to Prettier)
      'no-restricted-globals': [
        'error',
        {
          name: 'event',
          message: 'Use the event parameter instead of the global event object.',
        },
      ],

      // Removed redundant rules (already in js.configs.recommended):
      // - 'no-undef': Already handled by recommended config
      // - 'no-redeclare': Already handled by recommended config
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.js', '**/tests/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console in tests
      'max-lines': 'off', // Test files can be longer
      'max-lines-per-function': 'off', // Test functions can be longer
      'max-depth': ['warn', 8], // Test files have deeper nesting (describe -> describe -> test -> function body)
      'max-nested-callbacks': ['warn', 6], // Test files may have nested callbacks (setTimeout, promises, etc.)
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'supabase-js.min.js', // External library
      'icons/**', // Icon files
      '*.min.js', // All minified files
      'dist/**',
      'build/**',
    ],
  },

  // Prettier config (disables conflicting ESLint rules)
  prettierConfig,
];
