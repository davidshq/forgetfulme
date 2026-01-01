/**
 * @fileoverview DOM mocks for Vitest setup
 * @module mocks/dom
 */

import { vi } from 'vitest';

// Helper functions
const hasOwnProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

const ensureChildProperties = child => {
  if (!hasOwnProperty(child, 'parentNode')) {
    child.parentNode = null;
  }
  if (!hasOwnProperty(child, 'children')) {
    child.children = [];
  }
};

const isValidChild = child => child && typeof child === 'object';

const updateFirstChild = (parent, child) => {
  if (!parent.firstChild) parent.firstChild = child;
};

const updateLastChild = (parent, child) => {
  parent.lastChild = child;
};

const updateFirstLastChild = (parent, child) => {
  updateFirstChild(parent, child);
  updateLastChild(parent, child);
};

const setParentNode = (child, parent) => {
  if (isValidChild(child)) {
    child.parentNode = parent;
  }
};

const clearParentNode = child => {
  if (hasOwnProperty(child, 'parentNode')) {
    child.parentNode = null;
  }
};

const registerElementById = (id, element) => {
  if (id && global.document && global.document.registerElement) {
    global.document.registerElement(id, element);
  }
};

const ensureAttributes = element => {
  if (!element._attributes) element._attributes = {};
};
const getClassList = className =>
  typeof className === 'string' ? className.split(' ').filter(c => c.length > 0) : [className];
const matchesSelector = (element, selector) => {
  if (!element || !selector) return false;

  // ID selector (#id)
  if (selector.startsWith('#')) {
    const id = selector.substring(1);
    return element.id === id || element._id === id;
  }

  // Class selector (.class)
  if (selector.startsWith('.')) {
    const className = selector.substring(1);
    if (element.className) {
      return getClassList(element.className).includes(className);
    }
    return false;
  }

  // Attribute selector ([attr] or [attr=value])
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const attrSelector = selector.slice(1, -1);
    if (attrSelector.includes('=')) {
      const [attr, value] = attrSelector.split('=').map(s => s.trim().replace(/^["']|["']$/g, ''));
      const elementValue = element.getAttribute?.(attr) || element._attributes?.[attr];
      return elementValue === value;
    } else {
      return (
        element.hasAttribute?.(attrSelector) || element._attributes?.[attrSelector] !== undefined
      );
    }
  }

  // Tag selector (element)
  if (element.tagName) {
    return element.tagName.toLowerCase() === selector.toLowerCase();
  }

  // Complex selector (e.g., "button.primary", "a[aria-current]")
  // Split by space for descendant selectors, but for now handle simple combinations
  if (selector.includes('.')) {
    const [tag, ...classes] = selector.split('.');
    if (tag && element.tagName && element.tagName.toLowerCase() !== tag.toLowerCase()) {
      return false;
    }
    if (classes.length > 0) {
      const classList = getClassList(element.className);
      return classes.every(cls => classList.includes(cls));
    }
  }

  return false;
};
const getFormType = tagName => {
  const lower = tagName.toLowerCase();
  return lower === 'button' ? 'button' : lower === 'textarea' ? 'textarea' : 'text';
};
const createStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

/** Enhanced DOM element mock factory */
export const createMockElement = tagName => {
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(function (event) {
      const listeners = this._eventListeners || [];
      listeners.forEach(listener => {
        if (listener.type === event.type) listener.handler.call(this, event);
      });
      return true;
    }),
    appendChild: vi.fn(function (child) {
      if (isValidChild(child)) {
        ensureChildProperties(child);
        if (!this.children) this.children = [];
        setParentNode(child, this);
        this.children.push(child);
        updateFirstLastChild(this, child);
      }
      return child;
    }),
    removeChild: vi.fn(function (child) {
      if (isValidChild(child)) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          clearParentNode(child);
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
      if (isValidChild(newNode)) {
        ensureChildProperties(newNode);
        const index = referenceNode ? this.children.indexOf(referenceNode) : this.children.length;
        this.children.splice(index, 0, newNode);
        setParentNode(newNode, this);
        updateFirstChild(this, newNode);
        if (this.lastChild === referenceNode) updateLastChild(this, newNode);
      }
      return newNode;
    }),
    replaceChild: vi.fn(function (newChild, oldChild) {
      if (isValidChild(newChild) && isValidChild(oldChild)) {
        ensureChildProperties(newChild);
        const index = this.children.indexOf(oldChild);
        if (index > -1) {
          this.children[index] = newChild;
          clearParentNode(oldChild);
          setParentNode(newChild, this);
          if (this.firstChild === oldChild) this.firstChild = newChild;
          if (this.lastChild === oldChild) this.lastChild = newChild;
        }
      }
      return oldChild;
    }),
    querySelector: vi.fn(function (selector) {
      // Check self first
      if (matchesSelector(this, selector)) return this;
      // Then check children
      if (!this.children || !Array.isArray(this.children)) return null;
      for (const child of this.children) {
        if (matchesSelector(child, selector)) return child;
        // Recursively search child's descendants
        if (child.querySelector) {
          const nested = child.querySelector(selector);
          if (nested) return nested;
        }
      }
      return null;
    }),
    querySelectorAll: vi.fn(function (selector) {
      const results = [];
      const seen = new Set();
      const searchElement = element => {
        if (!element || seen.has(element)) return;
        seen.add(element);
        if (matchesSelector(element, selector)) results.push(element);
        if (element.children && Array.isArray(element.children)) {
          for (const child of element.children) searchElement(child);
        }
      };
      // Search self and all descendants
      searchElement(this);
      return results;
    }),
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
      this.dispatchEvent({ type: 'click', target: this });
    }),
    focus: vi.fn(),
    blur: vi.fn(),
    select: vi.fn(),
    getAttribute: vi.fn(function (name) {
      return this._attributes?.[name] || null;
    }),
    setAttribute: vi.fn(function (name, value) {
      ensureAttributes(this);
      this._attributes[name] = value;
      if (name === 'id') {
        this.id = value;
        registerElementById(value, this);
      }
    }),
    removeAttribute: vi.fn(function (name) {
      if (this._attributes) delete this._attributes[name];
    }),
    hasAttribute: vi.fn(function (name) {
      return this._attributes?.[name] !== undefined;
    }),
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
    nodeType: 1,
    nodeName: tagName.toUpperCase(),
    nodeValue: null,
    type: getFormType(tagName),
    value: '',
    checked: false,
    required: false,
    disabled: false,
    cloneNode: vi.fn(function (deep = false) {
      const clone = createMockElement(this.tagName);
      Object.assign(clone, {
        id: this.id,
        className: this.className,
        textContent: this.textContent,
      });
      if (deep) {
        this.children.forEach(child => clone.appendChild(child.cloneNode(true)));
      }
      return clone;
    }),
    matches: vi.fn(),
    closest: vi.fn(),
    _eventListeners: [],
  };

  element.addEventListener = vi.fn(function (type, handler) {
    this._eventListeners.push({ type, handler });
  });
  Object.defineProperty(element, 'id', {
    get: function () {
      return this._id || '';
    },
    set: function (value) {
      this._id = value;
      registerElementById(value, this);
    },
  });
  return element;
};

