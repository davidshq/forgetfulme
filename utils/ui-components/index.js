/**
 * @fileoverview UI Components index for ForgetfulMe extension
 * @module ui-components
 * @description Main entry point for all UI components
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Import all component modules
import { DOM } from './dom-utilities.js';
import { ButtonComponents, BUTTON_STYLES } from './button-components.js';
import { FormComponents, FIELD_TYPES } from './form-components.js';
import { ContainerComponents } from './container-components.js';
import { ModalComponents } from './modal-components.js';
import { NavigationComponents } from './navigation-components.js';

/**
 * Available component types for UI creation
 * @static
 * @type {Object}
 * @property {string} BUTTON - Button component type
 * @property {string} FORM - Form component type
 * @property {string} INPUT - Input component type
 * @property {string} SELECT - Select component type
 * @property {string} LABEL - Label component type
 * @property {string} CONTAINER - Container component type
 * @property {string} HEADER - Header component type
 * @property {string} SECTION - Section component type
 * @property {string} LIST - List component type
 * @property {string} LIST_ITEM - List item component type
 * @property {string} MESSAGE - Message component type
 * @property {string} CONFIRM - Confirmation dialog component type
 * @property {string} TOAST - Toast notification component type
 */
export const COMPONENT_TYPES = {
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
};

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
export class UIComponents {
  // Re-export constants for backward compatibility
  static COMPONENT_TYPES = COMPONENT_TYPES;
  static BUTTON_STYLES = BUTTON_STYLES;
  static FIELD_TYPES = FIELD_TYPES;

  // Re-export DOM utilities
  static DOM = DOM;

  // Re-export button methods
  static createButton = ButtonComponents.createButton;

  // Re-export form methods
  static createFormField = FormComponents.createFormField;
  static createForm = FormComponents.createForm;

  // Re-export container methods
  static createContainer = ContainerComponents.createContainer;
  static createList = ContainerComponents.createList;
  static createListItem = ContainerComponents.createListItem;
  static createSection = ContainerComponents.createSection;
  static createCard = ContainerComponents.createCard;
  static createCardWithActions = ContainerComponents.createCardWithActions;
  static createFormCard = ContainerComponents.createFormCard;
  static createListCard = ContainerComponents.createListCard;
  static createLayoutContainer = ContainerComponents.createLayoutContainer;
  static createSidebarLayout = ContainerComponents.createSidebarLayout;
  static createGrid = ContainerComponents.createGrid;

  // Re-export modal methods
  static createConfirmDialog = ModalComponents.createConfirmDialog;
  static createModal = ModalComponents.createModal;
  static closeModal = ModalComponents.closeModal;
  static showModal = ModalComponents.showModal;
  static createTooltip = ModalComponents.createTooltip;
  static positionTooltip = ModalComponents.positionTooltip;
  static createProgressIndicator = ModalComponents.createProgressIndicator;
  static createProgressBar = ModalComponents.createProgressBar;
  static createLoadingState = ModalComponents.createLoadingState;
  static setBusyState = ModalComponents.setBusyState;
  static createStatusIndicator = ModalComponents.createStatusIndicator;
  static createTabs = ModalComponents.createTabs;
  static switchTab = ModalComponents.switchTab;

  // Re-export navigation methods
  static createNavigation = NavigationComponents.createNavigation;
  static createBreadcrumb = NavigationComponents.createBreadcrumb;
  static createNavMenu = NavigationComponents.createNavMenu;
  static createHeaderWithNav = NavigationComponents.createHeaderWithNav;
}

// Export individual component classes for modular usage
export { DOM } from './dom-utilities.js';
export { ButtonComponents, BUTTON_STYLES } from './button-components.js';
export { FormComponents, FIELD_TYPES } from './form-components.js';
export { ContainerComponents } from './container-components.js';
export { ModalComponents } from './modal-components.js';
export { NavigationComponents } from './navigation-components.js';

// Default export for backward compatibility
export default UIComponents; 