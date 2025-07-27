// UI rendering functions for bookmark management

/**
 * Show setup interface when Supabase is not configured
 */
export function showSetupInterface({
  UIComponents,
  appContainer,
  openSettings,
}) {
  const container = UIComponents.createContainer(
    'Welcome to ForgetfulMe!',
    'This extension helps you mark websites as read for research purposes.',
    'setup-container'
  );

  const setupSection = UIComponents.createSection(
    '🔧 Setup Required',
    'setup-section'
  );
  setupSection.innerHTML = `
    <p>To use this extension, you need to configure your Supabase backend:</p>
    <ol>
      <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
      <li>Get your Project URL and anon public key</li>
      <li>Open the extension settings to configure</li>
    </ol>
  `;
  const settingsBtn = UIComponents.createButton(
    'Open Settings',
    openSettings,
    'primary'
  );
  setupSection.appendChild(settingsBtn);
  container.appendChild(setupSection);

  const howItWorksSection = UIComponents.createSection(
    '📚 How it works',
    'setup-section'
  );
  howItWorksSection.innerHTML = `
    <ul>
      <li>Click the extension icon to mark the current page</li>
      <li>Choose a status (Read, Good Reference, etc.)</li>
      <li>Add tags to organize your entries</li>
      <li>View your recent entries in the popup</li>
    </ul>
  `;
  container.appendChild(howItWorksSection);

  appContainer.innerHTML = '';
  appContainer.appendChild(container);
}

/**
 * Show authentication interface
 */
export function showAuthInterface({ appContainer }) {
  appContainer.innerHTML = `
    <div class="auth-container">
      <h2>Authentication Required</h2>
      <p>Please authenticate in the extension popup to access bookmark management.</p>
      <button onclick="window.close()" class="primary">Close</button>
    </div>
  `;
}

/**
 * Show main bookmark management interface
 */
export function showMainInterface({
  UIComponents,
  appContainer,
  onSearch,
  onSelectAll,
  onDeleteSelected,
  onExportSelected,
  loadAllBookmarks,
  bindBulkActions,
}) {
  const breadcrumbItems = [
    { text: 'ForgetfulMe', href: '#' },
    { text: 'Bookmark Management' },
  ];
  const breadcrumb = UIComponents.createBreadcrumb(
    breadcrumbItems,
    'page-breadcrumb'
  );
  const navItems = [
    {
      text: '← Back to Extension',
      onClick: () => window.close(),
      className: 'secondary',
      title: 'Close bookmark management and return to extension',
      'aria-label': 'Close bookmark management and return to extension',
    },
  ];
  const header = UIComponents.createHeaderWithNav(
    'Bookmark Management',
    navItems,
    {
      titleId: 'page-title',
      navAriaLabel: 'Page actions',
      navClassName: 'header-nav',
    }
  );
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  mainContent.setAttribute('role', 'main');
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.setAttribute('role', 'complementary');
  const searchForm = UIComponents.createForm(
    'search-form',
    onSearch,
    [
      {
        type: 'text',
        id: 'search-query',
        label: 'Search Bookmarks:',
        options: {
          placeholder: 'Search by title, URL, or tags...',
          helpText: 'Search through your bookmarks',
        },
      },
      {
        type: 'select',
        id: 'status-filter',
        label: 'Filter by Status:',
        options: {
          options: [
            { value: 'all', text: 'All Statuses' },
            { value: 'read', text: 'Read' },
            { value: 'good-reference', text: 'Good Reference' },
            { value: 'low-value', text: 'Low Value' },
            { value: 'revisit-later', text: 'Revisit Later' },
          ],
          helpText: 'Filter bookmarks by their status',
        },
      },
    ],
    {
      submitText: 'Search',
      className: 'search-form',
    }
  );
  const searchCard = UIComponents.createCard(
    'Search & Filter',
    searchForm.outerHTML,
    '',
    'search-card'
  );
  sidebar.appendChild(searchCard);
  const bulkActions = [
    {
      text: 'Select All',
      onClick: onSelectAll,
      className: 'secondary',
    },
    {
      text: 'Delete Selected',
      onClick: onDeleteSelected,
      className: 'contrast',
    },
    {
      text: 'Export Selected',
      onClick: onExportSelected,
      className: 'secondary',
    },
  ];
  const bulkCard = UIComponents.createCardWithActions(
    'Bulk Actions',
    '<p>Select multiple bookmarks to perform bulk operations like deletion or export.</p>',
    bulkActions,
    'bulk-actions-card'
  );
  sidebar.appendChild(bulkCard);
  const contentArea = document.createElement('div');
  contentArea.className = 'content-area';
  contentArea.setAttribute('role', 'main');
  const bookmarksList = document.createElement('div');
  bookmarksList.id = 'bookmarks-list';
  bookmarksList.setAttribute('role', 'list');
  bookmarksList.setAttribute('aria-label', 'Bookmarks');
  const bookmarksCard = UIComponents.createCard(
    'Bookmarks',
    bookmarksList.outerHTML,
    '',
    'bookmarks-card'
  );
  contentArea.appendChild(bookmarksCard);
  appContainer.innerHTML = '';
  appContainer.appendChild(breadcrumb);
  appContainer.appendChild(header);
  appContainer.appendChild(mainContent);
  mainContent.appendChild(sidebar);
  mainContent.appendChild(contentArea);
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
