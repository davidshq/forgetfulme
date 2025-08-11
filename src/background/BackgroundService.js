/**
 * @fileoverview Background service worker for the ForgetfulMe extension
 */

/**
 * Main background service for the Chrome extension
 */
export class BackgroundService {
  /**
   * @param {AuthService|null} authService - Authentication service (null in service worker)
   * @param {BookmarkService|null} bookmarkService - Bookmark service (null in service worker)
   * @param {ConfigService} configService - Configuration service
   * @param {StorageService} storageService - Storage service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(authService, bookmarkService, configService, storageService, errorService) {
    this.authService = authService;
    this.bookmarkService = bookmarkService;
    this.configService = configService;
    this.storageService = storageService;
    this.errorService = errorService;

    this.isInitialized = false;
    this.syncManager = null;
    this.shortcutManager = null;
  }

  /**
   * Initialize the background service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      console.log('Initializing ForgetfulMe background service...');

      // Set up extension event listeners
      this.setupExtensionListeners();

      // Set up message handling
      this.setupMessageHandling();

      // Initialize services if configured
      const isConfigured = await this.configService.isSupabaseConfigured();
      if (isConfigured) {
        await this.initializeServices();
      }

      this.isInitialized = true;
      console.log('ForgetfulMe background service initialized');
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.initialize');
      console.error('Failed to initialize background service:', errorInfo);
    }
  }

  /**
   * Initialize core services
   * @private
   */
  async initializeServices() {
    try {
      // Skip Supabase initialization in service worker context
      // Services will be initialized when needed by UI components
      console.log('[BackgroundService] Services initialized (lazy loading enabled)');

      // Note: Auth and bookmark services will be initialized on-demand
      // when popup or options pages interact with them
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.initializeServices');
      console.error('Failed to initialize services:', errorInfo);
    }
  }

