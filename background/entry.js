/**
 * @fileoverview Background service worker entry (bundled to dist/background.js)
 * @module background/entry
 */

import { MESSAGE_TYPES, STORAGE_KEYS } from '../utils/constants.js';
import { isRestrictedUrl } from '../utils/url-utils.js';
import { initializeDefaultSettings } from '../utils/config-storage.js';

/**
 * Lightweight error handler for the bundled background service worker.
 */
const BackgroundErrorHandler = {
  /**
   * Handle errors in background script
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  handle(error, context) {
    console.error(`[${context}] Error:`, error.message);
    this.showErrorNotification(error, context);
  },

  /**
   * Show error notification to user
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  showErrorNotification(error, context) {
    if (context.includes('auth') || context.includes('config')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: this.getUserMessage(error, context),
      });
    }
  },

  /**
   * Get user-friendly error message
   * @param {Error} error - The error object
   * @param {string} _context - Where the error occurred
   * @returns {string} User-friendly error message
   */
  getUserMessage(error, _context) {
    const message = error.message || error.toString();

    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('HTTP')
    ) {
      return 'Connection error. Please check your internet connection and try again.';
    }

    if (
      message.includes('auth') ||
      message.includes('login') ||
      message.includes('sign')
    ) {
      return 'Authentication error. Please try signing in again.';
    }

    if (message.includes('config') || message.includes('supabase')) {
      return 'Configuration error. Please check your settings and try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} context - Error context
   * @returns {Error} Standardized error object
   */
  createError(message, context) {
    const error = new Error(message);
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  },
};

/**
 * Icon manager for background service worker
 * @class IconManager
 * @description Updates the toolbar badge based on URL save status only
 */
class IconManager {
  /**
   * Update the extension badge based on URL save status
   * @param {string|null} url - The URL being checked
   * @param {boolean} isSaved - Whether the URL is already saved
   */
  static updateIconForUrl(url, isSaved) {
    try {
      if (!url) {
        chrome.action.setBadgeText({ text: '' });
        return;
      }

      if (isSaved) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      } else {
        chrome.action.setBadgeText({ text: '+' });
        chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
      }
    } catch (_error) {
      // Ignore icon update errors
    }
  }
}

/**
 * Keyboard shortcut handler for background service worker
 * @class KeyboardShortcutHandler
 */
class KeyboardShortcutHandler {
  /**
   * Queue mark-as-read for the active tab and open the popup.
   * @async
   * @param {ForgetfulMeBackground} background - Background service instance
   */
  static async handle(background) {
    try {
      const isAuthenticated = await background.isAuthenticated();

      if (!isAuthenticated) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ForgetfulMe',
          message: 'Please sign in to use keyboard shortcuts',
        });
        return;
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url || isRestrictedUrl(tab.url)) {
        return;
      }

      await chrome.storage.session.set({
        [STORAGE_KEYS.PENDING_MARK_AS_READ]: {
          url: tab.url,
          requestedAt: Date.now(),
        },
      });

      try {
        await chrome.action.openPopup();
      } catch (_error) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ForgetfulMe',
          message: 'Click the extension icon to mark this page as read',
        });
      }
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.handleKeyboardShortcut');
    }
  }
}

/**
 * Default settings initializer for background service worker
 * @class DefaultSettingsInitializer
 */
class DefaultSettingsInitializer {
  /**
   * Initialize default extension settings if they don't exist
   * @async
   */
  static async initialize() {
    try {
      const result = await chrome.storage.sync.get(['customStatusTypes']);

      if (!result.customStatusTypes) {
        await initializeDefaultSettings();
      }
    } catch (error) {
      BackgroundErrorHandler.handle(
        error,
        'background.initializeDefaultSettings',
      );
    }
  }
}

/**
 * Background service worker for the ForgetfulMe Chrome extension
 * @class ForgetfulMeBackground
 */
class ForgetfulMeBackground {
  static CONFIG = {
    CACHE_TIMEOUT_MS: 5 * 60 * 1000,
  };

  /**
   * @returns {Promise<ForgetfulMeBackground>}
   */
  static async create() {
    const instance = new ForgetfulMeBackground();
    await instance.initialize();
    return instance;
  }

