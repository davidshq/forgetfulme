import { describe, test, expect, beforeEach, vi } from 'vitest';
import UIComponents from '../../../utils/ui-components.js';

describe('List Components Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Basic List Creation', () => {
    test('should create accessible list with items', () => {
      const items = [
        { id: '1', content: 'First bookmark', url: 'https://example1.com' },
        { id: '2', content: 'Second bookmark', url: 'https://example2.com' },
        { id: '3', content: 'Third bookmark', url: 'https://example3.com' },
      ];

      const list = UIComponents.createList({
        items,
        itemRenderer: item => `<a href="${item.url}">${item.content}</a>`,
      });

      // Test list structure
      expect(list.tagName).toBe('UL');
      expect(list.getAttribute('role')).toBe('list');

      const listItems = list.querySelectorAll('li');
      expect(listItems).toHaveLength(3);

      // Test first item
      const firstItem = listItems[0];
      expect(firstItem.getAttribute('role')).toBe('listitem');
      expect(firstItem.querySelector('a').href).toBe('https://example1.com/');
    });

    test('should create list with custom item actions', () => {
      const onItemClick = vi.fn();
      const onItemDelete = vi.fn();

      const items = [
        { id: '1', title: 'Test Bookmark', url: 'https://test.com' },
      ];

      const list = UIComponents.createList({
        items,
        itemRenderer: item => `
          <div class="bookmark-item">
            <span class="title">${item.title}</span>
            <button class="delete-btn" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        `,
        onItemClick,
        onItemDelete,
      });

      document.body.appendChild(list);

      // Test item click
      const bookmarkItem = list.querySelector('.bookmark-item');
      bookmarkItem.click();
      expect(onItemClick).toHaveBeenCalled();

      // Test delete action
      const deleteBtn = list.querySelector('.delete-btn');
      deleteBtn.click();
      expect(onItemDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Interactive List Items', () => {
    test('should create selectable list items', () => {
      const onSelectionChange = vi.fn();
      const items = [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
        { id: '3', title: 'Item 3' },
      ];

      const list = UIComponents.createList({
        items,
        selectable: true,
        multiSelect: true,
        onSelectionChange,
        itemRenderer: (item, options) => `
          <div class="selectable-item ${options.selected ? 'selected' : ''}">
            <input type="checkbox" ${options.selected ? 'checked' : ''} data-id="${item.id}">
            <span>${item.title}</span>
          </div>
        `,
      });

      document.body.appendChild(list);

      // Test selection
      const checkbox1 = list.querySelector('input[data-id="1"]');
      checkbox1.click();

      expect(onSelectionChange).toHaveBeenCalled();
    });

    test('should support keyboard navigation', () => {
      const items = [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
      ];

      const list = UIComponents.createList({
        items,
        keyboardNavigation: true,
        itemRenderer: item =>
          `<div tabindex="0" data-id="${item.id}">${item.title}</div>`,
      });

      document.body.appendChild(list);

      const item1 = list.querySelector('[data-id="1"]');
      const item2 = list.querySelector('[data-id="2"]');

      item1.focus();
      expect(document.activeElement).toBe(item1);

      // Test arrow key navigation
      const downArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      item1.dispatchEvent(downArrowEvent);
      item2.focus();
      expect(document.activeElement).toBe(item2);
    });
  });

  describe('List Item Templates', () => {
    test('should create bookmark list items with metadata', () => {
      const bookmarks = [
        {
          id: '1',
          title: 'Example Site',
          url: 'https://example.com',
          tags: ['web', 'example'],
          readStatus: 'read',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const list = UIComponents.createList({
        items: bookmarks,
        itemRenderer: bookmark => `
          <div class="bookmark-card">
            <h3 class="bookmark-title">${bookmark.title}</h3>
            <a href="${bookmark.url}" class="bookmark-url">${bookmark.url}</a>
            <div class="bookmark-meta">
              <span class="status status-${bookmark.readStatus}">${bookmark.readStatus}</span>
              <div class="tags">
                ${bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
              <time datetime="${bookmark.createdAt}">${new Date(bookmark.createdAt).toLocaleDateString()}</time>
            </div>
          </div>
        `,
      });

      // Test bookmark card structure
      const bookmarkCard = list.querySelector('.bookmark-card');
      expect(bookmarkCard).toBeTruthy();

      const title = bookmarkCard.querySelector('.bookmark-title');
      expect(title.textContent).toBe('Example Site');

      const url = bookmarkCard.querySelector('.bookmark-url');
      expect(url.href).toBe('https://example.com/');

      const status = bookmarkCard.querySelector('.status');
      expect(status.textContent).toBe('read');
      expect(status.classList.contains('status-read')).toBe(true);

      const tags = bookmarkCard.querySelectorAll('.tag');
      expect(tags).toHaveLength(2);
      expect(tags[0].textContent).toBe('web');
    });

    test('should handle empty lists gracefully', () => {
      const list = UIComponents.createList({
        items: [],
        emptyMessage: 'No bookmarks found',
        itemRenderer: item => `<div>${item.title}</div>`,
      });

      expect(list.tagName).toBe('UL');

      const emptyMessage = list.querySelector('.empty-message');
      expect(emptyMessage.textContent).toBe('No bookmarks found');
    });
  });

  describe('List Filtering and Sorting', () => {
    test('should filter list items based on criteria', () => {
      const items = [
        { id: '1', title: 'JavaScript Tutorial', category: 'programming' },
        { id: '2', title: 'Cooking Recipe', category: 'food' },
        { id: '3', title: 'React Guide', category: 'programming' },
      ];

      const list = UIComponents.createList({
        items,
        filter: item => item.category === 'programming',
        itemRenderer: item => `<div>${item.title}</div>`,
      });

      const listItems = list.querySelectorAll('li');
      expect(listItems).toHaveLength(2);

      // Should only show programming items
      expect(list.textContent).toContain('JavaScript Tutorial');
      expect(list.textContent).toContain('React Guide');
      expect(list.textContent).not.toContain('Cooking Recipe');
    });

    test('should sort list items', () => {
      const items = [
        { id: '1', title: 'Zebra', order: 3 },
        { id: '2', title: 'Apple', order: 1 },
        { id: '3', title: 'Banana', order: 2 },
      ];

      const list = UIComponents.createList({
        items,
        sortBy: (a, b) => a.order - b.order,
        itemRenderer: item => `<div data-id="${item.id}">${item.title}</div>`,
      });

      const listItems = list.querySelectorAll('li');
      expect(listItems[0].querySelector('[data-id="2"]')).toBeTruthy(); // Apple first
      expect(listItems[1].querySelector('[data-id="3"]')).toBeTruthy(); // Banana second
      expect(listItems[2].querySelector('[data-id="1"]')).toBeTruthy(); // Zebra last
    });
  });

  describe('Dynamic List Updates', () => {
    test('should add items dynamically', () => {
      const items = [{ id: '1', title: 'Initial Item' }];

      const list = UIComponents.createList({
        items,
        itemRenderer: item => `<div data-id="${item.id}">${item.title}</div>`,
      });

      document.body.appendChild(list);

      // Initial state
      expect(list.querySelectorAll('li')).toHaveLength(1);

      // Add new item
      const newItem = UIComponents.createListItem(
        {
          id: '2',
          title: 'New Item',
        },
        item => `<div data-id="${item.id}">${item.title}</div>`
      );

      list.appendChild(newItem);
      expect(list.querySelectorAll('li')).toHaveLength(2);
    });

    test('should remove items dynamically', () => {
      const items = [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
      ];

      const list = UIComponents.createList({
        items,
        itemRenderer: item => `
          <div data-id="${item.id}">
            ${item.title}
            <button class="remove-btn" onclick="this.closest('li').remove()">Remove</button>
          </div>
        `,
      });

      document.body.appendChild(list);

      // Initial state
      expect(list.querySelectorAll('li')).toHaveLength(2);

      // Remove item
      const removeBtn = list.querySelector('.remove-btn');
      removeBtn.click();

      expect(list.querySelectorAll('li')).toHaveLength(1);
    });
  });

  describe('List Accessibility', () => {
    test('should provide proper ARIA attributes', () => {
      const items = [{ id: '1', title: 'Accessible Item' }];

      const list = UIComponents.createList({
        items,
        ariaLabel: 'Bookmark list',
        itemRenderer: item => `<div>${item.title}</div>`,
      });

      expect(list.getAttribute('role')).toBe('list');
      expect(list.getAttribute('aria-label')).toBe('Bookmark list');

      const listItem = list.querySelector('li');
      expect(listItem.getAttribute('role')).toBe('listitem');
    });

    test('should support screen reader announcements', () => {
      const items = [{ id: '1', title: 'Test Item' }];

      const list = UIComponents.createList({
        items,
        announceUpdates: true,
        itemRenderer: item => `<div>${item.title}</div>`,
      });

      // Test aria-live region for dynamic updates
      const liveRegion = list.querySelector('[aria-live]');
      if (liveRegion) {
        expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      }
    });
  });
});
