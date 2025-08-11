/**
 * @fileoverview Simplified Chrome storage wrapper service for the ForgetfulMe extension
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { withServicePatterns } from '../utils/serviceHelpers.js';

/**
 * Simplified service for managing Chrome storage (sync and local) with basic caching
 */
export class StorageService extends withServicePatterns(class {}) {
  /**
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(errorService) {
    super();
    this.errorService = errorService;
    this.cache = new Map();
    this.changeListeners = new Map();

    this.setupStorageListener();
  }

  /**
   * Get data from storage with simple caching
   * @param {string|string[]} key - Storage key or array of keys
   * @param {boolean|Object} [useSync=true] - Whether to use sync storage or options object
   * @param {number} [_cacheDuration] - Cache duration (ignored in simplified version)
   * @returns {Promise<*>} Retrieved data
   */
  async get(key, useSync = true, _cacheDuration) {
    try {
      let defaultValue = undefined;

      // Handle options object format for test compatibility
      if (typeof useSync === 'object' && useSync !== null) {
        const options = useSync;
        useSync = options.area !== 'local';
        defaultValue = options.defaultValue;
      }

      // Check for missing Chrome storage API (test scenario)
      if (
        !chrome.storage ||
        (useSync && !chrome.storage.sync) ||
        (!useSync && !chrome.storage.local)
      ) {
        throw new Error('Chrome storage API not available');
      }

      // For array of keys, get all at once
      if (Array.isArray(key)) {
        const storage = useSync ? chrome.storage.sync : chrome.storage.local;
        const result = await storage.get(key);
        return result;
      }

      // Check simple cache first for single key
      const cachedData = this.cache.get(key);
      if (cachedData !== undefined) {
        // Always return in Chrome storage format: { [key]: value }
        return { [key]: cachedData };
      }

      const storage = useSync ? chrome.storage.sync : chrome.storage.local;
      const result = await storage.get(key);

      // Handle default value if key not found
      if (result[key] === undefined && defaultValue !== undefined) {
        return defaultValue;
      }

      // For single key requests, update cache and return result
      if (typeof key === 'string') {
        this.cache.set(key, result[key]);
        return result;
      }

      return result;
    } catch (error) {
      if (error.message === 'Chrome storage API not available') {
        throw error;
      }
      const errorInfo = this.errorService.handle(error, 'StorageService.get');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Set data in storage and update cache
   * @param {string|Object} key - Storage key or object of key-value pairs
   * @param {*} [value] - Data to store (if key is string)
   * @param {boolean|Object} [useSync=true] - Whether to use sync storage or options object
   * @returns {Promise<void>}
   */
  async set(key, value, useSync = true) {
    try {
      let data;
      let actualUseSync = useSync;

      // Handle different call patterns
      if (typeof key === 'object' && key !== null && value === undefined) {
        data = key;
        actualUseSync = true;
      } else if (typeof key === 'object' && typeof value === 'object' && value.area) {
        data = key;
        actualUseSync = value.area !== 'local';
      } else if (typeof key === 'string') {
        data = { [key]: value };
        if (typeof useSync === 'object' && useSync !== null) {
          actualUseSync = useSync.area !== 'local';
        }
      } else {
        throw new Error('Invalid arguments for set method');
      }

      // Basic validation
      try {
        const dataString = JSON.stringify(data);
        if (dataString.length > 8192) {
          throw new Error('Data too large for storage');
        }
      } catch (serializeError) {
        if (serializeError.message.includes('circular')) {
          throw new Error('Cannot store circular references');
        }
        if (serializeError.message === 'Data too large for storage') {
          throw serializeError;
        }
        throw new Error('Data must be JSON serializable');
      }

      const storage = actualUseSync ? chrome.storage.sync : chrome.storage.local;
      await storage.set(data);

      // Update cache for each key
      Object.entries(data).forEach(([k, v]) => {
        this.cache.set(k, v);
      });
    } catch (error) {
      if (
        error.message === 'QUOTA_EXCEEDED' ||
        error.message === 'Data too large for storage' ||
        error.message === 'Cannot store circular references' ||
        error.message === 'Data must be JSON serializable'
      ) {
        throw error;
      }
      const errorInfo = this.errorService.handle(error, 'StorageService.set');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Remove data from storage and cache
   * @param {string|string[]} key - Storage key or array of keys
   * @param {boolean|Object} [useSync=true] - Whether to use sync storage or options object
   * @returns {Promise<void>}
   */
  async remove(key, useSync = true) {
    try {
      let actualUseSync = useSync;

      if (typeof useSync === 'object' && useSync !== null) {
        actualUseSync = useSync.area !== 'local';
      }

      const storage = actualUseSync ? chrome.storage.sync : chrome.storage.local;
      await storage.remove(key);

      // Clear from cache
      const keys = Array.isArray(key) ? key : [key];
      keys.forEach(k => this.cache.delete(k));
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.remove');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Clear all storage and cache
   * @param {boolean|Object} [useSync=true] - Whether to use sync storage or options object
   * @returns {Promise<void>}
   */
  async clear(useSync = true) {
    try {
      let actualUseSync = useSync;

      if (typeof useSync === 'object' && useSync !== null) {
        actualUseSync = useSync.area !== 'local';
      }

      const storage = actualUseSync ? chrome.storage.sync : chrome.storage.local;
      await storage.clear();

      this.cache.clear();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.clear');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Get user session data
   * @returns {Promise<Object|null>} User session or null
   */
  async getUserSession() {
    const result = await this.get(STORAGE_KEYS.USER_SESSION, true);
    return result[STORAGE_KEYS.USER_SESSION] || null;
  }

  /**
   * Set user session data
   * @param {Object} session - User session data
   * @returns {Promise<void>}
   */
  async setUserSession(session) {
    await this.set(STORAGE_KEYS.USER_SESSION, session, true);
  }

  /**
   * Clear user session
   * @returns {Promise<void>}
   */
  async clearUserSession() {
    await this.remove(STORAGE_KEYS.USER_SESSION, true);
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    const result = await this.get(STORAGE_KEYS.USER_PREFERENCES, true);
    const preferences = result[STORAGE_KEYS.USER_PREFERENCES];
    return preferences || this.getDefaultPreferences();
  }

  /**
   * Set user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async setUserPreferences(preferences) {
    await this.set(STORAGE_KEYS.USER_PREFERENCES, preferences, true);
  }

  /**
   * Get Supabase configuration
   * @returns {Promise<Object|null>} Supabase config or null
   */
  async getSupabaseConfig() {
    const result = await this.get(STORAGE_KEYS.SUPABASE_CONFIG, true);
    return result[STORAGE_KEYS.SUPABASE_CONFIG] || null;
  }

  /**
   * Set Supabase configuration
   * @param {Object} config - Supabase configuration
   * @returns {Promise<void>}
   */
  async setSupabaseConfig(config) {
    await this.set(STORAGE_KEYS.SUPABASE_CONFIG, config, true);
  }

  /**
   * Get bookmark cache (for test compatibility)
   * @param {string} [userId] - User ID for user-specific cache
   * @returns {Object[]|null} Cached bookmarks or null
   */
  getBookmarkCache(userId = null) {
    if (userId !== null && typeof userId !== 'string') {
      throw new Error('getBookmarkCache: userId must be a string or null');
    }

    if (userId) {
      if (userId.trim() === '') {
        throw new Error('getBookmarkCache: userId cannot be empty string');
      }
      const userCache = this.cache.get(`bookmarks:${userId}`);
      return userCache || null;
    }
    return null;
  }

  /**
   * Set bookmark cache
   * @param {string|Object[]} userIdOrBookmarks - User ID or bookmarks array
   * @param {Object[]} [bookmarks] - Bookmarks if first param is userId
   * @returns {Promise<void>}
   */
  async setBookmarkCache(userIdOrBookmarks, bookmarks) {
    if (typeof userIdOrBookmarks === 'string') {
      // setBookmarkCache(userId, bookmarks)
      this.cache.set(`bookmarks:${userIdOrBookmarks}`, bookmarks);
    } else {
      // setBookmarkCache(bookmarks) - legacy support
      this.cache.set('bookmarks', userIdOrBookmarks);
    }
  }

  /**
   * Clear bookmark cache
   * @param {string} [userId] - User ID to clear specific cache
   * @returns {Promise<void>}
   */
  async clearBookmarkCache(userId = null) {
    if (userId) {
      this.cache.delete(`bookmarks:${userId}`);
    } else {
      // Clear all bookmark caches
      for (const key of this.cache.keys()) {
        if (key.startsWith('bookmarks')) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Get status types
   * @returns {Promise<Object[]>} Status types
   */
  async getStatusTypes() {
    const result = await this.get('status_types', true);
    return result['status_types'] || [];
  }

  /**
   * Set status types
   * @param {Object[]} statusTypes - Status types array
   * @returns {Promise<void>}
   */
  async setStatusTypes(statusTypes) {
    await this.set('status_types', statusTypes, true);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get default preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'auto',
      notifications: true,
      autoMarkRead: false,
      defaultStatus: 'read'
    };
  }

  /**
   * Setup storage change listener
   */
  setupStorageListener() {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        try {
          // Update cache when storage changes
          Object.keys(changes).forEach(key => {
            if (changes[key].newValue === undefined) {
              this.cache.delete(key);
            } else {
              this.cache.set(key, changes[key].newValue);
            }
          });

          // Notify listeners
          this.changeListeners.forEach(callback => {
            try {
              callback(changes, area);
            } catch (error) {
              console.error('Storage change listener error:', error);
            }
          });
        } catch (error) {
          if (this.errorService) {
            this.errorService.handle(error, 'StorageService.changeListener');
          } else {
            console.error('StorageService change listener error:', error);
          }
        }
      });
    }
  }

  /**
   * Add storage change listener
   * @param {string} id - Listener ID
   * @param {Function} callback - Callback function
   */
  addChangeListener(id, callback) {
    this.changeListeners.set(id, callback);
  }

  /**
   * Remove storage change listener
   * @param {string} id - Listener ID
   */
  removeChangeListener(id) {
    this.changeListeners.delete(id);
  }

  /**
   * Get storage usage information (simplified)
   * @returns {Promise<Object>} Storage usage info
   */
  async getStorageUsage() {
    try {
      const syncUsage =
        chrome.storage.sync && chrome.storage.sync.getBytesInUse
          ? await chrome.storage.sync.getBytesInUse()
          : 0;
      const localUsage =
        chrome.storage.local && chrome.storage.local.getBytesInUse
          ? await chrome.storage.local.getBytesInUse()
          : 0;

      return {
        sync: {
          used: syncUsage,
          quota: 102400,
          percentUsed: (syncUsage / 102400) * 100
        },
        local: {
          used: localUsage,
          quota: 5242880,
          percentUsed: (localUsage / 5242880) * 100
        }
      };
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.getStorageUsage');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Export data (simplified)
   * @returns {Promise<Object>} Exported data
   */
  async exportData() {
    try {
      const syncData = chrome.storage.sync ? await chrome.storage.sync.get() : {};
      const localData = chrome.storage.local ? await chrome.storage.local.get() : {};

      return {
        exportedAt: new Date().toISOString(),
        sync: syncData,
        local: localData
      };
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.exportData');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }

  /**
   * Import data (simplified)
   * @param {Object} data - Data to import
   * @returns {Promise<void>}
   */
  async importData(data) {
    try {
      if (data.sync && chrome.storage.sync) {
        await chrome.storage.sync.set(data.sync);
      }
      if (data.local && chrome.storage.local) {
        await chrome.storage.local.set(data.local);
      }
      this.cache.clear(); // Clear cache after import
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.importData');
      const wrappedError = new Error(errorInfo.message);
      wrappedError.cause = error;
      wrappedError.errorCode = errorInfo.code;
      throw wrappedError;
    }
  }
}
