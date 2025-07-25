/**
 * @fileoverview Unit test utilities for Vitest
 * @module test-utils
 * @description Common utilities and helper functions for unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Enhanced Chrome storage state manager for unit tests
 * @class ChromeStorageManager
 * @description Manages Chrome storage state with proper event handling and state persistence
 */
class ChromeStorageManager {
  constructor(initialData = {}) {
    this.data = {
      // Default storage structure matching the application expectations
      supabaseConfig: null,
      auth_session: null,
      customStatusTypes: [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ],
      config: {
        supabase: null,
        preferences: {
          customStatusTypes: [
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ],
        },
        auth: null,
      },
      ...initialData,
    };
    this.listeners = [];
    this.errorListeners = [];
  }

  /**
   * Get storage data with proper key handling
   * @param {string|Array|Object} keys - Keys to retrieve
   * @param {Function} callback - Callback function
   */
  get(keys, callback) {
    try {
      const result = {};

      if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = this.data[key] !== undefined ? this.data[key] : null;
        });
      } else if (typeof keys === 'string') {
        result[keys] = this.data[keys] !== undefined ? this.data[keys] : null;
      } else if (keys === null || keys === undefined) {
        // Return all data when no keys specified
        Object.assign(result, this.data);
      } else {
        // Handle object keys
        Object.keys(keys).forEach(key => {
          result[key] = this.data[key] !== undefined ? this.data[key] : null;
        });
      }

      callback(result);
    } catch (error) {
      this.notifyErrorListeners('get', error);
      callback({});
    }
  }

  /**
   * Set storage data with change notifications
   * @param {Object} data - Data to store
   * @param {Function} callback - Callback function
   */
  set(data, callback) {
    try {
      const changes = {};
      Object.keys(data).forEach(key => {
        const oldValue = this.data[key];
        this.data[key] = data[key];
        changes[key] = { oldValue, newValue: data[key] };
      });

      // Notify listeners of changes
      this.notifyListeners(changes);

      if (callback) callback();
    } catch (error) {
      this.notifyErrorListeners('set', error);
      if (callback) callback();
    }
  }

  /**
   * Remove storage data
   * @param {string|Array} keys - Keys to remove
   * @param {Function} callback - Callback function
   */
  remove(keys, callback) {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      const changes = {};

      keyArray.forEach(key => {
        if (this.data[key] !== undefined) {
          const oldValue = this.data[key];
          delete this.data[key];
          changes[key] = { oldValue, newValue: undefined };
        }
      });

      if (Object.keys(changes).length > 0) {
        this.notifyListeners(changes);
      }

      if (callback) callback();
    } catch (error) {
      this.notifyErrorListeners('remove', error);
      if (callback) callback();
    }
  }

  /**
   * Clear all storage data
   * @param {Function} callback - Callback function
   */
  clear(callback) {
    try {
      const changes = {};
      Object.keys(this.data).forEach(key => {
        changes[key] = { oldValue: this.data[key], newValue: undefined };
      });

      this.data = {};
      this.notifyListeners(changes);

      if (callback) callback();
    } catch (error) {
      this.notifyErrorListeners('clear', error);
      if (callback) callback();
    }
  }

  /**
   * Add change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove change listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener function
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  /**
   * Notify change listeners
   * @param {Object} changes - Storage changes
   */
  notifyListeners(changes) {
    this.listeners.forEach(listener => {
      try {
        listener(changes, 'sync');
      } catch (error) {
        console.warn('Storage listener error:', error);
      }
    });
  }

  /**
   * Notify error listeners
   * @param {string} operation - Operation that failed
   * @param {Error} error - Error object
   */
  notifyErrorListeners(operation, error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(operation, error);
      } catch (listenerError) {
        console.warn('Error listener error:', listenerError);
      }
    });
  }

  /**
   * Reset storage to initial state
   * @param {Object} newData - New initial data
   */
  reset(newData = {}) {
    this.data = {
      supabaseConfig: null,
      auth_session: null,
      customStatusTypes: [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ],
      config: {
        supabase: null,
        preferences: {
          customStatusTypes: [
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ],
        },
        auth: null,
      },
      ...newData,
    };
    this.listeners = [];
    this.errorListeners = [];
  }
}

/**
 * Enhanced Chrome API mock for unit tests
 * @param {Object} storageData - Initial storage data
 * @param {Object} options - Mock options
 * @returns {Object} Enhanced mock Chrome API
 */
