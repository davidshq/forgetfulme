/**
 * @fileoverview Unit tests for BookmarkManagerController
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { BookmarkManagerController } from '../../../src/controllers/BookmarkManagerController.js';

// Mock services
const createMockAuthService = () => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getCurrentUser: vi.fn().mockReturnValue({ email: 'test@example.com' })
});

const createMockBookmarkService = () => ({
  initialize: vi.fn().mockResolvedValue(),
  searchBookmarks: vi.fn().mockResolvedValue({
    items: [
      {
        id: '1',
        title: 'Test Bookmark',
        url: 'https://example.com',
        status: 'read',
        tags: ['test'],
        notes: 'Test notes',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ],
    total: 1
  }),
  updateBookmark: vi.fn().mockResolvedValue({ id: '1' }),
  deleteBookmark: vi.fn().mockResolvedValue(),
  bulkUpdateBookmarks: vi.fn().mockResolvedValue(),
  bulkDeleteBookmarks: vi.fn().mockResolvedValue()
});

const createMockConfigService = () => ({
  getStatusTypes: vi.fn().mockResolvedValue([
    { id: 'read', name: 'Read', color: '#4ade80', icon: '✓', is_default: true },
    { id: 'reference', name: 'Reference', color: '#3b82f6', icon: '⭐', is_default: false }
  ]),
  getUserPreferences: vi.fn().mockResolvedValue({
    itemsPerPage: 25,
    compactView: false,
    sortBy: 'created_at',
    sortOrder: 'desc'
  }),
  updateUserPreferences: vi.fn().mockResolvedValue()
});

const createMockValidationService = () => ({
  validateBookmarkData: vi.fn().mockReturnValue(true),
  validateUrl: vi.fn().mockReturnValue(true)
});

const createMockErrorService = () => ({
  handle: vi.fn().mockReturnValue({
    code: 'GENERIC_ERROR',
    message: 'An error occurred',
    severity: 'error'
  })
});

// Mock DOM setup
const setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Bookmark Manager</title></head>
      <body>
        <div id="message-area"></div>
        
        <!-- Header -->
        <header>
          <div id="user-info"></div>
          <button id="refresh-bookmarks">Refresh</button>
          <button id="open-options">Options</button>
        </header>
        
        <!-- Search Form -->
        <form id="search-form">
          <input name="query" type="text" />
          <select id="status-filter" name="statusFilter">
            <option value="">All Statuses</option>
          </select>
          <input name="tagFilter" type="text" />
          <input name="dateFrom" type="date" />
          <input name="dateTo" type="date" />
          <button type="submit">Search</button>
          <button id="clear-search" type="button">Clear</button>
        </form>
        
        <!-- Toolbar -->
        <div id="toolbar">
          <input id="bulk-select-all" type="checkbox" />
          <select id="sort-by">
            <option value="created_at">Created Date</option>
            <option value="title">Title</option>
          </select>
          <select id="sort-order">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <button id="view-toggle">Compact View</button>
          <select id="bulk-status-update">
            <option value="">Update Status...</option>
          </select>
          <button id="bulk-delete">Delete Selected</button>
          <div id="selected-count" style="display: none;"></div>
          <div id="bulk-actions" style="display: none;"></div>
        </div>
        
        <!-- Bookmark List -->
        <div id="bookmark-count"></div>
        <div id="bookmark-list"></div>
        <div id="empty-state" style="display: none;">No bookmarks found</div>
        
        <!-- Pagination -->
        <nav id="pagination-nav">
          <button id="prev-page">Previous</button>
          <div id="page-numbers"></div>
          <button id="next-page">Next</button>
          <select id="page-size">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <div id="pagination-info"></div>
        </nav>
        
        <!-- Edit Modal -->
        <dialog id="edit-modal">
          <form id="edit-form">
            <input name="id" type="hidden" />
            <input name="title" type="text" />
            <input name="url" type="url" />
            <select id="edit-status" name="status">
              <option value="">Select status...</option>
            </select>
            <input name="tags" type="text" />
            <textarea name="notes"></textarea>
            <button id="save-edit" type="submit">Save</button>
            <button id="cancel-edit" type="button">Cancel</button>
          </form>
          <button id="close-modal">×</button>
        </dialog>
        
        <!-- Delete Modal -->
        <dialog id="delete-modal">
          <div id="delete-message"></div>
          <button id="confirm-delete">Delete</button>
          <button id="cancel-delete">Cancel</button>
        </dialog>
        
        <button id="clear-filters">Clear Filters</button>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
  global.confirm = vi.fn().mockReturnValue(true);
  global.chrome = {
    runtime: {
      openOptionsPage: vi.fn()
    },
    tabs: {
      create: vi.fn()
    }
  };

  return dom;
};

describe('BookmarkManagerController', () => {
  let controller;
  let mockAuthService;
  let mockBookmarkService;
  let mockConfigService;
  let mockValidationService;
  let mockErrorService;
  let dom;

  beforeEach(() => {
    dom = setupDOM();
    mockAuthService = createMockAuthService();
    mockBookmarkService = createMockBookmarkService();
    mockConfigService = createMockConfigService();
    mockValidationService = createMockValidationService();
    mockErrorService = createMockErrorService();

    controller = new BookmarkManagerController(
      mockAuthService,
      mockBookmarkService,
      mockConfigService,
      mockValidationService,
      mockErrorService
    );
  });

  afterEach(() => {
    controller?.destroy();
    dom?.window.close();
  });

  describe('constructor', () => {
    it('should initialize with required services', () => {
      expect(controller.authService).toBe(mockAuthService);
      expect(controller.bookmarkService).toBe(mockBookmarkService);
      expect(controller.configService).toBe(mockConfigService);
      expect(controller.validationService).toBe(mockValidationService);
      expect(controller.errorService).toBe(mockErrorService);
    });

    it('should initialize properties', () => {
      expect(controller.bookmarks).toEqual([]);
      expect(controller.selectedBookmarks).toBeInstanceOf(Set);
      expect(controller.statusTypes).toEqual([]);
      expect(controller.currentSearch).toEqual({});
      expect(controller.currentPage).toBe(1);
      expect(controller.pageSize).toBe(25);
      expect(controller.totalCount).toBe(0);
      expect(controller.isCompactView).toBe(false);
      expect(controller.editingBookmark).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize when authenticated', async () => {
      await controller.initialize();

      expect(mockBookmarkService.initialize).toHaveBeenCalled();
      expect(mockConfigService.getStatusTypes).toHaveBeenCalled();
      expect(mockConfigService.getUserPreferences).toHaveBeenCalled();
      expect(mockBookmarkService.searchBookmarks).toHaveBeenCalled();
    });

    it('should show error when not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await controller.initialize();

      expect(mockBookmarkService.initialize).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockBookmarkService.initialize.mockRejectedValue(error);

      await controller.initialize();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.initialize'
      );
    });
  });

  describe('loadBookmarks', () => {
    it('should load bookmarks with search options', async () => {
      controller.currentSearch = { query: 'test' };
      controller.currentPage = 2;
      controller.pageSize = 10;

      await controller.loadBookmarks();

      expect(mockBookmarkService.searchBookmarks).toHaveBeenCalledWith({
        query: 'test',
        page: 2,
        pageSize: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(controller.bookmarks).toHaveLength(1);
      expect(controller.totalCount).toBe(1);
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockBookmarkService.searchBookmarks.mockRejectedValue(error);

      await controller.loadBookmarks();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.loadBookmarks'
      );
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      const form = document.getElementById('search-form');
      form.elements.query.value = 'test query';
      form.elements.statusFilter.value = 'read';
      form.elements.tagFilter.value = 'tag1, tag2';
      form.elements.dateFrom.value = '2023-01-01';
      form.elements.dateTo.value = '2023-12-31';
    });

    describe('handleSearch', () => {
      it('should build search options from form', async () => {
        await controller.handleSearch();

        expect(controller.currentSearch).toEqual({
          query: 'test query',
          statuses: ['read'],
          tags: ['tag1', 'tag2'],
          dateFrom: new Date('2023-01-01'),
          dateTo: new Date('2023-12-31')
        });
        expect(controller.currentPage).toBe(1);
      });

      it('should handle array status filter', async () => {
        const form = document.getElementById('search-form');
        Object.defineProperty(form.elements, 'statusFilter', {
          value: ['read', 'reference']
        });

        await controller.handleSearch();

        expect(controller.currentSearch.statuses).toEqual(['read', 'reference']);
      });
    });

    describe('handleClearSearch', () => {
      it('should clear search and reload bookmarks', async () => {
        controller.currentSearch = { query: 'test' };

        await controller.handleClearSearch();

        expect(controller.currentSearch).toEqual({});
        expect(controller.currentPage).toBe(1);
        expect(mockBookmarkService.searchBookmarks).toHaveBeenCalled();
      });
    });
  });

  describe('bookmark rendering', () => {
    beforeEach(() => {
      controller.statusTypes = [
        { id: 'read', name: 'Read', color: '#4ade80' }
      ];
    });

    describe('renderBookmarks', () => {
      it('should render bookmark items', () => {
        controller.bookmarks = [
          {
            id: '1',
            title: 'Test Bookmark',
            url: 'https://example.com',
            status: 'read',
            tags: ['test'],
            notes: 'Test notes',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ];

        controller.renderBookmarks();

        const bookmarkList = document.getElementById('bookmark-list');
        expect(bookmarkList.children.length).toBe(1);
        expect(bookmarkList.innerHTML).toContain('Test Bookmark');
      });

      it('should show empty state when no bookmarks', () => {
        controller.bookmarks = [];

        controller.renderBookmarks();

        const emptyState = document.getElementById('empty-state');
        expect(emptyState.style.display).not.toBe('none');
      });

      it('should apply compact view class', () => {
        controller.isCompactView = true;
        controller.bookmarks = [
          {
            id: '1',
            title: 'Test',
            url: 'https://example.com',
            status: 'read',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ];

        controller.renderBookmarks();

        const bookmarkList = document.getElementById('bookmark-list');
        expect(bookmarkList.classList.contains('compact')).toBe(true);
      });
    });

    describe('createBookmarkItem', () => {
      it('should create bookmark item with all elements', () => {
        const bookmark = {
          id: '1',
          title: 'Test Bookmark',
          url: 'https://example.com',
          status: 'read',
          tags: ['test', 'bookmark'],
          notes: 'Test notes',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        };

        const item = controller.createBookmarkItem(bookmark);

        expect(item.classList.contains('bookmark-item')).toBe(true);
        expect(item.dataset.bookmarkId).toBe('1');
        expect(item.querySelector('.bookmark-checkbox')).toBeTruthy();
        expect(item.querySelector('.bookmark-title')).toBeTruthy();
        expect(item.querySelector('.bookmark-url')).toBeTruthy();
        expect(item.querySelector('.bookmark-notes')).toBeTruthy();
        expect(item.querySelector('.tag-list')).toBeTruthy();
        expect(item.querySelector('.edit-bookmark')).toBeTruthy();
        expect(item.querySelector('.delete-bookmark')).toBeTruthy();
      });

      it('should handle bookmark without optional fields', () => {
        const bookmark = {
          id: '1',
          url: 'https://example.com',
          status: 'read',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        };

        const item = controller.createBookmarkItem(bookmark);

        expect(item.querySelector('.bookmark-notes')).toBeNull();
        expect(item.querySelector('.tag-list').children.length).toBe(0);
      });
    });
  });

  describe('selection management', () => {
    describe('handleSelectAll', () => {
      it('should select all bookmarks', () => {
        // Add some bookmark items to DOM
        const bookmarkList = document.getElementById('bookmark-list');
        bookmarkList.innerHTML = `
          <div class="bookmark-item">
            <input class="bookmark-checkbox" data-bookmark-id="1" type="checkbox" />
          </div>
          <div class="bookmark-item">
            <input class="bookmark-checkbox" data-bookmark-id="2" type="checkbox" />
          </div>
        `;

        controller.handleSelectAll(true);

        const checkboxes = bookmarkList.querySelectorAll('.bookmark-checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(true);
        });
        expect(controller.selectedBookmarks.size).toBe(2);
      });

      it('should deselect all bookmarks', () => {
        controller.selectedBookmarks.add('1');
        controller.selectedBookmarks.add('2');

        controller.handleSelectAll(false);

        expect(controller.selectedBookmarks.size).toBe(0);
      });
    });

    describe('handleBookmarkSelect', () => {
      it('should add bookmark to selection when checked', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.dataset.bookmarkId = '1';

        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.appendChild(checkbox);

        controller.handleBookmarkSelect(checkbox);

        expect(controller.selectedBookmarks.has('1')).toBe(true);
        expect(item.classList.contains('selected')).toBe(true);
      });

      it('should remove bookmark from selection when unchecked', () => {
        controller.selectedBookmarks.add('1');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        checkbox.dataset.bookmarkId = '1';

        const item = document.createElement('div');
        item.className = 'bookmark-item selected';
        item.appendChild(checkbox);

        controller.handleBookmarkSelect(checkbox);

        expect(controller.selectedBookmarks.has('1')).toBe(false);
        expect(item.classList.contains('selected')).toBe(false);
      });
    });

    describe('clearSelection', () => {
      it('should clear all selections', () => {
        controller.selectedBookmarks.add('1');
        controller.selectedBookmarks.add('2');

        // Add selected items to DOM
        const bookmarkList = document.getElementById('bookmark-list');
        bookmarkList.innerHTML = `
          <div class="bookmark-item selected">
            <input class="bookmark-checkbox" checked type="checkbox" />
          </div>
        `;

        controller.clearSelection();

        expect(controller.selectedBookmarks.size).toBe(0);
        const checkboxes = bookmarkList.querySelectorAll('.bookmark-checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(false);
        });
      });
    });
  });

  describe('bulk operations', () => {
    beforeEach(() => {
      controller.selectedBookmarks.add('1');
      controller.selectedBookmarks.add('2');
    });

    describe('handleBulkStatusUpdate', () => {
      it('should update status for selected bookmarks', async () => {
        global.confirm.mockReturnValue(true);

        await controller.handleBulkStatusUpdate('reference');

        expect(mockBookmarkService.bulkUpdateBookmarks).toHaveBeenCalledWith(
          ['1', '2'],
          { status: 'reference' }
        );
      });

      it('should not update without confirmation', async () => {
        global.confirm.mockReturnValue(false);

        await controller.handleBulkStatusUpdate('reference');

        expect(mockBookmarkService.bulkUpdateBookmarks).not.toHaveBeenCalled();
      });

      it('should not update when no bookmarks selected', async () => {
        controller.selectedBookmarks.clear();

        await controller.handleBulkStatusUpdate('reference');

        expect(mockBookmarkService.bulkUpdateBookmarks).not.toHaveBeenCalled();
      });
    });

    describe('handleBulkDelete', () => {
      it('should delete selected bookmarks', async () => {
        global.confirm.mockReturnValue(true);

        await controller.handleBulkDelete();

        expect(mockBookmarkService.bulkDeleteBookmarks).toHaveBeenCalledWith(['1', '2']);
      });

      it('should not delete without confirmation', async () => {
        global.confirm.mockReturnValue(false);

        await controller.handleBulkDelete();

        expect(mockBookmarkService.bulkDeleteBookmarks).not.toHaveBeenCalled();
      });
    });
  });

  describe('bookmark editing', () => {
    beforeEach(() => {
      controller.bookmarks = [
        {
          id: '1',
          title: 'Test Bookmark',
          url: 'https://example.com',
          status: 'read',
          tags: ['test'],
          notes: 'Test notes'
        }
      ];
    });

    describe('handleEditBookmark', () => {
      it('should show edit modal with bookmark data', () => {
        const modal = document.getElementById('edit-modal');
        modal.showModal = vi.fn();

        controller.handleEditBookmark('1');

        expect(controller.editingBookmark).toEqual(controller.bookmarks[0]);
        expect(modal.showModal).toHaveBeenCalled();
      });

      it('should not edit non-existent bookmark', () => {
        controller.handleEditBookmark('999');

        expect(controller.editingBookmark).toBeNull();
      });
    });

    describe('handleSaveEdit', () => {
      it('should save bookmark changes', async () => {
        controller.editingBookmark = { id: '1' };

        const form = document.getElementById('edit-form');
        const statusSelect = document.getElementById('edit-status');
        const modal = document.getElementById('edit-modal');
        
        // Mock modal close function
        modal.close = vi.fn();
        
        // Add the reference option to the select
        const referenceOption = document.createElement('option');
        referenceOption.value = 'reference';
        referenceOption.textContent = 'Reference';
        statusSelect.appendChild(referenceOption);
        
        form.elements.id.value = '1';
        form.elements.title.value = 'Updated Title';
        form.elements.url.value = 'https://updated.com';
        form.elements.status.value = 'reference';
        form.elements.tags.value = 'updated, tags';
        form.elements.notes.value = 'Updated notes';

        await controller.handleSaveEdit();

        expect(mockBookmarkService.updateBookmark).toHaveBeenCalledWith('1', {
          title: 'Updated Title',
          url: 'https://updated.com',
          status: 'reference',
          tags: ['updated', 'tags'],
          notes: 'Updated notes'
        });
      });

      it('should not save when no bookmark is being edited', async () => {
        controller.editingBookmark = null;

        await controller.handleSaveEdit();

        expect(mockBookmarkService.updateBookmark).not.toHaveBeenCalled();
      });
    });

    describe('closeEditModal', () => {
      it('should close modal and clear editing bookmark', () => {
        const modal = document.getElementById('edit-modal');
        modal.close = vi.fn();
        controller.editingBookmark = { id: '1' };

        controller.closeEditModal();

        expect(modal.close).toHaveBeenCalled();
        expect(controller.editingBookmark).toBeNull();
      });
    });
  });

  describe('bookmark deletion', () => {
    beforeEach(() => {
      controller.bookmarks = [
        { id: '1', title: 'Test Bookmark' }
      ];
    });

    describe('handleDeleteBookmark', () => {
      it('should show delete modal', () => {
        const modal = document.getElementById('delete-modal');
        modal.showModal = vi.fn();

        controller.handleDeleteBookmark('1');

        expect(modal.showModal).toHaveBeenCalled();
        expect(modal.dataset.bookmarkId).toBe('1');
      });
    });

    describe('handleConfirmDelete', () => {
      it('should delete bookmark', async () => {
        const modal = document.getElementById('delete-modal');
        modal.dataset.bookmarkId = '1';
        modal.close = vi.fn();

        await controller.handleConfirmDelete();

        expect(mockBookmarkService.deleteBookmark).toHaveBeenCalledWith('1');
        expect(modal.close).toHaveBeenCalled();
      });

      it('should not delete when no bookmark ID', async () => {
        const modal = document.getElementById('delete-modal');
        delete modal.dataset.bookmarkId;

        await controller.handleConfirmDelete();

        expect(mockBookmarkService.deleteBookmark).not.toHaveBeenCalled();
      });
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      controller.totalCount = 100;
      controller.pageSize = 25;
      controller.currentPage = 2;
    });

    describe('updatePagination', () => {
      it('should update pagination controls', () => {
        controller.updatePagination();

        const paginationInfo = document.getElementById('pagination-info');
        expect(paginationInfo.textContent).toBe('Showing 26 - 50 of 100');

        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        expect(prevButton.disabled).toBe(false);
        expect(nextButton.disabled).toBe(false);
      });

      it('should disable prev button on first page', () => {
        controller.currentPage = 1;

        controller.updatePagination();

        const prevButton = document.getElementById('prev-page');
        expect(prevButton.disabled).toBe(true);
      });

      it('should disable next button on last page', () => {
        controller.currentPage = 4; // Last page for 100 items with 25 per page

        controller.updatePagination();

        const nextButton = document.getElementById('next-page');
        expect(nextButton.disabled).toBe(true);
      });

      it('should hide pagination when no results', () => {
        controller.totalCount = 0;

        controller.updatePagination();

        const paginationNav = document.getElementById('pagination-nav');
        expect(paginationNav.classList.contains('hidden')).toBe(true);
      });
    });

    describe('renderPageNumbers', () => {
      it('should render page numbers with ellipsis', () => {
        const container = document.getElementById('page-numbers');
        controller.currentPage = 5;
        const maxPage = 10;

        controller.renderPageNumbers(container, maxPage);

        expect(container.children.length).toBeGreaterThan(0);
        expect(container.innerHTML).toContain('page-number');
      });

      it('should not render page numbers for single page', () => {
        const container = document.getElementById('page-numbers');
        controller.renderPageNumbers(container, 1);

        expect(container.children.length).toBe(0);
      });
    });
  });

  describe('view management', () => {
    describe('toggleCompactView', () => {
      it('should toggle compact view', () => {
        controller.isCompactView = false;

        controller.toggleCompactView();

        expect(controller.isCompactView).toBe(true);
        expect(mockConfigService.updateUserPreferences).toHaveBeenCalledWith({
          compactView: true
        });
      });
    });

    describe('updateViewToggle', () => {
      it('should update view toggle button text', () => {
        const button = document.getElementById('view-toggle');
        controller.isCompactView = true;

        controller.updateViewToggle();

        expect(button.textContent).toBe('Detailed View');
      });

      it('should update view toggle for detailed view', () => {
        const button = document.getElementById('view-toggle');
        controller.isCompactView = false;

        controller.updateViewToggle();

        expect(button.textContent).toBe('Compact View');
      });
    });
  });

  describe('utility methods', () => {
    describe('formatUrl', () => {
      it('should format URL correctly', () => {
        const result = controller.formatUrl('https://www.example.com/very/long/path');
        expect(result).toBe('example.com/very/long/path');
      });

      it('should truncate long URLs', () => {
        const longUrl = 'https://example.com/very/long/path/that/should/be/truncated/because/it/is/too/long';
        const result = controller.formatUrl(longUrl);
        expect(result.length).toBeLessThanOrEqual(60);
        expect(result).toContain('...');
      });
    });

    describe('updateBookmarkCount', () => {
      it('should display singular count', () => {
        controller.totalCount = 1;

        controller.updateBookmarkCount();

        const countElement = document.getElementById('bookmark-count');
        expect(countElement.textContent).toBe('1 bookmark');
      });

      it('should display plural count', () => {
        controller.totalCount = 5;

        controller.updateBookmarkCount();

        const countElement = document.getElementById('bookmark-count');
        expect(countElement.textContent).toBe('5 bookmarks');
      });
    });

    describe('updateUserInfo', () => {
      it('should display user email', () => {
        controller.updateUserInfo();

        const userInfo = document.getElementById('user-info');
        expect(userInfo.textContent).toBe('test@example.com');
      });
    });
  });

  describe('error handling', () => {
    it('should handle bookmark loading errors', async () => {
      const error = new Error('Load failed');
      mockBookmarkService.searchBookmarks.mockRejectedValue(error);

      await controller.loadBookmarks();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.loadBookmarks'
      );
    });

    it('should handle refresh errors', async () => {
      const error = new Error('Refresh failed');
      mockBookmarkService.searchBookmarks.mockRejectedValue(error);

      await controller.handleRefresh();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.loadBookmarks'
      );
    });

    it('should handle bulk operation errors', async () => {
      const error = new Error('Bulk operation failed');
      mockBookmarkService.bulkUpdateBookmarks.mockRejectedValue(error);
      controller.selectedBookmarks.add('1');
      global.confirm.mockReturnValue(true);

      await controller.handleBulkStatusUpdate('reference');

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.handleBulkStatusUpdate'
      );
    });
  });

  describe('navigation', () => {
    describe('openOptionsPage', () => {
      it('should open options page via Chrome API', () => {
        controller.openOptionsPage();
        expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalled();
      });
    });
  });
});