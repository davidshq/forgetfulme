/**
 * @fileoverview Visual regression tests for options page UI
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Options Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'options.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('options page default state', async ({ page }) => {
    // Take screenshot of default options page
    await expect(page).toHaveScreenshot('options-default-state.png');
  });

  test('options supabase configuration section', async ({ page }) => {
    const configSection = page.locator('#database-section');
    await expect(configSection).toBeVisible();
    
    // Fill in some example configuration
    await page.fill('#supabase-url', 'https://example.supabase.co');
    await page.fill('#supabase-key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    
    // Take screenshot with configuration filled
    await expect(page).toHaveScreenshot('options-supabase-config-filled.png');
  });

  test('options status types management', async ({ page }) => {
    // Set up navigation functionality and show status types section directly
    await page.evaluate(() => {
      // Hide database section, show status types section
      document.getElementById('database-section').classList.add('hidden');
      document.getElementById('status-types-section').classList.remove('hidden');
      
      // Update nav button states
      document.getElementById('nav-database').classList.remove('active');
      document.getElementById('nav-status-types').classList.add('active');
    });
    
    const statusSection = page.locator('#status-types-section');
    await expect(statusSection).toBeVisible();
    
    // Mock some existing status types
    await page.evaluate(() => {
      window.mockStatusTypes = [
        { id: 'read', name: 'Read', color: '#22c55e', description: 'Completely read' },
        { id: 'unread', name: 'Unread', color: '#ef4444', description: 'Not read yet' },
        { id: 'in-progress', name: 'In Progress', color: '#f59e0b', description: 'Currently reading' }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot with status types
    await expect(page).toHaveScreenshot('options-status-types-list.png');
  });

  test('options add new status type form', async ({ page }) => {
    // Set up navigation and show status types section directly
    await page.evaluate(() => {
      // Hide database section, show status types section
      document.getElementById('database-section').classList.add('hidden');
      document.getElementById('status-types-section').classList.remove('hidden');
      
      // Update nav button states
      document.getElementById('nav-database').classList.remove('active');
      document.getElementById('nav-status-types').classList.add('active');
    });
    
    // Fill new status type form (it's always visible)
    await page.fill('#status-name', 'Bookmarked');
    await page.fill('#status-color', '#8b5cf6');
    await page.fill('#status-id', 'bookmarked');
    
    // Take screenshot of add form
    await expect(page).toHaveScreenshot('options-add-status-type-form.png');
  });

  test('options connection test states', async ({ page }) => {
    // Fill configuration
    await page.fill('#supabase-url', 'https://example.supabase.co');
    await page.fill('#supabase-key', 'test-key');
    
    // Set up button click handler to simulate loading state
    await page.evaluate(() => {
      const testButton = document.getElementById('test-connection');
      testButton.addEventListener('click', (e) => {
        e.preventDefault();
        testButton.textContent = 'Testing...';
        testButton.disabled = true;
        
        // Simulate async test completion
        setTimeout(() => {
          testButton.textContent = 'Test Connection';
          testButton.disabled = false;
        }, 2000);
      });
    });
    
    // Test connection button
    const testButton = page.locator('#test-connection');
    await testButton.click();
    
    // Wait for loading state
    await expect(testButton).toContainText('Testing...');
    
    // Take screenshot of testing state
    await expect(page).toHaveScreenshot('options-connection-testing.png');
  });

  test('options success message state', async ({ page }) => {
    // Simulate success message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const successMsg = document.createElement('div');
      successMsg.className = 'message success';
      successMsg.textContent = 'Configuration saved successfully!';
      messageArea.appendChild(successMsg);
    });
    
    // Take screenshot with success message
    await expect(page).toHaveScreenshot('options-success-message.png');
  });

  test('options error message state', async ({ page }) => {
    // Simulate error message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error';
      errorMsg.textContent = 'Failed to connect to Supabase. Please check your configuration.';
      messageArea.appendChild(errorMsg);
    });
    
    // Take screenshot with error message
    await expect(page).toHaveScreenshot('options-error-message.png');
  });

  test('options user preferences section', async ({ page }) => {
    // Navigate to preferences section
    await page.click('#nav-preferences');
    
    // Manually show the section since JS navigation might not work
    await page.evaluate(() => {
      // Hide all sections first
      document.querySelectorAll('.options-section').forEach(section => {
        section.classList.add('hidden');
      });
      // Show preferences section
      document.getElementById('preferences-section').classList.remove('hidden');
      
      // Set some checkbox states
      document.getElementById('show-notifications').checked = true;
      document.getElementById('auto-sync').checked = false;
      document.getElementById('items-per-page').value = '10';
    });
    
    const prefsSection = page.locator('#preferences-section');
    await expect(prefsSection).toBeVisible();
    
    // Take screenshot of preferences
    await expect(page).toHaveScreenshot('options-user-preferences.png');
  });

  test('options dark mode appearance', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot in dark mode
    await expect(page).toHaveScreenshot('options-dark-mode.png');
  });

  test('options mobile responsive view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of mobile view
    await expect(page).toHaveScreenshot('options-mobile-view.png');
  });

  test('options form validation errors', async ({ page }) => {
    // Try to save invalid configuration
    await page.fill('#supabase-url', 'invalid-url');
    await page.fill('#supabase-key', '');
    
    const saveButton = page.locator('#save-database');
    await saveButton.click();
    
    // Add mock validation error message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error';
      errorMsg.textContent = 'Please enter a valid Supabase URL';
      messageArea.appendChild(errorMsg);
    });
    
    // Take screenshot with validation errors
    await expect(page).toHaveScreenshot('options-validation-errors.png');
  });
});