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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright configuration for ForgetfulMe Chrome Extension E2E tests
 * @type {import('@playwright/test').PlaywrightTestConfig}
 * @description Configuration for end-to-end testing with Playwright including browser setup and test environment
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**', '**/helpers/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    // No baseURL, we use chrome-extension:// URLs
    headless: true, // Run in headless mode
    launchOptions: {
      args: [
        // Load the extension as unpacked
        `--disable-extensions-except=${path.join(__dirname, '')}`,
        `--load-extension=${path.join(__dirname, '')}`,
      ],
    },
    // contextOptions will be set in the test setup to get extensionId
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer: we are not using http.server for extension tests
});
