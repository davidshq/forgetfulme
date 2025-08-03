/**
 * @fileoverview Clean Grid.js-based Bookmark Manager Controller
 */

import { BaseController } from './BaseController.js';
import { $, show, hide } from '../utils/dom.js';

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
        this.showAuthRequired();
        return;
      }

      // Check authentication after initialization
      if (!this.authService.isAuthenticated()) {
        this.showAuthRequired();
        return;
      }

      // Initialize services
      await this.bookmarkService.initialize();

      // Load status types
      this.statusTypes = await this.configService.getStatusTypes();

      // Set up the UI
      this.setupEventListeners();
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
    container.innerHTML = ''; // Clear the container for Grid.js

    // Create simple grid
    this.grid = new window.gridjs.Grid({
      columns: ['Title', 'URL', 'Status', 'Tags', 'Date'],
      data: async () => {
        try {
          const result = await this.bookmarkService.searchBookmarks(this.currentSearch);
          this.bookmarks = result.items || [];
          this.updateBookmarkCount();

          return this.bookmarks.map(bookmark => [
            bookmark.title || 'Untitled',
            bookmark.url,
            this.getStatusName(bookmark.status_type),
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

    // Settings button
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

    this.currentSearch = {
      statusFilter: statusFilter?.value || undefined,
      tagFilter: tagFilter?.value || undefined
    };

    // Remove empty values
    Object.keys(this.currentSearch).forEach(key => {
      if (!this.currentSearch[key]) {
        delete this.currentSearch[key];
      }
    });

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
   * Show authentication required message
   */
  showAuthRequired() {
    const container = $('.bookmark-list-container');
    if (!container) return;

    hide($('#loading-state'));
    hide($('#bookmark-grid'));
    show(container);

    container.innerHTML = `
      <div class="auth-required" style="text-align: center; padding: 3rem;">
        <h3>Authentication Required</h3>
        <p>Please sign in to access your bookmarks.</p>
        <button type="button" class="secondary" onclick="chrome.runtime.openOptionsPage()">
          Open Settings
        </button>
      </div>
    `;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.grid) {
      this.grid.destroy();
      this.grid = null;
    }
  }
}
