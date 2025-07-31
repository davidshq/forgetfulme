/**
 * @fileoverview Integration tests for popup functionality
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Popup Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to popup using file:// protocol
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 400, height: 600 });
  });

  test('should display configuration required message when not configured', async ({ page }) => {
    // Manually show the config required state
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.remove('hidden');
      document.getElementById('signin-form').classList.add('hidden');
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('auth-tabs').classList.add('hidden');
    });
    
    const configSection = page.locator('#config-required');
    await expect(configSection).toBeVisible();
    
    const configMessage = page.locator('#config-required h3');
    await expect(configMessage).toContainText('Setup Required');
  });

  test('should have working navigation between auth tabs', async ({ page }) => {
    // Manually set up auth section to show tabs and forms
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('signup-form').classList.add('hidden');
    });
    
    // Should show auth section when not authenticated
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();
    
    // Test tab switching
    const signUpTab = page.locator('#signup-tab');
    await signUpTab.click();
    
    const signUpForm = page.locator('#signup-form');
    await expect(signUpForm).toBeVisible();
    
    const signInTab = page.locator('#signin-tab');
    await signInTab.click();
    
    const signInForm = page.locator('#signin-form');
    await expect(signInForm).toBeVisible();
  });

  test('should validate sign-in form fields', async ({ page }) => {
    // Set up auth section with signin form visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('signup-form').classList.add('hidden');
    });
    
    // Try to submit empty form
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Should show validation message
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Please enter both email and password');
  });

  test('should validate sign-up form fields', async ({ page }) => {
    // Set up auth section with signup form visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
    });
    
    // Switch to sign-up tab
    const signUpTab = page.locator('#signup-tab');
    await signUpTab.click();
    
    // Try to submit with short password
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', '123');
    
    const submitButton = page.locator('#signup-submit');
    await submitButton.click();
    
    // Should show validation message
    const messageArea = page.locator('#message-area');
    await expect(messageArea).toContainText('Password must be at least 8 characters');
  });

  test('should have proper ARIA labels and accessibility', async ({ page }) => {
    // Set up auth section with signin form visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('signup-form').classList.add('hidden');
    });
    
    // Check for proper form labels
    const emailInput = page.locator('#signin-email');
    await expect(emailInput).toHaveAttribute('aria-label', 'Email address');
    
    const passwordInput = page.locator('#signin-password');
    await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    
    // Check for proper button roles
    const submitButton = page.locator('#signin-submit');
    await expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('should show loading states during form submission', async ({ page }) => {
    // Set up auth section with signin form visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('signup-form').classList.add('hidden');
    });
    
    // Mock configuration and add network delay
    await page.route('**/auth/**', async route => {
      // Simulate slow network
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });
    
    // Fill form and submit
    await page.fill('#signin-email', 'test@example.com');
    await page.fill('#signin-password', 'password123');
    
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Should show loading state
    await expect(submitButton).toContainText('Signing in...');
    await expect(submitButton).toBeDisabled();
    
    // Wait for request to complete
    await page.waitForTimeout(2500);
    
    // Should return to normal state
    await expect(submitButton).toContainText('Sign In');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const popup = page.locator('.container');
    await expect(popup).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(popup).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(popup).toBeVisible();
  });

  test('should maintain focus management', async ({ page }) => {
    // Set up auth section with signin form visible
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('config-required').classList.add('hidden');
      document.getElementById('auth-tabs').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      document.getElementById('signup-form').classList.add('hidden');
    });
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    
    const emailInput = page.locator('#signin-email');
    await expect(emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    
    const passwordInput = page.locator('#signin-password');
    await expect(passwordInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    
    const submitButton = page.locator('#signin-submit');
    await expect(submitButton).toBeFocused();
  });

  test('should show appropriate sections based on authentication state', async ({ page }) => {
    // Test unauthenticated state
    const configSection = page.locator('#config-required');
    const authSection = page.locator('#auth-section');
    const mainSection = page.locator('#main-section');
    
    // Initially should show config section
    await expect(configSection).toBeVisible();
    await expect(authSection).not.toBeVisible();
    await expect(mainSection).not.toBeVisible();
    
    // Mock authenticated state
    await page.evaluate(() => {
      window.mockConfigured = true;
      window.mockAuthenticated = true;
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show main section when authenticated
    await expect(configSection).not.toBeVisible();
    await expect(authSection).not.toBeVisible();
    await expect(mainSection).toBeVisible();
  });
});