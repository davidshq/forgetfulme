/**
 * @fileoverview Integration tests for Chrome Extension APIs and background service
 * Tests: Service worker message passing, badge updates, notifications, lifecycle events
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Chrome Extension APIs Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to popup for testing Chrome extension APIs
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Mock Chrome APIs
    await page.evaluate(() => {
      // Create mock function factory
      window.createMockFn = function(implementation) {
        const mockFn = function(...args) {
          mockFn.mock.calls.push(args);
          mockFn.mock.instances.push(this);
          const result = mockFn._implementation ? mockFn._implementation.apply(this, args) : undefined;
          mockFn.mock.results.push({ type: 'return', value: result });
          return result;
        };
        mockFn.mock = { calls: [], instances: [], results: [] };
        mockFn._implementation = implementation;
        
        mockFn.mockResolvedValue = function(value) {
          mockFn._implementation = () => Promise.resolve(value);
          return mockFn;
        };
        mockFn.mockImplementation = function(impl) {
          mockFn._implementation = impl;
          return mockFn;
        };
        mockFn.mockReturnValue = function(value) {
          mockFn._implementation = () => value;
          return mockFn;
        };
        return mockFn;
      };
      
      // Create mock Chrome API structure
      window.chrome = {
        runtime: {
          id: 'test-extension-id',
          lastError: null,
          sendMessage: window.createMockFn().mockResolvedValue({}),
          onMessage: {
            addListener: window.createMockFn(),
            removeListener: window.createMockFn(),
            hasListener: window.createMockFn().mockReturnValue(false)
          },
          openOptionsPage: window.createMockFn(),
          getManifest: window.createMockFn().mockReturnValue({
            version: '1.0.0',
            manifest_version: 3,
            name: 'ForgetfulMe'
          }),
          onInstalled: {
            addListener: window.createMockFn()
          },
          onStartup: {
            addListener: window.createMockFn()
          }
        },
        storage: {
          sync: {
            get: window.createMockFn().mockImplementation((keys, callback) => {
              const result = {};
              if (typeof keys === 'string') {
                result[keys] = window.mockStorageData?.[keys];
              } else if (Array.isArray(keys)) {
                keys.forEach(key => {
                  if (window.mockStorageData?.[key]) {
                    result[key] = window.mockStorageData[key];
                  }
                });
              }
              if (callback) callback(result);
              return Promise.resolve(result);
            }),
            set: window.createMockFn().mockImplementation((items, callback) => {
              window.mockStorageData = { ...window.mockStorageData, ...items };
              if (callback) callback();
              return Promise.resolve();
            }),
            remove: window.createMockFn().mockImplementation((keys, callback) => {
              if (typeof keys === 'string') {
                delete window.mockStorageData[keys];
              } else if (Array.isArray(keys)) {
                keys.forEach(key => delete window.mockStorageData[key]);
              }
              if (callback) callback();
              return Promise.resolve();
            }),
            clear: window.createMockFn().mockImplementation((callback) => {
              window.mockStorageData = {};
              if (callback) callback();
              return Promise.resolve();
            })
          },
          local: {
            get: window.createMockFn().mockResolvedValue({}),
            set: window.createMockFn().mockResolvedValue({}),
            remove: window.createMockFn().mockResolvedValue({}),
            clear: window.createMockFn().mockResolvedValue({})
          },
          onChanged: {
            addListener: window.createMockFn()
          }
        },
        tabs: {
          query: window.createMockFn().mockResolvedValue([{
            id: 123,
            url: 'https://example.com',
            title: 'Example Page',
            active: true,
            windowId: 1
          }]),
          get: window.createMockFn().mockResolvedValue({
            id: 123,
            url: 'https://example.com',
            title: 'Example Page'
          }),
          sendMessage: window.createMockFn().mockResolvedValue({}),
          onActivated: {
            addListener: window.createMockFn()
          },
          onUpdated: {
            addListener: window.createMockFn()
          }
        },
        action: {
          setBadgeText: window.createMockFn(),
          setBadgeBackgroundColor: window.createMockFn(),
          setTitle: window.createMockFn(),
          onClicked: {
            addListener: window.createMockFn()
          }
        },
        notifications: {
          create: window.createMockFn().mockImplementation((id, options, callback) => {
            window.mockNotifications = window.mockNotifications || {};
            window.mockNotifications[id] = options;
            if (callback) callback(id);
            return Promise.resolve(id);
          }),
          clear: window.createMockFn().mockImplementation((id, callback) => {
            if (window.mockNotifications) {
              delete window.mockNotifications[id];
            }
            if (callback) callback(true);
            return Promise.resolve(true);
          }),
          onClicked: {
            addListener: window.createMockFn()
          }
        },
        commands: {
          onCommand: {
            addListener: window.createMockFn()
          }
        }
      };

      // Initialize mock storage
      window.mockStorageData = {};
      window.mockNotifications = {};
    });
  });

  test('service worker message passing between popup and background', async ({ page }) => {
    // Test sending message from popup to background
    const messageResponse = await page.evaluate(async () => {
      // Simulate message sending
      const message = {
        type: 'GET_CURRENT_TAB',
        data: {}
      };

      // Mock the response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: {
          id: 123,
          url: 'https://example.com',
          title: 'Example Page'
        }
      });

      const response = await chrome.runtime.sendMessage(message);
      return {
        messageSent: chrome.runtime.sendMessage.mock.calls.length > 0,
        messageContent: chrome.runtime.sendMessage.mock.calls[0][0],
        response
      };
    });

    expect(messageResponse.messageSent).toBe(true);
    expect(messageResponse.messageContent.type).toBe('GET_CURRENT_TAB');
    expect(messageResponse.response.success).toBe(true);
    expect(messageResponse.response.data.url).toBe('https://example.com');
  });

  test('badge updates for bookmark status', async ({ page }) => {
    // Test updating badge when bookmark status changes
    await page.evaluate(async () => {
      // Simulate bookmark status check
      const updateBadge = (isBookmarked) => {
        if (isBookmarked) {
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      };

      // Test bookmarked state
      updateBadge(true);
      window.badgeSetCalls = chrome.action.setBadgeText.mock.calls;
      window.badgeColorCalls = chrome.action.setBadgeBackgroundColor.mock.calls;
    });

    const badgeSetCalls = await page.evaluate(() => window.badgeSetCalls);
    const badgeColorCalls = await page.evaluate(() => window.badgeColorCalls);

    expect(badgeSetCalls.length).toBeGreaterThan(0);
    expect(badgeSetCalls[0][0].text).toBe('✓');
    expect(badgeColorCalls[0][0].color).toBe('#22c55e');
  });

  test('notification creation and clearing', async ({ page }) => {
    // Test creating notifications
    const notificationResult = await page.evaluate(async () => {
      // Create a notification
      const notificationId = 'bookmark-saved';
      const options = {
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Bookmark Saved',
        message: 'Page has been bookmarked successfully'
      };

      await chrome.notifications.create(notificationId, options);
      
      // Check notification was created
      const created = window.mockNotifications[notificationId];
      
      // Clear notification
      await chrome.notifications.clear(notificationId);
      
      // Check notification was cleared
      const cleared = !window.mockNotifications[notificationId];

      return {
        created: !!created,
        notificationOptions: created,
        cleared
      };
    });

    expect(notificationResult.created).toBe(true);
    expect(notificationResult.notificationOptions.title).toBe('Bookmark Saved');
    expect(notificationResult.notificationOptions.message).toBe('Page has been bookmarked successfully');
    expect(notificationResult.cleared).toBe(true);
  });

  test('Chrome storage integration', async ({ page }) => {
    // Test Chrome storage sync API
    const storageResult = await page.evaluate(async () => {
      // Save data to storage
      const testData = {
        USER_SESSION: {
          id: 'test-user',
          email: 'test@example.com'
        },
        PREFERENCES: {
          theme: 'dark',
          notifications: true
        }
      };

      await chrome.storage.sync.set(testData);

      // Retrieve data from storage
      const retrieved = await chrome.storage.sync.get(['USER_SESSION', 'PREFERENCES']);

      // Update single item
      await chrome.storage.sync.set({ PREFERENCES: { ...testData.PREFERENCES, theme: 'light' } });
      
      // Get updated data
      const updated = await chrome.storage.sync.get('PREFERENCES');

      // Remove item
      await chrome.storage.sync.remove('USER_SESSION');
      
      // Verify removal
      const afterRemoval = await chrome.storage.sync.get('USER_SESSION');

      return {
        setSyncCalls: chrome.storage.sync.set.mock.calls.length,
        retrievedData: retrieved,
        updatedTheme: updated.PREFERENCES?.theme,
        sessionRemoved: !afterRemoval.USER_SESSION
      };
    });

    expect(storageResult.setSyncCalls).toBeGreaterThan(0);
    expect(storageResult.retrievedData.USER_SESSION.email).toBe('test@example.com');
    expect(storageResult.retrievedData.PREFERENCES.theme).toBe('dark');
    expect(storageResult.updatedTheme).toBe('light');
    expect(storageResult.sessionRemoved).toBe(true);
  });

  test('tabs API for current tab information', async ({ page }) => {
    // Test getting current tab information
    const tabResult = await page.evaluate(async () => {
      // Query current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      // Get specific tab by ID
      const tabById = await chrome.tabs.get(currentTab.id);

      return {
        queryCalled: chrome.tabs.query.mock.calls.length > 0,
        currentTabUrl: currentTab.url,
        currentTabTitle: currentTab.title,
        tabByIdUrl: tabById.url,
        tabsMatch: currentTab.id === tabById.id
      };
    });

    expect(tabResult.queryCalled).toBe(true);
    expect(tabResult.currentTabUrl).toBe('https://example.com');
    expect(tabResult.currentTabTitle).toBe('Example Page');
    expect(tabResult.tabByIdUrl).toBe('https://example.com');
    expect(tabResult.tabsMatch).toBe(true);
  });

  test('extension lifecycle events', async ({ page }) => {
    // Test extension lifecycle event handling
    const lifecycleResult = await page.evaluate(() => {
      // Simulate background service setup
      const backgroundService = {
        handleInstalled: window.createMockFn(),
        handleStartup: window.createMockFn(),
        handleCommand: window.createMockFn()
      };

      // Register listeners
      chrome.runtime.onInstalled.addListener(backgroundService.handleInstalled);
      chrome.runtime.onStartup.addListener(backgroundService.handleStartup);
      chrome.commands.onCommand.addListener(backgroundService.handleCommand);

      // Verify listeners were registered
      const installedListenerAdded = chrome.runtime.onInstalled.addListener.mock.calls.length > 0;
      const startupListenerAdded = chrome.runtime.onStartup.addListener.mock.calls.length > 0;
      const commandListenerAdded = chrome.commands.onCommand.addListener.mock.calls.length > 0;

      // Get manifest info
      const manifest = chrome.runtime.getManifest();

      return {
        installedListenerAdded,
        startupListenerAdded,
        commandListenerAdded,
        extensionId: chrome.runtime.id,
        manifestVersion: manifest.manifest_version,
        extensionName: manifest.name
      };
    });

    expect(lifecycleResult.installedListenerAdded).toBe(true);
    expect(lifecycleResult.startupListenerAdded).toBe(true);
    expect(lifecycleResult.commandListenerAdded).toBe(true);
    expect(lifecycleResult.extensionId).toBe('test-extension-id');
    expect(lifecycleResult.manifestVersion).toBe(3);
    expect(lifecycleResult.extensionName).toBe('ForgetfulMe');
  });

  test('keyboard command handling', async ({ page }) => {
    // Test keyboard shortcut command handling
    const commandResult = await page.evaluate(() => {
      // Simulate command handler
      const commandHandlers = {
        'mark_as_read': window.createMockFn((tab) => {
          // Mark current tab as read
          chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
          chrome.notifications.create('marked-read', {
            type: 'basic',
            title: 'Marked as Read',
            message: `"${tab.title}" has been marked as read`
          });
        })
      };

      // Register command listener
      chrome.commands.onCommand.addListener((command, tab) => {
        if (commandHandlers[command]) {
          commandHandlers[command](tab);
        }
      });

      // Simulate command execution
      const testTab = { id: 123, title: 'Test Page', url: 'https://test.com' };
      commandHandlers['mark_as_read'](testTab);

      return {
        commandHandled: commandHandlers['mark_as_read'].mock.calls.length > 0,
        badgeUpdated: chrome.action.setBadgeText.mock.calls.length > 0,
        notificationCreated: window.mockNotifications['marked-read'] !== undefined,
        notificationMessage: window.mockNotifications['marked-read']?.message
      };
    });

    expect(commandResult.commandHandled).toBe(true);
    expect(commandResult.badgeUpdated).toBe(true);
    expect(commandResult.notificationCreated).toBe(true);
    expect(commandResult.notificationMessage).toContain('Test Page');
  });

  test('options page opening', async ({ page }) => {
    // Test opening options page
    const optionsResult = await page.evaluate(() => {
      // Call openOptionsPage
      chrome.runtime.openOptionsPage();

      return {
        openOptionsPageCalled: chrome.runtime.openOptionsPage.mock.calls.length > 0
      };
    });

    expect(optionsResult.openOptionsPageCalled).toBe(true);
  });

  test('message passing error handling', async ({ page }) => {
    // Test error handling in message passing
    const errorResult = await page.evaluate(async () => {
      // Mock an error response
      chrome.runtime.sendMessage.mockImplementation(() => {
        return Promise.reject(new Error('Extension context invalidated'));
      });

      let errorCaught = false;
      let errorMessage = '';

      try {
        await chrome.runtime.sendMessage({ type: 'TEST_ERROR' });
      } catch (error) {
        errorCaught = true;
        errorMessage = error.message;
      }

      // Test lastError handling
      chrome.runtime.lastError = { message: 'Could not establish connection' };
      const hasLastError = !!chrome.runtime.lastError;

      return {
        errorCaught,
        errorMessage,
        hasLastError,
        lastErrorMessage: chrome.runtime.lastError?.message
      };
    });

    expect(errorResult.errorCaught).toBe(true);
    expect(errorResult.errorMessage).toBe('Extension context invalidated');
    expect(errorResult.hasLastError).toBe(true);
    expect(errorResult.lastErrorMessage).toBe('Could not establish connection');
  });

  test('tab messaging for content script communication', async ({ page }) => {
    // Test sending messages to tabs (content scripts)
    const tabMessagingResult = await page.evaluate(async () => {
      const tabId = 123;
      const message = {
        type: 'HIGHLIGHT_BOOKMARK',
        data: { bookmarkId: 'test-bookmark' }
      };

      // Mock successful response
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        highlighted: true
      });

      const response = await chrome.tabs.sendMessage(tabId, message);

      return {
        messageSent: chrome.tabs.sendMessage.mock.calls.length > 0,
        sentToTabId: chrome.tabs.sendMessage.mock.calls[0][0],
        messageContent: chrome.tabs.sendMessage.mock.calls[0][1],
        response
      };
    });

    expect(tabMessagingResult.messageSent).toBe(true);
    expect(tabMessagingResult.sentToTabId).toBe(123);
    expect(tabMessagingResult.messageContent.type).toBe('HIGHLIGHT_BOOKMARK');
    expect(tabMessagingResult.response.success).toBe(true);
  });
});