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
import { buildStatusSelectOptions } from '../utils/formatters.js';
import {
  BOOKMARK_LIST_LIMIT,
  DEFAULT_STATUS_TYPES,
} from '../utils/constants.js';

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
   * Replace status filter options (e.g. after loading custom types from config).
   * @param {string[]} statusTypes
   */
  updateStatusFilterOptions(statusTypes) {
    const select = UIComponents.DOM.getElement('status-filter');
    if (!select) {
      return;
    }

    const currentValue = select.value || 'all';
    select.innerHTML = '';

    buildStatusSelectOptions(statusTypes, { includeAll: true }).forEach(
      option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.text;
        if (option.value === currentValue) {
          optionEl.selected = true;
        }
        select.appendChild(optionEl);
      },
    );
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
            options: buildStatusSelectOptions(DEFAULT_STATUS_TYPES, {
              includeAll: true,
            }),
            helpText: 'Filter bookmarks by their status',
          },
        },
      ],
      {
        submitText: 'Search',
        className: 'search-form',
      },
    );

    const searchCard = document.createElement('article');
    searchCard.className = 'card search-card';

    const header = document.createElement('header');
    const titleEl = document.createElement('h3');
    titleEl.textContent = 'Search & Filter';
    header.appendChild(titleEl);
    searchCard.appendChild(header);
    searchCard.appendChild(searchForm);

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

    const filters = { limit: BOOKMARK_LIST_LIMIT };

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    if (statusFilter && statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    return filters;
  }
}
