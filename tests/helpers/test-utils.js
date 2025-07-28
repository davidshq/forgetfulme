/**
 * @fileoverview Enhanced test utilities for ForgetfulMe extension tests
 * @module test-utils
 * @description Provides centralized mock creation and test environment setup for comprehensive testing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Enhanced test utilities for ForgetfulMe extension tests
 * @description Provides centralized mock creation and test environment setup
 */

/**
 * Create a mock Chrome extension API
 * @function createMockChrome
 * @returns {Object} Mock Chrome API with all extension methods
 * @description Creates a comprehensive mock of Chrome extension APIs for testing
 */
export const createMockChrome = () => ({
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
    getURL: vi.fn(path => `chrome-extension://test-id/${path}`),
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
});

/**
 * Create a mock console object
 * @function createMockConsole
 * @returns {Object} Mock console with all methods
 * @description Creates a mock console object with tracked methods for testing
 */
export const createMockConsole = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
});

/**
 * Create a mock ErrorHandler
 * @function createMockErrorHandler
 * @returns {Object} Mock ErrorHandler with all methods and constants
 * @description Creates a mock ErrorHandler with predefined responses for testing
 */
export const createMockErrorHandler = () => ({
  handle: vi.fn().mockReturnValue({
    errorInfo: {
      type: 'UNKNOWN',
      severity: 'MEDIUM',
      message: 'Test error message',
      context: 'test',
      originalError: new Error('Test error message'),
    },
    userMessage: 'Test error message',
    shouldRetry: false,
    shouldShowToUser: true,
    technicalMessage: 'Test error message',
  }),
  createError: vi.fn((message, type, context) => {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    return error;
  }),
  ERROR_TYPES: {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    DATABASE: 'DATABASE',
    CONFIG: 'CONFIG',
    UI: 'UI',
    UNKNOWN: 'UNKNOWN',
  },
  SEVERITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
});

// Mock UIComponents
export const createMockUIComponents = () => ({
  DOM: {
    ready: vi.fn().mockResolvedValue(),
    getElement: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
    elementExists: vi.fn(),
    waitForElement: vi.fn(),
    addEventListener: vi.fn(),
    initializeElements: vi.fn(),
    bindEvents: vi.fn(),
  },
  createButton: vi.fn(),
  createForm: vi.fn(),
  createSection: vi.fn(),
  createContainer: vi.fn(),
  createList: vi.fn(),
  createListItem: vi.fn(),
  createProgressIndicator: vi.fn(),
  createProgressBar: vi.fn(),
  createLoadingState: vi.fn(),
  setBusyState: vi.fn(),
  createStatusIndicator: vi.fn(),
  createModal: vi.fn(),
  showModal: vi.fn(),
  closeModal: vi.fn(),
  createConfirmDialog: vi.fn(),
  createFormField: vi.fn(),
  COMPONENT_TYPES: {
    BUTTON: 'button',
    FORM: 'form',
    INPUT: 'input',
    SELECT: 'select',
    LABEL: 'label',
    CONTAINER: 'container',
    HEADER: 'header',
    SECTION: 'section',
    LIST: 'list',
    LIST_ITEM: 'list-item',
    MESSAGE: 'message',
    CONFIRM: 'confirm',
    TOAST: 'toast',
  },
  BUTTON_STYLES: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DANGER: 'danger',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
    SMALL: 'small',
    LARGE: 'large',
  },
  FIELD_TYPES: {
    TEXT: 'text',
    EMAIL: 'email',
    PASSWORD: 'password',
    URL: 'url',
    NUMBER: 'number',
    SELECT: 'select',
    TEXTAREA: 'textarea',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
  },
});

// Mock UIMessages
export const createMockUIMessages = () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  clear: vi.fn(),
  show: vi.fn(),
  showWithRetry: vi.fn(),
  confirm: vi.fn(),
  toast: vi.fn(),
  getDefaultTimeout: vi.fn(),
  MESSAGE_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading',
  },
});

// Mock SupabaseService
export const createMockSupabaseService = () => ({
  initialize: vi.fn().mockResolvedValue(),
  saveBookmark: vi.fn(),
  getBookmarks: vi.fn(),
  updateBookmark: vi.fn(),
  getBookmarkByUrl: vi.fn(),
  deleteBookmark: vi.fn(),
});

