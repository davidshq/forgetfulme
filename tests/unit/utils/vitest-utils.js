/**
 * @fileoverview Vitest-specific test utilities for unit tests
 * @module vitest-utils
 * @description Provides Vitest-specific mock creation and test environment setup for unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Create a mock Chrome extension API for Vitest unit tests
 * @function createMockChrome
 * @returns {Object} Mock Chrome API with all extension methods
 * @description Creates a comprehensive mock of Chrome extension APIs for Vitest unit testing
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
 * Create a mock console object for Vitest unit tests
 * @function createMockConsole
 * @returns {Object} Mock console with all methods
 * @description Creates a mock console object with tracked methods for Vitest unit testing
 */
export const createMockConsole = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
});

/**
 * Create a mock ErrorHandler for Vitest unit tests
 * @function createMockErrorHandler
 * @returns {Object} Mock ErrorHandler with all methods and constants
 * @description Creates a mock ErrorHandler with predefined responses for Vitest unit testing
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
  logError: vi.fn(),
  formatError: vi.fn(),
  ERROR_TYPES: {
    UNKNOWN: 'UNKNOWN',
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    STORAGE: 'STORAGE',
    VALIDATION: 'VALIDATION',
  },
  SEVERITY_LEVELS: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
});

/**
 * Create a mock UIComponents for Vitest unit tests
 * @function createMockUIComponents
 * @returns {Object} Mock UIComponents with all methods
 * @description Creates a mock UIComponents with predefined responses for Vitest unit testing
 */
export const createMockUIComponents = () => ({
  createButton: vi.fn().mockReturnValue(document.createElement('button')),
  createInput: vi.fn().mockReturnValue(document.createElement('input')),
  createSelect: vi.fn().mockReturnValue(document.createElement('select')),
  createLabel: vi.fn().mockReturnValue(document.createElement('label')),
  createDiv: vi.fn().mockReturnValue(document.createElement('div')),
  createSpan: vi.fn().mockReturnValue(document.createElement('span')),
  createForm: vi.fn().mockReturnValue(document.createElement('form')),
  createFieldset: vi.fn().mockReturnValue(document.createElement('fieldset')),
  createLegend: vi.fn().mockReturnValue(document.createElement('legend')),
  createOption: vi.fn().mockReturnValue(document.createElement('option')),
  createOptgroup: vi.fn().mockReturnValue(document.createElement('optgroup')),
  addClass: vi.fn(),
  removeClass: vi.fn(),
  toggleClass: vi.fn(),
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  setTextContent: vi.fn(),
  setInnerHTML: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  insertBefore: vi.fn(),
  replaceChild: vi.fn(),
  cloneNode: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  click: vi.fn(),
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  getElementById: vi.fn(),
  getElementsByClassName: vi.fn(),
  getElementsByTagName: vi.fn(),
  matches: vi.fn(),
  closest: vi.fn(),
  contains: vi.fn(),
  compareDocumentPosition: vi.fn(),
  isSameNode: vi.fn(),
  isEqualNode: vi.fn(),
  lookupPrefix: vi.fn(),
  lookupNamespaceURI: vi.fn(),
  isDefaultNamespace: vi.fn(),
  insertAdjacentElement: vi.fn(),
  insertAdjacentText: vi.fn(),
  insertAdjacentHTML: vi.fn(),
  scrollIntoView: vi.fn(),
  scrollIntoViewIfNeeded: vi.fn(),
  scroll: vi.fn(),
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  getBoundingClientRect: vi.fn().mockReturnValue({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  }),
  getClientRects: vi.fn().mockReturnValue([]),
  scrollTop: 0,
  scrollLeft: 0,
  scrollWidth: 100,
  scrollHeight: 100,
  clientTop: 0,
  clientLeft: 0,
  clientWidth: 100,
  clientHeight: 100,
  offsetTop: 0,
  offsetLeft: 0,
  offsetWidth: 100,
  offsetHeight: 100,
  offsetParent: null,
  innerHTML: '',
  outerHTML: '',
  textContent: '',
  innerText: '',
  outerText: '',
  nodeName: 'DIV',
  nodeType: 1,
  nodeValue: null,
  parentNode: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  ownerDocument: null,
  namespaceURI: null,
  prefix: null,
  localName: null,
  tagName: 'DIV',
  id: '',
  className: '',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(),
    replace: vi.fn(),
    item: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    length: 0,
  },
  attributes: {
    getNamedItem: vi.fn(),
    setNamedItem: vi.fn(),
    removeNamedItem: vi.fn(),
    item: vi.fn(),
    length: 0,
  },
  style: {
    cssText: '',
    length: 0,
    parentRule: null,
    getPropertyValue: vi.fn(),
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    item: vi.fn(),
    getPropertyPriority: vi.fn(),
  },
  dataset: {},
  hidden: false,
  title: '',
  lang: '',
  dir: '',
  tabIndex: -1,
  accessKey: '',
  draggable: false,
  spellcheck: true,
  contentEditable: 'inherit',
  isContentEditable: false,
  offsetTop: 0,
  offsetLeft: 0,
  offsetWidth: 100,
  offsetHeight: 100,
  offsetParent: null,
  innerHTML: '',
  outerHTML: '',
  textContent: '',
  innerText: '',
  outerText: '',
  nodeName: 'DIV',
  nodeType: 1,
  nodeValue: null,
  parentNode: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  ownerDocument: null,
  namespaceURI: null,
  prefix: null,
  localName: null,
  tagName: 'DIV',
  id: '',
  className: '',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(),
    replace: vi.fn(),
    item: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    length: 0,
  },
  attributes: {
    getNamedItem: vi.fn(),
    setNamedItem: vi.fn(),
    removeNamedItem: vi.fn(),
    item: vi.fn(),
    length: 0,
  },
  style: {
    cssText: '',
    length: 0,
    parentRule: null,
    getPropertyValue: vi.fn(),
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    item: vi.fn(),
    getPropertyPriority: vi.fn(),
  },
  dataset: {},
  hidden: false,
  title: '',
  lang: '',
  dir: '',
  tabIndex: -1,
  accessKey: '',
  draggable: false,
  spellcheck: true,
  contentEditable: 'inherit',
  isContentEditable: false,
});

