/**
 * @fileoverview Unit tests for popup edit interface
 * @module tests/unit/popup-edit-interface
 * @description Tests for PopupEditInterface class
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { PopupEditInterface } from '../../utils/popup-edit-interface.js';

function getLeafText(element) {
  if (!element) {
    return '';
  }

  if (element.textContent) {
    return element.textContent;
  }

  return (element.children || []).map(child => getLeafText(child)).join('');
}

// Mock dependencies
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    createButton: vi.fn((text, onClick, type, options) => {
      const button = document.createElement('button');
      button.textContent = text;
      if (onClick) {
        button.addEventListener('click', onClick);
      }
      button.className = type;
      if (options) {
        Object.assign(button, options);
      }
      return button;
    }),
    createSection: vi.fn((title, className) => {
      const section = document.createElement('section');
      section.className = className;
      const heading = document.createElement('h2');
      heading.textContent = title;
      section.appendChild(heading);
      return section;
    }),
    createForm: vi.fn((id, onSubmit, fields, options) => {
      const form = document.createElement('form');
      form.id = id;
      if (onSubmit) {
        form.addEventListener('submit', onSubmit);
      }
      if (options) {
        Object.assign(form, options);
      }
      return form;
    }),
  },
}));

vi.mock('../../utils/formatters.js', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatStatus: vi.fn(status => status),
    formatTime: vi.fn(timestamp => new Date(timestamp).toLocaleString()),
    buildStatusSelectOptions: vi.fn(() => [{ value: 'read', text: 'Read' }]),
  };
});

describe('PopupEditInterface', () => {
  let popupEditInterface;
  let mockPopup;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock popup object
    mockPopup = {
      currentBookmarkUrl: null,
      appContainer: document.createElement('div'),
      showMainInterface: vi.fn(),
      updateBookmark: vi.fn(),
      configManager: {
        getCustomStatusTypes: vi
          .fn()
          .mockResolvedValue([
            'read',
            'good-reference',
            'low-value',
            'revisit-later',
          ]),
      },
    };

    popupEditInterface = new PopupEditInterface(mockPopup);
  });

  describe('constructor', () => {
    test('should initialize with popup instance', () => {
      expect(popupEditInterface.popup).toBe(mockPopup);
    });
  });

  describe('showEditInterface', () => {
    test('should set currentBookmarkUrl', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test'],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      expect(mockPopup.currentBookmarkUrl).toBe('https://example.com');
    });

    test('should create header with title and back button', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const header = mockPopup.appContainer.querySelector('header');
      expect(header).toBeTruthy();
      expect(header.querySelector('h1').textContent).toBe('Edit Bookmark');
      expect(header.querySelector('button').textContent).toBe('← Back');
    });

    test('should create main content container', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const mainContent = mockPopup.appContainer.querySelector('.main-content');
      expect(mainContent).toBeTruthy();
    });

    test('should create info section with bookmark details', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: ['test', 'example'],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const bookmarkInfo =
        mockPopup.appContainer.querySelector('.bookmark-info');
      expect(bookmarkInfo).toBeTruthy();
      expect(bookmarkInfo.textContent || getLeafText(bookmarkInfo)).toContain(
        'Test Bookmark',
      );
      expect(bookmarkInfo.textContent || getLeafText(bookmarkInfo)).toContain(
        'https://example.com',
      );
      expect(bookmarkInfo.textContent || getLeafText(bookmarkInfo)).toContain(
        'test, example',
      );
    });

    test('should handle bookmark without tags', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: null,
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const bookmarkInfo =
        mockPopup.appContainer.querySelector('.bookmark-info');
      expect(getLeafText(bookmarkInfo)).toContain('None');
    });

    test('should create edit form with status selector', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const form = mockPopup.appContainer.querySelector('form');
      expect(form).toBeTruthy();
      expect(form.id).toBe('editBookmarkForm');
    });

    test('should call showMainInterface when back button is clicked', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const backButton = mockPopup.appContainer.querySelector('button');
      backButton.click();

      expect(mockPopup.showMainInterface).toHaveBeenCalled();
    });

    test('should call updateBookmark when form is submitted', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      await popupEditInterface.showEditInterface(bookmark);

      const form = mockPopup.appContainer.querySelector('form');
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(mockPopup.updateBookmark).toHaveBeenCalledWith('bookmark-id');
    });

    test('should clear appContainer before rendering', async () => {
      const bookmark = {
        id: 'bookmark-id',
        url: 'https://example.com',
        title: 'Test Bookmark',
        read_status: 'read',
        tags: [],
        created_at: new Date().toISOString(),
      };

      // Add some initial content
      mockPopup.appContainer.innerHTML = '<div>Old content</div>';

      await popupEditInterface.showEditInterface(bookmark);

      expect(mockPopup.appContainer.innerHTML).not.toContain('Old content');
      expect(mockPopup.appContainer.querySelector('header')).toBeTruthy();
    });

    test('should handle different read statuses', async () => {
      const statuses = ['read', 'good-reference', 'low-value', 'revisit-later'];

      for (const status of statuses) {
        const bookmark = {
          id: 'bookmark-id',
          url: 'https://example.com',
          title: 'Test Bookmark',
          read_status: status,
          tags: [],
          created_at: new Date().toISOString(),
        };

        await expect(
          popupEditInterface.showEditInterface(bookmark),
        ).resolves.not.toThrow();
      }
    });
  });
});
