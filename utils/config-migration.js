/**
 * @fileoverview Configuration migration utility
 * @module config-migration
 * @description Handles configuration migration between versions
 */

/**
 * Configuration constants
 */
const CONFIG = {
  MIGRATION_VERSION: 1,
};

/**
 * Get current migration version
 * @returns {Promise<number>} Current migration version
 */
export async function getMigrationVersion() {
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
export async function setMigrationVersion(version) {
  try {
    await chrome.storage.sync.set({ configVersion: version });
  } catch (error) {
    // Log for monitoring, but don't throw (non-critical operation)
    console.warn('Failed to set migration version:', error);
  }
}

/**
 * Migrate to version 1 configuration
 * @description Performs migration to version 1 format
 */
export async function migrateToVersion1() {
  // Migration logic for version 1
  // This is where we'd handle any breaking changes in configuration format
  // Migrating configuration to version 1
}

/**
 * Migrate configuration to latest version
 * @description Handles configuration migration between versions
 */
export async function migrateConfig() {
  try {
    // Check if migration is needed
    const migrationVersion = await getMigrationVersion();

    if (migrationVersion < CONFIG.MIGRATION_VERSION) {
      // Migrate to version 1
      await migrateToVersion1();
      await setMigrationVersion(CONFIG.MIGRATION_VERSION);
    }
  } catch (error) {
    // Don't throw - migration errors shouldn't break the app
    console.warn('Migration error:', error);
  }
}
