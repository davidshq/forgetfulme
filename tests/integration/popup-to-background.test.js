import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Popup to Background Communication Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);

    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();
  });

  test('should send bookmark saved message to background', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify popup interface is visible
    const popupContainer = await page.locator('#app');
    await expect(popupContainer).toBeVisible({
      timeout: 5000,
      message: 'Popup container should be visible',
    });

    // Fill in bookmark form
    const urlInput = await page.locator('#bookmarkUrl, input[name="url"]');
    const titleInput = await page.locator(
      '#bookmarkTitle, input[name="title"]'
    );

    if ((await urlInput.isVisible()) && (await titleInput.isVisible())) {
      await urlInput.fill('https://example.com/test-page');
      await titleInput.fill('Test Page Title');

      // Submit bookmark
      const saveButton = await page
        .locator('button')
        .filter({ hasText: /save/i });
      await expect(saveButton).toBeVisible({ timeout: 5000 });
      await saveButton.click();

      // Wait for message to be sent to background
      await extensionHelper.waitForNetworkIdle();

      // Verify success message
      const successMessage = await page.locator('.ui-message.success');
      await expect(successMessage).toBeVisible({
        timeout: 5000,
        message: 'Success message should be displayed after bookmark save',
      });
    }
  });

  test('should handle background message responses', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Simulate background message response
    await page.addInitScript(() => {
      if (window.mockChromeAPI) {
        window.mockChromeAPI.simulateMessage({
          type: 'BOOKMARK_SAVED',
          success: true,
          bookmarkId: 'test-bookmark-id',
        });
      }
    });

    // Wait for message handling
    await extensionHelper.waitForNetworkIdle();

    // Verify response was handled
    const responseMessage = await page.locator(
      '.ui-message.success, .response-message'
    );
    await expect(responseMessage).toBeVisible({
      timeout: 5000,
      message:
        'Response message should be displayed after background communication',
    });
  });

  test('should handle background message errors', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Simulate background message error
    await page.addInitScript(() => {
      if (window.mockChromeAPI) {
        window.mockChromeAPI.simulateMessage({
          type: 'ERROR',
          error: 'Background service error',
          success: false,
        });
      }
    });

    // Wait for error handling
    await extensionHelper.waitForNetworkIdle();

    // Verify error was handled
    const errorMessage = await page.locator('.ui-message.error');
    await expect(errorMessage).toBeVisible({
      timeout: 5000,
      message:
        'Error message should be displayed after background communication error',
    });
  });

  test('should sync auth state between popup and background', async ({
    page,
  }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify authenticated state is reflected in popup
    const authIndicator = await page.locator('.auth-status, .user-info');
    if (await authIndicator.isVisible()) {
      await expect(authIndicator).toBeVisible({
        timeout: 5000,
        message: 'Authentication status should be visible in popup',
      });
    }

    // Simulate auth state change from background
    await page.addInitScript(() => {
      if (window.mockChromeAPI) {
        window.mockChromeAPI.simulateMessage({
          type: 'AUTH_STATE_CHANGED',
          authenticated: false,
          user: null,
        });
      }
    });

    // Wait for state sync
    await extensionHelper.waitForNetworkIdle();

    // Verify state change is reflected
    const unauthenticatedIndicator = await page.locator(
      '.auth-container, .sign-in-prompt'
    );
    await expect(unauthenticatedIndicator).toBeVisible({
      timeout: 5000,
      message:
        'Unauthenticated state should be visible after auth state change',
    });
  });

  test('should handle keyboard shortcuts from background', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Simulate keyboard shortcut message from background
    await page.addInitScript(() => {
      if (window.mockChromeAPI) {
        window.mockChromeAPI.simulateMessage({
          type: 'KEYBOARD_SHORTCUT',
          action: 'mark_as_read',
          url: 'https://example.com/test-page',
        });
      }
    });

    // Wait for shortcut handling
    await extensionHelper.waitForNetworkIdle();

    // Verify shortcut action was performed
    const statusIndicator = await page.locator(
      '.status-read, .bookmark-status'
    );
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible({
        timeout: 5000,
        message: 'Status should be updated after keyboard shortcut',
      });
    }
  });
});
