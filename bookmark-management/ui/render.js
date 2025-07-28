// UI rendering functions for bookmark management

/**
 * Show setup interface when Supabase is not configured
 */
export function showSetupInterface({
  _UIComponents,
  appContainer,
  openSettings,
}) {
  // Show setup interface, hide others
  const mainInterface = appContainer.querySelector('#main-interface');
  const setupInterface = appContainer.querySelector('#setup-interface');
  const authInterface = appContainer.querySelector('#auth-interface');
  const emptyState = appContainer.querySelector('#empty-state');
  const errorInterface = appContainer.querySelector('#error-interface');

  if (mainInterface) mainInterface.hidden = true;
  if (setupInterface) setupInterface.hidden = false;
  if (authInterface) authInterface.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (errorInterface) errorInterface.hidden = true;

  // Add settings button functionality if not already present
  const settingsBtn = setupInterface.querySelector('a[href="options.html"]');
  if (settingsBtn && openSettings) {
    // Convert link to button with openSettings callback
    const btn = document.createElement('button');
    btn.textContent = 'Open Settings';
    btn.className = 'primary';
    btn.onclick = openSettings;
    settingsBtn.parentNode.replaceChild(btn, settingsBtn);
  }
}

/**
 * Show authentication interface
 */
export function showAuthInterface({ appContainer }) {
  // Show auth interface, hide others
  const mainInterface = appContainer.querySelector('#main-interface');
  const setupInterface = appContainer.querySelector('#setup-interface');
  const authInterface = appContainer.querySelector('#auth-interface');
  const emptyState = appContainer.querySelector('#empty-state');
  const errorInterface = appContainer.querySelector('#error-interface');

  if (mainInterface) mainInterface.hidden = true;
  if (setupInterface) setupInterface.hidden = true;
  if (authInterface) authInterface.hidden = false;
  if (emptyState) emptyState.hidden = true;
  if (errorInterface) errorInterface.hidden = true;

  // Add close button functionality if not already present
  const existingBtn = authInterface.querySelector('button');
  if (!existingBtn) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'primary';
    closeBtn.onclick = () => window.close();
    authInterface.appendChild(closeBtn);
  }
}

/**
 * Show main bookmark management interface
 */
export function showMainInterface({
  _UIComponents,
  appContainer,
  onSearch,
  onSelectAll,
  onDeleteSelected,
  onExportSelected,
  loadAllBookmarks,
  bindBulkActions,
}) {
  // Show main interface, hide other sections
  const mainInterface = appContainer.querySelector('#main-interface');
  const setupInterface = appContainer.querySelector('#setup-interface');
  const authInterface = appContainer.querySelector('#auth-interface');
  const emptyState = appContainer.querySelector('#empty-state');
  const errorInterface = appContainer.querySelector('#error-interface');

  if (mainInterface) mainInterface.hidden = false;
  if (setupInterface) setupInterface.hidden = true;
  if (authInterface) authInterface.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (errorInterface) errorInterface.hidden = true;

  // Add back button to navigation
  const navigation = appContainer.querySelector('#bookmark-navigation');
  if (navigation) {
    navigation.innerHTML = `
      <button class="nav-btn secondary" onclick="window.close()" 
              title="Close bookmark management and return to extension"
              aria-label="Close bookmark management and return to extension">
        ← Back to Extension
      </button>
    `;
  }

  // Bind search form
  const searchForm = appContainer.querySelector('#search-form');
  if (searchForm) {
    searchForm.onsubmit = e => {
      e.preventDefault();
      if (onSearch) onSearch(e, searchForm);
    };
  }

  // Bind bulk action buttons
  const selectAllBtn = appContainer.querySelector('#select-all-btn');
  const deleteSelectedBtn = appContainer.querySelector('#delete-selected-btn');
  const exportSelectedBtn = appContainer.querySelector('#export-selected-btn');

  if (selectAllBtn && onSelectAll) selectAllBtn.onclick = onSelectAll;
  if (deleteSelectedBtn && onDeleteSelected)
    deleteSelectedBtn.onclick = onDeleteSelected;
  if (exportSelectedBtn && onExportSelected)
    exportSelectedBtn.onclick = onExportSelected;

  loadAllBookmarks();
  bindBulkActions();
}

/**
 * Display bookmarks in the list
 */
