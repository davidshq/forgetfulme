/**
 * @fileoverview Extension helper for Playwright E2E testing
 * @module extension-helper
 * @description Provides utilities for testing Chrome extension functionality with Playwright
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extension helper for Playwright E2E testing
 * @class ExtensionHelper
 * @description Provides utilities for testing Chrome extension functionality with Playwright
 *
 * @example
 * const helper = new ExtensionHelper(page, context);
 * await helper.loadExtension();
 * await helper.openPopup();
 */
class ExtensionHelper {
  /**
   * Initialize the extension helper
   * @constructor
   * @param {import('@playwright/test').Page} page - Playwright page object
   * @param {import('@playwright/test').BrowserContext} context - Playwright browser context
   * @description Sets up the helper with Playwright page and context objects
   */
  constructor(page, context) {
    /** @type {import('@playwright/test').Page} Playwright page object */
    this.page = page;
    /** @type {import('@playwright/test').BrowserContext} Playwright browser context */
    this.context = context;
  }

  /**
   * Load the Chrome extension and return the extension ID
   * @async
   * @method loadExtension
   * @returns {Promise<string>} The extension ID
   * @description Loads the Chrome extension into the browser context and returns the extension ID
   *
   * @example
   * const extensionId = await helper.loadExtension();
   * console.log('Extension loaded with ID:', extensionId);
   */
  async loadExtension() {
    // Load the extension into the browser context
    const extensionId = await this.context.addInitScript(() => {
      return new Promise(resolve => {
        // This will be executed in the browser context
        if (typeof chrome !== 'undefined' && chrome.management) {
          chrome.management.getSelf(extension => {
            resolve(extension.id);
          });
        } else {
          // Fallback for testing
          resolve('test-extension-id');
        }
      });
    });

    return extensionId;
  }

  /**
   * Open the extension popup by navigating directly to popup.html
   */
  async openPopup() {
    // Navigate directly to the popup HTML file
    await this.page.goto('file://' + path.join(__dirname, '../../popup.html'));

    // Wait for popup to be visible
    await this.page.waitForSelector('#app', { timeout: 10000 });
  }

  /**
   * Navigate to the options page
   */
  async openOptions() {
    await this.page.goto(
      'file://' + path.join(__dirname, '../../options.html')
    );
    await this.page.waitForSelector('#app', { timeout: 10000 });
  }

  /**
   * Wait for the extension to be fully loaded
   */
  async waitForExtensionReady() {
    // Wait for the main app container to be present
    await this.page.waitForSelector('#app', { timeout: 10000 });

    // Wait a bit more for any async initialization
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if an element exists and is visible
   */
  async isElementVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * Get text content of an element safely
   */
  async getElementText(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      return await this.page.textContent(selector);
    } catch {
      return null;
    }
  }

  /**
   * Fill a form field safely
   */
  async fillField(selector, value) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.fill(selector, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click a button safely
   */
  async clickButton(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.click(selector);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Select an option from a dropdown safely
   */
  async selectOption(selector, value) {
    try {
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.selectOption(selector, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for a message to appear (success/error)
   */
  async waitForMessage(messageType = 'any') {
    try {
      if (messageType === 'success') {
        await this.page.waitForSelector('.ui-message.success', {
          timeout: 5000,
        });
      } else if (messageType === 'error') {
        await this.page.waitForSelector('.ui-message.error', { timeout: 5000 });
      } else {
        await this.page.waitForSelector('.ui-message', { timeout: 5000 });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mock Chrome API for testing
   */
  async mockChromeAPI() {
    await this.page.addInitScript(() => {
      // Mock chrome.storage API
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      if (!chrome.storage) {
        chrome.storage = {
          sync: {
            get: (keys, callback) => {
              // Mock storage data
              const mockData = {
                auth_session: null,
                supabase_url: 'https://test.supabase.co',
                supabase_anon_key: 'test-key',
              };
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
            // Set a flag to indicate the function was called
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
        };
      }
    });
  }
}

export default ExtensionHelper;
