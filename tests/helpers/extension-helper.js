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
import { buildChromeMockInitScript } from './playwright-mocks.js';

const EXTENSION_ID_FROM_URL_RE = /chrome-extension:\/\/([a-z]{32})\//;

/**
 * @param {string} url
 * @returns {string|null}
 */
function extensionIdFromUrl(url) {
  const match = url.match(EXTENSION_ID_FROM_URL_RE);
  return match ? match[1] : null;
}

/**
 * @param {Array<unknown>} items
 * @param {(item: unknown) => string} getUrl
 * @returns {string|null}
 */
function findExtensionIdInItems(items, getUrl) {
  for (const item of items) {
    const id = extensionIdFromUrl(getUrl(item));
    if (id) {
      return id;
    }
  }
  return null;
}

/**
 * @param {Array<{ url?: string, type?: string }>} targetInfos
 * @returns {string|null}
 */
function findExtensionIdInCdpTargets(targetInfos) {
  for (const target of targetInfos) {
    const url = target.url || '';
    if (url.includes('chrome-extension://')) {
      const id = extensionIdFromUrl(url);
      if (id) {
        return id;
      }
    }
    if (
      target.type === 'service_worker' ||
      target.type === 'background_page' ||
      target.type === 'page'
    ) {
      const id = extensionIdFromUrl(url);
      if (id) {
        return id;
      }
    }
  }
  return null;
}

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
    const hash = crypto
      .createHash('sha256')
      .update(normalizedPath, 'utf8')
      .digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * Wait briefly for a service worker to register before probing targets.
   * @returns {Promise<void>}
   */
  async _waitForServiceWorkerEvent() {
    try {
      await Promise.race([
        this.context
          .waitForEvent('serviceworker', { timeout: 5000 })
          .catch(() => null),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
    } catch (_error) {
      // Continue even if service worker event doesn't fire
    }
  }

  /**
   * @param {(worker: import('@playwright/test').Worker) => boolean} [filterFn]
   * @returns {string|null}
   */
  _findExtensionIdInServiceWorkers(filterFn) {
    let workers = this.context.serviceWorkers();
    if (filterFn) {
      workers = workers.filter(filterFn);
    }
    return findExtensionIdInItems(workers, worker => worker.url());
  }

  /** @returns {string|null} */
  _findExtensionIdInBackgroundPages() {
    return findExtensionIdInItems(this.context.backgroundPages(), bg =>
      bg.url(),
    );
  }

  /** @returns {string|null} */
  _findExtensionIdInPages() {
    try {
      return findExtensionIdInItems(this.context.pages(), pg => pg.url());
    } catch (_error) {
      return null;
    }
  }

  /** @returns {Promise<string|null>} */
  async _tryExtensionIdFromPageEvaluate() {
    try {
      await this.page.goto('about:blank');
      await this.page.waitForTimeout(1000);

      const id = await this.page.evaluate(() => {
        return new Promise(resolve => {
          if (chrome && chrome.runtime && chrome.runtime.id) {
            resolve(chrome.runtime.id);
          } else {
            resolve(null);
          }
        });
      });

      if (id && /^[a-z]{32}$/.test(id)) {
        return id;
      }
    } catch (_error) {
      // This won't work in extension pages, but worth trying
    }
    return null;
  }

  /** @returns {Promise<string|null>} */
  async _tryExtensionIdFromCdpSession() {
    try {
      const client = await this.context.newCDPSession(this.page);

      try {
        const targets = await client.send('Target.getTargets');
        const id = findExtensionIdInCdpTargets(targets.targetInfos);
        if (id) {
          return id;
        }
      } catch (targetError) {
        console.warn('Target.getTargets failed:', targetError.message);
      }

      try {
        const tempPage = await this.context.newPage();
        await tempPage.goto('about:blank');

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
        await tempPage.close();

        if (
          result.result &&
          result.result.value &&
          /^[a-z]{32}$/.test(result.result.value)
        ) {
          return result.result.value;
        }
      } catch (_evalError) {
        // Ignore
      }
    } catch (error) {
      console.warn('CDP method failed:', error.message);
    }
    return null;
  }

  /** @returns {Promise<string|null>} */
  async _tryExtensionIdFromBackgroundServiceWorkers() {
    await this.page.waitForTimeout(2000);
    return this._findExtensionIdInServiceWorkers(worker => {
      const url = worker.url();
      return url.includes('background.js') || url.includes('service_worker');
    });
  }

  /**
   * @param {string} url
   * @param {import('@playwright/test').GotoOptions} gotoOptions
   * @param {number} waitMs
   * @returns {Promise<string|null>}
   */
  async _tryExtensionIdByNavigation(url, gotoOptions, waitMs) {
    try {
      const testPage = await this.context.newPage();
      await testPage.goto(url, gotoOptions);
      await testPage.waitForTimeout(waitMs);

      const id = this._findExtensionIdInServiceWorkers();
      await testPage.close();
      return id;
    } catch (_error) {
      return null;
    }
  }

  /** @returns {Promise<string|null>} */
  async _retryExtensionIdDiscovery() {
    for (let i = 0; i < 5; i++) {
      await this.page.waitForTimeout(1000);

      const fromWorkers = this._findExtensionIdInServiceWorkers();
      if (fromWorkers) {
        return fromWorkers;
      }

      const fromBackground = this._findExtensionIdInBackgroundPages();
      if (fromBackground) {
        return fromBackground;
      }

      const fromPages = this._findExtensionIdInPages();
      if (fromPages) {
        return fromPages;
      }
    }
    return null;
  }

  /** @returns {Promise<string|null>} */
  async _tryExtensionIdFromCdpBrowserDomain() {
    try {
      const client = await this.context.newCDPSession(this.page);
      try {
        const targets = await client.send('Target.getTargets');
        for (const target of targets.targetInfos) {
          const url = target.url || '';
          if (url.includes('chrome-extension://')) {
            const id = extensionIdFromUrl(url);
            if (id) {
              return id;
            }
          }
          if (target.targetId && target.targetId.includes('extension')) {
            try {
              const targetInfo = await client.send('Target.getTargetInfo', {
                targetId: target.targetId,
              });
              if (targetInfo.targetInfo && targetInfo.targetInfo.url) {
                const id = extensionIdFromUrl(targetInfo.targetInfo.url);
                if (id) {
                  return id;
                }
              }
            } catch (_e) {
              // Ignore
            }
          }
        }
      } catch (_browserError) {
        // Browser domain might not be available
      }
    } catch (_error) {
      // CDP might not be available
    }
    return null;
  }

  /** @returns {string|null} */
  _tryExtensionIdFromPath() {
    if (!this.extensionPath) {
      return null;
    }
    try {
      const id = this.computeExtensionIdFromPath(this.extensionPath);
      console.log(`[extension-id] Computed from path: ${id}`);
      return id;
    } catch (error) {
      console.warn(
        '[extension-id] Failed to compute from path:',
        error.message,
      );
      return null;
    }
  }

  /**
   * Get the extension ID from the background page target
   * @returns {Promise<string>} The extension ID
   */
  async getExtensionId() {
    if (this.extensionId) {
      return this.extensionId;
    }

    await this._waitForServiceWorkerEvent();

    const extensionId =
      this._findExtensionIdInServiceWorkers() ||
      this._findExtensionIdInBackgroundPages() ||
      this._findExtensionIdInPages() ||
      (await this._tryExtensionIdFromPageEvaluate()) ||
      (await this._tryExtensionIdFromCdpSession()) ||
      (await this._tryExtensionIdFromBackgroundServiceWorkers()) ||
      (await this._tryExtensionIdByNavigation(
        'https://example.com',
        { waitUntil: 'domcontentloaded', timeout: 5000 },
        3000,
      )) ||
      (await this._retryExtensionIdDiscovery()) ||
      (await this._tryExtensionIdFromCdpBrowserDomain()) ||
      (await this._tryExtensionIdByNavigation(
        'http://example.com',
        { waitUntil: 'networkidle', timeout: 10000 },
        2000,
      )) ||
      this._tryExtensionIdFromPath();

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
    } catch (_error) {
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
      console.warn(
        `[nav] Extension may not be loaded. Computed ID: ${extensionId}`,
      );
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
   * Navigate to the bookmark management page
   */
  async openBookmarkManagement() {
    const extensionId = await this.getExtensionId();
    const url = `chrome-extension://${extensionId}/bookmark-management.html`;
    console.log(`[nav] Opening bookmark management: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await this.page.waitForSelector('#app', {
      state: 'attached',
      timeout: 10000,
    });
  }

  /**
   * Wait for the extension to be fully loaded
   */
  async waitForExtensionReady() {
    await this.page.waitForSelector('#app', {
      state: 'attached',
      timeout: 10_000,
    });

    await this.page
      .waitForSelector(
        '.setup-container, .config-container, .auth-container, .auth-form, #read-status, .main-container, .auth-container h2',
        { timeout: 10_000 },
      )
      .catch(() => {});

    await this.page.waitForTimeout(300);
  }

  /**
   * Disable native HTML5 validation so JS validation messages can be tested.
   * @param {string} [formSelector='form']
   */
  async disableNativeValidation(formSelector = 'form') {
    await this.page
      .locator(formSelector)
      .first()
      .evaluate(form => {
        form.noValidate = true;
      });
  }

  /**
   * Confirm the root app container exists in the DOM.
   * @returns {Promise<boolean>}
   */
  async isAppAttached() {
    try {
      await this.page.waitForSelector('#app', {
        state: 'attached',
        timeout: 5_000,
      });
      return (await this.page.locator('#app').count()) > 0;
    } catch {
      return false;
    }
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
        await this.page.waitForSelector('.ui-message-success', {
          timeout: 5000,
        });
      } else if (messageType === 'error') {
        await this.page.waitForSelector('.ui-message-error', { timeout: 5000 });
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
   * @param {'unconfigured'|'configured'|'authenticated'} [preset='unconfigured']
   */
  async mockChromeAPI(preset = 'unconfigured') {
    await this.page.addInitScript(buildChromeMockInitScript(preset));
  }
}

export default ExtensionHelper;
