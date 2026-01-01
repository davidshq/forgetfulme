/**
 * @fileoverview Background service worker for ForgetfulMe extension
 * @module background
 * @description Handles background tasks, keyboard shortcuts, and message routing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Message types for Chrome extension runtime messaging
 * Note: Service workers can't use ES6 imports, so constants are defined here
 * @type {Object}
 */
const MESSAGE_TYPES = {
  MARK_AS_READ: 'MARK_AS_READ',
  BOOKMARK_SAVED: 'BOOKMARK_SAVED',
  BOOKMARK_UPDATED: 'BOOKMARK_UPDATED',
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  GET_CONFIG_SUMMARY: 'GET_CONFIG_SUMMARY',
  CHECK_URL_STATUS: 'CHECK_URL_STATUS',
  URL_STATUS_RESULT: 'URL_STATUS_RESULT',
};

/**
 * Simple error handler for background script (service worker)
 * Since service workers can't use ES6 imports, this is a simplified version
 */
const BackgroundErrorHandler = {
  /**
   * Handle errors in background script
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  handle(error, context) {
    // Log error for debugging
    console.error(`[${context}] Error:`, error.message);

    // Show user-friendly notification if needed
    this.showErrorNotification(error, context);
  },

  /**
   * Show error notification to user
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  showErrorNotification(error, context) {
    // Only show notifications for certain types of errors
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
   * @param {string} context - Where the error occurred
   * @returns {string} User-friendly error message
   */
  getUserMessage(error, _context) {
    const message = error.message || error.toString();

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('HTTP')) {
      return 'Connection error. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('login') || message.includes('sign')) {
      return 'Authentication error. Please try signing in again.';
    }

    // Configuration errors
    if (message.includes('config') || message.includes('supabase')) {
      return 'Configuration error. Please check your settings and try again.';
    }

    // Default error message
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
 * @description Manages extension icon and badge updates based on URL status
 */
class IconManager {
  /**
   * Update the extension icon based on URL save status
   * @param {string|null} url - The URL being checked
   * @param {boolean} isSaved - Whether the URL is already saved
   * @description Updates the extension icon and badge to indicate save status
   */
  static updateIconForUrl(url, isSaved) {
    try {
      if (!url) {
        // Default state - no URL or browser page
        chrome.action.setBadgeText({ text: '' });
        return;
      }

      if (isSaved) {
        // URL is already saved - show checkmark
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      } else {
        // URL is not saved - show plus sign
        chrome.action.setBadgeText({ text: '+' });
        chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
      }
    } catch (_error) {
      // Ignore icon update errors
    }
  }

  /**
   * Update the extension badge based on authentication state
   * @param {Object|null} session - The authentication session object or null if signed out
   */
  static updateExtensionBadge(session) {
    try {
      if (session) {
        // User is authenticated - show green badge or checkmark
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      } else {
        // User is not authenticated - show warning or clear badge
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (_error) {
      // Ignore badge update errors
    }
  }
}

/**
 * Keyboard shortcut handler for background service worker
 * @class KeyboardShortcutHandler
 * @description Handles keyboard shortcut activation
 */
class KeyboardShortcutHandler {
  /**
   * Handle keyboard shortcut activation (Ctrl+Shift+R / Cmd+Shift+R)
   * @async
   * @param {ForgetfulMeBackground} background - Background service instance
   */
  static async handle(background) {
    try {
      // Check if user is authenticated before allowing keyboard shortcut
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

      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://')
      ) {
        return; // Don't mark browser pages
      }

      // Show notification to open popup for marking
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Click the extension icon to mark this page as read',
      });
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.handleKeyboardShortcut');
    }
  }
}

/**
 * Default settings initializer for background service worker
 * @class DefaultSettingsInitializer
 * @description Initializes default extension settings on first install
 */
