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
import {
  createAuthenticatedState,
  createUnconfiguredState,
  createConfiguredState,
} from '../integration/factories/auth-factory.js';

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
   * Check if an element is visible
   */
  async isElementVisible(selector) {
    try {
      const element = await this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get text content of an element
   */
  async getElementText(selector) {
    try {
      const element = await this.page.locator(selector);
      return await element.textContent();
    } catch {
      return '';
    }
  }

  /**
   * Fill a form field
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
   * Click a button
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
   * Select an option from a dropdown
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
   * Mock Chrome API for testing with improved state management
   * @async
   * @method mockChromeAPI
   * @param {Object} initialState - Initial Chrome storage state
   * @description Mocks Chrome APIs with proper state management and error handling
   */
  async mockChromeAPI(initialState = {}) {
    await this.page.addInitScript(initialState => {
      // Enhanced Chrome storage state manager for integration tests
      class IntegrationChromeStorageManager {
        constructor(initialData = {}) {
          this.data = {
            // Default storage structure matching the application expectations
            supabaseConfig: null,
            auth_session: null,
            customStatusTypes: [
              'read',
              'good-reference',
              'low-value',
              'revisit-later',
            ],
            ...initialData,
          };
          this.listeners = [];
          this.errorListeners = [];
        }

        /**
         * Get storage data with proper key handling
         * @param {string|Array|Object} keys - Keys to retrieve
         * @param {Function} callback - Callback function
         */
        get(keys, callback) {
          try {
            const result = {};

            if (Array.isArray(keys)) {
              keys.forEach(key => {
                result[key] =
                  this.data[key] !== undefined ? this.data[key] : null;
              });
            } else if (typeof keys === 'string') {
              result[keys] =
                this.data[keys] !== undefined ? this.data[keys] : null;
            } else if (keys === null || keys === undefined) {
              // Return all data when no keys specified
              Object.assign(result, this.data);
            } else {
              // Handle object keys
              Object.keys(keys).forEach(key => {
                result[key] =
                  this.data[key] !== undefined ? this.data[key] : null;
              });
            }

            callback(result);
          } catch (error) {
            this.notifyErrorListeners('get', error);
            callback({});
          }
        }

        /**
         * Set storage data with change notifications
         * @param {Object} data - Data to store
         * @param {Function} callback - Callback function
         */
        set(data, callback) {
          try {
            const changes = {};
            Object.keys(data).forEach(key => {
              const oldValue = this.data[key];
              this.data[key] = data[key];
              changes[key] = { oldValue, newValue: data[key] };
            });

            // Notify listeners of changes
            this.notifyListeners(changes);

            if (callback) callback();
          } catch (error) {
            this.notifyErrorListeners('set', error);
            if (callback) callback();
          }
        }

        /**
         * Remove storage data
         * @param {string|Array} keys - Keys to remove
         * @param {Function} callback - Callback function
         */
        remove(keys, callback) {
          try {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            const changes = {};

            keyArray.forEach(key => {
              if (this.data[key] !== undefined) {
                const oldValue = this.data[key];
                delete this.data[key];
                changes[key] = { oldValue, newValue: undefined };
              }
            });

            if (Object.keys(changes).length > 0) {
              this.notifyListeners(changes);
            }

            if (callback) callback();
          } catch (error) {
            this.notifyErrorListeners('remove', error);
            if (callback) callback();
          }
        }

        /**
         * Clear all storage data
         * @param {Function} callback - Callback function
         */
        clear(callback) {
          try {
            const changes = {};
            Object.keys(this.data).forEach(key => {
              changes[key] = { oldValue: this.data[key], newValue: undefined };
            });

            this.data = {};
            this.notifyListeners(changes);

            if (callback) callback();
          } catch (error) {
            this.notifyErrorListeners('clear', error);
            if (callback) callback();
          }
        }

        /**
         * Add change listener
         * @param {Function} listener - Listener function
         */
        addListener(listener) {
          this.listeners.push(listener);
        }

        /**
         * Remove change listener
         * @param {Function} listener - Listener function
         */
        removeListener(listener) {
          const index = this.listeners.indexOf(listener);
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
        }

        /**
         * Add error listener
         * @param {Function} listener - Error listener function
         */
        addErrorListener(listener) {
          this.errorListeners.push(listener);
        }

        /**
         * Notify change listeners
         * @param {Object} changes - Storage changes
         */
        notifyListeners(changes) {
          this.listeners.forEach(listener => {
            try {
              listener(changes, 'sync');
            } catch (error) {
              console.warn('Storage listener error:', error);
            }
          });
        }

        /**
         * Notify error listeners
         * @param {string} operation - Operation that failed
         * @param {Error} error - Error object
         */
        notifyErrorListeners(operation, error) {
          this.errorListeners.forEach(listener => {
            try {
              listener(operation, error);
            } catch (listenerError) {
              console.warn('Error listener error:', listenerError);
            }
          });
        }

        /**
         * Reset storage to initial state
         * @param {Object} newData - New initial data
         */
        reset(newData = {}) {
          this.data = {
            supabaseConfig: null,
            auth_session: null,
            customStatusTypes: [
              'read',
              'good-reference',
              'low-value',
              'revisit-later',
            ],
            ...newData,
          };
          this.listeners = [];
          this.errorListeners = [];
        }
      }

      // Create storage manager instance
      const storageManager = new IntegrationChromeStorageManager(initialState);

      // Create a more robust Chrome API mock with proper state management
      const mockStorage = {
        sync: {
          get: (keys, callback) => storageManager.get(keys, callback),
          set: (data, callback) => storageManager.set(data, callback),
          remove: (keys, callback) => storageManager.remove(keys, callback),
          clear: callback => storageManager.clear(callback),
          onChanged: {
            addListener: callback => storageManager.addListener(callback),
            removeListener: callback => storageManager.removeListener(callback),
          },
        },
        local: {
          get: (keys, callback) => {
            // Local storage typically empty for this extension
            callback({});
          },
          set: (data, callback) => {
            if (callback) callback();
          },
          remove: (keys, callback) => {
            if (callback) callback();
          },
          clear: callback => {
            if (callback) callback();
          },
        },
      };

      // Mock chrome.runtime API with better message handling
      const mockRuntime = {
        onMessage: {
          addListener: callback => {
            // Store callback for later use
            if (!window.mockRuntimeListeners) {
              window.mockRuntimeListeners = [];
            }
            window.mockRuntimeListeners.push(callback);
          },
          removeListener: callback => {
            if (window.mockRuntimeListeners) {
              const index = window.mockRuntimeListeners.indexOf(callback);
              if (index > -1) {
                window.mockRuntimeListeners.splice(index, 1);
              }
            }
          },
        },

        sendMessage: (message, callback) => {
          // Enhanced message handling with proper responses
          const responses = {
            BOOKMARK_SAVED: { success: true, bookmarkId: 'test-id' },
            GET_AUTH_STATE: {
              authenticated: !!storageManager.data.auth_session,
              user: storageManager.data.auth_session?.user || null,
            },
            TEST_CONNECTION: {
              success: true,
              message: 'Connection successful',
            },
            SAVE_CONFIG: { success: true, message: 'Configuration saved' },
            GET_CONFIG: {
              success: true,
              config: storageManager.data.config,
            },
          };

          const response = responses[message.type] || {
            success: false,
            error: 'Unknown message type',
          };

          if (callback) {
            // Simulate async response
            setTimeout(() => callback(response), 100);
          }
        },

        openOptionsPage: () => {
          window.optionsPageOpened = true;
        },

        getURL: path => `chrome-extension://test-id/${path}`,
      };

      // Mock chrome.tabs API
      const mockTabs = {
        query: (queryInfo, callback) => {
          const mockTabs = [
            {
              id: 1,
              url: 'https://example.com',
              title: 'Test Page',
              active: true,
            },
          ];
          callback(mockTabs);
        },

        getCurrent: callback => {
          callback({
            id: 1,
            url: 'https://example.com',
            title: 'Test Page',
          });
        },

        get: (tabId, callback) => {
          callback({
            id: tabId,
            url: 'https://example.com',
            title: 'Test Page',
          });
        },

        update: () => {},
        create: () => {},
      };

      // Mock chrome.action API
      const mockAction = {
        setBadgeText: () => {},
        setBadgeBackgroundColor: () => {},
        onClicked: {
          addListener: () => {},
          removeListener: () => {},
        },
      };

      // Mock chrome.notifications API
      const mockNotifications = {
        create: () => {},
        clear: () => {},
      };

      // Mock chrome.commands API
      const mockCommands = {
        onCommand: {
          addListener: () => {},
          removeListener: () => {},
        },
      };

      // Initialize Chrome API if not exists
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      // Set up the mocked APIs
      chrome.storage = mockStorage;
      chrome.runtime = mockRuntime;
      chrome.tabs = mockTabs;
      chrome.action = mockAction;
      chrome.notifications = mockNotifications;
      chrome.commands = mockCommands;

      // Add utility functions for testing
      window.mockChromeAPI = {
        setStorageData: data => {
          Object.assign(storageManager.data, data);
        },

        getStorageData: () => {
          return { ...storageManager.data };
        },

        simulateMessage: message => {
          if (window.mockRuntimeListeners) {
            window.mockRuntimeListeners.forEach(listener => {
              try {
                listener(message);
              } catch (error) {
                console.warn('Message listener error:', error);
              }
            });
          }
        },

        reset: () => {
          storageManager.reset();
          if (window.mockRuntimeListeners) {
            window.mockRuntimeListeners = [];
          }
        },

        // Expose storage manager for test control
        _storageManager: storageManager,
      };

      console.log('Chrome API mocked successfully');
    }, initialState);
  }

  /**
   * Set up authenticated state for testing
   * @async
   * @method setupAuthenticatedState
   * @param {Object} userData - User data for authentication
   * @description Sets up Chrome storage with authenticated user data
   */
  async setupAuthenticatedState(
    userData = { id: 'test-user-id', email: 'test@example.com' }
  ) {
    const authState = createAuthenticatedState({
      user: userData,
    });

    // Mock Chrome API before page loads
    await this.mockChromeAPI(authState);
  }

  /**
   * Set up unconfigured state for testing
   * @async
   * @method setupUnconfiguredState
   * @description Sets up Chrome storage with no configuration
   */
  async setupUnconfiguredState() {
    const unconfiguredState = createUnconfiguredState();

    // Mock Chrome API before page loads
    await this.mockChromeAPI(unconfiguredState);
  }

  /**
   * Set up configured but unauthenticated state for testing
   * @async
   * @method setupConfiguredState
   * @description Sets up Chrome storage with configuration but no authentication
   */
  async setupConfiguredState() {
    const configuredState = createConfiguredState();

    // Mock Chrome API before page loads
    await this.mockChromeAPI(configuredState);
  }

  /**
   * Wait for network idle to ensure all async operations complete
   * @async
   * @method waitForNetworkIdle
   * @param {number} timeout - Timeout in milliseconds
   * @description Waits for network to be idle before proceeding
   */
  async waitForNetworkIdle(timeout = 5000) {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // If networkidle doesn't work, wait a bit
      await this.page.waitForTimeout(1000);
    }
  }
}

export default ExtensionHelper;
