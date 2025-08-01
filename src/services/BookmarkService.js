/**
 * @fileoverview Bookmark management service for the ForgetfulMe extension
 */

import { createClient } from '../lib/supabase.js';
import { PAGINATION, TIME_CALCULATIONS } from '../utils/constants.js';
import { withServicePatterns } from '../utils/serviceHelpers.js';

/**
 * Service for managing bookmarks with full CRUD operations
 */
export class BookmarkService extends withServicePatterns(class {}) {
  /**
   * @param {AuthService} authService - Authentication service
   * @param {StorageService} storageService - Storage service
   * @param {ConfigService} configService - Configuration service
   * @param {ValidationService} validationService - Validation service
   * @param {ErrorService} errorService - Error handling service
   * @param {LoggingService} [loggingService] - Optional logging service
   */
  constructor(
    authService,
    storageService,
    configService,
    validationService,
    errorService,
    loggingService = null
  ) {
    super();
    this.authService = authService;
    this.storageService = storageService;
    this.configService = configService;
    this.validationService = validationService;
    this.errorService = errorService;
    this.loggingService = loggingService;
    this.supabaseClient = null;
  }

  /**
   * Initialize service with Supabase client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const config = await this.configService.getSupabaseConfig();
      if (!config) {
        throw new Error('Supabase configuration not found');
      }

      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.initialize');
    }
  }

  /**
   * Create a new bookmark
   * @param {Object} bookmarkData - Bookmark data
   * @returns {Promise<Object>} Created bookmark
   */
  async createBookmark(bookmarkData) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Get valid status types for validation
      const statusTypes = await this.configService.getStatusTypes();
      const validStatuses = statusTypes.map(type => type.id);

      // Validate bookmark data
      const validation = this.validationService.validateBookmark(bookmarkData, validStatuses);
      if (!validation.isValid) {
        throw new Error(`Invalid bookmark data: ${validation.errors.join(', ')}`);
      }

      const validatedData = validation.data;
      const user = this.authService.getCurrentUser();

