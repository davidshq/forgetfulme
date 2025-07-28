/**
 * @fileoverview Options interface module for ForgetfulMe options page
 * @module options/modules/ui/options-interface
 * @description Manages the main user interface, creates dynamic cards, and handles event binding
 * @since 1.0.0
 * @requires utils/ui-components
 */

import UIComponents from '../../../utils/ui-components.js';

/**
 * Options interface manager for options page
 * @class OptionsInterface
 * @description Manages the creation of dynamic UI cards and handles user interactions
 * @since 1.0.0
 */
export class OptionsInterface {
  /**
   * Initialize the options interface manager
   * @constructor
   * @param {Object} dependencies - Required dependencies for the interface
   * @param {HTMLElement} dependencies.appContainer - Main app container element
   * @param {ConfigUI} dependencies.configUI - Configuration UI manager instance
   * @param {DataManager} dependencies.dataManager - Data manager instance for handling data operations
   */
  constructor(dependencies) {
    this.appContainer = dependencies.appContainer;
    this.configUI = dependencies.configUI;
    this.dataManager = dependencies.dataManager;
  }

  /**
   * Show main application interface
   * @description Shows the main options interface using static HTML sections and adds dynamic cards where needed
   * @returns {void}
   * @fires OptionsInterface#interfaceReady
   */
  showMainInterface() {
    // Show the static config interface
    const configInterface = document.getElementById('config-interface');
    if (configInterface) {
      configInterface.hidden = false;
      // Show the configuration status using static HTML
      this.configUI.showConfigStatus();
    }

    // Show the static settings interface
    const settingsInterface = document.getElementById('settings-interface');
    if (settingsInterface) {
      settingsInterface.hidden = false;
    }

    // Hide other interfaces
    const authInterface = document.getElementById('auth-interface');
    const errorInterface = document.getElementById('error-interface');
    if (authInterface) authInterface.hidden = true;
    if (errorInterface) errorInterface.hidden = true;

    // Add dynamic content to the existing static sections
    this.populateStaticSections();
  }

  /**
   * Populate static HTML sections with dynamic content
   * @description Adds dynamic cards to existing static sections in the HTML
   * @returns {void}
   * @private
   */
  populateStaticSections() {
    // Populate stats section
    this.populateStatsSection();
    
    // Populate status settings section
    this.populateStatusSection();
    
    // Populate data settings section
    this.populateDataSection();
    
    // Add bookmark management link
    this.addBookmarkManagementLink();
  }

  /**
   * Populate the statistics section with usage stats
   * @description Creates and adds statistics display to the static stats section
   * @returns {void}
   * @private
   */
  populateStatsSection() {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;

    // Create stats card with better structure
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-grid';

    // Create individual stat items
    const statItems = [
      { id: 'total-entries', label: 'Total Entries', value: '-', icon: '📊' },
      {
        id: 'status-types-count',
        label: 'Status Types',
        value: '-',
        icon: '🏷️',
      },
      {
        id: 'most-used-status',
        label: 'Most Used Status',
        value: '-',
        icon: '⭐',
      },
    ];

    statItems.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
      statItem.innerHTML = `
        <div class="stat-icon">${stat.icon}</div>
        <span class="stat-label">${stat.label}</span>
        <span id="${stat.id}" class="stat-value">${stat.value}</span>
      `;
      statsContainer.appendChild(statItem);
    });

    // Clear existing content and add the stats container
    const existingContent = statsSection.querySelector('.stats-grid');
    if (existingContent) {
      existingContent.remove();
    }
    statsSection.appendChild(statsContainer);
  }

  /**
   * Populate the status settings section with custom status form and list
   * @description Creates and adds status management UI to the static status section
   * @returns {void}
   * @private
   */
  populateStatusSection() {
    const statusSection = document.getElementById('status-settings');
    if (!statusSection) return;

    // Create status form
    const addStatusContainer = document.createElement('div');
    addStatusContainer.className = 'add-status';

    const addStatusForm = UIComponents.createForm(
      'add-status-form',
      e => {
        e.preventDefault();
        this.dataManager.addStatusType();
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

    // Clear existing content and add the status container
    const existingContent = statusSection.querySelector('.add-status');
    if (existingContent) {
      existingContent.remove();
    }
    statusSection.appendChild(addStatusContainer);
  }

  /**
   * Populate the data settings section with data management actions
   * @description Creates and adds data management UI to the static data section
   * @returns {void}
   * @private
   */
  populateDataSection() {
    const dataSection = document.getElementById('data-settings');
    if (!dataSection) return;

    // Create data management actions
    const dataActionsContainer = document.createElement('div');
    dataActionsContainer.className = 'data-actions';

    const dataActions = [
      {
        text: 'Export All Data',
        onClick: () => this.dataManager.exportData(),
        className: 'secondary export-data-btn',
        id: 'export-data-btn'
      },
      {
        text: 'Import Data',
        onClick: () => this.importData(),
        className: 'secondary import-data-btn',
        id: 'import-data-btn'
      },
      {
        text: 'Clear All Data',
        onClick: () => this.dataManager.clearData(),
        className: 'contrast clear-data-btn',
        id: 'clear-data-btn'
      },
    ];

    dataActions.forEach(action => {
      const button = UIComponents.createButton(
        action.text,
        action.onClick,
        action.className.includes('contrast') ? 'contrast' : 'secondary',
        {
          id: action.id
        }
      );
      dataActionsContainer.appendChild(button);
    });

    // Add hidden file input for import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'import-file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => this.dataManager.importData(e));
    dataActionsContainer.appendChild(fileInput);

    // Clear existing content and add the data container
    const existingContent = dataSection.querySelector('.data-actions');
    if (existingContent) {
      existingContent.remove();
    }
    dataSection.appendChild(dataActionsContainer);
  }

  /**
   * Add bookmark management link to settings interface
   * @description Adds a bookmark management button to the interface
   * @returns {void}
   * @private
   */
  addBookmarkManagementLink() {
    const settingsInterface = document.getElementById('settings-interface');
    if (!settingsInterface) return;

    // Create bookmark management section
    const bookmarkSection = document.createElement('section');
    bookmarkSection.innerHTML = `
      <h3>Bookmark Management</h3>
      <p>Access the full bookmark management interface to search, filter, and manage your bookmarks.</p>
      <button id="manage-bookmarks-btn" class="secondary" title="Open bookmark management interface">
        📚 Manage Bookmarks
      </button>
    `;

    const manageBtn = bookmarkSection.querySelector('#manage-bookmarks-btn');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => this.openBookmarkManagement());
    }

    settingsInterface.appendChild(bookmarkSection);
  }


  /**
   * Import data action
   * @description Triggers the hidden file input element to allow user to select import file
   * @returns {void}
   * @private
   */
  importData() {
    const importFileEl = UIComponents.DOM.getElement('import-file');
    if (importFileEl) {
      importFileEl.click();
    }
  }


  /**
   * Open bookmark management interface in a new tab
   * @description Creates a new browser tab with the bookmark management interface
   * @returns {void}
   */
  openBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }
}
