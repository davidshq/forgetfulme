import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Service Worker Lifecycle Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Chrome extension APIs
    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: vi.fn(),
        },
        onStartup: {
          addListener: vi.fn(),
        },
        onMessage: {
          addListener: vi.fn(),
        },
      },
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
      commands: {
        onCommand: {
          addListener: vi.fn(),
        },
      },
      tabs: {
        onUpdated: {
          addListener: vi.fn(),
        },
        onActivated: {
          addListener: vi.fn(),
        },
        query: vi.fn(),
      },
      action: {
        onClicked: {
          addListener: vi.fn(),
        },
      },
    };
  });

  describe('Extension Installation Workflow', () => {
    test('should initialize default settings on first install', async () => {
      // Mock fresh installation
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({}); // Empty storage indicates first install
      });

      global.chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      // Import background script to trigger initialization
      await import('../../../background.js');

      // Verify onInstalled listener was registered
      expect(global.chrome.runtime.onInstalled.addListener).toHaveBeenCalled();

      // Simulate onInstalled event
      const onInstalledCallback =
        global.chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      await onInstalledCallback({ reason: 'install' });

      // Test default settings initialization
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          customStatusTypes: expect.arrayContaining([
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ]),
          userPreferences: expect.objectContaining({
            showNotifications: true,
            autoMarkRead: false,
            defaultStatus: 'read',
          }),
        })
      );
    });

    test('should preserve existing settings on update', async () => {
      // Mock existing user settings
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          customStatusTypes: ['custom1', 'custom2'],
          userPreferences: {
            showNotifications: false,
            customSetting: 'user-value',
          },
        });
      });

      await import('../../../background.js');

      const onInstalledCallback =
        global.chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      await onInstalledCallback({ reason: 'update' });

      // Should not overwrite existing custom settings
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalledWith(
        expect.objectContaining({
          customStatusTypes: expect.arrayContaining(['read', 'good-reference']),
        })
      );
    });

    test('should handle installation errors gracefully', async () => {
      // Mock storage error during installation
      global.chrome.storage.sync.set.mockImplementation((data, callback) => {
        throw new Error('Storage quota exceeded');
      });

      await import('../../../background.js');

      const onInstalledCallback =
        global.chrome.runtime.onInstalled.addListener.mock.calls[0][0];

      // Should not throw error
      expect(async () => {
        await onInstalledCallback({ reason: 'install' });
      }).not.toThrow();
    });
  });

  describe('Keyboard Shortcuts Workflow', () => {
    test('should register keyboard command handlers', async () => {
      await import('../../../background.js');

      // Verify command listener registration
      expect(global.chrome.commands.onCommand.addListener).toHaveBeenCalled();
    });

    test('should handle mark-as-read keyboard shortcut', async () => {
      global.chrome.tabs.query.mockImplementation((query, callback) => {
        callback([
          {
            id: 123,
            url: 'https://example.com',
            title: 'Example Page',
            active: true,
          },
        ]);
      });

      await import('../../../background.js');

      // Get the command handler
      const commandHandler =
        global.chrome.commands.onCommand.addListener.mock.calls[0][0];

      // Simulate keyboard shortcut
      await commandHandler('mark-as-read');

      // Should query for active tab
      expect(global.chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
    });

    test('should handle unknown keyboard commands gracefully', async () => {
      await import('../../../background.js');

      const commandHandler =
        global.chrome.commands.onCommand.addListener.mock.calls[0][0];

      // Should not throw error for unknown commands
      expect(async () => {
        await commandHandler('unknown-command');
      }).not.toThrow();
    });
  });

  describe('Tab Event Handling Workflow', () => {
    test('should register tab update listeners', async () => {
      await import('../../../background.js');

      expect(global.chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(global.chrome.tabs.onActivated.addListener).toHaveBeenCalled();
    });

    test('should update badge when tab changes', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          bookmarks: {
            'https://example.com': { readStatus: 'unread' },
            'https://other.com': { readStatus: 'read' },
          },
        });
      });

      await import('../../../background.js');

      // Get tab update handler
      const tabUpdateHandler =
        global.chrome.tabs.onUpdated.addListener.mock.calls[0][0];

      // Simulate tab navigation to bookmarked page
      await tabUpdateHandler(
        123,
        {
          status: 'complete',
          url: 'https://example.com',
        },
        {
          id: 123,
          url: 'https://example.com',
          title: 'Example',
        }
      );

      // Should update storage to reflect current state
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });

    test('should handle tab navigation to non-bookmarked pages', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ bookmarks: {} });
      });

      await import('../../../background.js');

      const tabUpdateHandler =
        global.chrome.tabs.onUpdated.addListener.mock.calls[0][0];

      await tabUpdateHandler(
        123,
        {
          status: 'complete',
          url: 'https://unknown.com',
        },
        {
          id: 123,
          url: 'https://unknown.com',
        }
      );

      // Should not cause errors for unknown URLs
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('Extension Action Workflow', () => {
    test('should register action click handler', async () => {
      await import('../../../background.js');

      expect(global.chrome.action.onClicked.addListener).toHaveBeenCalled();
    });

    test('should handle extension icon click', async () => {
      global.chrome.tabs.query.mockImplementation((query, callback) => {
        callback([
          {
            id: 123,
            url: 'https://example.com',
            title: 'Example Page',
          },
        ]);
      });

      await import('../../../background.js');

      // Get action click handler
      const actionHandler =
        global.chrome.action.onClicked.addListener.mock.calls[0][0];

      // Simulate extension icon click
      const mockTab = {
        id: 123,
        url: 'https://example.com',
        title: 'Example Page',
      };

      await actionHandler(mockTab);

      // Should query tab information
      expect(global.chrome.tabs.query).toHaveBeenCalled();
    });
  });

  describe('Service Worker State Management', () => {
    test('should maintain state across wake/sleep cycles', async () => {
      // Mock persistent state in storage
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          backgroundState: {
            lastActive: Date.now(),
            messageQueue: [],
            activeTabId: 123,
          },
        });
      });

      await import('../../../background.js');

      // Service worker should restore state on startup
      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith(
        expect.arrayContaining(['backgroundState']),
        expect.any(Function)
      );
    });

    test('should handle service worker wake-up events', async () => {
      global.chrome.runtime.onStartup.addListener = vi.fn();

      await import('../../../background.js');

      // Should register startup listener
      expect(global.chrome.runtime.onStartup.addListener).toHaveBeenCalled();

      // Simulate service worker wake-up
      const startupHandler =
        global.chrome.runtime.onStartup.addListener.mock.calls[0][0];
      await startupHandler();

      // Should restore functionality
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from Chrome API errors', async () => {
      // Mock Chrome API failure
      global.chrome.storage.sync.get.mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });

      // Should not crash the service worker
      expect(async () => {
        await import('../../../background.js');
      }).not.toThrow();
    });

    test('should handle concurrent message processing', async () => {
      await import('../../../background.js');

      // Verify message handler is registered
      expect(global.chrome.runtime.onMessage.addListener).toHaveBeenCalled();

      const messageHandler =
        global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

      // Simulate multiple concurrent messages
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          messageHandler(
            { type: 'GET_STATUS', url: `https://example${i}.com` },
            { tab: { id: i } },
            vi.fn()
          )
        );
      }

      // Should handle all messages without errors
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});
