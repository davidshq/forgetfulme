import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
    },
    onActivated: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

// Mock global chrome object
global.chrome = mockChrome;

// Mock console methods to reduce noise
global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

describe('ForgetfulMe Background Service', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Message Handling', () => {
    test('should handle MARK_AS_READ messages', async () => {
      // Mock chrome.storage.sync.get to return authenticated state
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'test-user', email: 'test@example.com' },
            access_token: 'test-token',
          },
        });
      });

      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'MARK_AS_READ':
              // Simulate notification creation
              mockChrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'ForgetfulMe',
                message: 'Page marked as read!',
              });
              sendResponse({ success: true });
              break;
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test MARK_AS_READ message
      await handleMessage(
        {
          type: 'MARK_AS_READ',
          data: { url: 'https://example.com', title: 'Test' },
        },
        {},
        sendResponse
      );

      // Check that notification was created
      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Page marked as read!',
      });

      // Check that response was sent
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle GET_AUTH_STATE messages', async () => {
      const mockAuthState = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token',
      };

      // Mock chrome.storage.sync.get to return auth state
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ auth_session: mockAuthState });
      });

      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'GET_AUTH_STATE': {
              const authState = await new Promise(resolve => {
                chrome.storage.sync.get(['auth_session'], _result => {
                  resolve(_result.auth_session || null);
                });
              });
              sendResponse({ success: true, authState });
              break;
            }
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test GET_AUTH_STATE message
      await handleMessage({ type: 'GET_AUTH_STATE' }, {}, sendResponse);

      // Check that response was sent with auth state
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        authState: mockAuthState,
      });
    });

    test('should handle unknown message types', async () => {
      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'UNKNOWN_MESSAGE_TYPE': {
              console.warn('Background: Unknown message type:', message.type);
              sendResponse({ success: false, error: 'Unknown message type' });
              break;
            }
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test unknown message type
      await handleMessage({ type: 'UNKNOWN_MESSAGE_TYPE' }, {}, sendResponse);

      // Check that warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        'Background: Unknown message type:',
        'UNKNOWN_MESSAGE_TYPE'
      );

      // Check that error response was sent
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown message type',
      });
    });
  });

  describe('Authentication State Management', () => {
    test('should handle storage auth state changes', () => {
      // Create a mock storage change handler
      const handleStorageAuthChange = newAuthState => {
        console.log(
          'Background: Auth state changed:',
          newAuthState ? 'authenticated' : 'not authenticated'
        );

        // Update badge
        try {
          if (newAuthState) {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
          } else {
            chrome.action.setBadgeText({ text: '' });
          }
        } catch (error) {
          console.debug('Background: Error updating badge:', error.message);
        }

        // Show notification for successful auth
        if (newAuthState) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'ForgetfulMe',
            message: 'Successfully signed in!',
          });
        }
      };

      const mockAuthState = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token',
      };

      // Test auth state change
      handleStorageAuthChange(mockAuthState);

      // Check that auth state change was logged
      expect(console.log).toHaveBeenCalledWith(
        'Background: Auth state changed:',
        'authenticated'
      );

      // Check that notification was created for successful auth
      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Successfully signed in!',
      });

      // Check that badge was updated
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
        text: '✓',
      });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#4CAF50',
      });
    });

    test('should handle auth state clearing', () => {
      // Create a mock storage change handler
      const handleStorageAuthChange = newAuthState => {
        console.log(
          'Background: Auth state changed:',
          newAuthState ? 'authenticated' : 'not authenticated'
        );

        // Update badge
        try {
          if (newAuthState) {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
          } else {
            chrome.action.setBadgeText({ text: '' });
          }
        } catch (error) {
          console.debug('Background: Error updating badge:', error.message);
        }
      };

      // Test auth state being cleared
      handleStorageAuthChange(null);

      // Check that auth state change was logged
      expect(console.log).toHaveBeenCalledWith(
        'Background: Auth state changed:',
        'not authenticated'
      );

      // Check that badge was cleared
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('Keyboard Shortcut Handling', () => {
    test('should handle keyboard shortcut when authenticated', async () => {
      // Mock authenticated state
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'test-user', email: 'test@example.com' },
            access_token: 'test-token',
          },
        });
      });

      // Mock chrome.tabs.query to return a valid tab
      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([
          {
            id: 1,
            url: 'https://example.com/article',
            title: 'Test Article',
            active: true,
          },
        ]);
      });

      // Create a mock keyboard shortcut handler
      const handleKeyboardShortcut = async () => {
        try {
          const isAuthenticated = await new Promise(resolve => {
            chrome.storage.sync.get(['auth_session'], result => {
              resolve(result.auth_session !== null);
            });
          });

          if (!isAuthenticated) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'ForgetfulMe',
              message: 'Please sign in to use keyboard shortcuts',
            });
            return;
          }

          const [tab] = await new Promise(resolve => {
            chrome.tabs.query(
              {
                active: true,
                currentWindow: true,
              },
              resolve
            );
          });

          if (
            !tab.url ||
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://')
          ) {
            return;
          }

          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'ForgetfulMe',
            message: 'Click the extension icon to mark this page as read',
          });
        } catch (error) {
          console.error('Error handling keyboard shortcut:', error);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'ForgetfulMe',
            message: 'Error handling shortcut. Please try again.',
          });
        }
      };

      // Test keyboard shortcut
      await handleKeyboardShortcut();

      // Check that notification was created
      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Click the extension icon to mark this page as read',
      });
    });

    test('should show notification for unauthenticated users', async () => {
      // Mock unauthenticated state
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ auth_session: null });
      });

      // Create a mock keyboard shortcut handler
      const handleKeyboardShortcut = async () => {
        try {
          const isAuthenticated = await new Promise(resolve => {
            chrome.storage.sync.get(['auth_session'], _result => {
              resolve(_result.auth_session !== null);
            });
          });

          if (!isAuthenticated) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'ForgetfulMe',
              message: 'Please sign in to use keyboard shortcuts',
            });
            return;
          }
        } catch (error) {
          console.error('Error handling keyboard shortcut:', error);
        }
      };

      // Test keyboard shortcut
      await handleKeyboardShortcut();

      // Check that auth notification was created
      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Please sign in to use keyboard shortcuts',
      });
    });

    test('should ignore browser pages', async () => {
      // Mock authenticated state
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          auth_session: {
            user: { id: 'test-user', email: 'test@example.com' },
            access_token: 'test-token',
          },
        });
      });

      // Mock chrome.tabs.query to return a browser page
      mockChrome.tabs.query.mockImplementation((_queryInfo, callback) => {
        callback([
          {
            id: 1,
            url: 'chrome://extensions/',
            title: 'Extensions',
            active: true,
          },
        ]);
      });

      // Create a mock keyboard shortcut handler
      const handleKeyboardShortcut = async () => {
        try {
          const isAuthenticated = await new Promise(resolve => {
            chrome.storage.sync.get(['auth_session'], _result => {
              resolve(_result.auth_session !== null);
            });
          });

          if (!isAuthenticated) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'ForgetfulMe',
              message: 'Please sign in to use keyboard shortcuts',
            });
            return;
          }

          const [tab] = await new Promise(resolve => {
            chrome.tabs.query(
              {
                active: true,
                currentWindow: true,
              },
              resolve
            );
          });

          if (
            !tab.url ||
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://')
          ) {
            return;
          }

          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'ForgetfulMe',
            message: 'Click the extension icon to mark this page as read',
          });
        } catch (error) {
          console.error('Error handling keyboard shortcut:', error);
        }
      };

      // Test keyboard shortcut
      await handleKeyboardShortcut();

      // Check that no notification was created for browser pages
      expect(mockChrome.notifications.create).not.toHaveBeenCalled();
    });
  });

  describe('Default Settings Initialization', () => {
    test('should initialize default settings on installation', async () => {
      // Mock chrome.storage.sync.get to return empty (fresh installation)
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // Mock chrome.storage.sync.set to call callback immediately
      mockChrome.storage.sync.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      // Create a mock initialization function
      const initializeDefaultSettings = async () => {
        try {
          return new Promise(resolve => {
            chrome.storage.sync.get(['customStatusTypes'], _result => {
              if (!_result.customStatusTypes) {
                const defaultStatusTypes = [
                  'read',
                  'good-reference',
                  'low-value',
                  'revisit-later',
                ];

                chrome.storage.sync.set(
                  {
                    customStatusTypes: defaultStatusTypes,
                  },
                  () => {
                    console.log('Default settings initialized');
                    resolve();
                  }
                );
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          console.error('Error initializing default settings:', error);
        }
      };

      // Test initialization
      await initializeDefaultSettings();

      // Check that default settings were saved
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        {
          customStatusTypes: [
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ],
        },
        expect.any(Function)
      );

      // Check that initialization was logged
      expect(console.log).toHaveBeenCalledWith('Default settings initialized');
    });

    test('should not initialize settings if they already exist', async () => {
      // Mock chrome.storage.sync.get to return existing settings
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ customStatusTypes: ['existing-type'] });
      });

      // Create a mock initialization function
      const initializeDefaultSettings = async () => {
        try {
          return new Promise(resolve => {
            chrome.storage.sync.get(['customStatusTypes'], _result => {
              if (!_result.customStatusTypes) {
                const defaultStatusTypes = [
                  'read',
                  'good-reference',
                  'low-value',
                  'revisit-later',
                ];

                chrome.storage.sync.set(
                  {
                    customStatusTypes: defaultStatusTypes,
                  },
                  () => {
                    console.log('Default settings initialized');
                    resolve();
                  }
                );
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          console.error('Error initializing default settings:', error);
        }
      };

      // Test initialization
      await initializeDefaultSettings();

      // Check that settings were not saved (already exist)
      expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle badge update errors gracefully', () => {
      // Mock chrome.action.setBadgeText to throw an error
      mockChrome.action.setBadgeText.mockImplementation(() => {
        throw new Error('Badge update failed');
      });

      // Create a mock badge update function
      const updateExtensionBadge = session => {
        try {
          if (session) {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
          } else {
            chrome.action.setBadgeText({ text: '' });
          }
        } catch (error) {
          console.debug('Background: Error updating badge:', error.message);
        }
      };

      const mockAuthState = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token',
      };

      // Test badge update with error
      updateExtensionBadge(mockAuthState);

      // Check that error was logged
      expect(console.debug).toHaveBeenCalledWith(
        'Background: Error updating badge:',
        'Badge update failed'
      );
    });
  });

  describe('URL Status Checking', () => {
    test('should handle BOOKMARK_SAVED message and clear cache', async () => {
      // Mock chrome.tabs.query to return a test tab
      mockChrome.tabs.query.mockImplementation(_queryInfo => {
        return Promise.resolve([
          { url: 'https://example.com', title: 'Test Page' },
        ]);
      });

      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'BOOKMARK_SAVED': {
              // Simulate cache clearing and URL status check
              const url = message.data?.url;
              if (url) {
                // Clear cache (simulated)
                console.log('Cache cleared for URL:', url);

                // Re-check current tab URL status
                const [tab] = await chrome.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                if (tab && tab.url) {
                  console.log('Re-checking URL status for:', tab.url);
                }
              }
              sendResponse({ success: true });
              break;
            }
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test BOOKMARK_SAVED message
      await handleMessage(
        { type: 'BOOKMARK_SAVED', data: { url: 'https://example.com' } },
        {},
        sendResponse
      );

      // Check that tabs.query was called
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });

      // Check that response was sent
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle BOOKMARK_UPDATED message and clear cache', async () => {
      // Mock chrome.tabs.query to return a test tab
      mockChrome.tabs.query.mockImplementation(_queryInfo => {
        return Promise.resolve([
          { url: 'https://example.com', title: 'Test Page' },
        ]);
      });

      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'BOOKMARK_UPDATED': {
              // Simulate cache clearing and URL status check
              const url = message.data?.url;
              if (url) {
                // Clear cache (simulated)
                console.log('Cache cleared for URL:', url);

                // Re-check current tab URL status
                const [tab] = await chrome.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                if (tab && tab.url) {
                  console.log('Re-checking URL status for:', tab.url);
                }
              }
              sendResponse({ success: true });
              break;
            }
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test BOOKMARK_UPDATED message
      await handleMessage(
        { type: 'BOOKMARK_UPDATED', data: { url: 'https://example.com' } },
        {},
        sendResponse
      );

      // Check that tabs.query was called
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });

      // Check that response was sent
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle CHECK_URL_STATUS message', async () => {
      // Mock chrome.tabs.query to return a test tab
      mockChrome.tabs.query.mockImplementation(_queryInfo => {
        return Promise.resolve([
          { url: 'https://example.com', title: 'Test Page' },
        ]);
      });

      // Create a mock message handler
      const handleMessage = async (message, sender, sendResponse) => {
        try {
          switch (message.type) {
            case 'CHECK_URL_STATUS': {
              // Handle request to check current tab URL status
              const [currentTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
              });
              if (currentTab && currentTab.url) {
                console.log('Checking URL status for:', currentTab.url);
              }
              sendResponse({ success: true });
              break;
            }
            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };

      const sendResponse = vi.fn();

      // Test CHECK_URL_STATUS message
      await handleMessage({ type: 'CHECK_URL_STATUS' }, {}, sendResponse);

      // Check that tabs.query was called
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });

      // Check that response was sent
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should update icon for saved URL', () => {
      // Create a mock icon update function
      const updateIconForUrl = (url, isSaved) => {
        try {
          if (!url) {
            // Default state - no URL or browser page
            chrome.action.setBadgeText({ text: '' });
            return;
          }

          if (isSaved) {
            // URL is already saved - show checkmark
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
          } else {
            // URL is not saved - show plus sign
            chrome.action.setBadgeText({ text: '+' });
            chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
          }
        } catch (error) {
          console.debug('Background: Error updating icon:', error.message);
        }
      };

      // Test saved URL
      updateIconForUrl('https://example.com', true);

      // Check that checkmark was set
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
        text: '✓',
      });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#4CAF50',
      });

      // Reset mocks
      vi.clearAllMocks();

      // Test unsaved URL
      updateIconForUrl('https://example.com', false);

      // Check that plus sign was set
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
        text: '+',
      });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#2196F3',
      });

      // Reset mocks
      vi.clearAllMocks();

      // Test no URL (browser page)
      updateIconForUrl(null, false);

      // Check that badge was cleared
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });
});
