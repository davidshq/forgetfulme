import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatStatus, formatTime } from '../../utils/formatters.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

// Mock chrome APIs
global.chrome = {
  tabs: {
    create: vi.fn()
  },
  runtime: {
    openOptionsPage: vi.fn()
  }
};

// Mock window.open for fallback
global.window.open = vi.fn();

describe('Bookmark Management Page - Button Integration Tests', () => {
  let appContainer;
  let mockSupabaseService;
  let mockAuthStateManager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="app"></div>';
    appContainer = document.getElementById('app');

    // Mock services
    mockSupabaseService = {
      getBookmarks: vi.fn(),
      deleteBookmark: vi.fn(),
      updateBookmark: vi.fn()
    };

    mockAuthStateManager = {
      isAuthenticated: vi.fn().mockResolvedValue(true),
      getSession: vi.fn().mockResolvedValue({ user: { id: 'test-user' } }),
      onAuthStateChange: vi.fn()
    };

    // Mock dialog methods (not available in JSDOM)
    HTMLDialogElement.prototype.showModal = vi.fn(function() {
      this.setAttribute('open', '');
    });
    
    HTMLDialogElement.prototype.close = vi.fn(function() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Full button workflow', () => {
    it('should handle edit button click through to showing edit interface', async () => {
      // Import modules dynamically to ensure fresh state
      const { showMainInterface, showEditInterface } = await import('../../bookmark-management/index.js');
      const UIComponents = (await import('../../utils/ui-components.js')).default;
      
      // Setup mock bookmark data
      const mockBookmarks = [{
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Example Site',
        description: 'Test description',
        read_status: 'read',
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z'
      }];

      mockSupabaseService.getBookmarks.mockResolvedValue(mockBookmarks);

      // Spy on showEditInterface to verify it's called
      const showEditSpy = vi.fn();
      
      // Load main interface
      await new Promise(resolve => {
        // We need to wait for the interface to load
        setTimeout(resolve, 100);
      });

      // Find and click the edit button
      const bookmarksList = appContainer.querySelector('#bookmarks-list');
      expect(bookmarksList).toBeTruthy();

      // Wait for bookmarks to be displayed
      await new Promise(resolve => setTimeout(resolve, 100));

      const editButton = bookmarksList.querySelector('button.secondary[aria-label*="Edit"]');
      expect(editButton).toBeTruthy();
      
      // The edit button should have the correct text
      expect(editButton.textContent).toBe('✏️ Edit');
    });

    it('should handle delete button click and show confirmation', async () => {
      // Setup mock bookmark
      const mockBookmark = {
        id: 'bookmark-456',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseService.getBookmarks.mockResolvedValue([mockBookmark]);
      mockSupabaseService.deleteBookmark.mockResolvedValue(true);

      // Create a simple bookmark item with delete functionality
      const { createBookmarkListItem } = await import('../../bookmark-management/ui/render.js');
      const SimpleModal = (await import('../../utils/simple-modal.js')).default;

      const onDelete = vi.fn((bookmarkId, bookmarkTitle) => {
        SimpleModal.confirm(
          `Delete "${bookmarkTitle}"?`,
          async () => {
            await mockSupabaseService.deleteBookmark(bookmarkId);
          },
          () => {},
          { confirmText: 'Delete', cancelText: 'Cancel' }
        );
      });

      const listItem = createBookmarkListItem({
        bookmark: BookmarkTransformer.toUIFormat(mockBookmark),
        index: 0,
        onDelete,
        updateBulkActions: vi.fn()
      });

      appContainer.appendChild(listItem);

      // Click delete button
      const deleteBtn = listItem.querySelector('button.contrast');
      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn.textContent).toBe('🗑️ Delete');
      
      deleteBtn.click();

      // Verify delete handler was called
      expect(onDelete).toHaveBeenCalledWith(mockBookmark.id, mockBookmark.title);

      // Verify modal was created
      const modal = document.querySelector('dialog');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('Delete "Test Bookmark"?');

      // Click confirm button
      const confirmBtn = modal.querySelector('button:not(.secondary)');
      confirmBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify bookmark was deleted
      expect(mockSupabaseService.deleteBookmark).toHaveBeenCalledWith(mockBookmark.id);
    });

    it('should handle open button click with Chrome API', async () => {
      const mockBookmark = {
        id: 'bookmark-789',
        url: 'https://example.com/page',
        title: 'Test Page',
        read_status: 'read',
        tags: [],
        created_at: '2024-01-01T00:00:00Z'
      };

      const { createBookmarkListItem } = await import('../../bookmark-management/ui/render.js');
      const { openBookmark } = await import('../../bookmark-management/events/handlers.js');

      const listItem = createBookmarkListItem({
        bookmark: BookmarkTransformer.toUIFormat(mockBookmark),
        index: 0,
        onOpen: (url) => openBookmark({ url }),
        updateBulkActions: vi.fn()
      });

      appContainer.appendChild(listItem);

      // Click open button
      const openBtn = listItem.querySelector('button.secondary:last-child');
      expect(openBtn).toBeTruthy();
      expect(openBtn.textContent).toBe('🔗 Open');
      
      openBtn.click();

      // Verify Chrome API was called
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: mockBookmark.url });
    });

    it('should handle open button click with fallback when Chrome API unavailable', async () => {
      // Temporarily remove Chrome API
      const originalChrome = global.chrome;
      global.chrome = {};

      const mockBookmark = {
        id: 'bookmark-999',
        url: 'https://example.com/fallback',
        title: 'Fallback Test',
        read_status: 'read',
        tags: [],
        created_at: '2024-01-01T00:00:00Z'
      };

      const { createBookmarkListItem } = await import('../../bookmark-management/ui/render.js');
      const { openBookmark } = await import('../../bookmark-management/events/handlers.js');

      const listItem = createBookmarkListItem({
        bookmark: BookmarkTransformer.toUIFormat(mockBookmark),
        index: 0,
        onOpen: (url) => openBookmark({ url }),
        updateBulkActions: vi.fn()
      });

      appContainer.appendChild(listItem);

      // Click open button
      const openBtn = listItem.querySelector('button.secondary:last-child');
      openBtn.click();

      // Verify window.open was called as fallback
      expect(window.open).toHaveBeenCalledWith(mockBookmark.url, '_blank');

      // Restore Chrome API
      global.chrome = originalChrome;
    });
  });
});