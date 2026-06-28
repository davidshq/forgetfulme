/**
 * @fileoverview Shared bookmark edit view for popup and bookmark management
 * @module components/bookmark-edit-view
 */

import UIComponents from '../utils/ui-components.js';
import BookmarkTransformer from '../utils/bookmark-transformer.js';
import {
  buildStatusSelectOptions,
  formatStatus,
  formatTime,
} from '../utils/formatters.js';
import { DEFAULT_STATUS_TYPES } from '../utils/constants.js';

/**
 * Read edit form values from the shared bookmark edit form IDs.
 * @returns {{ read_status: string, tags: string[], updated_at: string }}
 */
export function getBookmarkEditFormData() {
  const status = UIComponents.DOM.getValue('edit-read-status') || 'read';
  const tags = UIComponents.DOM.getValue('edit-tags') || '';

  return {
    read_status: status,
    tags: BookmarkTransformer.normalizeTags(tags),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Render the shared bookmark edit interface into a container.
 * @param {Object} existingBookmark
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Function} options.onBack
 * @param {Function} options.onUpdate
 * @param {string} [options.backLabel='← Back']
 * @param {string[]} [options.statusTypes=DEFAULT_STATUS_TYPES]
 */
export function createBookmarkEditView(
  existingBookmark,
  container,
  {
    onBack,
    onUpdate,
    backLabel = '← Back',
    statusTypes = DEFAULT_STATUS_TYPES,
  },
) {
  const header = document.createElement('header');
  const title = document.createElement('h1');
  title.textContent = 'Edit Bookmark';
  header.appendChild(title);

  const backBtn = UIComponents.createButton(backLabel, onBack, 'secondary', {
    title: 'Back',
  });
  header.appendChild(backBtn);

  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';

  const infoSection = UIComponents.createSection(
    'Bookmark Info',
    'info-section',
  );
  infoSection.innerHTML = `
    <div class="bookmark-info">
      <p><strong>Title:</strong> ${existingBookmark.title}</p>
      <p><strong>URL:</strong> <a href="${existingBookmark.url}" target="_blank">${existingBookmark.url}</a></p>
      <p><strong>Current Status:</strong> ${formatStatus(
        existingBookmark.read_status,
      )}</p>
      <p><strong>Current Tags:</strong> ${
        existingBookmark.tags ? existingBookmark.tags.join(', ') : 'None'
      }</p>
      <p><strong>Created:</strong> ${formatTime(
        new Date(existingBookmark.created_at).getTime(),
      )}</p>
    </div>
  `;

  const statusOptions = buildStatusSelectOptions(statusTypes, {
    selected: existingBookmark.read_status,
  });

  const editForm = UIComponents.createForm(
    'editBookmarkForm',
    e => {
      e.preventDefault();
      onUpdate(existingBookmark.id);
    },
    [
      {
        type: 'select',
        id: 'edit-read-status',
        label: 'Update Status:',
        options: {
          options: statusOptions,
        },
      },
      {
        type: 'text',
        id: 'edit-tags',
        label: 'Update Tags (comma separated):',
        options: {
          placeholder: 'research, tutorial, important',
          value: existingBookmark.tags ? existingBookmark.tags.join(', ') : '',
        },
      },
    ],
    {
      submitText: 'Update Bookmark',
    },
  );

  container.innerHTML = '';
  container.appendChild(header);
  container.appendChild(mainContent);
  mainContent.appendChild(infoSection);
  mainContent.appendChild(editForm);
}
