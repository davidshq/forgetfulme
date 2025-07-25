/**
 * @fileoverview Playwright utilities for integration tests
 * @module playwright-utils
 * @description Utilities for setting up Playwright test contexts and mocking Chrome APIs
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { TEST_SUPABASE_CONFIG, TEST_USER } from '../../shared/constants.js';

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
export class ExtensionHelper {
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
    /** @type {Object} Chrome storage manager for testing */
    this.storageManager = null;
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
    // Navigate to popup HTML file via web server
    await this.page.goto('http://localhost:3000/popup.html');

    // Wait for popup to be visible
    await this.page.waitForSelector('#app', { timeout: 10000 });
  }

  /**
   * Navigate to the options page
   */
  async openOptions() {
    await this.page.goto('http://localhost:3000/options.html');
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
   * Check if an element is visible on the page
   * @param {string} selector - CSS selector for the element
   * @returns {Promise<boolean>} Whether the element is visible
   */
  async isElementVisible(selector) {
    try {
      const element = await this.page.locator(selector);
      return await element.isVisible();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get text content of an element
   * @param {string} selector - CSS selector for the element
   * @returns {Promise<string>} Text content of the element
   */
  async getElementText(selector) {
    const element = await this.page.locator(selector);
    return await element.textContent();
  }

  /**
   * Fill a form field
   * @param {string} selector - CSS selector for the field
   * @param {string} value - Value to fill
   */
  async fillField(selector, value) {
    const field = await this.page.locator(selector);
    await field.fill(value);
  }

  /**
   * Click a button
   * @param {string} selector - CSS selector for the button
   */
  async clickButton(selector) {
    const button = await this.page.locator(selector);
    await button.click();
  }

  /**
   * Select an option from a dropdown
   * @param {string} selector - CSS selector for the dropdown
   * @param {string} value - Value to select
   */
  async selectOption(selector, value) {
    const dropdown = await this.page.locator(selector);
    await dropdown.selectOption(value);
  }

  /**
   * Wait for a specific message type
   * @param {string} messageType - Type of message to wait for ('success', 'error', 'any')
   */
  async waitForMessage(messageType = 'any') {
    const selector =
      messageType === 'any' ? '.ui-message' : `.ui-message.${messageType}`;
    await this.page.waitForSelector(selector, { timeout: 10000 });
  }

  /**
   * Mock Chrome APIs for testing
   * @param {Object} initialState - Initial state for Chrome storage
   */
  async mockChromeAPI(initialState = {}) {
    // Set up Chrome API mocking in the browser context
    await this.page.addInitScript(initialData => {
      // Chrome Storage Manager for Integration Tests
      class IntegrationChromeStorageManager {
        constructor(initialData = {}) {
          this.data = { ...initialData };
          this.listeners = [];
          this.errorListeners = [];
        }

        get(keys, callback) {
          try {
            const result = {};
            if (keys === null || keys === undefined) {
              // Return all data
              Object.assign(result, this.data);
            } else if (typeof keys === 'string') {
              // Single key
              result[keys] = this.data[keys];
            } else if (Array.isArray(keys)) {
              // Array of keys
              keys.forEach(key => {
                result[key] = this.data[key];
              });
            } else if (typeof keys === 'object') {
              // Object with default values
              Object.keys(keys).forEach(key => {
                result[key] =
                  this.data[key] !== undefined ? this.data[key] : keys[key];
              });
            }

            if (callback) {
              setTimeout(() => callback(result), 0);
            }
            return Promise.resolve(result);
          } catch (error) {
            this.notifyErrorListeners('get', error);
            if (callback) {
              setTimeout(() => callback({}), 0);
            }
            return Promise.resolve({});
          }
        }

        set(data, callback) {
          try {
            const changes = {};
            Object.keys(data).forEach(key => {
              const oldValue = this.data[key];
              this.data[key] = data[key];
              changes[key] = { oldValue, newValue: data[key] };
            });

            this.notifyListeners(changes);

            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          } catch (error) {
            this.notifyErrorListeners('set', error);
            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          }
        }

        remove(keys, callback) {
          try {
            const changes = {};
            const keyArray = Array.isArray(keys) ? keys : [keys];

            keyArray.forEach(key => {
              if (this.data[key] !== undefined) {
                const oldValue = this.data[key];
                delete this.data[key];
                changes[key] = { oldValue, newValue: undefined };
              }
            });

            this.notifyListeners(changes);

            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          } catch (error) {
            this.notifyErrorListeners('remove', error);
            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          }
        }

        clear(callback) {
          try {
            const changes = {};
            Object.keys(this.data).forEach(key => {
              changes[key] = { oldValue: this.data[key], newValue: undefined };
            });

            this.data = {};
            this.notifyListeners(changes);

            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          } catch (error) {
            this.notifyErrorListeners('clear', error);
            if (callback) {
              setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
          }
        }

        addListener(listener) {
          this.listeners.push(listener);
        }

        removeListener(listener) {
          const index = this.listeners.indexOf(listener);
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
        }

        addErrorListener(listener) {
          this.errorListeners.push(listener);
        }

        notifyListeners(changes) {
          this.listeners.forEach(listener => {
            try {
              listener(changes);
            } catch (error) {
              console.error('Error in storage listener:', error);
            }
          });
        }

        notifyErrorListeners(operation, error) {
          this.errorListeners.forEach(listener => {
            try {
              listener(operation, error);
            } catch (listenerError) {
              console.error('Error in error listener:', listenerError);
            }
          });
        }

        reset(newData = {}) {
          this.data = { ...newData };
        }

        getState() {
          return { ...this.data };
        }
      }

      // Create global storage manager
      window.testStorageManager = new IntegrationChromeStorageManager(
        initialData
      );

      // Mock Chrome storage API
      if (typeof chrome !== 'undefined') {
        chrome.storage = {
          local: window.testStorageManager,
          sync: window.testStorageManager,
          onChanged: {
            addListener: listener =>
              window.testStorageManager.addListener(listener),
            removeListener: listener =>
              window.testStorageManager.removeListener(listener),
          },
        };

        // Mock other Chrome APIs
        chrome.runtime = {
          sendMessage: (message, callback) => {
            // Mock runtime messaging
            if (callback) {
              setTimeout(() => callback({ success: true }), 0);
            }
            return Promise.resolve({ success: true });
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {},
          },
        };

        chrome.action = {
          setBadgeText: () => {},
          setBadgeBackgroundColor: () => {},
          setTitle: () => {},
        };

        chrome.notifications = {
          create: () => {},
          clear: () => {},
          getAll: () => Promise.resolve({}),
        };

        chrome.commands = {
          getAll: () => Promise.resolve([]),
        };
      }
    }, initialState);

    // Store reference to storage manager for test control
    this.storageManager = await this.page.evaluate(
      () => window.testStorageManager
    );
  }

  /**
   * Set up authenticated state for testing
   * @param {Object} userData - User data for authentication
   */
  async setupAuthenticatedState(
    userData = { id: 'test-user-id', email: 'test@example.com' }
  ) {
    const authState = {
      supabaseConfig: {
        url: TEST_SUPABASE_CONFIG.url,
        key: TEST_SUPABASE_CONFIG.key,
        isConfigured: true,
      },
      user: {
        id: userData.id,
        email: userData.email,
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
      },
    };

    await this.mockChromeAPI(authState);
  }

  /**
   * Set up unconfigured state for testing
   */
  async setupUnconfiguredState() {
    const unconfiguredState = {
      supabaseConfig: {
        url: '',
        key: '',
        isConfigured: false,
      },
    };

    await this.mockChromeAPI(unconfiguredState);
  }

  /**
   * Set up configured but unauthenticated state for testing
   */
  async setupConfiguredState() {
    const configuredState = {
      supabaseConfig: {
        url: TEST_SUPABASE_CONFIG.url,
        key: TEST_SUPABASE_CONFIG.key,
        isConfigured: true,
      },
    };

    await this.mockChromeAPI(configuredState);
  }

  /**
   * Wait for network to be idle
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForNetworkIdle(timeout = 5000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Create a Playwright test context with proper setup
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').BrowserContext} context - Playwright browser context
 * @returns {ExtensionHelper} Configured extension helper
 */
export const createPlaywrightTestContext = (page, context) => {
  return new ExtensionHelper(page, context);
};

/**
 * Set up a Playwright test with initial state
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').BrowserContext} context - Playwright browser context
 * @param {Object} initialState - Initial Chrome storage state
 * @returns {Promise<ExtensionHelper>} Configured extension helper
 */
export const setupPlaywrightTest = async (page, context, initialState = {}) => {
  const helper = new ExtensionHelper(page, context);
  await helper.mockChromeAPI(initialState);
  return helper;
};
