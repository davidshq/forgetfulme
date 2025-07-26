import { describe, test, expect, beforeEach, vi } from 'vitest';
import ConfigManager from '../../../utils/config-manager.js';
import SupabaseService from '../../../supabase-service/index.js';

// Only mock external dependencies, not internal components
vi.mock('../../../supabase-js.min.js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  })),
}));

describe('Config-Service Integration', () => {
  let configManager;
  let mockChrome;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock only Chrome APIs (external dependency)
    mockChrome = {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(),
        },
      },
    };
    global.chrome = mockChrome;
    global.supabase = { createClient: vi.fn() };

    configManager = new ConfigManager();
  });

  test('should provide valid config to SupabaseService', async () => {
    // Setup valid configuration
    mockChrome.storage.sync.get.mockResolvedValue({
      supabaseConfig: {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key',
      },
    });

    await configManager.initialize();
    const config = await configManager.getSupabaseConfig();

    // Test that ConfigManager and SupabaseService work together
    expect(config).toBeDefined();
    expect(config.url).toBe('https://test.supabase.co');
    expect(config.anonKey).toBe('test-anon-key');

    // Test that SupabaseService accepts the config
    const service = new SupabaseService({
      getSupabaseConfig: () => config,
      initialize: () => Promise.resolve(),
    });

    // This tests real integration without mocking internal behavior
    expect(service).toBeDefined();
    expect(service.config).toBeDefined();
  });

  test('should handle missing configuration gracefully', async () => {
    // Test error path without mocking error handling
    mockChrome.storage.sync.get.mockResolvedValue({});

    await configManager.initialize();
    const config = await configManager.getSupabaseConfig();

    // Test real behavior - what actually happens when config is missing
    expect(config).toBeNull();

    // SupabaseService should handle this gracefully
    const service = new SupabaseService({
      getSupabaseConfig: () => config,
      initialize: () => Promise.resolve(),
    });

    expect(service).toBeDefined();
  });

  test('should validate configuration before passing to service', async () => {
    // Test validation behavior
    const invalidConfig = {
      url: 'invalid-url',
      anonKey: '',
    };

    mockChrome.storage.sync.get.mockResolvedValue({
      supabaseConfig: invalidConfig,
    });

    await configManager.initialize();

    // Test that validation works as expected
    try {
      await configManager.setSupabaseConfig('invalid-url', '');
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).toBeDefined();
      // Test that we get meaningful error information
      expect(error.message).toContain('URL');
    }
  });
});
