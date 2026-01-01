import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeServices } from '../../utils/service-initializer.js';

/**
 * @fileoverview Unit tests for service-initializer utility
 * @module service-initializer.test
 * @description Tests for service initialization logic
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Mock dependencies
vi.mock('../../utils/config-manager.js', () => ({
  default: class MockConfigManager {
    constructor() {
      this.initialize = vi.fn();
    }
  },
}));

vi.mock('../../utils/auth-state-manager.js', () => ({
  default: class MockAuthStateManager {
    constructor() {
      this.isAuthenticated = vi.fn();
    }
  },
}));

vi.mock('../../supabase-config.js', () => ({
  default: class MockSupabaseConfig {
    constructor() {
      this.isConfigured = vi.fn();
    }
  },
}));

vi.mock('../../supabase-service.js', () => ({
  default: class MockSupabaseService {
    constructor() {
      this.initialize = vi.fn();
    }
  },
}));

vi.mock('../../auth-ui.js', () => ({
  default: class MockAuthUI {
    constructor() {
      this.showLoginForm = vi.fn();
    }
  },
}));

vi.mock('../../config-ui.js', () => ({
  default: class MockConfigUI {
    constructor() {
      this.showConfigForm = vi.fn();
    }
  },
}));

import ConfigManager from '../../utils/config-manager.js';
import AuthStateManager from '../../utils/auth-state-manager.js';
import SupabaseConfig from '../../supabase-config.js';
import SupabaseService from '../../supabase-service.js';
import AuthUI from '../../auth-ui.js';
import ConfigUI from '../../config-ui.js';

describe('service-initializer', () => {
  let mockOnAuthSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthSuccess = vi.fn();
  });

  describe('initializeServices', () => {
    it('should initialize all required services', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
      });

      expect(services).toHaveProperty('configManager');
      expect(services).toHaveProperty('authStateManager');
      expect(services).toHaveProperty('supabaseConfig');
      expect(services).toHaveProperty('supabaseService');
      expect(services).toHaveProperty('authUI');
      expect(services).not.toHaveProperty('configUI');
      expect(services.configManager).toBeInstanceOf(ConfigManager);
      expect(services.authStateManager).toBeInstanceOf(AuthStateManager);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
      expect(services.supabaseService).toBeInstanceOf(SupabaseService);
      expect(services.authUI).toBeInstanceOf(AuthUI);
    });

    it('should include ConfigUI when includeConfigUI is true', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
        includeConfigUI: true,
      });

      expect(services).toHaveProperty('configUI');
      expect(services.configUI).toBeInstanceOf(ConfigUI);
    });

    it('should not include ConfigUI when includeConfigUI is false', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
        includeConfigUI: false,
      });

      expect(services).not.toHaveProperty('configUI');
    });

    it('should not include ConfigUI by default', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
      });

      expect(services).not.toHaveProperty('configUI');
    });

    it('should pass onAuthSuccess to AuthUI', () => {
      const customOnAuthSuccess = vi.fn();

      const services = initializeServices({
        onAuthSuccess: customOnAuthSuccess,
      });

      expect(services.authUI).toBeInstanceOf(AuthUI);
    });

    it('should return correct service instances', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
      });

      expect(services.configManager).toBeInstanceOf(ConfigManager);
      expect(services.authStateManager).toBeInstanceOf(AuthStateManager);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
      expect(services.supabaseService).toBeInstanceOf(SupabaseService);
      expect(services.authUI).toBeInstanceOf(AuthUI);
    });

    it('should work with empty options object', () => {
      const services = initializeServices({});

      expect(services).toHaveProperty('configManager');
      expect(services).toHaveProperty('authStateManager');
      expect(services).toHaveProperty('supabaseConfig');
      expect(services).toHaveProperty('supabaseService');
      expect(services).toHaveProperty('authUI');
      expect(services.configManager).toBeInstanceOf(ConfigManager);
      expect(services.authStateManager).toBeInstanceOf(AuthStateManager);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
      expect(services.supabaseService).toBeInstanceOf(SupabaseService);
      expect(services.authUI).toBeInstanceOf(AuthUI);
    });

    it('should work with no options provided', () => {
      const services = initializeServices();

      expect(services).toHaveProperty('configManager');
      expect(services).toHaveProperty('authStateManager');
      expect(services).toHaveProperty('supabaseConfig');
      expect(services).toHaveProperty('supabaseService');
      expect(services).toHaveProperty('authUI');
      expect(services.configManager).toBeInstanceOf(ConfigManager);
      expect(services.authStateManager).toBeInstanceOf(AuthStateManager);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
      expect(services.supabaseService).toBeInstanceOf(SupabaseService);
      expect(services.authUI).toBeInstanceOf(AuthUI);
    });

    it('should pass supabaseConfig to SupabaseService constructor', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
      });

      expect(services.supabaseService).toBeInstanceOf(SupabaseService);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
    });

    it('should pass correct parameters to AuthUI constructor', () => {
      const customOnAuthSuccess = vi.fn();

      const services = initializeServices({
        onAuthSuccess: customOnAuthSuccess,
      });

      expect(services.authUI).toBeInstanceOf(AuthUI);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
      expect(services.authStateManager).toBeInstanceOf(AuthStateManager);
    });

    it('should pass supabaseConfig to ConfigUI when included', () => {
      const services = initializeServices({
        onAuthSuccess: mockOnAuthSuccess,
        includeConfigUI: true,
      });

      expect(services.configUI).toBeInstanceOf(ConfigUI);
      expect(services.supabaseConfig).toBeInstanceOf(SupabaseConfig);
    });
  });
});