// Mock ConfigManager
export const createMockConfigManager = () => ({
  initialize: vi.fn().mockResolvedValue(),
  getCustomStatusTypes: vi.fn().mockResolvedValue([]),
  getSupabaseConfig: vi.fn(),
  setSupabaseConfig: vi.fn(),
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
  getAuthSession: vi.fn(),
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  isAuthenticated: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  reset: vi.fn(),
  getConfigSummary: vi.fn(),
});

// Mock AuthStateManager
export const createMockAuthStateManager = () => ({
  initialize: vi.fn().mockResolvedValue(),
  isAuthenticated: vi.fn().mockResolvedValue(true),
  getAuthState: vi.fn(),
  setAuthState: vi.fn(),
  clearAuthState: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  getAuthSummary: vi.fn(),
  notifyAllContexts: vi.fn(),
});

// Mock SupabaseConfig
export const createMockSupabaseConfig = () => ({
  isConfigured: vi.fn().mockResolvedValue(true),
  initialize: vi.fn().mockResolvedValue(),
  getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  session: null,
});

// Mock AuthUI
export const createMockAuthUI = () => ({
  showLoginForm: vi.fn(),
  showSignupForm: vi.fn(),
  handleLogin: vi.fn(),
  handleSignup: vi.fn(),
  handleSignOut: vi.fn(),
  getErrorMessage: vi.fn(),
});

// Mock BookmarkTransformer
export const createMockBookmarkTransformer = () => ({
  toUIFormat: vi.fn(),
  fromCurrentTab: vi.fn(),
  fromBookmarkData: vi.fn(),
  toBookmarkData: vi.fn(),
  validateBookmark: vi.fn(),
});

/**
 * Creates a complete test environment with all mocks
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete test environment with all mocks
 */
export const createTestEnvironment = (customMocks = {}) => {
  const mocks = {
    chrome: createMockChrome(),
    console: createMockConsole(),
    errorHandler: createMockErrorHandler(),
    uiComponents: createMockUIComponents(),
    uiMessages: createMockUIMessages(),
    supabaseService: createMockSupabaseService(),
    configManager: createMockConfigManager(),
    authStateManager: createMockAuthStateManager(),
    supabaseConfig: createMockSupabaseConfig(),
    authUI: createMockAuthUI(),
    bookmarkTransformer: createMockBookmarkTransformer(),
  };

  // Apply custom mocks
  Object.assign(mocks, customMocks);

  return mocks;
};

/**
 * Sets up a test with all necessary mocks and global objects
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Test setup with mocks and cleanup function
 */
