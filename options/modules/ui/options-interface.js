/**
 * @fileoverview Options interface module for options page
 * @module options-interface
 * @description Handles main interface management and event binding
 */

import UIComponents from '../../../utils/ui-components.js';

/**
 * Options interface manager for options page
 * @class OptionsInterface
 * @description Manages main interface and event binding
 */
export class OptionsInterface {
  /**
   * Initialize the options interface manager
   * @constructor
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.appContainer - App container element
   * @param {Object} dependencies.configUI - Config UI manager
   * @param {Object} dependencies.dataManager - Data manager instance
   */
  constructor(dependencies) {
    this.appContainer = dependencies.appContainer;
    this.configUI = dependencies.configUI;
    this.dataManager = dependencies.dataManager;
  }

  /**
   * Show main application interface
   * @description Creates and displays the main options interface with all cards
   */
  showMainInterface() {
    // Create main container
    const mainContainer = UIComponents.createContainer(
      'ForgetfulMe Settings',
      '',
      'main-container'
    );

    // Create config card
    const configCard = UIComponents.createCard(
      '⚙️ Supabase Configuration',
      '<div id="config-status-container"></div>',
      '',
      'config-card'
    );
    mainContainer.appendChild(configCard);

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

    const statsCard = UIComponents.createCard(
      '📈 Usage Statistics',
      statsContainer.outerHTML,
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

    const statusCard = UIComponents.createCard(
      '🏷️ Custom Status Types',
      addStatusContainer,
      '',
      'status-card'
    );
    mainContainer.appendChild(statusCard);

    // Create data management card
    const dataActions = [
      {
        text: 'Export All Data',
        onClick: () => this.dataManager.exportData(),
        className: 'secondary',
      },
      {
        text: 'Import Data',
        onClick: () => this.importData(),
        className: 'secondary',
      },
      {
        text: 'Clear All Data',
        onClick: () => this.dataManager.clearData(),
        className: 'contrast',
      },
    ];

    const dataCard = UIComponents.createCardWithActions(
      '💾 Data Management',
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
      '📚 Bookmark Management',
      '<p>Access the full bookmark management interface to search, filter, and manage your bookmarks.</p>',
      manageBookmarksBtn.outerHTML,
      'bookmark-card'
    );
    mainContainer.appendChild(bookmarkCard);

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(mainContainer);

    // Show configuration status
    const configStatusContainer = document.getElementById(
      'config-status-container'
    );
    if (configStatusContainer) {
      this.configUI.showConfigStatus(configStatusContainer);
    }
  }

  /**
   * Bind event listeners to DOM elements
   * @description Sets up click and keyboard event handlers
   */
  bindEvents() {
    // Form submission is already handled by the form's onSubmit callback
    // No need for additional event bindings for the status form

    const exportDataBtn = UIComponents.DOM.getElement('export-data-btn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () =>
        this.dataManager.exportData()
      );
    }

    const importDataBtn = UIComponents.DOM.getElement('import-data-btn');
    if (importDataBtn) {
      importDataBtn.addEventListener('click', () => {
        const importFileEl = UIComponents.DOM.getElement('import-file');
        if (importFileEl) {
          importFileEl.click();
        }
      });
    }

    const importFile = UIComponents.DOM.getElement('import-file');
    if (importFile) {
      importFile.addEventListener('change', e =>
        this.dataManager.importData(e)
      );
    }

    const clearDataBtn = UIComponents.DOM.getElement('clear-data-btn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () =>
        this.dataManager.clearData()
      );
    }
  }

  /**
   * Import data action
   * @description Triggers file input for data import
   */
  importData() {
    const importFileEl = UIComponents.DOM.getElement('import-file');
    if (importFileEl) {
      importFileEl.click();
    }
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
}
