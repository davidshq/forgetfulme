/**
 * @fileoverview Playwright configuration for ForgetfulMe Chrome Extension E2E tests
 * @module playwright-config
 * @description Configuration for end-to-end testing with Playwright
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for ForgetfulMe Chrome Extension E2E tests
 * @type {import('@playwright/test').PlaywrightTestConfig}
 * @description Enhanced configuration supporting both HTTP-based component tests and real Chrome extension E2E tests
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Global test settings
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase timeout for extension operations
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },

  // Playwright-specific setup (not Vitest)
  globalSetup: './playwright.setup.js',

  projects: [
    // Component Integration Tests (HTTP-based, faster feedback)
    {
      name: 'component-integration',
      testMatch: '**/integration/**/!(e2e-*)*.test.js',
      testIgnore: ['**/node_modules/**', '**/vitest.setup.js'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        // Standard web testing setup
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
        },
      },
    },

    // Real Chrome Extension E2E Tests (full extension environment)
    {
      name: 'extension-e2e',
      testMatch: '**/integration/**/e2e-*.test.js',
      use: {
        ...devices['Desktop Chrome'],
        // Real Chrome extension environment
        launchOptions: {
          args: [
            // Load the actual extension
            '--disable-extensions-except=' + path.resolve(process.cwd()),
            '--load-extension=' + path.resolve(process.cwd()),
            // Extension-specific Chrome flags
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--enable-extension-activity-logging',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            // Security and sandbox flags
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            // Extension permissions
            '--auto-select-desktop-capture-source=entire-screen',
          ],
        },
        // Chrome extension permissions
        permissions: [
          'geolocation',
          'notifications', 
          'camera',
          'microphone',
          'clipboard-read',
          'clipboard-write',
        ],
        // Extension-specific context options
        ignoreDefaultArgs: ['--disable-extensions'],
      },
    },

    // Cross-browser testing (future)
    {
      name: 'firefox',
      testMatch: '**/integration/**/cross-browser-*.test.js',
      use: devices['Desktop Firefox'],
      // Note: Firefox add-on testing requires different setup
    },
  ],

  webServer: {
    command: 'python3 -m http.server 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    // Only needed for component integration tests
  },
});
