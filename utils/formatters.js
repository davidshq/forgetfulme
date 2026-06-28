/**
 * Shared formatting utilities for the ForgetfulMe extension
 * @module utils/formatters
 * @description Centralized formatting functions used across the extension
 */

import { DEFAULT_STATUS_TYPES } from './constants.js';

/**
 * Use custom status types when non-empty; otherwise fall back to defaults.
 * @param {string[]|null|undefined} statusTypes
 * @returns {string[]}
 */
export function resolveStatusTypes(statusTypes) {
  return statusTypes?.length ? statusTypes : DEFAULT_STATUS_TYPES;
}

/**
 * Format status string for display
 * @param {string} status - The status string to format (e.g., 'good-reference')
 * @returns {string} The formatted status (e.g., 'Good Reference')
 * @example
 * formatStatus('good-reference') // returns 'Good Reference'
 * formatStatus('low-value') // returns 'Low Value'
 */
export function formatStatus(status) {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format timestamp for relative time display
 * @param {number} timestamp - The timestamp in milliseconds
 * @returns {string} The formatted relative time
 * @example
 * formatTime(Date.now()) // returns 'Just now'
 * formatTime(Date.now() - 300000) // returns '5m ago'
 * formatTime(Date.now() - 3600000) // returns '1h ago'
 */
export function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 60000) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Build select options for status dropdowns.
 * @param {string[]} [statusTypes=DEFAULT_STATUS_TYPES]
 * @param {Object} [options]
 * @param {string} [options.selected]
 * @param {boolean} [options.includeAll=false]
 * @returns {Array<{ value: string, text: string, selected?: boolean }>}
 */
export function buildStatusSelectOptions(
  statusTypes = DEFAULT_STATUS_TYPES,
  { selected, includeAll = false } = {},
) {
  const options = includeAll ? [{ value: 'all', text: 'All Statuses' }] : [];

  statusTypes.forEach(value => {
    options.push({
      value,
      text: formatStatus(value),
      ...(value === selected ? { selected: true } : {}),
    });
  });

  return options;
}

/**
 * Aggregate bookmark counts by status field.
 * @param {Array<Object>} items
 * @param {string} [statusField='read_status']
 * @returns {Object<string, number>}
 */
export function countByStatus(items, statusField = 'read_status') {
  return (items || []).reduce((stats, item) => {
    const status = item[statusField];
    if (status) {
      stats[status] = (stats[status] || 0) + 1;
    }
    return stats;
  }, {});
}
