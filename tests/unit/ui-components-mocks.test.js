import { describe, expect, test } from 'vitest';
import {
  createMockUIComponents,
  createStubUIComponents,
} from '../helpers/mocks/ui-components.js';
import { createMockDocument, createMockElement } from '../helpers/mocks/dom.js';

/** Public static members on UIComponents (must stay in sync with utils/ui-components.js) */
const UI_COMPONENTS_PUBLIC_MEMBERS = [
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

const getUnexpectedUIComponentMembers = mock => {
  const allowed = new Set(UI_COMPONENTS_PUBLIC_MEMBERS);
  return Object.keys(mock).filter(key => !allowed.has(key));
};

describe('UIComponents mocks', () => {
  test('createMockUIComponents exposes only the public facade', () => {
    const document = createMockDocument(createMockElement);
    const mock = createMockUIComponents(document);

    expect(getUnexpectedUIComponentMembers(mock)).toEqual([]);
  });

  test('createStubUIComponents exposes only the public facade', () => {
    const mock = createStubUIComponents();

    expect(getUnexpectedUIComponentMembers(mock)).toEqual([]);
  });
});
