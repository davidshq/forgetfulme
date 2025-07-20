import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Test file patterns
    include: [
      'tests/unit/**/*.test.js'
    ],
    exclude: [
      'tests/popup.test.js',
      'tests/options.test.js',
      'tests/auth.test.js',
      'tests/helpers/**',
      '**/node_modules/**'
    ],
    
    // Setup files
    setupFiles: ['./vitest.setup.js'],
    
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
        'playwright.config.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
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
    globals: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '.'
    }
  }
}); 