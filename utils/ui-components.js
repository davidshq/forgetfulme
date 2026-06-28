/**
 * @fileoverview UI Components for ForgetfulMe extension
 * @module ui-components
 * @description Provides reusable UI components and DOM utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Import all component modules
import { DOM } from './components/dom-utils.js';
import { createButton } from './components/button-components.js';
import { createFormField, createForm } from './components/form-components.js';
import {
  createContainer,
  createSection,
} from './components/container-components.js';
import { createListItem } from './components/list-components.js';
import {
  createCard,
  createCardWithActions,
  createFormCard,
  createListCard,
} from './components/card-components.js';
import { createGrid } from './components/layout-components.js';
import {
  createConfirmDialog,
  showModal,
} from './components/modal-components.js';
import {
  createBreadcrumb,
  createHeaderWithNav,
} from './components/navigation-components.js';

/**
 * UI Components factory for ForgetfulMe Extension
 * @class UIComponents
 * @description Provides centralized component creation and DOM utilities for consistent UI patterns
 *
 * @example
 * // Create a button
 * const button = UIComponents.createButton('Click me', () => console.log('clicked'));
 *
 * // Use DOM utilities
 * const element = UIComponents.DOM.getElement('my-element');
 */
class UIComponents {
  /**
   * DOM utility class for safe element access and manipulation
   * @static
   * @namespace DOM
   * @description Provides safe DOM element access and manipulation utilities
   */
  static DOM = DOM;

  // Button components
  static createButton = createButton;

  // Form components
  static createFormField = createFormField;
  static createForm = createForm;

  // Container components
  static createContainer = createContainer;
  static createSection = createSection;

  // List components
  static createListItem = createListItem;

  // Card components
  static createCard = createCard;
  static createCardWithActions = createCardWithActions;
  static createFormCard = createFormCard;
  static createListCard = createListCard;

  // Layout components
  static createGrid = createGrid;

  // Modal components
  static createConfirmDialog = createConfirmDialog;
  static showModal = showModal;

  // Navigation components
  static createBreadcrumb = createBreadcrumb;
  static createHeaderWithNav = createHeaderWithNav;
}

// Export for use in other modules
export default UIComponents;
