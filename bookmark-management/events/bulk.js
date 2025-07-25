// Bulk action event handlers for bookmark management

/**
 * Delete selected bookmarks with confirmation
 * @param {Object} params
 * @param {SupabaseService} params.supabaseService - Service for bookmark operations
 * @param {HTMLElement} params.appContainer - Main app container for UI messages
 * @param {Object} params.UIMessages - UI messages utility
 */
export async function deleteSelectedBookmarks({
  supabaseService,
  appContainer,
  UIMessages,
  ErrorHandler,
}) {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.bookmarkId);

  if (selectedIds.length === 0) return;

  UIMessages.confirm(
    `Are you sure you want to delete ${selectedIds.length} bookmark(s)? This action cannot be undone.`,
    async () => {
      try {
        for (const bookmarkId of selectedIds) {
          await supabaseService.deleteBookmark(bookmarkId);
        }

        UIMessages.success(
          `${selectedIds.length} bookmark(s) deleted successfully!`,
          appContainer
        );
        // Optionally reload bookmarks here
      } catch (error) {
        const errorResult = ErrorHandler.handle(
          error,
          'bookmark-management.deleteSelectedBookmarks'
        );
        UIMessages.error(errorResult.userMessage, appContainer);
      }
    },
    () => {
      // User cancelled
    },
    appContainer
  );
}

/**
 * Export selected bookmarks to JSON
 * @param {Object} params
 * @param {SupabaseService} params.supabaseService - Service for bookmark operations
 * @param {Object} params.BookmarkTransformer - Transformer utility
 * @param {HTMLElement} params.appContainer - Main app container for UI messages
 * @param {Object} params.UIMessages - UI messages utility
 * @param {Object} params.ErrorHandler - Error handler utility
 */
export async function exportSelectedBookmarks({
  supabaseService,
  BookmarkTransformer,
  appContainer,
  UIMessages,
  ErrorHandler,
}) {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.bookmarkId);

  if (selectedIds.length === 0) return;

  try {
    const bookmarks = [];
    for (const bookmarkId of selectedIds) {
      const bookmark = await supabaseService.getBookmarkById(bookmarkId);
      if (bookmark) {
        bookmarks.push(BookmarkTransformer.toUIFormat(bookmark));
      }
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      bookmarks: bookmarks,
    };

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

    UIMessages.success(
      `${bookmarks.length} bookmark(s) exported successfully!`,
      appContainer
    );
  } catch (error) {
    const errorResult = ErrorHandler.handle(
      error,
      'bookmark-management.exportSelectedBookmarks'
    );
    UIMessages.error(errorResult.userMessage, appContainer);
  }
}
