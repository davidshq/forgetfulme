/**
 * @fileoverview Bulk actions component for bookmarks
 * @module components/bulk-actions
 * @description Handles bulk operations on bookmarks
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from '../utils/ui-components.js';
import BookmarkTransformer from '../utils/bookmark-transformer.js';

/**
 * Bulk actions component
 * @class BulkActions
 * @description Manages bulk operations on bookmarks
 */
export class BulkActions {
  /**
   * Create a bulk actions component
   * @param {Object} options - Configuration options
   * @param {Function} options.onSelectAll - Callback for select all action
   * @param {Function} options.onDeleteSelected - Callback for delete selected action
   * @param {Function} options.onExportSelected - Callback for export selected action
   */
  constructor(options = {}) {
    this.onSelectAll = options.onSelectAll || (() => {});
    this.onDeleteSelected = options.onDeleteSelected || (() => {});
    this.onExportSelected = options.onExportSelected || (() => {});
  }

  /**
   * Create bulk actions card
   * @returns {HTMLElement} The bulk actions card element
   */
  createBulkActionsCard() {
    const article = document.createElement('article');
    article.className = 'card bulk-actions-card';

    // Add header
    const header = document.createElement('header');
    const titleEl = document.createElement('h3');
    titleEl.textContent = 'Bulk Actions';
    header.appendChild(titleEl);
    article.appendChild(header);

    // Add main content
    const mainContent = document.createElement('div');
    mainContent.innerHTML =
      '<p>Select multiple bookmarks to perform bulk operations like deletion or export.</p>';
    article.appendChild(mainContent);

    // Add footer with actions
    const footer = document.createElement('footer');
    footer.className = 'card-actions';

    const selectAllBtn = UIComponents.createButton(
      'Select All',
      () => this.onSelectAll(),
      'secondary',
    );
    selectAllBtn.id = 'select-all';
    footer.appendChild(selectAllBtn);

    const deleteSelectedBtn = UIComponents.createButton(
      'Delete Selected',
      () => this.onDeleteSelected(),
      'contrast',
    );
    deleteSelectedBtn.id = 'delete-selected';
    deleteSelectedBtn.disabled = true;
    footer.appendChild(deleteSelectedBtn);

    const exportSelectedBtn = UIComponents.createButton(
      'Export Selected',
      () => this.onExportSelected(),
      'secondary',
    );
    exportSelectedBtn.id = 'export-selected';
    exportSelectedBtn.disabled = true;
    footer.appendChild(exportSelectedBtn);

    article.appendChild(footer);

    return article;
  }

  /**
   * Toggle select all bookmarks
   */
  toggleSelectAll() {
    const checkboxes = UIComponents.DOM.querySelectorAll('.bookmark-checkbox');
    const selectAllBtn = UIComponents.DOM.getElement('select-all');

    if (!checkboxes.length) return;

    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(checkbox => {
      checkbox.checked = !allChecked;
    });

    if (selectAllBtn) {
      selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }

    this.updateBulkActions();
  }

  /**
   * Update bulk action buttons based on selection
   */
  updateBulkActions() {
    const checkboxes = UIComponents.DOM.querySelectorAll('.bookmark-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

    const deleteSelectedBtn = UIComponents.DOM.getElement('delete-selected');
    const exportSelectedBtn = UIComponents.DOM.getElement('export-selected');

    if (deleteSelectedBtn) {
      deleteSelectedBtn.disabled = selectedCount === 0;
    }

    if (exportSelectedBtn) {
      exportSelectedBtn.disabled = selectedCount === 0;
    }
  }

  /**
   * Get selected bookmark IDs
   * @returns {Array<string>} Array of selected bookmark IDs
   */
  getSelectedIds() {
    const checkboxes = UIComponents.DOM.querySelectorAll('.bookmark-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.bookmarkId);
  }

  /**
   * Export selected bookmarks to JSON
   * @param {Function} getBookmarkById - Function to get bookmark by ID
   * @returns {Promise<Object>} Export data object
   */
  async exportSelectedBookmarks(getBookmarkById) {
    const selectedIds = this.getSelectedIds();

    if (selectedIds.length === 0) {
      return null;
    }

    const bookmarks = [];
    for (const bookmarkId of selectedIds) {
      const bookmark = await getBookmarkById(bookmarkId);
      if (bookmark) {
        bookmarks.push(BookmarkTransformer.toUIFormat(bookmark));
      }
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      bookmarks: bookmarks,
    };

    return exportData;
  }

  /**
   * Download export data as JSON file
   * @param {Object} exportData - The export data to download
   */
  downloadExport(exportData) {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `forgetfulme-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