/**
 * Create a mock UIMessages for Vitest unit tests
 * @function createMockUIMessages
 * @returns {Object} Mock UIMessages with all methods
 * @description Creates a mock UIMessages with predefined responses for Vitest unit testing
 */
export const createMockUIMessages = () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  hideMessage: vi.fn(),
  clearMessages: vi.fn(),
});

/**
 * Create a mock SupabaseService for Vitest unit tests
 * @function createMockSupabaseService
 * @returns {Object} Mock SupabaseService with all methods
 * @description Creates a mock SupabaseService with predefined responses for Vitest unit testing
 */
export const createMockSupabaseService = () => ({
  client: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
  initialize: vi.fn(),
  authenticate: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
});

/**
 * Create a mock ConfigManager for Vitest unit tests
 * @function createMockConfigManager
 * @returns {Object} Mock ConfigManager with all methods
 * @description Creates a mock ConfigManager with predefined responses for Vitest unit testing
 */
export const createMockConfigManager = () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  updateConfig: vi.fn(),
  resetConfig: vi.fn(),
  getSupabaseConfig: vi.fn(),
  setSupabaseConfig: vi.fn(),
  getAuthSession: vi.fn(),
  setAuthSession: vi.fn(),
  getCustomStatusTypes: vi.fn(),
  setCustomStatusTypes: vi.fn(),
  onConfigChange: vi.fn(),
  removeConfigChangeListener: vi.fn(),
});

/**
 * Create a mock AuthStateManager for Vitest unit tests
 * @function createMockAuthStateManager
 * @returns {Object} Mock AuthStateManager with all methods
 * @description Creates a mock AuthStateManager with predefined responses for Vitest unit testing
 */
