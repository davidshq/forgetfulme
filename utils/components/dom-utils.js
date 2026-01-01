/**
 * @fileoverview DOM utility functions for safe element access and manipulation
 * @module components/dom-utils
 * @description Provides safe DOM element access and manipulation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from '../error-handler.js';

/**
 * DOM utility class for safe element access and manipulation
 * @namespace DOM
 * @description Provides safe DOM element access and manipulation utilities
 */
export const DOM = {
  /**
   * Check if DOM is ready
   * @returns {boolean} - True if DOM is ready
   */
  isReady() {
    return document.readyState === 'complete' || document.readyState === 'interactive';
  },

  /**
   * Wait for DOM to be ready
   * @returns {Promise} - Promise that resolves when DOM is ready
   */
  ready() {
    return new Promise(resolve => {
      if (this.isReady()) {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve, {
          once: true,
        });
      }
    });
  },

  /**
   * Safely get an element by ID
   * @param {string} id - Element ID
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {HTMLElement|null} - Element or null if not found
   */
  getElement(id, container = document) {
    try {
      return container.getElementById(id);
    } catch (error) {
      ErrorHandler.handle(error, 'ui-components.DOM.getElement');
      return null;
    }
  },

  /**
   * Safely get an element by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {HTMLElement|null} - Element or null if not found
   */
  querySelector(selector, container = document) {
    try {
      return container.querySelector(selector);
    } catch (error) {
      ErrorHandler.handle(error, 'ui-components.DOM.querySelector');
      return null;
    }
  },

  /**
   * Safely get multiple elements by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {NodeList} - Elements or empty NodeList
   */
  querySelectorAll(selector, container = document) {
    try {
      return container.querySelectorAll(selector);
    } catch (error) {
      ErrorHandler.handle(error, 'ui-components.DOM.querySelectorAll');
      return document.querySelectorAll(''); // Return empty NodeList
    }
  },

  /**
   * Check if an element exists
   * @param {string} id - Element ID
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {boolean} - True if element exists
   */
  elementExists(id, container = document) {
    return this.getElement(id, container) !== null;
  },

  /**
   * Wait for an element to exist
   * @param {string} id - Element ID
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {Promise<HTMLElement>} - Promise that resolves with element
   */
  waitForElement(id, timeout = 5000, container = document) {
    return new Promise((resolve, reject) => {
      const element = this.getElement(id, container);
      if (element) {
        resolve(element);
        return;
      }

      const startTime = Date.now();
      const checkElement = () => {
        const element = this.getElement(id, container);
        if (element) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element with id '${id}' not found within ${timeout}ms`));
          return;
        }

        requestAnimationFrame(checkElement);
      };

      requestAnimationFrame(checkElement);
    });
  },

  /**
   * Safely add event listener to element
   * @param {string} id - Element ID
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {boolean} - True if listener was added
   */
  addEventListener(id, event, handler, container = document) {
    const element = this.getElement(id, container);
    if (element) {
      element.addEventListener(event, handler);
      return true;
    }
    // Element with id not found
    return false;
  },

  /**
   * Safely set element value
   * @param {string} id - Element ID
   * @param {string} value - Value to set
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {boolean} - True if value was set
   */
  setValue(id, value, container = document) {
    const element = this.getElement(id, container);
    if (element) {
      element.value = value;
      return true;
    }
    // Element with id not found
    return false;
  },

  /**
   * Safely get element value
   * @param {string} id - Element ID
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {string|null} - Element value or null
   */
  getValue(id, container = document) {
    const element = this.getElement(id, container);
    return element ? element.value : null;
  },

  /**
   * Initialize elements safely with retry logic
   * @param {Object} elementMap - Object mapping property names to element IDs
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {Object} - Object with initialized elements
   */
  initializeElements(elementMap, container = document) {
    const elements = {};

    for (const [propertyName, elementId] of Object.entries(elementMap)) {
      elements[propertyName] = this.getElement(elementId, container);
    }

    return elements;
  },

  /**
   * Bind events safely with existence checks
   * @param {Array} eventBindings - Array of event binding objects
   * @param {HTMLElement} container - Container to search in (optional)
   * @returns {Array} - Array of successfully bound events
   */
  bindEvents(eventBindings, container = document) {
    const boundEvents = [];

    for (const binding of eventBindings) {
      const { elementId, event, handler, selector } = binding;

      let element = null;
      if (elementId) {
        element = this.getElement(elementId, container);
      } else if (selector) {
        element = this.querySelector(selector, container);
      }

      if (element) {
        element.addEventListener(event, handler);
        boundEvents.push({ element, event, handler });
      } else {
        // Element not found for binding
      }
    }

    return boundEvents;
  },
};
