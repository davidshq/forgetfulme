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
 * Append a labeled paragraph with plain-text value to a parent element.
 * @param {HTMLElement} parent
 * @param {string} label
 * @param {string} value
 */
function appendInfoParagraph(parent, label, value) {
  const paragraph = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  paragraph.appendChild(strong);

  const valueText = document.createElement('span');
  valueText.textContent = ` ${value}`;
  paragraph.appendChild(valueText);

  parent.appendChild(paragraph);
}

/**
 * Build the bookmark info section using safe DOM APIs (no innerHTML).
 * @param {Object} existingBookmark
 * @returns {HTMLElement}
 */
function createBookmarkInfoSection(existingBookmark) {
  const infoWrapper = document.createElement('div');
  infoWrapper.className = 'bookmark-info';

  appendInfoParagraph(infoWrapper, 'Title', existingBookmark.title);

  const urlParagraph = document.createElement('p');
  const urlLabel = document.createElement('strong');
  urlLabel.textContent = 'URL:';
  urlParagraph.appendChild(urlLabel);

  const urlSpace = document.createElement('span');
  urlSpace.textContent = ' ';
  urlParagraph.appendChild(urlSpace);

  const urlLink = document.createElement('a');
  urlLink.href = existingBookmark.url;
  urlLink.textContent = existingBookmark.url;
  urlLink.target = '_blank';
  urlLink.rel = 'noopener noreferrer';
  urlParagraph.appendChild(urlLink);
  infoWrapper.appendChild(urlParagraph);

  appendInfoParagraph(
    infoWrapper,
    'Current Status',
    formatStatus(existingBookmark.read_status),
  );

  const tagsText = existingBookmark.tags?.length
    ? existingBookmark.tags.join(', ')
    : 'None';
  appendInfoParagraph(infoWrapper, 'Current Tags', tagsText);

  appendInfoParagraph(
    infoWrapper,
    'Created',
    formatTime(new Date(existingBookmark.created_at).getTime()),
  );

  return infoWrapper;
}

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
  infoSection.appendChild(createBookmarkInfoSection(existingBookmark));

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
