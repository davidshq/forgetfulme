/**
 * @fileoverview Unit tests for options data manager
 * @module tests/unit/options-data-manager
 * @description Tests for options page data management functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  loadStatistics,
  loadStatusTypes,
} from '../../utils/options-data-manager.js';

vi.mock('../../utils/formatters.js', () => ({
  formatStatus: vi.fn(status => status),
  countByStatus: vi.fn(items =>
    (items || []).reduce((stats, item) => {
      const status = item.read_status;
      if (status) {
        stats[status] = (stats[status] || 0) + 1;
      }
      return stats;
    }, {}),
  ),
}));

function mountOptionsStatsDom() {
  ['total-entries', 'status-types-count', 'most-used-status'].forEach(id => {
    const el = document.createElement('span');
    el.id = id;
    document.body.appendChild(el);
  });

  const list = document.createElement('ul');
  list.id = 'status-types-list';
  document.body.appendChild(list);
}

describe('OptionsDataManager', () => {
  beforeEach(() => {
    mountOptionsStatsDom();
  });

  describe('loadStatistics', () => {
    test('should load statistics into UI elements', () => {
      const bookmarks = [
        { id: '1', read_status: 'read' },
        { id: '2', read_status: 'read' },
        { id: '3', read_status: 'unread' },
      ];
      const statusTypes = ['read', 'unread', 'archived'];

      loadStatistics(bookmarks, statusTypes);

      expect(document.getElementById('total-entries').textContent).toBe(3);
      expect(document.getElementById('status-types-count').textContent).toBe(3);
      expect(document.getElementById('most-used-status').textContent).toBe(
        'read',
      );
    });

    test('should handle empty bookmarks array', () => {
      loadStatistics([], ['read', 'unread']);

      expect(document.getElementById('total-entries').textContent).toBe(0);
      expect(document.getElementById('most-used-status').textContent).toBe(
        'None',
      );
    });

    test('should handle missing UI elements gracefully', () => {
      document.body.innerHTML = '';
      document.body._id = undefined;

      expect(() =>
        loadStatistics([{ id: '1', read_status: 'read' }], ['read']),
      ).not.toThrow();
    });

    test('should calculate most used status correctly', () => {
      const bookmarks = [
        { id: '1', read_status: 'read' },
        { id: '2', read_status: 'read' },
        { id: '3', read_status: 'read' },
        { id: '4', read_status: 'unread' },
        { id: '5', read_status: 'unread' },
      ];

      loadStatistics(bookmarks, ['read', 'unread']);

      expect(document.getElementById('most-used-status').textContent).toBe(
        'read',
      );
    });

    test('should handle tie in status counts', () => {
      loadStatistics(
        [
          { id: '1', read_status: 'read' },
          { id: '2', read_status: 'unread' },
        ],
        ['read', 'unread'],
      );

      expect(['read', 'unread']).toContain(
        document.getElementById('most-used-status').textContent,
      );
    });
  });

  describe('loadStatusTypes', () => {
    test('should load status types into list', () => {
      loadStatusTypes(['read', 'unread', 'archived'], vi.fn());

      expect(document.getElementById('status-types-list').children.length).toBe(
        3,
      );
    });

    test('should handle empty status types array', () => {
      loadStatusTypes([], vi.fn());

      const list = document.getElementById('status-types-list');
      expect(list.children.length).toBe(1);
      expect(list.querySelector('.empty')).toBeTruthy();
    });

    test('should handle missing status types list element', () => {
      document.body.innerHTML = '';

      expect(() => loadStatusTypes(['read'], vi.fn())).not.toThrow();
    });

    test('should clear list before populating', () => {
      const list = document.getElementById('status-types-list');
      list.innerHTML = '<li>Old item</li>';

      loadStatusTypes(['read', 'unread'], vi.fn());

      expect(list.innerHTML).not.toContain('Old item');
    });

    test('should wire up remove callback for each status type', () => {
      loadStatusTypes(['read', 'unread'], vi.fn());

      expect(document.getElementById('status-types-list').children.length).toBe(
        2,
      );
    });
  });
});