  constructor() {
    /** @type {Object|null} */
    this.authState = null;
    /** @type {Map<string, { isSaved: boolean, timestamp: number }>} */
    this.urlStatusCache = new Map();
    this.cacheTimeout = this.constructor.CONFIG.CACHE_TIMEOUT_MS;
    /** @type {boolean} True after initial auth state is loaded from storage */
    this.authReady = false;

    this.messageHandlers = {
      [MESSAGE_TYPES.BOOKMARK_SAVED]:
        this.handleBookmarkSavedMessage.bind(this),
      [MESSAGE_TYPES.BOOKMARK_UPDATED]:
        this.handleBookmarkUpdatedMessage.bind(this),
      [MESSAGE_TYPES.GET_AUTH_STATE]: this.handleGetAuthStateMessage.bind(this),
      [MESSAGE_TYPES.URL_STATUS_RESULT]:
        this.handleUrlStatusResultMessage.bind(this),
    };

    this.initializeEventListeners();
  }

  async initialize() {
    try {
      await this.initializeAuthState();
      this.authReady = true;
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initialize');
      throw error;
    }
  }

  async initializeAuthState() {
    try {
      const result = await chrome.storage.sync.get(['auth_session']);
      this.authState = result.auth_session || null;
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initializeAuthState');
    }
  }

  initializeEventListeners() {
    chrome.commands.onCommand.addListener(command => {
      if (command === 'mark-as-read') {
        KeyboardShortcutHandler.handle(this);
      }
    });

    chrome.runtime.onInstalled.addListener(async details => {
      if (details.reason === 'install') {
        await DefaultSettingsInitializer.initialize();
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.auth_session) {
        this.handleStorageAuthChange(changes.auth_session);
      }
    });

    chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkUrlStatus(tab);
      }
    });

    chrome.tabs.onActivated.addListener(async activeInfo => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          this.checkUrlStatus(tab);
        }
      } catch (error) {
        BackgroundErrorHandler.handle(error, 'background.tabActivation');
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      const handler = this.messageHandlers[message.type];
      if (!handler) {
        sendResponse({
          success: false,
          error: `Unknown message type: ${message.type}`,
        });
        return;
      }
      await handler(message, sender, sendResponse);
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  handleBookmarkCacheUpdate(message, sendResponse) {
    if (message.data?.url) {
      this.clearUrlCache(message.data.url);
      IconManager.updateIconForUrl(message.data.url, true);
    }
    sendResponse({ success: true });
  }

  handleBookmarkSavedMessage(message, _sender, sendResponse) {
    this.handleBookmarkCacheUpdate(message, sendResponse);
  }

  handleBookmarkUpdatedMessage(message, _sender, sendResponse) {
    this.handleBookmarkCacheUpdate(message, sendResponse);
  }

  async handleGetAuthStateMessage(_message, _sender, sendResponse) {
    const authState = await this.getAuthState();
    sendResponse({ success: true, authState });
  }

  handleUrlStatusResultMessage(message, _sender, sendResponse) {
    if (message.data?.url && typeof message.data.isSaved === 'boolean') {
      this.urlStatusCache.set(message.data.url, {
        isSaved: message.data.isSaved,
        timestamp: Date.now(),
      });
      IconManager.updateIconForUrl(message.data.url, message.data.isSaved);
    }
    sendResponse({ success: true });
  }

  async getAuthState() {
    const result = await chrome.storage.sync.get(['auth_session']);
    return result.auth_session || null;
  }

  async isAuthenticated() {
    const authState = await this.getAuthState();
    return authState !== null;
  }

  /**
   * @param {chrome.storage.StorageChange} authChange
   */
  handleStorageAuthChange(authChange) {
    const oldAuthState = authChange.oldValue ?? this.authState;
    const newAuthState = authChange.newValue ?? null;
    this.authState = newAuthState;

    if (this.authReady && !oldAuthState && newAuthState) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Successfully signed in!',
      });
    }

    if (!newAuthState) {
      IconManager.updateIconForUrl(null, false);
    }
  }

  async checkUrlStatus(tab) {
    try {
      if (isRestrictedUrl(tab.url)) {
        IconManager.updateIconForUrl(null, false);
        return;
      }

      if (!(await this.isAuthenticated())) {
        IconManager.updateIconForUrl(null, false);
        return;
      }

      const cacheKey = tab.url;
      const cached = this.urlStatusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        IconManager.updateIconForUrl(tab.url, cached.isSaved);
        return;
      }

      // Popup reports real status via URL_STATUS_RESULT when opened
      IconManager.updateIconForUrl(tab.url, false);
    } catch (_error) {
      IconManager.updateIconForUrl(null, false);
    }
  }

  clearUrlCache(url) {
    if (url) {
      this.urlStatusCache.delete(url);
    }
  }
}

ForgetfulMeBackground.create().catch(error => {
  BackgroundErrorHandler.handle(error, 'background.initialization');
});
