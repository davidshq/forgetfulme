import { vi } from 'vitest';
import {
  createTestEnvironment,
  setupTestWithMocks,
  setupModuleMocks,
  createMockElement,
  setupPopupDOM,
  setupChromeTabs,
  setupBookmarkData,
} from './test-utils.js';

/**
 * Test factories for creating specialized test instances
 * 
 * These factories follow the recommended approach from ES_MODULE_MOCKING_ISSUE.md:
 * 1. Test individual utility modules separately (working approach)
 * 2. Use Playwright for integration testing (popup functionality)
 * 3. Focus on testing business logic in utility modules
 * 4. Accept ES module mocking limitations in Vitest
 * 
 * Provides consistent setup patterns for different module types
 */

/**
 * Creates a complete utility module test instance
 * 
 * This is the recommended approach for testing utility modules that have
 * dependencies. Instead of trying to mock ES modules in complex scenarios,
 * we test each utility module in isolation with proper mocking.
 * 
 * @param {string} modulePath - Path to the utility module
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete utility module test setup
 */
export const createUtilityTestInstance = async (modulePath, customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Setup module mocks
  setupModuleMocks(mocks);
  
  // Import the module under test AFTER mocking
  const UtilityModule = (await import(modulePath)).default;

  return {
    utilityModule: UtilityModule,
    mocks,
    cleanup,
  };
};

/**
 * Creates a complete auth UI test instance
 * 
 * Tests the AuthUI module which handles authentication forms and user interactions.
 * This module is tested in isolation with mocked dependencies.
 * 
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Promise<Object>} Complete auth UI test setup
 */
export const createAuthUITestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Create mock container
  const mockContainer = createMockElement('div', { id: 'test-container' });

  // Import the module under test AFTER mocking
  const AuthUI = (await import('../../auth-ui.js')).default;

  // Create auth UI instance
  const authUI = new AuthUI(
    mocks.supabaseConfig,
    vi.fn(), // onAuthSuccess
    mocks.authStateManager
  );

  return {
    authUI,
    mocks,
    container: mockContainer,
    cleanup,
  };
};

/**
 * Creates a complete background service test instance
 * 
 * Tests the background service which handles extension-wide functionality.
 * This module is tested in isolation with proper Chrome API mocking.
 * 
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Promise<Object>} Complete background service test setup
 */
export const createBackgroundTestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Setup module mocks
  setupModuleMocks(mocks);
  
  // Setup additional Chrome APIs for background service
  mocks.chrome.runtime.onMessage.addListener = vi.fn();
  mocks.chrome.storage.onChanged.addListener = vi.fn();
  mocks.chrome.action.setBadgeText = vi.fn();
  mocks.chrome.action.setBadgeBackgroundColor = vi.fn();

  // Import the module under test AFTER mocking
  const BackgroundService = (await import('../../background.js')).default;

  // Create background service instance
  const backgroundService = new BackgroundService();

  return {
    backgroundService,
    mocks,
    cleanup,
  };
};

/**
 * Creates a complete options page test instance
 * 
 * Tests the options page which handles extension configuration.
 * This module is tested in isolation with proper DOM mocking.
 * 
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Promise<Object>} Complete options page test setup
 */
export const createOptionsTestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Setup module mocks
  setupModuleMocks(mocks);
  
  // Setup DOM elements for options page
  const mockForm = createMockElement('form', { id: 'config-form' });
  const mockUrlInput = createMockElement('input', { id: 'supabase-url' });
  const mockKeyInput = createMockElement('input', { id: 'supabase-key' });
  const mockSaveBtn = createMockElement('button', { id: 'save-config' });
  const mockTestBtn = createMockElement('button', { id: 'test-connection' });

  // Setup DOM element mapping for options
  mocks.uiComponents.DOM.getElement.mockImplementation((id) => {
    const elementMap = {
      'config-form': mockForm,
      'supabase-url': mockUrlInput,
      'supabase-key': mockKeyInput,
      'save-config': mockSaveBtn,
      'test-connection': mockTestBtn,
    };
    return elementMap[id] || null;
  });

  // Import the module under test AFTER mocking
  const OptionsPage = (await import('../../options.js')).default;

  // Create options page instance
  const optionsPage = new OptionsPage();

  return {
    optionsPage,
    mocks,
    domElements: {
      form: mockForm,
      urlInput: mockUrlInput,
      keyInput: mockKeyInput,
      saveBtn: mockSaveBtn,
      testBtn: mockTestBtn,
    },
    cleanup,
  };
};

