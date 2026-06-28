(() => {
  // utils/constants.js
  var MESSAGE_TYPES = {
    MARK_AS_READ: "MARK_AS_READ",
    BOOKMARK_SAVED: "BOOKMARK_SAVED",
    BOOKMARK_UPDATED: "BOOKMARK_UPDATED",
    GET_AUTH_STATE: "GET_AUTH_STATE",
    AUTH_STATE_CHANGED: "AUTH_STATE_CHANGED",
    GET_CONFIG_SUMMARY: "GET_CONFIG_SUMMARY",
    CHECK_URL_STATUS: "CHECK_URL_STATUS",
    URL_STATUS_RESULT: "URL_STATUS_RESULT"
  };
  var DEFAULT_STATUS_TYPES = [
    "read",
    "good-reference",
    "low-value",
    "revisit-later"
  ];

  // utils/url-utils.js
  var RESTRICTED_URL_PREFIXES = [
    "chrome://",
    "chrome-extension://",
    "about:",
    "moz-extension://"
  ];
  function isRestrictedUrl(url) {
    if (!url) {
      return true;
    }
    return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
  }

  // utils/config-storage.js
  async function initializeDefaultSettings() {
    const defaultSettings = {
      customStatusTypes: [...DEFAULT_STATUS_TYPES]
    };
    await chrome.storage.sync.set(defaultSettings);
    return defaultSettings;
  }

  // background/entry.js
  var BackgroundErrorHandler = {
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
      if (context.includes("auth") || context.includes("config")) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "ForgetfulMe",
          message: this.getUserMessage(error, context)
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
      if (message.includes("fetch") || message.includes("network") || message.includes("HTTP")) {
        return "Connection error. Please check your internet connection and try again.";
      }
      if (message.includes("auth") || message.includes("login") || message.includes("sign")) {
        return "Authentication error. Please try signing in again.";
      }
      if (message.includes("config") || message.includes("supabase")) {
        return "Configuration error. Please check your settings and try again.";
      }
      return "An unexpected error occurred. Please try again.";
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
      error.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      return error;
    }
  };
  var IconManager = class {
    /**
     * Update the extension icon based on URL save status
     * @param {string|null} url - The URL being checked
     * @param {boolean} isSaved - Whether the URL is already saved
     * @description Updates the extension icon and badge to indicate save status
     */
    static updateIconForUrl(url, isSaved) {
      try {
        if (!url) {
          chrome.action.setBadgeText({ text: "" });
          return;
        }
        if (isSaved) {
          chrome.action.setBadgeText({ text: "\u2713" });
          chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
        } else {
          chrome.action.setBadgeText({ text: "+" });
          chrome.action.setBadgeBackgroundColor({ color: "#2196F3" });
        }
      } catch (_error) {
      }
    }
    /**
     * Update the extension badge based on authentication state
     * @param {Object|null} session - The authentication session object or null if signed out
     */
    static updateExtensionBadge(session) {
      try {
        if (session) {
          chrome.action.setBadgeText({ text: "\u2713" });
          chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
        } else {
          chrome.action.setBadgeText({ text: "" });
        }
      } catch (_error) {
      }
    }
  };
  var KeyboardShortcutHandler = class {
    /**
     * Handle keyboard shortcut activation (Ctrl+Shift+R / Cmd+Shift+R)
     * @async
     * @param {ForgetfulMeBackground} background - Background service instance
     */
    static async handle(background) {
      try {
        const isAuthenticated = await background.isAuthenticated();
        if (!isAuthenticated) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "ForgetfulMe",
            message: "Please sign in to use keyboard shortcuts"
          });
          return;
        }
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (!tab.url || isRestrictedUrl(tab.url)) {
          return;
        }
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "ForgetfulMe",
          message: "Click the extension icon to mark this page as read"
        });
      } catch (error) {
        BackgroundErrorHandler.handle(error, "background.handleKeyboardShortcut");
      }
    }
  };
  var DefaultSettingsInitializer = class {
    /**
     * Initialize default extension settings if they don't exist
     * @async
     * @method initialize
     */
    static async initialize() {
      try {
        const result = await chrome.storage.sync.get(["customStatusTypes"]);
        if (!result.customStatusTypes) {
          await initializeDefaultSettings();
        }
      } catch (error) {
        BackgroundErrorHandler.handle(
          error,
          "background.initializeDefaultSettings"
        );
      }
    }
  };
  var ForgetfulMeBackground = class _ForgetfulMeBackground {
    /**
     * Configuration constants for background service
     */
    static CONFIG = {
      CACHE_TIMEOUT_MS: 5 * 60 * 1e3
      // 5 minutes
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
      const instance = new _ForgetfulMeBackground();
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
      this.authState = null;
      this.urlStatusCache = /* @__PURE__ */ new Map();
      this.cacheTimeout = this.constructor.CONFIG.CACHE_TIMEOUT_MS;
      this.initialized = false;
      this.messageHandlers = {
        [MESSAGE_TYPES.MARK_AS_READ]: this.handleMarkAsReadMessage.bind(this),
        [MESSAGE_TYPES.BOOKMARK_SAVED]: this.handleBookmarkSavedMessage.bind(this),
        [MESSAGE_TYPES.BOOKMARK_UPDATED]: this.handleBookmarkUpdatedMessage.bind(this),
        [MESSAGE_TYPES.GET_AUTH_STATE]: this.handleGetAuthStateMessage.bind(this),
        [MESSAGE_TYPES.AUTH_STATE_CHANGED]: this.handleAuthStateChangedMessage.bind(this),
        [MESSAGE_TYPES.GET_CONFIG_SUMMARY]: this.handleGetConfigSummaryMessage.bind(this),
        [MESSAGE_TYPES.CHECK_URL_STATUS]: this.handleCheckUrlStatusMessage.bind(this),
        [MESSAGE_TYPES.URL_STATUS_RESULT]: this.handleUrlStatusResultMessage.bind(this)
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
        BackgroundErrorHandler.handle(error, "background.initialize");
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
        const result = await chrome.storage.sync.get(["auth_session"]);
        this.authState = result.auth_session || null;
      } catch (error) {
        BackgroundErrorHandler.handle(error, "background.initializeAuthState");
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
      chrome.commands.onCommand.addListener((command) => {
        if (command === "mark-as-read") {
          KeyboardShortcutHandler.handle(this);
        }
      });
      chrome.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === "install") {
          await DefaultSettingsInitializer.initialize();
        }
      });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "sync" && changes.auth_session) {
          this.handleStorageAuthChange(changes.auth_session.newValue);
        }
      });
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.url) {
          this.checkUrlStatus(tab);
        }
      });
      chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
          const tab = await chrome.tabs.get(activeInfo.tabId);
          if (tab.url) {
            this.checkUrlStatus(tab);
          }
        } catch (error) {
          BackgroundErrorHandler.handle(error, "background.tabActivation");
        }
      });
      chrome.action.onClicked.addListener(async (tab) => {
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
            error: `Unknown message type: ${message.type}`
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
        currentWindow: true
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
      if (message.data && message.data.url && typeof message.data.isSaved === "boolean") {
        this.urlStatusCache.set(message.data.url, {
          isSaved: message.data.isSaved,
          timestamp: Date.now()
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
      const result = await chrome.storage.sync.get(["auth_session"]);
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
      IconManager.updateExtensionBadge(session);
      if (session) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "ForgetfulMe",
          message: "Successfully signed in!"
        });
      }
    }
    /**
     * Handle authentication state changes from storage events
     * @method handleStorageAuthChange
     * @param {Object|null} newAuthState - The new authentication state from storage
     */
    handleStorageAuthChange(newAuthState) {
      this.authState = newAuthState;
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
        if (isRestrictedUrl(tab.url)) {
          IconManager.updateIconForUrl(null, false);
          return;
        }
        if (!this.authState) {
          IconManager.updateIconForUrl(null, false);
          return;
        }
        const cacheKey = tab.url;
        const cached = this.urlStatusCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          IconManager.updateIconForUrl(tab.url, cached.isSaved);
          return;
        }
        IconManager.updateIconForUrl(tab.url, false);
      } catch (_error) {
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
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "ForgetfulMe",
          message: "Page marked as read!"
        });
      } catch (error) {
        BackgroundErrorHandler.handle(error, "background.handleMarkAsRead");
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
        initialized: true
      };
    }
  };
  ForgetfulMeBackground.create().catch((error) => {
    BackgroundErrorHandler.handle(error, "background.initialization");
  });
})();
