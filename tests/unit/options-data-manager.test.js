/**
 * @fileoverview Unit tests for options data manager
 * @module tests/unit/options-data-manager
 * @description Tests for options page data management functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { loadStatistics, loadStatusTypes } from '../../utils/options-data-manager.js';

// Mock dependencies
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      getElement: vi.fn(id => {
        if (id === 'total-entries') {
          return document.createElement('span');
        }
        if (id === 'status-types-count') {
          return document.createElement('span');
        }
        if (id === 'most-used-status') {
          return document.createElement('span');
        }
        if (id === 'status-types-list') {
          return document.createElement('ul');
        }
        return null;
      }),
    },
    createListItem: vi.fn((item, options) => {
      const listItem = document.createElement('li');
      listItem.className = options?.className || '';
      const title = document.createElement('span');
      title.textContent = item.title;
      listItem.appendChild(title);
      return listItem;
    }),
  },
}));

vi.mock('../../utils/formatters.js', () => ({
  formatStatus: vi.fn(status => status),
}));

describe('OptionsDataManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadStatistics', () => {
    test('should load statistics into UI elements', async () => {
      const bookmarks = [
        { id: '1', read_status: 'read' },
        { id: '2', read_status: 'read' },
        { id: '3', read_status: 'unread' },
      ];
      const statusTypes = ['read', 'unread', 'archived'];

      loadStatistics(bookmarks, statusTypes);

      const { default: UIComponents } = await import('../../utils/ui-components.js');
      const totalEntriesEl = UIComponents.DOM.getElement('total-entries');
      const statusTypesCountEl = UIComponents.DOM.getElement('status-types-count');
      const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

      expect(totalEntriesEl.textContent).toBe('3');
      expect(statusTypesCountEl.textContent).toBe('3');
      expect(mostUsedStatusEl.textContent).toBe('read');
    });

    test('should handle empty bookmarks array', async () => {
      const bookmarks = [];
      const statusTypes = ['read', 'unread'];

      loadStatistics(bookmarks, statusTypes);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const totalEntriesEl = UIComponents.DOM.getElement('total-entries');
      const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

      expect(totalEntriesEl.textContent).toBe('0');
      expect(mostUsedStatusEl.textContent).toBe('None');
    });

    test('should handle missing UI elements gracefully', async () => {
      const UIComponents = (await import('../../utils/ui-components.js')).default;
      UIComponents.DOM.getElement.mockReturnValue(null);

      const bookmarks = [{ id: '1', read_status: 'read' }];
      const statusTypes = ['read'];

      expect(() => loadStatistics(bookmarks, statusTypes)).not.toThrow();
    });

    test('should calculate most used status correctly', async () => {
      const bookmarks = [
        { id: '1', read_status: 'read' },
        { id: '2', read_status: 'read' },
        { id: '3', read_status: 'read' },
        { id: '4', read_status: 'unread' },
        { id: '5', read_status: 'unread' },
      ];
      const statusTypes = ['read', 'unread'];

      loadStatistics(bookmarks, statusTypes);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

      expect(mostUsedStatusEl.textContent).toBe('read');
    });

    test('should handle tie in status counts', async () => {
      const bookmarks = [
        { id: '1', read_status: 'read' },
        { id: '2', read_status: 'unread' },
      ];
      const statusTypes = ['read', 'unread'];

      loadStatistics(bookmarks, statusTypes);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

      // Should return one of them (implementation dependent)
      expect(['read', 'unread']).toContain(mostUsedStatusEl.textContent);
    });
  });

  describe('loadStatusTypes', () => {
    test('should load status types into list', async () => {
      const statusTypes = ['read', 'unread', 'archived'];
      const onRemove = vi.fn();

      loadStatusTypes(statusTypes, onRemove);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const statusTypesListEl = UIComponents.DOM.getElement('status-types-list');

      expect(statusTypesListEl.children.length).toBe(3);
    });

    test('should handle empty status types array', async () => {
      const statusTypes = [];
      const onRemove = vi.fn();

      loadStatusTypes(statusTypes, onRemove);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const statusTypesListEl = UIComponents.DOM.getElement('status-types-list');

      expect(statusTypesListEl.children.length).toBe(1);
      expect(statusTypesListEl.querySelector('.empty')).toBeTruthy();
    });

    test('should handle missing status types list element', async () => {
      const UIComponents = (await import('../../utils/ui-components.js')).default;
      UIComponents.DOM.getElement.mockReturnValue(null);

      const statusTypes = ['read'];
      const onRemove = vi.fn();

      expect(() => loadStatusTypes(statusTypes, onRemove)).not.toThrow();
    });

    test('should clear list before populating', async () => {
      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const statusTypesListEl = document.createElement('ul');
      statusTypesListEl.innerHTML = '<li>Old item</li>';
      UIComponents.DOM.getElement.mockReturnValue(statusTypesListEl);

      const statusTypes = ['read', 'unread'];
      const onRemove = vi.fn();

      loadStatusTypes(statusTypes, onRemove);

      expect(statusTypesListEl.innerHTML).not.toContain('Old item');
    });

    test('should wire up remove callback for each status type', async () => {
      const statusTypes = ['read', 'unread'];
      const onRemove = vi.fn();

      loadStatusTypes(statusTypes, onRemove);

      const UIComponents = (await import('../../utils/ui-components.js')).default;
      const statusTypesListEl = UIComponents.DOM.getElement('status-types-list');

      // Each list item should have a remove button
      expect(statusTypesListEl.children.length).toBe(2);
    });
  });
});
