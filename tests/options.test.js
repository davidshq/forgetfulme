import { test, expect, EXTENSION_PATH } from './helpers/fixtures.js';
import ExtensionHelper from './helpers/extension-helper.js';

test.describe('ForgetfulMe Options Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);

    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();

    // Open the options page
    await extensionHelper.openOptions();

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display configuration interface when not configured', async () => {
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
      'button[type="submit"]',
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
    await extensionHelper.fillField('#supabaseUrl', 'https://test.supabase.co');
    await extensionHelper.fillField(
      '#supabaseAnonKey',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
    );

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.ui-message')).toBeVisible({ timeout: 10_000 });
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
      'Your credentials are stored securely',
    );
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      chrome.storage.sync.get = () =>
        Promise.reject(new Error('storage unavailable'));
    });

    await page.reload();
    await page.waitForSelector('#app', { state: 'attached', timeout: 10_000 });

    expect(await extensionHelper.isAppAttached()).toBe(true);
  });
});
