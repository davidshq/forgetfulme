// Vitest setup file for ForgetfulMe Chrome Extension tests
import { vi } from 'vitest';

// Mock console methods
global.console = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
};

// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`)
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn()
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn()
  }
};

// Enhanced DOM element mock factory
const createMockElement = (tagName) => {
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
    dispatchEvent: vi.fn(function(event) {
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
    appendChild: vi.fn(function(child) {
      if (child && typeof child === 'object') {
        // Ensure child has required properties
        if (!child.hasOwnProperty('parentNode')) {
          child.parentNode = null;
        }
        if (!child.hasOwnProperty('children')) {
          child.children = [];
        }
        
        child.parentNode = this;
        this.children.push(child);
        if (!this.firstChild) this.firstChild = child;
        this.lastChild = child;
      }
      return child;
    }),
    removeChild: vi.fn(function(child) {
      if (child && typeof child === 'object') {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          if (child.hasOwnProperty('parentNode')) {
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
    insertBefore: vi.fn(function(newNode, referenceNode) {
      if (newNode && typeof newNode === 'object') {
        // Ensure newNode has required properties
        if (!newNode.hasOwnProperty('parentNode')) {
          newNode.parentNode = null;
        }
        if (!newNode.hasOwnProperty('children')) {
          newNode.children = [];
        }
        
        const index = referenceNode ? this.children.indexOf(referenceNode) : this.children.length;
        this.children.splice(index, 0, newNode);
        newNode.parentNode = this;
        if (!this.firstChild) this.firstChild = newNode;
        if (this.lastChild === referenceNode) this.lastChild = newNode;
      }
      return newNode;
    }),
    replaceChild: vi.fn(function(newChild, oldChild) {
      if (newChild && typeof newChild === 'object' && oldChild && typeof oldChild === 'object') {
        // Ensure newChild has required properties
        if (!newChild.hasOwnProperty('parentNode')) {
          newChild.parentNode = null;
        }
        if (!newChild.hasOwnProperty('children')) {
          newChild.children = [];
        }
        
        const index = this.children.indexOf(oldChild);
        if (index > -1) {
          this.children[index] = newChild;
          if (oldChild.hasOwnProperty('parentNode')) {
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
    querySelector: vi.fn(function(selector) {
      // Return the first child that matches the selector
      for (const child of this.children) {
        if (child.className && child.className.includes(selector.replace('.', ''))) {
          return child;
        }
        if (child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()) {
          return child;
        }
        // Check nested children
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    }),
    querySelectorAll: vi.fn(function(selector) {
      const results = [];
      const seen = new Set();
      
      const searchElement = (element) => {
        if (seen.has(element)) return;
        seen.add(element);
        
        // Handle class selectors
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (element.className && element.className.split(' ').includes(className)) {
            results.push(element);
          }
        }
        // Handle tag selectors
        else if (element.tagName && element.tagName.toLowerCase() === selector.toLowerCase()) {
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
      bottom: 50
    })),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
      length: 0,
      value: ''
    },
    click: vi.fn(function() {
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
    type: tagName.toLowerCase() === 'button' ? 'button' : 
          tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text',
    value: '',
    checked: false,
    required: false,
    disabled: false,
    
    // Methods
    cloneNode: vi.fn(function(deep = false) {
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
    _eventListeners: []
  };
  
  // Override addEventListener to store listeners
  element.addEventListener = vi.fn(function(type, handler) {
    this._eventListeners.push({ type, handler });
  });
  
  // Override setAttribute to register elements with IDs
  const originalSetAttribute = element.setAttribute;
  element.setAttribute = vi.fn(function(name, value) {
    if (name === 'id') {
      this.id = value;
      global.document.registerElement(value, this);
    }
    originalSetAttribute.call(this, name, value);
  });
  
  // Override id property to register elements
  Object.defineProperty(element, 'id', {
    get: function() {
      return this._id || '';
    },
    set: function(value) {
      this._id = value;
      if (value) {
        global.document.registerElement(value, this);
      }
    }
  });
  
  return element;
};

// Mock document
global.document = {
  createElement: vi.fn((tagName) => createMockElement(tagName)),
  getElementById: vi.fn((id) => {
    // Store elements by ID in a map
    if (!global.document._elementsById) {
      global.document._elementsById = new Map();
    }
    return global.document._elementsById.get(id) || null;
  }),
  getElementsByClassName: vi.fn((className) => {
    return global.document.body.querySelectorAll(`.${className}`);
  }),
  getElementsByTagName: vi.fn((tagName) => {
    return global.document.body.querySelectorAll(tagName);
  }),
  querySelector: vi.fn((selector) => {
    return global.document.body.querySelector(selector);
  }),
  querySelectorAll: vi.fn((selector) => {
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
  })
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
    hash: ''
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
};

// Mock fetch
global.fetch = vi.fn();

// Mock UIComponents
global.UIComponents = {
  createContainer: vi.fn((title, subtitle, className) => {
    const container = global.document.createElement('div');
    container.className = `ui-container ${className}`.trim();
    container.innerHTML = `
      <div class="ui-container-header">
        <h2>${title}</h2>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
    `;
    return container;
  }),
  createForm: vi.fn((id, onSubmit, fields, options) => {
    const form = global.document.createElement('form');
    form.id = id;
    form.className = options.className || '';
    
    fields.forEach(field => {
      const fieldElement = global.document.createElement('input');
      fieldElement.id = field.id;
      fieldElement.type = field.type;
      fieldElement.required = field.options?.required || false;
      form.appendChild(fieldElement);
    });
    
    if (onSubmit) {
      form.addEventListener('submit', onSubmit);
    }
    
    return form;
  }),
  createFormField: vi.fn((type, id, label, options) => {
    const fieldContainer = global.document.createElement('div');
    fieldContainer.className = 'ui-form-group';
    
    const labelElement = global.document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    fieldContainer.appendChild(labelElement);
    
    let fieldElement;
    if (type === 'select') {
      fieldElement = global.document.createElement('select');
      if (options.options) {
        options.options.forEach(option => {
          const optionEl = global.document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.text;
          if (option.selected) optionEl.selected = true;
          fieldElement.appendChild(optionEl);
        });
      }
    } else {
      fieldElement = global.document.createElement('input');
      fieldElement.type = type;
    }
    
    fieldElement.id = id;
    fieldElement.className = 'ui-form-control';
    fieldElement.required = options?.required || false;
    if (options?.placeholder) fieldElement.placeholder = options.placeholder;
    if (options?.value) fieldElement.value = options.value;
    if (options?.disabled) fieldElement.disabled = options.disabled;
    
    fieldContainer.appendChild(fieldElement);
    
    if (options?.helpText) {
      const helpElement = global.document.createElement('small');
      helpElement.textContent = options.helpText;
      fieldContainer.appendChild(helpElement);
    }
    
    return fieldContainer;
  }),
  createButton: vi.fn((text, onClick, options) => {
    const button = global.document.createElement('button');
    button.textContent = text;
    button.className = options?.className || 'ui-btn';
    button.type = 'button';
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    return button;
  }),
  createList: vi.fn((id) => {
    const list = global.document.createElement('div');
    list.id = id;
    list.className = 'list';
    return list;
  }),
  createListItem: vi.fn((data, options) => {
    const item = global.document.createElement('div');
    item.className = 'list-item';
    if (data.title) {
      const title = global.document.createElement('div');
      title.className = 'item-title';
      title.textContent = data.title;
      item.appendChild(title);
    }
    if (options?.template) {
      const template = global.document.createElement('span');
      template.textContent = options.template(data);
      item.appendChild(template);
    }
    return item;
  }),
  createSection: vi.fn((title) => {
    const section = global.document.createElement('div');
    section.className = 'section';
    if (title) {
      const titleElement = global.document.createElement('h3');
      titleElement.textContent = title;
      section.appendChild(titleElement);
    }
    return section;
  }),
  createModal: vi.fn((title, content, options) => {
    const modal = global.document.createElement('div');
    modal.className = 'ui-modal';
    modal.innerHTML = `
      <div class="ui-modal-header">
        <h2>${title}</h2>
        ${options?.showClose !== false ? '<button class="ui-modal-close">&times;</button>' : ''}
      </div>
      <div class="ui-modal-content">${content}</div>
    `;
    return modal;
  }),
  createConfirmDialog: vi.fn((title, message, onConfirm, onCancel) => {
    const dialog = global.document.createElement('div');
    dialog.className = 'ui-confirm';
    dialog.innerHTML = `
      <div class="ui-confirm-header">
        <h3>${title}</h3>
      </div>
      <div class="ui-confirm-content">${message}</div>
      <div class="ui-confirm-actions">
        <button class="ui-btn-primary">Confirm</button>
        <button class="ui-btn-secondary">Cancel</button>
      </div>
    `;
    
    const confirmBtn = dialog.querySelector('.ui-btn-primary');
    const cancelBtn = dialog.querySelector('.ui-btn-secondary');
    
    if (onConfirm) confirmBtn.addEventListener('click', onConfirm);
    if (onCancel) cancelBtn.addEventListener('click', onCancel);
    
    return dialog;
  }),
  createTabs: vi.fn((tabs, options) => {
    const container = global.document.createElement('div');
    container.className = options?.className || 'tab-container';
    
    const nav = global.document.createElement('div');
    nav.className = 'ui-tabs-nav';
    
    const content = global.document.createElement('div');
    content.className = 'ui-tabs-content';
    
    tabs.forEach((tab, index) => {
      const navItem = global.document.createElement('div');
      navItem.className = `ui-tab-nav-item ${index === 0 ? 'active' : ''}`;
      navItem.textContent = tab.title;
      nav.appendChild(navItem);
      
      const tabContent = global.document.createElement('div');
      tabContent.className = `ui-tab-content ${index === 0 ? 'active' : ''}`;
      tabContent.innerHTML = tab.content;
      content.appendChild(tabContent);
    });
    
    container.appendChild(nav);
    container.appendChild(content);
    return container;
  }),
  switchTab: vi.fn((container, tabIndex) => {
    const navItems = container.querySelectorAll('.ui-tab-nav-item');
    const contents = container.querySelectorAll('.ui-tab-content');
    
    navItems.forEach((item, index) => {
      if (index === tabIndex) {
        item.classList.add('active');
        contents[index].classList.add('active');
      } else {
        item.classList.remove('active');
        contents[index].classList.remove('active');
      }
    });
  }),
  showModal: vi.fn((modal) => {
    modal.classList.add('ui-modal-show');
  }),
  closeModal: vi.fn((modal) => {
    modal.classList.remove('ui-modal-show');
  }),
  createTooltip: vi.fn((element, text, position = 'top') => {
    const tooltip = global.document.createElement('div');
    tooltip.className = 'ui-tooltip';
    tooltip.textContent = text;
    return tooltip;
  }),
  DOM: {
    getElement: vi.fn((id) => {
      return global.document.getElementById(id);
    }),
    getElements: vi.fn((selector) => {
      return global.document.querySelectorAll(selector);
    }),
    querySelector: vi.fn((selector) => {
      return global.document.querySelector(selector);
    }),
    querySelectorAll: vi.fn((selector) => {
      return global.document.querySelectorAll(selector);
    }),
    initializeElements: vi.fn((elementMap) => {
      const result = { existing: {}, missing: {} };
      for (const [key, selector] of Object.entries(elementMap)) {
        const element = global.document.querySelector(selector);
        if (element) {
          result.existing[key] = element;
        } else {
          result.missing[key] = selector;
        }
      }
      return result;
    }),
    bindEvents: vi.fn((eventBindings) => {
      const results = [];
      for (const [selector, events] of Object.entries(eventBindings)) {
        const element = global.document.querySelector(selector);
        if (element) {
          for (const [eventType, handler] of Object.entries(events)) {
            element.addEventListener(eventType, handler);
            results.push({ success: true, element, eventType });
          }
        } else {
          results.push({ success: false, selector, eventType: Object.keys(events)[0] });
        }
      }
      return results;
    }),
    waitForElement: vi.fn((selector, timeout = 5000) => {
      return new Promise((resolve) => {
        const element = global.document.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          setTimeout(() => resolve(null), timeout);
        }
      });
    }),
    elementExists: vi.fn((selector) => {
      return global.document.querySelector(selector) !== null;
    }),
    addEventListener: vi.fn((selector, eventType, handler) => {
      const element = global.document.querySelector(selector);
      if (element) {
        element.addEventListener(eventType, handler);
        return true;
      }
      return false;
    }),
    setValue: vi.fn((id, value) => {
      const element = global.document.getElementById(id);
      if (element) {
        element.value = value;
        return true;
      }
      return false;
    }),
    getValue: vi.fn((id) => {
      const element = global.document.getElementById(id);
      return element ? element.value : null;
    })
  }
};

// Make UIComponents available globally
global.UIComponents = UIComponents;

// Mock setTimeout and setInterval to work synchronously in tests
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

global.setTimeout = vi.fn((callback, delay) => {
  const id = Math.random();
  if (delay === 0) {
    callback();
  } else {
    // Use the original setTimeout to avoid infinite recursion
    const timer = originalSetTimeout(callback, delay);
    return timer;
  }
  return id;
});

global.setInterval = vi.fn((callback, delay) => {
  const id = Math.random();
  // Use the original setInterval to avoid infinite recursion
  const timer = originalSetInterval(callback, delay);
  return timer;
});

global.clearTimeout = vi.fn();
global.clearInterval = vi.fn();

// Mock ErrorHandler
global.ErrorHandler = {
  handle: vi.fn((error, context) => ({
    shouldShowToUser: true,
    userMessage: error.message || 'An error occurred',
    technicalMessage: error.message,
    context: context
  })),
  createError: vi.fn((message, type, context) => ({
    message,
    type,
    context,
    name: 'Error'
  })),
  ERROR_TYPES: {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    STORAGE: 'storage',
    UNKNOWN: 'unknown'
  }
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