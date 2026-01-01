/**
 * @fileoverview Bookmark list display component
 * @module components/bookmark-list
 * @description Handles rendering and display of bookmark lists
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import BookmarkTransformer from '../utils/bookmark-transformer.js';
import { formatStatus, formatTime } from '../utils/formatters.js';

/**
 * Bookmark list component
 * @class BookmarkList
 * @description Manages bookmark list display and rendering
 */
export class BookmarkList {
  /**
   * Create a bookmark list component
   * @param {Object} options - Configuration options
   * @param {Function} options.onEdit - Callback when bookmark is edited
   * @param {Function} options.onDelete - Callback when bookmark is deleted
   * @param {Function} options.onOpen - Callback when bookmark is opened
   * @param {Function} options.onSelectionChange - Callback when selection changes
   */
  constructor(options = {}) {
    this.onEdit = options.onEdit || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onOpen = options.onOpen || (() => {});
    this.onSelectionChange = options.onSelectionChange || (() => {});
  }

  /**
   * Display bookmarks in the list
   * @param {Array} bookmarks - Array of bookmark objects to display
   * @param {HTMLElement} container - Container element to render into
   */
  displayBookmarks(bookmarks, container) {
    if (!container) return;

    container.innerHTML = '';

    if (bookmarks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.setAttribute('role', 'status');
      emptyState.setAttribute('aria-live', 'polite');

      const emptyIcon = document.createElement('div');
      emptyIcon.style.fontSize = '48px';
      emptyIcon.style.marginBottom = '16px';
      emptyIcon.textContent = '📚';
      emptyState.appendChild(emptyIcon);

      const emptyTitle = document.createElement('h4');
      emptyTitle.textContent = 'No bookmarks found';
      emptyState.appendChild(emptyTitle);

      const emptyText = document.createElement('p');
      emptyText.textContent =
        'Try adjusting your search criteria or add some bookmarks from the extension popup.';
      emptyState.appendChild(emptyText);

      container.appendChild(emptyState);
      return;
    }

    // Convert to UI format and create list items
    const uiBookmarks = bookmarks.map(bookmark => BookmarkTransformer.toUIFormat(bookmark));

    uiBookmarks.forEach((bookmark, index) => {
      const listItem = this.createBookmarkListItem(bookmark, index);
      container.appendChild(listItem);
    });
  }

  /**
   * Create a bookmark list item with edit and delete actions
   * @param {Object} bookmark - The bookmark to display
   * @param {number} index - The index of the bookmark in the list
   * @returns {HTMLElement} The list item element
   */
  createBookmarkListItem(bookmark, index) {
    const listItem = document.createElement('div');
    listItem.className = 'bookmark-item';
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute('data-bookmark-id', bookmark.id);
    listItem.setAttribute('aria-label', `Bookmark ${index + 1}: ${bookmark.title}`);

    // Add checkbox for bulk selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bookmark-checkbox';
    checkbox.dataset.bookmarkId = bookmark.id;
    checkbox.setAttribute('aria-label', `Select ${bookmark.title} for bulk action`);
    checkbox.addEventListener('change', () => this.onSelectionChange());
    listItem.appendChild(checkbox);

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bookmark-content';

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'bookmark-title';
    titleDiv.textContent = bookmark.title;
    titleDiv.setAttribute('title', bookmark.title);
    contentDiv.appendChild(titleDiv);

    // Add meta information
    const metaDiv = document.createElement('div');
    metaDiv.className = 'bookmark-meta';

    // Add status badge
    const statusSpan = document.createElement('span');
    statusSpan.className = `bookmark-status status-${bookmark.status}`;
    statusSpan.textContent = formatStatus(bookmark.status);
    statusSpan.setAttribute('aria-label', `Status: ${formatStatus(bookmark.status)}`);
    metaDiv.appendChild(statusSpan);

    // Add time
    const timeSpan = document.createElement('span');
    timeSpan.className = 'bookmark-time';
    timeSpan.textContent = formatTime(new Date(bookmark.created_at).getTime());
    timeSpan.setAttribute(
      'aria-label',
      `Created ${formatTime(new Date(bookmark.created_at).getTime())}`,
    );
    metaDiv.appendChild(timeSpan);

    // Add tags if they exist
    if (bookmark.tags && bookmark.tags.length > 0) {
      const tagsSpan = document.createElement('span');
      tagsSpan.className = 'bookmark-tags';
      tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
      tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
      metaDiv.appendChild(tagsSpan);
    }

    contentDiv.appendChild(metaDiv);

    // Add action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'bookmark-actions';
    actionsDiv.setAttribute('role', 'group');
    actionsDiv.setAttribute('aria-label', `Actions for ${bookmark.title}`);

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = '✏️ Edit';
    editBtn.setAttribute('aria-label', `Edit bookmark: ${bookmark.title}`);
    editBtn.setAttribute('title', 'Edit bookmark');
    editBtn.addEventListener('click', () => this.onEdit(bookmark));
    actionsDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'contrast';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.setAttribute('aria-label', `Delete bookmark: ${bookmark.title}`);
    deleteBtn.setAttribute('title', 'Delete bookmark');
    deleteBtn.addEventListener('click', () => this.onDelete(bookmark.id, bookmark.title));
    actionsDiv.appendChild(deleteBtn);

    const openBtn = document.createElement('button');
    openBtn.className = 'secondary';
    openBtn.textContent = '🔗 Open';
    openBtn.setAttribute('aria-label', `Open bookmark: ${bookmark.title}`);
    openBtn.setAttribute('title', 'Open bookmark in new tab');
    openBtn.addEventListener('click', () => this.onOpen(bookmark.url));
    actionsDiv.appendChild(openBtn);

    contentDiv.appendChild(actionsDiv);
    listItem.appendChild(contentDiv);

    return listItem;
  }

  /**
   * Update a single bookmark item in the list
   * @param {Object} bookmark - The updated bookmark data
   * @param {HTMLElement} container - Container element containing the list
   * @description Updates only the specified bookmark item instead of re-rendering the entire list
   */
  updateBookmarkItem(bookmark, container) {
    if (!container) return;

    const uiBookmark = BookmarkTransformer.toUIFormat(bookmark);
    const existingItem = container.querySelector(`[data-bookmark-id="${bookmark.id}"]`);

    if (!existingItem) {
      // Item doesn't exist, add it
      const listItem = this.createBookmarkListItem(uiBookmark, container.children.length);
      // data-bookmark-id is already set in createBookmarkListItem
      container.appendChild(listItem);
      return;
    }

    // Update existing item
    const newItem = this.createBookmarkListItem(
      uiBookmark,
      Array.from(container.children).indexOf(existingItem),
    );
    // data-bookmark-id is already set in createBookmarkListItem
    existingItem.replaceWith(newItem);
  }

  /**
   * Remove a single bookmark item from the list
   * @param {string} bookmarkId - The ID of the bookmark to remove
   * @param {HTMLElement} container - Container element containing the list
   * @description Removes only the specified bookmark item instead of re-rendering the entire list
   */
  removeBookmarkItem(bookmarkId, container) {
    if (!container) return;

    const itemToRemove = container.querySelector(`[data-bookmark-id="${bookmarkId}"]`);
    if (itemToRemove) {
      itemToRemove.remove();

      // Update aria-label indices for remaining items
      const remainingItems = container.querySelectorAll('.bookmark-item');
      remainingItems.forEach((item, index) => {
        const title = item.querySelector('.bookmark-title')?.textContent || '';
        item.setAttribute('aria-label', `Bookmark ${index + 1}: ${title}`);
      });
    }
  }
}