export const createMockAuthStateManager = () => ({
  getAuthState: vi.fn(),
  setAuthState: vi.fn(),
  clearAuthState: vi.fn(),
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  removeAuthStateListener: vi.fn(),
});

/**
 * Create a mock SupabaseConfig for Vitest unit tests
 * @function createMockSupabaseConfig
 * @returns {Object} Mock SupabaseConfig with all methods
 * @description Creates a mock SupabaseConfig with predefined responses for Vitest unit testing
 */
export const createMockSupabaseConfig = () => ({
  url: 'https://test.supabase.co',
  anonKey: 'test-anon-key',
  validate: vi.fn(),
  isValid: vi.fn(),
});

/**
 * Create a mock AuthUI for Vitest unit tests
 * @function createMockAuthUI
 * @returns {Object} Mock AuthUI with all methods
 * @description Creates a mock AuthUI with predefined responses for Vitest unit testing
 */
export const createMockAuthUI = () => ({
  render: vi.fn(),
  handleLogin: vi.fn(),
  handleLogout: vi.fn(),
  showError: vi.fn(),
  clearError: vi.fn(),
  updateUI: vi.fn(),
});

/**
 * Create a mock BookmarkTransformer for Vitest unit tests
 * @function createMockBookmarkTransformer
 * @returns {Object} Mock BookmarkTransformer with all methods
 * @description Creates a mock BookmarkTransformer with predefined responses for Vitest unit testing
 */
export const createMockBookmarkTransformer = () => ({
  transformBookmark: vi.fn(),
  transformBookmarks: vi.fn(),
  validateBookmark: vi.fn(),
  formatBookmark: vi.fn(),
});

/**
 * Create a test environment with all necessary mocks for Vitest unit tests
 * @function createTestEnvironment
 * @param {Object} customMocks - Additional custom mocks to include
 * @returns {Object} Complete test environment with all mocks
 * @description Sets up a complete test environment with all necessary mocks for Vitest unit testing
 */
export const createTestEnvironment = (customMocks = {}) => {
  const chrome = createMockChrome();
  const console = createMockConsole();
  const errorHandler = createMockErrorHandler();
  const uiComponents = createMockUIComponents();
  const uiMessages = createMockUIMessages();
  const supabaseService = createMockSupabaseService();
  const configManager = createMockConfigManager();
  const authStateManager = createMockAuthStateManager();
  const supabaseConfig = createMockSupabaseConfig();
  const authUI = createMockAuthUI();
  const bookmarkTransformer = createMockBookmarkTransformer();

  return {
    chrome,
    console,
    errorHandler,
    uiComponents,
    uiMessages,
    supabaseService,
    configManager,
    authStateManager,
    supabaseConfig,
    authUI,
    bookmarkTransformer,
    ...customMocks,
  };
};

/**
 * Setup test with mocks for Vitest unit tests
 * @function setupTestWithMocks
 * @param {Object} customMocks - Additional custom mocks to include
 * @returns {Object} Test setup with all mocks
 * @description Sets up a test with all necessary mocks for Vitest unit testing
 */
export const setupTestWithMocks = (customMocks = {}) => {
  const mocks = createTestEnvironment(customMocks);

  // Setup global mocks
  global.chrome = mocks.chrome;
  global.console = mocks.console;

  return mocks;
};

/**
 * Setup module mocks for Vitest unit tests
 * @function setupModuleMocks
 * @description Sets up module mocks for Vitest unit testing
 */
