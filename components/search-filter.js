/**
 * @fileoverview Search and filter component for bookmarks
 * @module components/search-filter
 * @description Handles search and filter UI for bookmark management
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from '../utils/ui-components.js';

/**
 * Search and filter component
 * @class SearchFilter
 * @description Manages search and filter functionality
 */
export class SearchFilter {
  /**
   * Create a search filter component
   * @param {Object} options - Configuration options
   * @param {Function} options.onSearch - Callback when search is performed
   */
  constructor(options = {}) {
    this.onSearch = options.onSearch || (() => {});
  }

  /**
   * Create search and filter form
   * @returns {HTMLElement} The search card element
   */
  createSearchForm() {
    const searchForm = UIComponents.createForm(
      'search-form',
      e => {
        e.preventDefault();
        this.onSearch();
      },
      [
        {
          type: 'text',
          id: 'search-query',
          label: 'Search Bookmarks:',
          options: {
            placeholder: 'Search by title, URL, or tags...',
            helpText: 'Search through your bookmarks',
          },
        },
        {
          type: 'select',
          id: 'status-filter',
          label: 'Filter by Status:',
          options: {
            options: [
              { value: 'all', text: 'All Statuses' },
              { value: 'read', text: 'Read' },
              { value: 'good-reference', text: 'Good Reference' },
              { value: 'low-value', text: 'Low Value' },
              { value: 'revisit-later', text: 'Revisit Later' },
            ],
            helpText: 'Filter bookmarks by their status',
          },
        },
      ],
      {
        submitText: 'Search',
        className: 'search-form',
      },
    );

    const searchCard = UIComponents.createCard(
      'Search & Filter',
      searchForm.outerHTML,
      '',
      'search-card',
    );

    return searchCard;
  }

  /**
   * Get current search query
   * @returns {string} The search query
   */
  getSearchQuery() {
    return UIComponents.DOM.getValue('search-query') || '';
  }

  /**
   * Get current status filter
   * @returns {string} The status filter value
   */
  getStatusFilter() {
    return UIComponents.DOM.getValue('status-filter') || '';
  }

  /**
   * Get search filters as an object
   * @returns {Object} Filter object with search and status
   */
  getFilters() {
    const searchQuery = this.getSearchQuery();
    const statusFilter = this.getStatusFilter();

    const filters = { limit: 100 };

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    if (statusFilter && statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    return filters;
  }
}
