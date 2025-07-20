// Vitest setup file for ForgetfulMe Chrome Extension tests
import { vi } from 'vitest';

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
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
};

// Mock DOM utilities
global.document = {
  createElement: vi.fn((tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      innerHTML: '',
      style: {},
      children: [],
      parentNode: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      appendChild: vi.fn(function(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      }),
      removeChild: vi.fn(function(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
        }
        return child;
      }),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn()
    };
    
    // Mock form-specific methods
    if (tagName === 'form') {
      element.submit = vi.fn();
      element.reset = vi.fn();
    }
    
    // Mock input-specific methods
    if (tagName === 'input') {
      element.value = '';
      element.type = 'text';
      element.checked = false;
    }
    
    return element;
  }),
  getElementById: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 'complete'
};

// Mock window object
global.window = {
  ...global.window,
  document: global.document,
  location: {
    href: 'chrome-extension://test-id/popup.html',
    origin: 'chrome-extension://test-id'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn((callback, delay) => {
    const id = Math.random();
    setTimeout(callback, delay);
    return id;
  }),
  clearTimeout: vi.fn(),
  requestAnimationFrame: vi.fn((callback) => setTimeout(callback, 0)),
  cancelAnimationFrame: vi.fn()
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Helper function to create mock elements
global.createMockElement = (tagName, options = {}) => {
  const element = global.document.createElement(tagName);
  Object.assign(element, options);
  return element;
};

// Helper function to create mock form
global.createMockForm = (id, fields = []) => {
  const form = global.document.createElement('form');
  form.id = id;
  
  fields.forEach(field => {
    const input = global.document.createElement('input');
    input.id = field.id;
    input.type = field.type || 'text';
    input.value = field.value || '';
    input.required = field.required || false;
    form.appendChild(input);
  });
  
  return form;
};

// Helper function to simulate user input
global.simulateUserInput = (element, value) => {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

// Helper function to simulate form submission
global.simulateFormSubmit = (form) => {
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);
  return submitEvent;
};

// Helper function to simulate click
global.simulateClick = (element) => {
  element.dispatchEvent(new Event('click', { bubbles: true }));
};

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

// Mock UIMessages
global.UIMessages = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  clear: vi.fn()
};

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
      fieldElement.placeholder = field.options?.placeholder || '';
      form.appendChild(fieldElement);
    });
    
    const submitButton = global.document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = options.submitText || 'Submit';
    form.appendChild(submitButton);
    
    return form;
  }),
  createButton: vi.fn((text, onClick, className) => {
    const button = global.document.createElement('button');
    button.textContent = text;
    button.className = className;
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    return button;
  }),
  DOM: {
    getElement: vi.fn((id, container) => {
      return container?.getElementById?.(id) || global.document.getElementById(id);
    }),
    querySelector: vi.fn((selector, container) => {
      return container?.querySelector?.(selector) || global.document.querySelector(selector);
    }),
    getValue: vi.fn((id, container) => {
      const element = container?.getElementById?.(id) || global.document.getElementById(id);
      return element?.value || '';
    }),
    setValue: vi.fn((id, value, container) => {
      const element = container?.getElementById?.(id) || global.document.getElementById(id);
      if (element) {
        element.value = value;
      }
    }),
    ready: vi.fn(() => Promise.resolve())
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