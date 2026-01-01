/**
 * @fileoverview Unit tests for config migration
 * @module tests/unit/config-migration
 * @description Tests for configuration migration functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  getMigrationVersion,
  setMigrationVersion,
  migrateToVersion1,
  migrateConfig,
} from '../../utils/config-migration.js';

// Mock chrome.storage
const mockStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

global.chrome = {
  storage: mockStorage,
};

describe('ConfigMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMigrationVersion', () => {
    test('should return version from storage', async () => {
      mockStorage.sync.get.mockResolvedValue({ configVersion: 2 });

      const version = await getMigrationVersion();

      expect(version).toBe(2);
      expect(mockStorage.sync.get).toHaveBeenCalledWith(['configVersion']);
    });

    test('should return 0 when version is not set', async () => {
      mockStorage.sync.get.mockResolvedValue({});

      const version = await getMigrationVersion();

      expect(version).toBe(0);
    });

    test('should return 0 when storage.get fails', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));

      const version = await getMigrationVersion();

      expect(version).toBe(0);
    });
  });

  describe('setMigrationVersion', () => {
    test('should set migration version in storage', async () => {
      mockStorage.sync.set.mockResolvedValue();

      await setMigrationVersion(3);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({ configVersion: 3 });
    });

    test('should not throw when storage.set fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockStorage.sync.set.mockRejectedValue(new Error('Storage error'));

      await expect(setMigrationVersion(3)).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('migrateToVersion1', () => {
    test('should complete migration to version 1', async () => {
      await expect(migrateToVersion1()).resolves.not.toThrow();
    });
  });

  describe('migrateConfig', () => {
    test('should migrate when version is less than current', async () => {
      mockStorage.sync.get.mockResolvedValue({ configVersion: 0 });
      mockStorage.sync.set.mockResolvedValue();

      await migrateConfig();

      expect(mockStorage.sync.get).toHaveBeenCalledWith(['configVersion']);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({ configVersion: 1 });
    });

    test('should not migrate when version is current', async () => {
      mockStorage.sync.get.mockResolvedValue({ configVersion: 1 });

      await migrateConfig();

      expect(mockStorage.sync.set).not.toHaveBeenCalled();
    });

    test('should not migrate when version is greater than current', async () => {
      mockStorage.sync.get.mockResolvedValue({ configVersion: 2 });

      await migrateConfig();

      expect(mockStorage.sync.set).not.toHaveBeenCalled();
    });

    test('should not throw when migration fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockStorage.sync.get.mockResolvedValue({ configVersion: 0 });
      mockStorage.sync.set.mockRejectedValue(new Error('Migration error'));

      await expect(migrateConfig()).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test('should not throw when getMigrationVersion fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));

      await expect(migrateConfig()).resolves.not.toThrow();

      consoleWarnSpy.mockRestore();
    });
  });
});
