import { describe, test, expect, beforeEach } from 'vitest';
import BookmarkTransformer from '../../utils/bookmark-transformer.js';

describe('BookmarkTransformer', () => {
  const mockUserId = 'test-user-123';
  const mockTimestamp = '2023-01-01T00:00:00.000Z';

  beforeEach(() => {
    // Mock Date.now() to return consistent timestamp
    vi.spyOn(Date, 'now').mockReturnValue(new Date(mockTimestamp).getTime());
  });

  describe('toSupabaseFormat', () => {
    test('should transform to Supabase format with defaults', () => {
      const entry = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'Test description',
        tags: ['test', 'example'],
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'Test description',
        read_status: 'unread',
        tags: ['test', 'example'],
        created_at: expect.any(String),
        updated_at: expect.any(String),
        last_accessed: expect.any(String),
        access_count: 1,
      });
    });

    test('should transform with custom status', () => {
      const entry = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        status: 'read',
        tags: ['test'],
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId);

      expect(result.read_status).toBe('read');
    });

    test('should preserve timestamps when requested', () => {
      const entry = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        created_at: '2022-01-01T00:00:00.000Z',
        timestamp: '2022-01-01T00:00:00.000Z',
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId, {
        preserveTimestamps: true,
      });

      expect(result.created_at).toBe('2022-01-01T00:00:00.000Z');
    });

    test('should use timestamp when created_at not available', () => {
      const entry = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        timestamp: '2022-01-01T00:00:00.000Z',
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId);

      expect(result.created_at).toBe('2022-01-01T00:00:00.000Z');
    });

    test('should preserve existing ID', () => {
      const entry = {
        id: 'existing-id-123',
        url: 'https://example.com',
        title: 'Test Bookmark',
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId);

      expect(result.id).toBe('existing-id-123');
    });

    test('should handle missing optional fields', () => {
      const entry = {
        url: 'https://example.com',
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        url: 'https://example.com',
        title: 'Untitled',
        description: '',
        read_status: 'unread',
        tags: [],
        created_at: expect.any(String),
        updated_at: expect.any(String),
        last_accessed: expect.any(String),
        access_count: 1,
      });
    });

    test('should not set defaults when setDefaults is false', () => {
      const entry = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        access_count: 5,
      };

      const result = BookmarkTransformer.toSupabaseFormat(entry, mockUserId, {
        setDefaults: false,
      });

      expect(result.access_count).toBe(5);
    });
  });

  describe('toUIFormat', () => {
    test('should transform Supabase data to UI format', () => {
      const bookmark = {
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'Test description',
        read_status: 'read',
        tags: ['test', 'example'],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        last_accessed: '2023-01-03T00:00:00.000Z',
        access_count: 3,
      };

      const result = BookmarkTransformer.toUIFormat(bookmark);

      expect(result).toEqual({
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Test Bookmark',
        description: 'Test description',
        status: 'read',
        tags: ['test', 'example'],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        last_accessed: '2023-01-03T00:00:00.000Z',
        access_count: 3,
      });
    });

    test('should handle missing optional fields in UI format', () => {
      const bookmark = {
        id: 'bookmark-123',
        url: 'https://example.com',
        read_status: 'unread',
      };

      const result = BookmarkTransformer.toUIFormat(bookmark);

      expect(result).toEqual({
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Untitled',
        description: '',
        status: 'unread',
        tags: [],
        created_at: undefined,
        updated_at: undefined,
        last_accessed: undefined,
        access_count: 0,
      });
    });
  });

  describe('fromImportData', () => {
    test('should transform import data with preserved timestamps', () => {
      const bookmark = {
        url: 'https://example.com',
        title: 'Import Bookmark',
        created_at: '2022-01-01T00:00:00.000Z',
        access_count: 5,
      };

      const result = BookmarkTransformer.fromImportData(bookmark, mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        url: 'https://example.com',
        title: 'Import Bookmark',
        description: '',
        read_status: 'unread',
        tags: [],
        created_at: '2022-01-01T00:00:00.000Z',
        updated_at: expect.any(String),
        last_accessed: expect.any(String),
        access_count: 5,
      });
    });
  });

  describe('fromCurrentTab', () => {
    test('should transform current tab to bookmark format', () => {
      const tab = {
        url: 'https://example.com',
        title: 'Current Tab Title',
      };

      const result = BookmarkTransformer.fromCurrentTab(tab, 'read', ['current', 'tab']);

      expect(result).toEqual({
        url: 'https://example.com',
        title: 'Current Tab Title',
        status: 'read',
        tags: ['current', 'tab'],
        timestamp: expect.any(Number),
      });
    });

    test('should handle tab with missing title', () => {
      const tab = {
        url: 'https://example.com',
      };

      const result = BookmarkTransformer.fromCurrentTab(tab, 'unread');

      expect(result).toEqual({
        url: 'https://example.com',
        title: 'Untitled',
        status: 'unread',
        tags: [],
        timestamp: expect.any(Number),
      });
    });
  });

  describe('normalizeTags', () => {
    test('should normalize array of tags', () => {
      const tags = ['tag1', ' tag2 ', '  tag3  '];
      const result = BookmarkTransformer.normalizeTags(tags);

      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should normalize comma-separated string', () => {
      const tags = 'tag1, tag2 ,  tag3  ';
      const result = BookmarkTransformer.normalizeTags(tags);

      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should filter empty tags', () => {
      const tags = ['tag1', '', '   ', 'tag2'];
      const result = BookmarkTransformer.normalizeTags(tags);

      expect(result).toEqual(['tag1', 'tag2']);
    });

    test('should convert non-string tags to strings', () => {
      const tags = ['tag1', 123, true, 'tag2'];
      const result = BookmarkTransformer.normalizeTags(tags);

      expect(result).toEqual(['tag1', '123', 'true', 'tag2']);
    });

    test('should return empty array for null/undefined', () => {
      expect(BookmarkTransformer.normalizeTags(null)).toEqual([]);
      expect(BookmarkTransformer.normalizeTags(undefined)).toEqual([]);
    });

    test('should return empty array for empty string', () => {
      expect(BookmarkTransformer.normalizeTags('')).toEqual([]);
    });
  });

  describe('validate', () => {
    test('should validate valid bookmark data', () => {
      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        tags: ['test'],
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing URL', () => {
      const bookmark = {
        title: 'Test Bookmark',
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    test('should detect invalid URL format', () => {
      const bookmark = {
        url: 'not-a-url',
        title: 'Test Bookmark',
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    test('should detect missing title', () => {
      const bookmark = {
        url: 'https://example.com',
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    test('should detect invalid tags format', () => {
      const bookmark = {
        url: 'https://example.com',
        title: 'Test Bookmark',
        tags: 'not-an-array',
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    test('should return multiple errors', () => {
      const bookmark = {
        tags: 'not-an-array',
      };

      const result = BookmarkTransformer.validate(bookmark);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Tags must be an array');
    });
  });

  describe('isValidUrl', () => {
    test('should validate correct URLs', () => {
      expect(BookmarkTransformer.isValidUrl('https://example.com')).toBe(true);
      expect(BookmarkTransformer.isValidUrl('http://example.com')).toBe(true);
      expect(BookmarkTransformer.isValidUrl('https://example.com/path')).toBe(true);
      expect(BookmarkTransformer.isValidUrl('https://example.com?param=value')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(BookmarkTransformer.isValidUrl('not-a-url')).toBe(false);
      expect(BookmarkTransformer.isValidUrl('')).toBe(false);
      // Note: The current implementation accepts any valid URL format, including FTP
      expect(BookmarkTransformer.isValidUrl('ftp://example.com')).toBe(true);
    });
  });

  describe('toExportFormat', () => {
    test('should transform to export format', () => {
      const bookmark = {
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Export Bookmark',
        description: 'Export description',
        read_status: 'read',
        tags: ['export', 'test'],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        last_accessed: '2023-01-03T00:00:00.000Z',
        access_count: 5,
      };

      const result = BookmarkTransformer.toExportFormat(bookmark);

      expect(result).toEqual({
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Export Bookmark',
        description: 'Export description',
        read_status: 'read',
        tags: ['export', 'test'],
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        last_accessed: '2023-01-03T00:00:00.000Z',
        access_count: 5,
      });
    });
  });

  describe('transformMultiple', () => {
    test('should transform multiple bookmarks', () => {
      const bookmarks = [
        {
          url: 'https://example1.com',
          title: 'Bookmark 1',
        },
        {
          url: 'https://example2.com',
          title: 'Bookmark 2',
        },
      ];

      const result = BookmarkTransformer.transformMultiple(bookmarks, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe(mockUserId);
      expect(result[0].url).toBe('https://example1.com');
      expect(result[1].user_id).toBe(mockUserId);
      expect(result[1].url).toBe('https://example2.com');
    });

    test('should apply options to all bookmarks', () => {
      const bookmarks = [
        {
          url: 'https://example.com',
          title: 'Bookmark',
          access_count: 5,
        },
      ];

      const result = BookmarkTransformer.transformMultiple(bookmarks, mockUserId, {
        setDefaults: false,
      });

      expect(result[0].access_count).toBe(5);
    });
  });

  describe('getDefaultStructure', () => {
    test('should return default bookmark structure', () => {
      const result = BookmarkTransformer.getDefaultStructure(mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        url: '',
        title: '',
        description: '',
        read_status: 'unread',
        tags: [],
        created_at: expect.any(String),
        updated_at: expect.any(String),
        last_accessed: expect.any(String),
        access_count: 0,
      });
    });
  });
});
