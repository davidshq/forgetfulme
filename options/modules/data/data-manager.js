/**
 * @fileoverview Data management module for options page
 * @module data-manager
 * @description Handles data operations, statistics, and import/export functionality
 */

import UIComponents from '../../../utils/ui-components.js';
import ErrorHandler from '../../../utils/error-handler.js';
import UIMessages from '../../../utils/ui-messages.js';
import { formatStatus } from '../../../utils/formatters.js';

/**
 * Data manager for options page
 * @class DataManager
 * @description Manages data operations, statistics, and import/export
 */
export class DataManager {
  /**
   * Initialize the data manager
   * @constructor
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.configManager - Config manager instance
   * @param {Object} dependencies.supabaseService - Supabase service instance
   * @param {Object} dependencies.appContainer - App container element
   */
  constructor(dependencies) {
    this.configManager = dependencies.configManager;
    this.supabaseService = dependencies.supabaseService;
    this.appContainer = dependencies.appContainer;
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

      this.loadStatusTypes(customStatusTypes);
      this.loadStatistics(bookmarks, customStatusTypes);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.loadData');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Load status types into the UI
   * @param {Array} statusTypes - Array of custom status types
   * @description Populates the status types list with current data
   */
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
      this.loadStatusTypes(customStatusTypes);
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

  /**
   * Load statistics into the UI
   * @param {Array} bookmarks - Array of bookmark objects
   * @param {Array} statusTypes - Array of status type objects
   * @description Updates statistics display with current data
   */
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
}
