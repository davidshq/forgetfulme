/**
 * @fileoverview Vitest setup file for ForgetfulMe Chrome Extension tests
 * @module vitest-setup
 * @description Provides comprehensive mocking for Chrome APIs and DOM elements for unit testing
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { vi } from 'vitest';

/**
 * Mock console methods for testing
 * @type {Object}
 * @description Provides mocked console methods that can be tracked in tests
 */
global.console = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
};

/**
 * Mock Chrome API for testing
 * @type {Object}
 * @description Provides comprehensive mocking of Chrome extension APIs for unit testing
 */
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
    getURL: vi.fn(path => `chrome-extension://test-id/${path}`),
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
};

/**
 * Enhanced DOM element mock factory
 * @function createMockElement
 * @param {string} tagName - The HTML tag name for the element
 * @returns {Object} Mock DOM element with full functionality
 * @description Creates a comprehensive mock DOM element with event handling and DOM manipulation capabilities
 */
const createMockElement = tagName => {
  const element = {
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    parentNode: null,
    nextSibling: null,
    previousSibling: null,
    firstChild: null,
    lastChild: null,

    // Event handling
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(function (event) {
      // Actually call the event listeners
      const listeners = this._eventListeners || [];
      listeners.forEach(listener => {
        if (listener.type === event.type) {
          listener.handler.call(this, event);
        }
      });
      return true;
    }),

    // DOM manipulation
    appendChild: vi.fn(function (child) {
      if (child && typeof child === 'object') {
        // Ensure child has required properties
        if (!Object.prototype.hasOwnProperty.call(child, 'parentNode')) {
          child.parentNode = null;
        }
        if (!Object.prototype.hasOwnProperty.call(child, 'children')) {
          child.children = [];
        }

        child.parentNode = this;
        this.children.push(child);
        if (!this.firstChild) this.firstChild = child;
        this.lastChild = child;
      }
      return child;
    }),
    removeChild: vi.fn(function (child) {
      if (child && typeof child === 'object') {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          if (Object.prototype.hasOwnProperty.call(child, 'parentNode')) {
            child.parentNode = null;
          }
          if (this.firstChild === child) {
            this.firstChild = this.children[0] || null;
          }
          if (this.lastChild === child) {
            this.lastChild = this.children[this.children.length - 1] || null;
          }
        }
      }
      return child;
    }),
    insertBefore: vi.fn(function (newNode, referenceNode) {
      if (newNode && typeof newNode === 'object') {
        // Ensure newNode has required properties
        if (!Object.prototype.hasOwnProperty.call(newNode, 'parentNode')) {
          newNode.parentNode = null;
        }
        if (!Object.prototype.hasOwnProperty.call(newNode, 'children')) {
          newNode.children = [];
        }

        const index = referenceNode
          ? this.children.indexOf(referenceNode)
          : this.children.length;
        this.children.splice(index, 0, newNode);
        newNode.parentNode = this;
        if (!this.firstChild) this.firstChild = newNode;
        if (this.lastChild === referenceNode) this.lastChild = newNode;
      }
      return newNode;
    }),
    replaceChild: vi.fn(function (newChild, oldChild) {
      if (
        newChild &&
        typeof newChild === 'object' &&
        oldChild &&
        typeof oldChild === 'object'
      ) {
        // Ensure newChild has required properties
        if (!Object.prototype.hasOwnProperty.call(newChild, 'parentNode')) {
          newChild.parentNode = null;
        }
        if (!Object.prototype.hasOwnProperty.call(newChild, 'children')) {
          newChild.children = [];
        }

        const index = this.children.indexOf(oldChild);
        if (index > -1) {
          this.children[index] = newChild;
          if (Object.prototype.hasOwnProperty.call(oldChild, 'parentNode')) {
            oldChild.parentNode = null;
          }
          newChild.parentNode = this;
          if (this.firstChild === oldChild) this.firstChild = newChild;
          if (this.lastChild === oldChild) this.lastChild = newChild;
        }
      }
      return oldChild;
    }),

    // Query methods
    querySelector: vi.fn(function (selector) {
      // Return the first child that matches the selector
      for (const child of this.children) {
        if (
          child.className &&
          child.className.includes(selector.replace('.', ''))
        ) {
          return child;
        }
        if (
          child.tagName &&
          child.tagName.toLowerCase() === selector.toLowerCase()
        ) {
          return child;
        }
        // Check nested children
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    }),
    querySelectorAll: vi.fn(function (selector) {
      const results = [];
      const seen = new Set();

      const searchElement = element => {
        if (seen.has(element)) return;
        seen.add(element);

        // Handle class selectors
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (
            element.className &&
            element.className.split(' ').includes(className)
          ) {
            results.push(element);
          }
        }
        // Handle tag selectors
        else if (
          element.tagName &&
          element.tagName.toLowerCase() === selector.toLowerCase()
        ) {
          results.push(element);
        }

        // Search children
        for (const child of element.children) {
          searchElement(child);
        }
      };

      searchElement(this);
      return results;
    }),

    // Properties
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      width: 100,
      height: 50,
      right: 100,
      bottom: 50,
    })),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
      length: 0,
      value: '',
    },
    click: vi.fn(function () {
      const event = { type: 'click', target: this };
      this.dispatchEvent(event);
    }),
    focus: vi.fn(),
    blur: vi.fn(),
    select: vi.fn(),

    // Attributes
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    hasAttribute: vi.fn(),

    // Dimensions
    offsetWidth: 100,
    offsetHeight: 50,
    clientWidth: 100,
    clientHeight: 50,
    scrollWidth: 100,
    scrollHeight: 50,
    scrollLeft: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,

    // Node properties
    nodeType: 1,
    nodeName: tagName.toUpperCase(),
    nodeValue: null,

    // Form properties
    type:
      tagName.toLowerCase() === 'button'
        ? 'button'
        : tagName.toLowerCase() === 'textarea'
          ? 'textarea'
          : 'text',
    value: '',
    checked: false,
    required: false,
    disabled: false,

    // Methods
    cloneNode: vi.fn(function (deep = false) {
      const clone = createMockElement(this.tagName);
      clone.id = this.id;
      clone.className = this.className;
      clone.textContent = this.textContent;
      if (deep) {
        this.children.forEach(child => {
          clone.appendChild(child.cloneNode(true));
        });
      }
      return clone;
    }),
    matches: vi.fn(),
    closest: vi.fn(),

    // Event listener storage
    _eventListeners: [],
  };

  // Override addEventListener to store listeners
  element.addEventListener = vi.fn(function (type, handler) {
    this._eventListeners.push({ type, handler });
  });

  // Override setAttribute to register elements with IDs
  const originalSetAttribute = element.setAttribute;
  element.setAttribute = vi.fn(function (name, value) {
    if (name === 'id') {
      this.id = value;
      global.document.registerElement(value, this);
    }
    originalSetAttribute.call(this, name, value);
  });

  // Override id property to register elements
  Object.defineProperty(element, 'id', {
    get: function () {
      return this._id || '';
    },
    set: function (value) {
      this._id = value;
      if (value) {
        global.document.registerElement(value, this);
      }
    },
  });

  return element;
};

