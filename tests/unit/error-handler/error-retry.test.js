/**
 * @fileoverview Unit tests for Error Retry Module
 * @module error-retry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorRetry } from '../../../utils/error-handler/modules/error-retry.js';

describe('ErrorRetry', () => {
  let retry;

  beforeEach(() => {
    retry = new ErrorRetry();
  });

  describe('constructor', () => {
    it('should initialize with default retry policies', () => {
      expect(retry.retryPolicies).toEqual({
        NETWORK: true,
        AUTH: true,
        VALIDATION: false,
        DATABASE: true,
        CONFIG: false,
        UI: false,
        UNKNOWN: false,
      });
    });

    it('should initialize with default display policies', () => {
      expect(retry.displayPolicies).toEqual({
        NETWORK: false,
        AUTH: true,
        VALIDATION: true,
        DATABASE: false,
        CONFIG: true,
        UI: false,
        UNKNOWN: false,
      });
    });

    it('should initialize with default severity display policies', () => {
      expect(retry.severityDisplayPolicies).toEqual({
        LOW: false,
        MEDIUM: false,
        HIGH: true,
        CRITICAL: true,
      });
    });
  });

  describe('shouldRetry', () => {
    it('should return true for network errors', () => {
      const errorInfo = { type: 'NETWORK' };
      expect(retry.shouldRetry(errorInfo)).toBe(true);
    });

    it('should return true for auth errors', () => {
      const errorInfo = { type: 'AUTH' };
      expect(retry.shouldRetry(errorInfo)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const errorInfo = { type: 'VALIDATION' };
      expect(retry.shouldRetry(errorInfo)).toBe(false);
    });

    it('should return true for database errors', () => {
      const errorInfo = { type: 'DATABASE' };
      expect(retry.shouldRetry(errorInfo)).toBe(true);
    });

    it('should return false for config errors', () => {
      const errorInfo = { type: 'CONFIG' };
      expect(retry.shouldRetry(errorInfo)).toBe(false);
    });

    it('should return false for UI errors', () => {
      const errorInfo = { type: 'UI' };
      expect(retry.shouldRetry(errorInfo)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const errorInfo = { type: 'UNKNOWN' };
      expect(retry.shouldRetry(errorInfo)).toBe(false);
    });

    it('should return false for undefined error types', () => {
      const errorInfo = { type: 'UNDEFINED_TYPE' };
      expect(retry.shouldRetry(errorInfo)).toBe(false);
    });
  });

  describe('shouldShowToUser', () => {
    it('should return false for network errors', () => {
      const errorInfo = { type: 'NETWORK', severity: 'MEDIUM' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });

    it('should return true for auth errors', () => {
      const errorInfo = { type: 'AUTH', severity: 'HIGH' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(true);
    });

    it('should return true for validation errors', () => {
      const errorInfo = { type: 'VALIDATION', severity: 'LOW' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(true);
    });

    it('should return false for database errors', () => {
      const errorInfo = { type: 'DATABASE', severity: 'HIGH' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });

    it('should return true for config errors', () => {
      const errorInfo = { type: 'CONFIG', severity: 'MEDIUM' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(true);
    });

    it('should return false for UI errors', () => {
      const errorInfo = { type: 'UI', severity: 'MEDIUM' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const errorInfo = { type: 'UNKNOWN', severity: 'MEDIUM' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });

    it('should return true for high severity errors without specific type policy', () => {
      const errorInfo = { type: 'CUSTOM_TYPE', severity: 'HIGH' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(true);
    });

    it('should return true for critical severity errors without specific type policy', () => {
      const errorInfo = { type: 'CUSTOM_TYPE', severity: 'CRITICAL' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(true);
    });

    it('should return false for low severity errors without specific type policy', () => {
      const errorInfo = { type: 'CUSTOM_TYPE', severity: 'LOW' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });

    it('should return false for medium severity errors without specific type policy', () => {
      const errorInfo = { type: 'CUSTOM_TYPE', severity: 'MEDIUM' };
      expect(retry.shouldShowToUser(errorInfo)).toBe(false);
    });
  });

  describe('setRetryPolicy', () => {
    it('should set retry policy for existing error type', () => {
      retry.setRetryPolicy('NETWORK', false);
      expect(retry.retryPolicies.NETWORK).toBe(false);
    });

    it('should set retry policy for new error type', () => {
      retry.setRetryPolicy('CUSTOM_TYPE', true);
      expect(retry.retryPolicies.CUSTOM_TYPE).toBe(true);
    });

    it('should update existing retry policy', () => {
      retry.setRetryPolicy('VALIDATION', true);
      expect(retry.retryPolicies.VALIDATION).toBe(true);
    });
  });

  describe('setDisplayPolicy', () => {
    it('should set display policy for existing error type', () => {
      retry.setDisplayPolicy('NETWORK', true);
      expect(retry.displayPolicies.NETWORK).toBe(true);
    });

    it('should set display policy for new error type', () => {
      retry.setDisplayPolicy('CUSTOM_TYPE', true);
      expect(retry.displayPolicies.CUSTOM_TYPE).toBe(true);
    });

    it('should update existing display policy', () => {
      retry.setDisplayPolicy('DATABASE', true);
      expect(retry.displayPolicies.DATABASE).toBe(true);
    });
  });

  describe('setSeverityDisplayPolicy', () => {
    it('should set severity display policy for existing severity', () => {
      retry.setSeverityDisplayPolicy('LOW', true);
      expect(retry.severityDisplayPolicies.LOW).toBe(true);
    });

    it('should set severity display policy for new severity', () => {
      retry.setSeverityDisplayPolicy('CUSTOM_SEVERITY', true);
      expect(retry.severityDisplayPolicies.CUSTOM_SEVERITY).toBe(true);
    });

    it('should update existing severity display policy', () => {
      retry.setSeverityDisplayPolicy('HIGH', false);
      expect(retry.severityDisplayPolicies.HIGH).toBe(false);
    });
  });

  describe('getRetryPolicies', () => {
    it('should return copy of retry policies', () => {
      const policies = retry.getRetryPolicies();
      expect(policies).toEqual(retry.retryPolicies);
      expect(policies).not.toBe(retry.retryPolicies); // Should be a copy
    });

    it('should return updated policies after changes', () => {
      retry.setRetryPolicy('CUSTOM_TYPE', true);
      const policies = retry.getRetryPolicies();
      expect(policies.CUSTOM_TYPE).toBe(true);
    });
  });

  describe('getDisplayPolicies', () => {
    it('should return copy of display policies', () => {
      const policies = retry.getDisplayPolicies();
      expect(policies.type).toEqual(retry.displayPolicies);
      expect(policies.severity).toEqual(retry.severityDisplayPolicies);
      expect(policies.type).not.toBe(retry.displayPolicies); // Should be a copy
      expect(policies.severity).not.toBe(retry.severityDisplayPolicies); // Should be a copy
    });

    it('should return updated policies after changes', () => {
      retry.setDisplayPolicy('CUSTOM_TYPE', true);
      retry.setSeverityDisplayPolicy('CUSTOM_SEVERITY', true);
      const policies = retry.getDisplayPolicies();
      expect(policies.type.CUSTOM_TYPE).toBe(true);
      expect(policies.severity.CUSTOM_SEVERITY).toBe(true);
    });
  });

  describe('resetPolicies', () => {
    it('should reset retry policies to defaults', () => {
      retry.setRetryPolicy('NETWORK', false);
      retry.setRetryPolicy('CUSTOM_TYPE', true);

      retry.resetPolicies();

      expect(retry.retryPolicies.NETWORK).toBe(true);
      expect(retry.retryPolicies.CUSTOM_TYPE).toBeUndefined();
    });

    it('should reset display policies to defaults', () => {
      retry.setDisplayPolicy('NETWORK', true);
      retry.setDisplayPolicy('CUSTOM_TYPE', true);

      retry.resetPolicies();

      expect(retry.displayPolicies.NETWORK).toBe(false);
      expect(retry.displayPolicies.CUSTOM_TYPE).toBeUndefined();
    });

    it('should reset severity display policies to defaults', () => {
      retry.setSeverityDisplayPolicy('LOW', true);
      retry.setSeverityDisplayPolicy('CUSTOM_SEVERITY', true);

      retry.resetPolicies();

      expect(retry.severityDisplayPolicies.LOW).toBe(false);
      expect(retry.severityDisplayPolicies.CUSTOM_SEVERITY).toBeUndefined();
    });
  });
});
