/**
 * @fileoverview Unit tests for options UI renderer
 * @module tests/unit/options-ui-renderer
 * @description Tests for options page UI rendering functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderMainInterface } from '../../utils/options-ui-renderer.js';

// Mock dependencies
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    createContainer: vi.fn((title, content, className) => {
      const container = document.createElement('div');
      container.className = className;
      const heading = document.createElement('h1');
      heading.textContent = title;
      container.appendChild(heading);
      return container;
    }),
    createCard: vi.fn((title, content, footer, className) => {
      const card = document.createElement('div');
      card.className = className;
      const heading = document.createElement('h2');
      heading.textContent = title;
      card.appendChild(heading);
      if (content) {
        const contentDiv = document.createElement('div');
        if (typeof content === 'string') {
          contentDiv.innerHTML = content;
        } else {
          contentDiv.appendChild(content);
        }
        card.appendChild(contentDiv);
      }
      if (footer) {
        const footerDiv = document.createElement('footer');
        if (typeof footer === 'string') {
          footerDiv.innerHTML = footer;
        } else {
          footerDiv.appendChild(footer);
        }
        card.appendChild(footerDiv);
      }
      return card;
    }),
    createGrid: vi.fn((items, options) => {
      const grid = document.createElement('div');
      grid.className = options?.className || 'grid';
      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid-item';
        itemDiv.textContent = item.text;
        if (item.className) {
          itemDiv.className += ` ${item.className}`;
        }
        grid.appendChild(itemDiv);
      });
      return grid;
    }),
    createForm: vi.fn((id, onSubmit, fields, options) => {
      const form = document.createElement('form');
      form.id = id;
      form.onsubmit = onSubmit;
      if (options) {
        Object.assign(form, options);
      }
      return form;
    }),
    createButton: vi.fn((text, onClick, type, options) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.onclick = onClick;
      button.className = type;
      if (options) {
        Object.assign(button, options);
      }
      return button;
    }),
    createCardWithActions: vi.fn((title, content, actions, className) => {
      const card = document.createElement('div');
      card.className = className;
      const heading = document.createElement('h2');
      heading.textContent = title;
      card.appendChild(heading);
      if (content) {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        card.appendChild(contentDiv);
      }
      actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.onclick = action.onClick;
        button.className = action.className;
        card.appendChild(button);
      });
      return card;
    }),
    DOM: {
      getElement: vi.fn(id => {
        if (id === 'config-status-container') {
          return document.createElement('div');
        }
        return null;
      }),
    },
  },
}));

describe('OptionsUIRenderer', () => {
  let appContainer;
  let callbacks;

  beforeEach(() => {
    vi.clearAllMocks();

    appContainer = document.createElement('div');
    callbacks = {
      addStatusType: vi.fn(),
      exportData: vi.fn(),
      openImportDialog: vi.fn(),
      clearData: vi.fn(),
      openBookmarkManagement: vi.fn(),
    };
  });

  describe('renderMainInterface', () => {
    test('should render main interface with all components', () => {
      const result = renderMainInterface(appContainer, callbacks);

      expect(result).toHaveProperty('configStatusContainer');
      expect(appContainer.querySelector('.main-container')).toBeTruthy();
    });

    test('should create config card', () => {
      renderMainInterface(appContainer, callbacks);

      const configCard = appContainer.querySelector('.config-card');
      expect(configCard).toBeTruthy();
      expect(configCard.querySelector('h2').textContent).toBe(
        'Supabase Configuration',
      );
    });

    test('should create stats card', () => {
      renderMainInterface(appContainer, callbacks);

      const statsCard = appContainer.querySelector('.stats-card');
      expect(statsCard).toBeTruthy();
      expect(statsCard.querySelector('h2').textContent).toBe('Statistics');
    });

    test('should create status types card', () => {
      renderMainInterface(appContainer, callbacks);

      const statusCard = appContainer.querySelector('.status-card');
      expect(statusCard).toBeTruthy();
      expect(statusCard.querySelector('h2').textContent).toBe(
        'Custom Status Types',
      );
    });

    test('should create data management card', () => {
      renderMainInterface(appContainer, callbacks);

      const dataCard = appContainer.querySelector('.data-card');
      expect(dataCard).toBeTruthy();
      expect(dataCard.querySelector('h2').textContent).toBe('Data Management');
    });

    test('should create bookmark management card', () => {
      renderMainInterface(appContainer, callbacks);

      const bookmarkCard = appContainer.querySelector('.bookmark-card');
      expect(bookmarkCard).toBeTruthy();
      expect(bookmarkCard.querySelector('h2').textContent).toBe(
        'Bookmark Management',
      );
    });

    test('should create account card when userEmail is provided', () => {
      renderMainInterface(appContainer, {
        ...callbacks,
        userEmail: 'user@example.com',
        signOut: vi.fn(),
      });

      const accountCard = appContainer.querySelector('.account-card');
      expect(accountCard).toBeTruthy();
      expect(
        accountCard.querySelector('.user-account-email')?.textContent,
      ).toBe('Signed in as user@example.com');
      expect(accountCard.querySelector('button')?.textContent).toBe('Sign Out');
    });

    test('should clear appContainer before rendering', () => {
      appContainer.innerHTML = '<div>Old content</div>';

      renderMainInterface(appContainer, callbacks);

      expect(appContainer.innerHTML).not.toContain('Old content');
    });

    // Callback wiring is covered by options-page-integration.test.js
  });
});
