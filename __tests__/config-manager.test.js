import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ConfigManager from '../utils/config-manager.js';

// Mock Chrome extension APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
};

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    global.chrome = mockChrome;
    global.console = mockConsole;
    
    // Create new instance for each test
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Clean up
    if (configManager) {
      configManager.listeners.clear();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(configManager.config).toEqual({
        supabase: null,
        preferences: null,
        auth: null,
      });
      expect(configManager.initialized).toBe(false);
      expect(configManager.listeners).toBeInstanceOf(Set);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully with default configuration', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.initialize();

      expect(configManager.initialized).toBe(true);
      expect(configManager.config.supabase).toBeNull();
      expect(configManager.config.preferences.customStatusTypes).toEqual([
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ]);
      expect(configManager.config.auth).toBeNull();
    });

    test('should initialize with existing configuration', async () => {
      const mockSupabaseConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      const mockStatusTypes = ['read', 'unread', 'archived'];
      const mockAuthSession = { user: { id: '123' } };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: mockSupabaseConfig,
        customStatusTypes: mockStatusTypes,
        auth_session: mockAuthSession,
      });

      await configManager.initialize();

      expect(configManager.initialized).toBe(true);
      expect(configManager.config.supabase).toEqual(mockSupabaseConfig);
      expect(configManager.config.preferences.customStatusTypes).toEqual(mockStatusTypes);
      expect(configManager.config.auth).toEqual(mockAuthSession);
    });

    test('should not initialize twice', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.initialize();
      await configManager.initialize();

      expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Storage error');
      mockChrome.storage.sync.get.mockRejectedValue(error);

      await expect(configManager.initialize()).rejects.toThrow('Storage error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error initializing ConfigManager:',
        error
      );
    });

    test('should validate Supabase configuration', async () => {
      const invalidConfig = {
        url: 'http://example.supabase.co', // Invalid URL
        anonKey: 'invalid-key',
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: invalidConfig,
        customStatusTypes: null,
        auth_session: null,
      });

      await expect(configManager.initialize()).rejects.toThrow(
        'Invalid Supabase URL: must start with https://'
      );
    });

    test('should validate anon key format', async () => {
      const invalidConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'invalid-key',
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: invalidConfig,
        customStatusTypes: null,
        auth_session: null,
      });

      await expect(configManager.initialize()).rejects.toThrow(
        'Invalid anon key format'
      );
    });

    test('should handle missing Supabase configuration', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.initialize();

      expect(configManager.initialized).toBe(true);
      expect(configManager.config.supabase).toBeNull();
    });
  });

  describe('validateConfig', () => {
    test('should validate complete Supabase configuration', async () => {
      const validConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: validConfig,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.initialize();

      expect(configManager.initialized).toBe(true);
    });

    test('should reject Supabase config with missing URL', async () => {
      const invalidConfig = {
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: invalidConfig,
        customStatusTypes: null,
        auth_session: null,
      });

      await expect(configManager.initialize()).rejects.toThrow(
        'Invalid Supabase configuration: missing URL or anon key'
      );
    });

    test('should reject Supabase config with missing anon key', async () => {
      const invalidConfig = {
        url: 'https://example.supabase.co',
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: invalidConfig,
        customStatusTypes: null,
        auth_session: null,
      });

      await expect(configManager.initialize()).rejects.toThrow(
        'Invalid Supabase configuration: missing URL or anon key'
      );
    });

    test('should handle invalid preferences format', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: 'not-an-array',
        auth_session: null,
      });

      await configManager.initialize();

      expect(configManager.config.preferences.customStatusTypes).toEqual([
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ]);
    });
  });

  describe('Supabase Configuration Methods', () => {
    beforeEach(async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();
    });

    test('should get Supabase configuration', async () => {
      const mockConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      configManager.config.supabase = mockConfig;

      const result = await configManager.getSupabaseConfig();

      expect(result).toEqual(mockConfig);
    });

    test('should set Supabase configuration', async () => {
      const url = 'https://example.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      const result = await configManager.setSupabaseConfig(url, anonKey);

      expect(configManager.config.supabase).toEqual({ url, anonKey });
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        supabaseConfig: { url, anonKey },
      });
      expect(result).toEqual({
        success: true,
        message: 'Configuration saved successfully',
      });
    });

    test('should reject setting Supabase config with missing URL', async () => {
      await expect(
        configManager.setSupabaseConfig('', 'valid-key')
      ).rejects.toThrow('Both URL and anon key are required');
    });

    test('should reject setting Supabase config with missing anon key', async () => {
      await expect(
        configManager.setSupabaseConfig('https://example.supabase.co', '')
      ).rejects.toThrow('Both URL and anon key are required');
    });

    test('should reject setting Supabase config with invalid URL', async () => {
      await expect(
        configManager.setSupabaseConfig('http://example.supabase.co', 'valid-key')
      ).rejects.toThrow('URL must start with https://');
    });

    test('should reject setting Supabase config with invalid anon key', async () => {
      await expect(
        configManager.setSupabaseConfig('https://example.supabase.co', 'invalid-key')
      ).rejects.toThrow('Invalid anon key format');
    });

    test('should check if Supabase is configured', async () => {
      expect(await configManager.isSupabaseConfigured()).toBe(false);

      configManager.config.supabase = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      expect(await configManager.isSupabaseConfigured()).toBe(true);
    });
  });

  describe('Preferences Methods', () => {
    beforeEach(async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();
    });

    test('should get preferences', async () => {
      const result = await configManager.getPreferences();

      expect(result).toEqual({
        customStatusTypes: [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
        ],
      });
    });

    test('should set preferences', async () => {
      const newPreferences = {
        customStatusTypes: ['read', 'unread', 'archived'],
      };

      await configManager.setPreferences(newPreferences);

      expect(configManager.config.preferences.customStatusTypes).toEqual([
        'read',
        'unread',
        'archived',
      ]);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: ['read', 'unread', 'archived'],
      });
    });

    test('should get custom status types', async () => {
      const result = await configManager.getCustomStatusTypes();

      expect(result).toEqual([
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ]);
    });

    test('should set custom status types', async () => {
      const statusTypes = ['read', 'unread', 'archived'];

      await configManager.setCustomStatusTypes(statusTypes);

      expect(configManager.config.preferences.customStatusTypes).toEqual(statusTypes);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: statusTypes,
      });
    });

    test('should reject setting non-array status types', async () => {
      await expect(
        configManager.setCustomStatusTypes('not-an-array')
      ).rejects.toThrow('Status types must be an array');
    });

    test('should add custom status type', async () => {
      await configManager.addCustomStatusType('new-status');

      expect(configManager.config.preferences.customStatusTypes).toContain('new-status');
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: [
          'read',
          'good-reference',
          'low-value',
          'revisit-later',
          'new-status',
        ],
      });
    });

    test('should not add duplicate status type', async () => {
      await configManager.addCustomStatusType('read');

      expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('should reject adding invalid status type', async () => {
      await expect(
        configManager.addCustomStatusType('')
      ).rejects.toThrow('Status type must be a non-empty string');

      await expect(
        configManager.addCustomStatusType(null)
      ).rejects.toThrow('Status type must be a non-empty string');
    });

    test('should remove custom status type', async () => {
      await configManager.removeCustomStatusType('read');

      expect(configManager.config.preferences.customStatusTypes).not.toContain('read');
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        customStatusTypes: ['good-reference', 'low-value', 'revisit-later'],
      });
    });
  });

  describe('Authentication Methods', () => {
    beforeEach(async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();
    });

    test('should get auth session', async () => {
      const mockSession = { user: { id: '123' } };
      configManager.config.auth = mockSession;

      const result = await configManager.getAuthSession();

      expect(result).toEqual(mockSession);
    });

    test('should set auth session', async () => {
      const mockSession = { user: { id: '123' } };

      await configManager.setAuthSession(mockSession);

      expect(configManager.config.auth).toEqual(mockSession);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        auth_session: mockSession,
      });
    });

    test('should clear auth session', async () => {
      configManager.config.auth = { user: { id: '123' } };

      await configManager.clearAuthSession();

      expect(configManager.config.auth).toBeNull();
      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(['auth_session']);
    });

    test('should check if authenticated', async () => {
      expect(await configManager.isAuthenticated()).toBe(false);

      configManager.config.auth = { user: { id: '123' } };

      expect(await configManager.isAuthenticated()).toBe(true);
    });
  });

  describe('Listener Management', () => {
    test('should add and remove listeners', () => {
      const mockCallback = vi.fn();
      
      configManager.addListener('configChanged', mockCallback);
      expect(configManager.listeners.size).toBe(1);

      configManager.removeListener('configChanged', mockCallback);
      expect(configManager.listeners.size).toBe(0);
    });

    test('should notify listeners of events', () => {
      const mockCallback = vi.fn();
      configManager.addListener('supabaseConfigChanged', mockCallback);

      const mockData = { url: 'https://example.supabase.co' };
      configManager.notifyListeners('supabaseConfigChanged', mockData);

      expect(mockCallback).toHaveBeenCalledWith(mockData);
    });

    test('should handle listener callback errors', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      configManager.addListener('configChanged', mockCallback);

      const mockData = { test: 'data' };
      configManager.notifyListeners('configChanged', mockData);

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error in config listener:',
        expect.any(Error)
      );
    });
  });

  describe('ensureInitialized', () => {
    test('should initialize if not already initialized', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.ensureInitialized();

      expect(configManager.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });

      await configManager.initialize();
      await configManager.ensureInitialized();

      expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    test('should reset configuration', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();

      // Set some configuration
      configManager.config.supabase = { url: 'test', anonKey: 'test' };
      configManager.config.auth = { user: { id: '123' } };

      await configManager.reset();

      expect(configManager.config.supabase).toBeNull();
      expect(configManager.config.auth).toBeNull();
      expect(configManager.initialized).toBe(false);
      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith([
        'supabaseConfig',
        'customStatusTypes',
        'auth_session',
        'configVersion',
      ]);
    });
  });

  describe('getConfigSummary', () => {
    test('should provide configuration summary', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();

      const summary = configManager.getConfigSummary();

      expect(summary).toEqual({
        supabaseConfigured: false,
        hasAuthSession: false,
        customStatusTypesCount: 4,
        initialized: true,
      });
    });

    test('should provide configuration summary with data', async () => {
      const mockSupabaseConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      const mockAuthSession = { user: { id: '123' } };

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: mockSupabaseConfig,
        customStatusTypes: ['read', 'unread'],
        auth_session: mockAuthSession,
      });
      await configManager.initialize();

      const summary = configManager.getConfigSummary();

      expect(summary).toEqual({
        supabaseConfigured: true,
        hasAuthSession: true,
        customStatusTypesCount: 2,
        initialized: true,
      });
    });
  });

  describe('Migration', () => {
    test('should handle migration version 0', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
        configVersion: 0,
      });

      await configManager.initialize();

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ configVersion: 1 });
    });

    test('should not migrate if already at current version', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
        configVersion: 1,
      });

      await configManager.initialize();

      expect(mockChrome.storage.sync.set).not.toHaveBeenCalledWith(
        expect.objectContaining({ configVersion: 1 })
      );
    });

    test('should handle migration errors gracefully', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
        configVersion: 0,
      });
      mockChrome.storage.sync.set.mockRejectedValue(new Error('Migration error'));

      // Should not throw error
      await configManager.initialize();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error during configuration migration:',
        expect.any(Error)
      );
    });
  });

  describe('Export/Import', () => {
    test('should export configuration', async () => {
      const mockSupabaseConfig = {
        url: 'https://example.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      const mockStatusTypes = ['read', 'unread'];

      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: mockSupabaseConfig,
        customStatusTypes: mockStatusTypes,
        auth_session: null,
      });
      await configManager.initialize();

      const exported = await configManager.exportConfig();

      expect(exported).toEqual({
        supabaseConfig: mockSupabaseConfig,
        customStatusTypes: mockStatusTypes,
        version: 1,
      });
    });

    test('should import configuration', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();

      const importData = {
        supabaseConfig: {
          url: 'https://example.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        customStatusTypes: ['read', 'unread'],
        version: 1,
      };

      await configManager.importConfig(importData);

      expect(configManager.config.supabase).toEqual(importData.supabaseConfig);
      expect(configManager.config.preferences.customStatusTypes).toEqual(
        importData.customStatusTypes
      );
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        supabaseConfig: importData.supabaseConfig,
        customStatusTypes: importData.customStatusTypes,
      });
    });

    test('should validate imported configuration', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        supabaseConfig: null,
        customStatusTypes: null,
        auth_session: null,
      });
      await configManager.initialize();

      const invalidImportData = {
        supabaseConfig: {
          url: 'http://example.supabase.co', // Invalid URL
          anonKey: 'invalid-key',
        },
        customStatusTypes: ['read'],
        version: 1,
      };

      await expect(
        configManager.importConfig(invalidImportData)
      ).rejects.toThrow('Invalid Supabase URL: must start with https://');
    });
  });
}); 