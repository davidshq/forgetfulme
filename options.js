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
import ConfigManager from './utils/config-manager.js';
import SupabaseConfig from './supabase-config.js';
import SupabaseService from './supabase-service.js';
import AuthUI from './auth-ui.js';
import AuthStateManager from './utils/auth-state-manager.js';
import ConfigUI from './config-ui.js';
import { formatStatus, formatTime } from './utils/formatters.js';

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
    /** @type {ConfigManager} Configuration manager for user preferences */
    this.configManager = new ConfigManager();
    /** @type {AuthStateManager} Authentication state manager */
    this.authStateManager = new AuthStateManager();
    /** @type {SupabaseConfig} Supabase configuration manager */
    this.supabaseConfig = new SupabaseConfig();
    /** @type {SupabaseService} Supabase service for data operations */
    this.supabaseService = new SupabaseService(this.supabaseConfig);
    /** @type {AuthUI} Authentication UI manager */
    this.authUI = new AuthUI(
      this.supabaseConfig,
      () => this.onAuthSuccess(),
      this.authStateManager
    );
    /** @type {ConfigUI} Configuration UI manager */
    this.configUI = new ConfigUI(this.supabaseConfig);

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      ErrorHandler.handle(error, 'options.initializeAsync');
      console.error('Failed to initialize options:', error);
    }
  }

  async initializeAuthState() {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', session => {
        this.handleAuthStateChange(session);
      });

      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener(
        (message, _sender, _sendResponse) => {
          if (message.type === 'AUTH_STATE_CHANGED') {
            this.handleAuthStateChange(message.session);
          }
        }
      );

      console.log('Options: Auth state initialized');
    } catch (error) {
      console.error('Options: Error initializing auth state:', error);
    }
  }

  handleAuthStateChange(session) {
    console.log(
      'Options: Auth state changed:',
      session ? 'authenticated' : 'not authenticated'
    );

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

  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        this.showConfigInterface();
        return;
      }

      // Initialize Supabase with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await this.supabaseService.initialize();
          break; // Success, exit the retry loop
        } catch (error) {
          retryCount++;
          console.log(
            `Supabase initialization attempt ${retryCount} failed:`,
            error
          );

          if (retryCount >= maxRetries) {
            throw error; // Re-throw if we've exhausted retries
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Check if user is authenticated using auth state manager
      const isAuthenticated = await this.authStateManager.isAuthenticated();

      if (isAuthenticated) {
        this.showMainInterface();
        this.loadData();
      } else {
        this.showAuthInterface();
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.initializeApp');
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
      this.showConfigInterface();
    }
  }

  showConfigInterface() {
    this.configUI.showConfigForm(this.appContainer);
  }

  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer);
  }

  onAuthSuccess() {
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.supabaseConfig.session);

    this.showMainInterface();
    this.loadData();
  }

  showMainInterface() {
    // Create main container
    const mainContainer = UIComponents.createContainer(
      'ForgetfulMe Settings',
      '',
      'main-container'
    );

    // Create config card
    const configCard = UIComponents.createCard(
      'Supabase Configuration',
      '<div id="config-status-container"></div>',
      '',
      'config-card'
    );
    mainContainer.appendChild(configCard);

    // Create stats card
    const statsGrid = UIComponents.createGrid(
      [
        { text: 'Total Entries:', className: 'stat-item' },
        { text: 'Status Types:', className: 'stat-item' },
        { text: 'Most Used Status:', className: 'stat-item' },
      ],
      { className: 'stats-grid' }
    );

    // Add stat values safely
    const statItems = statsGrid.querySelectorAll('.grid-item');
    if (statItems.length >= 3) {
      statItems[0].innerHTML =
        '<span class="stat-label">Total Entries:</span><span id="total-entries" class="stat-value">-</span>';
      statItems[1].innerHTML =
        '<span class="stat-label">Status Types:</span><span id="status-types-count" class="stat-value">-</span>';
      statItems[2].innerHTML =
        '<span class="stat-label">Most Used Status:</span><span id="most-used-status" class="stat-value">-</span>';
    }

    const statsCard = UIComponents.createCard(
      'Statistics',
      statsGrid.outerHTML,
      '',
      'stats-card'
    );
    mainContainer.appendChild(statsCard);

    // Create status types card
    const addStatusContainer = document.createElement('div');
    addStatusContainer.className = 'add-status';

    const addStatusForm = UIComponents.createForm(
      'add-status-form',
      e => {
        e.preventDefault();
        this.addCustomStatus();
      },
      [
        {
          type: 'text',
          id: 'new-status-name',
          label: 'Status Name:',
          options: {
            placeholder: 'e.g., Important, Reference',
            required: true,
          },
        },
        {
          type: 'text',
          id: 'new-status-description',
          label: 'Description:',
          options: {
            placeholder: 'Brief description of this status',
          },
        },
      ],
      {
        submitText: 'Add Status',
        className: 'add-status-form',
      }
    );

    addStatusContainer.appendChild(addStatusForm);

    const statusListContainer = document.createElement('div');
    statusListContainer.id = 'status-list-container';
    statusListContainer.className = 'status-list';

    addStatusContainer.appendChild(statusListContainer);

    const statusCard = UIComponents.createCard(
      'Custom Status Types',
      addStatusContainer.outerHTML,
      '',
      'status-card'
    );
    mainContainer.appendChild(statusCard);

    // Create data management card
    const dataActions = [
      {
        text: 'Export All Data',
        onClick: () => this.exportAllData(),
        className: 'secondary',
      },
      {
        text: 'Import Data',
        onClick: () => this.importData(),
        className: 'secondary',
      },
      {
        text: 'Clear All Data',
        onClick: () => this.clearAllData(),
        className: 'contrast',
      },
    ];

    const dataCard = UIComponents.createCardWithActions(
      'Data Management',
      '<p>Export your bookmarks to JSON format, import data from a backup, or clear all stored data.</p>',
      dataActions,
      'data-card'
    );
    mainContainer.appendChild(dataCard);

    // Create bookmark management card
    const manageBookmarksBtn = UIComponents.createButton(
      '📚 Manage Bookmarks',
      () => this.openBookmarkManagement(),
      'secondary',
      {
        id: 'manage-bookmarks-btn',
        title: 'Open bookmark management interface',
      }
    );

    const bookmarkCard = UIComponents.createCard(
      'Bookmark Management',
      '<p>Access the full bookmark management interface to search, filter, and manage your bookmarks.</p>',
      manageBookmarksBtn.outerHTML,
      'bookmark-card'
    );
    mainContainer.appendChild(bookmarkCard);

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(mainContainer);

    // Re-initialize elements after DOM update
    this.initializeElements();
    this.bindEvents();

    // Show configuration status
    const configStatusContainer = document.getElementById('config-status-container');
    if (configStatusContainer) {
      this.configUI.showConfigStatus(configStatusContainer);
    }
  }

  async loadData() {
    try {
      await this.configManager.initialize();
      const [bookmarks, customStatusTypes] = await Promise.all([
        this.supabaseService.getBookmarks({ limit: 1000 }),
        this.configManager.getCustomStatusTypes(),
      ]);

      this.loadStatusTypes(customStatusTypes);
      this.loadStatistics(bookmarks, customStatusTypes);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.loadData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  loadStatusTypes(statusTypes) {
    const statusTypesListEl = UIComponents.DOM.getElement('status-types-list');
    if (!statusTypesListEl) return;

    statusTypesListEl.innerHTML = '';

    if (statusTypes.length === 0) {
      const emptyItem = UIComponents.createListItem(
        {
          title: 'No custom status types defined',
          meta: {
            status: 'info',
            statusText: 'No status types',
          },
        },
        { className: 'status-type-item empty' }
      );
      statusTypesListEl.appendChild(emptyItem);
      return;
    }

    statusTypes.forEach(status => {
      const listItem = UIComponents.createListItem(
        {
          title: formatStatus(status),
          actions: [
            {
              text: 'Remove',
              onClick: () => this.removeStatusType(status),
              className: 'ui-btn-danger ui-btn-small',
            },
          ],
        },
        { className: 'status-type-item' }
      );

      statusTypesListEl.appendChild(listItem);
    });
  }

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
      this.loadStatusTypes(customStatusTypes);
      UIMessages.success('Status type added successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.addStatusType');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  async removeStatusType(status) {
    try {
      await this.configManager.initialize();
      await this.configManager.removeCustomStatusType(status);

      const customStatusTypes = await this.configManager.getCustomStatusTypes();
      this.loadStatusTypes(customStatusTypes);
      UIMessages.success('Status type removed successfully', this.appContainer);
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'options.removeStatusType'
      );
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  loadStatistics(bookmarks, statusTypes) {
    // Safely update statistics using DOM utilities
    const totalEntriesEl = UIComponents.DOM.getElement('total-entries');
    const statusTypesCountEl =
      UIComponents.DOM.getElement('status-types-count');
    const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

    if (totalEntriesEl) {
      totalEntriesEl.textContent = bookmarks.length;
    }

    if (statusTypesCountEl) {
      statusTypesCountEl.textContent = statusTypes.length;
    }

    // Most used status
    const statusCounts = {};
    bookmarks.forEach(bookmark => {
      statusCounts[bookmark.read_status] =
        (statusCounts[bookmark.read_status] || 0) + 1;
    });

    const mostUsed = Object.entries(statusCounts).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (mostUsedStatusEl) {
      if (mostUsed) {
        mostUsedStatusEl.textContent = formatStatus(mostUsed[0]);
      } else {
        mostUsedStatusEl.textContent = 'None';
      }
    }
  }

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
            this.appContainer
          );
          this.loadData(); // Refresh the data
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'options.clearData');
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer
    );
  }

  /**
   * Open bookmark management interface in a new tab
   * @method openBookmarkManagement
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  openBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }


  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer);
  }
}

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions();

// Export for testing
export default ForgetfulMeOptions;
