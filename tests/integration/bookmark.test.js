/**
 * @fileoverview Bookmark management integration tests for ForgetfulMe extension
 * @module bookmark.test
 * @description Tests bookmark management interface states and functionality
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Bookmark Management Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);

    // Set up mocks before navigating to the page
    await page.addInitScript(() => {
      // Mock Chrome API
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      if (!chrome.storage) {
        chrome.storage = {
          sync: {
            get: (keys, callback) => {
              // Mock storage data - unconfigured by default
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
          create: options => {
            window.tabCreated = options;
          },
        };
      }
    });

    // Open the bookmark management page using the web server
    await page.goto('http://localhost:3000/bookmark-management.html');

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display setup interface when not configured', async ({
    page,
  }) => {
    // Wait for the interface to load
    await page.waitForTimeout(2000);

    // Check for setup interface elements
    const setupContainer =
      await extensionHelper.isElementVisible('.setup-container');
    expect(setupContainer).toBeTruthy();

    const welcomeText = await extensionHelper.getElementText(
      'header h2'
    );
    expect(welcomeText).toContain('Welcome to ForgetfulMe');

    const setupSection =
      await extensionHelper.isElementVisible('.setup-section');
    expect(setupSection).toBeTruthy();

    const settingsBtn = await extensionHelper.isElementVisible('button');
    expect(settingsBtn).toBeTruthy();
  });

  test('should have settings button that calls openOptionsPage', async ({
    page,
  }) => {
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
    const container = await page.locator('.container');
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

  test('should display authentication interface when not authenticated', async ({
    page,
  }) => {
    // Mock configured but not authenticated state BEFORE page load
    await page.addInitScript(() => {
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }
      if (!chrome.storage) {
        chrome.storage = {
          sync: {
            get: (keys, callback) => {
              callback({
                auth_session: null,
                supabase_url: 'https://test.supabase.co',
                supabase_anon_key: 'test-key',
              });
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
      if (!chrome.runtime) {
        chrome.runtime = {
          onMessage: { addListener: () => {} },
          sendMessage: (message, callback) => {
            if (callback) callback({ success: true });
          },
          openOptionsPage: () => {
            window.optionsPageOpened = true;
          },
        };
      }
      if (!chrome.tabs) {
        chrome.tabs = {
          query: (queryInfo, callback) => {
            callback([{ url: 'https://example.com', title: 'Test Page' }]);
          },
          create: options => {
            window.tabCreated = options;
          },
        };
      }
    });
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await page.waitForTimeout(2000);
    // Check for auth interface
    const authContainer =
      await extensionHelper.isElementVisible('.auth-container');
    expect(authContainer).toBeTruthy();
    const authTitle =
      await extensionHelper.getElementText('.auth-container h2');
    expect(authTitle).toContain('Authentication Required');
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

    // Wait for the interface to load
    await page.waitForTimeout(2000);

    // The page should still load and show some interface
    const appContainer = await extensionHelper.isElementVisible('#app');
    expect(appContainer).toBeTruthy();
  });

  test('should validate interface data format', async ({ page }) => {
    // Wait for the interface to load
    await page.waitForTimeout(2000);

    // Check that the interface has required elements
    const appContainer = await page.locator('#app');
    expect(await appContainer.isVisible()).toBeTruthy();

    // Check for welcome message
    const welcomeTitle = await page.locator('header h2');
    expect(await welcomeTitle.isVisible()).toBeTruthy();
    const titleText = await welcomeTitle.textContent();
    expect(titleText).toBeTruthy();

    // Check for description
    const description = await page.locator('header p');
    expect(await description.isVisible()).toBeTruthy();
    const descText = await description.textContent();
    expect(descText).toBeTruthy();

    // Check for setup instructions
    const setupInstructions = await page.locator('.setup-section ol');
    expect(await setupInstructions.isVisible()).toBeTruthy();
  });
});
