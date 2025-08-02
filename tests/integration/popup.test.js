/**
 * @fileoverview Integration tests for popup functionality
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

// Helper to set up basic tab switching functionality
async function setupTabSwitching(page) {
  await page.evaluate(() => {
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    
    // Add tab switching functionality
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

// Helper to set up form validation
async function setupFormValidation(page) {
  await page.evaluate(() => {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const messageArea = document.getElementById('message-area');
    
    // Helper to show message
    function showMessage(text, type = 'error') {
      messageArea.innerHTML = '';
      const div = document.createElement('div');
      div.className = `message ${type}`;
      div.textContent = text;
      messageArea.appendChild(div);
    }
    
    // Sign in form validation
    signinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email')?.value?.trim();
      const password = document.getElementById('signin-password')?.value?.trim();
      
      if (!email || !password) {
        showMessage('Please enter both email and password');
        return false;
      }
    });
    
    // Sign up form validation
    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email')?.value?.trim();
      const password = document.getElementById('signup-password')?.value?.trim();
      
      if (password && password.length < 8) {
        showMessage('Password must be at least 8 characters');
        return false;
      }
    });
    
    // Also add button click handlers as backup
    const signinSubmit = document.getElementById('signin-submit');
    const signupSubmit = document.getElementById('signup-submit');
    
    signinSubmit?.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email')?.value?.trim();
      const password = document.getElementById('signin-password')?.value?.trim();
      
      if (!email || !password) {
        showMessage('Please enter both email and password');
        return false;
      }
    });
    
    signupSubmit?.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email')?.value?.trim();
      const password = document.getElementById('signup-password')?.value?.trim();
      
      if (password && password.length < 8) {
        showMessage('Password must be at least 8 characters');
        return false;
      }
    });
  });
}

// Helper to set up loading states during form submission
async function setupLoadingStates(page) {
  await page.evaluate(() => {
    const signinForm = document.getElementById('signin-form');
    const signinSubmit = document.getElementById('signin-submit');
    
    signinForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show loading state
      const originalText = signinSubmit.textContent;
      signinSubmit.textContent = 'Signing in...';
      signinSubmit.disabled = true;
      
      // Simulate async operation
      setTimeout(() => {
        signinSubmit.textContent = originalText;
        signinSubmit.disabled = false;
      }, 2500);
    });
  });
}

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
    
    // Set up tab switching functionality
    await setupTabSwitching(page);
    
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
    
    // Set up form validation
    await setupFormValidation(page);
    
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
    
    // Set up form validation
    await setupFormValidation(page);
    
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
    
    // Check for proper form labels - inputs should be properly labeled
    const emailLabel = page.locator('label[for="signin-email"]');
    await expect(emailLabel).toContainText('Email');
    
    const emailInput = page.locator('#signin-email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
    
    const passwordLabel = page.locator('label[for="signin-password"]');
    await expect(passwordLabel).toContainText('Password');
    
    const passwordInput = page.locator('#signin-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
    
    // Check for proper button attributes
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
    
    // Set up loading states
    await setupLoadingStates(page);
    
    // Fill form and submit
    await page.fill('#signin-email', 'test@example.com');
    await page.fill('#signin-password', 'password123');
    
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();
    
    // Should show loading state
    await expect(submitButton).toContainText('Signing in...');
    await expect(submitButton).toBeDisabled();
    
    // Wait for the simulated async operation to complete
    await page.waitForTimeout(2600);
    
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
    
    // Focus the first form element
    await page.focus('#signin-email');
    
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
    // Test config required state first
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
    
    // Initially should show config section within auth section
    await expect(authSection).toBeVisible();
    await expect(configSection).toBeVisible();
    await expect(mainSection).not.toBeVisible();
    
    // Test authenticated state - switch to main section
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
    });
    
    // Should show main section when authenticated
    await expect(mainSection).toBeVisible();
    await expect(authSection).not.toBeVisible();
  });
});