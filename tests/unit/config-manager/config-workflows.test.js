import { describe, test, expect, beforeEach, vi } from 'vitest';
import ConfigManager from '../../../utils/config-manager/index.js';

describe('Configuration Workflows', () => {
  let configManager;
  let mockChrome;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock only Chrome APIs (external dependency)
    mockChrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
    };
    global.chrome = mockChrome;

    configManager = new ConfigManager();
  });

  describe('Initial Setup Workflow', () => {
    test('should guide user through first-time setup', async () => {
      // Simulate empty Chrome storage (first run)
      mockChrome.storage.sync.get.mockResolvedValue({});

      await configManager.initialize();

      // Test first-time setup behavior
      expect(await configManager.isSupabaseConfigured()).toBe(false);

      const summary = configManager.getConfigSummary();
      expect(summary.initialized).toBe(true);
      expect(summary.supabaseConfigured).toBe(false);
      expect(summary.hasAuthSession).toBe(false);
    });

    test('should restore configuration from storage', async () => {
      // Simulate existing configuration
      const existingConfig = {
        supabaseConfig: {
          url: 'https://test.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        },
        customStatusTypes: ['read', 'important'],
        auth_session: {
          user: { id: 'user123', email: 'test@example.com' },
          access_token: 'token123',
        },
      };

      mockChrome.storage.sync.get.mockResolvedValue(existingConfig);

      await configManager.initialize();

      // Test configuration restoration
      expect(await configManager.isSupabaseConfigured()).toBe(true);
      expect(await configManager.isAuthenticated()).toBe(true);

      const config = await configManager.getSupabaseConfig();
      expect(config.url).toBe('https://test.supabase.co');

      const statusTypes = await configManager.getCustomStatusTypes();
      expect(statusTypes).toEqual(['read', 'important']);
    });
  });

  describe('Configuration Validation Workflow', () => {
    test('should validate Supabase URL format', async () => {
      await configManager.initialize();

      // Test invalid URL handling
      await expect(
        configManager.setSupabaseConfig('invalid-url', 'valid-key')
      ).rejects.toThrow();

      // Test valid URL acceptance
      const validUrl = 'https://project.supabase.co';
      const validKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

      await expect(
        configManager.setSupabaseConfig(validUrl, validKey)
      ).resolves.toBeDefined();
    });

    test('should validate anon key format', async () => {
      await configManager.initialize();

      const validUrl = 'https://project.supabase.co';

      // Test invalid key formats
      const invalidKeys = ['', 'invalid-key', '12345'];

      for (const invalidKey of invalidKeys) {
        await expect(
          configManager.setSupabaseConfig(validUrl, invalidKey)
        ).rejects.toThrow();
      }
    });

    test('should validate custom status types', async () => {
      await configManager.initialize();

      // Test valid status types
      const validTypes = ['read', 'important', 'archive'];
      await expect(
        configManager.setCustomStatusTypes(validTypes)
      ).resolves.toBeDefined();

      // Test invalid status types
      await expect(configManager.setCustomStatusTypes([])).rejects.toThrow();

      await expect(
        configManager.setCustomStatusTypes(['', 'valid'])
      ).rejects.toThrow();
    });
  });

  describe('Configuration Migration Workflow', () => {
    test('should migrate old configuration format', async () => {
      // Simulate old format configuration
      const oldFormatConfig = {
        supabase_url: 'https://old.supabase.co',
        supabase_key: 'old-key-format',
        status_types: 'read,unread,archive', // Old comma-separated format
      };

      mockChrome.storage.sync.get.mockResolvedValue(oldFormatConfig);

      await configManager.initialize();

      // Test migration behavior
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();

      // Verify new format is used
      const setCall = mockChrome.storage.sync.set.mock.calls[0][0];
      expect(setCall.supabaseConfig).toBeDefined();
      expect(setCall.customStatusTypes).toBeInstanceOf(Array);
    });

    test('should handle corrupted configuration gracefully', async () => {
      // Simulate corrupted data
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: 'invalid-json-string',
        customStatusTypes: null,
      });

      // Should not throw error during initialization
      await expect(configManager.initialize()).resolves.toBeDefined();

      // Should fall back to defaults
      const statusTypes = await configManager.getCustomStatusTypes();
      expect(statusTypes).toEqual([
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ]);
    });
  });

  describe('Authentication State Management', () => {
    test('should manage authentication lifecycle', async () => {
      await configManager.initialize();

      // Test initial unauthenticated state
      expect(await configManager.isAuthenticated()).toBe(false);

      // Test setting authentication
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' },
        access_token: 'token123',
        expires_at: Date.now() + 3600000,
      };

      await configManager.setAuthSession(mockSession);
      expect(await configManager.isAuthenticated()).toBe(true);

      const session = await configManager.getAuthSession();
      expect(session.user.id).toBe('user123');

      // Test clearing authentication
      await configManager.clearAuthSession();
      expect(await configManager.isAuthenticated()).toBe(false);
    });

    test('should handle expired sessions', async () => {
      await configManager.initialize();

      // Test expired session
      const expiredSession = {
        user: { id: 'user123' },
        access_token: 'token123',
        expires_at: Date.now() - 1000, // Expired
      };

      await configManager.setAuthSession(expiredSession);

      // Test that expired sessions are handled
      const session = await configManager.getAuthSession();
      expect(session).toBeDefined(); // Session is stored but should be validated by consumer
    });
  });

  describe('Event-Driven Configuration Updates', () => {
    test('should notify listeners of configuration changes', async () => {
      await configManager.initialize();

      const configChangeListener = vi.fn();
      const authChangeListener = vi.fn();

      configManager.addListener(
        'supabase-config-changed',
        configChangeListener
      );
      configManager.addListener('auth-session-changed', authChangeListener);

      // Test configuration change notification
      await configManager.setSupabaseConfig(
        'https://test.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      );

      expect(configChangeListener).toHaveBeenCalled();

      // Test authentication change notification
      await configManager.setAuthSession({
        user: { id: 'user123' },
        access_token: 'token123',
      });

      expect(authChangeListener).toHaveBeenCalled();
    });

    test('should remove event listeners properly', async () => {
      await configManager.initialize();

      const listener = vi.fn();
      configManager.addListener('test-event', listener);

      // Test listener is called
      configManager.notifyListeners('test-event', { data: 'test' });
      expect(listener).toHaveBeenCalledOnce();

      // Test listener removal
      configManager.removeListener('test-event', listener);
      configManager.notifyListeners('test-event', { data: 'test2' });
      expect(listener).toHaveBeenCalledOnce(); // Should not be called again
    });
  });

  describe('Configuration Export/Import', () => {
    test('should export configuration for backup', async () => {
      // Setup configuration
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: {
          url: 'https://test.supabase.co',
          anonKey: 'test-key',
        },
        customStatusTypes: ['read', 'important'],
      });

      await configManager.initialize();

      const exportData = await configManager.exportConfig();

      // Test export includes all configuration
      expect(exportData.supabase).toBeDefined();
      expect(exportData.preferences).toBeDefined();
      expect(exportData.version).toBeDefined();
      expect(exportData.exportDate).toBeDefined();
    });

    test('should import configuration from backup', async () => {
      await configManager.initialize();

      const importData = {
        supabase: {
          url: 'https://imported.supabase.co',
          anonKey: 'imported-key',
        },
        preferences: {
          customStatusTypes: ['imported', 'types'],
        },
        version: '1.0.0',
      };

      await configManager.importConfig(importData);

      // Test import updates storage
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();

      // Test configuration is available
      const config = await configManager.getSupabaseConfig();
      expect(config.url).toBe('https://imported.supabase.co');
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should handle Chrome storage failures gracefully', async () => {
      // Simulate storage failure
      mockChrome.storage.sync.get.mockRejectedValue(
        new Error('Storage unavailable')
      );

      // Should not crash initialization
      await expect(configManager.initialize()).resolves.toBeDefined();

      // Should fall back to defaults
      const summary = configManager.getConfigSummary();
      expect(summary.initialized).toBe(true);
    });

    test('should recover from partial configuration corruption', async () => {
      // Simulate partially corrupted storage
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: { url: 'valid-url' }, // Missing anonKey
        customStatusTypes: ['valid', '', 'types'], // Contains invalid empty string
      });

      await configManager.initialize();

      // Test graceful handling and cleanup
      expect(await configManager.isSupabaseConfigured()).toBe(false); // Incomplete config

      const statusTypes = await configManager.getCustomStatusTypes();
      expect(statusTypes).not.toContain(''); // Empty strings should be filtered out
    });
  });
});
