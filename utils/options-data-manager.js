/**
 * @fileoverview Options page data management
 * @module options-data-manager
 * @description Handles data loading and statistics for options page
 */

import UIComponents from './ui-components.js';
import { formatStatus } from './formatters.js';

/**
 * Load statistics into the UI
 * @param {Array} bookmarks - Array of bookmark objects
 * @param {Array} statusTypes - Array of status type objects
 * @description Updates statistics display with current data
 */
export function loadStatistics(bookmarks, statusTypes) {
  // Safely update statistics using DOM utilities
  const totalEntriesEl = UIComponents.DOM.getElement('total-entries');
  const statusTypesCountEl = UIComponents.DOM.getElement('status-types-count');
  const mostUsedStatusEl = UIComponents.DOM.getElement('most-used-status');

  if (totalEntriesEl) {
    totalEntriesEl.textContent = bookmarks.length;
  }

  if (statusTypesCountEl) {
    statusTypesCountEl.textContent = statusTypes.length;
  }

  // Most used status
  const statusCounts = {};
  bookmarks.forEach(bookmark => {
    statusCounts[bookmark.read_status] = (statusCounts[bookmark.read_status] || 0) + 1;
  });

  const mostUsed = Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0];

  if (mostUsedStatusEl) {
    if (mostUsed) {
      mostUsedStatusEl.textContent = formatStatus(mostUsed[0]);
    } else {
      mostUsedStatusEl.textContent = 'None';
    }
  }
}

/**
 * Load status types into the UI
 * @param {Array} statusTypes - Array of custom status types
 * @param {Function} onRemove - Callback when status is removed
 * @description Populates the status types list with current data
 */
export function loadStatusTypes(statusTypes, onRemove) {
  const statusTypesListEl = UIComponents.DOM.getElement('status-types-list');
  if (!statusTypesListEl) return;

  statusTypesListEl.innerHTML = '';

  if (statusTypes.length === 0) {
    const emptyItem = UIComponents.createListItem(
      {
        title: 'No custom status types defined',
        meta: {
          status: 'info',
          statusText: 'No status types',
        },
      },
      { className: 'status-type-item empty' },
    );
    statusTypesListEl.appendChild(emptyItem);
    return;
  }

  statusTypes.forEach(status => {
    const listItem = UIComponents.createListItem(
      {
        title: formatStatus(status),
        actions: [
          {
            text: 'Remove',
            onClick: () => onRemove(status),
            className: 'ui-btn-danger ui-btn-small',
          },
        ],
      },
      { className: 'status-type-item' },
    );

    statusTypesListEl.appendChild(listItem);
  });
}