      // Prepare bookmark for database
      const bookmark = {
        ...validatedData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await this.ensureInitialized();

      const savedBookmark = await this.saveToDatabase(bookmark);

      // Update cache
      await this.updateCache();

      return savedBookmark;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.createBookmark');
    }
  }

  /**
   * Update an existing bookmark
   * @param {string} bookmarkId - Bookmark ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated bookmark
   */
  async updateBookmark(bookmarkId, updates) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Get existing bookmark
      const existing = await this.getBookmarkById(bookmarkId);
      if (!existing) {
        throw new Error('Bookmark not found');
      }

      // Merge updates with existing data
      const mergedData = { ...existing, ...updates };

      // Get valid status types for validation
      const statusTypes = await this.configService.getStatusTypes();
      const validStatuses = statusTypes.map(type => type.id);

      // Validate updated data
      const validation = this.validationService.validateBookmark(mergedData, validStatuses);
      if (!validation.isValid) {
        throw new Error(`Invalid bookmark data: ${validation.errors.join(', ')}`);
      }

      const validatedData = validation.data;

      // Prepare updated bookmark
      const updatedBookmark = {
        ...existing,
        ...validatedData,
        updated_at: new Date().toISOString()
      };

      // Save to database
      const saved = await this.saveToDatabase(updatedBookmark);

      // Update cache
      await this.updateCache();

      return saved;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.updateBookmark');
    }
  }

  /**
   * Delete a bookmark
   * @param {string} bookmarkId - Bookmark ID
   * @returns {Promise<void>}
   */
  async deleteBookmark(bookmarkId) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      // Delete from database
      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?id=eq.${bookmarkId}&user_id=eq.${user.id}`,
        {
          method: 'DELETE',
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      // Update cache
      await this.updateCache();
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.deleteBookmark');
    }
  }

  /**
   * Get bookmarks with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated bookmarks result
   */
  async getBookmarks(options = {}) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const user = this.authService.getCurrentUser();
      const page = options.page || 1;
      const limit = options.limit || PAGINATION.DEFAULT_PAGE_SIZE;

      // Check cache first
      const cachedBookmarks = await this.storageService.getBookmarkCache();
      if (cachedBookmarks && !options.forceRefresh) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedBookmarks = cachedBookmarks.slice(startIndex, endIndex);

        return {
          bookmarks: paginatedBookmarks,
          page,
          limit,
          total: cachedBookmarks.length,
          totalPages: Math.ceil(cachedBookmarks.length / limit)
        };
      }

      // Fetch from database if not cached
      return await this.searchBookmarks({ page, limit, userId: user.id });
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.getBookmarks');
    }
  }

  /**
   * Get bookmark by ID
   * @param {string} bookmarkId - Bookmark ID
   * @returns {Promise<Object|null>} Bookmark or null
   */
  async getBookmarkById(bookmarkId) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?select=*&id=eq.${bookmarkId}&user_id=eq.${user.id}`,
        {
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookmark');
      }

      const bookmarks = await response.json();
      return bookmarks.length > 0 ? bookmarks[0] : null;
    } catch (error) {
      this.errorService.handle(error, 'BookmarkService.getBookmarkById');
      return null;
    }
  }

  /**
   * Search bookmarks with filtering and pagination
   * @param {SearchOptions} options - Search options
   * @returns {Promise<PaginatedResult<Object>>} Search results
   */
  async searchBookmarks(options = {}) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate search options
      const validation = this.validationService.validateSearchOptions(options);
      if (!validation.isValid) {
        throw new Error(`Invalid search options: ${validation.errors.join(', ')}`);
      }

      const searchOptions = validation.data;
      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      // Build query
      const query = this.buildSearchQuery(searchOptions, user.id);

      // Execute search
      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?${query}`,
        {
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const bookmarks = await response.json();

      // Get total count for pagination
      const totalCount = await this.getTotalCount(searchOptions, user.id);

      const page = searchOptions.page || 1;
      const pageSize = searchOptions.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;

      return {
        items: bookmarks,
        total: totalCount,
        page,
        pageSize,
        hasMore: page * pageSize < totalCount
      };
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.searchBookmarksDefault');
    }
  }

  /**
   * Get recent bookmarks
   * @param {number} [limit=10] - Number of bookmarks to return
   * @returns {Promise<Object[]>} Recent bookmarks
   */
  async getRecentBookmarks(limit = 10) {
    try {
      const searchOptions = {
        sortBy: 'created_at',
        sortOrder: 'desc',
        pageSize: limit,
        page: 1
      };

      const result = await this.searchBookmarks(searchOptions);
      return result.items;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.getRecentBookmarks');
    }
  }

  /**
   * Get bookmark statistics
   * @returns {Promise<BookmarkStats>} Bookmark statistics
   */
  async getBookmarkStats() {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      // Get all bookmarks for statistics
      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?select=status,tags,created_at&user_id=eq.${user.id}`,
        {
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks for stats');
      }

      const bookmarks = await response.json();

      // Calculate statistics
      const stats = {
        total: bookmarks.length,
        byStatus: {},
        byTag: {},
        thisWeek: 0,
        thisMonth: 0
      };

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - TIME_CALCULATIONS.MILLISECONDS_PER_WEEK);
      const oneMonthAgo = new Date(now.getTime() - TIME_CALCULATIONS.MILLISECONDS_PER_MONTH);

      bookmarks.forEach(bookmark => {
        // Count by status
        stats.byStatus[bookmark.status] = (stats.byStatus[bookmark.status] || 0) + 1;

        // Count by tags
        if (bookmark.tags && Array.isArray(bookmark.tags)) {
          bookmark.tags.forEach(tag => {
            stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
          });
        }

        // Count by time period
        const createdAt = new Date(bookmark.created_at);
        if (createdAt > oneWeekAgo) {
          stats.thisWeek++;
        }
        if (createdAt > oneMonthAgo) {
          stats.thisMonth++;
        }
      });

      return stats;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.getBookmarkStats');
    }
  }

  /**
   * Bulk update bookmarks
   * @param {string[]} bookmarkIds - Array of bookmark IDs
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object[]>} Updated bookmarks
   */
  async bulkUpdateBookmarks(bookmarkIds, updates) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
        throw new Error('Bookmark IDs array is required');
      }

      const results = [];
      const errors = [];

      // Update each bookmark individually
      for (const bookmarkId of bookmarkIds) {
        try {
          const updated = await this.updateBookmark(bookmarkId, updates);
          results.push(updated);
        } catch (error) {
          errors.push({ bookmarkId, error: error.message });
        }
      }

      if (errors.length > 0) {
        console.warn('Some bookmarks failed to update:', errors);
      }

      return results;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.bulkUpdateBookmarks');
    }
  }

  /**
   * Bulk delete bookmarks
   * @param {string[]} bookmarkIds - Array of bookmark IDs
   * @returns {Promise<void>}
   */
  async bulkDeleteBookmarks(bookmarkIds) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
        throw new Error('Bookmark IDs array is required');
      }

      const errors = [];

      // Delete each bookmark individually
      for (const bookmarkId of bookmarkIds) {
        try {
          await this.deleteBookmark(bookmarkId);
        } catch (error) {
          errors.push({ bookmarkId, error: error.message });
        }
      }

      if (errors.length > 0) {
        console.warn('Some bookmarks failed to delete:', errors);
      }
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.bulkDeleteBookmarks');
    }
  }

  /**
   * Export bookmarks to JSON
   * @param {SearchOptions} [options] - Filter options for export
   * @returns {Promise<string>} JSON string of bookmarks
   */
  async exportBookmarks(options = {}) {
    try {
      // Get all matching bookmarks
      const allBookmarks = [];
      let page = 1;
      const pageSize = 100;

      while (true) {
        const searchOptions = { ...options, page, pageSize };
        const result = await this.searchBookmarks(searchOptions);

        allBookmarks.push(...result.items);

        if (!result.hasMore) {
          break;
        }

        page++;
      }

      const exportData = {
        bookmarks: allBookmarks,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        total: allBookmarks.length
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.exportBookmarks');
    }
  }

  /**
   * Import bookmarks from JSON
   * @param {string} jsonData - JSON string of bookmarks
   * @returns {Promise<Object>} Import results
   */
  async importBookmarks(jsonData) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const data = JSON.parse(jsonData);

      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid import data format');
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: []
      };

      for (const bookmark of data.bookmarks) {
        try {
          // Remove id to create new bookmark
          // eslint-disable-next-line no-unused-vars
          const {
            id: _id,
            user_id: _user_id,
            created_at: _created_at,
            updated_at: _updated_at,
            ...bookmarkData
          } = bookmark;

          await this.createBookmark(bookmarkData);
          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            bookmark: bookmark.title || bookmark.url,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.importBookmarks');
    }
  }

  /**
   * Check if URL exists in bookmarks
   * @param {string} url - URL to check
   * @returns {Promise<Object|null>} Existing bookmark or null
   */
  async findBookmarkByUrl(url) {
    try {
      if (!this.authService.isAuthenticated()) {
        return null;
      }

      // Validate and normalize URL
      const validation = this.validationService.validateUrl(url);
      if (!validation.isValid) {
        return null;
      }

      const normalizedUrl = validation.data;
      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?select=*&url=eq.${encodeURIComponent(normalizedUrl)}&user_id=eq.${user.id}`,
        {
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const bookmarks = await response.json();
      return bookmarks.length > 0 ? bookmarks[0] : null;
    } catch (error) {
      this.errorService.handle(error, 'BookmarkService.findBookmarkByUrl');
      return null;
    }
  }

  /**
   * Save bookmark to database
   * @param {Object} bookmark - Bookmark to save
   * @returns {Promise<Object>} Saved bookmark
   * @private
   */
  async saveToDatabase(bookmark) {
    const user = this.authService.getCurrentUser();
    const isUpdate = Boolean(bookmark.id);

    let response;
    if (isUpdate) {
      // Update existing bookmark
      response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?id=eq.${bookmark.id}&user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(bookmark)
        }
      );
    } else {
      // Create new bookmark - don't include id field
      const { id: _id, ...bookmarkData } = bookmark;
      response = await fetch(`${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks`, {
        method: 'POST',
        headers: {
          apikey: this.supabaseClient.supabaseKey,
          Authorization: `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(bookmarkData)
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to save bookmark: ${response.statusText}`);
    }

    const savedBookmarks = await response.json();
    return savedBookmarks[0];
  }

  /**
   * Build search query string
   * @param {Object} options - Search options
   * @param {string} userId - User ID
   * @returns {string} Query string
   * @private
   */
  buildSearchQuery(options, userId) {
    const params = new URLSearchParams();

    // Base selection and user filter
    params.set('select', '*');
    params.set('user_id', `eq.${userId}`);

    // Text search
    if (options.query) {
      params.set(
        'or',
        `title.ilike.%${options.query}%,url.ilike.%${options.query}%,notes.ilike.%${options.query}%`
      );
    }

    // Status filter
    if (options.statuses && options.statuses.length > 0) {
      params.set('status', `in.(${options.statuses.join(',')})`);
    }

    // Date filters - use different parameter names to avoid overwriting
    if (options.dateFrom) {
      params.set('created_at', `gte.${options.dateFrom.toISOString()}`);
    }
    if (options.dateTo) {
      // Use 'and' parameter to combine with dateFrom filter
      if (options.dateFrom) {
        params.set(
          'and',
          `(created_at.gte.${options.dateFrom.toISOString()},created_at.lte.${options.dateTo.toISOString()})`
        );
        params.delete('created_at'); // Remove single filter
      } else {
        params.set('created_at', `lte.${options.dateTo.toISOString()}`);
      }
    }

    // Sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    params.set('order', `${sortBy}.${sortOrder}`);

    // Pagination
    const page = options.page || 1;
    const pageSize = Math.min(
      options.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * pageSize;

    params.set('limit', pageSize.toString());
    params.set('offset', offset.toString());

    return params.toString();
  }

  /**
   * Get total count for search results
   * @param {Object} options - Search options
   * @param {string} userId - User ID
   * @returns {Promise<number>} Total count
   * @private
   */
  async getTotalCount(options, userId) {
    try {
      const params = new URLSearchParams();
      params.set('select', 'count');
      params.set('user_id', `eq.${userId}`);

      // Apply same filters as main query
      if (options.query) {
        params.set(
          'or',
          `title.ilike.%${options.query}%,url.ilike.%${options.query}%,notes.ilike.%${options.query}%`
        );
      }

      if (options.statuses && options.statuses.length > 0) {
        params.set('status', `in.(${options.statuses.join(',')})`);
      }

      // Date filters - use different parameter names to avoid overwriting
      if (options.dateFrom) {
        params.set('created_at', `gte.${options.dateFrom.toISOString()}`);
      }
      if (options.dateTo) {
        // Use 'and' parameter to combine with dateFrom filter
        if (options.dateFrom) {
          params.set(
            'and',
            `(created_at.gte.${options.dateFrom.toISOString()},created_at.lte.${options.dateTo.toISOString()})`
          );
          params.delete('created_at'); // Remove single filter
        } else {
          params.set('created_at', `lte.${options.dateTo.toISOString()}`);
        }
      }

      const user = this.authService.getCurrentUser();
      const response = await fetch(
        `${this.supabaseClient.supabaseUrl}/rest/v1/bookmarks?${params.toString()}`,
        {
          headers: {
            apikey: this.supabaseClient.supabaseKey,
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return 0;
      }

      const result = await response.json();
      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update bookmark cache
   * @private
   */
  async updateCache() {
    try {
      // Get recent bookmarks for cache
      const recent = await this.getRecentBookmarks(50);
      await this.storageService.setBookmarkCache(recent);
    } catch (error) {
      // Cache update failure shouldn't break the main operation
      console.warn('Failed to update bookmark cache:', error);
    }
  }
}
