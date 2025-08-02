/**
 * @fileoverview Unit tests for constants
 */

import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_STATUS_TYPES, 
  PAGINATION, 
  STORAGE_KEYS, 
  ERROR_CATEGORIES,
  ERROR_SEVERITY 
} from '../../../src/utils/constants.js';

describe('Constants', () => {
  describe('DEFAULT_STATUS_TYPES', () => {
    it('should have default status types', () => {
      expect(DEFAULT_STATUS_TYPES).toBeDefined();
      expect(Array.isArray(DEFAULT_STATUS_TYPES)).toBe(true);
      expect(DEFAULT_STATUS_TYPES.length).toBeGreaterThan(0);
      
      const unreadType = DEFAULT_STATUS_TYPES.find(type => type.id === 'unread');
      const readType = DEFAULT_STATUS_TYPES.find(type => type.id === 'read');
      
      expect(unreadType).toBeDefined();
      expect(readType).toBeDefined();
    });

    it('should have proper color and icon properties', () => {
      DEFAULT_STATUS_TYPES.forEach(statusType => {
        expect(statusType).toHaveProperty('id');
        expect(statusType).toHaveProperty('name');
        expect(statusType).toHaveProperty('color');
        expect(statusType).toHaveProperty('icon');
        expect(typeof statusType.id).toBe('string');
        expect(typeof statusType.name).toBe('string');
        expect(typeof statusType.color).toBe('string');
        expect(typeof statusType.icon).toBe('string');
      });
    });
  });

  describe('PAGINATION', () => {
    it('should have pagination constants', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(25);
      expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
      expect(typeof PAGINATION.DEFAULT_PAGE_SIZE).toBe('number');
      expect(typeof PAGINATION.MAX_PAGE_SIZE).toBe('number');
    });

    it('should have sensible pagination limits', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThan(PAGINATION.DEFAULT_PAGE_SIZE);
      expect(PAGINATION.MAX_PAGE_SIZE).toBeLessThanOrEqual(100);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have storage key constants', () => {
      expect(STORAGE_KEYS.SUPABASE_CONFIG).toBe('supabase_config');
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe('user_preferences');
      expect(STORAGE_KEYS.STATUS_TYPES).toBe('status_types');
      expect(STORAGE_KEYS.USER_SESSION).toBe('user_session');
    });

    it('should have unique storage keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('ERROR_CATEGORIES', () => {
    it('should have error category constants', () => {
      expect(ERROR_CATEGORIES.NETWORK).toBe('NETWORK');
      expect(ERROR_CATEGORIES.AUTH).toBe('AUTH');
      expect(ERROR_CATEGORIES.VALIDATION).toBe('VALIDATION');
      expect(ERROR_CATEGORIES.DATABASE).toBe('DATABASE');
      expect(ERROR_CATEGORIES.CONFIG).toBe('CONFIG');
      expect(ERROR_CATEGORIES.STORAGE).toBe('STORAGE');
      expect(ERROR_CATEGORIES.PERMISSION).toBe('PERMISSION');
      expect(ERROR_CATEGORIES.UNKNOWN).toBe('UNKNOWN');
    });

    it('should have all uppercase category names', () => {
      Object.values(ERROR_CATEGORIES).forEach(category => {
        expect(category).toBe(category.toUpperCase());
      });
    });
  });

  describe('ERROR_SEVERITY', () => {
    it('should have error severity constants', () => {
      expect(ERROR_SEVERITY.LOW).toBe('LOW');
      expect(ERROR_SEVERITY.MEDIUM).toBe('MEDIUM');
      expect(ERROR_SEVERITY.HIGH).toBe('HIGH');
      expect(ERROR_SEVERITY.CRITICAL).toBe('CRITICAL');
    });

    it('should have all uppercase severity names', () => {
      Object.values(ERROR_SEVERITY).forEach(severity => {
        expect(severity).toBe(severity.toUpperCase());
      });
    });
  });
});