class DefaultSettingsInitializer {
  /**
   * Initialize default extension settings if they don't exist
   * @async
   * @method initialize
   */
  static async initialize() {
    try {
      // Check if default settings already exist
      const result = await chrome.storage.sync.get(['customStatusTypes']);

      // Only initialize if custom status types don't exist
      if (!result.customStatusTypes) {
        const defaultStatusTypes = ['read', 'good-reference', 'low-value', 'revisit-later'];

        await chrome.storage.sync.set({
          customStatusTypes: defaultStatusTypes,
        });

        // Default settings initialized successfully
      }
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initializeDefaultSettings');
    }
  }
}

/**
 * Background service worker for the ForgetfulMe Chrome extension
 * @class ForgetfulMeBackground
 * @description Manages background tasks, keyboard shortcuts, and communication between extension contexts
 *
 * @example
 * // Automatically instantiated when the service worker loads
 * // No manual instantiation required
 */
class ForgetfulMeBackground {
  /**
   * Configuration constants for background service
   */
  static CONFIG = {
    CACHE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  };

  /**
   * Create and initialize a new background service worker instance
   * @static
   * @async
   * @method create
   * @description Factory method that creates and fully initializes a background instance
   * @returns {Promise<ForgetfulMeBackground>} Fully initialized background instance
   * @throws {Error} When initialization fails
   *
   * @example
   * const background = await ForgetfulMeBackground.create();
   */
  static async create() {
    const instance = new ForgetfulMeBackground();
    await instance.initialize();
    return instance;
  }

  /**
   * Initialize the background service worker
   * @constructor
   * @description Sets up the background with event listeners and caches
   * @private Use ForgetfulMeBackground.create() instead
   */
  constructor() {
    /** @type {Object|null} Current authentication state */
    this.authState = null;
    /** @type {Object} Cache for URL status to avoid repeated database calls */
    this.urlStatusCache = new Map();
    /** @type {number} Cache timeout in milliseconds */
    this.cacheTimeout = this.constructor.CONFIG.CACHE_TIMEOUT_MS;
    /** @type {boolean} Whether initialization has completed */
    this.initialized = false;

    /** @type {Object} Map of message types to handler methods */
    this.messageHandlers = {
      [MESSAGE_TYPES.MARK_AS_READ]: this.handleMarkAsReadMessage.bind(this),
      [MESSAGE_TYPES.BOOKMARK_SAVED]: this.handleBookmarkSavedMessage.bind(this),
      [MESSAGE_TYPES.BOOKMARK_UPDATED]: this.handleBookmarkUpdatedMessage.bind(this),
      [MESSAGE_TYPES.GET_AUTH_STATE]: this.handleGetAuthStateMessage.bind(this),
      [MESSAGE_TYPES.AUTH_STATE_CHANGED]: this.handleAuthStateChangedMessage.bind(this),
      [MESSAGE_TYPES.GET_CONFIG_SUMMARY]: this.handleGetConfigSummaryMessage.bind(this),
      [MESSAGE_TYPES.CHECK_URL_STATUS]: this.handleCheckUrlStatusMessage.bind(this),
      [MESSAGE_TYPES.URL_STATUS_RESULT]: this.handleUrlStatusResultMessage.bind(this),
    };

    this.initializeEventListeners();
  }

  /**
   * Initialize the background service worker asynchronously
   * @async
   * @method initialize
   * @description Performs all initialization tasks including auth state setup
   * @throws {Error} When initialization fails
   *
   * @example
   * // Called automatically by create() factory method
   * await background.initialize();
   */
  async initialize() {
    try {
      await this.initializeAuthState();
      this.initialized = true;
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initialize');
      throw error;
    }
  }

  /**
   * Ensure the background service worker is initialized before use
   * @method ensureInitialized
   * @throws {Error} When service is used before initialization
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error(`${this.constructor.name} used before initialization`);
    }
  }

  /**
   * Initialize authentication state from Chrome storage
   * @async
   * @method initializeAuthState
   * @description Loads the current authentication state from Chrome sync storage
   * @throws {Error} When storage access fails
   *
   * @example
   * // Called during background initialization
   * await background.initializeAuthState();
   */
  async initializeAuthState() {
    try {
      // Load current auth state from storage
      const result = await chrome.storage.sync.get(['auth_session']);
      this.authState = result.auth_session || null;

      // Auth state initialized successfully
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initializeAuthState');
    }
  }