export const setupModuleMocks = () => {
  vi.mock('./utils/error-handler.js', () => ({
    default: createMockErrorHandler(),
  }));

  vi.mock('./utils/ui-components.js', () => ({
    default: createMockUIComponents(),
  }));

  vi.mock('./utils/ui-messages.js', () => ({
    default: createMockUIMessages(),
  }));

  vi.mock('./supabase-service.js', () => ({
    default: createMockSupabaseService(),
  }));

  vi.mock('./utils/config-manager.js', () => ({
    default: createMockConfigManager(),
  }));

  vi.mock('./utils/auth-state-manager.js', () => ({
    default: createMockAuthStateManager(),
  }));

  vi.mock('./supabase-config.js', () => ({
    default: createMockSupabaseConfig(),
  }));

  vi.mock('./utils/auth-ui.js', () => ({
    default: createMockAuthUI(),
  }));

  vi.mock('./utils/bookmark-transformer.js', () => ({
    default: createMockBookmarkTransformer(),
  }));
};

/**
 * Create a mock DOM element for Vitest unit tests
 * @function createMockElement
 * @param {string} tagName - Tag name for the element
 * @param {Object} options - Additional options for the element
 * @returns {Object} Mock DOM element
 * @description Creates a mock DOM element for Vitest unit testing
 */
export const createMockElement = (tagName = 'div', options = {}) => {
  const element = {
    tagName: tagName.toUpperCase(),
    nodeType: 1,
    nodeName: tagName.toUpperCase(),
    nodeValue: null,
    parentNode: null,
    childNodes: [],
    firstChild: null,
    lastChild: null,
    previousSibling: null,
    nextSibling: null,
    ownerDocument: null,
    namespaceURI: null,
    prefix: null,
    localName: null,
    id: '',
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(),
      replace: vi.fn(),
      item: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      length: 0,
    },
    attributes: {
      getNamedItem: vi.fn(),
      setNamedItem: vi.fn(),
      removeNamedItem: vi.fn(),
      item: vi.fn(),
      length: 0,
    },
    style: {
      cssText: '',
      length: 0,
      parentRule: null,
      getPropertyValue: vi.fn(),
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      item: vi.fn(),
      getPropertyPriority: vi.fn(),
    },
    dataset: {},
    hidden: false,
    title: '',
    lang: '',
    dir: '',
    tabIndex: -1,
    accessKey: '',
    draggable: false,
    spellcheck: true,
    contentEditable: 'inherit',
    isContentEditable: false,
    offsetTop: 0,
    offsetLeft: 0,
    offsetWidth: 100,
    offsetHeight: 100,
    offsetParent: null,
    innerHTML: '',
    outerHTML: '',
    textContent: '',
    innerText: '',
    outerText: '',
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    replaceChild: vi.fn(),
    cloneNode: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getElementById: vi.fn(),
    getElementsByClassName: vi.fn(),
    getElementsByTagName: vi.fn(),
    matches: vi.fn(),
    closest: vi.fn(),
    contains: vi.fn(),
    compareDocumentPosition: vi.fn(),
    isSameNode: vi.fn(),
    isEqualNode: vi.fn(),
    lookupPrefix: vi.fn(),
    lookupNamespaceURI: vi.fn(),
    isDefaultNamespace: vi.fn(),
    insertAdjacentElement: vi.fn(),
    insertAdjacentText: vi.fn(),
    insertAdjacentHTML: vi.fn(),
    scrollIntoView: vi.fn(),
    scrollIntoViewIfNeeded: vi.fn(),
    scroll: vi.fn(),
    scrollTo: vi.fn(),
    scrollBy: vi.fn(),
    getBoundingClientRect: vi.fn().mockReturnValue({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }),
    getClientRects: vi.fn().mockReturnValue([]),
    scrollTop: 0,
    scrollLeft: 0,
    scrollWidth: 100,
    scrollHeight: 100,
    clientTop: 0,
    clientLeft: 0,
    clientWidth: 100,
    clientHeight: 100,
    ...options,
  };

  return element;
};

/**
 * Setup Chrome tabs for Vitest unit tests
 * @function setupChromeTabs
 * @param {Object} mocks - Mock objects
 * @param {Object} tabData - Tab data to setup
 * @description Sets up Chrome tabs mock for Vitest unit testing
 */
