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
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  webServer: {
    command: 'python3 -m http.server 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
