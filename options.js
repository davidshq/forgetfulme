/**
 * @fileoverview Options page script for ForgetfulMe extension
 * @module options
 * @description Handles the options/settings page functionality including data management and configuration
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import { initializeServices } from './utils/service-initializer.js';
import { initializeApp as initializeAppUtil } from './utils/app-initializer.js';
import { MESSAGE_TYPES } from './utils/constants.js';
import { renderMainInterface } from './utils/options-ui-renderer.js';
import { loadStatistics, loadStatusTypes } from './utils/options-data-manager.js';

/**
 * Options page class for ForgetfulMe extension
 * @class ForgetfulMeOptions
 * @description Manages the options/settings page functionality including data management, configuration, and user preferences
 *
 * @example
 * // The options page is automatically instantiated when options.html loads
 * // No manual instantiation required
 */
class ForgetfulMeOptions {
  /**
   * Initialize the options page with all required services and managers
   * @constructor
   * @description Sets up the options page with configuration, authentication, and service dependencies
   */
  constructor() {
    // Initialize services using utility
    const services = initializeServices({
      onAuthSuccess: () => this.onAuthSuccess(),
      includeConfigUI: true,
    });
    this.configManager = services.configManager;
    this.authStateManager = services.authStateManager;
    this.supabaseConfig = services.supabaseConfig;
    this.supabaseService = services.supabaseService;
    this.authUI = services.authUI;
    this.configUI = services.configUI;

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  /**
   * Initialize the options page asynchronously
   * @description Sets up DOM elements, app initialization, and auth state
   */
  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      ErrorHandler.handle(error, 'options.initializeAsync');
      // Failed to initialize options
    }
  }

  /**
   * Initialize authentication state and listeners
   * @description Sets up auth state manager and message listeners
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
      ErrorHandler.handle(error, 'options.initializeAuthState');
    }
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - Current session object or null
   * @description Updates UI based on authentication state
   */
  handleAuthStateChange(session) {
    // Auth state changed - update UI accordingly

    // Update UI based on auth state
    if (session) {
      // User is authenticated - show main interface
      this.showMainInterface();
      this.loadData();
    } else {
      // User is not authenticated - show auth interface
      this.showAuthInterface();
    }
  }

  /**
   * Initialize DOM elements
   * @description Sets up references to DOM elements for event binding
   */
  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = UIComponents.DOM.getElement('app');

    // Re-initialize dynamically created elements with safe access
    this.statusTypesList = UIComponents.DOM.getElement('status-types-list');
    this.newStatusInput = UIComponents.DOM.getElement('new-status');
    this.addStatusBtn = UIComponents.DOM.getElement('add-status-btn');
    this.exportDataBtn = UIComponents.DOM.getElement('export-data-btn');
    this.importDataBtn = UIComponents.DOM.getElement('import-data-btn');
    this.importFile = UIComponents.DOM.getElement('import-file');
    this.clearDataBtn = UIComponents.DOM.getElement('clear-data-btn');

    // Stats elements
    this.totalEntries = UIComponents.DOM.getElement('total-entries');
    this.statusTypesCount = UIComponents.DOM.getElement('status-types-count');
    this.mostUsedStatus = UIComponents.DOM.getElement('most-used-status');
  }

  /**
   * Bind event listeners to DOM elements
   * @description Sets up click and keyboard event handlers
   */
  bindEvents() {
    // Only bind events if elements exist using safe DOM utilities
    if (this.addStatusBtn) {
      this.addStatusBtn.addEventListener('click', () => this.addStatusType());
    }

    if (this.newStatusInput) {
      this.newStatusInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          this.addStatusType();
        }
      });
    }

    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener('click', () => this.exportData());
    }

    if (this.importDataBtn) {
      this.importDataBtn.addEventListener('click', () => {
        const importFileEl = UIComponents.DOM.getElement('import-file');
        if (importFileEl) {
          importFileEl.click();
        }
      });
    }

    if (this.importFile) {
      this.importFile.addEventListener('change', e => this.importData(e));
    }

    if (this.clearDataBtn) {
      this.clearDataBtn.addEventListener('click', () => this.clearData());
    }
  }

  /**
   * Initialize the application
   * @description Checks configuration, initializes Supabase, and shows appropriate interface
   */
  async initializeApp() {
    await initializeAppUtil({
      supabaseConfig: this.supabaseConfig,
      supabaseService: this.supabaseService,
      authStateManager: this.authStateManager,
      onConfigured: () => this.showConfigInterface(),
      onAuthenticated: () => {
        this.showMainInterface();
        this.loadData();
      },
      onUnauthenticated: () => this.showAuthInterface(),
      appContainer: this.appContainer,
      context: 'options.initializeApp',
    });
  }

  /**
   * Show configuration interface
   * @description Displays Supabase configuration form
   */
  showConfigInterface() {
    this.configUI.showConfigForm(this.appContainer);
  }

  /**
   * Show authentication interface
   * @description Displays login form for user authentication
   */
  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer);
  }

  /**
   * Handle successful authentication
   * @description Updates auth state and shows main interface
   */
  onAuthSuccess() {
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.supabaseConfig.session);

    this.showMainInterface();
    this.loadData();
  }

  /**
   * Show main application interface
   * @description Creates and displays the main options interface with all cards
   */
  showMainInterface() {
    const { configStatusContainer } = renderMainInterface(this.appContainer, {
      addCustomStatus: () => this.addCustomStatus(),
      exportAllData: () => this.exportAllData(),
      importData: () => this.importData(),
      clearAllData: () => this.clearAllData(),
      openBookmarkManagement: () => this.openBookmarkManagement(),
    });

    // Re-initialize elements after DOM update
    this.initializeElements();
    this.bindEvents();

    // Show configuration status
    if (configStatusContainer) {
      this.configUI.showConfigStatus(configStatusContainer);
    }
  }

  /**
   * Load and display application data
   * @description Fetches bookmarks and status types, updates UI
   */
  async loadData() {
    try {
      await this.configManager.initialize();
      const [bookmarks, customStatusTypes] = await Promise.all([
        this.supabaseService.getBookmarks({ limit: 1000 }),
        this.configManager.getCustomStatusTypes(),
      ]);

      loadStatusTypes(customStatusTypes, status => this.removeStatusType(status));
      loadStatistics(bookmarks, customStatusTypes);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.loadData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Add a new status type
   * @description Validates input and adds new custom status type
   */
  async addStatusType() {
    // Safely get the status input value
    const statusValue = UIComponents.DOM.getValue('new-status');
    if (!statusValue) {
      UIMessages.error('Please enter a status type', this.appContainer);
      return;
    }

    const status = statusValue.trim().toLowerCase().replace(/\s+/g, '-');

    if (!status) {
      UIMessages.error('Please enter a status type', this.appContainer);
      return;
    }

    try {
      await this.configManager.initialize();
      await this.configManager.addCustomStatusType(status);

      // Clear input safely
      UIComponents.DOM.setValue('new-status', '');

      const customStatusTypes = await this.configManager.getCustomStatusTypes();
      loadStatusTypes(customStatusTypes, status => this.removeStatusType(status));
      UIMessages.success('Status type added successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.addStatusType');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Remove a status type
   * @param {string} status - Status type to remove
   * @description Removes specified status type from configuration
   */
  async removeStatusType(status) {
    try {
      await this.configManager.initialize();
      await this.configManager.removeCustomStatusType(status);

      const customStatusTypes = await this.configManager.getCustomStatusTypes();
      loadStatusTypes(customStatusTypes, status => this.removeStatusType(status));
      UIMessages.success('Status type removed successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.removeStatusType');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Export application data
   * @description Exports all data to JSON file for backup
   */
  async exportData() {
    try {
      const exportData = await this.supabaseService.exportData();

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `forgetfulme-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      UIMessages.success('Data exported successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.exportData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Import application data
   * @param {Event} event - File input change event
   * @description Imports data from JSON file
   */
  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      await this.supabaseService.importData(importData);

      UIMessages.success('Data imported successfully', this.appContainer);
      this.loadData(); // Refresh the data
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.importData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }

    // Clear the file input
    event.target.value = '';
  }

  /**
   * Clear all application data
   * @description Removes all bookmarks after user confirmation
   */
  async clearData() {
    UIMessages.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.',
      async () => {
        try {
          const bookmarks = await this.supabaseService.getBookmarks({
            limit: 10000,
          });

          for (const bookmark of bookmarks) {
            await this.supabaseService.deleteBookmark(bookmark.id);
          }

          UIMessages.success('All data cleared successfully', this.appContainer);
          this.loadData(); // Refresh the data
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'options.clearData');
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer,
    );
  }

  /**
   * Open bookmark management interface in a new tab
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  openBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }

  /**
   * Show message to user
   * @param {string} message - Message to display
   * @param {string} type - Message type (success, error, info, loading)
   * @description Shows user feedback messages using centralized UIMessages system
   */
  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer);
  }
}

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions();

// Export for testing
export default ForgetfulMeOptions;
