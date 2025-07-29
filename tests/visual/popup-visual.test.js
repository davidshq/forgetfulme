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
    // Show config required section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.remove('hidden');
    });
    
    // Wait for initial state
    const configSection = page.locator('#config-required');
    await expect(configSection).toBeVisible();
    
    // Take screenshot of config required state
    await expect(page).toHaveScreenshot('popup-config-required.png');
  });

  test('popup auth section signin tab', async ({ page }) => {
    // Show auth section and ensure signin form is visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();
    
    // Ensure signin tab is active
    const signinTab = page.locator('#signin-tab');
    await signinTab.click();
    
    // Take screenshot of signin form
    await expect(page).toHaveScreenshot('popup-auth-signin.png');
  });

  test('popup auth section signup tab', async ({ page }) => {
    // Show auth section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    // Switch to signup tab and show signup form
    const signupTab = page.locator('#signup-tab');
    await signupTab.click();
    
    await page.evaluate(() => {
      document.getElementById('signin-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
    });
    
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();
    
    // Take screenshot of signup form
    await expect(page).toHaveScreenshot('popup-auth-signup.png');
  });

  test('popup main section authenticated state', async ({ page }) => {
    // Show main section in authenticated state
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      document.getElementById('loading-section').classList.add('hidden');
      
      // Populate user info
      document.getElementById('user-email').textContent = 'test@example.com';
      document.getElementById('page-title').textContent = 'Example Website';
      document.getElementById('page-url').textContent = 'https://example.com';
    });
    
    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    
    // Take screenshot of main section
    await expect(page).toHaveScreenshot('popup-main-authenticated.png');
  });

  test('popup with form validation errors', async ({ page }) => {
    // Show auth section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    // Try to submit empty signin form to show validation
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Add mock validation error message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error';
      errorMsg.textContent = 'Please enter both email and password';
      messageArea.appendChild(errorMsg);
    });
    
    // Take screenshot showing validation error
    await expect(page).toHaveScreenshot('popup-validation-error.png');
  });

  test('popup loading state', async ({ page }) => {
    // Show auth section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    // Fill and submit form
    await page.fill('#signin-email', 'test@example.com');
    await page.fill('#signin-password', 'password123');
    
    const submitButton = page.locator('#signin-submit');
    
    // Simulate loading state
    await page.evaluate(() => {
      const button = document.getElementById('signin-submit');
      button.textContent = 'Signing in...';
      button.disabled = true;
    });
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('popup-loading-state.png');
  });

  test('popup dark mode appearance', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Show auth section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    // Take screenshot in dark mode
    await expect(page).toHaveScreenshot('popup-dark-mode.png');
  });

  test('popup responsive mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Show auth section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
    });
    
    // Take screenshot of mobile view
    await expect(page).toHaveScreenshot('popup-mobile-view.png');
  });

  test('popup with recent bookmarks', async ({ page }) => {
    // Show main section and populate recent bookmarks
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      document.getElementById('loading-section').classList.add('hidden');
      
      // Populate user info
      document.getElementById('user-email').textContent = 'test@example.com';
      
      // Populate recent bookmarks
      const recentList = document.getElementById('recent-list');
      recentList.innerHTML = `
        <li class="recent-bookmark">
          <a href="https://example.com">Example Website</a>
          <span class="bookmark-status read">Read</span>
        </li>
        <li class="recent-bookmark">
          <a href="https://another.com">Another Site</a>
          <span class="bookmark-status unread">Unread</span>
        </li>
      `;
    });
    
    // Wait for recent bookmarks to load
    const recentList = page.locator('#recent-list');
    await expect(recentList).toBeVisible();
    
    // Take screenshot with recent bookmarks
    await expect(page).toHaveScreenshot('popup-with-recent-bookmarks.png');
  });

  test('popup bookmark form states', async ({ page }) => {
    // Show main section and populate form
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      document.getElementById('loading-section').classList.add('hidden');
      
      // Populate user info
      document.getElementById('user-email').textContent = 'test@example.com';
      document.getElementById('page-title').textContent = 'Example Website';
      document.getElementById('page-url').textContent = 'https://example.com';
      
      // Populate status options
      const statusSelect = document.getElementById('bookmark-status-select');
      statusSelect.innerHTML = `
        <option value="">Select status...</option>
        <option value="read">Read</option>
        <option value="unread">Unread</option>
        <option value="later">Read Later</option>
      `;
    });
    
    // Fill bookmark form
    await page.selectOption('#bookmark-status-select', 'read');
    await page.fill('#bookmark-tags', 'web, example, test');
    await page.fill('#bookmark-notes', 'This is a test bookmark with some notes');
    
    // Take screenshot of filled form
    await expect(page).toHaveScreenshot('popup-bookmark-form-filled.png');
  });

  test('popup success message state', async ({ page }) => {
    // Show main section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      document.getElementById('loading-section').classList.add('hidden');
      
      // Populate user info
      document.getElementById('user-email').textContent = 'test@example.com';
    });
    
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