/** Creates mock document object */
export const createMockDocument = createElementFn => {
  const body = createElementFn('body');
  const head = createElementFn('head');
  const documentElement = createElementFn('html');
  const elementsById = new Map();
  const document = {
    createElement: vi.fn(tagName => createElementFn(tagName)),
    getElementById: vi.fn(id => elementsById.get(id) || null),
    getElementsByClassName: vi.fn(className => body.querySelectorAll(`.${className}`)),
    getElementsByTagName: vi.fn(tagName => body.querySelectorAll(tagName)),
    querySelector: vi.fn(function (selector) {
      // Handle ID selector directly via getElementById for efficiency
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        return this.getElementById(id);
      }
      // Search in body (including body itself and all descendants)
      // Use this.body to get the current body reference (may be reset in beforeEach)
      const currentBody = this.body || body;
      if (matchesSelector(currentBody, selector)) {
        return currentBody;
      }
      return currentBody.querySelector(selector);
    }),
    querySelectorAll: vi.fn(function (selector) {
      const results = [];
      // Use this.body to get the current body reference (may be reset in beforeEach)
      const currentBody = this.body || body;
      // Check if body itself matches
      if (matchesSelector(currentBody, selector)) {
        results.push(currentBody);
      }
      // Search all descendants in body
      const bodyResults = currentBody.querySelectorAll(selector);
      bodyResults.forEach(result => {
        if (!results.includes(result)) {
          results.push(result);
        }
      });
      return results;
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    body,
    head,
    documentElement,
    _elementsById: elementsById,
    registerElement: vi.fn((id, element) => {
      elementsById.set(id, element);
    }),
  };
  return document;
};

/** Creates mock window object */
export const createMockWindow = document => ({
  document,
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
  localStorage: createStorage(),
  sessionStorage: createStorage(),
});
