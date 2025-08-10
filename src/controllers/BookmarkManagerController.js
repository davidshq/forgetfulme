/**
 * @fileoverview Clean Grid.js-based Bookmark Manager Controller
 */

import { BaseController } from './BaseController.js';
import { $, show, hide } from '../utils/dom.js';
import { loadHTMLComponent } from '../utils/componentLoader.js';
import { AuthModalComponent } from '../ui/components/AuthModalComponent.js';

/**
 * Controller for the bookmark manager page with Grid.js
 */
export class BookmarkManagerController extends BaseController {
  /**
   * @param {AuthService} authService - Authentication service
   * @param {BookmarkService} bookmarkService - Bookmark service
   * @param {ConfigService} configService - Configuration service
   * @param {ValidationService} validationService - Validation service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(authService, bookmarkService, configService, validationService, errorService) {
    super(errorService);
    this.authService = authService;
    this.bookmarkService = bookmarkService;
    this.configService = configService;
    this.validationService = validationService;

    // State
    this.grid = null;
    this.bookmarks = [];
    this.statusTypes = [];
    this.currentSearch = {};
    this.authModal = null;
    this.authModalLoading = false; // Prevent concurrent initialization
    this.eventListenersSetup = false;
  }

  /**
   * Initialize the bookmark manager
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('BookmarkManagerController: Starting initialization');

    await this.safeExecute(async () => {
      // Initialize auth service first
      const isAuthInitialized = await this.authService.initialize();
      if (!isAuthInitialized) {
        // Hide loading state and show auth modal
        hide($('#loading-state'));
        await this.showAuthModal('signin');
        return;
      }

      // Check authentication after initialization
      if (!this.authService.isAuthenticated()) {
        // Hide loading state and show auth modal
        hide($('#loading-state'));
        await this.showAuthModal('signin');
        return;
      }

      // Initialize services
      await this.bookmarkService.initialize();

      // Load status types
      this.statusTypes = await this.configService.getStatusTypes();

      // Set up the UI (only once)
      if (!this.eventListenersSetup) {
        this.setupEventListeners();
        this.eventListenersSetup = true;
      }
      this.updateStatusFilters();
      await this.updateUserInfo();

      // Initialize the grid
      await this.initializeGrid();

      console.log('BookmarkManagerController: Initialization complete');
    }, 'BookmarkManagerController.initialize');
  }

  /**
   * Initialize Grid.js table
   */
  async initializeGrid() {
    const container = $('#bookmark-grid');
    if (!container) {
      console.error('Grid container not found');
      return;
    }

    if (!window.gridjs) {
      console.error('Grid.js not loaded');
      return;
    }

    // Show the container and clear any existing content
    show(container);
    hide($('#loading-state'));
    container.replaceChildren(); // Clear the container for Grid.js safely

    // Create simple grid
    this.grid = new window.gridjs.Grid({
      columns: [
        'Title',
        {
          name: 'URL',
          formatter: cell =>
            window.gridjs.html(`<div class="bookmark-url" title="${cell}">${cell}</div>`)
        },
        'Status',
        'Tags',
        'Date'
      ],
      data: async () => {
        try {
          const result = await this.bookmarkService.searchBookmarks(this.currentSearch);
          this.bookmarks = result.items || [];
          this.updateBookmarkCount();

          return this.bookmarks.map(bookmark => [
            bookmark.title || 'Untitled',
            bookmark.url,
            this.getStatusName(bookmark.status),
            (bookmark.tags || []).join(', '),
            new Date(bookmark.created_at).toLocaleDateString()
          ]);
        } catch (error) {
          console.error('Error loading bookmarks:', error);
          return [];
        }
      },
      search: {
        enabled: true,
        placeholder: 'Search all bookmarks...'
      },
      sort: true,
      pagination: {
        enabled: true,
        limit: 25,
        summary: true
      },
      className: {
        container: 'gridjs-wrapper',
        table: 'gridjs-table'
      }
    });

    // Render the grid
    this.grid.render(container);
  }

  /**
   * Get status name by ID
   * @param {string} statusId - Status ID
   * @returns {string} Status name
   */
  getStatusName(statusId) {
    const status = this.statusTypes.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Apply filters button
    const applyBtn = $('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyFilters());
    }

    // Clear filters button
    const clearBtn = $('#clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }

    // Refresh button
    const refreshBtn = $('#refresh-bookmarks');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshBookmarks());
    }

