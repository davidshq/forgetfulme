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
  getUserMessage(error, context) {
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
  }
};

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
   * Initialize the background service worker
   * @constructor
   * @description Sets up event listeners and initializes authentication state
   */
  constructor() {
    /** @type {Object|null} Current authentication state */
    this.authState = null;
    /** @type {Object} Cache for URL status to avoid repeated database calls */
    this.urlStatusCache = new Map();
    /** @type {number} Cache timeout in milliseconds (5 minutes) */
    this.cacheTimeout = 5 * 60 * 1000;

    this.initializeEventListeners();
    this.initializeAuthState();
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
        this.handleKeyboardShortcut();
      }
    });

    // Handle installation
    chrome.runtime.onInstalled.addListener(async details => {
      if (details.reason === 'install') {
        await this.initializeDefaultSettings();
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
   *
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'MARK_AS_READ':
          await this.handleMarkAsRead(message.data);
          sendResponse({ success: true });
          break;

        case 'BOOKMARK_SAVED':
          // Clear cache for the saved URL to force fresh check
          if (message.data && message.data.url) {
            this.clearUrlCache(message.data.url);
            // Update icon to show saved state
            this.updateIconForUrl(message.data.url, true);
          }
          sendResponse({ success: true });
          break;

        case 'BOOKMARK_UPDATED':
          // Clear cache for the updated URL to force fresh check
          if (message.data && message.data.url) {
            this.clearUrlCache(message.data.url);
            // Update icon to show saved state
            this.updateIconForUrl(message.data.url, true);
          }
          sendResponse({ success: true });
          break;

        case 'GET_AUTH_STATE': {
          const authState = await this.getAuthState();
          sendResponse({ success: true, authState });
          break;
        }

        case 'AUTH_STATE_CHANGED':
          // Auth state change message received
          break;

        case 'GET_CONFIG_SUMMARY': {
          const summary = this.getAuthSummary();
          sendResponse({ success: true, summary });
          break;
        }

        case 'CHECK_URL_STATUS': {
          // Handle request to check current tab URL status
          const [currentTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (currentTab && currentTab.url) {
            await this.checkUrlStatus(currentTab);
          }
          sendResponse({ success: true });
          break;
        }

        case 'URL_STATUS_RESULT':
          // Handle URL status result from popup
          if (
            message.data &&
            message.data.url &&
            typeof message.data.isSaved === 'boolean'
          ) {
            // Cache the result
            this.urlStatusCache.set(message.data.url, {
              isSaved: message.data.isSaved,
              timestamp: Date.now(),
            });
            // Update icon
            this.updateIconForUrl(message.data.url, message.data.isSaved);
          }
          sendResponse({ success: true });
          break;

        default:
          // Unknown message type - ignore silently
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      // Error handling message
      sendResponse({ success: false, error: error.message });
    }
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
    this.updateExtensionBadge(session);

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
   * Update the extension badge based on authentication state
   * @method updateExtensionBadge
   * @param {Object|null} session - The authentication session object or null if signed out
   */
  updateExtensionBadge(session) {
    try {
      if (session) {
        // User is authenticated - show green badge or checkmark
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      } else {
        // User is not authenticated - show warning or clear badge
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      // Ignore badge update errors
    }
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
        this.updateIconForUrl(null, false);
        return;
      }

      // Check if user is authenticated
      if (!this.authState) {
        this.updateIconForUrl(null, false);
        return;
      }

      // Check cache first
      const cacheKey = tab.url;
      const cached = this.urlStatusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.updateIconForUrl(tab.url, cached.isSaved);
        return;
      }

      // For now, show default state since we can't access database from background
      // The popup will handle the actual URL checking when opened
      this.updateIconForUrl(tab.url, false);
    } catch (error) {
      // Error checking URL status - show default icon
      // On error, show default icon
      this.updateIconForUrl(null, false);
    }
  }

  /**
   * Update the extension icon based on URL save status
   * @method updateIconForUrl
   * @param {string|null} url - The URL being checked
   * @param {boolean} isSaved - Whether the URL is already saved
   * @description Updates the extension icon and badge to indicate save status
   */
  updateIconForUrl(url, isSaved) {
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
    } catch (error) {
      // Ignore icon update errors
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
   * Handle keyboard shortcut activation (Ctrl+Shift+R / Cmd+Shift+R)
   * @async
   * @method handleKeyboardShortcut
   */
  async handleKeyboardShortcut() {
    try {
      // Check if user is authenticated before allowing keyboard shortcut
      const isAuthenticated = await this.isAuthenticated();

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
   * Initialize default extension settings if they don't exist
   * @async
   * @method initializeDefaultSettings
   */
  async initializeDefaultSettings() {
    try {
      // Check if default settings already exist
      const result = await chrome.storage.sync.get(['customStatusTypes']);

      // Only initialize if custom status types don't exist
      if (!result.customStatusTypes) {
        const defaultStatusTypes = [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
        ];

        await chrome.storage.sync.set({
          customStatusTypes: defaultStatusTypes,
        });

        // Default settings initialized successfully
      }
    } catch (error) {
      BackgroundErrorHandler.handle(error, 'background.initializeDefaultSettings');
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

// Initialize background service worker
new ForgetfulMeBackground();