  /**
   * Set up all Chrome extension event listeners
   * @method initializeEventListeners
   * @description Configures listeners for keyboard shortcuts, installation events, runtime messages, and storage changes
   *
   * @example
   * // Called during background initialization
   * background.initializeEventListeners();
   */
  initializeEventListeners() {
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener(command => {
      if (command === 'mark-as-read') {
        KeyboardShortcutHandler.handle(this);
      }
    });

    // Handle installation
    chrome.runtime.onInstalled.addListener(async details => {
      if (details.reason === 'install') {
        await DefaultSettingsInitializer.initialize();
      }
    });

    // Handle messages from popup and other contexts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle storage changes (auth state changes)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.auth_session) {
        this.handleStorageAuthChange(changes.auth_session.newValue);
      }
    });

    // Handle tab updates to check URL status
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkUrlStatus(tab);
      }
    });

    // Handle tab activation to check URL status
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

    // Handle action button click to check URL status
    chrome.action.onClicked.addListener(async tab => {
      if (tab.url) {
        await this.checkUrlStatus(tab);
      }
    });
  }

  /**
   * Handle messages from other extension contexts (popup, options, etc.)
   * @async
   * @method handleMessage
   * @param {Object} message - The message object containing type and data
   * @param {string} message.type - The type of message to handle
   * @param {Object} [message.data] - Optional data associated with the message
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   * @description Routes messages to appropriate handlers based on message type
   * @throws {Error} When message handling fails
   */
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

  /**
   * Handle MARK_AS_READ message
   * @async
   * @method handleMarkAsReadMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  async handleMarkAsReadMessage(message, _sender, sendResponse) {
    await this.handleMarkAsRead(message.data);
    sendResponse({ success: true });
  }

  /**
   * Handle bookmark cache and icon update for saved/updated bookmarks
   * @method handleBookmarkCacheUpdate
   * @param {Object} message - The message object
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleBookmarkCacheUpdate(message, sendResponse) {
    if (message.data && message.data.url) {
      this.clearUrlCache(message.data.url);
      IconManager.updateIconForUrl(message.data.url, true);
    }
    sendResponse({ success: true });
  }

  /**
   * Handle BOOKMARK_SAVED message
   * @method handleBookmarkSavedMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleBookmarkSavedMessage(message, _sender, sendResponse) {
    this.handleBookmarkCacheUpdate(message, sendResponse);
  }

  /**
   * Handle BOOKMARK_UPDATED message
   * @method handleBookmarkUpdatedMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleBookmarkUpdatedMessage(message, _sender, sendResponse) {
    this.handleBookmarkCacheUpdate(message, sendResponse);
  }

  /**
   * Handle GET_AUTH_STATE message
   * @async
   * @method handleGetAuthStateMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  async handleGetAuthStateMessage(_message, _sender, sendResponse) {
    const authState = await this.getAuthState();
    sendResponse({ success: true, authState });
  }

  /**
   * Handle AUTH_STATE_CHANGED message
   * @method handleAuthStateChangedMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleAuthStateChangedMessage(_message, _sender, _sendResponse) {
    // Auth state change message received - no action needed
  }

  /**
   * Handle GET_CONFIG_SUMMARY message
   * @method handleGetConfigSummaryMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleGetConfigSummaryMessage(_message, _sender, sendResponse) {
    const summary = this.getAuthSummary();
    sendResponse({ success: true, summary });
  }

  /**
   * Handle CHECK_URL_STATUS message
   * @async
   * @method handleCheckUrlStatusMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  async handleCheckUrlStatusMessage(_message, _sender, sendResponse) {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (currentTab && currentTab.url) {
      await this.checkUrlStatus(currentTab);
    }
    sendResponse({ success: true });
  }

  /**
   * Handle URL_STATUS_RESULT message
   * @method handleUrlStatusResultMessage
   * @param {Object} message - The message object
   * @param {Object} sender - Information about the message sender
   * @param {Function} sendResponse - Function to send response back to sender
   */
  handleUrlStatusResultMessage(message, _sender, sendResponse) {
    if (message.data && message.data.url && typeof message.data.isSaved === 'boolean') {
      this.urlStatusCache.set(message.data.url, {
        isSaved: message.data.isSaved,
        timestamp: Date.now(),
      });
      IconManager.updateIconForUrl(message.data.url, message.data.isSaved);
    }
    sendResponse({ success: true });
  }

  /**
   * Get the current authentication state from storage
   * @async
   * @method getAuthState
   * @returns {Promise<Object|null>} The current authentication session or null if not authenticated
   */
  async getAuthState() {
    const result = await chrome.storage.sync.get(['auth_session']);
    return result.auth_session || null;
  }

  /**
   * Check if the user is currently authenticated
   * @async
   * @method isAuthenticated
   * @returns {Promise<boolean>} True if user is authenticated, false otherwise
   */
  async isAuthenticated() {
    const authState = await this.getAuthState();
    return authState !== null;
  }

  /**
   * Handle authentication state changes and update UI accordingly
   * @method handleAuthStateChange
   * @param {Object|null} session - The authentication session object or null if signed out
   */
  handleAuthStateChange(session) {
    // Auth state changed - update UI accordingly

    // Update extension badge or icon based on auth state
    IconManager.updateExtensionBadge(session);

    // Show notification for significant auth changes
    if (session) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Successfully signed in!',
      });
    }
  }

  /**
   * Handle authentication state changes from storage events
   * @method handleStorageAuthChange
   * @param {Object|null} newAuthState - The new authentication state from storage
   */
  handleStorageAuthChange(newAuthState) {
    // Update local auth state
    this.authState = newAuthState;

    // Handle the auth state change
    this.handleAuthStateChange(newAuthState);
  }

  /**
   * Check if a URL is already saved and update icon accordingly
   * @async
   * @method checkUrlStatus
   * @param {Object} tab - The tab object containing URL information
   * @description Checks if the URL is already saved and updates the extension icon
   */
  async checkUrlStatus(tab) {
    try {
      // Skip browser pages and extension pages
      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('moz-extension://')
      ) {
        IconManager.updateIconForUrl(null, false);
        return;
      }

      // Check if user is authenticated
      if (!this.authState) {
        IconManager.updateIconForUrl(null, false);
        return;
      }

      // Check cache first
      const cacheKey = tab.url;
      const cached = this.urlStatusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        IconManager.updateIconForUrl(tab.url, cached.isSaved);
        return;
      }

      // For now, show default state since we can't access database from background
      // The popup will handle the actual URL checking when opened
      IconManager.updateIconForUrl(tab.url, false);
    } catch (_error) {
      // Error checking URL status - show default icon
      // On error, show default icon
      IconManager.updateIconForUrl(null, false);
    }
  }

  /**
   * Clear URL status cache when bookmark is saved or updated
   * @method clearUrlCache
   * @param {string} url - The URL to clear from cache
   * @description Removes a URL from the cache to force fresh check
   */
  clearUrlCache(url) {
    if (url) {
      this.urlStatusCache.delete(url);
    }
  }

  /**
   * Handle bookmark marking as read (placeholder for future implementation)
   * @async
   * @method handleMarkAsRead
   * @param {Object} _bookmarkData - Bookmark data (currently unused)
   */
  async handleMarkAsRead(_bookmarkData) {
    try {
      // This will be handled by the popup, background just shows notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Page marked as read!',
      });
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.handleMarkAsRead');
    }
  }

  /**
   * Get a summary of the current authentication state
   * @method getAuthSummary
   * @returns {Object} Authentication summary object
   */
  getAuthSummary() {
    return {
      isAuthenticated: this.authState !== null,
      hasSession: !!this.authState,
      userId: this.authState?.user?.id || null,
      email: this.authState?.user?.email || null,
      initialized: true,
    };
  }
}

// Initialize background service worker using factory method to ensure proper initialization order
ForgetfulMeBackground.create().catch(error => {
  BackgroundErrorHandler.handle(error, 'background.initialization');
});
