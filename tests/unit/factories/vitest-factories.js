/**
 * @fileoverview Vitest-specific test factories for unit tests
 * @module vitest-factories
 * @description Factory functions for creating test data in Vitest unit tests
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TEST_USER, TEST_AUTH_SESSION, TEST_SUPABASE_CONFIG } from '../../shared/constants.js';

/**
 * Create a mock authentication session for Vitest unit tests
 * @function createMockAuthSession
 * @param {Object} overrides - Override values for the session
 * @returns {Object} Mock authentication session
 * @description Creates a mock authentication session for Vitest unit testing
 */
export const createMockAuthSession = (overrides = {}) => ({
  user: { ...TEST_USER },
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  ...overrides
});

/**
 * Create a mock Supabase configuration for Vitest unit tests
 * @function createMockSupabaseConfig
 * @param {Object} overrides - Override values for the configuration
 * @returns {Object} Mock Supabase configuration
 * @description Creates a mock Supabase configuration for Vitest unit testing
 */
export const createMockSupabaseConfig = (overrides = {}) => ({
  url: TEST_SUPABASE_CONFIG.url,
  anonKey: TEST_SUPABASE_CONFIG.anonKey,
  ...overrides
});

/**
 * Create a mock user object for Vitest unit tests
 * @function createMockUser
 * @param {Object} overrides - Override values for the user
 * @returns {Object} Mock user object
 * @description Creates a mock user object for Vitest unit testing
 */
export const createMockUser = (overrides = {}) => ({
  id: TEST_USER.id,
  email: TEST_USER.email,
  name: TEST_USER.name,
  ...overrides
});

/**
 * Create a mock Chrome storage object for Vitest unit tests
 * @function createMockChromeStorage
 * @param {Object} overrides - Override values for the storage
 * @returns {Object} Mock Chrome storage object
 * @description Creates a mock Chrome storage object for Vitest unit testing
 */
export const createMockChromeStorage = (overrides = {}) => ({
  supabaseConfig: createMockSupabaseConfig(),
  auth_session: createMockAuthSession(),
  customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later'],
  ...overrides
});

/**
 * Create a mock authentication error for Vitest unit tests
 * @function createMockAuthError
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} Mock authentication error
 * @description Creates a mock authentication error for Vitest unit testing
 */
export const createMockAuthError = (message = 'Authentication failed', code = 'AUTH_ERROR') => ({
  message,
  code,
  status: 401,
  name: 'AuthError'
});

/**
 * Create a mock Supabase client for Vitest unit tests
 * @function createMockSupabaseClient
 * @param {Object} overrides - Override values for the client
 * @returns {Object} Mock Supabase client
 * @description Creates a mock Supabase client for Vitest unit testing
 */
export const createMockSupabaseClient = (overrides = {}) => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(),
  ...overrides
});

/**
 * Create a mock bookmark for Vitest unit tests
 * @function createMockBookmark
 * @param {Object} overrides - Override values for the bookmark
 * @returns {Object} Mock bookmark object
 * @description Creates a mock bookmark object for Vitest unit testing
 */
export const createMockBookmark = (overrides = {}) => ({
  id: 'test-bookmark-id',
  url: 'https://example.com',
  title: 'Test Bookmark',
  read_status: 'read',
  tags: ['test'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

/**
 * Create a mock bookmark list for Vitest unit tests
 * @function createMockBookmarkList
 * @param {number} count - Number of bookmarks to create
 * @param {Object} overrides - Override values for the bookmarks
 * @returns {Array} Array of mock bookmark objects
 * @description Creates a list of mock bookmark objects for Vitest unit testing
 */
export const createMockBookmarkList = (count = 3, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockBookmark({
      id: `test-bookmark-${index}`,
      url: `https://example${index}.com`,
      title: `Test Bookmark ${index}`,
      ...overrides
    })
  );
};

/**
 * Create a mock configuration for Vitest unit tests
 * @function createMockConfig
 * @param {Object} overrides - Override values for the configuration
 * @returns {Object} Mock configuration object
 * @description Creates a mock configuration object for Vitest unit testing
 */
export const createMockConfig = (overrides = {}) => ({
  supabase: createMockSupabaseConfig(),
  preferences: {
    customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
  },
  auth: createMockAuthSession(),
  ...overrides
});

/**
 * Create a mock error for Vitest unit tests
 * @function createMockError
 * @param {string} message - Error message
 * @param {string} name - Error name
 * @param {number} code - Error code
 * @returns {Error} Mock error object
 * @description Creates a mock error object for Vitest unit testing
 */
export const createMockError = (message = 'Test error', name = 'TestError', code = 500) => {
  const error = new Error(message);
  error.name = name;
  error.code = code;
  return error;
};

/**
 * Create a mock DOM event for Vitest unit tests
 * @function createMockEvent
 * @param {string} type - Event type
 * @param {Object} options - Event options
 * @returns {Object} Mock DOM event
 * @description Creates a mock DOM event for Vitest unit testing
 */
export const createMockEvent = (type = 'click', options = {}) => ({
  type,
  target: options.target || null,
  currentTarget: options.currentTarget || null,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  bubbles: options.bubbles || false,
  cancelable: options.cancelable || true,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  timeStamp: Date.now(),
  ...options
});

/**
 * Create a mock form data for Vitest unit tests
 * @function createMockFormData
 * @param {Object} data - Form data to include
 * @returns {Object} Mock form data object
 * @description Creates a mock form data object for Vitest unit testing
 */
export const createMockFormData = (data = {}) => {
  const formData = new Map();
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value);
  });
  
  return {
    get: vi.fn((key) => formData.get(key)),
    getAll: vi.fn((key) => [formData.get(key)]),
    has: vi.fn((key) => formData.has(key)),
    set: vi.fn((key, value) => formData.set(key, value)),
    delete: vi.fn((key) => formData.delete(key)),
    append: vi.fn((key, value) => formData.set(key, value)),
    entries: vi.fn(() => formData.entries()),
    keys: vi.fn(() => formData.keys()),
    values: vi.fn(() => formData.values()),
    forEach: vi.fn((callback) => formData.forEach(callback)),
  };
};