  /**
   * Set up Chrome extension event listeners
   * @private
   */
  setupExtensionListeners() {
    // Extension installation/startup
    if (chrome.runtime.onInstalled) {
      chrome.runtime.onInstalled.addListener(details => {
        this.handleInstalled(details);
      });
    }

    if (chrome.runtime.onStartup) {
      chrome.runtime.onStartup.addListener(() => {
        this.handleStartup();
      });
    }

    // Commands (keyboard shortcuts)
    if (chrome.commands && chrome.commands.onCommand) {
      chrome.commands.onCommand.addListener((command, tab) => {
        this.handleCommand(command, tab);
      });
    }

    // Tab events for context awareness
    if (chrome.tabs && chrome.tabs.onActivated) {
      chrome.tabs.onActivated.addListener(activeInfo => {
        this.handleTabActivated(activeInfo);
      });
    }

    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        this.handleTabUpdated(tabId, changeInfo, tab);
      });
    }

    // Browser action clicks (should not happen with popup, but fallback)
    if (chrome.action && chrome.action.onClicked) {
      chrome.action.onClicked.addListener(tab => {
        this.handleActionClicked(tab);
      });
    }
  }

  /**
   * Set up message handling between contexts
   * @private
   */
  setupMessageHandling() {
    if (chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Indicate async response
      });
    }
  }

  /**
   * Handle extension installation/update
   * @param {Object} details - Installation details
   * @private
   */
  async handleInstalled(details) {
    try {
      console.log('Extension installed/updated:', details.reason);

      if (details.reason === 'install') {
        // First time installation
        await this.handleFirstInstall();
      } else if (details.reason === 'update') {
        // Extension update
        await this.handleUpdate(details.previousVersion);
      }

      // Set up default badge
      this.updateBadge();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.handleInstalled');
      console.error('Error handling installation:', errorInfo);
    }
  }

  /**
   * Handle first time installation
   * @private
   */
  async handleFirstInstall() {
    try {
      // Open options page for first setup
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }

      // Show welcome notification
      this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe Installed',
        message: "Click the extension icon to start tracking websites you've read!"
      });
    } catch (error) {
      console.error('Error in first install:', error);
    }
  }

  /**
   * Handle extension update
   * @param {string} previousVersion - Previous version
   * @private
   */
  async handleUpdate(previousVersion) {
    try {
      console.log(`Updated from version ${previousVersion}`);

      // Handle any migration logic here if needed
      // For now, just update the badge
      this.updateBadge();
    } catch (error) {
      console.error('Error in update:', error);
    }
  }

  /**
   * Handle extension startup
   * @private
   */
  async handleStartup() {
    try {
      console.log('Extension startup');

      // Reinitialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }
    } catch (error) {
      console.error('Error in startup:', error);
    }
  }

  /**
   * Handle keyboard commands
   * @param {string} command - Command name
   * @param {Object} tab - Current tab
   * @private
   */
  async handleCommand(command, tab) {
    try {
      console.log('Command received:', command);

      if (command === 'mark_as_read') {
        await this.markCurrentPageAsRead(tab);
      }
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.handleCommand');
      console.error('Error handling command:', errorInfo);
    }
  }

  /**
   * Mark current page as read via keyboard shortcut
   * @param {Object} tab - Current tab
   * @private
   */
  async markCurrentPageAsRead(tab) {
    try {
      if (!tab || !tab.url) {
        this.showNotification({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Cannot Mark Page',
          message: 'No valid page to bookmark'
        });
        return;
      }

      // Check if services are available
      const isConfigured = await this.configService.isSupabaseConfigured();
      if (!isConfigured) {
        this.showNotification({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Setup Required',
          message: 'Please configure ForgetfulMe in the options page'
        });
        return;
      }

      if (!this.authService || !this.authService.isAuthenticated()) {
        this.showNotification({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Sign In Required',
          message: 'Please sign in to bookmark pages'
        });
        return;
      }

      // Service worker can't access Supabase directly - redirect to popup
      this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Use Extension Popup',
        message: 'Click the ForgetfulMe icon to mark this page as read'
      });

      // Update badge to show action is available
      this.updateBadge();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.markCurrentPageAsRead');
      console.error('Error marking page as read:', errorInfo);

      this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Error',
        message: 'Failed to mark page as read'
      });
    }
  }

  /**
   * Handle tab activation
   * @param {Object} activeInfo - Active tab info
   * @private
   */
  async handleTabActivated(activeInfo) {
    try {
      // Update context for the new active tab
      await this.updateTabContext(activeInfo.tabId);
    } catch (error) {
      // Don't show errors for tab events as they're frequent
      console.debug('Error in tab activated:', error);
    }
  }

  /**
   * Handle tab updates
   * @param {number} tabId - Tab ID
   * @param {Object} changeInfo - Change information
   * @param {Object} _tab - Tab object (unused, but required by Chrome API)
   * @private
   */
  async handleTabUpdated(tabId, changeInfo, _tab) {
    try {
      // Only react to URL or loading complete changes
      if (changeInfo.url || changeInfo.status === 'complete') {
        await this.updateTabContext(tabId);
      }
    } catch (error) {
      console.debug('Error in tab updated:', error);
    }
  }

  /**
   * Update tab context for badge and state
   * @param {number} tabId - Tab ID
   * @private
   */
  async updateTabContext(tabId) {
    try {
      if (!this.authService || !this.authService.isAuthenticated()) return;

      const tab = await chrome.tabs.get(tabId);
      if (!tab || !tab.url) return;

      // Check if current page is bookmarked
      const bookmark = await this.bookmarkService.findBookmarkByUrl(tab.url);

      if (bookmark) {
        // Show bookmark status in badge
        const statusType = await this.getStatusType(bookmark.status);
        this.updateBadge(statusType?.name?.charAt(0) || '●', statusType?.color);
      } else {
        // Clear badge for non-bookmarked pages
        this.updateBadge();
      }
    } catch (error) {
      console.debug('Error updating tab context:', error);
    }
  }

  /**
   * Handle browser action clicks (fallback)
   * @param {Object} tab - Current tab
   * @private
   */
  handleActionClicked(tab) {
    console.log('Action clicked (should not happen with popup):', tab);
  }

  /**
   * Handle messages from other contexts
   * @param {Object} message - Message object
   * @param {Object} sender - Message sender
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Message received:', message.type);

      switch (message.type) {
        case 'GET_CURRENT_TAB':
          await this.handleGetCurrentTab(sendResponse);
          break;

        case 'MARK_CURRENT_PAGE':
          await this.handleMarkCurrentPage(message.data, sendResponse);
          break;

        case 'UPDATE_BADGE':
          await this.handleUpdateBadge(message.data, sendResponse);
          break;

        case 'SHOW_NOTIFICATION':
          await this.handleShowNotification(message.data, sendResponse);
          break;

        case 'USER_STATE_CHANGED':
          await this.handleUserStateChanged(message.data, sendResponse);
          break;

        case 'NEW_USER_CONFIRMED':
          await this.handleNewUserConfirmed(message.data, sendResponse);
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'BackgroundService.handleMessage');
      console.error('Error handling message:', errorInfo);
      sendResponse({ error: errorInfo.message });
    }
  }

  /**
   * Handle get current tab message
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleGetCurrentTab(sendResponse) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      sendResponse({ tab });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle mark current page message
   * @param {Object} data - Message data
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleMarkCurrentPage(data, sendResponse) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await this.markCurrentPageAsRead(tab);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle update badge message
   * @param {Object} data - Badge data
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleUpdateBadge(data, sendResponse) {
    try {
      this.updateBadge(data.text, data.color);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle show notification message
   * @param {Object} data - Notification data
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleShowNotification(data, sendResponse) {
    try {
      this.showNotification(data);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle user state change message
   * @param {Object} data - User state data
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleUserStateChanged(data, sendResponse) {
    try {
      console.log('User state changed:', data);

      if (data.isAuthenticated) {
        // User signed in - update badge
        this.updateBadge('●', '#10B981'); // Green dot for authenticated

        // Show welcome notification for new users
        if (data.isNewUser) {
          this.showNotification({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Welcome to ForgetfulMe!',
            message: "Your account is ready. Start bookmarking pages you've read!"
          });
        }
      } else {
        // User signed out - clear badge
        this.updateBadge();
      }

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle new user email confirmation
   * @param {Object} data - Confirmation data
   * @param {Function} sendResponse - Response function
   * @private
   */
  async handleNewUserConfirmed(data, sendResponse) {
    try {
      console.log('New user confirmed email:', data);

      // Store the new user state for synchronization across extension contexts
      await this.storageService.set('newUserConfirmed', {
        userId: data.userId,
        email: data.email,
        confirmedAt: new Date().toISOString(),
        needsOnboarding: true
      });

      // Show congratulations notification
      this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Email Confirmed! 🎉',
        message: 'Your account is ready. Click the extension icon to get started!'
      });

      // Update badge to indicate ready state
      this.updateBadge('!', '#10B981'); // Green exclamation for "ready to start"

      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling new user confirmation:', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle authentication state change
   * @param {Object|null} user - Current user or null
   * @private
   */
  async handleAuthStateChange(user) {
    try {
      if (user) {
        // User signed in - initialize bookmark service
        await this.bookmarkService.initialize();
        console.log('User signed in, services initialized');
      } else {
        // User signed out - clear badge
        this.updateBadge();
        console.log('User signed out');
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
    }
  }

  /**
   * Update extension badge
   * @param {string} [text=''] - Badge text
   * @param {string} [color='#4F46E5'] - Badge color
   */
  updateBadge(text = '', color = '#4F46E5') {
    try {
      if (chrome.action) {
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color });
      }
    } catch (error) {
      console.debug('Error updating badge:', error);
    }
  }

  /**
   * Show notification
   * @param {Object} options - Notification options
   */
  showNotification(options) {
    try {
      if (chrome.notifications) {
        const notificationId = `forgetfulme_${Date.now()}`;
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ForgetfulMe',
          message: 'Notification',
          ...options
        });

        // Auto-clear notification after 5 seconds
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
        }, 5000);
      }
    } catch (error) {
      console.debug('Error showing notification:', error);
    }
  }

  /**
   * Get status type by ID
   * @param {string} statusId - Status ID
   * @returns {Promise<Object|null>} Status type or null
   * @private
   */
  async getStatusType(statusId) {
    try {
      const statusTypes = await this.configService.getStatusTypes();
      return statusTypes.find(s => s.id === statusId) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send message to content scripts or other contexts
   * @param {Object} message - Message to send
   * @param {Object} [options] - Send options
   * @returns {Promise<*>} Response
   */
  async sendMessage(message, options = {}) {
    try {
      if (options.tabId) {
        return await chrome.tabs.sendMessage(options.tabId, message);
      } else {
        return await chrome.runtime.sendMessage(message);
      }
    } catch (error) {
      console.debug('Error sending message:', error);
      return null;
    }
  }

  /**
   * Get extension info
   * @returns {Promise<Object>} Extension information
   */
  async getExtensionInfo() {
    const isConfigured = await this.configService.isSupabaseConfigured();

    return {
      id: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
      isInitialized: this.isInitialized,
      isAuthenticated: this.authService ? this.authService.isAuthenticated() : false,
      isConfigured: isConfigured
    };
  }
}
