/**
 * @fileoverview Unit tests for ConfigService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '../../../src/services/ConfigService.js';

describe('ConfigService', () => {
  let configService;
  let mockStorageService;
  let mockValidationService;
  let mockErrorService;

  beforeEach(() => {
    // Mock StorageService
    mockStorageService = {
      getSupabaseConfig: vi.fn(),
      setSupabaseConfig: vi.fn(),
      getStatusTypes: vi.fn(),
      setStatusTypes: vi.fn(),
      getUserPreferences: vi.fn(),
      setUserPreferences: vi.fn(),
      getDefaultPreferences: vi.fn().mockReturnValue({
        defaultView: 'list',
        pageSize: 20,
        theme: 'light',
        showConfirmations: true
      }),
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    };

    // Mock ValidationService
    mockValidationService = {
      validateConfig: vi.fn(),
      validateStatusType: vi.fn()
    };

    // Mock ErrorService
    mockErrorService = {
      handle: vi.fn().mockReturnValue({
        message: 'Mock error message',
        category: 'CONFIG',
        severity: 'HIGH'
      })
    };

    configService = new ConfigService(mockStorageService, mockValidationService, mockErrorService);
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(configService.storageService).toBe(mockStorageService);
      expect(configService.validationService).toBe(mockValidationService);
      expect(configService.errorService).toBe(mockErrorService);
      expect(configService.configCache).toBeNull();
      expect(configService.statusTypesCache).toBeNull();
    });
  });

  describe('getSupabaseConfig', () => {
    it('should return cached config when available', async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      configService.configCache = mockConfig;

      const result = await configService.getSupabaseConfig();

      expect(result).toBe(mockConfig);
      expect(mockStorageService.getSupabaseConfig).not.toHaveBeenCalled();
    });

    it('should return validated config from storage', async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };
      
      mockStorageService.getSupabaseConfig.mockResolvedValue(mockConfig);
      mockValidationService.validateConfig.mockReturnValue({
        isValid: true,
        data: mockConfig
      });

      const result = await configService.getSupabaseConfig();

      expect(result).toEqual(mockConfig);
      expect(configService.configCache).toEqual(mockConfig);
      expect(mockValidationService.validateConfig).toHaveBeenCalledWith(mockConfig);
    });

    it('should clear invalid config and return null', async () => {
      const invalidConfig = {
        url: 'invalid-url',
        anonKey: ''
      };
      
      mockStorageService.getSupabaseConfig.mockResolvedValue(invalidConfig);
      mockValidationService.validateConfig.mockReturnValue({
        isValid: false,
        errors: ['Invalid URL format']
      });
      configService.clearSupabaseConfig = vi.fn();

      const result = await configService.getSupabaseConfig();

      expect(result).toBeNull();
      expect(configService.clearSupabaseConfig).toHaveBeenCalled();
    });

    it('should return null when no config exists', async () => {
      mockStorageService.getSupabaseConfig.mockResolvedValue(null);
      // Mock getEnvironmentConfig to return null instead of throwing
      const getEnvConfigSpy = vi.spyOn(configService, 'getEnvironmentConfig').mockResolvedValue(null);

      const result = await configService.getSupabaseConfig();

      expect(result).toBeNull();
      getEnvConfigSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      mockStorageService.getSupabaseConfig.mockRejectedValue(new Error('Storage error'));

      await expect(configService.getSupabaseConfig()).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalled();
    });
  });

  describe('setSupabaseConfig', () => {
    it('should save valid config', async () => {
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      };

      mockValidationService.validateConfig.mockReturnValue({
        isValid: true,
        data: mockConfig
      });

      // Mock the connection test
      vi.spyOn(configService, 'testSupabaseConnection').mockResolvedValue(true);

      await configService.setSupabaseConfig(mockConfig);

      expect(mockValidationService.validateConfig).toHaveBeenCalledWith(mockConfig);
      expect(mockStorageService.setSupabaseConfig).toHaveBeenCalledWith(mockConfig);
      expect(configService.configCache).toEqual(mockConfig);
    });

    it('should reject invalid config', async () => {
      const invalidConfig = {
        url: 'invalid-url',
        anonKey: ''
      };

      mockValidationService.validateConfig.mockReturnValue({
        isValid: false,
        errors: ['Invalid URL format', 'Anonymous key is required']
      });

      await expect(configService.setSupabaseConfig(invalidConfig)).rejects.toThrow('Mock error message');
      expect(mockStorageService.setSupabaseConfig).not.toHaveBeenCalled();
    });
  });

  describe('clearSupabaseConfig', () => {
    it('should clear config and cache', async () => {
      configService.configCache = { url: 'test' };

      await configService.clearSupabaseConfig();

      expect(mockStorageService.remove).toHaveBeenCalledWith('supabase_config', true);
      expect(configService.configCache).toBeNull();
    });
  });

  describe('getStatusTypes', () => {
    it('should return cached status types when available', async () => {
      const mockStatusTypes = [
        { id: 'read', name: 'Read', color: '#28a745' },
        { id: 'unread', name: 'Unread', color: '#6c757d' }
      ];
      configService.statusTypesCache = mockStatusTypes;

      const result = await configService.getStatusTypes();

      expect(result).toBe(mockStatusTypes);
      expect(mockStorageService.get).not.toHaveBeenCalled();
    });

    it('should return stored status types', async () => {
      const mockStatusTypes = [
        { id: 'read', name: 'Read', color: '#28a745' }
      ];
      
      mockStorageService.getStatusTypes.mockResolvedValue(mockStatusTypes);

      const result = await configService.getStatusTypes();

      expect(result).toEqual(mockStatusTypes);
      expect(configService.statusTypesCache).toEqual(mockStatusTypes);
      expect(mockStorageService.getStatusTypes).toHaveBeenCalled();
    });

    it('should return default status types when none stored', async () => {
      mockStorageService.get.mockResolvedValue(null);

      const result = await configService.getStatusTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('color');
    });
  });

  describe('addStatusType', () => {
    it('should add valid status type', async () => {
      const existingTypes = [
        { id: 'read', name: 'Read', color: '#28a745' }
      ];
      const newType = { id: 'later', name: 'Read Later', color: '#ffc107' };

      mockStorageService.get.mockResolvedValue(existingTypes);
      mockValidationService.validateStatusType.mockReturnValue({
        isValid: true,
        data: newType
      });

      const result = await configService.addStatusType(newType);

      expect(result).toEqual(newType);
      expect(mockStorageService.set).toHaveBeenCalledWith('status_types', [...existingTypes, newType]);
      expect(configService.statusTypesCache).toEqual([...existingTypes, newType]);
    });

    it('should reject invalid status type', async () => {
      const invalidType = { id: '', name: '', color: 'invalid' };

      mockValidationService.validateStatusType.mockReturnValue({
        isValid: false,
        errors: ['ID is required', 'Name is required', 'Invalid color format']
      });

      await expect(configService.addStatusType(invalidType)).rejects.toThrow('Mock error message');
      expect(mockStorageService.set).not.toHaveBeenCalled();
    });

    it('should reject duplicate status type ID', async () => {
      const existingTypes = [
        { id: 'read', name: 'Read', color: '#28a745' }
      ];
      const duplicateType = { id: 'read', name: 'Already Read', color: '#007bff' };

      mockStorageService.get.mockResolvedValue(existingTypes);
      mockValidationService.validateStatusType.mockReturnValue({
        isValid: true,
        data: duplicateType
      });

      await expect(configService.addStatusType(duplicateType)).rejects.toThrow('Mock error message');
      expect(mockErrorService.handle).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('already exists') }),
        'ConfigService.addStatusType'
      );
    });
  });

  describe('removeStatusType', () => {
    it('should remove existing status type', async () => {
      const existingTypes = [
        { id: 'read', name: 'Read', color: '#28a745' },
        { id: 'unread', name: 'Unread', color: '#6c757d' }
      ];

      mockStorageService.get.mockResolvedValue(existingTypes);

      await configService.removeStatusType('unread');

      const expectedTypes = [{ id: 'read', name: 'Read', color: '#28a745' }];
      expect(mockStorageService.set).toHaveBeenCalledWith('status_types', expectedTypes);
      expect(configService.statusTypesCache).toEqual(expectedTypes);
    });

    it('should handle removal of non-existent status type', async () => {
      const existingTypes = [
        { id: 'read', name: 'Read', color: '#28a745' }
      ];

      mockStorageService.get.mockResolvedValue(existingTypes);

      await configService.removeStatusType('nonexistent');

      expect(mockStorageService.set).toHaveBeenCalledWith('status_types', existingTypes);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', async () => {
      const mockPrefs = {
        defaultView: 'grid',
        pageSize: 20,
        theme: 'light'
      };

      mockStorageService.get.mockResolvedValue(mockPrefs);

      const result = await configService.getUserPreferences();

      expect(result).toEqual(mockPrefs);
      expect(mockStorageService.get).toHaveBeenCalledWith('user_preferences');
    });

    it('should return default preferences when none stored', async () => {
      mockStorageService.get.mockResolvedValue(null);

      const result = await configService.getUserPreferences();

      expect(result).toEqual({
        defaultView: 'list',
        pageSize: 20,
        theme: 'light',
        showConfirmations: true
      });
    });
  });

  describe('updateUserPreferences', () => {
    it('should save user preferences', async () => {
      const mockPrefs = {
        defaultView: 'grid',
        pageSize: 50,
        theme: 'dark'
      };
      
      const currentPrefs = {
        defaultView: 'list',
        pageSize: 20,
        theme: 'light',
        showConfirmations: true
      };
      
      mockStorageService.getUserPreferences.mockResolvedValue(currentPrefs);
      vi.spyOn(configService, 'validateUserPreferences').mockReturnValue({...currentPrefs, ...mockPrefs});

      await configService.updateUserPreferences(mockPrefs);

      expect(mockStorageService.setUserPreferences).toHaveBeenCalled();
    });
  });
});