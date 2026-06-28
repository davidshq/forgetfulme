/**
 * @fileoverview UIComponents mocks for Vitest setup
 * @module mocks/ui-components
 * @description Mock factory matching the public UIComponents facade (utils/ui-components.js)
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';
import {
  BUTTON_STYLES,
  COMPONENT_TYPES,
  FIELD_TYPES,
  UI_COMPONENTS_PUBLIC_MEMBERS,
} from './ui-components-constants.js';
import { createBasicComponents } from './ui-components-basic.js';
import { createCardComponents } from './ui-components-cards.js';
import { createLayoutComponents } from './ui-components-layout.js';
import { createNavigationComponents } from './ui-components-navigation.js';
import { createModalComponents } from './ui-components-modals.js';
import { createDOMUtilities } from './ui-components-dom.js';

/**
 * Creates stub UIComponents with vi.fn() methods for tests that override behavior.
 * @returns {Object} Stub UIComponents matching the public facade shape
 */
export const createStubUIComponents = () => ({
  COMPONENT_TYPES,
  BUTTON_STYLES,
  FIELD_TYPES,
  DOM: {
    ready: vi.fn().mockResolvedValue(),
    isReady: vi.fn().mockReturnValue(true),
    getElement: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(),
  },
  createButton: vi.fn(),
  createFormField: vi.fn(),
  createForm: vi.fn(),
  createContainer: vi.fn(),
  createSection: vi.fn(),
  createListItem: vi.fn(),
  createCard: vi.fn(),
  createCardWithActions: vi.fn(),
  createFormCard: vi.fn(),
  createListCard: vi.fn(),
  createGrid: vi.fn(),
  createConfirmDialog: vi.fn(),
  showModal: vi.fn(),
  createBreadcrumb: vi.fn(),
  createHeaderWithNav: vi.fn(),
});

/**
 * Creates mock UIComponents object with lightweight DOM implementations
 * @function createMockUIComponents
 * @param {Object} document - Mock document object
 * @returns {Object} Mock UIComponents object matching the public facade
 */
export const createMockUIComponents = document => ({
  COMPONENT_TYPES,
  BUTTON_STYLES,
  FIELD_TYPES,
  ...createBasicComponents(document),
  ...createCardComponents(document),
  ...createLayoutComponents(document),
  ...createNavigationComponents(document),
  ...createModalComponents(document),
  ...createDOMUtilities(document),
});

/**
 * Asserts a mock object exposes only the public UIComponents surface.
 * @param {Object} mock - Mock UIComponents object
 * @returns {string[]} Unexpected member names, if any
 */
export const getUnexpectedUIComponentMembers = mock => {
  const allowed = new Set(UI_COMPONENTS_PUBLIC_MEMBERS);
  return Object.keys(mock).filter(key => !allowed.has(key));
};
