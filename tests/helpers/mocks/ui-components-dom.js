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
    getElement: vi.fn(id => {
      return document.getElementById(id);
    }),
    getElements: vi.fn(selector => {
      return document.querySelectorAll(selector);
    }),
    querySelector: vi.fn(selector => {
      return document.querySelector(selector);
    }),
    querySelectorAll: vi.fn(selector => {
      return document.querySelectorAll(selector);
    }),
    initializeElements: vi.fn(elementMap => {
      const result = { existing: {}, missing: {} };
      for (const [key, selector] of Object.entries(elementMap)) {
        const element = document.querySelector(selector);
        if (element) {
          result.existing[key] = element;
        } else {
          result.missing[key] = selector;
        }
      }
      return result;
    }),
    bindEvents: vi.fn(eventBindings => {
      const results = [];
      for (const [selector, events] of Object.entries(eventBindings)) {
        const element = document.querySelector(selector);
        if (element) {
          for (const [eventType, handler] of Object.entries(events)) {
            element.addEventListener(eventType, handler);
            results.push({ success: true, element, eventType });
          }
        } else {
          results.push({
            success: false,
            selector,
            eventType: Object.keys(events)[0],
          });
        }
      }
      return results;
    }),
    waitForElement: vi.fn((selector, timeout = 5000) => {
      return new Promise(resolve => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          setTimeout(() => resolve(null), timeout);
        }
      });
    }),
    elementExists: vi.fn(selector => {
      return document.querySelector(selector) !== null;
    }),
    addEventListener: vi.fn((selector, eventType, handler) => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener(eventType, handler);
        return true;
      }
      return false;
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
