/**
 * @fileoverview DOM utility mocks
 * @module mocks/ui-components-dom
 * @description DOM utility mocks for UIComponents
 */

import { vi } from 'vitest';

/**
 * Creates DOM utility mocks
 * @param {Object} document - Mock document object
 * @returns {Object} DOM utility mocks
 */
export const createDOMUtilities = document => ({
  DOM: {
    ready: vi.fn().mockResolvedValue(),
    isReady: vi.fn().mockReturnValue(true),
    getElement: vi.fn(id => {
      return document.getElementById(id);
    }),
    querySelector: vi.fn(selector => {
      return document.querySelector(selector);
    }),
    querySelectorAll: vi.fn(selector => {
      return document.querySelectorAll(selector);
    }),
    setValue: vi.fn((id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
        return true;
      }
      return false;
    }),
    getValue: vi.fn(id => {
      const element = document.getElementById(id);
      return element ? element.value : null;
    }),
  },
});
