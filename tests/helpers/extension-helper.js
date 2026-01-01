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
import crypto from 'crypto';

// Extension path will be passed from fixtures

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
   * @param {string} [extensionPath] - Optional absolute path to the extension directory
   * @description Sets up the helper with Playwright page and context objects
   */
  constructor(page, context, extensionPath = null) {
    /** @type {import('@playwright/test').Page} Playwright page object */
    this.page = page;
    /** @type {import('@playwright/test').BrowserContext} Playwright browser context */
    this.context = context;
    /** @type {string|null} Cached extension ID */
    this.extensionId = null;
    /** @type {string|null} Extension path for computing deterministic ID */
    this.extensionPath = extensionPath ? path.resolve(extensionPath) : null;

    // Surface browser console output to aid debugging
    this.page.on('console', msg => {
      console.log(`[page ${msg.type()}] ${msg.text()}`);
    });

    // Surface runtime errors for visibility
    this.page.on('pageerror', error => {
      console.error('[page error]', error?.message || error);
    });
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

  /**
   * Compute extension ID deterministically from extension path
   * Chrome generates deterministic IDs for unpacked extensions based on absolute path
   * @param {string} extensionPath - Absolute path to extension directory
   * @returns {string} The computed extension ID (32 lowercase hex characters)
   * @description Computes the extension ID using Chrome's algorithm: SHA256 hash of normalized path
   */
  computeExtensionIdFromPath(extensionPath) {
    const absolutePath = path.resolve(extensionPath);
    // Normalize path separators for consistency (Windows vs Unix)
    // Chrome expects forward slashes and removes trailing slashes
    let normalizedPath = absolutePath.replace(/\\/g, '/');
    // Remove trailing slash if present
    normalizedPath = normalizedPath.replace(/\/$/, '');
    // Chrome uses SHA256 hash of the UTF-8 encoded path
    // Takes first 32 hex characters (which are already lowercase)
    const hash = crypto.createHash('sha256').update(normalizedPath, 'utf8').digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * Get the extension ID from the background page target
   * @returns {Promise<string>} The extension ID
   */
  async getExtensionId() {
    if (this.extensionId) {
      return this.extensionId;
    }

    // Wait for extension to load - service workers may take time to initialize
    let extensionId = null;

    // Wait for service worker to be available (with timeout)
    try {
      await Promise.race([
        this.context.waitForEvent('serviceworker', { timeout: 5000 }).catch(() => null),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // Continue even if service worker event doesn't fire
    }

    // Method 1: Check all service workers (primary for MV3)
    const serviceWorkers = this.context.serviceWorkers();
    for (const worker of serviceWorkers) {
      const url = worker.url();
      // Extension IDs are 32 lowercase letters
      const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
      if (match) {
        extensionId = match[1];
        break;
      }
    }

    // Method 2: Check background pages (for non-MV3 extensions)
    if (!extensionId) {
      const backgroundPages = this.context.backgroundPages();
      for (const bg of backgroundPages) {
        const url = bg.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }

    // Method 3: Check all pages in the context
    if (!extensionId) {
      try {
        const pages = this.context.pages();
        for (const pg of pages) {
          const url = pg.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Method 4: Try navigating to a test page and checking extension context
    if (!extensionId) {
      try {
        // Navigate to a blank page first
        await this.page.goto('about:blank');
        await this.page.waitForTimeout(1000);

        // Try to access chrome.runtime.id via injected script
        const id = await this.page.evaluate(() => {
          return new Promise(resolve => {
            if (chrome && chrome.runtime && chrome.runtime.id) {
              resolve(chrome.runtime.id);
            } else {
              // Try to get it from window
              resolve(null);
            }
          });
        });

        if (id && /^[a-z]{32}$/.test(id)) {
          extensionId = id;
        }
      } catch {
        // This won't work in extension pages, but worth trying
      }
    }

    // Method 5: Use CDP (Chrome DevTools Protocol) to get extension info
    if (!extensionId) {
      try {
        const client = await this.context.newCDPSession(this.page);

        // Try Target.getTargets first - this should work even if service workers aren't running
        try {
          const targets = await client.send('Target.getTargets');
          // Check all targets, not just service workers
          for (const target of targets.targetInfos) {
            const url = target.url || '';
            // Check for any extension-related target
            if (url.includes('chrome-extension://')) {
              const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
              if (match) {
                extensionId = match[1];
                break;
              }
            }
            // Also check target type
            if (
              target.type === 'service_worker' ||
              target.type === 'background_page' ||
              target.type === 'page' // Extension pages might be type 'page'
            ) {
              const url = target.url || '';
              const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
              if (match) {
                extensionId = match[1];
                break;
              }
            }
          }
        } catch (targetError) {
          // Target.getTargets might not be available
          console.warn('Target.getTargets failed:', targetError.message);
        }

        // Try to get extension ID from Runtime domain by creating a page and injecting script
        if (!extensionId) {
          try {
            // Create a temporary page and try to access chrome.runtime
            const tempPage = await this.context.newPage();
            await tempPage.goto('about:blank');

            // Try to inject a script that accesses chrome.runtime.id
            // This won't work in regular pages, but let's try
            const result = await client.send('Runtime.evaluate', {
              expression: `
                (function() {
                  try {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                      return chrome.runtime.id;
                    }
                  } catch(e) {}
                  return null;
                })()
              `,
              returnByValue: true,
            });
            if (result.result && result.result.value && /^[a-z]{32}$/.test(result.result.value)) {
              extensionId = result.result.value;
            }
            await tempPage.close();
          } catch {
            // Ignore
          }
        }
      } catch (error) {
        // CDP might not be available, continue
        console.warn('CDP method failed:', error?.message || 'Unknown error');
      }
    }

    // Method 6: Try to load background.js directly by checking all service workers more thoroughly
    if (!extensionId) {
      // Wait a bit more and retry service workers
      await this.page.waitForTimeout(2000);
      const serviceWorkersRetry = this.context.serviceWorkers();
      for (const worker of serviceWorkersRetry) {
        const url = worker.url();
        if (url.includes('background.js') || url.includes('service_worker')) {
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }
      }
    }

    // Method 7: Try to trigger extension by navigating to a page
    // This can cause the extension's service worker to start
    if (!extensionId) {
      try {
        const testPage = await this.context.newPage();

        // Navigate to a page that might trigger the extension
        await testPage.goto('https://example.com', {
          waitUntil: 'domcontentloaded',
          timeout: 5000,
        });
        await testPage.waitForTimeout(3000);

        // Check if service workers were created
        const newServiceWorkers = this.context.serviceWorkers();
        for (const worker of newServiceWorkers) {
          const url = worker.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }

        await testPage.close();
      } catch {
        // Ignore errors
      }
    }

    // Method 8: Wait longer and retry all methods with more time
    if (!extensionId) {
      for (let i = 0; i < 5; i++) {
        await this.page.waitForTimeout(1000);

        // Retry service workers
        const serviceWorkersRetry = this.context.serviceWorkers();
        for (const worker of serviceWorkersRetry) {
          const url = worker.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }

        // Retry background pages
        if (!extensionId) {
          const backgroundPagesRetry = this.context.backgroundPages();
          for (const bg of backgroundPagesRetry) {
            const url = bg.url();
            const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
            if (match) {
              extensionId = match[1];
              break;
            }
          }
        }

        // Retry pages
        if (!extensionId) {
          try {
            const pagesRetry = this.context.pages();
            for (const pg of pagesRetry) {
              const url = pg.url();
              const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
              if (match) {
                extensionId = match[1];
                break;
              }
            }
          } catch {
            // Ignore
          }
        }

        if (extensionId) break;
      }
    }

    // Final fallback: Use CDP Browser domain to query extension registry
    if (!extensionId) {
      try {
        const client = await this.context.newCDPSession(this.page);
        // Try to use Browser.getWindowForTarget or similar to get extension info
        // Note: Browser domain might not be available in all contexts
        try {
          // Try to get all targets and find extension-related ones
          const targets = await client.send('Target.getTargets');
          for (const target of targets.targetInfos) {
            const url = target.url || '';
            // Check if this is an extension target
            if (url.includes('chrome-extension://')) {
              const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
              if (match) {
                extensionId = match[1];
                break;
              }
            }
            // Also check targetId which might contain extension info
            if (target.targetId && target.targetId.includes('extension')) {
              // Try to get more info about this target
              try {
                const targetInfo = await client.send('Target.getTargetInfo', {
                  targetId: target.targetId,
                });
                if (targetInfo.targetInfo && targetInfo.targetInfo.url) {
                  const match = targetInfo.targetInfo.url.match(
                    /chrome-extension:\/\/([a-z]{32})\//,
                  );
                  if (match) {
                    extensionId = match[1];
                    break;
                  }
                }
              } catch {
                // Ignore
              }
            }
          }
        } catch {
          // Browser domain might not be available
        }
      } catch {
        // CDP might not be available
      }
    }

    // Final fallback: Try to get extension ID by attempting navigation to extension pages
    // and catching the actual extension ID from navigation events or errors
    if (!extensionId) {
      try {
        // Create a new page and try to navigate to a web page
        // This might trigger the extension's service worker
        const triggerPage = await this.context.newPage();
        await triggerPage.goto('http://example.com', {
          waitUntil: 'networkidle',
          timeout: 10000,
        });
        await triggerPage.waitForTimeout(2000);

        // Check service workers again after navigation
        const triggeredWorkers = this.context.serviceWorkers();
        for (const worker of triggeredWorkers) {
          const url = worker.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }
        await triggerPage.close();
      } catch {
        // Ignore
      }
    }

    // Final fallback: Compute extension ID from path (works in headless mode)
    if (!extensionId && this.extensionPath) {
      try {
        extensionId = this.computeExtensionIdFromPath(this.extensionPath);
        console.log(`[extension-id] Computed from path: ${extensionId}`);
      } catch (error) {
        console.warn(
          '[extension-id] Failed to compute from path:',
          error?.message || 'Unknown error',
        );
      }
    }

    if (!extensionId) {
      const swCount = this.context.serviceWorkers().length;
      const bgCount = this.context.backgroundPages().length;
      const pageCount = this.context.pages().length;
      const hasPath = this.extensionPath ? 'yes' : 'no';
      throw new Error(
        `Could not determine extensionId. Service workers: ${swCount}, Background pages: ${bgCount}, Pages: ${pageCount}, Extension path provided: ${hasPath}. ` +
          'Make sure the extension is loaded correctly. The extension may not be loading in headless mode. ' +
          'Try running with headless: false to debug.',
      );
    }

    this.extensionId = extensionId;
    return extensionId;
  }

  /**
   * Open the extension popup by navigating directly to popup.html
   */

  /**
   * Verify extension is loaded by trying to access manifest.json
   * @param {string} extensionId - The extension ID to verify
   * @returns {Promise<boolean>} True if extension is accessible
   */
  async verifyExtensionLoaded(extensionId) {
    try {
      const testPage = await this.context.newPage();
      const manifestUrl = `chrome-extension://${extensionId}/manifest.json`;
      const response = await testPage.goto(manifestUrl, { timeout: 5000 });
      await testPage.close();
      return response && response.ok();
    } catch {
      return false;
    }
  }

  async openPopup() {
    // Open the extension popup using chrome-extension:// URL
    const extensionId = await this.getExtensionId();
    const url = `chrome-extension://${extensionId}/popup.html`;
    console.log(`[nav] Opening popup: ${url}`);

    // Verify extension is loaded before trying to navigate
    const isLoaded = await this.verifyExtensionLoaded(extensionId);
    if (!isLoaded) {
      console.warn(`[nav] Extension may not be loaded. Computed ID: ${extensionId}`);
      // Continue anyway - navigation might still work
    }

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      // Wait for element to exist, not necessarily visible (element might be hidden initially)
      await this.page.waitForSelector('#app', {
        state: 'attached',
        timeout: 10000,
      });
    } catch (error) {
      // If navigation fails, the computed ID might be wrong
      // Try to extract the real ID from error or try alternative methods
      console.warn(`[nav] Failed to open popup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to the options page
   */

  async openOptions() {
    const extensionId = await this.getExtensionId();
    const url = `chrome-extension://${extensionId}/options.html`;
    console.log(`[nav] Opening options: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    // Wait for element to exist, not necessarily visible
    await this.page.waitForSelector('#app', {
      state: 'attached',
      timeout: 10000,
    });
  }

  /**
   * Wait for the extension to be fully loaded
   */
  async waitForExtensionReady() {
    // Wait for the main app container to be present (attached, not necessarily visible)
    await this.page.waitForSelector('#app', {
      state: 'attached',
      timeout: 10000,
    });

    // Wait longer for any async initialization and for JavaScript errors to settle
    // Even if there are JS errors, the DOM might still render
    await this.page.waitForTimeout(3000);
  }

  /**
   * Check if an element exists and is visible
   */
  async isElementVisible(selector) {
    try {
      // Wait for element to be attached first, then check visibility
      await this.page.waitForSelector(selector, {
        state: 'attached',
        timeout: 5000,
      });
      // Check if visible, with a longer timeout to allow for rendering
      const isVisible = await this.page.isVisible(selector);
      // If not visible, wait a bit more and check again (in case of slow rendering)
      if (!isVisible) {
        await this.page.waitForTimeout(1000);
        return await this.page.isVisible(selector);
      }
      return isVisible;
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
      } else if (chrome.runtime && !chrome.runtime.openOptionsPage) {
        // If chrome.runtime exists but openOptionsPage doesn't, add it
        chrome.runtime.openOptionsPage = () => {
          window.optionsPageOpened = true;
        };
      } else if (chrome.runtime && chrome.runtime.openOptionsPage) {
        // If it already exists, wrap it to set the flag
        const originalOpenOptionsPage = chrome.runtime.openOptionsPage;
        chrome.runtime.openOptionsPage = () => {
          window.optionsPageOpened = true;
          if (originalOpenOptionsPage) {
            originalOpenOptionsPage();
          }
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
