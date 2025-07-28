/**
 * @fileoverview Visual regression tests for popup UI
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Popup Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 400, height: 600 });
  });

  test('popup config required state', async ({ page }) => {
    // Wait for initial state
    const configSection = page.locator('#config-required-section');
    await expect(configSection).toBeVisible();
    
    // Take screenshot of config required state
    await expect(page).toHaveScreenshot('popup-config-required.png');
  });

  test('popup auth section signin tab', async ({ page }) => {
    // Mock configuration to show auth section
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();
    
    // Ensure signin tab is active
    const signinTab = page.locator('#signin-tab');
    await signinTab.click();
    
    // Take screenshot of signin form
    await expect(page).toHaveScreenshot('popup-auth-signin.png');
  });

  test('popup auth section signup tab', async ({ page }) => {
    // Mock configuration to show auth section
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Switch to signup tab
    const signupTab = page.locator('#signup-tab');
    await signupTab.click();
    
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();
    
    // Take screenshot of signup form
    await expect(page).toHaveScreenshot('popup-auth-signup.png');
  });

  test('popup main section authenticated state', async ({ page }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
      window.mockUser = {
        email: 'test@example.com'
      };
      window.mockCurrentTab = {
        url: 'https://example.com',
        title: 'Example Website'
      };
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    
    // Take screenshot of main section
    await expect(page).toHaveScreenshot('popup-main-authenticated.png');
  });

  test('popup with form validation errors', async ({ page }) => {
    // Mock configuration
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty signin form to show validation
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Wait for error message to appear
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Please enter both email and password');
    
    // Take screenshot showing validation error
    await expect(page).toHaveScreenshot('popup-validation-error.png');
  });

  test('popup loading state', async ({ page }) => {
    // Mock configuration and slow network
    await page.route('**/auth/**', async route => {
      // Hold the request to show loading state
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test error' })
      });
    });
    
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Fill and submit form
    await page.fill('#signin-email', 'test@example.com');
    await page.fill('#signin-password', 'password123');
    
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Wait for loading state
    await expect(submitButton).toContainText('Signing in...');
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('popup-loading-state.png');
  });

  test('popup dark mode appearance', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Mock configuration
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot in dark mode
    await expect(page).toHaveScreenshot('popup-dark-mode.png');
  });

  test('popup responsive mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Mock configuration
    await page.evaluate(() => {
      window.mockConfigured = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of mobile view
    await expect(page).toHaveScreenshot('popup-mobile-view.png');
  });

  test('popup with recent bookmarks', async ({ page }) => {
    // Mock authenticated state with recent bookmarks
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
      window.mockUser = {
        email: 'test@example.com'
      };
      window.mockRecentBookmarks = [
        {
          id: '1',
          title: 'Example Website',
          url: 'https://example.com',
          status: 'read',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Another Site',
          url: 'https://another.com',
          status: 'unread',
          created_at: new Date().toISOString()
        }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for recent bookmarks to load
    const recentList = page.locator('#recent-list');
    await expect(recentList).toBeVisible();
    
    // Take screenshot with recent bookmarks
    await expect(page).toHaveScreenshot('popup-with-recent-bookmarks.png');
  });

  test('popup bookmark form states', async ({ page }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
      window.mockUser = { email: 'test@example.com' };
      window.mockCurrentTab = {
        url: 'https://example.com',
        title: 'Example Website'
      };
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Fill bookmark form
    await page.selectOption('#bookmark-status', 'read');
    await page.fill('#bookmark-tags', 'web, example, test');
    await page.fill('#bookmark-notes', 'This is a test bookmark with some notes');
    
    // Take screenshot of filled form
    await expect(page).toHaveScreenshot('popup-bookmark-form-filled.png');
  });

  test('popup success message state', async ({ page }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
      window.mockUser = { email: 'test@example.com' };
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Simulate success message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const successMsg = document.createElement('div');
      successMsg.className = 'message success';
      successMsg.textContent = 'Bookmark saved successfully!';
      messageArea.appendChild(successMsg);
    });
    
    // Take screenshot with success message
    await expect(page).toHaveScreenshot('popup-success-message.png');
  });
});