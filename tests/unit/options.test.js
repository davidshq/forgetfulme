/**
 * @fileoverview Unit tests for ForgetfulMe options page
 * @module tests/unit/options
 * @description Tests for the options page functionality including bookmark management
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ForgetfulMeOptions from '../../options.js';

// Mock Chrome API
global.chrome = {
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    getURL: vi.fn((url) => `chrome-extension://test/${url}`),
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
};

// Mock DOM elements
const mockAppContainer = {
  innerHTML: '',
  appendChild: vi.fn(),
};

// Mock UIComponents
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      ready: vi.fn().mockResolvedValue(),
      getElement: vi.fn((id) => {
        if (id === 'app') return mockAppContainer;
        return null;
      }),
      getValue: vi.fn(),
      setValue: vi.fn(),
    },
    createContainer: vi.fn().mockReturnValue(document.createElement('div')),
    createSection: vi.fn().mockReturnValue(document.createElement('section')),
    createButton: vi.fn().mockReturnValue(document.createElement('button')),
    createList: vi.fn().mockReturnValue(document.createElement('ul')),
    createForm: vi.fn().mockReturnValue(document.createElement('form')),
    createFormField: vi.fn().mockReturnValue(document.createElement('input')),
    createGrid: vi.fn().mockReturnValue(document.createElement('div')),
    createListItem: vi.fn().mockReturnValue(document.createElement('li')),
  },
}));

// Mock other dependencies
vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn().mockReturnValue({
      userMessage: 'Test error',
      shouldShowToUser: true,
    }),
  },
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('../../utils/config-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    getCustomStatusTypes: vi.fn().mockResolvedValue([]),
    addCustomStatusType: vi.fn().mockResolvedValue(),
    removeCustomStatusType: vi.fn().mockResolvedValue(),
  })),
}));

vi.mock('../../utils/bookmark-transformer.js', () => ({
  default: {
    toUIFormat: vi.fn(),
  },
}));

vi.mock('../../supabase-config.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    isConfigured: vi.fn().mockResolvedValue(true),
    session: null,
  })),
}));

vi.mock('../../supabase-service.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    getBookmarks: vi.fn().mockResolvedValue([]),
    exportData: vi.fn().mockResolvedValue({}),
    importData: vi.fn().mockResolvedValue(),
    deleteBookmark: vi.fn().mockResolvedValue(),
  })),
}));

vi.mock('../../auth-ui.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    showLoginForm: vi.fn(),
  })),
}));

vi.mock('../../utils/auth-state-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    addListener: vi.fn(),
    setAuthState: vi.fn(),
  })),
}));

vi.mock('../../config-ui.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    showConfigForm: vi.fn(),
    showConfigStatus: vi.fn(),
  })),
}));

describe('ForgetfulMeOptions', () => {
  let options;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock document.createElement
    document.createElement = vi.fn((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        appendChild: vi.fn(),
        addEventListener: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
        style: {},
        className: '',
        id: '',
        textContent: '',
        value: '',
        click: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };
      
      return element;
    });

    // Mock document.getElementById
    document.getElementById = vi.fn((id) => {
      if (id === 'app') return mockAppContainer;
      return null;
    });

    // Create options instance
    options = new ForgetfulMeOptions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openBookmarkManagement', () => {
    it('should open bookmark management in a new tab', () => {
      // Call the method
      options.openBookmarkManagement();

      // Verify chrome.tabs.create was called with correct URL
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/bookmark-management.html'
      });
    });

    it('should use chrome.runtime.getURL to get the correct URL', () => {
      // Call the method
      options.openBookmarkManagement();

      // Verify chrome.runtime.getURL was called
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('bookmark-management.html');
    });
  });



  describe('loadData', () => {
    it('should load data without recent entries', async () => {
      // Mock the necessary methods
      options.supabaseService = {
        getBookmarks: vi.fn().mockResolvedValue([]),
      };
      options.configManager = {
        initialize: vi.fn().mockResolvedValue(),
        getCustomStatusTypes: vi.fn().mockResolvedValue([]),
      };

      // Call the method
      await options.loadData();

      // Verify the data loading methods were called
      expect(options.supabaseService.getBookmarks).toHaveBeenCalled();
      expect(options.configManager.getCustomStatusTypes).toHaveBeenCalled();
    });
  });
}); 