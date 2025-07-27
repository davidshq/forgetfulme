import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Popup Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);

    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();

    // Open the popup
    await extensionHelper.openPopup();

    // Wait for extension to be ready
    await extensionHelper.waitForExtensionReady();
  });

  test('should display interface when loaded', async ({ page }) => {
    // Test that the interface loads - could be setup or main interface
    const appContainer = await extensionHelper.isElementVisible('#app');
    expect(appContainer).toBeTruthy();

    // Check for either welcome/setup message or main interface
    const hasContent = await page.evaluate(() => {
      const app = document.getElementById('app');
      return app && app.textContent.length > 10; // Has substantial content
    });
    expect(hasContent).toBeTruthy();

    // Check that some button exists (setup or main interface)
    const hasButtons = await page.locator('button').count();
    expect(hasButtons).toBeGreaterThan(0);
  });

  test('should have settings/navigation functionality', async ({ page }) => {
    // Mock the chrome.runtime.openOptionsPage function
    await page.addInitScript(() => {
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.openOptionsPage = () => {
          // Set a flag to indicate the function was called
          window.optionsPageOpened = true;
        };
      }
    });

    // Find any settings-related button (could be "Open Settings" or "⚙️ Settings")
    const settingsButton = await page
      .locator('button')
      .filter({ hasText: /settings|⚙️/i });

    if ((await settingsButton.count()) > 0) {
      // Settings button exists - click it
      await settingsButton.click();
      await page.waitForTimeout(1000);

      // Check that some navigation action occurred
      const hasNavigated = await page.evaluate(() => {
        return (
          window.optionsPageOpened ||
          document.querySelector('.setup-container') ||
          document.querySelector('.auth-form') ||
          window.location.href.includes('options')
        );
      });
      expect(hasNavigated).toBeTruthy();
    } else {
      // No settings button visible - interface should have some other navigation
      const hasOtherButtons = await page.locator('button').count();
      expect(hasOtherButtons).toBeGreaterThan(0);
    }
  });

  test('should have meaningful content sections', async ({ page }) => {
    // Check for any content sections
    const hasSections = await page.evaluate(() => {
      // Look for various possible section types
      const selectors = [
        '.section',
        'section',
        'article',
        '.card',
        '.container',
      ];
      return selectors.some(selector => {
        const elements = document.querySelectorAll(selector);
        return elements.length > 0;
      });
    });
    expect(hasSections).toBeTruthy();

    // Check for meaningful text content (either instructions or interface elements)
    const hasInstructions = await page.evaluate(() => {
      const textContent = document.body.textContent || '';
      return (
        textContent.includes('extension') ||
        textContent.includes('bookmark') ||
        textContent.includes('mark') ||
        textContent.includes('read') ||
        textContent.includes('ForgetfulMe')
      );
    });
    expect(hasInstructions).toBeTruthy();

    // If there are lists, they should contain relevant content
    const lists = await page.locator('ul, ol');
    if ((await lists.count()) > 0) {
      const listContent = await lists.first().textContent();
      expect(listContent.length).toBeGreaterThan(5); // Should have some meaningful content
    }
  });

  test('should have proper layout structure', async ({ page }) => {
    // Check that the app container exists and is structured
    const appContainer = await page.locator('#app');
    expect(await appContainer.isVisible()).toBeTruthy();

    // Check for proper layout elements (various container types)
    const hasLayoutElements = await page.evaluate(() => {
      const layoutSelectors = [
        '.container',
        '.ui-container',
        'main',
        '[role="main"]',
        'header',
        'section',
        'article',
        '.card',
      ];
      return layoutSelectors.some(selector => {
        return document.querySelectorAll(selector).length > 0;
      });
    });
    expect(hasLayoutElements).toBeTruthy();

    // Check that interactive elements exist
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button').length;
      const inputs = document.querySelectorAll(
        'input, select, textarea'
      ).length;
      const links = document.querySelectorAll('a').length;
      return buttons + inputs + links;
    });
    expect(interactiveElements).toBeGreaterThan(0);
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
