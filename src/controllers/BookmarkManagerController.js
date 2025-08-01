/**
 * @fileoverview Bookmark manager controller for the ForgetfulMe extension
 */

import { BaseController } from './BaseController.js';
import { $, $$, show, hide, setFormData, createElement, clearElement } from '../utils/dom.js';
import { formatUrl } from '../utils/formatting.js';

/**
 * Controller for the bookmark manager page
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

    this.bookmarks = [];
    this.selectedBookmarks = new Set();
    this.statusTypes = [];
    this.currentSearch = {};
    this.currentPage = 1;
    this.pageSize = 25;
    this.totalCount = 0;
    this.isCompactView = false;
    this.editingBookmark = null;
  }

  /**
   * Initialize the bookmark manager controller
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check configuration first
      const isConfigured = await this.configService.isSupabaseConfigured();
      if (!isConfigured) {
        this.showAuthenticationRequired(
          'Configuration required. Please set up your Supabase credentials in Settings.'
        );
        return;
      }

      // Initialize auth service
      const isAuthInitialized = await this.authService.initialize();
      if (!isAuthInitialized) {
        this.showAuthenticationRequired(
          'Configuration required. Please set up your Supabase credentials in Settings.'
        );
        return;
      }

      // Check authentication
      if (!this.authService.isAuthenticated()) {
        this.showAuthenticationRequired('Please sign in to access bookmarks.');
        return;
      }

      // Initialize services
      await this.bookmarkService.initialize();

      // Load initial data
      await this.loadInitialData();

      // Set up event listeners
      this.setupEventListeners();

      // Load bookmarks
      await this.loadBookmarks();

      // Update UI
      this.updateUserInfo();
    } catch (error) {
      this.handleError(error, 'BookmarkManagerController.initialize');
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    await Promise.all([this.loadStatusTypes(), this.loadUserPreferences()]);
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    this.setupHeaderEventListeners();
    this.setupSearchEventListeners();
    this.setupToolbarEventListeners();
    this.setupBookmarkListEventListeners();
    this.setupPaginationEventListeners();
    this.setupModalEventListeners();
  }

  /**
   * Set up header event listeners
   */
  setupHeaderEventListeners() {
    this.addEventListener($('#refresh-bookmarks'), 'click', () => {
      this.handleRefresh();
    });

    this.addEventListener($('#open-options'), 'click', () => {
      this.openOptionsPage();
    });
  }

  /**
   * Set up search and filter event listeners
   */
  setupSearchEventListeners() {
    this.addEventListener($('#search-form'), 'submit', e => {
      e.preventDefault();
      this.handleSearch();
    });

    this.addEventListener($('#clear-search'), 'click', () => {
      this.handleClearSearch();
    });

    this.addEventListener($('#clear-filters'), 'click', () => {
      this.handleClearSearch();
    });
  }

  /**
   * Set up toolbar event listeners
   */
  setupToolbarEventListeners() {
    this.addEventListener($('#bulk-select-all'), 'change', e => {
      this.handleSelectAll(e.target.checked);
    });

    this.addEventListener($('#sort-by'), 'change', () => {
      this.handleSortChange();
    });

    this.addEventListener($('#sort-order'), 'change', () => {
      this.handleSortChange();
    });

    this.addEventListener($('#view-toggle'), 'click', () => {
      this.toggleCompactView();
    });

    this.addEventListener($('#bulk-status-update'), 'change', e => {
      if (e.target.value) {
        this.handleBulkStatusUpdate(e.target.value);
        e.target.value = '';
      }
    });

    this.addEventListener($('#bulk-delete'), 'click', () => {
      this.handleBulkDelete();
    });
  }

  /**
   * Set up bookmark list event listeners using event delegation
   */
  setupBookmarkListEventListeners() {
    this.addEventListener($('#bookmark-list'), 'change', e => {
      if (e.target.matches('.bookmark-checkbox')) {
        this.handleBookmarkSelect(e.target);
      }
    });

    this.addEventListener($('#bookmark-list'), 'click', e => {
      if (e.target.matches('.edit-bookmark')) {
        const bookmarkId = e.target.dataset.bookmarkId;
        this.handleEditBookmark(bookmarkId);
      } else if (e.target.matches('.delete-bookmark')) {
        const bookmarkId = e.target.dataset.bookmarkId;
        this.handleDeleteBookmark(bookmarkId);
      }
    });
  }

  /**
   * Set up pagination event listeners
   */
  setupPaginationEventListeners() {
    this.addEventListener($('#prev-page'), 'click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadBookmarks();
      }
    });

    this.addEventListener($('#next-page'), 'click', () => {
      const maxPage = Math.ceil(this.totalCount / this.pageSize);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.loadBookmarks();
      }
    });

    this.addEventListener($('#page-size'), 'change', e => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.loadBookmarks();
    });

    this.addEventListener($('#page-numbers'), 'click', e => {
      if (e.target.matches('.page-number:not(.disabled)')) {
        const page = parseInt(e.target.dataset.page, 10);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.loadBookmarks();
        }
      }
    });
  }

  /**
   * Set up modal event listeners
   */
  setupModalEventListeners() {
    this.addEventListener($('#close-modal'), 'click', () => {
      this.closeEditModal();
    });

    this.addEventListener($('#cancel-edit'), 'click', () => {
      this.closeEditModal();
    });

    this.addEventListener($('#edit-form'), 'submit', e => {
      e.preventDefault();
      this.handleSaveEdit();
    });

    this.addEventListener($('#cancel-delete'), 'click', () => {
      this.closeDeleteModal();
    });

    this.addEventListener($('#confirm-delete'), 'click', () => {
      this.handleConfirmDelete();
    });

    // Close modals on backdrop click
    this.addEventListener($('#edit-modal'), 'click', e => {
      if (e.target === e.currentTarget) {
        this.closeEditModal();
      }
    });

    this.addEventListener($('#delete-modal'), 'click', e => {
      if (e.target === e.currentTarget) {
        this.closeDeleteModal();
      }
    });
  }

  /**
   * Load status types
   */
  async loadStatusTypes() {
    await this.safeExecute(async () => {
      this.statusTypes = await this.configService.getStatusTypes();
      this.updateStatusSelects();
    }, 'BookmarkManagerController.loadStatusTypes');
  }

  /**
   * Update status select elements
   */
  updateStatusSelects() {
    const selects = $$('#status-filter, #bulk-status-update, #edit-status');

    selects.forEach(select => {
      if (!select) return;

      // Store current value
      const currentValue = select.value;

      // Clear status options (keep first option)
      Array.from(select.options).forEach((option, index) => {
        if (index > 0) option.remove();
      });

      // Add status type options
      this.statusTypes.forEach(statusType => {
        const option = document.createElement('option');
        option.value = statusType.id;
        option.textContent = statusType.name;
        select.appendChild(option);
      });

      // Restore value if still valid
      if (currentValue && this.statusTypes.some(s => s.id === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  /**
   * Load user preferences
   */
  async loadUserPreferences() {
    await this.safeExecute(async () => {
      const preferences = await this.configService.getUserPreferences();

      // Apply preferences
      this.pageSize = preferences.itemsPerPage || 25;
      this.isCompactView = preferences.compactView || false;

      // Update UI elements
      const pageSizeSelect = $('#page-size');
      if (pageSizeSelect) {
        pageSizeSelect.value = this.pageSize.toString();
      }

      const sortBySelect = $('#sort-by');
      if (sortBySelect) {
        sortBySelect.value = preferences.sortBy || 'created_at';
      }

      const sortOrderSelect = $('#sort-order');
      if (sortOrderSelect) {
        sortOrderSelect.value = preferences.sortOrder || 'desc';
      }

      // Update view toggle
      this.updateViewToggle();
    }, 'BookmarkManagerController.loadUserPreferences');
  }

  /**
   * Load bookmarks with current search and pagination
   */
  async loadBookmarks() {
    await this.safeExecute(
      async () => {
        this.showLoading('#bookmark-list', 'Loading bookmarks...');

        // Build search options
        const searchOptions = {
          ...this.currentSearch,
          page: this.currentPage,
          pageSize: this.pageSize,
          sortBy: $('#sort-by')?.value || 'created_at',
          sortOrder: $('#sort-order')?.value || 'desc'
        };

        // Execute search
        const result = await this.bookmarkService.searchBookmarks(searchOptions);

        this.bookmarks = result.items;
        this.totalCount = result.total;

        // Update UI
        this.renderBookmarks();
        this.updatePagination();
        this.updateBookmarkCount();
        this.clearSelection();
      },
      'BookmarkManagerController.loadBookmarks',
      '#bookmark-list'
    );
  }

  /**
   * Render bookmarks list
   */
  renderBookmarks() {
    const container = $('#bookmark-list');
    if (!container) return;

    this.hideLoading(container);

    if (this.bookmarks.length === 0) {
      this.showEmptyState();
      return;
    }

    // Hide empty state
    hide($('#empty-state'));

    // Update container class for view type
    if (this.isCompactView) {
      container.classList.add('compact');
    } else {
      container.classList.remove('compact');
    }

    // Clear existing bookmarks
    clearElement(container);

    // Render bookmark items
    this.bookmarks.forEach(bookmark => {
      const item = this.createBookmarkItem(bookmark);
      container.appendChild(item);
    });
  }

  /**
   * Create bookmark item element
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Bookmark item element
   */
  createBookmarkItem(bookmark) {
    const item = createElement('div', {
      className: `bookmark-item${this.isCompactView ? ' compact' : ''}`,
      'data-bookmark-id': bookmark.id,
      'data-testid': 'bookmark-item'
    });

    const checkbox = this.createBookmarkCheckbox(bookmark.id);
    const content = this.createBookmarkContent(bookmark);

    item.appendChild(checkbox);
    item.appendChild(content);

    return item;
  }

  /**
   * Create bookmark checkbox element
   * @param {string} bookmarkId - Bookmark ID
   * @returns {Element} Checkbox element
   */
  createBookmarkCheckbox(bookmarkId) {
    return createElement('input', {
      type: 'checkbox',
      className: 'bookmark-checkbox',
      'data-bookmark-id': bookmarkId
    });
  }

  /**
   * Create bookmark content element
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Content element
   */
  createBookmarkContent(bookmark) {
    const content = createElement('div', { className: 'bookmark-content' });

    const header = this.createBookmarkHeader(bookmark);
    const url = this.createBookmarkUrl(bookmark.url);
    const meta = this.createBookmarkMeta(bookmark);

    content.appendChild(header);
    content.appendChild(url);

    if (bookmark.notes) {
      const notes = createElement('p', { className: 'bookmark-notes' }, bookmark.notes);
      content.appendChild(notes);
    }

    if (bookmark.tags && bookmark.tags.length > 0) {
      const tagsElement = this.createTagElements(bookmark.tags);
      content.appendChild(tagsElement);
    }

    content.appendChild(meta);
    return content;
  }

  /**
   * Create bookmark header with title and status
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Header element
   */
  createBookmarkHeader(bookmark) {
    const header = createElement('div', { className: 'bookmark-header' });
    const statusType = this.statusTypes.find(s => s.id === bookmark.status);

    const title = createElement('h3', { className: 'bookmark-title' }, [
      createElement(
        'a',
        {
          href: bookmark.url,
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        bookmark.title || 'Untitled'
      )
    ]);

    const statusElement = createElement('div', { className: 'bookmark-status' });
    if (statusType) {
      statusElement.appendChild(this.createStatusIndicator(statusType));
    }

    header.appendChild(title);
    header.appendChild(statusElement);
    return header;
  }

  /**
   * Create bookmark URL element
   * @param {string} url - Bookmark URL
   * @returns {Element} URL element
   */
  createBookmarkUrl(url) {
    return createElement('p', { className: 'bookmark-url' }, [
      createElement(
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        this.formatUrl(url)
      )
    ]);
  }

  /**
   * Create bookmark meta section with dates and actions
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Meta element
   */
  createBookmarkMeta(bookmark) {
    const meta = createElement('div', { className: 'bookmark-meta' });
    const dates = this.createBookmarkDates(bookmark);
    const actions = this.createBookmarkActions(bookmark.id);

    meta.appendChild(dates);
    meta.appendChild(actions);
    return meta;
  }

  /**
   * Create bookmark dates display
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Dates element
   */
  createBookmarkDates(bookmark) {
    return createElement('div', { className: 'bookmark-dates' }, [
      createElement('span', {}, `Created: ${this.formatDate(bookmark.created_at, 'short')}`),
      createElement('span', {}, `Updated: ${this.formatDate(bookmark.updated_at, 'short')}`)
    ]);
  }

  /**
   * Create bookmark action buttons
   * @param {string} bookmarkId - Bookmark ID
   * @returns {Element} Actions element
   */
  createBookmarkActions(bookmarkId) {
    return createElement('div', { className: 'bookmark-actions' }, [
      createElement(
        'button',
        {
          type: 'button',
          className: 'secondary edit-bookmark',
          'data-bookmark-id': bookmarkId
        },
        'Edit'
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'secondary outline delete-bookmark',
          'data-bookmark-id': bookmarkId
        },
        'Delete'
      )
    ]);
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    hide($('#bookmark-list'));
    show($('#empty-state'));
    hide($('#pagination-nav'));
  }

  /**
   * Update bookmark count display
   */
  updateBookmarkCount() {
    const countElement = $('#bookmark-count');
    if (countElement) {
      const text = this.totalCount === 1 ? '1 bookmark' : `${this.totalCount} bookmarks`;
      this.setText(countElement, text);
    }
  }

  /**
   * Update user info display
   */
  updateUserInfo() {
    const userInfo = $('#user-info');
    const user = this.authService.getCurrentUser();

    if (userInfo && user) {
      this.setText(userInfo, user.email);
    }
  }

  /**
   * Handle search
   */
  async handleSearch() {
    await this.safeExecute(async () => {
      const form = $('#search-form');
      const formData = this.getFormData(form);

      // Build search options
      this.currentSearch = {};

      if (formData.query?.trim()) {
        this.currentSearch.query = formData.query.trim();
      }

      if (formData.statusFilter && Array.isArray(formData.statusFilter)) {
        this.currentSearch.statuses = formData.statusFilter;
      } else if (formData.statusFilter) {
        this.currentSearch.statuses = [formData.statusFilter];
      }

      if (formData.tagFilter?.trim()) {
        this.currentSearch.tags = formData.tagFilter
          .trim()
          .split(',')
          .map(t => t.trim())
          .filter(t => t);
      }

      if (formData.dateFrom) {
        this.currentSearch.dateFrom = new Date(formData.dateFrom);
      }

      if (formData.dateTo) {
        this.currentSearch.dateTo = new Date(formData.dateTo);
      }

      // Reset to first page
      this.currentPage = 1;

      // Load bookmarks
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleSearch');
  }

  /**
   * Handle clear search
   */
  async handleClearSearch() {
    await this.safeExecute(async () => {
      // Reset search form
      const form = $('#search-form');
      if (form) {
        this.resetForm(form);
      }

      // Clear search options
      this.currentSearch = {};
      this.currentPage = 1;

      // Reload bookmarks
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleClearSearch');
  }

  /**
   * Handle refresh
   */
  async handleRefresh() {
    await this.safeExecute(async () => {
      await this.loadBookmarks();
      this.showSuccess('Bookmarks refreshed');
    }, 'BookmarkManagerController.handleRefresh');
  }

  /**
   * Handle sort change
   */
  async handleSortChange() {
    await this.safeExecute(async () => {
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleSortChange');
  }

  /**
   * Toggle compact view
   */
  toggleCompactView() {
    this.isCompactView = !this.isCompactView;
    this.updateViewToggle();
    this.renderBookmarks();

    // Save preference
    this.safeExecute(async () => {
      await this.configService.updateUserPreferences({ compactView: this.isCompactView });
    }, 'BookmarkManagerController.toggleCompactView');
  }

  /**
   * Update view toggle button
   */
  updateViewToggle() {
    const button = $('#view-toggle');
    if (button) {
      button.textContent = this.isCompactView ? 'Detailed View' : 'Compact View';
    }
  }

  /**
   * Handle select all checkbox
   * @param {boolean} checked - Whether to select all
   */
  handleSelectAll(checked) {
    const checkboxes = $$('.bookmark-checkbox');

    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
      this.handleBookmarkSelect(checkbox);
    });
  }

  /**
   * Handle individual bookmark selection
   * @param {Element} checkbox - Checkbox element
   */
  handleBookmarkSelect(checkbox) {
    const bookmarkId = checkbox.dataset.bookmarkId;
    const item = checkbox.closest('.bookmark-item');

    if (checkbox.checked) {
      this.selectedBookmarks.add(bookmarkId);
      item?.classList.add('selected');
    } else {
      this.selectedBookmarks.delete(bookmarkId);
      item?.classList.remove('selected');
    }

    this.updateBulkActions();
    this.updateSelectAllCheckbox();
  }

  /**
   * Update bulk actions visibility and count
   */
  updateBulkActions() {
    const bulkActions = $('#bulk-actions');
    const selectedCount = $('#selected-count');

    if (this.selectedBookmarks.size > 0) {
      show(bulkActions);
      show(selectedCount);
      this.setText(selectedCount, `${this.selectedBookmarks.size} selected`);
    } else {
      hide(bulkActions);
      hide(selectedCount);
    }
  }

  /**
   * Update select all checkbox state
   */
  updateSelectAllCheckbox() {
    const selectAllCheckbox = $('#bulk-select-all');
    if (!selectAllCheckbox) return;

    const totalCheckboxes = $$('.bookmark-checkbox').length;
    const selectedCount = this.selectedBookmarks.size;

    if (selectedCount === 0) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    } else if (selectedCount === totalCheckboxes) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.checked = false;
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedBookmarks.clear();

    const checkboxes = $$('.bookmark-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    const items = $$('.bookmark-item.selected');
    items.forEach(item => {
      item.classList.remove('selected');
    });

    this.updateBulkActions();
    this.updateSelectAllCheckbox();
  }

  /**
   * Handle bulk status update
   * @param {string} statusId - New status ID
   */
  async handleBulkStatusUpdate(statusId) {
    if (this.selectedBookmarks.size === 0) return;

    try {
      const confirmed = confirm(
        `Change status for ${this.selectedBookmarks.size} selected bookmarks?`
      );
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'BookmarkManagerController.handleBulkStatusUpdate');
      return;
    }

    await this.safeExecute(async () => {
      const bookmarkIds = Array.from(this.selectedBookmarks);
      await this.bookmarkService.bulkUpdateBookmarks(bookmarkIds, { status: statusId });

      this.showSuccess(`Updated ${bookmarkIds.length} bookmarks`);
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleBulkStatusUpdate');
  }

  /**
   * Handle bulk delete
   */
  async handleBulkDelete() {
    if (this.selectedBookmarks.size === 0) return;

    try {
      const confirmed = confirm(
        `Are you sure you want to delete ${this.selectedBookmarks.size} selected bookmarks? This cannot be undone.`
      );
      if (!confirmed) return;
    } catch (error) {
      this.handleError(error, 'BookmarkManagerController.handleBulkDelete');
      return;
    }

    await this.safeExecute(async () => {
      const bookmarkIds = Array.from(this.selectedBookmarks);
      await this.bookmarkService.bulkDeleteBookmarks(bookmarkIds);

      this.showSuccess(`Deleted ${bookmarkIds.length} bookmarks`);
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleBulkDelete');
  }

  /**
   * Handle edit bookmark
   * @param {string} bookmarkId - Bookmark ID to edit
   */
  handleEditBookmark(bookmarkId) {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    this.editingBookmark = bookmark;
    this.showEditModal(bookmark);
  }

  /**
   * Show edit modal
   * @param {Object} bookmark - Bookmark to edit
   */
  showEditModal(bookmark) {
    const modal = $('#edit-modal');
    const form = $('#edit-form');

    if (!modal || !form) return;

    // Populate form
    setFormData(form, {
      id: bookmark.id,
      title: bookmark.title || '',
      url: bookmark.url,
      status: bookmark.status,
      tags: bookmark.tags ? bookmark.tags.join(', ') : '',
      notes: bookmark.notes || ''
    });

    // Show modal
    modal.showModal();
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    const modal = $('#edit-modal');
    if (modal) {
      modal.close();
    }
    this.editingBookmark = null;
  }

  /**
   * Handle save edit
   */
  async handleSaveEdit() {
    if (!this.editingBookmark) return;

    const form = $('#edit-form');
    const formData = this.getFormData(form);

    await this.safeExecute(
      async () => {
        const updates = {
          title: formData.title,
          url: formData.url,
          status: formData.status,
          tags: formData.tags
            ? formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t)
            : [],
          notes: formData.notes
        };

        await this.bookmarkService.updateBookmark(this.editingBookmark.id, updates);

        this.showSuccess('Bookmark updated successfully');
        this.closeEditModal();
        await this.loadBookmarks();
      },
      'BookmarkManagerController.handleSaveEdit',
      '#save-edit',
      'Saving...'
    );
  }

  /**
   * Handle delete bookmark
   * @param {string} bookmarkId - Bookmark ID to delete
   */
  handleDeleteBookmark(bookmarkId) {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    this.showDeleteModal(bookmark);
  }

  /**
   * Show delete confirmation modal
   * @param {Object} bookmark - Bookmark to delete
   */
  showDeleteModal(bookmark) {
    const modal = $('#delete-modal');
    const message = $('#delete-message');

    if (!modal || !message) return;

    message.textContent = `Are you sure you want to delete "${bookmark.title || 'Untitled'}"?`;

    // Store bookmark ID for deletion
    modal.dataset.bookmarkId = bookmark.id;

    modal.showModal();
  }

  /**
   * Close delete modal
   */
  closeDeleteModal() {
    const modal = $('#delete-modal');
    if (modal) {
      modal.close();
      delete modal.dataset.bookmarkId;
    }
  }

  /**
   * Handle confirm delete
   */
  async handleConfirmDelete() {
    const modal = $('#delete-modal');
    const bookmarkId = modal?.dataset.bookmarkId;

    if (!bookmarkId) return;

    await this.safeExecute(async () => {
      await this.bookmarkService.deleteBookmark(bookmarkId);

      this.showSuccess('Bookmark deleted successfully');
      this.closeDeleteModal();
      await this.loadBookmarks();
    }, 'BookmarkManagerController.handleConfirmDelete');
  }

  /**
   * Update pagination controls
   */
  updatePagination() {
    const paginationNav = $('#pagination-nav');
    const paginationInfo = $('#pagination-info');
    const prevButton = $('#prev-page');
    const nextButton = $('#next-page');
    const pageNumbers = $('#page-numbers');

    if (!paginationNav) return;

    if (this.totalCount === 0) {
      hide(paginationNav);
      return;
    }

    show(paginationNav);

    // Update info
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCount);
    this.setText(paginationInfo, `Showing ${start} - ${end} of ${this.totalCount}`);

    // Update buttons
    const maxPage = Math.ceil(this.totalCount / this.pageSize);

    if (prevButton) {
      prevButton.disabled = this.currentPage <= 1;
    }

    if (nextButton) {
      nextButton.disabled = this.currentPage >= maxPage;
    }

    // Update page numbers
    if (pageNumbers) {
      this.renderPageNumbers(pageNumbers, maxPage);
    }
  }

  /**
   * Render page numbers
   * @param {Element} container - Page numbers container
   * @param {number} maxPage - Maximum page number
   */
  renderPageNumbers(container, maxPage) {
    clearElement(container);

    if (maxPage <= 1) return;

    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(maxPage, this.currentPage + 2);

    // First page
    if (startPage > 1) {
      container.appendChild(this.createPageNumber(1));
      if (startPage > 2) {
        container.appendChild(createElement('span', { className: 'page-ellipsis' }, '...'));
      }
    }

    // Page range
    for (let i = startPage; i <= endPage; i++) {
      container.appendChild(this.createPageNumber(i));
    }

    // Last page
    if (endPage < maxPage) {
      if (endPage < maxPage - 1) {
        container.appendChild(createElement('span', { className: 'page-ellipsis' }, '...'));
      }
      container.appendChild(this.createPageNumber(maxPage));
    }
  }

  /**
   * Create page number element
   * @param {number} pageNum - Page number
   * @returns {Element} Page number element
   */
  createPageNumber(pageNum) {
    return createElement(
      'button',
      {
        type: 'button',
        className: `page-number${pageNum === this.currentPage ? ' active' : ''}`,
        'data-page': pageNum.toString()
      },
      pageNum.toString()
    );
  }

  /**
   * Format URL for display (uses shared utility)
   * @param {string} url - URL to format
   * @returns {string} Formatted URL
   */
  formatUrl(url) {
    return formatUrl(url, 60);
  }

  /**
   * Show authentication required UI
   * @param {string} message - Message to display
   */
  showAuthenticationRequired(message) {
    const container = $('#bookmark-list-container');
    if (!container) return;

    // Hide normal content
    hide($('#bookmark-list'));
    hide($('#empty-state'));
    hide($('#loading-state'));
    hide($('#pagination-nav'));

    // Create authentication required UI
    const authRequired = document.createElement('div');
    authRequired.id = 'auth-required';
    authRequired.className = 'auth-required';
    authRequired.innerHTML = `
      <div class="auth-required-content">
        <h3>Authentication Required</h3>
        <p>${message}</p>
        <div class="auth-actions">
          <button type="button" id="open-settings" class="primary">Go to Settings</button>
          <button type="button" id="refresh-auth" class="secondary">Try Again</button>
        </div>
      </div>
    `;

    // Add to container
    container.appendChild(authRequired);

    // Set up event listeners
    const openSettingsBtn = authRequired.querySelector('#open-settings');
    const refreshAuthBtn = authRequired.querySelector('#refresh-auth');

    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        this.openOptionsPage();
      });
    }

    if (refreshAuthBtn) {
      refreshAuthBtn.addEventListener('click', () => {
        this.refreshAuthentication();
      });
    }
  }

  /**
   * Refresh authentication state
   */
  async refreshAuthentication() {
    try {
      // Clear existing auth required UI
      const authRequired = $('#auth-required');
      if (authRequired) {
        authRequired.remove();
      }

      // Show loading
      this.showLoading('#bookmark-list-container', 'Checking authentication...');

      // Re-initialize
      await this.initialize();
    } catch (error) {
      this.handleError(error, 'BookmarkManagerController.refreshAuthentication');
    }
  }

  /**
   * Open options page
   */
  openOptionsPage() {
    try {
      if (chrome && chrome.runtime) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('options.html', '_blank');
      }
    } catch (error) {
      this.handleError(error, 'BookmarkManagerController.openOptionsPage');
    }
  }
}
