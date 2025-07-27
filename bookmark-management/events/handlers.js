// Event handler functions for bookmark management

import SimpleModal from '../../utils/simple-modal.js';

export async function searchBookmarks({
  UIComponents,
  supabaseService,
  BookmarkTransformer,
  appContainer,
  UIMessages,
  ErrorHandler,
  displayBookmarks,
}) {
  try {
    const searchQuery = UIComponents.DOM.getValue('search-query') || '';
    const statusFilter = UIComponents.DOM.getValue('status-filter') || '';
    const filters = { limit: 100 };
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    if (statusFilter) {
      filters.status = statusFilter;
    }
    const bookmarks = await supabaseService.getBookmarks(filters);
    displayBookmarks({
      bookmarks,
      BookmarkTransformer,
      appContainer,
      UIMessages,
      ErrorHandler,
    });
  } catch (error) {
    const errorResult = ErrorHandler.handle(
      error,
      'bookmark-management.searchBookmarks'
    );
    UIMessages.error(errorResult.userMessage, appContainer);
  }
}

export function editBookmark({ bookmark, showEditInterface }) {
  // Convert UI format back to database format for edit interface
  const dbBookmark = {
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    read_status: bookmark.status,
    tags: bookmark.tags,
    created_at: bookmark.created_at,
  };
  showEditInterface(dbBookmark);
}

export async function updateBookmark({
  UIComponents,
  supabaseService,
  appContainer,
  UIMessages,
  ErrorHandler,
  bookmarkId,
  showMainInterface,
}) {
  try {
    const status = UIComponents.DOM.getValue('edit-read-status') || 'read';
    const tags = UIComponents.DOM.getValue('edit-tags') || '';
    const updateData = {
      read_status: status,
      tags: tags.trim()
        ? tags
            .trim()
            .split(',')
            .map(tag => tag.trim())
        : [],
      updated_at: new Date().toISOString(),
    };
    await supabaseService.updateBookmark(bookmarkId, updateData);
    UIMessages.success('Bookmark updated successfully!', appContainer);
    setTimeout(() => {
      showMainInterface();
    }, 1500);
  } catch (error) {
    const errorResult = ErrorHandler.handle(
      error,
      'bookmark-management.updateBookmark'
    );
    UIMessages.error(errorResult.userMessage, appContainer);
  }
}

export async function deleteBookmark({
  supabaseService,
  appContainer,
  UIMessages,
  UIComponents,
  ErrorHandler,
  bookmarkId,
  bookmarkTitle,
  loadAllBookmarks,
}) {
  SimpleModal.confirm(
    `Are you sure you want to delete "${bookmarkTitle}"? This action cannot be undone.`,
    async () => {
      try {
        await supabaseService.deleteBookmark(bookmarkId);
        UIMessages.success('Bookmark deleted successfully!', appContainer);
        loadAllBookmarks();
      } catch (error) {
        const errorResult = ErrorHandler.handle(
          error,
          'bookmark-management.deleteBookmark'
        );
        UIMessages.error(errorResult.userMessage, appContainer);
      }
    },
    () => {
      // User cancelled
    },
    {
      confirmText: 'Delete',
      cancelText: 'Cancel',
    }
  );
}

export function openBookmark({ url }) {
  if (chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    // Fallback for when chrome.tabs API is not available
    window.open(url, '_blank');
  }
}

export function bindBulkActions({
  onSelectAll,
  onDeleteSelected,
  onExportSelected,
}) {
  const selectAllBtn = document.getElementById('select-all');
  const deleteSelectedBtn = document.getElementById('delete-selected');
  const exportSelectedBtn = document.getElementById('export-selected');
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', onSelectAll);
  }
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', onDeleteSelected);
  }
  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', onExportSelected);
  }
}

export function toggleSelectAll({ updateBulkActions }) {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox');
  const selectAllBtn = document.getElementById('select-all');
  if (!checkboxes.length) return;
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach(checkbox => {
    checkbox.checked = !allChecked;
  });
  if (selectAllBtn) {
    selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
  }
  updateBulkActions();
}

export function updateBulkActions() {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const deleteSelectedBtn = document.getElementById('delete-selected');
  const exportSelectedBtn = document.getElementById('export-selected');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.disabled = selectedCount === 0;
  }
  if (exportSelectedBtn) {
    exportSelectedBtn.disabled = selectedCount === 0;
  }
}
