import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBookmarkListItem } from '../../../../../bookmark-management/ui/render.js';

describe('Bookmark Management Button Handlers', () => {
  let container;
  let mockBookmark;
  let mockCallbacks;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Setup mock bookmark data
    mockBookmark = {
      id: 'test-bookmark-123',
      title: 'Test Bookmark',
      url: 'https://example.com',
      status: 'read',
      tags: ['test', 'example'],
      created_at: '2024-01-01',
      description: 'Test description'
    };

    // Setup mock callbacks
    mockCallbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onOpen: vi.fn(),
      updateBulkActions: vi.fn()
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('createBookmarkListItem', () => {
    it('should create bookmark item with all buttons', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      container.appendChild(listItem);

      // Check that all buttons exist
      const buttons = listItem.querySelectorAll('button');
      const editBtn = Array.from(buttons).find(btn => btn.textContent.includes('Edit'));
      const deleteBtn = Array.from(buttons).find(btn => btn.textContent.includes('Delete'));
      const openBtn = Array.from(buttons).find(btn => btn.textContent.includes('Open'));

      expect(editBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
      expect(openBtn).toBeTruthy();

      expect(editBtn.textContent).toBe('✏️ Edit');
      expect(deleteBtn.textContent).toBe('🗑️ Delete');
      expect(openBtn.textContent).toBe('🔗 Open');
    });

    it('should call onEdit callback when edit button is clicked', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      container.appendChild(listItem);

      const buttons = listItem.querySelectorAll('button');
      const editBtn = Array.from(buttons).find(btn => btn.textContent.includes('Edit'));
      editBtn.click();

      expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockBookmark);
    });

    it('should call onDelete callback with correct parameters when delete button is clicked', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      container.appendChild(listItem);

      const deleteBtn = listItem.querySelector('button.contrast');
      deleteBtn.click();

      expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onDelete).toHaveBeenCalledWith(
        mockBookmark.id,
        mockBookmark.title
      );
    });

    it('should call onOpen callback with URL when open button is clicked', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      container.appendChild(listItem);

      const buttons = listItem.querySelectorAll('button');
      const openBtn = Array.from(buttons).find(btn => btn.textContent.includes('Open'));
      openBtn.click();

      expect(mockCallbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onOpen).toHaveBeenCalledWith(mockBookmark.url);
    });

    it('should not attach event listeners when callbacks are not provided', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        updateBulkActions: mockCallbacks.updateBulkActions
        // Intentionally not providing onEdit, onDelete, onOpen
      });

      container.appendChild(listItem);

      const buttons = listItem.querySelectorAll('button');
      const editBtn = Array.from(buttons).find(btn => btn.textContent.includes('Edit'));
      const deleteBtn = Array.from(buttons).find(btn => btn.textContent.includes('Delete'));
      const openBtn = Array.from(buttons).find(btn => btn.textContent.includes('Open'));

      // Buttons should still exist
      expect(editBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
      expect(openBtn).toBeTruthy();

      // But clicking them should not throw errors
      expect(() => editBtn.click()).not.toThrow();
      expect(() => deleteBtn.click()).not.toThrow();
      expect(() => openBtn.click()).not.toThrow();

      // And callbacks should not have been called
      expect(mockCallbacks.onEdit).not.toHaveBeenCalled();
      expect(mockCallbacks.onDelete).not.toHaveBeenCalled();
      expect(mockCallbacks.onOpen).not.toHaveBeenCalled();
    });

    it('should call updateBulkActions when checkbox is changed', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      container.appendChild(listItem);

      const checkbox = listItem.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();

      // Simulate checkbox change
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      expect(mockCallbacks.updateBulkActions).toHaveBeenCalledTimes(1);
    });

    it('should set correct accessibility attributes', () => {
      const listItem = createBookmarkListItem({
        bookmark: mockBookmark,
        index: 0,
        ...mockCallbacks
      });

      const buttons = listItem.querySelectorAll('button');
      const editBtn = Array.from(buttons).find(btn => btn.textContent.includes('Edit'));
      const deleteBtn = Array.from(buttons).find(btn => btn.textContent.includes('Delete'));
      const openBtn = Array.from(buttons).find(btn => btn.textContent.includes('Open'));

      expect(editBtn.getAttribute('aria-label')).toBe(`Edit bookmark: ${mockBookmark.title}`);
      expect(deleteBtn.getAttribute('aria-label')).toBe(`Delete bookmark: ${mockBookmark.title}`);
      expect(openBtn.getAttribute('aria-label')).toBe(`Open bookmark: ${mockBookmark.title}`);
    });
  });
});