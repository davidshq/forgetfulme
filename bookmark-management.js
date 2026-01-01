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
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import { initializeServices } from './utils/service-initializer.js';
import { initializeApp as initializeAppUtil } from './utils/app-initializer.js';
import { showSetupInterface } from './utils/setup-interface.js';
import { BookmarkList } from './components/bookmark-list.js';
import { SearchFilter } from './components/search-filter.js';
import { BulkActions } from './components/bulk-actions.js';
import { BookmarkEditor } from './components/bookmark-editor.js';
import { BookmarkManagementCoordinator } from './utils/bookmark-management-coordinator.js';

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
    // Initialize services using utility (no AuthUI needed for bookmark management)
    const services = initializeServices({
      onAuthSuccess: () => {}, // Not used in bookmark management
    });
    this.configManager = services.configManager;
    this.authStateManager = services.authStateManager;
    this.supabaseConfig = services.supabaseConfig;
    this.supabaseService = services.supabaseService;

    /** @type {HTMLElement} Main app container */
    this.appContainer = null;

    // Initialize components (order matters - bulkActions must be before bookmarkList)
    this.bulkActions = new BulkActions({
      onSelectAll: () => this.bulkActions.toggleSelectAll(),
      onDeleteSelected: () => this.coordinator.deleteSelectedBookmarks(),
      onExportSelected: () => this.coordinator.exportSelectedBookmarks(),
    });

    this.bookmarkList = new BookmarkList({
      onEdit: bookmark => this.editBookmark(bookmark),
      onDelete: (id, title) => this.deleteBookmark(id, title),
      onOpen: url => this.openBookmark(url),
      onSelectionChange: () => this.bulkActions.updateBulkActions(),
    });

    this.searchFilter = new SearchFilter({
      onSearch: () => this.coordinator.searchBookmarks(),
    });

    this.bookmarkEditor = new BookmarkEditor({
      onUpdate: id => this.updateBookmark(id),
      onCancel: () => this.showMainInterface(),
    });

    // Initialize coordinator
    this.coordinator = new BookmarkManagementCoordinator(this);

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
      ErrorHandler.handle(error, 'bookmark-management.initializeAsync');
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
      ErrorHandler.handle(error, 'bookmark-management.initializeAuthState');
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
        'bookmark-management.initializeElements',
      );
    }
  }

  /**
   * Initialize the application
   * @async
   * @throws {Error} When initialization fails
   */
  async initializeApp() {
    await initializeAppUtil({
      supabaseConfig: this.supabaseConfig,
      supabaseService: this.supabaseService,
      authStateManager: this.authStateManager,
      onConfigured: () => this.showSetupInterface(),
      onAuthenticated: () => this.showMainInterface(),
      onUnauthenticated: () => this.showAuthInterface(),
      appContainer: this.appContainer,
      context: 'bookmark-management.initializeApp',
    });
  }

  /**
   * Show setup interface when Supabase is not configured
   */
  showSetupInterface() {
    showSetupInterface(this.appContainer, () => this.openSettings());
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

    const header = UIComponents.createHeaderWithNav('Bookmark Management', navItems, {
      titleId: 'page-title',
      navAriaLabel: 'Page actions',
      navClassName: 'header-nav',
    });

    // Create main content container with sidebar layout using Pico components
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.setAttribute('role', 'main');

    // Create sidebar for search and filters using Pico layout
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.setAttribute('role', 'complementary');

    // Create search card using component
    const searchCard = this.searchFilter.createSearchForm();
    sidebar.appendChild(searchCard);

    // Create bulk actions card using component
    const bulkCard = this.bulkActions.createBulkActionsCard();
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
      'bookmarks-card',
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
    this.coordinator.loadAllBookmarks();
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
    this.bookmarkEditor.showEditInterface(existingBookmark, this.appContainer);
  }

  /**
   * Update a bookmark
   * @async
   * @method updateBookmark
   * @param {string} bookmarkId - The ID of the bookmark to update
   * @description Updates the bookmark with new status and tags, then updates only the changed item
   * @throws {Error} When update fails
   */
  async updateBookmark(bookmarkId) {
    try {
      const updateData = this.bookmarkEditor.getUpdateData();

      await this.supabaseService.updateBookmark(bookmarkId, updateData);

      // Fetch the updated bookmark and update only that item
      const updatedBookmark = await this.supabaseService.getBookmarkById(bookmarkId);
      const bookmarksList = UIComponents.DOM.getElement('bookmarks-list');
      if (bookmarksList && updatedBookmark) {
        this.bookmarkList.updateBookmarkItem(updatedBookmark, bookmarksList);
        this.bulkActions.updateBulkActions();
      }

      UIMessages.success('Bookmark updated successfully!', this.appContainer);

      // Return to main interface after a short delay
      setTimeout(() => {
        this.showMainInterface();
      }, 1500);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'bookmark-management.updateBookmark');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  /**
   * Delete a bookmark with confirmation
   * @async
   * @method deleteBookmark
   * @param {string} bookmarkId - The ID of the bookmark to delete
   * @param {string} bookmarkTitle - The title of the bookmark for confirmation
   * @description Deletes a bookmark with user confirmation, then removes only that item
   * @throws {Error} When deletion fails
   */
  async deleteBookmark(bookmarkId, bookmarkTitle) {
    UIMessages.confirm(
      `Are you sure you want to delete "${bookmarkTitle}"? This action cannot be undone.`,
      async () => {
        try {
          await this.supabaseService.deleteBookmark(bookmarkId);

          // Remove only the deleted item instead of re-rendering the entire list
          const bookmarksList = UIComponents.DOM.getElement('bookmarks-list');
          if (bookmarksList) {
            this.bookmarkList.removeBookmarkItem(bookmarkId, bookmarksList);
            this.bulkActions.updateBulkActions();
          }

          UIMessages.success('Bookmark deleted successfully!', this.appContainer);
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'bookmark-management.deleteBookmark');
          UIMessages.error(errorResult.userMessage, this.appContainer);
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer,
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
