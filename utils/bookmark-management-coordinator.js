/**
 * @fileoverview Coordination logic for bookmark management page
 * @module bookmark-management-coordinator
 * @description Handles coordination between search, filter, and bulk operations
 */

import UIComponents from './ui-components.js';
import ErrorHandler from './error-handler.js';
import UIMessages from './ui-messages.js';

/**
 * Bookmark management coordinator
 * @class BookmarkManagementCoordinator
 * @description Coordinates search, filter, and bulk operations
 */
export class BookmarkManagementCoordinator {
  /**
   * Initialize coordinator
   * @constructor
   * @param {BookmarkManagementPage} page - Bookmark management page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Load all bookmarks for display
   * @async
   * @method loadAllBookmarks
   * @description Loads all bookmarks from the database and displays them
   * @throws {Error} When loading fails
   */
  async loadAllBookmarks() {
    try {
      const bookmarks = await this.page.supabaseService.getBookmarks({ limit: 100 });
      this.displayBookmarks(bookmarks);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'bookmark-management.loadAllBookmarks');
      UIMessages.error(errorResult.userMessage, this.page.appContainer);
    }
  }

  /**
   * Display bookmarks in the list
   * @method displayBookmarks
   * @param {Array} bookmarks - Array of bookmark objects to display
   * @description Renders bookmarks in the list with proper formatting and accessibility
   */
  displayBookmarks(bookmarks) {
    const bookmarksList = UIComponents.DOM.getElement('bookmarks-list');
    if (!bookmarksList) return;

    this.page.bookmarkList.displayBookmarks(bookmarks, bookmarksList);
    this.page.bulkActions.updateBulkActions();
  }

  /**
   * Search bookmarks with filters
   * @async
   * @method searchBookmarks
   * @description Searches bookmarks based on query and status filter
   * @throws {Error} When search fails
   */
  async searchBookmarks() {
    try {
      const filters = this.page.searchFilter.getFilters();
      const bookmarks = await this.page.supabaseService.getBookmarks(filters);
      this.displayBookmarks(bookmarks);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'bookmark-management.searchBookmarks');
      UIMessages.error(errorResult.userMessage, this.page.appContainer);
    }
  }

  /**
   * Delete selected bookmarks
   * @async
   * @method deleteSelectedBookmarks
   * @description Deletes all selected bookmarks with confirmation, then removes only deleted items
   */
  async deleteSelectedBookmarks() {
    const selectedIds = this.page.bulkActions.getSelectedIds();

    if (selectedIds.length === 0) return;

    UIMessages.confirm(
      `Are you sure you want to delete ${selectedIds.length} bookmark(s)? This action cannot be undone.`,
      async () => {
        try {
          const bookmarksList = UIComponents.DOM.getElement('bookmarks-list');

          for (const bookmarkId of selectedIds) {
            await this.page.supabaseService.deleteBookmark(bookmarkId);

            // Remove only the deleted item instead of re-rendering the entire list
            if (bookmarksList) {
              this.page.bookmarkList.removeBookmarkItem(bookmarkId, bookmarksList);
            }
          }

          if (bookmarksList) {
            this.page.bulkActions.updateBulkActions();
          }

          UIMessages.success(
            `${selectedIds.length} bookmark(s) deleted successfully!`,
            this.page.appContainer,
          );
        } catch (error) {
          const errorResult = ErrorHandler.handle(
            error,
            'bookmark-management.deleteSelectedBookmarks',
          );
          UIMessages.error(errorResult.userMessage, this.page.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.page.appContainer,
    );
  }

  /**
   * Export selected bookmarks
   * @async
   * @method exportSelectedBookmarks
   * @description Exports selected bookmarks to JSON format
   */
  async exportSelectedBookmarks() {
    try {
      const exportData = await this.page.bulkActions.exportSelectedBookmarks(bookmarkId =>
        this.page.supabaseService.getBookmarkById(bookmarkId),
      );

      if (!exportData) return;

      this.page.bulkActions.downloadExport(exportData);

      UIMessages.success(
        `${exportData.bookmarks.length} bookmark(s) exported successfully!`,
        this.page.appContainer,
      );
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'bookmark-management.exportSelectedBookmarks');
      UIMessages.error(errorResult.userMessage, this.page.appContainer);
    }
  }
}