export const setupChromeTabs = (
  mocks,
  tabData = {
    url: 'https://example.com',
    title: 'Test Page',
  }
) => {
  mocks.chrome.tabs.query.mockImplementation((queryInfo, callback) => {
    callback([
      {
        id: 1,
        url: tabData.url,
        title: tabData.title,
        active: true,
        ...tabData,
      },
    ]);
  });

  mocks.chrome.tabs.get.mockImplementation((tabId, callback) => {
    callback({
      id: tabId,
      url: tabData.url,
      title: tabData.title,
      active: true,
      ...tabData,
    });
  });
};

/**
 * Setup bookmark data for Vitest unit tests
 * @function setupBookmarkData
 * @param {Object} mocks - Mock objects
 * @param {Object} bookmarkData - Bookmark data to setup
 * @description Sets up bookmark data mock for Vitest unit testing
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
  mocks.chrome.storage.sync.get.mockImplementation((keys, callback) => {
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (key === 'bookmarks') {
          result[key] = [bookmarkData];
        } else {
          result[key] = null;
        }
      });
    } else if (typeof keys === 'string') {
      if (keys === 'bookmarks') {
        result[keys] = [bookmarkData];
      } else {
        result[keys] = null;
      }
    } else {
      result.bookmarks = [bookmarkData];
    }
    callback(result);
  });
};

/**
 * Create a popup test instance for Vitest unit tests
 * @function createPopupTestInstance
 * @param {Object} customMocks - Additional custom mocks to include
 * @returns {Object} Popup test instance with all mocks
 * @description Creates a popup test instance with all necessary mocks for Vitest unit testing
 */
export const createPopupTestInstance = (customMocks = {}) => {
  const mocks = setupTestWithMocks(customMocks);
  const popupElement = createMockElement('div', { id: 'app' });

  // Setup document mock
  global.document = {
    getElementById: vi.fn().mockReturnValue(popupElement),
    querySelector: vi.fn().mockReturnValue(popupElement),
    querySelectorAll: vi.fn().mockReturnValue([popupElement]),
    createElement: vi
      .fn()
      .mockImplementation(tagName => createMockElement(tagName)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  return {
    ...mocks,
    popupElement,
  };
};

/**
 * Create an auth UI test instance for Vitest unit tests
 * @function createAuthUITestInstance
 * @param {Object} customMocks - Additional custom mocks to include
 * @returns {Object} Auth UI test instance with all mocks
 * @description Creates an auth UI test instance with all necessary mocks for Vitest unit testing
 */
export const createAuthUITestInstance = (customMocks = {}) => {
  const mocks = setupTestWithMocks(customMocks);
  const authContainer = createMockElement('div', { id: 'auth-container' });

  // Setup document mock
  global.document = {
    getElementById: vi.fn().mockReturnValue(authContainer),
    querySelector: vi.fn().mockReturnValue(authContainer),
    querySelectorAll: vi.fn().mockReturnValue([authContainer]),
    createElement: vi
      .fn()
      .mockImplementation(tagName => createMockElement(tagName)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  return {
    ...mocks,
    authContainer,
  };
};

/**
 * Setup global mocks for Vitest unit tests
 * @function setupGlobalMocks
 * @description Sets up global mocks for Vitest unit testing
 */
export const setupGlobalMocks = () => {
  global.chrome = createMockChrome();
  global.console = createMockConsole();
  global.document = {
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    createElement: vi
      .fn()
      .mockImplementation(tagName => createMockElement(tagName)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  global.window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

/**
 * Cleanup mocks for Vitest unit tests
 * @function cleanupMocks
 * @description Cleans up mocks for Vitest unit testing
 */
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
};

/**
 * Setup test for Vitest unit tests
 * @function setupTest
 * @description Sets up test environment for Vitest unit testing
 */
export const setupTest = () => {
  setupGlobalMocks();
  setupModuleMocks();
};

/**
 * Cleanup test for Vitest unit tests
 * @function cleanupTest
 * @description Cleans up test environment for Vitest unit testing
 */
export const cleanupTest = () => {
  cleanupMocks();
};
