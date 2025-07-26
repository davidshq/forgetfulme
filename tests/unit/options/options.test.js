/**
 * @fileoverview Unit tests for refactored ForgetfulMe options page
 * @module tests/unit/options/options
 * @description Tests for the modular options page functionality
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ForgetfulMeOptions from '../../../options/index.js';

// Mock Chrome API
global.chrome = {
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    getURL: vi.fn(url => `chrome-extension://test/${url}`),
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

// Mock UIComponents
vi.mock('../../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      ready: vi.fn().mockResolvedValue(),
      getElement: vi.fn(id => {
        if (id === 'app') return { innerHTML: '', appendChild: vi.fn() };
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
    createCard: vi.fn().mockReturnValue(document.createElement('div')),
    createCardWithActions: vi
      .fn()
      .mockReturnValue(document.createElement('div')),
  },
}));

// Mock other dependencies
vi.mock('../../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn().mockReturnValue({
      userMessage: 'Test error',
      shouldShowToUser: true,
    }),
  },
}));

vi.mock('../../../utils/ui-messages.js', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    confirm: vi.fn(),
    show: vi.fn(),
  },
}));

vi.mock('../../../utils/config-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    getCustomStatusTypes: vi.fn().mockResolvedValue([]),
    addCustomStatusType: vi.fn().mockResolvedValue(),
    removeCustomStatusType: vi.fn().mockResolvedValue(),
  })),
}));

vi.mock('../../../utils/formatters.js', () => ({
  formatStatus: vi.fn(status => status),
}));

vi.mock('../../../supabase-config.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    isConfigured: vi.fn().mockResolvedValue(true),
    session: null,
  })),
}));

vi.mock('../../../supabase-service.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    getBookmarks: vi.fn().mockResolvedValue([]),
    exportData: vi.fn().mockResolvedValue({}),
    importData: vi.fn().mockResolvedValue(),
    deleteBookmark: vi.fn().mockResolvedValue(),
  })),
}));

vi.mock('../../../auth-ui.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    showLoginForm: vi.fn(),
    supabaseConfig: { session: null },
  })),
}));

vi.mock('../../../utils/auth-state-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    addListener: vi.fn(),
    setAuthState: vi.fn(),
  })),
}));

vi.mock('../../../config-ui.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    showConfigForm: vi.fn(),
    showConfigStatus: vi.fn(),
  })),
}));

// Mock the modules
vi.mock(
  '../../../options/modules/initialization/options-initializer.js',
  () => ({
    OptionsInitializer: vi.fn().mockImplementation(() => ({
      initializeAsync: vi.fn().mockResolvedValue(),
      initializeApp: vi.fn().mockResolvedValue({ interfaceType: 'main' }),
      initializeAuthState: vi.fn().mockResolvedValue(),
      getElements: vi.fn().mockReturnValue({
        appContainer: { innerHTML: '', appendChild: vi.fn() },
        statusTypesList: null,
        newStatusInput: null,
        addStatusBtn: null,
        exportDataBtn: null,
        importDataBtn: null,
        importFile: null,
        clearDataBtn: null,
        totalEntries: null,
        statusTypesCount: null,
        mostUsedStatus: null,
      }),
    })),
  })
);

vi.mock('../../../options/modules/auth/auth-state-manager.js', () => ({
  AuthStateManager: vi.fn().mockImplementation(() => ({
    handleAuthStateChange: vi.fn(),
    showAuthInterface: vi.fn(),
    onAuthSuccess: vi.fn(),
    setAppContainer: vi.fn(),
  })),
}));

vi.mock('../../../options/modules/data/data-manager.js', () => ({
  DataManager: vi.fn().mockImplementation(() => ({
    loadData: vi.fn().mockResolvedValue(),
    loadStatusTypes: vi.fn(),
    addStatusType: vi.fn().mockResolvedValue(),
    removeStatusType: vi.fn().mockResolvedValue(),
    loadStatistics: vi.fn(),
    exportData: vi.fn().mockResolvedValue(),
    importData: vi.fn().mockResolvedValue(),
    clearData: vi.fn().mockResolvedValue(),
    appContainer: null,
  })),
}));

vi.mock('../../../options/modules/ui/options-interface.js', () => ({
  OptionsInterface: vi.fn().mockImplementation(() => ({
    showMainInterface: vi.fn(),
    bindEvents: vi.fn(),
    importData: vi.fn(),
    openBookmarkManagement: vi.fn(),
    appContainer: null,
  })),
}));

describe('ForgetfulMeOptions (Refactored)', () => {
  let options;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock document.createElement
    document.createElement = vi.fn(tagName => {
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
    document.getElementById = vi.fn(id => {
      if (id === 'app') return { innerHTML: '', appendChild: vi.fn() };
      return null;
    });

    // Create options instance
    options = new ForgetfulMeOptions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with all required modules', () => {
      expect(options.initializer).toBeDefined();
      expect(options.authManager).toBeDefined();
      expect(options.dataManager).toBeDefined();
      expect(options.optionsInterface).toBeDefined();
    });

    it('should have all required services', () => {
      expect(options.configManager).toBeDefined();
      expect(options.authStateManager).toBeDefined();
      expect(options.supabaseConfig).toBeDefined();
      expect(options.supabaseService).toBeDefined();
      expect(options.authUI).toBeDefined();
      expect(options.configUI).toBeDefined();
    });
  });

  describe('openBookmarkManagement', () => {
    it('should open bookmark management in a new tab', () => {
      // Call the method
      options.openBookmarkManagement();

      // Verify chrome.tabs.create was called with correct URL
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/bookmark-management.html',
      });
    });

    it('should use chrome.runtime.getURL to get the correct URL', () => {
      // Call the method
      options.openBookmarkManagement();

      // Verify chrome.runtime.getURL was called
      expect(chrome.runtime.getURL).toHaveBeenCalledWith(
        'bookmark-management.html'
      );
    });
  });

  describe('loadData', () => {
    it('should load data using the data manager', async () => {
      // Mock the data manager
      options.dataManager = {
        loadData: vi.fn().mockResolvedValue(),
      };

      // Call the method
      await options.loadData();

      // Verify the data manager was called
      expect(options.dataManager.loadData).toHaveBeenCalled();
    });
  });

  describe('showInterface', () => {
    it('should show config interface when type is config', () => {
      options.showConfigInterface = vi.fn();
      options.showAuthInterface = vi.fn();
      options.showMainInterface = vi.fn();
      options.loadData = vi.fn();

      options.showInterface('config');

      expect(options.showConfigInterface).toHaveBeenCalled();
      expect(options.showAuthInterface).not.toHaveBeenCalled();
      expect(options.showMainInterface).not.toHaveBeenCalled();
    });

    it('should show auth interface when type is auth', () => {
      options.showConfigInterface = vi.fn();
      options.showAuthInterface = vi.fn();
      options.showMainInterface = vi.fn();
      options.loadData = vi.fn();

      options.showInterface('auth');

      expect(options.showAuthInterface).toHaveBeenCalled();
      expect(options.showConfigInterface).not.toHaveBeenCalled();
      expect(options.showMainInterface).not.toHaveBeenCalled();
    });

    it('should show main interface and load data when type is main', () => {
      options.showConfigInterface = vi.fn();
      options.showAuthInterface = vi.fn();
      options.showMainInterface = vi.fn();
      options.loadData = vi.fn();

      options.showInterface('main');

      expect(options.showMainInterface).toHaveBeenCalled();
      expect(options.loadData).toHaveBeenCalled();
      expect(options.showConfigInterface).not.toHaveBeenCalled();
      expect(options.showAuthInterface).not.toHaveBeenCalled();
    });
  });
});
