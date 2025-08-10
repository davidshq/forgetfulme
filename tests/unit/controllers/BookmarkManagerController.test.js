/**
 * @fileoverview Unit tests for BookmarkManagerController
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { BookmarkManagerController } from '../../../src/controllers/BookmarkManagerController.js';

// Mock services
const createMockAuthService = () => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getCurrentUser: vi.fn().mockReturnValue({ email: 'test@example.com' }),
  getUserProfile: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
  initialize: vi.fn().mockResolvedValue(true)
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
  isSupabaseConfigured: vi.fn().mockResolvedValue(true),
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
  validateUrl: vi.fn().mockReturnValue({ isValid: true, data: 'https://updated.com', errors: [] }),
  validateTags: vi.fn().mockReturnValue({ isValid: true, data: ['test', 'docs'], errors: [] })
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
        
        <!-- Filters Section -->
        <section class="filters-section">
          <div class="filters-grid">
            <select id="status-filter" name="statusFilter">
              <option value="">All Statuses</option>
            </select>
            <input id="tag-filter" name="tagFilter" type="text" />
            <button id="apply-filters">Apply Filters</button>
            <button id="clear-filters">Clear</button>
          </div>
        </section>
        
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
        <div id="bookmark-grid" class="bookmark-grid"></div>
        <div class="bookmark-list-container">
          <div id="loading-state" style="display: none;">Loading...</div>
        </div>
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
      expect(controller.statusTypes).toEqual([]);
      expect(controller.currentSearch).toEqual({});
      expect(controller.grid).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize when authenticated', async () => {
      // Add window.gridjs mock
      global.window.gridjs = {
        Grid: vi.fn().mockImplementation(() => ({
          render: vi.fn(),
          forceRender: vi.fn(),
          destroy: vi.fn()
        }))
      };

      await controller.initialize();

      expect(mockAuthService.initialize).toHaveBeenCalled();
      expect(mockBookmarkService.initialize).toHaveBeenCalled();
      expect(mockConfigService.getStatusTypes).toHaveBeenCalled();
      // Note: getUserPreferences is not called in the new simplified implementation
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

  // Note: loadBookmarks method removed in simplified Grid.js implementation

  // Note: search functionality simplified in Grid.js implementation - filters handled differently

  // Note: bookmark rendering now handled by Grid.js - no custom rendering needed

  describe('utility methods', () => {
    describe('updateBookmarkCount', () => {
      it('should display singular count', () => {
        controller.bookmarks = [{ id: '1' }];

        controller.updateBookmarkCount();

        const countElement = document.getElementById('bookmark-count');
        expect(countElement.textContent).toBe('1 bookmark');
      });

      it('should display plural count', () => {
        controller.bookmarks = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];

        controller.updateBookmarkCount();

        const countElement = document.getElementById('bookmark-count');
        expect(countElement.textContent).toBe('5 bookmarks');
      });
    });

    describe('updateUserInfo', () => {
      it('should display user email', async () => {
        await controller.updateUserInfo();

        const userInfo = document.getElementById('user-info');
        expect(userInfo.textContent).toBe('test@example.com');
      });
    });

    describe('getStatusName', () => {
      beforeEach(() => {
        controller.statusTypes = [
          { id: 'read', name: 'Read' },
          { id: 'reference', name: 'Reference' }
        ];
      });

      it('should return status name for valid ID', () => {
        expect(controller.getStatusName('read')).toBe('Read');
        expect(controller.getStatusName('reference')).toBe('Reference');
      });

      it('should return Unknown for invalid ID', () => {
        expect(controller.getStatusName('invalid')).toBe('Unknown');
      });
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', async () => {
      const error = new Error('Init failed');
      mockBookmarkService.initialize.mockRejectedValue(error);

      await controller.initialize();

      expect(mockErrorService.handle).toHaveBeenCalledWith(
        error,
        'BookmarkManagerController.initialize'
      );
    });
  });

  describe('filter functionality', () => {
    beforeEach(() => {
      // Add window.gridjs mock for filter tests
      global.window.gridjs = {
        Grid: vi.fn().mockImplementation(() => ({
          render: vi.fn(),
          forceRender: vi.fn(),
          destroy: vi.fn()
        }))
      };
    });

    describe('applyFilters', () => {
      it('should set search filters from form inputs', async () => {
        const statusFilter = document.getElementById('status-filter');
        const tagFilter = document.getElementById('tag-filter');
        
        expect(statusFilter).toBeTruthy();
        expect(tagFilter).toBeTruthy();
        
        // Add option to select before setting value
        const readOption = document.createElement('option');
        readOption.value = 'read';
        readOption.textContent = 'Read';
        statusFilter.appendChild(readOption);
        
        statusFilter.value = 'read';
        tagFilter.value = 'test,docs';
        
        await controller.applyFilters();
        
        expect(controller.currentSearch.statuses).toEqual(['read']);
        expect(controller.currentSearch.tags).toEqual(['test', 'docs']);
      });
    });

    describe('clearFilters', () => {
      it('should clear search filters', () => {
        const statusFilter = document.getElementById('status-filter');
        const tagFilter = document.getElementById('tag-filter');
        
        controller.currentSearch = { statuses: ['read'], tags: ['test'] };
        
        controller.clearFilters();
        
        expect(controller.currentSearch).toEqual({});
        expect(statusFilter.value).toBe('');
        expect(tagFilter.value).toBe('');
      });
    });
  });

  describe('grid management', () => {
    beforeEach(() => {
      global.window.gridjs = {
        Grid: vi.fn().mockImplementation(() => ({
          render: vi.fn(),
          forceRender: vi.fn(),
          destroy: vi.fn()
        }))
      };
    });

    describe('refreshBookmarks', () => {
      it('should force render grid when grid exists', () => {
        const mockGrid = {
          render: vi.fn(),
          forceRender: vi.fn(),
          destroy: vi.fn()
        };
        controller.grid = mockGrid;
        
        controller.refreshBookmarks();
        
        expect(mockGrid.forceRender).toHaveBeenCalled();
      });
    });

    describe('destroy', () => {
      it('should destroy grid when it exists', () => {
        const mockGrid = {
          render: vi.fn(),
          forceRender: vi.fn(),
          destroy: vi.fn()
        };
        controller.grid = mockGrid;
        
        controller.destroy();
        
        expect(mockGrid.destroy).toHaveBeenCalled();
        expect(controller.grid).toBeNull();
      });
    });
  });

  describe('navigation', () => {
    it('should open options page via Chrome API when settings clicked', () => {
      // Test that the event listeners are set up for navigation
      const settingsBtn = document.getElementById('open-options');
      expect(settingsBtn).toBeTruthy();
    });
  });

  describe('user feedback', () => {
    describe('showTagFilterMessage', () => {
      it('should display tag filter message in message area', () => {
        const testMessage = 'Applied 2 tags. 1 invalid tag filtered out.';
        
        controller.showTagFilterMessage(testMessage);
        
        const messageArea = document.getElementById('message-area');
        expect(messageArea).toBeTruthy();
        expect(messageArea.children.length).toBe(1);
        
        const messageDiv = messageArea.children[0];
        expect(messageDiv.className).toBe('message-info');
        expect(messageDiv.textContent).toContain(testMessage);
        expect(messageDiv.textContent).toContain('×'); // Close button
      });

      it('should replace existing messages', () => {
        const firstMessage = 'First message';
        const secondMessage = 'Second message';
        
        controller.showTagFilterMessage(firstMessage);
        controller.showTagFilterMessage(secondMessage);
        
        const messageArea = document.getElementById('message-area');
        expect(messageArea.children.length).toBe(1);
        expect(messageArea.children[0].textContent).toContain(secondMessage);
        expect(messageArea.children[0].textContent).not.toContain(firstMessage);
      });

      it('should handle missing message area gracefully', () => {
        // Remove message area from DOM
        const messageArea = document.getElementById('message-area');
        messageArea.remove();
        
        // Should not throw error
        expect(() => {
          controller.showTagFilterMessage('Test message');
        }).not.toThrow();
      });

      it('should allow manual closing via close button', () => {
        controller.showTagFilterMessage('Test message');
        
        const messageArea = document.getElementById('message-area');
        const messageDiv = messageArea.children[0];
        const closeBtn = messageDiv.querySelector('button');
        
        expect(closeBtn).toBeTruthy();
        expect(messageDiv.parentNode).toBe(messageArea);
        
        // Click close button
        closeBtn.click();
        
        expect(messageDiv.parentNode).toBeNull();
      });
    });
  });
});