/**
 * @fileoverview Display formatting utilities for the ForgetfulMe extension
 */

import { TIME_CALCULATIONS } from './constants.js';

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} [format='relative'] - Format type: 'relative', 'short', 'long'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'relative') {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  if (format === 'relative') {
    const seconds = Math.floor(diff / TIME_CALCULATIONS.MILLISECONDS_PER_SECOND);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;

    return dateObj.toLocaleDateString();
  }

  if (format === 'short') {
    return dateObj.toLocaleDateString();
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return dateObj.toLocaleDateString();
}

/**
 * Format URL for display (remove protocol, www, truncate)
 * @param {string} url - URL to format
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string} Formatted URL
 */
export function formatUrl(url, maxLength = 50) {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    let formatted = urlObj.hostname + urlObj.pathname;

    // Remove www prefix
    formatted = formatted.replace(/^www\./, '');

    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }

    return formatted;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
}

/**
 * Format page title for display
 * @param {string} title - Page title
 * @param {number} [maxLength=60] - Maximum length
 * @returns {string} Formatted title
 */
export function formatTitle(title, maxLength = 60) {
  if (!title) return 'Untitled';

  const cleaned = title.trim();
  if (cleaned.length <= maxLength) return cleaned;

  return cleaned.substring(0, maxLength - 3) + '...';
}

/**
 * Format tags for display
 * @param {string[]} tags - Array of tags
 * @param {number} [maxVisible=3] - Maximum tags to show
 * @returns {string} Formatted tags string
 */
export function formatTags(tags, maxVisible = 3) {
  if (!tags || tags.length === 0) return '';

  const visible = tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  let result = visible.join(', ');
  if (remaining > 0) {
    result += ` +${remaining} more`;
  }

  return result;
}

/**
 * Format count with proper pluralization
 * @param {number} count - Count to format
 * @param {string} singular - Singular form
 * @param {string} [plural] - Plural form (defaults to singular + 's')
 * @returns {string} Formatted count string
 */
export function formatCount(count, singular, plural = null) {
  if (count === 1) {
    return `1 ${singular}`;
  }

  const pluralForm = plural || `${singular}s`;
  return `${count} ${pluralForm}`;
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  if (i === 0) return `${bytes} B`;

  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${size} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to add
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text || '';

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';

  // Use a more secure approach without relying on DOM manipulation
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format search query for display
 * @param {string} query - Search query
 * @param {number} [maxLength=30] - Maximum length
 * @returns {string} Formatted query
 */
export function formatSearchQuery(query, maxLength = 30) {
  if (!query) return '';

  const cleaned = query.trim();
  if (cleaned.length <= maxLength) return cleaned;

  return cleaned.substring(0, maxLength - 1) + '…';
}

/**
 * Format status name for display
 * @param {string} status - Status identifier
 * @returns {string} Formatted status name
 */
export function formatStatus(status) {
  if (!status) return '';

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Generate initials from name or email
 * @param {string} name - Name or email
 * @returns {string} Initials (up to 2 characters)
 */
export function getInitials(name) {
  if (!name) return '?';

  // Extract name part from email if it's an email
  if (name.includes('@')) {
    name = name.split('@')[0];
  }

  const parts = name.split(/[\s.-_]+/).filter(part => part.length > 0);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
