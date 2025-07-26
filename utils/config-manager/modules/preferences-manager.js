/**
 * @fileoverview Preferences manager for user preferences
 * @module preferences-manager
 * @description Handles user preferences management
 */

import ErrorHandler from '../../error-handler.js';

/**
 * Preferences Manager for User Preferences
 * @class PreferencesManager
 * @description Manages user preferences operations
 */
class PreferencesManager {
  /**
   * Initialize the preferences manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Set user preferences
   * @param {Object} preferences - Preferences object to save
   * @description Saves user preferences to storage
   */
  async setPreferences(preferences) {
    // Merge with existing preferences
    this.configManager.config.preferences = {
      ...this.configManager.config.preferences,
      ...preferences,
    };

    // Save to storage
    await chrome.storage.sync.set({
      customStatusTypes: this.configManager.config.preferences.customStatusTypes,
    });

    this.configManager.events.notifyListeners('preferencesChanged', this.configManager.config.preferences);
  }

  /**
   * Set custom status types
   * @param {Array} statusTypes - Array of status type strings
   * @description Saves custom status types to preferences
   */
  async setCustomStatusTypes(statusTypes) {
    this.configManager.validation.validateStatusTypes(statusTypes);

    this.configManager.config.preferences.customStatusTypes = statusTypes;

    // Save to storage
    await chrome.storage.sync.set({
      customStatusTypes: statusTypes,
    });

    this.configManager.events.notifyListeners('statusTypesChanged', statusTypes);
  }

  /**
   * Add custom status type
   * @param {string} statusType - Status type to add
   * @description Adds a new status type to the list
   */
  async addCustomStatusType(statusType) {
    this.configManager.validation.validateStatusType(statusType);

    const currentTypes = this.configManager.config.preferences.customStatusTypes;
    if (!currentTypes.includes(statusType)) {
      currentTypes.push(statusType);
      await this.setCustomStatusTypes(currentTypes);
    }
  }

  /**
   * Remove custom status type
   * @param {string} statusType - Status type to remove
   * @description Removes a status type from the list
   */
  async removeCustomStatusType(statusType) {
    const currentTypes = this.configManager.config.preferences.customStatusTypes;
    const updatedTypes = currentTypes.filter(type => type !== statusType);
    await this.setCustomStatusTypes(updatedTypes);
  }
}

export default PreferencesManager; 