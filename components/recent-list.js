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
import UIComponents from '../utils/ui-components.js';
import { appendBookmarkMeta } from './bookmark-meta.js';

/**
 * Recent list component
 * @class RecentList
 * @description Manages recent bookmarks display
 */
export class RecentList {
  /**
   * Create a recent list component
   * @param {Object} [options={}] - Configuration options
   * @param {Function} [options.onPageChange] - Called with the target page number
   */
  constructor(options = {}) {
    this.container = null;
    this.paginationContainer = null;
    this.pageIndicator = null;
    this.prevButton = null;
    this.nextButton = null;
    this.currentPage = 1;
    this.hasNextPage = false;
    this.onPageChange = options.onPageChange || (() => {});
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

    const pagination = document.createElement('footer');
    pagination.className = 'recent-list-pagination';
    pagination.setAttribute('role', 'navigation');
    pagination.setAttribute('aria-label', 'Recent entries pagination');
    pagination.hidden = true;
    pagination.style.alignItems = 'center';
    pagination.style.justifyContent = 'space-between';
    pagination.style.gap = '0.5rem';
    pagination.style.marginTop = '0.75rem';
    recentCard.appendChild(pagination);
    this.paginationContainer = pagination;

    return recentCard;
  }

  /**
   * Display bookmarks in the list
   * @param {Array} bookmarks - Array of bookmark objects to display
   * @param {Object} [pagination={}] - Pagination state
   * @param {number} [pagination.page=1] - Current page number
   * @param {boolean} [pagination.hasNextPage=false] - Whether a next page exists
   */
  displayBookmarks(bookmarks, pagination = {}) {
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
      this.updatePagination({ page: 1, hasNextPage: false });
      return;
    }

    bookmarks.forEach((bookmark, index) => {
      const uiBookmark = BookmarkTransformer.toUIFormat(bookmark);
      const listItem = this.createRecentListItem(uiBookmark, index);
      this.container.appendChild(listItem);
    });

    this.updatePagination(pagination);
  }

  /**
   * Update pagination controls for the recent list
   * @param {Object} pagination - Pagination state
   * @param {number} pagination.page - Current page number
   * @param {boolean} pagination.hasNextPage - Whether a next page exists
   */
  updatePagination({ page = 1, hasNextPage = false } = {}) {
    if (!this.paginationContainer) {
      return;
    }

    this.currentPage = page;
    this.hasNextPage = hasNextPage;

    const showPagination = page > 1 || hasNextPage;
    this.paginationContainer.hidden = !showPagination;
    if (!showPagination) {
      this.paginationContainer.style.display = 'none';
      return;
    }

    this.paginationContainer.style.display = 'flex';
    this.paginationContainer.innerHTML = '';

    this.prevButton = UIComponents.createButton(
      '← Previous',
      () => this.onPageChange(page - 1),
      'outline secondary',
      { disabled: page <= 1 },
    );
    this.prevButton.setAttribute(
      'aria-label',
      'Previous page of recent entries',
    );

    this.pageIndicator = document.createElement('span');
    this.pageIndicator.className = 'recent-list-page-indicator';
    this.pageIndicator.setAttribute('aria-live', 'polite');
    this.pageIndicator.textContent = `Page ${page}`;

    this.nextButton = UIComponents.createButton(
      'Next →',
      () => this.onPageChange(page + 1),
      'outline secondary',
      { disabled: !hasNextPage },
    );
    this.nextButton.setAttribute('aria-label', 'Next page of recent entries');

    this.paginationContainer.appendChild(this.prevButton);
    this.paginationContainer.appendChild(this.pageIndicator);
    this.paginationContainer.appendChild(this.nextButton);
  }

  /**
   * Create a recent list item with proper accessibility
   * @param {Object} bookmark - The bookmark to display
   * @param {number} index - The index of the bookmark in the list
   * @returns {HTMLElement} The list item element
   */
  createRecentListItem(bookmark, index) {
    const listItem = document.createElement('div');
    listItem.className = 'recent-item';
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute(
      'aria-label',
      `Recent bookmark ${index + 1}: ${bookmark.title}`,
    );

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = bookmark.title;
    titleDiv.setAttribute('title', bookmark.title);
    listItem.appendChild(titleDiv);

    // Add meta information
    const metaDiv = document.createElement('div');
    appendBookmarkMeta(metaDiv, bookmark);

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

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.updatePagination({ page: 1, hasNextPage: false });

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
