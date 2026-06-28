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
import { createStubUIComponents } from './mocks/ui-components.js';

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
const createMockChrome = () => ({
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
const createMockConsole = () => ({
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
const createMockErrorHandler = () => ({
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

// Mock UIMessages
const createMockUIMessages = () => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  show: vi.fn(),
  confirm: vi.fn(),
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
const createMockSupabaseService = () => ({
  initialize: vi.fn().mockResolvedValue(),
  saveBookmark: vi.fn(),
  getBookmarks: vi.fn(),
  updateBookmark: vi.fn(),
  getBookmarkByUrl: vi.fn(),
  deleteBookmark: vi.fn(),
});

// Mock ConfigManager
const createMockConfigManager = () => ({
  initialize: vi.fn().mockResolvedValue(),
  getCustomStatusTypes: vi.fn().mockResolvedValue([]),
  getSupabaseConfig: vi.fn(),
  setSupabaseConfig: vi.fn(),
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  reset: vi.fn(),
  getConfigSummary: vi.fn(),
});

// Mock AuthStateManager
const createMockAuthStateManager = () => ({
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
const createMockSupabaseConfig = () => ({
  isConfigured: vi.fn().mockResolvedValue(true),
  initialize: vi.fn().mockResolvedValue(),
  getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  session: null,
});

// Mock AuthUI
const createMockAuthUI = () => ({
  showLoginForm: vi.fn(),
  showSignupForm: vi.fn(),
  handleLogin: vi.fn(),
  handleSignup: vi.fn(),
  handleSignOut: vi.fn(),
});

// Mock BookmarkTransformer
const createMockBookmarkTransformer = () => ({
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
const createTestEnvironment = (customMocks = {}) => {
  const mocks = {
    chrome: createMockChrome(),
    console: createMockConsole(),
    errorHandler: createMockErrorHandler(),
    uiComponents: createStubUIComponents(),
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
