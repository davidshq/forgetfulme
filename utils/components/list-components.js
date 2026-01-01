/**
 * @fileoverview List component creation utilities
 * @module components/list-components
 * @description Provides list and list item creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';

/**
 * Create a list container
 * @param {string} id - List ID
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createList(id, className = '') {
  const list = document.createElement('div');
  list.id = id;
  list.className = `list ${className}`.trim();
  return list;
}

/**
 * Create a list item
 * @param {Object} data - Item data
 * @param {Object} options - Item options
 * @returns {HTMLElement}
 */
export function createListItem(data, options = {}) {
  const item = document.createElement('div');
  item.className = `list-item ${options.className || ''}`.trim();

  // Add title if provided
  if (data.title) {
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = data.title;
    if (data.titleTooltip) title.title = data.titleTooltip;
    item.appendChild(title);
  }

  // Add meta information
  if (data.meta) {
    const meta = document.createElement('div');
    meta.className = 'item-meta';

    if (data.meta.status) {
      const status = document.createElement('span');
      status.className = `status status-${data.meta.status}`;
      status.textContent = data.meta.statusText || data.meta.status;
      meta.appendChild(status);
    }

    if (data.meta.time) {
      const time = document.createElement('span');
      time.textContent = data.meta.time;
      meta.appendChild(time);
    }

    if (data.meta.tags && data.meta.tags.length > 0) {
      const tags = document.createElement('span');
      tags.textContent = ` • ${data.meta.tags.join(', ')}`;
      meta.appendChild(tags);
    }

    item.appendChild(meta);
  }

  // Add actions if provided
  if (data.actions) {
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    data.actions.forEach(action => {
      const actionBtn = createButton(action.text, action.onClick, action.className || '');
      actions.appendChild(actionBtn);
    });

    item.appendChild(actions);
  }

  return item;
}