/**
 * Creates a complete config UI test instance
 * 
 * Tests the config UI which handles configuration interface.
 * This module is tested in isolation with proper DOM mocking.
 * 
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete config UI test setup
 */
export const createConfigUITestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Setup module mocks
  setupModuleMocks(mocks);
  
  // Create mock container
  const mockContainer = createMockElement('div', { id: 'config-container' });

  // Import the module under test AFTER mocking
  const ConfigUI = (await import('../../config-ui.js')).default;

  // Create config UI instance
  const configUI = new ConfigUI(mockContainer);

  return {
    configUI,
    mocks,
    container: mockContainer,
    cleanup,
  };
};

/**
 * Creates a complete supabase service test instance
 * 
 * Tests the Supabase service which handles database operations.
 * This module is tested in isolation with proper Supabase client mocking.
 * 
 * @param {Object} customMocks - Custom mocks to override defaults
 * @returns {Object} Complete supabase service test setup
 */
export const createSupabaseServiceTestInstance = async (customMocks = {}) => {
  const { mocks, cleanup } = setupTestWithMocks(customMocks);
  
  // Setup module mocks
  setupModuleMocks(mocks);
  
  // Setup Supabase client mock
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };

  // Mock the Supabase client creation
  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn().mockReturnValue(mockSupabaseClient),
  }));

  // Import the module under test AFTER mocking
  const SupabaseService = (await import('../../supabase-service.js')).default;

  // Create supabase service instance with config
  const supabaseService = new SupabaseService(mocks.supabaseConfig);

  return {
    supabaseService,
    mocks: {
      ...mocks,
      supabaseClient: mockSupabaseClient,
    },
    cleanup,
  };
};

/**
 * Creates test data for common scenarios
 */
export const createTestData = {
  /**
   * Creates sample bookmark data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample bookmark data
   */
  bookmark: (overrides = {}) => ({
    id: 'test-bookmark-id',
    url: 'https://example.com',
    title: 'Test Page',
    read_status: 'read',
    tags: ['test', 'example'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Creates sample user data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample user data
   */
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Creates sample tab data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample tab data
   */
  tab: (overrides = {}) => ({
    id: 1,
    url: 'https://example.com',
    title: 'Test Page',
    active: true,
    ...overrides,
  }),

  /**
   * Creates sample error data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} Sample error data
   */
  error: (overrides = {}) => ({
    message: 'Test error message',
    type: 'UNKNOWN',
    context: 'test',
    severity: 'MEDIUM',
    ...overrides,
  }),
};

/**
 * Creates assertion helpers for common test patterns
 */
export const createAssertionHelpers = (mocks) => ({
  /**
   * Asserts that error handling was called correctly
   * @param {string} expectedContext - Expected error context
   */
  assertErrorHandling: (expectedContext = 'test') => {
    expect(mocks.errorHandler.handle).toHaveBeenCalledWith(
      expect.any(Error),
      expectedContext
    );
    
    const errorResult = mocks.errorHandler.handle.mock.results[0].value;
    expect(mocks.uiMessages.error).toHaveBeenCalledWith(
      errorResult.userMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a success message was shown
   * @param {string} expectedMessage - Expected success message
   */
  assertSuccessMessage: (expectedMessage) => {
    expect(mocks.uiMessages.success).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a loading message was shown
   * @param {string} expectedMessage - Expected loading message
   */
  assertLoadingMessage: (expectedMessage) => {
    expect(mocks.uiMessages.loading).toHaveBeenCalledWith(
      expectedMessage,
      expect.anything()
    );
  },

  /**
   * Asserts that a bookmark was saved correctly
   * @param {Object} expectedBookmark - Expected bookmark data
   */
  assertBookmarkSaved: (expectedBookmark) => {
    expect(mocks.supabaseService.saveBookmark).toHaveBeenCalledWith(
      expect.objectContaining(expectedBookmark)
    );
  },

  /**
   * Asserts that a bookmark was updated correctly
   * @param {string} bookmarkId - Expected bookmark ID
   * @param {Object} expectedUpdates - Expected update data
   */
  assertBookmarkUpdated: (bookmarkId, expectedUpdates) => {
    expect(mocks.supabaseService.updateBookmark).toHaveBeenCalledWith(
      bookmarkId,
      expect.objectContaining(expectedUpdates)
    );
  },
}); 