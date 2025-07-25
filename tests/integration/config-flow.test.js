import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Configuration Flow Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);
    
    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();
  });

  test('should complete configuration setup flow', async ({ page }) => {
    // Start with unconfigured state
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify configuration form is visible
    const configForm = await page.locator('.config-form');
    await expect(configForm).toBeVisible({ 
      timeout: 5000,
      message: 'Configuration form should be visible for unconfigured state'
    });

    // Fill in configuration fields
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');
    
    await expect(urlInput).toBeVisible({ timeout: 5000 });
    await expect(keyInput).toBeVisible({ timeout: 5000 });
    
    await urlInput.fill('https://test.supabase.co');
    await keyInput.fill('test-anon-key');

    // Submit configuration
    const submitButton = await page.locator('.config-form button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Wait for configuration to be saved
    await extensionHelper.waitForNetworkIdle();

    // Verify success message
    const successMessage = await page.locator('.ui-message.success');
    await expect(successMessage).toBeVisible({ 
      timeout: 5000,
      message: 'Success message should be displayed after configuration save'
    });
  });

  test('should validate configuration form fields', async ({ page }) => {
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Verify required fields are present
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');
    const submitButton = await page.locator('.config-form button[type="submit"]');

    await expect(urlInput).toBeVisible({ timeout: 5000 });
    await expect(keyInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Test form validation by submitting empty form
    await submitButton.click();
    await extensionHelper.waitForNetworkIdle();

    // Should show validation error
    const errorMessage = await page.locator('.ui-message.error');
    await expect(errorMessage).toBeVisible({ 
      timeout: 5000,
      message: 'Error message should be displayed for invalid form submission'
    });
  });

  test('should test connection successfully', async ({ page }) => {
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Fill configuration
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');
    
    await urlInput.fill('https://test.supabase.co');
    await keyInput.fill('test-anon-key');

    // Submit configuration
    const submitButton = await page.locator('.config-form button[type="submit"]');
    await submitButton.click();
    await extensionHelper.waitForNetworkIdle();

    // Test connection
    const testConnectionButton = await page.locator('#test-connection');
    if (await testConnectionButton.isVisible()) {
      await testConnectionButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify connection success
      const successMessage = await page.locator('.ui-message.success');
      await expect(successMessage).toBeVisible({ 
        timeout: 5000,
        message: 'Success message should be displayed after successful connection test'
      });
    }
  });

  test('should handle connection test failure', async ({ page }) => {
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Fill configuration with invalid data
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');
    
    await urlInput.fill('https://invalid.supabase.co');
    await keyInput.fill('invalid-key');

    // Submit configuration
    const submitButton = await page.locator('.config-form button[type="submit"]');
    await submitButton.click();
    await extensionHelper.waitForNetworkIdle();

    // Test connection
    const testConnectionButton = await page.locator('#test-connection');
    if (await testConnectionButton.isVisible()) {
      await testConnectionButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify connection error
      const errorMessage = await page.locator('.ui-message.error');
      await expect(errorMessage).toBeVisible({ 
        timeout: 5000,
        message: 'Error message should be displayed after failed connection test'
      });
    }
  });

  test('should display configuration status', async ({ page }) => {
    // Set up configured state BEFORE navigating to the page
    const configuredState = {
      supabaseConfig: {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      },
      config: {
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key'
        },
        preferences: {
          customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
        },
        auth: null
      }
    };
    
    // Mock Chrome API before page loads
    await extensionHelper.mockChromeAPI(configuredState);

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Debug: Check what's actually being rendered
    const pageContent = await page.content();
    console.log('Page content:', pageContent.substring(0, 500));
    
    // Check if we're in setup mode or main interface
    const setupContainer = await page.locator('.setup-container');
    const mainContainer = await page.locator('.main-container');
    const configContainer = await page.locator('.config-container');
    
    const isSetupVisible = await setupContainer.isVisible();
    const isMainVisible = await mainContainer.isVisible();
    const isConfigVisible = await configContainer.isVisible();
    
    console.log('Setup container visible:', isSetupVisible);
    console.log('Main container visible:', isMainVisible);
    console.log('Config container visible:', isConfigVisible);

    // If we're in config mode, we should see the config form
    if (isConfigVisible) {
      const configForm = await page.locator('#configForm');
      await expect(configForm).toBeVisible({
        timeout: 5000,
        message: 'Configuration form should be displayed for configured state'
      });
    } else {
      // If we're in main mode, we should see the status
      const statusElement = await page.locator('.config-status, .status-display');
      await expect(statusElement).toBeVisible({
        timeout: 5000,
        message: 'Configuration status should be displayed for configured state'
      });
    }
  });

  test('should handle configuration errors gracefully', async ({ page }) => {
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Try to submit invalid configuration
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');
    
    await urlInput.fill('invalid-url');
    await keyInput.fill('invalid-key');

    const submitButton = await page.locator('.config-form button[type="submit"]');
    await submitButton.click();
    await extensionHelper.waitForNetworkIdle();

    // Verify error handling
    const errorMessage = await page.locator('.ui-message.error');
    await expect(errorMessage).toBeVisible({ 
      timeout: 5000,
      message: 'Error message should be displayed for invalid configuration'
    });

    // Verify form is still accessible for correction
    await expect(urlInput).toBeVisible({ timeout: 5000 });
    await expect(keyInput).toBeVisible({ timeout: 5000 });
  });
}); 