    // Settings button - always goes to options page
    const settingsBtn = $('#open-options');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }
  }

  /**
   * Apply filters
   */
  async applyFilters() {
    const statusFilter = $('#status-filter');
    const tagFilter = $('#tag-filter');

    // Map UI filters to BookmarkService expected format (statuses/tags arrays)
    this.currentSearch = {};

    // Status filter: convert single value to array if present
    if (statusFilter?.value) {
      this.currentSearch.statuses = [statusFilter.value];
    }

    // Tag filter: split comma-separated values into array if present
    if (tagFilter?.value) {
      // Split tags by comma and validate them properly
      const rawTags = tagFilter.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Use ValidationService to properly sanitize and validate tags
      if (rawTags.length > 0) {
        const tagValidation = this.validationService.validateTags(rawTags);
        if (tagValidation.isValid) {
          this.currentSearch.tags = tagValidation.data;
        } else {
          // Some tags were invalid - show user-friendly message
          const validTagCount = tagValidation.data?.length || 0;
          const invalidTagCount = rawTags.length - validTagCount;

          if (validTagCount > 0 && invalidTagCount > 0) {
            // Show non-blocking notification about filtered tags
            console.info(
              `Applied ${validTagCount} valid tags. ${invalidTagCount} invalid tags were filtered out.`
            );
            this.showTagFilterMessage(
              `Applied ${validTagCount} tag${validTagCount !== 1 ? 's' : ''}. ${invalidTagCount} invalid tag${invalidTagCount !== 1 ? 's' : ''} filtered out.`
            );
          } else if (validTagCount === 0) {
            // All tags were invalid
            console.warn('No valid tags found:', tagValidation.errors);
            this.showTagFilterMessage(
              'No valid tags found. Tags must contain only letters, numbers, and hyphens.'
            );
          }

          // Use the valid tags that passed validation (could be empty array)
          this.currentSearch.tags = tagValidation.data || [];
        }
      }
    }

    // Refresh the grid
    if (this.grid) {
      this.grid.forceRender();
    }
  }

  /**
   * Clear filters
   */
  clearFilters() {
    const statusFilter = $('#status-filter');
    const tagFilter = $('#tag-filter');

    if (statusFilter) statusFilter.value = '';
    if (tagFilter) tagFilter.value = '';

    this.currentSearch = {};

    if (this.grid) {
      this.grid.forceRender();
    }
  }

  /**
   * Refresh bookmarks
   */
  refreshBookmarks() {
    if (this.grid) {
      this.grid.forceRender();
    }
  }

  /**
   * Update status filter options
   */
  updateStatusFilters() {
    const statusFilter = $('#status-filter');
    if (!statusFilter) return;

    // Clear existing options except first
    const firstOption = statusFilter.options[0];
    statusFilter.innerHTML = '';
    if (firstOption) {
      statusFilter.appendChild(firstOption);
    }

    // Add status options
    this.statusTypes.forEach(status => {
      const option = document.createElement('option');
      option.value = status.id;
      option.textContent = status.name;
      statusFilter.appendChild(option);
    });
  }

  /**
   * Update bookmark count display
   */
  updateBookmarkCount() {
    const countEl = $('#bookmark-count');
    if (countEl) {
      const count = this.bookmarks.length;
      countEl.textContent = `${count} bookmark${count !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Show non-blocking message about tag filtering
   * @param {string} message - Message to display
   * @private
   */
  showTagFilterMessage(message) {
    const messageArea = $('#message-area');
    if (!messageArea) return;

    // Create info message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-info';
    messageDiv.style.cssText =
      'padding: 0.5rem; margin: 0.5rem 0; background: var(--pico-primary-background); color: var(--pico-primary-inverse); border-radius: 0.25rem; font-size: 0.875rem;';
    messageDiv.textContent = message;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText =
      'float: right; background: none; border: none; color: inherit; font-size: 1.2em; cursor: pointer; padding: 0; margin-left: 0.5rem;';
    closeBtn.addEventListener('click', () => messageDiv.remove());
    messageDiv.appendChild(closeBtn);

    // Clear existing messages and add new one
    messageArea.replaceChildren(messageDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  /**
   * Update user info display
   */
  async updateUserInfo() {
    const userInfo = $('#user-info');
    if (!userInfo) return;

    try {
      if (this.authService.isAuthenticated()) {
        const profile = await this.authService.getUserProfile();
        userInfo.textContent = profile?.email || 'Signed in';
      } else {
        userInfo.textContent = '';
      }
    } catch (error) {
      console.log('Could not get user profile:', error);
      userInfo.textContent = 'Signed in';
    }
  }

  /**
   * Lazy-load and show the authentication modal
   * @param {string} defaultTab - Default tab to show ('signin' or 'signup')
   * @returns {Promise<void>}
   * @private
   */
  async showAuthModal(defaultTab = 'signin') {
    let initializationFailed = false;
    let wasLoading = false;

    try {
      // Only load and initialize if not already done or in progress
      if (!this.authModal && !this.authModalLoading) {
        this.authModalLoading = true;
        wasLoading = true;
        initializationFailed = true; // We're creating a new modal

        // Load auth modal component
        const componentUrl = chrome.runtime.getURL('src/ui/components/auth-modal.html');
        const loadSuccess = await loadHTMLComponent(componentUrl, '#auth-modal-container');

        if (!loadSuccess) {
          console.error('Failed to load auth modal component');
          this.showFallbackAuthMessage();
          return;
        }

        // Initialize auth modal
        this.authModal = new AuthModalComponent(
          this.authService,
          this.configService,
          this.errorService,
          this.validationService
        );

        await this.authModal.initialize(() => this.onAuthSuccess());

        // Verify initialization succeeded
        if (!this.authModal.isInitialized) {
          throw new Error('Auth modal initialization failed');
        }

        initializationFailed = false; // Initialization succeeded
      } else if (this.authModalLoading) {
        // Another call is already loading, wait for it to complete
        console.warn('Auth modal is already loading, waiting...');
        // Poll until loading is complete or fails
        while (this.authModalLoading && !this.authModal) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        // If still no modal after loading, something went wrong
        if (!this.authModal) {
          console.error('Auth modal loading failed from concurrent call');
          this.showFallbackAuthMessage();
          return;
        }
      }

      // Show the modal
      await this.authModal.show(defaultTab);
    } catch (error) {
      console.error('Error showing auth modal:', error);

      // Only clean up if initialization failed, not if show() failed
      if (initializationFailed && this.authModal) {
        try {
          this.authModal.destroy();
        } catch (destroyError) {
          console.error('Error destroying failed auth modal:', destroyError);
        }
        this.authModal = null;
      }

      this.showFallbackAuthMessage();
    } finally {
      // Always clear loading flag if we set it
      if (wasLoading) {
        this.authModalLoading = false;
      }
    }
  }

  /**
   * Show fallback authentication message when modal fails to load
   * @private
   */
  showFallbackAuthMessage() {
    const container = $('.bookmark-list-container');
    if (!container) return;

    hide($('#loading-state'));
    hide($('#bookmark-grid'));
    show(container);

    // Create elements safely without innerHTML
    const authDiv = document.createElement('div');
    authDiv.className = 'auth-required';
    authDiv.style.cssText = 'text-align: center; padding: 3rem;';

    const title = document.createElement('h3');
    title.textContent = 'Authentication Required';

    const message = document.createElement('p');
    message.textContent = 'Please sign in to access your bookmarks.';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = 'Open Settings';
    button.addEventListener('click', () => chrome.runtime.openOptionsPage());

    authDiv.appendChild(title);
    authDiv.appendChild(message);
    authDiv.appendChild(button);

    container.replaceChildren(authDiv);
  }

  /**
   * Show authentication required message
   * @deprecated Use showAuthModal instead
   */
  showAuthRequired() {
    // This method is deprecated - we now show the auth modal directly
    console.warn('showAuthRequired is deprecated - showing auth modal instead');
    if (this.authModal) {
      this.authModal.show('signin');
    } else {
      this.showAuthModal('signin');
    }
  }

  /**
   * Handle successful authentication
   */
  async onAuthSuccess() {
    console.log('Authentication successful, reinitializing...');

    try {
      // Verify authentication state before proceeding
      if (!this.authService.isAuthenticated()) {
        console.error('Auth success callback called but user is not authenticated');
        return;
      }

      // Hide the auth modal if it exists
      if (this.authModal) {
        this.authModal.hide();
      }

      // Clear any existing error states
      const messageArea = $('#message-area');
      if (messageArea) {
        messageArea.replaceChildren(); // Safer than innerHTML = ''
      }

      // Show loading state while reinitializing
      const loadingState = $('#loading-state');
      if (loadingState) {
        show(loadingState);
      }

      // Try to reinitialize services without reloading
      await this.bookmarkService.initialize();
      this.statusTypes = await this.configService.getStatusTypes();
      // Don't setup event listeners again - they're already set up
      this.updateStatusFilters();
      await this.updateUserInfo();
      await this.initializeGrid();

      console.log('BookmarkManagerController: Reinitialization complete');
    } catch (error) {
      console.error('Error during authentication success handling:', error);
      // Only reload as last resort if reinitialize fails
      console.log('Reinitialize failed, reloading page...');
      window.location.reload();
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    try {
      // Clean up Grid.js instance
      if (this.grid) {
        this.grid.destroy();
        this.grid = null;
      }

      // Clean up auth modal and its event listeners
      if (this.authModal) {
        // If AuthModalComponent has a destroy method, call it
        if (typeof this.authModal.destroy === 'function') {
          this.authModal.destroy();
        }
        this.authModal = null;
      }

      // Clear any references to prevent memory leaks
      this.bookmarks = [];
      this.statusTypes = [];
      this.currentSearch = {};
    } catch (error) {
      console.error('Error during BookmarkManagerController cleanup:', error);
    }
  }
}
