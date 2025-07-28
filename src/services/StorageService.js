/**
 * @fileoverview Chrome storage wrapper service for the ForgetfulMe extension
 */

import { STORAGE_KEYS, CACHE_DURATION } from '../utils/constants.js';

/**
 * Service for managing Chrome storage (sync and local) with caching
 */
export class StorageService {
  /**
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(errorService) {
    this.errorService = errorService;
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.changeListeners = new Map();

    this.setupStorageListener();
  }

  /**
   * Get data from storage with caching
   * @param {string} key - Storage key
   * @param {boolean} [useSync=true] - Whether to use sync storage
   * @param {number} [cacheDuration] - Cache duration in milliseconds
   * @returns {Promise<*>} Retrieved data
   */
  async get(key, useSync = true, cacheDuration = CACHE_DURATION.BOOKMARKS) {
    try {
      // Check cache first
      if (this.isCacheValid(key, cacheDuration)) {
        return this.cache.get(key);
      }

      const storage = useSync ? chrome.storage.sync : chrome.storage.local;
      const result = await storage.get(key);
      const data = result[key];

      // Update cache
      this.cache.set(key, data);
      this.cacheTimestamps.set(key, Date.now());

      return data;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.get');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Set data in storage and update cache
   * @param {string} key - Storage key
   * @param {*} value - Data to store
   * @param {boolean} [useSync=true] - Whether to use sync storage
   * @returns {Promise<void>}
   */
  async set(key, value, useSync = true) {
    try {
      const storage = useSync ? chrome.storage.sync : chrome.storage.local;
      await storage.set({ [key]: value });

      // Update cache
      this.cache.set(key, value);
      this.cacheTimestamps.set(key, Date.now());
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.set');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Remove data from storage and cache
   * @param {string} key - Storage key
   * @param {boolean} [useSync=true] - Whether to use sync storage
   * @returns {Promise<void>}
   */
  async remove(key, useSync = true) {
    try {
      const storage = useSync ? chrome.storage.sync : chrome.storage.local;
      await storage.remove(key);

      // Clear from cache
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.remove');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Clear all storage and cache
   * @param {boolean} [useSync=true] - Whether to use sync storage
   * @returns {Promise<void>}
   */
  async clear(useSync = true) {
    try {
      const storage = useSync ? chrome.storage.sync : chrome.storage.local;
      await storage.clear();

      // Clear cache
      this.cache.clear();
      this.cacheTimestamps.clear();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.clear');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Get user session data
   * @returns {Promise<Object|null>} User session or null
   */
  async getUserSession() {
    return await this.get(STORAGE_KEYS.USER_SESSION, true, CACHE_DURATION.USER_PROFILE);
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
    const preferences = await this.get(
      STORAGE_KEYS.USER_PREFERENCES,
      true,
      CACHE_DURATION.USER_PROFILE
    );
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
    return await this.get(STORAGE_KEYS.SUPABASE_CONFIG, true, CACHE_DURATION.USER_PROFILE);
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
   * Get bookmark cache
   * @returns {Promise<Object[]>} Cached bookmarks
   */
  async getBookmarkCache() {
    const cache = await this.get(STORAGE_KEYS.BOOKMARK_CACHE, false, CACHE_DURATION.BOOKMARKS);
    return cache || [];
  }

  /**
   * Set bookmark cache
   * @param {Object[]} bookmarks - Bookmarks to cache
   * @returns {Promise<void>}
   */
  async setBookmarkCache(bookmarks) {
    await this.set(STORAGE_KEYS.BOOKMARK_CACHE, bookmarks, false);
  }

  /**
   * Clear bookmark cache
   * @returns {Promise<void>}
   */
  async clearBookmarkCache() {
    await this.remove(STORAGE_KEYS.BOOKMARK_CACHE, false);
  }

  /**
   * Get status types
   * @returns {Promise<Object[]>} Status types
   */
  async getStatusTypes() {
    return await this.get(STORAGE_KEYS.STATUS_TYPES, true, CACHE_DURATION.STATUS_TYPES);
  }

  /**
   * Set status types
   * @param {Object[]} statusTypes - Status types
   * @returns {Promise<void>}
   */
  async setStatusTypes(statusTypes) {
    await this.set(STORAGE_KEYS.STATUS_TYPES, statusTypes, true);
  }

  /**
   * Get last sync timestamp
   * @returns {Promise<number|null>} Last sync timestamp
   */
  async getLastSync() {
    return await this.get(STORAGE_KEYS.LAST_SYNC, false);
  }

  /**
   * Set last sync timestamp
   * @param {number} timestamp - Sync timestamp
   * @returns {Promise<void>}
   */
  async setLastSync(timestamp) {
    await this.set(STORAGE_KEYS.LAST_SYNC, timestamp, false);
  }

  /**
   * Add storage change listener
   * @param {string} key - Storage key to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  addChangeListener(key, callback) {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    this.changeListeners.get(key).add(callback);

    // Return cleanup function
    return () => {
      const listeners = this.changeListeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.changeListeners.delete(key);
        }
      }
    };
  }

  /**
   * Check if cache is valid for a key
   * @param {string} key - Cache key
   * @param {number} duration - Cache duration in milliseconds
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid(key, duration) {
    if (!this.cache.has(key) || !this.cacheTimestamps.has(key)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(key);
    return Date.now() - timestamp < duration;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      // Use default cache duration for cleanup
      if (now - timestamp > CACHE_DURATION.BOOKMARKS) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: Object.fromEntries(this.cacheTimestamps)
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage statistics
   */
  async getStorageUsage() {
    try {
      const [syncUsage, localUsage] = await Promise.all([
        chrome.storage.sync.getBytesInUse(),
        chrome.storage.local.getBytesInUse()
      ]);

      return {
        sync: {
          used: syncUsage,
          quota: chrome.storage.sync.QUOTA_BYTES,
          available: chrome.storage.sync.QUOTA_BYTES - syncUsage,
          percentUsed: (syncUsage / chrome.storage.sync.QUOTA_BYTES) * 100
        },
        local: {
          used: localUsage,
          quota: chrome.storage.local.QUOTA_BYTES,
          available: chrome.storage.local.QUOTA_BYTES - localUsage,
          percentUsed: (localUsage / chrome.storage.local.QUOTA_BYTES) * 100
        }
      };
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.getStorageUsage');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Get default user preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      defaultStatus: 'unread',
      autoSync: true,
      syncInterval: 'normal',
      showNotifications: true,
      compactView: false,
      itemsPerPage: 25,
      sortBy: 'created_at',
      sortOrder: 'desc',
      theme: 'system'
    };
  }

  /**
   * Set up storage change listener
   * @private
   */
  setupStorageListener() {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        Object.keys(changes).forEach(key => {
          // Clear cache for changed keys
          this.cache.delete(key);
          this.cacheTimestamps.delete(key);

          // Notify listeners
          const listeners = this.changeListeners.get(key);
          if (listeners) {
            const change = changes[key];
            listeners.forEach(callback => {
              try {
                callback(change.newValue, change.oldValue, areaName);
              } catch (error) {
                this.errorService.handle(error, 'StorageService.changeListener');
              }
            });
          }
        });
      });
    }
  }

  /**
   * Export all data for backup
   * @returns {Promise<Object>} All stored data
   */
  async exportData() {
    try {
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(),
        chrome.storage.local.get()
      ]);

      return {
        sync: syncData,
        local: localData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.exportData');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Import data from backup
   * @param {Object} data - Data to import
   * @returns {Promise<void>}
   */
  async importData(data) {
    try {
      if (data.sync) {
        await chrome.storage.sync.set(data.sync);
      }

      if (data.local) {
        await chrome.storage.local.set(data.local);
      }

      // Clear cache to force refresh
      this.clearCache();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'StorageService.importData');
      throw new Error(errorInfo.message);
    }
  }
}
