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
 * @description Configuration for end-to-end testing with Playwright including browser setup and test environment
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Test filtering - only run integration tests
  testMatch: '**/integration/**/*.test.js',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Increase timeout for integration tests
    actionTimeout: 15000,
    navigationTimeout: 20000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Load the Chrome extension properly
        launchOptions: {
          args: [
            '--disable-extensions-except=' + path.resolve(process.cwd()),
            '--load-extension=' + path.resolve(process.cwd()),
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
        // Set up proper Playwright permissions
        permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
      },
    },
  ],

  webServer: {
    command: 'python3 -m http.server 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
