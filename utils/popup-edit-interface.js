/**
 * @fileoverview Edit interface for popup
 * @module popup-edit-interface
 * @description Handles bookmark editing interface in popup
 */

import { createBookmarkEditView } from '../components/bookmark-edit-view.js';
import { resolveStatusTypes } from './formatters.js';

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
  async showEditInterface(existingBookmark) {
    this.popup.currentBookmarkUrl = existingBookmark.url;

    const statusTypes = resolveStatusTypes(
      await this.popup.configManager.getCustomStatusTypes(),
    );

    createBookmarkEditView(existingBookmark, this.popup.appContainer, {
      backLabel: '← Back',
      onBack: () => this.popup.showMainInterface(),
      onUpdate: bookmarkId => this.popup.updateBookmark(bookmarkId),
      statusTypes,
    });
  }
}
