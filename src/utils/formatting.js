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
