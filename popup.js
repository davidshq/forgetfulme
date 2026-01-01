/**
 * @fileoverview Popup script for ForgetfulMe extension with Supabase integration
 * @module popup
 * @description Main popup interface for the ForgetfulMe Chrome extension.
 * Handles user authentication, bookmark management, and UI interactions.
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import BookmarkTransformer from './utils/bookmark-transformer.js';
import { initializeServices } from './utils/service-initializer.js';
import { initializeApp as initializeAppUtil } from './utils/app-initializer.js';
import { showSetupInterface } from './utils/setup-interface.js';
import { MESSAGE_TYPES } from './utils/constants.js';
import { QuickAdd } from './components/quick-add.js';
import { RecentList } from './components/recent-list.js';
import { StatusSelector } from './components/status-selector.js';
import { PopupEditInterface } from './utils/popup-edit-interface.js';

/**
 * Main popup class for the ForgetfulMe Chrome extension
 * @class ForgetfulMePopup
 * @description Manages the popup interface, user authentication, and bookmark operations
 *
 * @example
 * // Use the static factory method to create and initialize the popup
 * const popup = await ForgetfulMePopup.create();
 */
class ForgetfulMePopup {
  /**
   * Create and initialize a new popup instance
   * @static
   * @async
   * @method create
   * @description Factory method that creates and fully initializes a popup instance
   * @returns {Promise<ForgetfulMePopup>} Fully initialized popup instance
   * @throws {Error} When initialization fails
   *
   * @example
   * const popup = await ForgetfulMePopup.create();
   */
  static async create() {
    const instance = new ForgetfulMePopup();
    await instance.initializeAsync();
    return instance;
  }

  /**
   * Initialize the popup with all required services and managers
   * @constructor
   * @description Sets up the popup with authentication, configuration, and service dependencies
   * @private Use ForgetfulMePopup.create() instead
   */
  constructor() {
    // Initialize services using utility
    const services = initializeServices({
      onAuthSuccess: () => this.onAuthSuccess(),
    });
    this.configManager = services.configManager;
    this.authStateManager = services.authStateManager;
    this.supabaseConfig = services.supabaseConfig;
    this.supabaseService = services.supabaseService;
    this.authUI = services.authUI;

    /** @type {string|null} Current bookmark URL being edited */
    this.currentBookmarkUrl = null;

    // Initialize components
    this.quickAdd = new QuickAdd({
      onSubmit: () => this.markAsRead(),
    });

    this.recentList = new RecentList();

    this.statusSelector = new StatusSelector();

    // Initialize edit interface manager
    this.editInterface = new PopupEditInterface(this);
  }

