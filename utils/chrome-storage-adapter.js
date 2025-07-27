/**
 * @fileoverview Chrome Storage Adapter for ForgetfulMe Extension
 * @module chrome-storage-adapter
 * @description Custom storage adapter that bridges Supabase client with Chrome extension storage APIs
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './error-handler.js';

/**
 * Chrome Storage Adapter for Supabase Integration
 * @class ChromeStorageAdapter
 * @description Provides a standard storage interface that integrates Supabase client with Chrome extension storage
 *
 * @example
 * // Basic usage
 * const adapter = new ChromeStorageAdapter();
 * await adapter.setItem('auth_session', sessionData);
 * const session = await adapter.getItem('auth_session');
 *
 * // With dependency injection for testing
 * const mockChrome = { storage: { sync: mockStorage } };
 * const adapter = new ChromeStorageAdapter({ chrome: mockChrome });
 */
class ChromeStorageAdapter {
  /**
   * Storage area types supported by Chrome
   * @static
   * @type {Object}
   * @property {string} SYNC - Chrome sync storage (synced across devices)
   * @property {string} LOCAL - Chrome local storage (device-specific)
   */
  static STORAGE_AREAS = {
    SYNC: 'sync',
    LOCAL: 'local',
  };

  /**
   * Initialize the Chrome storage adapter
   * @constructor
   * @param {Object} dependencies - Dependency injection object
   * @param {Object} dependencies.chrome - Chrome APIs object (for testing)
   * @param {string} dependencies.storageArea - Storage area to use ('sync' or 'local')
   * @param {Object} dependencies.errorHandler - Error handler instance
   */
  constructor(dependencies = {}) {
    /** @type {Object} Chrome APIs object */
    this.chrome =
      dependencies.chrome || (typeof chrome !== 'undefined' ? chrome : null);
    /** @type {string} Storage area to use */
    this.storageArea =
      dependencies.storageArea || ChromeStorageAdapter.STORAGE_AREAS.SYNC;
    /** @type {Object} Error handler instance */
    this.errorHandler = dependencies.errorHandler || ErrorHandler;

    // Validate Chrome APIs availability
    if (!this.chrome || !this.chrome.storage) {
      const error = new Error('Chrome storage APIs not available');
      error.type = 'CONFIG';
      error.context = 'chrome-storage-adapter.constructor';
      throw error;
    }

    // Validate storage area
    if (
      !Object.values(ChromeStorageAdapter.STORAGE_AREAS).includes(
        this.storageArea
      )
    ) {
      const error = new Error(`Invalid storage area: ${this.storageArea}`);
      error.type = 'VALIDATION';
      error.context = 'chrome-storage-adapter.constructor';
      throw error;
    }

    /** @type {Object} Chrome storage API for the selected area */
    this.storage = this.chrome.storage[this.storageArea];
  }

