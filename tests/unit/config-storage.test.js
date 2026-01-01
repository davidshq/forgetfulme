/**
 * @fileoverview Unit tests for config storage
 * @module tests/unit/config-storage
 * @description Tests for configuration storage operations
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  loadAllConfig,
  saveSupabaseConfig,
  saveCustomStatusTypes,
  saveAuthSession,
  clearAuthSession,
  initializeDefaultSettings,
} from '../../utils/config-storage.js';

// Mock chrome.storage
const mockStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
};

global.chrome = {
  storage: mockStorage,
};

describe('ConfigStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadAllConfig', () => {
    test('should load all configuration from storage', async () => {
      const mockData = {
        supabaseConfig: { url: 'https://example.supabase.co', anonKey: 'key' },
        customStatusTypes: ['read', 'unread'],
        auth_session: { access_token: 'token' },
      };

      mockStorage.sync.get.mockResolvedValue(mockData);

      const result = await loadAllConfig();

      expect(result).toEqual({
        supabase: mockData.supabaseConfig,
        preferences: {
          customStatusTypes: mockData.customStatusTypes,
        },
        auth: mockData.auth_session,
      });
      expect(mockStorage.sync.get).toHaveBeenCalledWith([
        'supabaseConfig',
        'customStatusTypes',
        'auth_session',
      ]);
    });

    test('should return defaults when storage is empty', async () => {
      mockStorage.sync.get.mockResolvedValue({});

      const result = await loadAllConfig();

      expect(result).toEqual({
        supabase: null,
        preferences: {
          customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
        },
        auth: null,
      });
    });

    test('should throw error when storage.get fails', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));

      await expect(loadAllConfig()).rejects.toThrow('Failed to load configuration');
    });
  });

  describe('saveSupabaseConfig', () => {
    test('should save Supabase configuration', async () => {
      const config = { url: 'https://example.supabase.co', anonKey: 'key' };
      mockStorage.sync.set.mockResolvedValue();

      await saveSupabaseConfig(config);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        supabaseConfig: config,
      });
    });
  });

  describe('saveCustomStatusTypes', () => {
    test('should save custom status types', async () => {
      const statusTypes = ['read', 'unread', 'archived'];
      mockStorage.sync.set.mockResolvedValue();

      await saveCustomStatusTypes(statusTypes);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: statusTypes,
      });
    });
  });

  describe('saveAuthSession', () => {
    test('should save authentication session', async () => {
      const session = { access_token: 'token', refresh_token: 'refresh' };
      mockStorage.sync.set.mockResolvedValue();

      await saveAuthSession(session);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        auth_session: session,
      });
    });

    test('should save null session', async () => {
      mockStorage.sync.set.mockResolvedValue();

      await saveAuthSession(null);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        auth_session: null,
      });
    });
  });

  describe('clearAuthSession', () => {
    test('should remove authentication session from storage', async () => {
      mockStorage.sync.remove.mockResolvedValue();

      await clearAuthSession();

      expect(mockStorage.sync.remove).toHaveBeenCalledWith(['auth_session']);
    });
  });

  describe('initializeDefaultSettings', () => {
    test('should initialize default settings', async () => {
      const defaultSettings = {
        customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
      };
      mockStorage.sync.set.mockResolvedValue();

      const result = await initializeDefaultSettings();

      expect(mockStorage.sync.set).toHaveBeenCalledWith(defaultSettings);
      expect(result).toEqual(defaultSettings);
    });
  });
});
