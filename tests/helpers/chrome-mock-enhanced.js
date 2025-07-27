/**
 * Enhanced Chrome API mock for comprehensive testing
 * Provides realistic Chrome extension API simulation with dependency injection support
 */
import { vi } from 'vitest';

/**
 * Create a comprehensive Chrome API mock with enhanced functionality
 * @returns {Object} Complete Chrome API mock with all required methods
 */
export function createEnhancedChromeMock() {
  // Storage system with event emission
  const storageData = new Map();
  const storageListeners = [];

  const mockChrome = {
    // Commands API - keyboard shortcuts
    commands: {
      onCommand: {
        addListener: vi.fn((listener) => {
          mockChrome._commandListeners = mockChrome._commandListeners || [];
          mockChrome._commandListeners.push(listener);
        }),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => true),
      },
      getAll: vi.fn(() => Promise.resolve([
        { name: 'mark-as-read', description: 'Mark current page as read', shortcut: 'Ctrl+Shift+R' }
      ])),
    },

    // Tabs API - tab management
    tabs: {
      query: vi.fn(() => Promise.resolve([
        { 
          id: 1, 
          url: 'https://example.com/test', 
          title: 'Test Page',
          active: true,
          windowId: 1
        }
      ])),
      get: vi.fn((tabId) => Promise.resolve({
        id: tabId,
        url: 'https://example.com/test',
        title: 'Test Page',
        active: true,
        windowId: 1
      })),
      onActivated: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => true),
      },
      onUpdated: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => true),
      },
      create: vi.fn((createProperties) => Promise.resolve({
        id: 2,
        url: createProperties.url,
        title: 'New Tab',
        active: createProperties.active || false,
        windowId: 1
      })),
    },

    // Runtime API - messaging and lifecycle
    runtime: {
      onMessage: {
        addListener: vi.fn((listener) => {
          mockChrome._messageListeners = mockChrome._messageListeners || [];
          mockChrome._messageListeners.push(listener);
        }),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => true),
      },
      onStartup: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn((listener) => {
          mockChrome._installedListeners = mockChrome._installedListeners || [];
          mockChrome._installedListeners.push(listener);
        }),
        removeListener: vi.fn(),
      },
      sendMessage: vi.fn((message, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = undefined;
        }
        if (callback) {
          setTimeout(() => callback({ success: true }), 0);
        }
        return Promise.resolve({ success: true });
      }),
      getManifest: vi.fn(() => ({
        name: 'ForgetfulMe',
        version: '1.0.0',
        manifest_version: 3
      })),
      id: 'test-extension-id',
    },

    // Storage API with realistic behavior
    storage: {
      sync: {
        get: vi.fn((keys, callback) => {
          const result = {};
          if (typeof keys === 'string') {
            keys = [keys];
          }
          if (Array.isArray(keys)) {
            keys.forEach(key => {
              if (storageData.has(key)) {
                result[key] = storageData.get(key);
              }
            });
          } else if (keys === null || keys === undefined) {
            // Get all data
            for (const [key, value] of storageData.entries()) {
              result[key] = value;
            }
          }
          
          if (callback) {
            setTimeout(() => callback(result), 0);
          }
          return Promise.resolve(result);
        }),
        set: vi.fn((items, callback) => {
          const changes = {};
          for (const [key, newValue] of Object.entries(items)) {
            const oldValue = storageData.get(key);
            storageData.set(key, newValue);
            changes[key] = { oldValue, newValue };
          }
          
          // Emit storage change events
          storageListeners.forEach(listener => {
            setTimeout(() => listener(changes, 'sync'), 0);
          });
          
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
        remove: vi.fn((keys, callback) => {
          if (typeof keys === 'string') {
            keys = [keys];
          }
          const changes = {};
          keys.forEach(key => {
            if (storageData.has(key)) {
              const oldValue = storageData.get(key);
              storageData.delete(key);
              changes[key] = { oldValue, newValue: undefined };
            }
          });
          
          // Emit storage change events
          if (Object.keys(changes).length > 0) {
            storageListeners.forEach(listener => {
              setTimeout(() => listener(changes, 'sync'), 0);
            });
          }
          
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
        clear: vi.fn((callback) => {
          const changes = {};
          for (const [key, oldValue] of storageData.entries()) {
            changes[key] = { oldValue, newValue: undefined };
          }
          storageData.clear();
          
          // Emit storage change events
          if (Object.keys(changes).length > 0) {
            storageListeners.forEach(listener => {
              setTimeout(() => listener(changes, 'sync'), 0);
            });
          }
          
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
      },
      local: {
        get: vi.fn((keys, callback) => {
          // Similar to sync but separate storage space
          const result = {};
          if (callback) {
            setTimeout(() => callback(result), 0);
          }
          return Promise.resolve(result);
        }),
        set: vi.fn((items, callback) => {
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
        remove: vi.fn((keys, callback) => {
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
        clear: vi.fn((callback) => {
          if (callback) {
            setTimeout(callback, 0);
          }
          return Promise.resolve();
        }),
      },
      onChanged: {
        addListener: vi.fn((listener) => {
          storageListeners.push(listener);
        }),
        removeListener: vi.fn((listener) => {
          const index = storageListeners.indexOf(listener);
          if (index > -1) {
            storageListeners.splice(index, 1);
          }
        }),
        hasListener: vi.fn(() => true),
      },
    },

    // Notifications API
    notifications: {
      create: vi.fn((notificationId, options, callback) => {
        if (typeof notificationId === 'object') {
          // notificationId is actually options
          callback = options;
          options = notificationId;
          notificationId = 'test-notification-' + Date.now();
        }
        
        if (callback) {
          setTimeout(() => callback(notificationId), 0);
        }
        return Promise.resolve(notificationId);
      }),
      clear: vi.fn((notificationId, callback) => {
        if (callback) {
          setTimeout(() => callback(true), 0);
        }
        return Promise.resolve(true);
      }),
      getAll: vi.fn((callback) => {
        const notifications = {};
        if (callback) {
          setTimeout(() => callback(notifications), 0);
        }
        return Promise.resolve(notifications);
      }),
      onClicked: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onClosed: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },

    // Action API (extension button)
    action: {
      setBadgeText: vi.fn((details, callback) => {
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      setBadgeBackgroundColor: vi.fn((details, callback) => {
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      setTitle: vi.fn((details, callback) => {
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      setIcon: vi.fn((details, callback) => {
        if (callback) {
          setTimeout(callback, 0);
        }
        return Promise.resolve();
      }),
      onClicked: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      openPopup: vi.fn(() => Promise.resolve()),
    },

    // Permissions API
    permissions: {
      contains: vi.fn((permissions, callback) => {
        const result = true; // Assume all permissions granted for testing
        if (callback) {
          setTimeout(() => callback(result), 0);
        }
        return Promise.resolve(result);
      }),
      request: vi.fn((permissions, callback) => {
        const result = true;
        if (callback) {
          setTimeout(() => callback(result), 0);
        }
        return Promise.resolve(result);
      }),
    },

    // Utility methods for testing
    _reset: () => {
      storageData.clear();
      storageListeners.length = 0;
      vi.clearAllMocks();
    },

    _triggerCommand: (command) => {
      if (mockChrome._commandListeners) {
        mockChrome._commandListeners.forEach(listener => listener(command));
      }
    },

    _triggerInstalled: (details = { reason: 'install' }) => {
      if (mockChrome._installedListeners) {
        mockChrome._installedListeners.forEach(listener => listener(details));
      }
    },

    _triggerMessage: (message, sender = {}, sendResponse) => {
      if (mockChrome._messageListeners) {
        mockChrome._messageListeners.forEach(listener => {
          const response = listener(message, sender, sendResponse || vi.fn());
          return response;
        });
      }
    },

    _getStorageData: () => new Map(storageData),
    _setStorageData: (key, value) => {
      const oldValue = storageData.get(key);
      storageData.set(key, value);
      const changes = { [key]: { oldValue, newValue: value } };
      storageListeners.forEach(listener => {
        setTimeout(() => listener(changes, 'sync'), 0);
      });
    },
  };

  return mockChrome;
}

/**
 * Create a mock error handler for testing
 * @returns {Object} Mock error handler with spied methods
 */
export function createMockErrorHandler() {
  return {
    handle: vi.fn((error, context) => {
      console.debug(`Mock error handler: [${context}] ${error.message}`);
    }),
    createError: vi.fn((message, context) => {
      const error = new Error(message);
      error.context = context;
      error.timestamp = new Date().toISOString();
      return error;
    }),
    showErrorNotification: vi.fn(),
    getUserMessage: vi.fn((error, context) => {
      return `Mock error message for: ${error.message}`;
    }),
  };
}

/**
 * Helper to create dependency mocks for testing
 * @param {Object} overrides - Optional overrides for dependencies
 * @returns {Object} Object containing mocks for dependency injection
 */
export function createTestDependencies(overrides = {}) {
  const chromeMock = overrides.chrome || createEnhancedChromeMock();
  const errorHandlerMock = overrides.errorHandler || createMockErrorHandler();
  
  return {
    chromeMock,
    errorHandlerMock,
    cleanup: () => {
      chromeMock._reset();
      vi.clearAllMocks();
    }
  };
}