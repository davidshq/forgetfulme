/**
 * @fileoverview UIComponents mocks for Vitest setup
 * @module mocks/ui-components
 * @description Provides comprehensive UIComponents mocks for unit testing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createBasicComponents } from './ui-components-basic.js';
import { createCardComponents } from './ui-components-cards.js';
import { createNavigationComponents } from './ui-components-navigation.js';
import { createModalComponents } from './ui-components-modals.js';
import { createTabComponents } from './ui-components-tabs.js';
import { createDOMUtilities } from './ui-components-dom.js';

/**
 * Creates mock UIComponents object
 * @function createMockUIComponents
 * @param {Object} document - Mock document object
 * @returns {Object} Mock UIComponents object
 * @description Provides comprehensive UIComponents mocks for unit testing
 */
export const createMockUIComponents = document => ({
  ...createBasicComponents(document),
  ...createCardComponents(document),
  ...createNavigationComponents(document),
  ...createModalComponents(document),
  ...createTabComponents(document),
  ...createDOMUtilities(document),
});
