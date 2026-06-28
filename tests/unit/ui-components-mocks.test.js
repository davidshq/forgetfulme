import { describe, expect, test } from 'vitest';
import {
  createMockUIComponents,
  createStubUIComponents,
  getUnexpectedUIComponentMembers,
} from '../helpers/mocks/ui-components.js';
import { createMockDocument, createMockElement } from '../helpers/mocks/dom.js';

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
