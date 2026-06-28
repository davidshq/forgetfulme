/**
 * @fileoverview UIComponents constants for test mocks
 * @module mocks/ui-components-constants
 * @description Mirrors the public constants exported by utils/ui-components.js
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
  LIST_ITEM: 'list-item',
  MESSAGE: 'message',
  CONFIRM: 'confirm',
  TOAST: 'toast',
};

export const BUTTON_STYLES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  SMALL: 'small',
  LARGE: 'large',
};

export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  URL: 'url',
  NUMBER: 'number',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
};

/** Public static members on UIComponents (must stay in sync with utils/ui-components.js) */
export const UI_COMPONENTS_PUBLIC_MEMBERS = [
  'COMPONENT_TYPES',
  'BUTTON_STYLES',
  'FIELD_TYPES',
  'DOM',
  'createButton',
  'createFormField',
  'createForm',
  'createContainer',
  'createSection',
  'createListItem',
  'createCard',
  'createCardWithActions',
  'createFormCard',
  'createListCard',
  'createGrid',
  'createConfirmDialog',
  'showModal',
  'createBreadcrumb',
  'createHeaderWithNav',
];
