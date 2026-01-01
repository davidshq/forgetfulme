/**
 * @fileoverview Edit interface for popup
 * @module popup-edit-interface
 * @description Handles bookmark editing interface in popup
 */

import UIComponents from './ui-components.js';
import { formatStatus, formatTime } from './formatters.js';

/**
 * Edit interface manager for popup
 * @class PopupEditInterface
 * @description Manages the edit interface for bookmarks in the popup
 */
export class PopupEditInterface {
  /**
   * Initialize edit interface manager
   * @constructor
   * @param {ForgetfulMePopup} popup - Popup instance
   */
  constructor(popup) {
    this.popup = popup;
  }

  /**
   * Show edit interface for an existing bookmark
   * @method showEditInterface
   * @param {Object} existingBookmark - The bookmark to edit
   * @description Displays the edit interface for the specified bookmark
   */
  showEditInterface(existingBookmark) {
    this.popup.currentBookmarkUrl = existingBookmark.url;
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'Edit Bookmark';
    header.appendChild(title);

    const backBtn = UIComponents.createButton(
      '← Back',
      () => this.popup.showMainInterface(),
      'secondary',
      { title: 'Back to main interface' },
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
        this.popup.updateBookmark(existingBookmark.id);
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
    this.popup.appContainer.innerHTML = '';
    this.popup.appContainer.appendChild(header);
    this.popup.appContainer.appendChild(mainContent);
    mainContent.appendChild(infoSection);
    mainContent.appendChild(editForm);
  }
}
