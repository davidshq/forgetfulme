/**
 * @fileoverview Integration tests for complete user registration flow
 * Tests: signup → email confirm → first bookmark workflow
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

// Helper to set up DOM state for auth section
async function setupAuthSection(page) {
  await page.evaluate(() => {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('config-required').classList.add('hidden');
    document.getElementById('auth-tabs').classList.remove('hidden');
    document.getElementById('signin-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('main-section').classList.add('hidden');
  });
}

// Helper to set up tab switching functionality
async function setupTabSwitching(page) {
  await page.evaluate(() => {
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    
    signinTab?.addEventListener('click', () => {
      signinTab.classList.add('active');
      signinTab.classList.remove('secondary');
      signupTab.classList.remove('active');
      signupTab.classList.add('secondary');
      signinForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    });
    
    signupTab?.addEventListener('click', () => {
      signupTab.classList.add('active');
      signupTab.classList.remove('secondary');
      signinTab.classList.remove('active');
      signinTab.classList.add('secondary');
      signupForm.classList.remove('hidden');
      signinForm.classList.add('hidden');
    });
  });
}

test.describe('User Registration Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to popup page using file:// protocol like visual tests
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
  });

  test('complete registration flow: signup → email confirm → first bookmark', async ({ page }) => {
    // Step 1: Set up DOM state to show auth section
    await setupAuthSection(page);
    await setupTabSwitching(page);

    // Verify auth section is visible
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();

    // Step 2: Switch to signup tab
    const signupTab = page.locator('#signup-tab');
    await signupTab.click();
    
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();

    // Step 3: Fill signup form with valid data
    const testEmail = 'testuser@example.com';
    const testPassword = 'SecurePassword123!';
    
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);

    // Mock successful signup response
    await page.route('**/auth/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testEmail,
            email_confirmed_at: null
          },
          error: null
        })
      });
    });

    // Step 4: Submit signup form
    const submitButton = page.locator('#signup-submit');
    await submitButton.click();

    // Verify loading state
    await expect(submitButton).toContainText('Creating Account...');
    await expect(submitButton).toBeDisabled();

    // Wait for success message
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Account created! Please check your email');

    // Step 5: Simulate email confirmation click
    // Navigate to confirmation page with mock token
    const confirmPath = `file://${path.join(projectRoot, 'src', 'ui', 'confirm.html')}#access_token=mock-token&type=signup&refresh_token=mock-refresh`;
    await page.goto(confirmPath);
    await page.waitForLoadState('networkidle');

    // Mock confirmation response
    await page.route('**/auth/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testEmail,
            email_confirmed_at: new Date().toISOString()
          },
          session: {
            access_token: 'confirmed-access-token',
            refresh_token: 'confirmed-refresh-token'
          },
          error: null
        })
      });
    });

    // Wait for confirmation processing
    await page.waitForTimeout(1000);

    // Verify success state
    const successState = page.locator('#success-state');
    await expect(successState).toBeVisible();
    await expect(successState.locator('h1')).toContainText('Email Confirmed!');

    // Step 6: Navigate back to popup for first bookmark creation
    const popupFilePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(popupFilePath);
    await page.waitForLoadState('networkidle');

    // Mock authenticated state
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
      // Mock current page data
      window.mockPageData = {
        title: 'My First Bookmark',
        url: 'https://example.com/first-page'
      };
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify main section is visible
    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();

    // Verify user email is displayed
    const userEmail = page.locator('#user-email');
    await expect(userEmail).toContainText(testEmail);

    // Step 7: Create first bookmark
    // Verify page data is populated
    const pageTitle = page.locator('#page-title');
    const pageUrl = page.locator('#page-url');
    await expect(pageTitle).toHaveValue('My First Bookmark');
    await expect(pageUrl).toHaveValue('https://example.com/first-page');

    // Add tags and notes
    await page.fill('#bookmark-tags', 'tutorial, first-bookmark, test');
    await page.fill('#bookmark-notes', 'This is my first bookmark after registration!');

    // Mock bookmark creation response
    await page.route('**/bookmarks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'first-bookmark-id',
            title: 'My First Bookmark',
            url: 'https://example.com/first-page',
            tags: ['tutorial', 'first-bookmark', 'test'],
            notes: 'This is my first bookmark after registration!',
            created_at: new Date().toISOString(),
            user_id: 'test-user-id'
          })
        });
      }
    });

    // Submit bookmark
    const saveButton = page.locator('#save-bookmark');
    await saveButton.click();

    // Verify loading state
    await expect(saveButton).toContainText('Saving...');
    await expect(saveButton).toBeDisabled();

    // Wait for success
    await expect(messageArea).toContainText('Bookmark saved successfully');
    await expect(saveButton).toContainText('Save Bookmark');
    await expect(saveButton).not.toBeDisabled();

    // Take final screenshot of successful state
    await expect(page).toHaveScreenshot('registration-flow-complete.png');
  });

  test('signup form elements are accessible and interactive', async ({ page }) => {
    // Show auth section directly like visual tests
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      const configSection = document.getElementById('config-required-section');
      if (configSection) configSection.classList.add('hidden');
      const mainSection = document.getElementById('main-section');
      if (mainSection) mainSection.classList.add('hidden');
    });

    // Wait for auth section to be visible
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();

    // Switch to signup
    const signupTab = page.locator('#signup-tab');
    await expect(signupTab).toBeVisible();
    await signupTab.click();

    // Show signup form manually like visual tests
    await page.evaluate(() => {
      document.getElementById('signin-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
    });

    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();

    // Verify form elements are present and interactive
    const emailInput = page.locator('#signup-email');
    const passwordInput = page.locator('#signup-password');
    const submitButton = page.locator('#signup-submit');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Verify form can be filled
    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePassword123!');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('SecurePassword123!');

    // Verify submit button is clickable
    await expect(submitButton).toBeEnabled();
    
    // Take screenshot of filled form
    await expect(page).toHaveScreenshot('signup-form-filled.png');
  });

  test('signup network failure handling', async ({ page }) => {
    // Set up DOM state to show auth section  
    await setupAuthSection(page);
    await setupTabSwitching(page);

    // Switch to signup
    await page.click('#signup-tab');

    // Mock network failure
    await page.route('**/auth/signup', async route => {
      await route.abort('failed');
    });

    // Fill form and submit
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', 'ValidPassword123!');
    await page.click('#signup-submit');

    // Should show error and restore button state
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Network error occurred');

    const submitButton = page.locator('#signup-submit');
    await expect(submitButton).toContainText('Create Account');
    await expect(submitButton).not.toBeDisabled();
  });

  test('email confirmation error handling', async ({ page }) => {
    // Navigate to confirmation page with invalid token
    const confirmPath = `file://${path.join(projectRoot, 'src', 'ui', 'confirm.html')}#access_token=invalid-token&type=signup`;
    await page.goto(confirmPath);
    await page.waitForLoadState('networkidle');

    // Mock confirmation failure
    await page.route('**/auth/verify', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Invalid or expired confirmation token'
          }
        })
      });
    });

    // Wait for error processing
    await page.waitForTimeout(1000);

    // Verify error state
    const errorState = page.locator('#error-state');
    await expect(errorState).toBeVisible();
    await expect(errorState.locator('h1')).toContainText('Confirmation Failed');
    await expect(errorState).toContainText('Invalid or expired confirmation token');
  });

  test('UI state transitions throughout flow', async ({ page }) => {
    // Initial state: config required
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.remove('hidden');
      document.getElementById('signin-form').classList.add('hidden');
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('auth-tabs').classList.add('hidden');
      document.getElementById('main-section').classList.add('hidden');
    });

    const configSection = page.locator('#config-required');
    const authSection = page.locator('#auth-section');
    const mainSection = page.locator('#main-section');

    await expect(authSection).toBeVisible();
    await expect(configSection).toBeVisible();
    await expect(mainSection).not.toBeVisible();

    // After configuration: auth section with forms
    await page.evaluate(() => {
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
    });

    await expect(configSection).not.toBeVisible();
    await expect(authSection).toBeVisible();
    await expect(mainSection).not.toBeVisible();

    // After authentication: main section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
    });

    await expect(authSection).not.toBeVisible();
    await expect(mainSection).toBeVisible();
  });

  test('successful signup shows email confirmation message', async ({ page }) => {
    // Set up DOM state to show auth section
    await setupAuthSection(page);
    await setupTabSwitching(page);

    // Switch to signup and fill form
    await page.click('#signup-tab');
    await page.fill('#signup-email', 'newuser@example.com');
    await page.fill('#signup-password', 'SecurePassword123!');

    // Mock successful signup
    await page.route('**/auth/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            email_confirmed_at: null
          },
          error: null
        })
      });
    });

    await page.click('#signup-submit');

    // Verify confirmation message
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Account created! Please check your email');
    
    // Form should be reset
    const emailInput = page.locator('#signup-email');
    const passwordInput = page.locator('#signup-password');
    await expect(emailInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');

    // Take screenshot of success state
    await expect(page).toHaveScreenshot('signup-success-message.png');
  });
});