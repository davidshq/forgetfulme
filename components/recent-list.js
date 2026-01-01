/**
 * @fileoverview Recent bookmarks list component
 * @module components/recent-list
 * @description Handles display of recent bookmarks in the popup
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import BookmarkTransformer from '../utils/bookmark-transformer.js';
import { formatStatus, formatTime } from '../utils/formatters.js';
import UIComponents from '../utils/ui-components.js';

/**
 * Recent list component
 * @class RecentList
 * @description Manages recent bookmarks display
 */
export class RecentList {
  /**
   * Create a recent list component
   */
  constructor() {
    this.container = null;
  }

  /**
   * Create recent list card
   * @returns {HTMLElement} The recent list card element
   */
  createCard() {
    const recentList = document.createElement('div');
    recentList.id = 'recent-list';
    recentList.setAttribute('role', 'list');
    recentList.setAttribute('aria-label', 'Recent bookmarks');
    this.container = recentList;

    const recentCard = UIComponents.createListCard(
      'Recent Entries',
      [], // Empty array initially, will be populated by loadRecentEntries
      {},
      'recent-entries-card',
    );
    // Replace the default list container with our custom one
    const cardList = recentCard.querySelector('.card-list');
    if (cardList) {
      cardList.innerHTML = '';
      cardList.appendChild(recentList);
    }

    return recentCard;
  }

  /**
   * Display bookmarks in the list
   * @param {Array} bookmarks - Array of bookmark objects to display
   */
  displayBookmarks(bookmarks) {
    if (!this.container) {
      this.container = UIComponents.DOM.getElement('recent-list');
    }
    if (!this.container) return;

    this.container.innerHTML = '';

    if (bookmarks.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'recent-item empty';
      emptyItem.setAttribute('role', 'listitem');
      emptyItem.setAttribute('aria-label', 'No recent entries');

      const emptyIcon = document.createElement('div');
      emptyIcon.textContent = '📚';
      emptyItem.appendChild(emptyIcon);

      const emptyTitle = document.createElement('div');
      emptyTitle.textContent = 'No entries yet';
      emptyItem.appendChild(emptyTitle);

      const emptyMeta = document.createElement('div');
      emptyMeta.innerHTML = '<small>No entries</small>';
      emptyItem.appendChild(emptyMeta);

      this.container.appendChild(emptyItem);
      return;
    }

    bookmarks.forEach((bookmark, index) => {
      const uiBookmark = BookmarkTransformer.toUIFormat(bookmark);
      const listItem = this.createRecentListItem(uiBookmark, index);
      this.container.appendChild(listItem);
    });
  }

  /**
   * Create a recent list item with proper accessibility
   * @param {Object} bookmark - The bookmark to display
   * @param {number} index - The index of the bookmark in the list
   * @returns {HTMLElement} The list item element
   */
  createRecentListItem(bookmark, index) {
    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute('aria-label', `Recent bookmark ${index + 1}: ${bookmark.title}`);

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = bookmark.title;
    titleDiv.setAttribute('title', bookmark.title);
    listItem.appendChild(titleDiv);

    // Add meta information
    const metaDiv = document.createElement('div');

    // Add status badge
    const statusSpan = document.createElement('small');
    statusSpan.textContent = formatStatus(bookmark.status);
    statusSpan.setAttribute('aria-label', `Status: ${formatStatus(bookmark.status)}`);
    metaDiv.appendChild(statusSpan);

    // Add time
    const timeSpan = document.createElement('small');
    timeSpan.textContent = formatTime(new Date(bookmark.created_at).getTime());
    timeSpan.setAttribute(
      'aria-label',
      `Created ${formatTime(new Date(bookmark.created_at).getTime())}`,
    );
    metaDiv.appendChild(timeSpan);

    // Add tags if they exist
    if (bookmark.tags && bookmark.tags.length > 0) {
      const tagsSpan = document.createElement('small');
      tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
      tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
      metaDiv.appendChild(tagsSpan);
    }

    listItem.appendChild(metaDiv);

    return listItem;
  }

  /**
   * Show error state
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.container) {
      this.container = UIComponents.DOM.getElement('recent-list');
    }
    if (!this.container) return;

    const errorItem = document.createElement('div');
    errorItem.setAttribute('role', 'listitem');
    errorItem.setAttribute('aria-label', 'Error loading entries');

    const errorTitle = document.createElement('div');
    errorTitle.textContent = message || 'Error loading entries';
    errorItem.appendChild(errorTitle);

    const errorMeta = document.createElement('div');
    errorMeta.innerHTML = '<small>Error</small>';
    errorItem.appendChild(errorMeta);

    this.container.appendChild(errorItem);
  }
}
