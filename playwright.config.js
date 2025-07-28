import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    // No baseURL - we'll use file:// protocol directly
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  expect: {
    // Configure visual comparison
    threshold: 0.2,
    toHaveScreenshot: {
      mode: 'non-default',
      threshold: 0.2
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]

  // No webServer needed for browser extension files
});