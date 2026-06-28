/**
 * @fileoverview Shared ES module shapes for vi.mock() in page-level unit tests
 * @module vi-module-mocks
 * @description Factories used by popup, options, and bookmark-management unit tests.
 * Import via dynamic import inside vi.mock factories (Vitest hoists vi.mock above
 * static imports).
 */

import { vi } from 'vitest';
import { createStubUIComponents } from './mocks/ui-components.js';

/**
 * Wraps a methods factory in a mock class constructor for default-export classes.
 * @param {Function} methodsFactory
 * @returns {Function}
 */
export const createMockClass = methodsFactory =>
  class {
    constructor() {
      Object.assign(this, methodsFactory());
    }
  };

/** @returns {Object} ErrorHandler default export shape */
export const createErrorHandlerMock = () => ({
  handle: vi.fn(),
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

/** @returns {Object} UIMessages default export shape */
export const createUIMessagesMock = () => ({
  success: vi.fn(),
  error: vi.fn(),
  show: vi.fn(),
  confirm: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
});

/** @returns {Object} AuthStateManager instance methods */
export const createAuthStateManagerMock = () => ({
  initialize: vi.fn().mockResolvedValue(),
  isAuthenticated: vi.fn().mockResolvedValue(true),
  addListener: vi.fn(),
  setAuthState: vi.fn(),
  removeListener: vi.fn(),
});

/** @returns {Object} ConfigManager instance methods */
export const createConfigManagerMock = () => ({
  initialize: vi.fn().mockResolvedValue(),
  getCustomStatusTypes: vi.fn().mockResolvedValue([]),
  addCustomStatusType: vi.fn().mockResolvedValue(),
  removeCustomStatusType: vi.fn().mockResolvedValue(),
});

/** @returns {Object} BookmarkTransformer default export shape */
export const createBookmarkTransformerMock = () => ({
  toUIFormat: vi.fn(),
  fromCurrentTab: vi.fn(),
  normalizeTags: vi.fn(tags => {
    if (typeof tags === 'string') {
      return tags.trim()
        ? tags
            .trim()
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : [];
    }
    return tags;
  }),
});

/** @returns {Object} SupabaseConfig instance methods */
export const createSupabaseConfigMock = () => ({
  isConfigured: vi.fn().mockResolvedValue(true),
  initialize: vi.fn().mockResolvedValue(),
  getCurrentUser: vi.fn().mockReturnValue({ id: 'test-user-id' }),
  session: null,
});

/** @returns {Object} SupabaseService instance methods */
export const createSupabaseServiceMock = () => ({
  initialize: vi.fn().mockResolvedValue(),
  saveBookmark: vi.fn(),
  getBookmarks: vi.fn(),
  updateBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
  getBookmarkById: vi.fn(),
  exportData: vi.fn().mockResolvedValue({}),
  importData: vi.fn().mockResolvedValue(),
});

/** @returns {Object} AuthUI instance methods */
export const createAuthUIMock = () => ({
  showLoginForm: vi.fn(),
});

/** @returns {{ default: Object }} vi.mock module for ui-components.js */
export function mockUIComponentsModule() {
  return { default: createStubUIComponents() };
}

/** @returns {{ default: Object }} vi.mock module for error-handler.js */
export function mockErrorHandlerModule() {
  return { default: createErrorHandlerMock() };
}

/** @returns {{ default: Object }} vi.mock module for ui-messages.js */
export function mockUIMessagesModule() {
  return { default: createUIMessagesMock() };
}

/** @returns {{ default: Function }} vi.mock module for auth-state-manager.js */
export function mockAuthStateManagerModule() {
  return { default: createMockClass(createAuthStateManagerMock) };
}

/** @returns {{ default: Function }} vi.mock module for config-manager.js */
export function mockConfigManagerModule() {
  return { default: createMockClass(createConfigManagerMock) };
}

/** @returns {{ default: Object }} vi.mock module for bookmark-transformer.js */
export function mockBookmarkTransformerModule() {
  return { default: createBookmarkTransformerMock() };
}

/** @returns {{ default: Function }} vi.mock module for supabase-config.js */
export function mockSupabaseConfigModule() {
  return { default: createMockClass(createSupabaseConfigMock) };
}

/** @returns {{ default: Function }} vi.mock module for supabase-service.js */
export function mockSupabaseServiceModule() {
  return { default: createMockClass(createSupabaseServiceMock) };
}

/** @returns {{ default: Function }} vi.mock module for auth-ui.js */
export function mockAuthUIModule() {
  return { default: createMockClass(createAuthUIMock) };
}

/** Preset handle return value used by popup and bookmark-management tests */
export const PAGE_ERROR_HANDLER_RESULT = {
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
};

/**
 * Configures UIComponents stubs to return real JSDOM elements.
 * @param {Object} uiComponents - Mocked UIComponents default export
 * @param {Object} [options]
 * @param {Function} [options.getElement] - Custom DOM.getElement implementation
 */
export function configureUIComponentStubs(uiComponents, options = {}) {
  const createListCard = () => {
    const card = document.createElement('article');
    const cardList = document.createElement('div');
    cardList.className = 'card-list';
    card.appendChild(cardList);
    return card;
  };

  uiComponents.createButton.mockReturnValue(document.createElement('button'));
  uiComponents.createForm.mockReturnValue(document.createElement('form'));
  uiComponents.createFormField.mockReturnValue(document.createElement('input'));
  uiComponents.createSection.mockReturnValue(document.createElement('section'));
  uiComponents.createContainer.mockReturnValue(document.createElement('div'));
  uiComponents.createListItem.mockReturnValue(document.createElement('li'));
  uiComponents.createCard.mockReturnValue(document.createElement('article'));
  uiComponents.createFormCard.mockReturnValue(
    document.createElement('article'),
  );
  uiComponents.createListCard.mockImplementation(createListCard);
  uiComponents.createHeaderWithNav.mockReturnValue(
    document.createElement('header'),
  );
  uiComponents.createGrid?.mockReturnValue(document.createElement('div'));

  if (options.getElement) {
    uiComponents.DOM.getElement.mockImplementation(options.getElement);
  }
}
