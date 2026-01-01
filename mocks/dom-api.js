// DOM API mocks for vitest.setup.js refactor
// Defensive: Only allow this mock to be loaded in Vitest
if (typeof globalThis.vi !== 'undefined') {
  throw new Error('mocks/dom-api.js should only be loaded in Vitest test environment.');
}
import { vi } from 'vitest';

// Helper to create a mock DOM element
export const createMockElement = (tagName = 'div') => {
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
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    value: '',
    click: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      width: 100,
      height: 50,
    })),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    },
  };
  return element;
};

// Mock document
export const mockDocument = {
  createElement: vi.fn(tagName => createMockElement(tagName)),
  getElementById: vi.fn(() => null),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  body: createMockElement('body'),
  head: createMockElement('head'),
};

// Mock window
export const mockWindow = {
  document: mockDocument,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn(),
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
