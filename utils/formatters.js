/**
 * @fileoverview Shared formatting utilities for the ForgetfulMe extension
 * @module utils/formatters
 * @description Centralized formatting functions for status display and time formatting
 * @since 1.0.0
 * @author ForgetfulMe Team
 */

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