export function displayBookmarks({
  bookmarks,
  BookmarkTransformer,
  updateBulkActions,
  onEdit,
  onDelete,
  onOpen,
}) {
  console.log('displayBookmarks called with:', {
    bookmarksCount: bookmarks?.length,
    hasOnEdit: !!onEdit,
    hasOnDelete: !!onDelete,
    hasOnOpen: !!onOpen,
  });
  const bookmarksList = document.getElementById('bookmarks-list');
  if (!bookmarksList) return;
  bookmarksList.innerHTML = '';
  if (bookmarks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.setAttribute('role', 'status');
    emptyState.setAttribute('aria-live', 'polite');
    const emptyIcon = document.createElement('div');
    emptyIcon.style.fontSize = '48px';
    emptyIcon.style.marginBottom = '16px';
    emptyIcon.textContent = '📚';
    emptyState.appendChild(emptyIcon);
    const emptyTitle = document.createElement('h4');
    emptyTitle.textContent = 'No bookmarks found';
    emptyState.appendChild(emptyTitle);
    const emptyText = document.createElement('p');
    emptyText.textContent =
      'Try adjusting your search criteria or add some bookmarks from the extension popup.';
    emptyState.appendChild(emptyText);
    bookmarksList.appendChild(emptyState);
    return;
  }
  const uiBookmarks = bookmarks.map(bookmark =>
    BookmarkTransformer.toUIFormat(bookmark)
  );
  uiBookmarks.forEach((bookmark, index) => {
    const listItem = createBookmarkListItem({
      bookmark,
      index,
      updateBulkActions,
      onEdit,
      onDelete,
      onOpen,
    });
    bookmarksList.appendChild(listItem);
  });
  updateBulkActions();
}

/**
 * Create a bookmark list item with edit and delete actions
 */
export function createBookmarkListItem({
  bookmark,
  index,
  updateBulkActions,
  onEdit,
  onDelete,
  onOpen,
}) {
  const listItem = document.createElement('div');
  listItem.className = 'bookmark-item';
  listItem.setAttribute('role', 'listitem');
  listItem.setAttribute(
    'aria-label',
    `Bookmark ${index + 1}: ${bookmark.title}`
  );
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'bookmark-checkbox';
  checkbox.dataset.bookmarkId = bookmark.id;
  checkbox.setAttribute(
    'aria-label',
    `Select ${bookmark.title} for bulk action`
  );
  checkbox.addEventListener('change', updateBulkActions);
  listItem.appendChild(checkbox);
  const contentDiv = document.createElement('div');
  contentDiv.className = 'bookmark-content';
  const titleDiv = document.createElement('div');
  titleDiv.className = 'bookmark-title';
  titleDiv.textContent = bookmark.title;
  titleDiv.setAttribute('title', bookmark.title);
  contentDiv.appendChild(titleDiv);
  const metaDiv = document.createElement('div');
  metaDiv.className = 'bookmark-meta';
  const statusSpan = document.createElement('span');
  statusSpan.className = `bookmark-status status-${bookmark.status}`;
  statusSpan.textContent = bookmark.status;
  statusSpan.setAttribute('aria-label', `Status: ${bookmark.status}`);
  metaDiv.appendChild(statusSpan);
  const timeSpan = document.createElement('span');
  timeSpan.className = 'bookmark-time';
  timeSpan.textContent = bookmark.created_at;
  timeSpan.setAttribute('aria-label', `Created ${bookmark.created_at}`);
  metaDiv.appendChild(timeSpan);
  if (bookmark.tags && bookmark.tags.length > 0) {
    const tagsSpan = document.createElement('span');
    tagsSpan.className = 'bookmark-tags';
    tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
    tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
    metaDiv.appendChild(tagsSpan);
  }
  contentDiv.appendChild(metaDiv);
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'bookmark-actions';
  actionsDiv.setAttribute('role', 'group');
  actionsDiv.setAttribute('aria-label', `Actions for ${bookmark.title}`);
  const editBtn = document.createElement('button');
  editBtn.className = 'secondary';
  editBtn.textContent = '✏️ Edit';
  editBtn.setAttribute('aria-label', `Edit bookmark: ${bookmark.title}`);
  editBtn.setAttribute('title', 'Edit bookmark');
  if (onEdit) {
    editBtn.addEventListener('click', () => {
      console.log('Edit button clicked for:', bookmark);
      onEdit(bookmark);
    });
  } else {
    console.warn('No onEdit handler provided for bookmark:', bookmark);
  }
  actionsDiv.appendChild(editBtn);
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'contrast';
  deleteBtn.textContent = '🗑️ Delete';
  deleteBtn.setAttribute('aria-label', `Delete bookmark: ${bookmark.title}`);
  deleteBtn.setAttribute('title', 'Delete bookmark');
  if (onDelete) {
    deleteBtn.addEventListener('click', () => {
      console.log('Delete button clicked for:', bookmark.id, bookmark.title);
      onDelete(bookmark.id, bookmark.title);
    });
  } else {
    console.warn('No onDelete handler provided for bookmark:', bookmark);
  }
  actionsDiv.appendChild(deleteBtn);
  const openBtn = document.createElement('button');
  openBtn.className = 'secondary';
  openBtn.textContent = '🔗 Open';
  openBtn.setAttribute('aria-label', `Open bookmark: ${bookmark.title}`);
  openBtn.setAttribute('title', 'Open bookmark in new tab');
  if (onOpen) {
    openBtn.addEventListener('click', () => {
      console.log('Open button clicked for:', bookmark.url);
      onOpen(bookmark.url);
    });
  } else {
    console.warn('No onOpen handler provided for bookmark:', bookmark);
  }
  actionsDiv.appendChild(openBtn);
  contentDiv.appendChild(actionsDiv);
  listItem.appendChild(contentDiv);
  return listItem;
}
