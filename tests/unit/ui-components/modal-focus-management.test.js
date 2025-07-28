/**
 * @fileoverview Tests for enhanced modal focus management
 * @description Tests focus trap, focus restoration, and keyboard navigation in modals
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { ModalComponents } from '../../../utils/ui-components/modal-components.js';

// Mock ButtonComponents
vi.mock('../../../utils/ui-components/button-components.js', () => ({
  ButtonComponents: {
    createButton: vi.fn((text, onClick, className, options) => {
      const button = global.document?.createElement('button') || {
        textContent: text,
        className: className || '',
        addEventListener: vi.fn(),
        setAttribute: vi.fn(),
        style: {},
      };
      button.textContent = text;
      button.className = className || '';
      if (onClick) {
        button.addEventListener('click', onClick);
      }
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          button.setAttribute(key, value);
        });
      }
      return button;
    }),
  },
}));

describe('Modal Focus Management', () => {
  let dom;
  let document;
  let originalFocus;

  beforeEach(() => {
    // Create fresh DOM for each test
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <button id="trigger">Open Modal</button>
          <div id="content">Page content</div>
        </body>
      </html>
    `,
      {
        url: 'https://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
      }
    );

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(dom.window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });

    // Mock focus-related methods
    originalFocus = document.activeElement;

    // Add focus method to elements
    dom.window.Element.prototype.focus = vi.fn(function () {
      // Simulate focus by setting activeElement
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });
    });
  });

  afterEach(() => {
    // Clean up
    if (dom) {
      dom.window.close();
    }
  });

  describe('Focus Restoration', () => {
    it('should store and restore previous focus when modal closes', () => {
      // Arrange
      const triggerButton = document.getElementById('trigger');
      triggerButton.focus();
      expect(document.activeElement).toBe(triggerButton);

      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <h2>Test Modal</h2>
        <button id="modal-btn">Modal Button</button>
        <button id="close-btn">Close</button>
      `;

      // Act - show modal
      ModalComponents.showModal(modal);

      // Assert - previous focus stored
      expect(modal._previousFocus).toBe(triggerButton);

      // Act - close modal
      ModalComponents.closeModal(modal);

      // Assert - focus restored
      expect(document.activeElement).toBe(triggerButton);
      expect(modal._previousFocus).toBeUndefined();
    });

    it('should handle focus restoration gracefully when element no longer exists', () => {
      // Arrange
      const triggerButton = document.getElementById('trigger');
      triggerButton.focus();

      const modal = document.createElement('dialog');
      modal.innerHTML = '<button>Test</button>';

      // Show modal
      ModalComponents.showModal(modal);

      // Remove the trigger button (simulate DOM change)
      triggerButton.remove();

      // Act & Assert - should not throw error
      expect(() => {
        ModalComponents.closeModal(modal);
      }).not.toThrow();
    });
  });

  describe('Focus Trap', () => {
    it('should create focus trap for modal with multiple focusable elements', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <button id="first-btn">First</button>
        <input id="input" type="text">
        <button id="last-btn">Last</button>
      `;

      // Act
      ModalComponents.showModal(modal);

      // Assert - focus trap handler should be attached
      expect(modal._tabTrapHandler).toBeDefined();
      expect(typeof modal._tabTrapHandler).toBe('function');
    });

    it('should cycle focus from last to first element on Tab', () => {
      // Arrange
      const modal = document.createElement('dialog');
      const firstBtn = document.createElement('button');
      const lastBtn = document.createElement('button');

      firstBtn.id = 'first';
      lastBtn.id = 'last';

      modal.appendChild(firstBtn);
      modal.appendChild(lastBtn);

      ModalComponents.showModal(modal);

      // Simulate focus on last element
      lastBtn.focus();

      // Act - simulate Tab key
      const tabEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
      });

      // Mock preventDefault
      tabEvent.preventDefault = vi.fn();

      modal.dispatchEvent(tabEvent);

      // Assert - should prevent default and focus first element
      expect(tabEvent.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(firstBtn);
    });

    it('should cycle focus from first to last element on Shift+Tab', () => {
      // Arrange
      const modal = document.createElement('dialog');
      const firstBtn = document.createElement('button');
      const lastBtn = document.createElement('button');

      firstBtn.id = 'first';
      lastBtn.id = 'last';

      modal.appendChild(firstBtn);
      modal.appendChild(lastBtn);

      ModalComponents.showModal(modal);

      // Simulate focus on first element
      firstBtn.focus();

      // Act - simulate Shift+Tab key
      const tabEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });

      tabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(tabEvent);

      // Assert - should prevent default and focus last element
      expect(tabEvent.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(lastBtn);
    });

    it('should clean up focus trap when modal closes', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = '<button>Test</button>';

      ModalComponents.showModal(modal);
      expect(modal._tabTrapHandler).toBeDefined();

      // Act
      ModalComponents.closeModal(modal);

      // Assert
      expect(modal._tabTrapHandler).toBeUndefined();
    });
  });

  describe('Initial Focus', () => {
    it('should focus primary button when available', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <button class="secondary">Secondary</button>
        <button id="primary">Primary</button>
        <button class="contrast">Contrast</button>
      `;

      // Act
      ModalComponents.showModal(modal);

      // Assert - should focus primary button (no secondary/contrast class)
      expect(document.activeElement.id).toBe('primary');
    });

    it('should focus first button if no primary button exists', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <button id="first" class="secondary">First</button>
        <button class="contrast">Second</button>
      `;

      // Act
      ModalComponents.showModal(modal);

      // Assert
      expect(document.activeElement.id).toBe('first');
    });

    it('should focus first focusable element if no buttons exist', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = `
        <h2>Title</h2>
        <input id="input" type="text">
        <a href="#" id="link">Link</a>
      `;

      // Act
      ModalComponents.showModal(modal);

      // Assert
      expect(document.activeElement.id).toBe('input');
    });

    it('should focus modal itself if no focusable elements exist', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = '<p>Just text content</p>';

      // Act
      ModalComponents.showModal(modal);

      // Assert
      expect(document.activeElement).toBe(modal);
      expect(modal.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key', () => {
      // Arrange
      const modal = document.createElement('dialog');
      modal.innerHTML = '<button>Test</button>';

      ModalComponents.showModal(modal);
      expect(modal._escapeHandler).toBeDefined();

      // Verify modal is shown initially
      expect(
        modal.classList.contains('modal-open') ||
          modal.style.display === 'block'
      ).toBe(true);

      // Act - simulate Escape key
      const escapeEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      document.dispatchEvent(escapeEvent);

      // Assert - modal should be closed (verify cleanup happened)
      expect(modal._escapeHandler).toBeUndefined();
      expect(modal.style.display).toBe('none');
    });
  });
});
