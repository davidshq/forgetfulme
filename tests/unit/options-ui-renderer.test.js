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
        contentDiv.innerHTML = content;
        card.appendChild(contentDiv);
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
      addCustomStatus: vi.fn(),
      exportAllData: vi.fn(),
      importData: vi.fn(),
      clearAllData: vi.fn(),
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
      expect(configCard.querySelector('h2').textContent).toBe('Supabase Configuration');
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
      expect(statusCard.querySelector('h2').textContent).toBe('Custom Status Types');
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
      expect(bookmarkCard.querySelector('h2').textContent).toBe('Bookmark Management');
    });

    test('should clear appContainer before rendering', () => {
      appContainer.innerHTML = '<div>Old content</div>';

      renderMainInterface(appContainer, callbacks);

      expect(appContainer.innerHTML).not.toContain('Old content');
    });

    test('should return configStatusContainer reference', () => {
      const result = renderMainInterface(appContainer, callbacks);

      expect(result.configStatusContainer).toBeTruthy();
      expect(result.configStatusContainer.id).toBe('config-status-container');
    });

    test('should wire up addCustomStatus callback', () => {
      renderMainInterface(appContainer, callbacks);

      const form = appContainer.querySelector('#add-status-form');
      expect(form).toBeTruthy();

      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(callbacks.addCustomStatus).toHaveBeenCalled();
    });

    test('should wire up exportAllData callback', () => {
      renderMainInterface(appContainer, callbacks);

      const exportButton = Array.from(appContainer.querySelectorAll('button')).find(
        btn => btn.textContent === 'Export All Data',
      );
      expect(exportButton).toBeTruthy();

      exportButton.click();

      expect(callbacks.exportAllData).toHaveBeenCalled();
    });

    test('should wire up importData callback', () => {
      renderMainInterface(appContainer, callbacks);

      const importButton = Array.from(appContainer.querySelectorAll('button')).find(
        btn => btn.textContent === 'Import Data',
      );
      expect(importButton).toBeTruthy();

      importButton.click();

      expect(callbacks.importData).toHaveBeenCalled();
    });

    test('should wire up clearAllData callback', () => {
      renderMainInterface(appContainer, callbacks);

      const clearButton = Array.from(appContainer.querySelectorAll('button')).find(
        btn => btn.textContent === 'Clear All Data',
      );
      expect(clearButton).toBeTruthy();

      clearButton.click();

      expect(callbacks.clearAllData).toHaveBeenCalled();
    });

    test('should wire up openBookmarkManagement callback', () => {
      renderMainInterface(appContainer, callbacks);

      const manageButton = Array.from(appContainer.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Manage Bookmarks'),
      );
      expect(manageButton).toBeTruthy();

      manageButton.click();

      expect(callbacks.openBookmarkManagement).toHaveBeenCalled();
    });
  });
});
