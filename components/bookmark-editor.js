/**
 * @fileoverview Bookmark editor component
 * @module components/bookmark-editor
 * @description Handles bookmark editing interface
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from '../utils/ui-components.js';
import { formatStatus, formatTime } from '../utils/formatters.js';

/**
 * Bookmark editor component
 * @class BookmarkEditor
 * @description Manages bookmark editing interface
 */
export class BookmarkEditor {
  /**
   * Create a bookmark editor component
   * @param {Object} options - Configuration options
   * @param {Function} options.onUpdate - Callback when bookmark is updated
   * @param {Function} options.onCancel - Callback when editing is cancelled
   */
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {});
    this.onCancel = options.onCancel || (() => {});
  }

  /**
   * Show edit interface for a bookmark
   * @param {Object} existingBookmark - The bookmark to edit
   * @param {HTMLElement} container - Container element to render into
   */
  showEditInterface(existingBookmark, container) {
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'Edit Bookmark';
    header.appendChild(title);

    const backBtn = UIComponents.createButton(
      '← Back to List',
      () => this.onCancel(),
      'secondary',
      { title: 'Back to bookmark list' },
    );
    header.appendChild(backBtn);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Create info section
    const infoSection = UIComponents.createSection('Bookmark Info', 'info-section');
    infoSection.innerHTML = `
      <div class="bookmark-info">
        <p><strong>Title:</strong> ${existingBookmark.title}</p>
        <p><strong>URL:</strong> <a href="${existingBookmark.url}" target="_blank">${existingBookmark.url}</a></p>
        <p><strong>Current Status:</strong> ${formatStatus(existingBookmark.read_status)}</p>
        <p><strong>Current Tags:</strong> ${existingBookmark.tags ? existingBookmark.tags.join(', ') : 'None'}</p>
        <p><strong>Created:</strong> ${formatTime(new Date(existingBookmark.created_at).getTime())}</p>
      </div>
    `;

    // Create edit form using UI components
    const statusOptions = [
      { value: 'read', text: 'Read' },
      { value: 'good-reference', text: 'Good Reference' },
      { value: 'low-value', text: 'Low Value' },
      { value: 'revisit-later', text: 'Revisit Later' },
    ];

    // Mark the current status as selected
    statusOptions.forEach(option => {
      if (option.value === existingBookmark.read_status) {
        option.selected = true;
      }
    });

    const editForm = UIComponents.createForm(
      'editBookmarkForm',
      e => {
        e.preventDefault();
        this.onUpdate(existingBookmark.id);
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

    // Assemble the interface
    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(mainContent);
    mainContent.appendChild(infoSection);
    mainContent.appendChild(editForm);
  }

  /**
   * Get form values for update
   * @returns {Object} Update data object
   */
  getUpdateData() {
    const status = UIComponents.DOM.getValue('edit-read-status') || 'read';
    const tags = UIComponents.DOM.getValue('edit-tags') || '';

    return {
      read_status: status,
      tags: tags.trim()
        ? tags
            .trim()
            .split(',')
            .map(tag => tag.trim())
        : [],
      updated_at: new Date().toISOString(),
    };
  }
}
