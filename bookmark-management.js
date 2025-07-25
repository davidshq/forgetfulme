/**
 * @fileoverview Bookmark management page for ForgetfulMe extension
 * @module bookmark-management
 * @description Full-page interface for managing bookmarks with search, filter, and bulk operations
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import AuthStateManager from './utils/auth-state-manager.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import ConfigManager from './utils/config-manager.js';
import BookmarkTransformer from './utils/bookmark-transformer.js';
import SupabaseConfig from './supabase-config.js';
import SupabaseService from './supabase-service.js';
import { formatStatus, formatTime } from './utils/formatters.js';

/**
 * Bookmark management page class
 * @class BookmarkManagementPage
 * @description Manages the full-page bookmark management interface
 */
class BookmarkManagementPage {
  /**
   * Initialize the bookmark management page
   * @constructor
   */
  constructor() {
    /** @type {ConfigManager} Configuration manager for user preferences */
    this.configManager = new ConfigManager();
    /** @type {AuthStateManager} Authentication state manager */
    this.authStateManager = new AuthStateManager();
    /** @type {SupabaseConfig} Supabase configuration manager */
    this.supabaseConfig = new SupabaseConfig();
    /** @type {SupabaseService} Supabase service for data operations */
    this.supabaseService = new SupabaseService(this.supabaseConfig);

    /** @type {HTMLElement} Main app container */
    this.appContainer = null;

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  /**
   * Initialize the page asynchronously after DOM is ready
   * @async
   * @throws {Error} When initialization fails
   */
  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.initializeAsync'
      );
      // Failed to initialize bookmark management page
    }
  }

  /**
   * Initialize authentication state and set up listeners
   * @async
   * @throws {Error} When auth state initialization fails
   */
  async initializeAuthState() {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener(session => {
        this.handleAuthStateChange(session);
      });
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.initializeAuthState'
      );
      // Failed to initialize auth state
    }
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - The current session object or null if not authenticated
   * @description Updates the interface based on authentication state
   */
  handleAuthStateChange(session) {
    if (session) {
      // User is authenticated, show main interface
      this.showMainInterface();
    } else {
      // User is not authenticated, show auth interface
      this.showAuthInterface();
    }
  }

  /**
   * Initialize DOM elements
   * @method initializeElements
   * @description Sets up references to DOM elements
   */
  initializeElements() {
    this.appContainer = UIComponents.DOM.getElement('app');
    if (!this.appContainer) {
      throw ErrorHandler.createError(
        'App container not found',
        ErrorHandler.ERROR_TYPES.UI,
        'bookmark-management.initializeElements'
      );
    }
  }

  /**
   * Initialize the application
   * @async
   * @throws {Error} When initialization fails
   */
  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        this.showSetupInterface();
        return;
      }

      // Initialize Supabase with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await this.supabaseService.initialize();
          break; // Success, exit the retry loop
        } catch (error) {
          retryCount++;
          // Supabase initialization attempt failed, retrying...

          if (retryCount >= maxRetries) {
            throw error; // Re-throw if we've exhausted retries
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Check if user is authenticated using auth state manager
      const isAuthenticated = await this.authStateManager.isAuthenticated();

      if (isAuthenticated) {
        this.showMainInterface();
      } else {
        this.showAuthInterface();
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.initializeApp'
      );
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
      this.showSetupInterface();
    }
  }

  /**
   * Show setup interface when Supabase is not configured
   */
  showSetupInterface() {
    // Create main container
    const container = UIComponents.createContainer(
      'Welcome to ForgetfulMe!',
      'This extension helps you mark websites as read for research purposes.',
      'setup-container'
    );

    // Create setup section
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
      () => this.openSettings(),
      'primary'
    );
    setupSection.appendChild(settingsBtn);
    container.appendChild(setupSection);

    // Create how it works section
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

    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(container);
  }

  /**
   * Show authentication interface
   * @method showAuthInterface
   * @description Displays authentication interface when user is not authenticated
   */
  showAuthInterface() {
    this.appContainer.innerHTML = `
      <div class="auth-container">
        <h2>Authentication Required</h2>
        <p>Please authenticate in the extension popup to access bookmark management.</p>
        <button onclick="window.close()" class="primary">Close</button>
      </div>
    `;
  }

  /**
   * Show main bookmark management interface
   * @method showMainInterface
   * @description Displays the main bookmark management interface with search, filter, and bulk operations
   */
  showMainInterface() {
    // Create breadcrumb navigation
    const breadcrumbItems = [
      { text: 'ForgetfulMe', href: '#' },
      { text: 'Bookmark Management' }, // Current page
    ];

    const breadcrumb = UIComponents.createBreadcrumb(breadcrumbItems, 'page-breadcrumb');

    // Create header with navigation
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

    // Create main content container with sidebar layout using Pico components
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.setAttribute('role', 'main');

    // Create sidebar for search and filters using Pico layout
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.setAttribute('role', 'complementary');

    // Create search card
    const searchForm = UIComponents.createForm(
      'search-form',
      e => {
        e.preventDefault();
        this.searchBookmarks();
      },
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

    // Create bulk actions card
    const bulkActions = [
      {
        text: 'Select All',
        onClick: () => this.toggleSelectAll(),
        className: 'secondary',
      },
      {
        text: 'Delete Selected',
        onClick: () => this.deleteSelectedBookmarks(),
        className: 'contrast',
      },
      {
        text: 'Export Selected',
        onClick: () => this.exportSelectedBookmarks(),
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

    // Create content area for bookmarks
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    contentArea.setAttribute('role', 'main');

    // Create bookmarks list container
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

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(breadcrumb);
    this.appContainer.appendChild(header);
    this.appContainer.appendChild(mainContent);
    mainContent.appendChild(sidebar);
    mainContent.appendChild(contentArea);

    // Load bookmarks
    this.loadAllBookmarks();

    // Bind bulk action events
    this.bindBulkActions();
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
      const bookmarks = await this.supabaseService.getBookmarks({ limit: 100 });
      this.displayBookmarks(bookmarks);
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.loadAllBookmarks'
      );
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Display bookmarks in the list
   * @method displayBookmarks
   * @param {Array} bookmarks - Array of bookmark objects to display
   * @description Renders bookmarks in the list with proper formatting and accessibility
   */
  displayBookmarks(bookmarks) {
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

    // Convert to UI format and create list items
    const uiBookmarks = bookmarks.map(bookmark =>
      BookmarkTransformer.toUIFormat(bookmark)
    );

    uiBookmarks.forEach((bookmark, index) => {
      const listItem = this.createBookmarkListItem(bookmark, index);
      bookmarksList.appendChild(listItem);
    });

    // Update bulk actions
    this.updateBulkActions();
  }

  /**
   * Create a bookmark list item with edit and delete actions
   * @method createBookmarkListItem
   * @param {Object} bookmark - The bookmark to display
   * @param {number} index - The index of the bookmark in the list
   * @returns {HTMLElement} The list item element
   */
  createBookmarkListItem(bookmark, index) {
    const listItem = document.createElement('div');
    listItem.className = 'bookmark-item';
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute(
      'aria-label',
      `Bookmark ${index + 1}: ${bookmark.title}`
    );

    // Add checkbox for bulk selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bookmark-checkbox';
    checkbox.dataset.bookmarkId = bookmark.id;
    checkbox.setAttribute(
      'aria-label',
      `Select ${bookmark.title} for bulk action`
    );
    checkbox.addEventListener('change', () => this.updateBulkActions());
    listItem.appendChild(checkbox);

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bookmark-content';

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'bookmark-title';
    titleDiv.textContent = bookmark.title;
    titleDiv.setAttribute('title', bookmark.title);
    contentDiv.appendChild(titleDiv);

    // Add meta information
    const metaDiv = document.createElement('div');
    metaDiv.className = 'bookmark-meta';

    // Add status badge
    const statusSpan = document.createElement('span');
    statusSpan.className = `bookmark-status status-${bookmark.status}`;
          statusSpan.textContent = formatStatus(bookmark.status);
    statusSpan.setAttribute(
      'aria-label',
              `Status: ${formatStatus(bookmark.status)}`
    );
    metaDiv.appendChild(statusSpan);

    // Add time
    const timeSpan = document.createElement('span');
    timeSpan.className = 'bookmark-time';
          timeSpan.textContent = formatTime(
      new Date(bookmark.created_at).getTime()
    );
    timeSpan.setAttribute(
      'aria-label',
              `Created ${formatTime(new Date(bookmark.created_at).getTime())}`
    );
    metaDiv.appendChild(timeSpan);

    // Add tags if they exist
    if (bookmark.tags && bookmark.tags.length > 0) {
      const tagsSpan = document.createElement('span');
      tagsSpan.className = 'bookmark-tags';
      tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
      tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
      metaDiv.appendChild(tagsSpan);
    }

    contentDiv.appendChild(metaDiv);

    // Add action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'bookmark-actions';
    actionsDiv.setAttribute('role', 'group');
    actionsDiv.setAttribute('aria-label', `Actions for ${bookmark.title}`);

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = '✏️ Edit';
    editBtn.setAttribute('aria-label', `Edit bookmark: ${bookmark.title}`);
    editBtn.setAttribute('title', 'Edit bookmark');
    editBtn.addEventListener('click', () => this.editBookmark(bookmark));
    actionsDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'contrast';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.setAttribute('aria-label', `Delete bookmark: ${bookmark.title}`);
    deleteBtn.setAttribute('title', 'Delete bookmark');
    deleteBtn.addEventListener('click', () =>
      this.deleteBookmark(bookmark.id, bookmark.title)
    );
    actionsDiv.appendChild(deleteBtn);

    const openBtn = document.createElement('button');
    openBtn.className = 'secondary';
    openBtn.textContent = '🔗 Open';
    openBtn.setAttribute('aria-label', `Open bookmark: ${bookmark.title}`);
    openBtn.setAttribute('title', 'Open bookmark in new tab');
    openBtn.addEventListener('click', () => this.openBookmark(bookmark.url));
    actionsDiv.appendChild(openBtn);

    contentDiv.appendChild(actionsDiv);
    listItem.appendChild(contentDiv);

    return listItem;
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
      const searchQuery = UIComponents.DOM.getValue('search-query') || '';
      const statusFilter = UIComponents.DOM.getValue('status-filter') || '';

      const filters = { limit: 100 };

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (statusFilter) {
        filters.status = statusFilter;
      }

      const bookmarks = await this.supabaseService.getBookmarks(filters);
      this.displayBookmarks(bookmarks);
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.searchBookmarks'
      );
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Edit a bookmark
   * @method editBookmark
   * @param {Object} bookmark - The bookmark to edit
   * @description Shows the edit interface for the specified bookmark
   */
  editBookmark(bookmark) {
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

    this.showEditInterface(dbBookmark);
  }

  /**
   * Show edit interface for a bookmark
   * @method showEditInterface
   * @param {Object} existingBookmark - The bookmark to edit
   * @description Displays the edit interface for the specified bookmark
   */
  showEditInterface(existingBookmark) {
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'Edit Bookmark';
    header.appendChild(title);

    const backBtn = UIComponents.createButton(
      '← Back to List',
      () => this.showMainInterface(),
      'secondary',
      { title: 'Back to bookmark list' }
    );
    header.appendChild(backBtn);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Create info section
    const infoSection = UIComponents.createSection(
      'Bookmark Info',
      'info-section'
    );
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
        this.updateBookmark(existingBookmark.id);
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
            value: existingBookmark.tags
              ? existingBookmark.tags.join(', ')
              : '',
          },
        },
      ],
      {
        submitText: 'Update Bookmark',
      }
    );

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(header);
    this.appContainer.appendChild(mainContent);
    mainContent.appendChild(infoSection);
    mainContent.appendChild(editForm);
  }

  /**
   * Update a bookmark
   * @async
   * @method updateBookmark
   * @param {string} bookmarkId - The ID of the bookmark to update
   * @description Updates the bookmark with new status and tags
   * @throws {Error} When update fails
   */
  async updateBookmark(bookmarkId) {
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

      await this.supabaseService.updateBookmark(bookmarkId, updateData);

      UIMessages.success('Bookmark updated successfully!', this.appContainer);

      // Return to main interface after a short delay
      setTimeout(() => {
        this.showMainInterface();
      }, 1500);
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.updateBookmark'
      );
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Delete a bookmark with confirmation
   * @async
   * @method deleteBookmark
   * @param {string} bookmarkId - The ID of the bookmark to delete
   * @param {string} bookmarkTitle - The title of the bookmark for confirmation
   * @description Deletes a bookmark with user confirmation
   * @throws {Error} When deletion fails
   */
  async deleteBookmark(bookmarkId, bookmarkTitle) {
    UIMessages.confirm(
      `Are you sure you want to delete "${bookmarkTitle}"? This action cannot be undone.`,
      async () => {
        try {
          await this.supabaseService.deleteBookmark(bookmarkId);
          UIMessages.success(
            'Bookmark deleted successfully!',
            this.appContainer
          );
          this.loadAllBookmarks();
        } catch (error) {
          const errorResult = ErrorHandler.handle(
            error,
            'bookmark-management.deleteBookmark'
          );
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer
    );
  }

  /**
   * Open bookmark in new tab
   * @method openBookmark
   * @param {string} url - The URL to open
   * @description Opens the bookmark URL in a new tab
   */
  openBookmark(url) {
    chrome.tabs.create({ url });
  }

  /**
   * Bind bulk action events
   * @method bindBulkActions
   * @description Sets up event listeners for bulk action buttons
   */
  bindBulkActions() {
    const selectAllBtn = document.getElementById('select-all');
    const deleteSelectedBtn = document.getElementById('delete-selected');
    const exportSelectedBtn = document.getElementById('export-selected');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
    }

    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () =>
        this.deleteSelectedBookmarks()
      );
    }

    if (exportSelectedBtn) {
      exportSelectedBtn.addEventListener('click', () =>
        this.exportSelectedBookmarks()
      );
    }
  }

  /**
   * Toggle select all bookmarks
   * @method toggleSelectAll
   * @description Selects or deselects all visible bookmarks
   */
  toggleSelectAll() {
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

    this.updateBulkActions();
  }

  /**
   * Update bulk action buttons based on selection
   * @method updateBulkActions
   * @description Enables/disables bulk action buttons based on checkbox selection
   */
  updateBulkActions() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    const selectedCount = Array.from(checkboxes).filter(
      cb => cb.checked
    ).length;

    const deleteSelectedBtn = document.getElementById('delete-selected');
    const exportSelectedBtn = document.getElementById('export-selected');

    if (deleteSelectedBtn) {
      deleteSelectedBtn.disabled = selectedCount === 0;
    }

    if (exportSelectedBtn) {
      exportSelectedBtn.disabled = selectedCount === 0;
    }
  }

  /**
   * Delete selected bookmarks
   * @async
   * @method deleteSelectedBookmarks
   * @description Deletes all selected bookmarks with confirmation
   */
  async deleteSelectedBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.bookmarkId);

    if (selectedIds.length === 0) return;

    UIMessages.confirm(
      `Are you sure you want to delete ${selectedIds.length} bookmark(s)? This action cannot be undone.`,
      async () => {
        try {
          for (const bookmarkId of selectedIds) {
            await this.supabaseService.deleteBookmark(bookmarkId);
          }

          UIMessages.success(
            `${selectedIds.length} bookmark(s) deleted successfully!`,
            this.appContainer
          );
          this.loadAllBookmarks();
        } catch (error) {
          const errorResult = ErrorHandler.handle(
            error,
            'bookmark-management.deleteSelectedBookmarks'
          );
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer
    );
  }

  /**
   * Export selected bookmarks
   * @async
   * @method exportSelectedBookmarks
   * @description Exports selected bookmarks to JSON format
   */
  async exportSelectedBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.bookmarkId);

    if (selectedIds.length === 0) return;

    try {
      const bookmarks = [];
      for (const bookmarkId of selectedIds) {
        const bookmark = await this.supabaseService.getBookmarkById(bookmarkId);
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
        this.appContainer
      );
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'bookmark-management.exportSelectedBookmarks'
      );
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }



  /**
   * Open settings page
   * @method openSettings
   * @description Opens the extension settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize bookmark management page immediately
new BookmarkManagementPage();

// Export for testing
export default BookmarkManagementPage;
