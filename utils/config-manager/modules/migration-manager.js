/**
 * @fileoverview Migration manager for configuration data
 * @module migration-manager
 * @description Handles configuration version migration logic
 */

import ErrorHandler from '../../error-handler.js';

/**
 * Migration Manager for Configuration Data
 * @class MigrationManager
 * @description Manages configuration version migration logic
 */
class MigrationManager {
  /**
   * Initialize the migration manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Migrate configuration to latest version
   * @description Handles configuration migration between versions
   */
  async migrateConfig() {
    try {
      // Check if migration is needed
      const migrationVersion = await this.getMigrationVersion();

      if (migrationVersion < 1) {
        // Migrate to version 1
        await this.migrateToVersion1();
        await this.setMigrationVersion(1);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'migration-manager.migrateConfig');
      // Don't throw - migration errors shouldn't break the app
    }
  }

  /**
   * Migrate to version 1 configuration
   * @description Performs migration to version 1 format
   */
  async migrateToVersion1() {
    // Migration logic for version 1
    // This is where we'd handle any breaking changes in configuration format
    // Migrating configuration to version 1
  }

  /**
   * Get current migration version
   * @returns {Promise<number>} Current migration version
   */
  async getMigrationVersion() {
    try {
      const result = await chrome.storage.sync.get(['configVersion']);
      return result.configVersion || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Set migration version
   * @param {number} version - Version number to set
   */
  async setMigrationVersion(version) {
    try {
      await chrome.storage.sync.set({ configVersion: version });
    } catch {
      // Error setting migration version
    }
  }
}

export default MigrationManager;
