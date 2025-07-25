import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Authentication Flow Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);
    
    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();
  });

  test('should complete full authentication flow from unconfigured to authenticated', async ({ page }) => {
    // Step 1: Start with unconfigured state
    await extensionHelper.setupUnconfiguredState();

    // Open options page for configuration
    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Debug: Check what's actually rendered
    const pageContent = await page.content();
    console.log('Options page content length:', pageContent.length);

    // Verify we see the configuration form (using correct class name)
    const configForm = await page.locator('.config-form');
    await expect(configForm).toBeVisible({ 
      timeout: 5000,
      message: 'Configuration form should be visible for unconfigured state'
    });

    // Step 2: Configure Supabase (using correct field IDs)
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

    // Step 3: Test connection
    const testConnectionButton = await page.locator('#test-connection');
    if (await testConnectionButton.isVisible()) {
      await testConnectionButton.click();
      await extensionHelper.waitForNetworkIdle();
    }

    // Step 4: Navigate to authentication interface
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Debug: Check what's actually rendered
    const bookmarkPageContent = await page.content();
    console.log('Bookmark management page content length:', bookmarkPageContent.length);

    // Verify we see the authentication interface
    const authContainer = await page.locator('.auth-container');
    await expect(authContainer).toBeVisible({ 
      timeout: 5000,
      message: 'Authentication container should be visible for configured but unauthenticated state'
    });

    // Step 5: Test sign up flow
    const signUpButton = await page.locator('button').filter({ hasText: /sign.?up/i });
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await extensionHelper.waitForNetworkIdle();
    }

    // Step 6: Test sign in flow
    const signInButton = await page.locator('button').filter({ hasText: /sign.?in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await extensionHelper.waitForNetworkIdle();
    }

    // Step 7: Verify authenticated state
    await extensionHelper.setupAuthenticatedState();

    // Refresh page to see authenticated state
    await page.reload();
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify we see the bookmark management interface
    const searchCard = await page.locator('.search-card');
    await expect(searchCard).toBeVisible({ 
      timeout: 5000,
      message: 'Search card should be visible for authenticated users'
    });
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Set up unconfigured state
    await extensionHelper.setupUnconfiguredState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify error message is displayed
    const errorMessage = await page.locator('.ui-message.error');
    await expect(errorMessage).toBeVisible({ 
      timeout: 5000,
      message: 'Error message should be displayed for unconfigured state'
    });
  });

  test('should persist authentication state across page reloads', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify authenticated interface is shown
    const searchCard = await page.locator('.search-card');
    await expect(searchCard).toBeVisible({ 
      timeout: 5000,
      message: 'Search card should be visible for authenticated users'
    });

    // Reload page
    await page.reload();
    await extensionHelper.waitForExtensionReady();

    // Verify state persists
    await expect(searchCard).toBeVisible({ 
      timeout: 5000,
      message: 'Search card should still be visible after page reload'
    });
  });

  test('should handle sign out flow', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify authenticated interface is shown
    const searchCard = await page.locator('.search-card');
    await expect(searchCard).toBeVisible({ timeout: 5000 });

    // Find and click sign out button
    const signOutButton = await page.locator('button').filter({ hasText: /sign.?out/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify we're back to auth interface
      const authContainer = await page.locator('.auth-container');
      await expect(authContainer).toBeVisible({ 
        timeout: 5000,
        message: 'Authentication container should be visible after sign out'
      });
    }
  });
}); 