export const setupTestWithMocks = (customMocks = {}) => {
  const mocks = createTestEnvironment(customMocks);

  // Setup global mocks
  global.chrome = mocks.chrome;
  global.console = mocks.console;

  // Mock window.location for JSDOM compatibility
  Object.defineProperty(window, 'location', {
    value: {
      reload: vi.fn(),
      href: 'http://localhost',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
  });

  return {
    mocks,
    cleanup: () => {
      vi.clearAllMocks();
      vi.restoreAllMocks();
    },
  };
};

/**
 * Sets up module mocks using vi.mock() for ES modules
 * Note: This function should be called at the top level of test files
 * due to Vitest's hoisting behavior
 */
export const setupModuleMocks = () => {
  // Mock all utility modules with factory functions
  vi.mock('../../utils/error-handler.js', () => ({
    default: {
      handle: vi.fn().mockReturnValue({
        errorInfo: {
          type: 'UNKNOWN',
          severity: 'MEDIUM',
          message: 'Test error message',
          context: 'test',
          originalError: new Error('Test error message'),
        },
        userMessage: 'Test error message',
        shouldRetry: false,
        shouldShowToUser: true,
        technicalMessage: 'Test error message',
      }),
      createError: vi.fn((message, type, context) => {
        const error = new Error(message);
        error.type = type;
        error.context = context;
        return error;
      }),
      ERROR_TYPES: {
        NETWORK: 'NETWORK',
        AUTH: 'AUTH',
        VALIDATION: 'VALIDATION',
        DATABASE: 'DATABASE',
        CONFIG: 'CONFIG',
        UI: 'UI',
        UNKNOWN: 'UNKNOWN',
      },
      SEVERITY: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
      },
    },
  }));

  vi.mock('../../utils/ui-components.js', () => ({
    default: {
      DOM: {
        ready: vi.fn().mockResolvedValue(),
        getElement: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(),
        isReady: vi.fn().mockReturnValue(true),
        elementExists: vi.fn(),
        waitForElement: vi.fn(),
        addEventListener: vi.fn(),
        initializeElements: vi.fn(),
        bindEvents: vi.fn(),
      },
      createButton: vi.fn(),
      createForm: vi.fn(),
      createSection: vi.fn(),
      createContainer: vi.fn(),
      createList: vi.fn(),
      createListItem: vi.fn(),
      createStatusIndicator: vi.fn(),
      createTabs: vi.fn(),
      switchTab: vi.fn(),
      createModal: vi.fn(),
      showModal: vi.fn(),
      closeModal: vi.fn(),
      createConfirmDialog: vi.fn(),
      createFormField: vi.fn(),
      COMPONENT_TYPES: {
        BUTTON: 'button',
        FORM: 'form',
        INPUT: 'input',
        SELECT: 'select',
        LABEL: 'label',
        CONTAINER: 'container',
        HEADER: 'header',
        SECTION: 'section',
        LIST: 'list',
        LIST_ITEM: 'list-item',
        MESSAGE: 'message',
        CONFIRM: 'confirm',
        TOAST: 'toast',
      },
      BUTTON_STYLES: {
        PRIMARY: 'primary',
        SECONDARY: 'secondary',
        DANGER: 'danger',
        SUCCESS: 'success',
        WARNING: 'warning',
        INFO: 'info',
        SMALL: 'small',
        LARGE: 'large',
      },
      FIELD_TYPES: {
        TEXT: 'text',
        EMAIL: 'email',
        PASSWORD: 'password',
        URL: 'url',
        NUMBER: 'number',
        SELECT: 'select',
        TEXTAREA: 'textarea',
        CHECKBOX: 'checkbox',
        RADIO: 'radio',
      },
    },
  }));

  vi.mock('../../utils/ui-messages.js', () => ({
    default: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      showWithRetry: vi.fn(),
      confirm: vi.fn(),
      toast: vi.fn(),
      getDefaultTimeout: vi.fn(),
      MESSAGE_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        LOADING: 'loading',
      },
    },
  }));

  vi.mock('../../utils/config-manager.js', () => ({
    default: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(),
      getCustomStatusTypes: vi.fn().mockResolvedValue([]),
      getSupabaseConfig: vi.fn(),
      setSupabaseConfig: vi.fn(),
      getPreferences: vi.fn(),
      setPreferences: vi.fn(),
      getAuthSession: vi.fn(),
      setAuthSession: vi.fn(),
      clearAuthSession: vi.fn(),
      isAuthenticated: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      reset: vi.fn(),
      getConfigSummary: vi.fn(),
    })),
  }));

  vi.mock('../../utils/auth-state-manager.js', () => ({
    default: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(),
      isAuthenticated: vi.fn().mockResolvedValue(true),
      getAuthState: vi.fn(),
      setAuthState: vi.fn(),
      clearAuthState: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      getAuthSummary: vi.fn(),
      notifyAllContexts: vi.fn(),
    })),
  }));

  vi.mock('../../supabase-config.js', () => ({
    default: vi.fn().mockImplementation(() => ({
      isConfigured: vi.fn().mockResolvedValue(true),
      initialize: vi.fn().mockResolvedValue(),
      getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      session: null,
    })),
  }));

  vi.mock('../../supabase-service.js', () => ({
    default: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(),
      saveBookmark: vi.fn(),
      getBookmarks: vi.fn(),
      updateBookmark: vi.fn(),
      getBookmarkByUrl: vi.fn(),
      deleteBookmark: vi.fn(),
    })),
  }));

  vi.mock('../../auth-ui.js', () => ({
    default: vi.fn().mockImplementation(() => ({
      showLoginForm: vi.fn(),
      showSignupForm: vi.fn(),
      handleLogin: vi.fn(),
      handleSignup: vi.fn(),
      handleSignOut: vi.fn(),
    })),
  }));

  vi.mock('../../utils/bookmark-transformer.js', () => ({
    default: {
      toUIFormat: vi.fn(),
      fromCurrentTab: vi.fn(),
      toSupabaseFormat: vi.fn(),
      fromImportData: vi.fn(),
      normalizeTags: vi.fn(),
      validate: vi.fn(),
      isValidUrl: vi.fn(),
      toExportFormat: vi.fn(),
      transformMultiple: vi.fn(),
      getDefaultStructure: vi.fn(),
    },
  }));
};

