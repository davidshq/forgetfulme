import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Chrome Extension APIs
        chrome: 'readonly',
        browser: 'readonly',
        // DOM APIs
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // Common globals
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Promise: 'readonly',
        JSON: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // Node.js globals for tests
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        // Browser APIs
        URL: 'readonly',
        Blob: 'readonly',
        requestAnimationFrame: 'readonly',
        location: 'readonly',
        // Supabase globals
        supabase: 'readonly',
        // Custom extension classes
        UIComponents: 'readonly',
        UIMessages: 'readonly',
        ErrorHandler: 'readonly',
        ConfigManager: 'readonly',
        AuthStateManager: 'readonly',
        SupabaseConfig: 'readonly',
        SupabaseService: 'readonly',
        AuthUI: 'readonly',
        ConfigUI: 'readonly',
        BookmarkTransformer: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Chrome Extension specific rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code quality rules
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
      'no-redeclare': 'error',

      // Best practices
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'no-trailing-spaces': 'error',

      // Security rules are already covered above

      // Maintainability
      complexity: ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 300],
      'max-params': ['warn', 4],

      // Allow specific patterns for Chrome extensions
      'no-restricted-globals': [
        'error',
        {
          name: 'event',
          message:
            'Use the event parameter instead of the global event object.',
        },
      ],
    },
  },
  {
    // Ignore files that shouldn't be linted
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'supabase-js.min.js',
      'icons/**',
    ],
  },
  prettierConfig,
];
