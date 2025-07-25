/**
 * @fileoverview Tests for enhanced Chrome storage mocking
 * @module tests/unit/chrome-storage-mocking
 * @description Tests the improved Chrome storage mocking with state management and error handling
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mockChromeAPI,
  createAuthenticatedState,
  createUnconfiguredState,
  createConfiguredUnauthenticatedState,
} from './utils/test-utils.js';

describe('Enhanced Chrome Storage Mocking', () => {
  let mockChrome;

  beforeEach(() => {
    // Reset global chrome mock
    if (global.chrome._storageManager) {
      global.chrome._storageManager.reset();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ChromeStorageManager State Management', () => {
    test('should initialize with default state', () => {
      mockChrome = mockChromeAPI();

      expect(mockChrome.storage.sync.get).toBeDefined();
      expect(mockChrome.storage.sync.set).toBeDefined();
      expect(mockChrome.storage.sync.remove).toBeDefined();
      expect(mockChrome.storage.sync.clear).toBeDefined();
      expect(mockChrome.storage.sync.onChanged.addListener).toBeDefined();
      expect(mockChrome.storage.sync.onChanged.removeListener).toBeDefined();
    });

    test('should handle get with array keys', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
        auth_session: { user: { id: 'test-user' } },
      });

      return new Promise(resolve => {
        mockChrome.storage.sync.get(
          ['supabaseConfig', 'auth_session'],
          result => {
            expect(result.supabaseConfig).toEqual({
              url: 'https://test.supabase.co',
            });
            expect(result.auth_session).toEqual({ user: { id: 'test-user' } });
            resolve();
          }
        );
      });
    });

    test('should handle get with string key', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
      });

      return new Promise(resolve => {
        mockChrome.storage.sync.get('supabaseConfig', result => {
          expect(result.supabaseConfig).toEqual({
            url: 'https://test.supabase.co',
          });
          resolve();
        });
      });
    });

    test('should handle get with null keys (all data)', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
        auth_session: { user: { id: 'test-user' } },
      });

      return new Promise(resolve => {
        mockChrome.storage.sync.get(null, result => {
          expect(result.supabaseConfig).toEqual({
            url: 'https://test.supabase.co',
          });
          expect(result.auth_session).toEqual({ user: { id: 'test-user' } });
          expect(result.customStatusTypes).toBeDefined();
          resolve();
        });
      });
    });

    test('should handle get with undefined keys (all data)', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
      });

      return new Promise(resolve => {
        mockChrome.storage.sync.get(undefined, result => {
          expect(result.supabaseConfig).toEqual({
            url: 'https://test.supabase.co',
          });
          expect(result.customStatusTypes).toBeDefined();
          resolve();
        });
      });
    });

    test('should return null for non-existent keys', async () => {
      mockChrome = mockChromeAPI();

      return new Promise(resolve => {
        mockChrome.storage.sync.get(
          ['nonexistent', 'supabaseConfig'],
          result => {
            expect(result.nonexistent).toBeNull();
            expect(result.supabaseConfig).toBeNull();
            resolve();
          }
        );
      });
    });
  });

  describe('ChromeStorageManager Set Operations', () => {
    test('should set data and notify listeners', async () => {
      mockChrome = mockChromeAPI();
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.set(
          { supabaseConfig: { url: 'https://test.supabase.co' } },
          () => {
            expect(listener).toHaveBeenCalledWith(
              {
                supabaseConfig: {
                  oldValue: null,
                  newValue: { url: 'https://test.supabase.co' },
                },
              },
              'sync'
            );
            resolve();
          }
        );
      });
    });

    test('should handle multiple set operations', async () => {
      mockChrome = mockChromeAPI();
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.set(
          {
            supabaseConfig: { url: 'https://test.supabase.co' },
            auth_session: { user: { id: 'test-user' } },
          },
          () => {
            expect(listener).toHaveBeenCalledWith(
              expect.objectContaining({
                supabaseConfig: {
                  oldValue: null,
                  newValue: { url: 'https://test.supabase.co' },
                },
                auth_session: {
                  oldValue: null,
                  newValue: { user: { id: 'test-user' } },
                },
              }),
              'sync'
            );
            resolve();
          }
        );
      });
    });

    test('should handle set with callback', async () => {
      mockChrome = mockChromeAPI();
      const callback = vi.fn();

      return new Promise(resolve => {
        mockChrome.storage.sync.set({ test: 'value' }, callback);

        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          resolve();
        }, 10);
      });
    });

    test('should handle set without callback', () => {
      mockChrome = mockChromeAPI();

      expect(() => {
        mockChrome.storage.sync.set({ test: 'value' });
      }).not.toThrow();
    });
  });

  describe('ChromeStorageManager Remove Operations', () => {
    test('should remove single key', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
        auth_session: { user: { id: 'test-user' } },
      });
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.remove('supabaseConfig', () => {
          expect(listener).toHaveBeenCalledWith(
            {
              supabaseConfig: {
                oldValue: { url: 'https://test.supabase.co' },
                newValue: undefined,
              },
            },
            'sync'
          );
          resolve();
        });
      });
    });

    test('should remove multiple keys', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
        auth_session: { user: { id: 'test-user' } },
      });
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.remove(
          ['supabaseConfig', 'auth_session'],
          () => {
            expect(listener).toHaveBeenCalledWith(
              expect.objectContaining({
                supabaseConfig: {
                  oldValue: { url: 'https://test.supabase.co' },
                  newValue: undefined,
                },
                auth_session: {
                  oldValue: { user: { id: 'test-user' } },
                  newValue: undefined,
                },
              }),
              'sync'
            );
            resolve();
          }
        );
      });
    });

    test('should handle remove non-existent key', async () => {
      mockChrome = mockChromeAPI();
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.remove('nonexistent', () => {
          expect(listener).not.toHaveBeenCalled();
          resolve();
        });
      });
    });
  });

  describe('ChromeStorageManager Clear Operations', () => {
    test('should clear all data and notify listeners', async () => {
      mockChrome = mockChromeAPI({
        supabaseConfig: { url: 'https://test.supabase.co' },
        auth_session: { user: { id: 'test-user' } },
      });
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);

      return new Promise(resolve => {
        mockChrome.storage.sync.clear(() => {
          expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
              supabaseConfig: {
                oldValue: { url: 'https://test.supabase.co' },
                newValue: undefined,
              },
              auth_session: {
                oldValue: { user: { id: 'test-user' } },
                newValue: undefined,
              },
            }),
            'sync'
          );
          resolve();
        });
      });
    });
  });

  describe('ChromeStorageManager Listener Management', () => {
    test('should add and remove listeners', () => {
      mockChrome = mockChromeAPI();
      const listener = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener);
      expect(mockChrome._storageManager.listeners).toContain(listener);

      mockChrome.storage.sync.onChanged.removeListener(listener);
      expect(mockChrome._storageManager.listeners).not.toContain(listener);
    });

    test('should handle multiple listeners', async () => {
      mockChrome = mockChromeAPI();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      mockChrome.storage.sync.onChanged.addListener(listener1);
      mockChrome.storage.sync.onChanged.addListener(listener2);

      return new Promise(resolve => {
        mockChrome.storage.sync.set({ test: 'value' }, () => {
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          resolve();
        });
      });
    });

    test('should handle listener errors gracefully', async () => {
      mockChrome = mockChromeAPI();
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      mockChrome.storage.sync.onChanged.addListener(errorListener);

      // Should not throw error
      return new Promise(resolve => {
        mockChrome.storage.sync.set({ test: 'value' }, () => {
          resolve();
        });
      });
    });
  });

  describe('State Factory Functions', () => {
    test('should create authenticated state', () => {
      const state = createAuthenticatedState(
        { id: 'custom-user-id', email: 'custom@example.com' },
        { url: 'https://custom.supabase.co' }
      );

      expect(state.auth_session.user.id).toBe('custom-user-id');
      expect(state.auth_session.user.email).toBe('custom@example.com');
      expect(state.supabaseConfig.url).toBe('https://custom.supabase.co');
      expect(state.config.auth.user.id).toBe('custom-user-id');
    });

    test('should create unconfigured state', () => {
      const state = createUnconfiguredState();

      expect(state.supabaseConfig).toBeNull();
      expect(state.auth_session).toBeNull();
      expect(state.config.supabase).toBeNull();
      expect(state.config.auth).toBeNull();
      expect(state.customStatusTypes).toBeDefined();
    });

    test('should create configured unauthenticated state', () => {
      const state = createConfiguredUnauthenticatedState({
        url: 'https://custom.supabase.co',
      });

      expect(state.supabaseConfig.url).toBe('https://custom.supabase.co');
      expect(state.auth_session).toBeNull();
      expect(state.config.supabase.url).toBe('https://custom.supabase.co');
      expect(state.config.auth).toBeNull();
    });
  });

  describe('Runtime Message Handling', () => {
    test('should handle GET_AUTH_STATE message', async () => {
      mockChrome = mockChromeAPI(createAuthenticatedState());

      return new Promise(resolve => {
        mockChrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, response => {
          expect(response.authenticated).toBe(true);
          expect(response.user.id).toBe('test-user-id');
          resolve();
        });
      });
    });

    test('should handle GET_AUTH_STATE when not authenticated', async () => {
      mockChrome = mockChromeAPI(createUnconfiguredState());

      return new Promise(resolve => {
        mockChrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, response => {
          expect(response.authenticated).toBe(false);
          expect(response.user).toBeNull();
          resolve();
        });
      });
    });

    test('should handle unknown message types', async () => {
      mockChrome = mockChromeAPI();

      return new Promise(resolve => {
        mockChrome.runtime.sendMessage(
          { type: 'UNKNOWN_MESSAGE' },
          response => {
            expect(response.success).toBe(false);
            expect(response.error).toBe('Unknown message type');
            resolve();
          }
        );
      });
    });

    test('should handle message without callback', () => {
      mockChrome = mockChromeAPI();

      expect(() => {
        mockChrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage get errors gracefully', async () => {
      mockChrome = mockChromeAPI();

      // Test that the storage manager handles errors gracefully
      // by calling the method directly and ensuring it doesn't throw
      expect(() => {
        mockChrome._storageManager.get(['test'], () => {});
      }).not.toThrow();
    });

    test('should handle storage set errors gracefully', async () => {
      mockChrome = mockChromeAPI();

      // Test that the storage manager handles errors gracefully
      // by calling the method directly and ensuring it doesn't throw
      expect(() => {
        mockChrome._storageManager.set({ test: 'value' }, () => {});
      }).not.toThrow();
    });

    test('should handle storage listener errors gracefully', async () => {
      mockChrome = mockChromeAPI();
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      mockChrome.storage.sync.onChanged.addListener(errorListener);

      return new Promise(resolve => {
        mockChrome.storage.sync.set({ test: 'value' }, () => {
          // Should not throw error even though listener throws
          resolve();
        });
      });
    });
  });

  describe('Global Chrome Mock Integration', () => {
    test('should work with global chrome mock', async () => {
      // Test that the global chrome mock works with the storage manager
      global.chrome._storageManager.reset(createAuthenticatedState());

      return new Promise(resolve => {
        global.chrome.storage.sync.get(['auth_session'], result => {
          expect(result.auth_session.user.id).toBe('test-user-id');
          resolve();
        });
      });
    });

    test('should handle global chrome runtime messages', async () => {
      global.chrome._storageManager.reset(createAuthenticatedState());

      return new Promise(resolve => {
        global.chrome.runtime.sendMessage(
          { type: 'GET_AUTH_STATE' },
          response => {
            expect(response.authenticated).toBe(true);
            expect(response.user.id).toBe('test-user-id');
            resolve();
          }
        );
      });
    });
  });
});
