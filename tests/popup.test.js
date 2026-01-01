import { test, expect, EXTENSION_PATH } from './helpers/fixtures.js';
import ExtensionHelper from './helpers/extension-helper.js';

test.describe('ForgetfulMe Popup Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);

    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();

    // Open the popup
    await extensionHelper.openPopup();

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display setup interface when not configured', async ({
    page,
  }) => {
    // Test that the setup interface is shown
    const setupContainer =
      await extensionHelper.isElementVisible('.setup-container');
    expect(setupContainer).toBeTruthy();

    // Check for welcome message in the container header
    const welcomeText = await extensionHelper.getElementText(
      '.ui-container-header h2'
    );
    expect(welcomeText).toContain('Welcome to ForgetfulMe');

    // Check for setup instructions
    const setupSection =
      await extensionHelper.isElementVisible('.setup-section');
    expect(setupSection).toBeTruthy();

    // Check for settings button
    const settingsBtn = await extensionHelper.isElementVisible('button');
    expect(settingsBtn).toBeTruthy();
  });

  test('should have settings button that calls openOptionsPage', async ({
    page,
  }) => {
    // Ensure the flag is initialized
    await page.evaluate(() => {
      window.optionsPageOpened = false;
    });

    // Find and click the settings button
    const settingsButton = await page
      .locator('button')
      .filter({ hasText: 'Open Settings' });
    expect(await settingsButton.isVisible()).toBeTruthy();

    // Click the settings button
    await settingsButton.click();

    // Wait a moment for the function to be called
    await page.waitForTimeout(1000);

    // Check that the openOptionsPage function was called
    const optionsPageOpened = await page.evaluate(
      () => window.optionsPageOpened
    );
    expect(optionsPageOpened).toBeTruthy();
  });

  test('should display how it works section', async ({ page }) => {
    // Check for the second section which contains the "How it works" content
    const sections = await page.locator('.section');
    expect(await sections.count()).toBe(2);

    // The second section should contain the list of features
    const secondSection = sections.nth(1);
    expect(await secondSection.isVisible()).toBeTruthy();

    // Check for the list of features
    const featuresList = await page.locator('.section ul');
    expect(await featuresList.isVisible()).toBeTruthy();

    // Verify the list contains expected items
    const listItems = await page.locator('.section ul li');
    const itemCount = await listItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Check that the list contains the expected content
    const listText = await page.locator('.section ul').textContent();
    expect(listText).toContain('Click the extension icon');
    expect(listText).toContain('Choose a status');
    expect(listText).toContain('Add tags');
    expect(listText).toContain('View your recent entries');
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Check that the container has proper styling
    const container = await page.locator('.ui-container');
    expect(await container.isVisible()).toBeTruthy();

    // Check that sections are properly styled
    const sections = await page.locator('.section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    // Check that buttons have proper styling
    const buttons = await page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
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
