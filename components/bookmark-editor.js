/**
 * @fileoverview Bookmark editor component
 * @module components/bookmark-editor
 * @description Handles bookmark editing interface
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import {
  createBookmarkEditView,
  getBookmarkEditFormData,
} from './bookmark-edit-view.js';
import { DEFAULT_STATUS_TYPES } from '../utils/constants.js';
import { resolveStatusTypes } from '../utils/formatters.js';

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
   * @param {Function} [options.getStatusTypes] - Returns status types for the edit form
   */
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.getStatusTypes =
      options.getStatusTypes || (async () => DEFAULT_STATUS_TYPES);
  }

  /**
   * Show edit interface for a bookmark
   * @param {Object} existingBookmark - The bookmark to edit
   * @param {HTMLElement} container - Container element to render into
   */
  async showEditInterface(existingBookmark, container) {
    const statusTypes = resolveStatusTypes(await this.getStatusTypes());

    createBookmarkEditView(existingBookmark, container, {
      backLabel: '← Back to List',
      onBack: () => this.onCancel(),
      onUpdate: bookmarkId => this.onUpdate(bookmarkId),
      statusTypes,
    });
  }

  /**
   * Get form values for update
   * @returns {Object} Update data object
   */
  getUpdateData() {
    return getBookmarkEditFormData();
  }
}
