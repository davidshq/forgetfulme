import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Bookmark Management Setup Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);

    // Mock Chrome API with unconfigured state
    await page.addInitScript(() => {
      // Mock Chrome API
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      if (!chrome.storage) {
        chrome.storage = {
          sync: {
            get: (keys, callback) => {
              // Mock storage data - unconfigured
              const mockData = {};
              callback(mockData);
            },
            set: (data, callback) => {
              if (callback) callback();
            },
          },
          local: {
            get: (keys, callback) => {
              callback({});
            },
            set: (data, callback) => {
              if (callback) callback();
            },
          },
        };
      }

      // Mock chrome.runtime API
      if (!chrome.runtime) {
        chrome.runtime = {
          onMessage: {
            addListener: () => {},
          },
          sendMessage: (message, callback) => {
            if (callback) callback({ success: true });
          },
          openOptionsPage: () => {
            window.optionsPageOpened = true;
          },
        };
      }

      // Mock chrome.tabs API
      if (!chrome.tabs) {
        chrome.tabs = {
          query: (queryInfo, callback) => {
            callback([
              {
                url: 'https://example.com',
                title: 'Test Page',
              },
            ]);
          },
          create: (options) => {
            window.tabCreated = options;
          },
        };
      }
    });

    // Open the bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display setup interface when not configured', async ({ page }) => {
    // Wait for the interface to load
    await page.waitForTimeout(2000);

    // Check for setup interface elements
    const setupContainer = await extensionHelper.isElementVisible('.setup-container');
    expect(setupContainer).toBeTruthy();

    const welcomeText = await extensionHelper.getElementText('.ui-container-header h2');
    expect(welcomeText).toContain('Welcome to ForgetfulMe');

    const setupSection = await extensionHelper.isElementVisible('.setup-section');
    expect(setupSection).toBeTruthy();

    const settingsBtn = await extensionHelper.isElementVisible('button');
    expect(settingsBtn).toBeTruthy();
  });

  test('should have settings button that calls openOptionsPage', async ({ page }) => {
    // Wait for the interface to load
    await page.waitForTimeout(2000);

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
    // Wait for the interface to load
    await page.waitForTimeout(2000);

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
    // Wait for the interface to load
    await page.waitForTimeout(2000);

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
}); 