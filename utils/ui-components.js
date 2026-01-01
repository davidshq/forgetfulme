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
import {
  BUTTON_STYLES as BUTTON_STYLES_CONST,
  createButton,
} from './components/button-components.js';
import {
  FIELD_TYPES as FIELD_TYPES_CONST,
  createFormField,
  createForm,
} from './components/form-components.js';
import { createContainer, createSection } from './components/container-components.js';
import { createList, createListItem } from './components/list-components.js';
import {
  createCard,
  createCardWithActions,
  createFormCard,
  createListCard,
} from './components/card-components.js';
import {
  createLayoutContainer,
  createSidebarLayout,
  createGrid,
} from './components/layout-components.js';
import {
  createModal,
  createConfirmDialog,
  closeModal,
  showModal,
} from './components/modal-components.js';
import {
  createNavigation,
  createBreadcrumb,
  createNavMenu,
  createHeaderWithNav,
} from './components/navigation-components.js';
import {
  createProgressIndicator,
  createProgressBar,
  createLoadingState,
  setBusyState,
  createStatusIndicator,
  createTabs,
  switchTab,
  createTooltip,
  positionTooltip,
} from './components/utility-components.js';

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
  static COMPONENT_TYPES = {
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
   * Available button styles for consistent UI
   * @static
   * @type {Object}
   */
  static BUTTON_STYLES = BUTTON_STYLES_CONST;

  /**
   * Available form field types for form creation
   * @static
   * @type {Object}
   */
  static FIELD_TYPES = FIELD_TYPES_CONST;

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
  static createList = createList;
  static createListItem = createListItem;

  // Card components
  static createCard = createCard;
  static createCardWithActions = createCardWithActions;
  static createFormCard = createFormCard;
  static createListCard = createListCard;

  // Layout components
  static createLayoutContainer = createLayoutContainer;
  static createSidebarLayout = createSidebarLayout;
  static createGrid = createGrid;

  // Modal components
  static createModal = createModal;
  static createConfirmDialog = createConfirmDialog;
  static closeModal = closeModal;
  static showModal = showModal;

  // Navigation components
  static createNavigation = createNavigation;
  static createBreadcrumb = createBreadcrumb;
  static createNavMenu = createNavMenu;
  static createHeaderWithNav = createHeaderWithNav;

  // Utility components
  static createProgressIndicator = createProgressIndicator;
  static createProgressBar = createProgressBar;
  static createLoadingState = createLoadingState;
  static setBusyState = setBusyState;
  static createStatusIndicator = createStatusIndicator;
  static createTabs = createTabs;
  static switchTab = switchTab;
  static createTooltip = createTooltip;
  static positionTooltip = positionTooltip;
}

// Export for use in other modules
export default UIComponents;