  /**
   * Get an item from Chrome storage
   * @param {string} key - Storage key
   * @returns {Promise<*>} - Stored value or null if not found
   * @throws {Error} When storage operation fails
   */
  async getItem(key) {
    // Validate inputs first - let validation errors bubble up directly
    this.validateKey(key);

    try {
      const result = await this.storage.get(key);
      return result[key] || null;
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.getItem'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.getItem'
      );
    }
  }

  /**
   * Set an item in Chrome storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async setItem(key, value) {
    // Validate inputs first - let validation errors bubble up directly
    this.validateKey(key);
    this.validateValue(value);

    try {
      await this.storage.set({ [key]: value });
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.setItem'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.setItem'
      );
    }
  }

  /**
   * Remove an item from Chrome storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async removeItem(key) {
    // Validate inputs first - let validation errors bubble up directly
    this.validateKey(key);

    try {
      await this.storage.remove(key);
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.removeItem'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.removeItem'
      );
    }
  }

  /**
   * Get multiple items from Chrome storage
   * @param {Array<string>} keys - Array of storage keys
   * @returns {Promise<Object>} - Object with key-value pairs
   * @throws {Error} When storage operation fails
   */
  async getItems(keys) {
    // Validate inputs first - let validation errors bubble up directly
    keys.forEach(key => this.validateKey(key));

    try {
      const result = await this.storage.get(keys);
      return result;
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.getItems'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.getItems'
      );
    }
  }

  /**
   * Set multiple items in Chrome storage
   * @param {Object} items - Object with key-value pairs to store
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async setItems(items) {
    // Validate inputs first - let validation errors bubble up directly
    Object.keys(items).forEach(key => {
      this.validateKey(key);
      this.validateValue(items[key]);
    });

    try {
      await this.storage.set(items);
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.setItems'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.setItems'
      );
    }
  }

  /**
   * Remove multiple items from Chrome storage
   * @param {Array<string>} keys - Array of storage keys to remove
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async removeItems(keys) {
    // Validate inputs first - let validation errors bubble up directly
    keys.forEach(key => this.validateKey(key));

    try {
      await this.storage.remove(keys);
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.removeItems'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.removeItems'
      );
    }
  }

  /**
   * Clear all items from Chrome storage
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async clear() {
    try {
      await this.storage.clear();
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.clear'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.clear'
      );
    }
  }

  /**
   * Get all items from Chrome storage
   * @returns {Promise<Object>} - All stored items
   * @throws {Error} When storage operation fails
   */
  async getAllItems() {
    try {
      const result = await this.storage.get(null);
      return result;
    } catch (error) {
      const errorResult = this.errorHandler.handle(
        error,
        'chrome-storage-adapter.getAllItems'
      );
      throw this.errorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'chrome-storage-adapter.getAllItems'
      );
    }
  }

  /**
   * Add storage change listener
   * @param {Function} callback - Callback function for storage changes
   * @returns {Function} - Cleanup function to remove the listener
   */
  addChangeListener(callback) {
    const wrappedCallback = (changes, namespace) => {
      if (namespace === this.storageArea) {
        callback(changes, namespace);
      }
    };

    this.chrome.storage.onChanged.addListener(wrappedCallback);

    // Return cleanup function
    return () => {
      this.chrome.storage.onChanged.removeListener(wrappedCallback);
    };
  }

  /**
   * Get storage area being used
   * @returns {string} - Storage area ('sync' or 'local')
   */
  getStorageArea() {
    return this.storageArea;
  }

  /**
   * Check if storage is available
   * @returns {boolean} - True if storage is available
   */
  isAvailable() {
    return !!(this.chrome && this.chrome.storage && this.storage);
  }

  /**
   * Get storage usage information (if supported)
   * @returns {Promise<Object|null>} - Storage usage info or null if not supported
   */
  async getUsage() {
    try {
      if (this.storage.getBytesInUse) {
        const bytesInUse = await this.storage.getBytesInUse();
        return { bytesInUse };
      }
      return null;
    } catch (error) {
      this.errorHandler.handle(error, 'chrome-storage-adapter.getUsage');
      return null;
    }
  }

  /**
   * Validate storage key
   * @param {string} key - Storage key to validate
   * @throws {Error} When key is invalid
   * @private
   */
  validateKey(key) {
    if (typeof key !== 'string' || key.trim() === '') {
      const error = new Error('Storage key must be a non-empty string');
      error.type = 'VALIDATION';
      error.context = 'chrome-storage-adapter.validateKey';
      throw error;
    }
  }

  /**
   * Validate storage value
   * @param {*} value - Storage value to validate
   * @throws {Error} When value is invalid
   * @private
   */
  validateValue(value) {
    if (value === undefined) {
      const error = new Error('Storage value cannot be undefined');
      error.type = 'VALIDATION';
      error.context = 'chrome-storage-adapter.validateValue';
      throw error;
    }

    // Check for circular references
    try {
      JSON.stringify(value);
    } catch (error) {
      const validationError = new Error(
        'Storage value must be JSON serializable'
      );
      validationError.type = 'VALIDATION';
      validationError.context = 'chrome-storage-adapter.validateValue';
      throw validationError;
    }
  }
}

export default ChromeStorageAdapter;
