import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      getValue: vi.fn(),
    },
    createButton: vi.fn((text, onClick) => {
      const button = document.createElement('button');
      button.textContent = text;
      if (onClick) {
        button.addEventListener('click', onClick);
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
    createForm: vi.fn((id, onSubmit) => {
      const form = document.createElement('form');
      form.id = id;
      if (onSubmit) {
        form.addEventListener('submit', onSubmit);
      }
      return form;
    }),
  },
}));

vi.mock('../../utils/bookmark-transformer.js', () => ({
  default: {
    normalizeTags: vi.fn(tags =>
      tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    ),
  },
}));

vi.mock('../../utils/formatters.js', () => ({
  formatStatus: vi.fn(status => status),
  formatTime: vi.fn(() => 'Jan 1, 2024'),
  buildStatusSelectOptions: vi.fn(() => [{ value: 'read', text: 'Read' }]),
}));

import UIComponents from '../../utils/ui-components.js';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';
import {
  createBookmarkEditView,
  getBookmarkEditFormData,
} from '../../components/bookmark-edit-view.js';

describe('bookmark-edit-view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBookmarkEditFormData', () => {
    it('reads shared edit form field IDs', () => {
      UIComponents.DOM.getValue.mockImplementation(id => {
        if (id === 'edit-read-status') {
          return 'good-reference';
        }
        if (id === 'edit-tags') {
          return 'research, tutorial';
        }
        return '';
      });

      const result = getBookmarkEditFormData();

      expect(result.read_status).toBe('good-reference');
      expect(BookmarkTransformer.normalizeTags).toHaveBeenCalledWith(
        'research, tutorial',
      );
      expect(result.tags).toEqual(['research', 'tutorial']);
      expect(result.updated_at).toEqual(expect.any(String));
    });
  });

  describe('createBookmarkEditView', () => {
    it('renders the shared edit interface into a container', () => {
      const container = document.createElement('div');
      const onBack = vi.fn();
      const onUpdate = vi.fn();
      const bookmark = {
        id: 'bookmark-1',
        title: 'Example',
        url: 'https://example.com',
        read_status: 'read',
        tags: ['docs'],
        created_at: '2024-01-01T00:00:00.000Z',
      };

      createBookmarkEditView(bookmark, container, {
        backLabel: '← Back to List',
        onBack,
        onUpdate,
        statusTypes: ['read', 'good-reference'],
      });

      expect(container.querySelector('h1').textContent).toBe('Edit Bookmark');
      expect(container.querySelector('.info-section')).toBeTruthy();
      expect(container.querySelector('#editBookmarkForm')).toBeTruthy();
      expect(UIComponents.createForm).toHaveBeenCalledWith(
        'editBookmarkForm',
        expect.any(Function),
        expect.arrayContaining([
          expect.objectContaining({ id: 'edit-read-status' }),
          expect.objectContaining({ id: 'edit-tags' }),
        ]),
        expect.objectContaining({ submitText: 'Update Bookmark' }),
      );
    });

    it('submits through onUpdate with the bookmark id', () => {
      const container = document.createElement('div');
      const onUpdate = vi.fn();
      const bookmark = {
        id: 'bookmark-1',
        title: 'Example',
        url: 'https://example.com',
        read_status: 'read',
        tags: [],
        created_at: '2024-01-01T00:00:00.000Z',
      };

      createBookmarkEditView(bookmark, container, {
        onBack: vi.fn(),
        onUpdate,
      });

      const form = container.querySelector('#editBookmarkForm');
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );

      expect(onUpdate).toHaveBeenCalledWith('bookmark-1');
    });
  });
});