export const mockChromeAPI = (storageData = {}, options = {}) => {
  const storageManager = new ChromeStorageManager(storageData);

  const mockStorage = {
    sync: {
      get: vi.fn((keys, callback) => {
        // Ensure callback is called asynchronously
        setTimeout(() => storageManager.get(keys, callback), 0);
      }),
      set: vi.fn((data, callback) => {
        // Ensure callback is called asynchronously
        setTimeout(() => storageManager.set(data, callback), 0);
      }),
      remove: vi.fn((keys, callback) => {
        // Ensure callback is called asynchronously
        setTimeout(() => storageManager.remove(keys, callback), 0);
      }),
      clear: vi.fn(callback => {
        // Ensure callback is called asynchronously
        setTimeout(() => storageManager.clear(callback), 0);
      }),
      onChanged: {
        addListener: vi.fn(listener => storageManager.addListener(listener)),
        removeListener: vi.fn(listener =>
          storageManager.removeListener(listener)
        ),
      },
    },
    local: {
      get: vi.fn((keys, callback) => {
        // Local storage typically empty for this extension
        setTimeout(() => callback({}), 0);
      }),
      set: vi.fn((data, callback) => {
        if (callback) setTimeout(() => callback(), 0);
      }),
      remove: vi.fn((keys, callback) => {
        if (callback) setTimeout(() => callback(), 0);
      }),
      clear: vi.fn(callback => {
        if (callback) setTimeout(() => callback(), 0);
      }),
    },
  };

  const mockRuntime = {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn((message, callback) => {
      // Enhanced message handling with proper responses
      const responses = {
        BOOKMARK_SAVED: { success: true, bookmarkId: 'test-id' },
        GET_AUTH_STATE: {
          authenticated: !!storageManager.data.auth_session,
          user: storageManager.data.auth_session?.user || null,
        },
        TEST_CONNECTION: { success: true, message: 'Connection successful' },
        SAVE_CONFIG: { success: true, message: 'Configuration saved' },
        GET_CONFIG: {
          success: true,
          config: storageManager.data.config,
        },
      };

      const response = responses[message.type] || {
        success: false,
        error: 'Unknown message type',
      };

      if (callback) {
        // Simulate async response
        setTimeout(() => callback(response), options.responseDelay || 100);
      }
    }),
    openOptionsPage: vi.fn(),
    getURL: vi.fn(path => `chrome-extension://test-id/${path}`),
  };

  const mockTabs = {
    query: vi.fn((queryInfo, callback) => {
      const mockTabs = [
        {
          id: 1,
          url: 'https://example.com',
          title: 'Test Page',
          active: true,
        },
      ];
      setTimeout(() => callback(mockTabs), 0);
    }),
    getCurrent: vi.fn(callback => {
      setTimeout(
        () =>
          callback({
            id: 1,
            url: 'https://example.com',
            title: 'Test Page',
          }),
        0
      );
    }),
    get: vi.fn((tabId, callback) => {
      setTimeout(
        () =>
          callback({
            id: tabId,
            url: 'https://example.com',
            title: 'Test Page',
          }),
        0
      );
    }),
    update: vi.fn(),
    create: vi.fn(),
  };

  const mockAction = {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };

  const mockNotifications = {
    create: vi.fn(),
    clear: vi.fn(),
  };

  const mockCommands = {
    onCommand: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };

  return {
    storage: mockStorage,
    runtime: mockRuntime,
    tabs: mockTabs,
    action: mockAction,
    notifications: mockNotifications,
    commands: mockCommands,
    // Expose storage manager for test control
    _storageManager: storageManager,
  };
};

/**
 * Create authenticated Chrome storage state
 * @param {Object} userData - User data
 * @param {Object} configData - Configuration data
 * @returns {Object} Authenticated storage state
 */
export const createAuthenticatedState = (userData = {}, configData = {}) => ({
  auth_session: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      ...userData,
    },
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
  },
  supabaseConfig: {
    url: 'https://test.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key',
    ...configData,
  },
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key',
      ...configData,
    },
    preferences: {
      customStatusTypes: [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ],
    },
    auth: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        ...userData,
      },
    },
  },
});

/**
 * Create unconfigured Chrome storage state
 * @returns {Object} Unconfigured storage state
 */
export const createUnconfiguredState = () => ({
  supabaseConfig: null,
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  config: {
    supabase: null,
    preferences: {
      customStatusTypes: [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ],
    },
    auth: null,
  },
});

/**
 * Create configured but unauthenticated Chrome storage state
 * @param {Object} configData - Configuration data
 * @returns {Object} Configured but unauthenticated storage state
 */
export const createConfiguredUnauthenticatedState = (configData = {}) => ({
  supabaseConfig: {
    url: 'https://test.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key',
    ...configData,
  },
  auth_session: null,
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key',
      ...configData,
    },
    preferences: {
      customStatusTypes: [
        'read',
        'good-reference',
        'low-value',
        'revisit-later',
      ],
    },
    auth: null,
  },
});

/**
 * Create a mock DOM element for unit tests
 * @param {string} tagName - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} innerHTML - Inner HTML content
 * @returns {HTMLElement} Mock DOM element
 */
export const createMockElement = (
  tagName = 'div',
  attributes = {},
  innerHTML = ''
) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  element.innerHTML = innerHTML;
  return element;
};

/**
 * Create a mock form element for unit tests
 * @param {Object} formData - Form field data
 * @returns {HTMLFormElement} Mock form element
 */
export const createMockForm = (formData = {}) => {
  const form = document.createElement('form');
  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  return form;
};

/**
 * Mock console methods for unit tests
 * @returns {Object} Mock console object
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  Object.assign(console, mockConsole);

  return {
    mockConsole,
    restore: () => {
      Object.assign(console, originalConsole);
    },
  };
};

/**
 * Create a mock error for unit tests
 * @param {string} message - Error message
 * @param {string} name - Error name
 * @param {number} code - Error code
 * @returns {Error} Mock error object
 */
export const createMockError = (
  message = 'Test error',
  name = 'TestError',
  code = 500
) => {
  const error = new Error(message);
  error.name = name;
  error.code = code;
  return error;
};

/**
 * Wait for a promise to resolve (useful for testing async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export const waitFor = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock event for unit tests
 * @param {string} type - Event type
 * @param {Object} options - Event options
 * @returns {Event} Mock event object
 */
export const createMockEvent = (type = 'click', options = {}) => {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  return event;
};

/**
 * Reset all mocks between tests
 */
export const resetMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};