// Mock document
global.document = {
  createElement: vi.fn(tagName => createMockElement(tagName)),
  getElementById: vi.fn(id => {
    // Store elements by ID in a map
    if (!global.document._elementsById) {
      global.document._elementsById = new Map();
    }
    return global.document._elementsById.get(id) || null;
  }),
  getElementsByClassName: vi.fn(className => {
    return global.document.body.querySelectorAll(`.${className}`);
  }),
  getElementsByTagName: vi.fn(tagName => {
    return global.document.body.querySelectorAll(tagName);
  }),
  querySelector: vi.fn(selector => {
    return global.document.body.querySelector(selector);
  }),
  querySelectorAll: vi.fn(selector => {
    return global.document.body.querySelectorAll(selector);
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  body: createMockElement('body'),
  head: createMockElement('head'),
  documentElement: createMockElement('html'),

  // Helper method to register elements by ID
  registerElement: vi.fn((id, element) => {
    if (!global.document._elementsById) {
      global.document._elementsById = new Map();
    }
    global.document._elementsById.set(id, element);
  }),
};

// Mock window
global.window = {
  document: global.document,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn((callback, delay) => {
    const id = Math.random();
    setTimeout(callback, delay);
    return id;
  }),
  clearTimeout: vi.fn(),
  setInterval: vi.fn(),
  clearInterval: vi.fn(),
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
};

// Mock fetch
global.fetch = vi.fn();

// Mock ErrorHandler
global.ErrorHandler = {
  handle: vi.fn((error, context) => ({
    shouldShowToUser: true,
    userMessage: error.message || 'An error occurred',
    technicalMessage: error.message,
    context: context,
  })),
  createError: vi.fn((message, type, context) => ({
    message,
    type,
    context,
    name: 'Error',
  })),
  ERROR_TYPES: {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    STORAGE: 'storage',
    UNKNOWN: 'unknown',
  },
};

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset DOM
  global.document.body = global.document.createElement('body');
  global.document.head = global.document.createElement('head');

  // Reset Chrome API mocks
  Object.keys(global.chrome).forEach(key => {
    if (typeof global.chrome[key] === 'object' && global.chrome[key] !== null) {
      Object.keys(global.chrome[key]).forEach(subKey => {
        if (typeof global.chrome[key][subKey] === 'function') {
          global.chrome[key][subKey].mockClear();
        }
      });
    }
  });
});

// Cleanup after tests
afterEach(() => {
  // Clean up any remaining timeouts
  vi.clearAllTimers();
});
