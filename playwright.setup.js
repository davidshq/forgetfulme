/**
 * @fileoverview Playwright setup file for ForgetfulMe Chrome Extension E2E tests
 * @module playwright-setup
 * @description Provides setup configuration for Playwright tests without Vitest conflicts
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2025-01-01
 */

// Global setup function for Playwright
export default async function globalSetup(config) {
  console.log('Playwright global setup initialized');
  
  // Any global setup logic can go here
  return async () => {
    console.log('Playwright global teardown');
  };
}