  /**
   * Initialize the popup asynchronously after DOM is ready
   * @async
   * @method initializeAsync
   * @description Performs all initialization tasks including DOM setup, config manager initialization, app initialization, and auth state setup
   * @throws {Error} When initialization fails
   *
   * @example
   * // Called automatically by create() factory method
   * await popup.initializeAsync();
   */
  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      // Initialize config manager early to ensure it's ready
      await this.configManager.initialize();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      ErrorHandler.handle(error, 'popup.initializeAsync');
      // Failed to initialize popup
    }
  }

  /**
   * Initialize authentication state and set up listeners
   * @async
   * @method initializeAuthState
   * @description Sets up authentication state management and listeners for auth state changes
   * @throws {Error} When auth state initialization fails
   *
   * @example
   * // Called during popup initialization
   * await popup.initializeAuthState();
   */
  async initializeAuthState() {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', session => {
        this.handleAuthStateChange(session);
      });

      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message.type === MESSAGE_TYPES.AUTH_STATE_CHANGED) {
          this.handleAuthStateChange(message.session);
        }
      });

      // Auth state initialized successfully
    } catch (error) {
      ErrorHandler.handle(error, 'popup.initializeAuthState');
    }
  }

  /**
   * Handle authentication state changes and update UI accordingly
   * @method handleAuthStateChange
   * @param {Object|null} session - The current session object or null if not authenticated
   * @description Updates the UI based on authentication state - shows main interface for authenticated users or auth interface for unauthenticated users
   *
   * @example
   * // Called automatically when auth state changes
   * popup.handleAuthStateChange(session);
   */
  handleAuthStateChange(session) {
    // Auth state changed - update UI accordingly

    // Update UI based on auth state
    if (session) {
      // User is authenticated - show main interface
      this.showMainInterface();
      this.loadRecentEntries();
      this.loadCustomStatusTypes();
    } else {
      // User is not authenticated - show auth interface
      this.showAuthInterface();
    }
  }

  /**
   * Initialize DOM element references
   * @method initializeElements
   * @description Sets up references to key DOM elements used throughout the popup
   *
   * @example
   * // Called during popup initialization
   * popup.initializeElements();
   */
  initializeElements() {
    // Initialize elements that exist in the initial HTML
    /** @type {HTMLElement} Main app container */
    this.appContainer = UIComponents.DOM.getElement('app');
  }

  async initializeApp() {
    await initializeAppUtil({
      supabaseConfig: this.supabaseConfig,
      supabaseService: this.supabaseService,
      authStateManager: this.authStateManager,
      onConfigured: () => this.showSetupInterface(),
      onAuthenticated: async () => {
        this.showMainInterface();
        this.loadRecentEntries();
        this.loadCustomStatusTypes();
        // Check current tab URL status
        await this.checkCurrentTabUrlStatus();
      },
      onUnauthenticated: () => this.showAuthInterface(),
      appContainer: this.appContainer,
      context: 'popup.initializeApp',
    });
  }

  showSetupInterface() {
    showSetupInterface(this.appContainer, () => this.openSettings());
  }

  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer);
  }

  onAuthSuccess() {
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.supabaseConfig.session);

    this.showMainInterface();
    this.loadRecentEntries();
    this.loadCustomStatusTypes();
  }

  showMainInterface() {
    // Create header with Pico navigation
    const navItems = [
      {
        text: '⚙️ Settings',
        onClick: () => this.openSettings(),
        className: 'outline',
        title: 'Settings',
        'aria-label': 'Open settings',
      },
      {
        text: '📚 Manage URLs',
        onClick: () => this.showBookmarkManagement(),
        className: 'outline',
        title: 'Manage Bookmarks',
        'aria-label': 'Manage bookmarks',
      },
    ];

    const header = UIComponents.createHeaderWithNav('ForgetfulMe', navItems, {
      titleId: 'popup-title',
      navAriaLabel: 'Extension actions',
      navClassName: 'header-nav',
    });

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.setAttribute('role', 'main');

    // Create form card using component
    const formCard = this.quickAdd.createFormCard();
    mainContent.appendChild(formCard);

    // Create recent entries card using component
    const recentCard = this.recentList.createCard();
    mainContent.appendChild(recentCard);

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(header);
    this.appContainer.appendChild(mainContent);

    // Load recent entries
    this.loadRecentEntries();
  }

  async markAsRead() {
    try {
      // Get form values using component
      const { status, tags } = this.quickAdd.getFormValues();

      // Get current tab info
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://')
      ) {
        UIMessages.error('Cannot mark browser pages as read', this.appContainer);
        return;
      }

      const bookmark = BookmarkTransformer.fromCurrentTab(
        tab,
        status,
        tags.trim() ? tags.trim().split(',') : [],
      );

      const result = await this.supabaseService.saveBookmark(bookmark);

      if (result.isDuplicate) {
        // Show edit interface for existing bookmark
        this.editInterface.showEditInterface(result);
      } else {
        UIMessages.success('Page marked as read!', this.appContainer);

        // Clear form using component
        this.quickAdd.clearForm();

        this.loadRecentEntries();

        // Notify background script about saved bookmark
        try {
          await chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.BOOKMARK_SAVED,
            data: { url: bookmark.url },
          });
        } catch (_error) {
          // Error notifying background about saved bookmark
        }

        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.markAsRead');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  async loadRecentEntries() {
    try {
      const bookmarks = await this.supabaseService.getBookmarks({ limit: 5 });
      this.recentList.displayBookmarks(bookmarks);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.loadRecentEntries');
      this.recentList.showError('Error loading entries');

      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
    }
  }

  async loadCustomStatusTypes() {
    try {
      // Config manager is already initialized in initializeAsync()
      const customStatusTypes = await this.configManager.getCustomStatusTypes();
      this.statusSelector.loadCustomStatusTypes(customStatusTypes);
    } catch (error) {
      ErrorHandler.handle(error, 'popup.loadCustomStatusTypes', {
        silent: true,
      });
      // Don't show user for this error as it's not critical
    }
  }

  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer);
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Open bookmark management in a new tab
   * @method showBookmarkManagement
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  showBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }

  /**
   * Check the current tab URL status and notify background script
   * @async
   * @method checkCurrentTabUrlStatus
   * @description Checks if the current tab URL is already saved and notifies background script
   */
  async checkCurrentTabUrlStatus() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url) {
        return;
      }

      // Skip browser pages and extension pages
      if (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('moz-extension://')
      ) {
        return;
      }

      // Check if URL is already saved
      try {
        const bookmark = await this.supabaseService.getBookmarkByUrl(tab.url);
        const isSaved = !!bookmark;

        // Send result to background script
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.URL_STATUS_RESULT,
          data: { url: tab.url, isSaved },
        });
      } catch (_error) {
        // Error checking URL in database - send default state
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.URL_STATUS_RESULT,
          data: { url: tab.url, isSaved: false },
        });
      }
    } catch (_error) {
      // Error checking URL status
    }
  }

  async updateBookmark(bookmarkId) {
    try {
      const status = UIComponents.DOM.getValue('edit-read-status') || 'read';
      const tags = UIComponents.DOM.getValue('edit-tags') || '';

      const updates = {
        read_status: status,
        tags: tags.trim()
          ? tags
              .trim()
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag)
          : [],
        updated_at: new Date().toISOString(),
      };

      await this.supabaseService.updateBookmark(bookmarkId, updates);
      UIMessages.success('Bookmark updated successfully!', this.appContainer);

      // Notify background script about updated bookmark
      try {
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.BOOKMARK_UPDATED,
          data: { url: updates.url || this.currentBookmarkUrl },
        });
      } catch (_error) {
        // Error notifying background about updated bookmark
      }

      // Return to main interface after a short delay
      setTimeout(() => {
        this.showMainInterface();
        this.loadRecentEntries();
      }, 1500);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.updateBookmark');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }
}

// Initialize popup using factory method to ensure proper initialization order
ForgetfulMePopup.create().catch(error => {
  ErrorHandler.handle(error, 'popup.initialization');
});

// Export for testing
export default ForgetfulMePopup;
