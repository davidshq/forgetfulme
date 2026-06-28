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
    return (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    );
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
};
