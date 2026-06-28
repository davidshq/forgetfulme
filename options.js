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
import { initializePage } from './utils/page-controller.js';
import { openBookmarkManagementTab } from './utils/navigation-utils.js';
import { renderMainInterface } from './utils/options-ui-renderer.js';
import {
  loadStatistics,
  loadStatusTypes,
} from './utils/options-data-manager.js';
import { downloadJson } from './utils/download.js';

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
    this.lastBookmarks = null;

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  /**
   * Initialize the options page asynchronously
   * @description Sets up DOM elements, app initialization, and auth state
   */
  async initializeAsync() {
    await initializePage({
      configManager: this.configManager,
      initConfigManager: true,
      authStateManager: this.authStateManager,
      initializeElements: () => this.initializeElements(),
      initializeApp: () => this.initializeApp(),
      onAuthStateChange: session => this.handleAuthStateChange(session),
      context: 'options.initializeAsync',
    });
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - Current session object or null
   * @description Updates UI based on authentication state
   */
  handleAuthStateChange(session) {
    if (session) {
      this.showMainInterface();
      this.loadData();
    } else {
      this.showAuthInterface();
    }
  }

  /**
   * Initialize DOM element references after render
   * @description Sets up references used by event binding
   */
  initializeElements() {
    this.appContainer = UIComponents.DOM.getElement('app');
    this.importFile = UIComponents.DOM.getElement('import-file');
  }

  /**
   * Bind event listeners to dynamically rendered elements
   * @description Wires the hidden import file input to import handling
   */
  bindEvents() {
    if (this.importFile) {
      this.importFile.addEventListener('change', e => this.importData(e));
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
    this.authStateManager.setAuthState(this.supabaseConfig.session);

    this.showMainInterface();
    this.loadData();
  }

  /**
   * Show main application interface
   * @description Creates and displays the main options interface with all cards
   */
  showMainInterface() {
    const userEmail = this.supabaseConfig.session?.user?.email || '';

    const { configStatusContainer } = renderMainInterface(this.appContainer, {
      userEmail,
      signOut: () => this.authUI.handleSignOut(),
      addStatusType: () => this.addStatusType(),
      exportData: () => this.exportData(),
      openImportDialog: () => this.openImportDialog(),
      clearData: () => this.clearData(),
      openBookmarkManagement: () => this.openBookmarkManagement(),
    });

    this.initializeElements();
    this.bindEvents();

    if (configStatusContainer) {
      this.configUI.showConfigStatus(configStatusContainer);
    }
  }

  /**
   * Open the hidden file picker for JSON import
   */
  openImportDialog() {
    const importFileEl = UIComponents.DOM.getElement('import-file');
    if (importFileEl) {
      importFileEl.click();
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

      this.lastBookmarks = bookmarks;
      await this.refreshStatusTypesUI(customStatusTypes);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.loadData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Refresh the custom status types list and related stats.
   * @param {string[]} [statusTypes] - Optional pre-fetched status types
   * @returns {Promise<string[]>}
   */
  async refreshStatusTypesUI(statusTypes) {
    const customStatusTypes =
      statusTypes ?? (await this.configManager.getCustomStatusTypes());

    loadStatusTypes(customStatusTypes, status => this.removeStatusType(status));

    if (this.lastBookmarks) {
      loadStatistics(this.lastBookmarks, customStatusTypes);
    }

    return customStatusTypes;
  }

  /**
   * Add a new status type
   * @description Validates input and adds new custom status type
   */
  async addStatusType() {
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

      UIComponents.DOM.setValue('new-status', '');

      await this.refreshStatusTypesUI();
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

      await this.refreshStatusTypesUI();
      UIMessages.success('Status type removed successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'options.removeStatusType',
      );
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

      downloadJson(
        exportData,
        `forgetfulme-export-${new Date().toISOString().split('T')[0]}.json`,
      );

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
      this.loadData();
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.importData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }

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

          UIMessages.success(
            'All data cleared successfully',
            this.appContainer,
          );
          this.loadData();
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'options.clearData');
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {},
      this.appContainer,
    );
  }

  /**
   * Open bookmark management interface in a new tab
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  openBookmarkManagement() {
    openBookmarkManagementTab();
  }
}

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions();

// Export for testing
export default ForgetfulMeOptions;