/**
 * Creates a mock DOM element with common properties
 * @param {string} tagName - HTML tag name
 * @param {Object} options - Element options
 * @returns {HTMLElement} Mock DOM element
 */
export const createMockElement = (tagName = 'div', options = {}) => {
  const element = document.createElement(tagName);
  Object.assign(element, options);
  return element;
};

/**
 * Sets up common DOM elements for popup tests
 * @param {Object} mocks - Mocks from createTestEnvironment
 * @returns {Object} DOM setup with common elements
 * @deprecated Use test-factories.js instead
 */
export const setupPopupDOM = mocks => {
  const mockAppContainer = createMockElement('div', { id: 'app' });
  const mockReadStatus = createMockElement('select', { id: 'read-status' });
  const mockTags = createMockElement('input', { id: 'tags' });
  const mockSettingsBtn = createMockElement('button', { id: 'settings-btn' });
  const mockRecentList = createMockElement('div', { id: 'recent-list' });
  const mockEditReadStatus = createMockElement('select', {
    id: 'edit-read-status',
  });
  const mockEditTags = createMockElement('input', { id: 'edit-tags' });

  // Setup DOM element mapping
  mocks.uiComponents.DOM.getElement.mockImplementation(id => {
    const elementMap = {
      app: mockAppContainer,
      'read-status': mockReadStatus,
      tags: mockTags,
      'settings-btn': mockSettingsBtn,
      'recent-list': mockRecentList,
      'edit-read-status': mockEditReadStatus,
      'edit-tags': mockEditTags,
    };
    return elementMap[id] || null;
  });

  return {
    appContainer: mockAppContainer,
    readStatus: mockReadStatus,
    tags: mockTags,
    settingsBtn: mockSettingsBtn,
    recentList: mockRecentList,
    editReadStatus: mockEditReadStatus,
    editTags: mockEditTags,
  };
};

/**
 * Sets up common Chrome tabs for popup tests
 * @param {Object} mocks - Mocks from createTestEnvironment
 * @param {Object} tabData - Tab data to return
 * @deprecated Use test-factories.js instead
 */
export const setupChromeTabs = (
  mocks,
  tabData = {
    url: 'https://example.com',
    title: 'Test Page',
  }
) => {
  mocks.chrome.tabs.query.mockResolvedValue([tabData]);
};

/**
 * Sets up common bookmark data for tests
 * @param {Object} mocks - Mocks from createTestEnvironment
 * @param {Object} bookmarkData - Bookmark data to return
 * @deprecated Use test-factories.js instead
 */
export const setupBookmarkData = (
  mocks,
  bookmarkData = {
    url: 'https://example.com',
    title: 'Test Page',
    read_status: 'read',
    tags: ['test'],
  }
) => {
  mocks.bookmarkTransformer.fromCurrentTab.mockReturnValue(bookmarkData);
};

/**
 * Creates a complete popup test instance
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete popup test setup
 * @deprecated Use test-factories.js instead
 */
export const createPopupTestInstance = (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);

  // Setup module mocks
  setupModuleMocks();

  // Setup DOM
  const domElements = setupPopupDOM(mocks);

  // Setup Chrome tabs
  setupChromeTabs(mocks);

  // Setup bookmark data
  setupBookmarkData(mocks);

  return {
    mocks,
    domElements,
    cleanup,
  };
};

/**
 * Creates a complete auth UI test instance
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete auth UI test setup
 * @deprecated Use test-factories.js instead
 */
export const createAuthUITestInstance = (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);

  // Setup module mocks
  setupModuleMocks();

  // Create mock container
  const mockContainer = createMockElement('div', { id: 'test-container' });

  return {
    mocks,
    container: mockContainer,
    cleanup,
  };
};

/**
 * Legacy functions for backward compatibility
 * @deprecated Use setupTestWithMocks() and cleanup() instead
 */
export const setupGlobalMocks = () => {
  const mocks = createTestEnvironment();
  global.chrome = mocks.chrome;
  global.console = mocks.console;
  return mocks;
};

export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};

export const setupTest = () => {
  return setupTestWithMocks();
};

export const cleanupTest = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};
