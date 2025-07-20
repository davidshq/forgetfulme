/**
 * @fileoverview BookmarkTransformer - Unified bookmark data transformation utility
 * @module bookmark-transformer
 * @description Consolidates all bookmark data transformation logic to eliminate duplication
 * and ensure consistent data handling across the application.
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * BookmarkTransformer - Unified bookmark data transformation utility
 * @class BookmarkTransformer
 * @description Consolidates all bookmark data transformation logic to eliminate duplication
 * and ensure consistent data handling across the application.
 * 
 * @example
 * // Transform to Supabase format
 * const supabaseData = BookmarkTransformer.toSupabaseFormat(bookmark, userId);
 * 
 * // Transform to UI format
 * const uiData = BookmarkTransformer.toUIFormat(supabaseBookmark);
 * 
 * // Validate bookmark data
 * const validation = BookmarkTransformer.validate(bookmark);
 */
class BookmarkTransformer {
  /**
   * Transform a raw bookmark entry to Supabase format
   * @param {Object} entry - Raw bookmark entry
   * @param {string} userId - User ID for the bookmark
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed bookmark data
   */
  static toSupabaseFormat(entry, userId, options = {}) {
    const { preserveTimestamps = false, setDefaults = true } = options;

    const now = new Date().toISOString();

    const transformed = {
      user_id: userId,
      url: entry.url,
      title: entry.title || 'Untitled',
      description: entry.description || '',
      read_status: entry.status || entry.read_status || 'unread',
      tags: this.normalizeTags(entry.tags || []),
      created_at:
        preserveTimestamps && entry.created_at
          ? entry.created_at
          : entry.timestamp
            ? new Date(entry.timestamp).toISOString()
            : now,
      updated_at: now,
      last_accessed: now,
      access_count: setDefaults ? 1 : entry.access_count || 0,
    };

    // Add any additional fields that might exist
    if (entry.id) transformed.id = entry.id;

    return transformed;
  }

  /**
   * Transform Supabase bookmark data to UI format
   * @param {Object} bookmark - Supabase bookmark data
   * @returns {Object} UI-formatted bookmark data
   */
  static toUIFormat(bookmark) {
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title || 'Untitled',
      description: bookmark.description || '',
      status: bookmark.read_status,
      tags: this.normalizeTags(bookmark.tags || []),
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
      last_accessed: bookmark.last_accessed,
      access_count: bookmark.access_count || 0,
    };
  }

  /**
   * Transform import data to Supabase format
   * @param {Object} bookmark - Import bookmark data
   * @param {string} userId - User ID
   * @returns {Object} Transformed bookmark data
   */
  static fromImportData(bookmark, userId) {
    return this.toSupabaseFormat(bookmark, userId, {
      preserveTimestamps: true,
      setDefaults: false,
    });
  }

  /**
   * Transform current tab data to bookmark format
   * @param {Object} tab - Chrome tab object
   * @param {string} status - Read status
   * @param {Array} tags - Tags array
   * @returns {Object} Bookmark data
   */
  static fromCurrentTab(tab, status, tags = []) {
    return {
      url: tab.url,
      title: tab.title || 'Untitled',
      status: status,
      tags: this.normalizeTags(tags),
      timestamp: Date.now(),
    };
  }

  /**
   * Normalize tags array to ensure consistent format
   * @param {Array|string} tags - Tags input (array or comma-separated string)
   * @returns {Array} Normalized tags array
   */
  static normalizeTags(tags) {
    if (!tags) return [];

    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    if (Array.isArray(tags)) {
      return tags
        .map(tag => (typeof tag === 'string' ? tag.trim() : String(tag).trim()))
        .filter(tag => tag.length > 0);
    }

    return [];
  }

  /**
   * Validate bookmark data structure
   * @param {Object} bookmark - Bookmark data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(bookmark) {
    const errors = [];

    if (!bookmark.url) {
      errors.push('URL is required');
    } else if (!this.isValidUrl(bookmark.url)) {
      errors.push('Invalid URL format');
    }

    if (!bookmark.title) {
      errors.push('Title is required');
    }

    if (bookmark.tags && !Array.isArray(bookmark.tags)) {
      errors.push('Tags must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Transform bookmark for export format
   * @param {Object} bookmark - Supabase bookmark data
   * @returns {Object} Export-formatted bookmark
   */
  static toExportFormat(bookmark) {
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      read_status: bookmark.read_status,
      tags: bookmark.tags,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
      last_accessed: bookmark.last_accessed,
      access_count: bookmark.access_count,
    };
  }

  /**
   * Transform multiple bookmarks at once
   * @param {Array} bookmarks - Array of bookmark data
   * @param {string} userId - User ID
   * @param {Object} options - Transformation options
   * @returns {Array} Array of transformed bookmarks
   */
  static transformMultiple(bookmarks, userId, options = {}) {
    return bookmarks.map(bookmark =>
      this.toSupabaseFormat(bookmark, userId, options)
    );
  }

  /**
   * Get default bookmark structure
   * @param {string} userId - User ID
   * @returns {Object} Default bookmark structure
   */
  static getDefaultStructure(userId) {
    const now = new Date().toISOString();
    return {
      user_id: userId,
      url: '',
      title: '',
      description: '',
      read_status: 'unread',
      tags: [],
      created_at: now,
      updated_at: now,
      last_accessed: now,
      access_count: 0,
    };
  }
}

// Export for use in other files
export default BookmarkTransformer;
