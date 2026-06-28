/**
 * @fileoverview Shared bookmark list meta rendering
 * @module components/bookmark-meta
 */

import { formatStatus, formatTime } from '../utils/formatters.js';

/**
 * Resolve status field from UI or Supabase bookmark shapes.
 * @param {Object} bookmark
 * @returns {string}
 */
export function getBookmarkStatus(bookmark) {
  return bookmark.read_status || bookmark.status || 'read';
}

/**
 * Append status, time, and optional tags meta elements to a parent node.
 * @param {HTMLElement} parentEl
 * @param {Object} bookmark
 * @param {Object} [options]
 * @param {string} [options.elementTag='small']
 * @param {Object<string, string>} [options.classNames]
 */
export function appendBookmarkMeta(parentEl, bookmark, options = {}) {
  const { elementTag = 'small', classNames = {} } = options;
  const status = getBookmarkStatus(bookmark);

  const statusEl = document.createElement(elementTag);
  if (classNames.status) {
    statusEl.className = classNames.status;
  }
  statusEl.textContent = formatStatus(status);
  statusEl.setAttribute('aria-label', `Status: ${formatStatus(status)}`);
  parentEl.appendChild(statusEl);

  const timeEl = document.createElement(elementTag);
  if (classNames.time) {
    timeEl.className = classNames.time;
  }
  const createdAt = formatTime(new Date(bookmark.created_at).getTime());
  timeEl.textContent = createdAt;
  timeEl.setAttribute('aria-label', `Created ${createdAt}`);
  parentEl.appendChild(timeEl);

  if (bookmark.tags && bookmark.tags.length > 0) {
    const tagsEl = document.createElement(elementTag);
    if (classNames.tags) {
      tagsEl.className = classNames.tags;
    }
    tagsEl.textContent = `Tags: ${bookmark.tags.join(', ')}`;
    tagsEl.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
    parentEl.appendChild(tagsEl);
  }
}