/**
 * Create a mock fetch response for Vitest unit tests
 * @function createMockFetchResponse
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Response headers
 * @returns {Object} Mock fetch response
 * @description Creates a mock fetch response for Vitest unit testing
 */
export const createMockFetchResponse = (data = {}, status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Map(Object.entries(headers)),
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  blob: vi.fn().mockResolvedValue(new Blob()),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer()),
  formData: vi.fn().mockResolvedValue(createMockFormData()),
  clone: vi.fn().mockReturnThis(),
});

/**
 * Create a mock fetch function for Vitest unit tests
 * @function createMockFetch
 * @param {Object} responses - Map of URL patterns to responses
 * @returns {Function} Mock fetch function
 * @description Creates a mock fetch function for Vitest unit testing
 */
export const createMockFetch = (responses = {}) => {
  return vi.fn().mockImplementation((url, options = {}) => {
    // Find matching response
    const response = responses[url] || responses['*'] || createMockFetchResponse();
    
    // Return a promise that resolves to the response
    return Promise.resolve(response);
  });
};

/**
 * Create a mock timer for Vitest unit tests
 * @function createMockTimer
 * @returns {Object} Mock timer object
 * @description Creates a mock timer object for Vitest unit testing
 */
export const createMockTimer = () => ({
  setTimeout: vi.fn(),
  clearTimeout: vi.fn(),
  setInterval: vi.fn(),
  clearInterval: vi.fn(),
  setImmediate: vi.fn(),
  clearImmediate: vi.fn(),
  requestAnimationFrame: vi.fn(),
  cancelAnimationFrame: vi.fn(),
});

/**
 * Create a mock storage for Vitest unit tests
 * @function createMockStorage
 * @param {Object} initialData - Initial storage data
 * @returns {Object} Mock storage object
 * @description Creates a mock storage object for Vitest unit testing
 */
export const createMockStorage = (initialData = {}) => {
  const storage = new Map(Object.entries(initialData));
  
  return {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, value)),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    key: vi.fn((index) => Array.from(storage.keys())[index] || null),
    length: storage.size,
  };
};

/**
 * Create a mock location for Vitest unit tests
 * @function createMockLocation
 * @param {Object} overrides - Override values for the location
 * @returns {Object} Mock location object
 * @description Creates a mock location object for Vitest unit testing
 */
export const createMockLocation = (overrides = {}) => ({
  href: 'https://example.com',
  protocol: 'https:',
  host: 'example.com',
  hostname: 'example.com',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  origin: 'https://example.com',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  ...overrides
});

/**
 * Create a mock history for Vitest unit tests
 * @function createMockHistory
 * @returns {Object} Mock history object
 * @description Creates a mock history object for Vitest unit testing
 */
export const createMockHistory = () => ({
  length: 1,
  scrollRestoration: 'auto',
  state: null,
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn(),
});

/**
 * Create a mock navigator for Vitest unit tests
 * @function createMockNavigator
 * @param {Object} overrides - Override values for the navigator
 * @returns {Object} Mock navigator object
 * @description Creates a mock navigator object for Vitest unit testing
 */
export const createMockNavigator = (overrides = {}) => ({
  userAgent: 'Mozilla/5.0 (Test Browser)',
  language: 'en-US',
  languages: ['en-US', 'en'],
  cookieEnabled: true,
  onLine: true,
  platform: 'Win32',
  vendor: 'Test Vendor',
  maxTouchPoints: 0,
  hardwareConcurrency: 4,
  deviceMemory: 8,
  ...overrides
});

/**
 * Create a mock window for Vitest unit tests
 * @function createMockWindow
 * @param {Object} overrides - Override values for the window
 * @returns {Object} Mock window object
 * @description Creates a mock window object for Vitest unit testing
 */
export const createMockWindow = (overrides = {}) => ({
  innerWidth: 1024,
  innerHeight: 768,
  outerWidth: 1024,
  outerHeight: 768,
  screenX: 0,
  screenY: 0,
  scrollX: 0,
  scrollY: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  screenLeft: 0,
  screenTop: 0,
  scrollMaxX: 0,
  scrollMaxY: 0,
  length: 1,
  closed: false,
  frames: [],
  top: null,
  parent: null,
  opener: null,
  frameElement: null,
  navigator: createMockNavigator(),
  location: createMockLocation(),
  history: createMockHistory(),
  localStorage: createMockStorage(),
  sessionStorage: createMockStorage(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  postMessage: vi.fn(),
  print: vi.fn(),
  stop: vi.fn(),
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
  requestAnimationFrame: vi.fn(),
  cancelAnimationFrame: vi.fn(),
  requestIdleCallback: vi.fn(),
  cancelIdleCallback: vi.fn(),
  matchMedia: vi.fn(),
  moveTo: vi.fn(),
  moveBy: vi.fn(),
  resizeTo: vi.fn(),
  resizeBy: vi.fn(),
  scroll: vi.fn(),
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  getComputedStyle: vi.fn(),
  getSelection: vi.fn(),
  find: vi.fn(),
  getMatchedCSSRules: vi.fn(),
  ...overrides
}); 