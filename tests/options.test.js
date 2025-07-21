import { test, expect } from '@playwright/test';
import ExtensionHelper from './helpers/extension-helper.js';

test.describe('ForgetfulMe Options Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);

    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();

    // Open the options page
    await extensionHelper.openOptions();

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display configuration interface when not configured', async ({
    _page,
  }) => {
    // Test that the configuration interface is shown
    const configContainer =
      await extensionHelper.isElementVisible('.config-container');
    expect(configContainer).toBeTruthy();

    // Check for configuration form elements
    const urlInput = await extensionHelper.isElementVisible('#supabaseUrl');
    expect(urlInput).toBeTruthy();

    const keyInput = await extensionHelper.isElementVisible('#supabaseAnonKey');
    expect(keyInput).toBeTruthy();

    // Check for save button
    const saveBtn = await extensionHelper.isElementVisible(
      'button[type="submit"]'
    );
    expect(saveBtn).toBeTruthy();
  });

  test('should have proper form validation', async ({ page }) => {
    // Check that form validation is in place
    const urlInput = await page.locator('#supabaseUrl');
    const keyInput = await page.locator('#supabaseAnonKey');

    // Both fields should be required
    expect(await urlInput.getAttribute('required')).not.toBeNull();
    expect(await keyInput.getAttribute('required')).not.toBeNull();

    // Check that URL input has proper type
    expect(await urlInput.getAttribute('type')).toBe('url');
  });

  test('should handle form submission', async ({ page }) => {
    // Fill in the form with test data
    await extensionHelper.fillField('#supabaseUrl', 'https://test.supabase.co');
    await extensionHelper.fillField('#supabaseAnonKey', 'test-anon-key');

    // Submit the form
    const submitButton = await page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for submission to complete
    await page.waitForTimeout(2000);

    // Check that the form was submitted (should show success or error message)
    const messageVisible = await extensionHelper.waitForMessage('any');
    expect(messageVisible).toBeTruthy();
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Check that the container has proper styling
    const container = await page.locator('.ui-container');
    expect(await container.isVisible()).toBeTruthy();

    // Check that form elements are properly styled
    const inputs = await page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Check that buttons have proper styling
    const buttons = await page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should display help instructions', async ({ page }) => {
    // Check for help section
    const helpSection = await page.locator('.config-help');
    expect(await helpSection.isVisible()).toBeTruthy();

    // Check for numbered list of instructions
    const instructions = await page.locator('.config-help ol li');
    const instructionCount = await instructions.count();
    expect(instructionCount).toBeGreaterThan(0);

    // Check for the note about security
    const note = await page.locator('.config-note');
    expect(await note.isVisible()).toBeTruthy();
    expect(await note.textContent()).toContain(
      'Your credentials are stored securely'
    );
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock an error condition by modifying the Chrome API
    await page.addInitScript(() => {
      // Override chrome.storage to simulate an error
      if (chrome.storage) {
        chrome.storage.sync.get = (keys, callback) => {
          // Simulate an error
          callback(null);
        };
      }
    });

    // Reload the page to trigger the error
    await page.reload();
    await extensionHelper.waitForExtensionReady();

    // The page should still load and show some interface
    const appContainer = await extensionHelper.isElementVisible('#app');
    expect(appContainer).toBeTruthy();
  });
});
