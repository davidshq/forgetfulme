/**
 * @fileoverview Bookmark management service for the ForgetfulMe extension
 */

import { createClient } from '../lib/supabase.js';
import { PAGINATION, TIME_CALCULATIONS } from '../utils/constants.js';
import { withServicePatterns } from '../utils/serviceHelpers.js';

/**
 * Service for managing bookmarks with full CRUD operations
 *
 * ERROR HANDLING PATTERN:
 * - Supabase API errors: throw Error with descriptive message, let catch block handle with this.handleAndThrow()
 * - Validation errors: use this.errorService.handle() for user-facing messages  
 * - All methods have try/catch that calls this.handleAndThrow() for consistency
 * - Special cases: Known error codes (PGRST116 = not found) handled specifically
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
        const errorInfo = this.errorService.handle(
          new Error('User not authenticated'),
          'BookmarkService.createBookmark'
        );
        throw new Error(errorInfo.message);
      }

      // Get valid status types for validation
      const statusTypes = await this.configService.getStatusTypes();
      const validStatuses = statusTypes.map(type => type.id);

      // Validate bookmark data
      const validation = this.validationService.validateBookmark(bookmarkData, validStatuses);
      if (!validation.isValid) {
        const errorInfo = this.errorService.handle(
          new Error(`Invalid bookmark data: ${validation.errors.join(', ')}`),
          'BookmarkService.createBookmark'
        );
        throw new Error(errorInfo.message);
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
        const errorInfo = this.errorService.handle(
          new Error('User not authenticated'),
          'BookmarkService.updateBookmark'
        );
        throw new Error(errorInfo.message);
      }

      // Get existing bookmark
      const existing = await this.getBookmarkById(bookmarkId);
      if (!existing) {
        const errorInfo = this.errorService.handle(
          new Error('Bookmark not found'),
          'BookmarkService.updateBookmark'
        );
        throw new Error(errorInfo.message);
      }

      // Merge updates with existing data
      const mergedData = { ...existing, ...updates };

      // Get valid status types for validation
      const statusTypes = await this.configService.getStatusTypes();
      const validStatuses = statusTypes.map(type => type.id);

      // Validate updated data
      const validation = this.validationService.validateBookmark(mergedData, validStatuses);
      if (!validation.isValid) {
        const errorInfo = this.errorService.handle(
          new Error(`Invalid bookmark data: ${validation.errors.join(', ')}`),
          'BookmarkService.updateBookmark'
        );
        throw new Error(errorInfo.message);
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
        const errorInfo = this.errorService.handle(
          new Error('User not authenticated'),
          'BookmarkService.deleteBookmark'
        );
        throw new Error(errorInfo.message);
      }

      const user = this.authService.getCurrentUser();

      await this.ensureInitialized();

      // Delete from database using Supabase client
      const { error } = await this.supabaseClient
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete bookmark: ${error.message}`);
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
      // Use standardized auth check
      this.requireAuth('BookmarkService.getBookmarks');

      // Use standardized validation
      this.validateOrThrow(
        options === null ||
          options === undefined ||
          (typeof options === 'object' && !Array.isArray(options)),
        'Options must be an object',
        'BookmarkService.getBookmarks'
      );

      // Ensure options is an object (handle null/undefined)
      const validOptions = options || {};

      const user = this.authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('Current user information not available');
      }

      const page = validOptions.page || 1;
      const limit = validOptions.limit || PAGINATION.DEFAULT_PAGE_SIZE;

      // Check cache first
      const cachedBookmarks = await this.storageService.getBookmarkCache();
      if (cachedBookmarks && !validOptions.forceRefresh) {
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

      const { data, error } = await this.supabaseClient
        .from('bookmarks')
        .select('*')
        .eq('id', bookmarkId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - bookmark not found
          return null;
        }
        throw new Error(`Failed to fetch bookmark: ${error.message}`);
      }

      return data;
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
      console.log('BookmarkService: Starting search with options:', options);

      if (!this.authService.isAuthenticated()) {
        console.error('BookmarkService: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Validate search options
      const validation = this.validationService.validateSearchOptions(options);
      if (!validation.isValid) {
        console.error('BookmarkService: Invalid search options:', validation.errors);
        throw new Error(`Invalid search options: ${validation.errors.join(', ')}`);
      }

      const searchOptions = validation.data;
      const user = this.authService.getCurrentUser();
      console.log('BookmarkService: User authenticated, proceeding with search');

      await this.ensureInitialized();
      console.log('BookmarkService: Service initialized, executing parallel queries');

      // Execute search and count queries in parallel for better performance
      const [bookmarksResponse, totalCount] = await Promise.all([
        this.executeSearchQuery(searchOptions, user),
        this.getTotalCount(searchOptions, user.id)
      ]);

      console.log('BookmarkService: Parallel queries completed');

      const page = searchOptions.page || 1;
      const pageSize = searchOptions.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;

      return {
        items: bookmarksResponse,
        total: totalCount,
        page,
        pageSize,
        hasMore: page * pageSize < totalCount
      };
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.searchBookmarks');
    }
  }

  /**
   * Execute search query for bookmarks
   * @param {Object} searchOptions - Search options
   * @param {Object} user - Current user
   * @returns {Promise<Object[]>} Bookmarks
   * @private
   */
  async executeSearchQuery(searchOptions, user) {
    console.log('BookmarkService: Executing search with options:', searchOptions);

    try {
      let query = this.supabaseClient.from('bookmarks').select('*').eq('user_id', user.id);

      // Text search across multiple columns
      // SECURITY NOTE: Supabase client automatically handles parameterization when building
      // PostgREST queries. No SQL injection risk exists because no direct SQL is executed.
      // The client builds HTTP query strings sent to PostgREST, which handles escaping.
      // Reference: https://github.com/orgs/supabase/discussions/9777
      if (searchOptions.query) {
        query = query.or(
          `title.ilike.%${searchOptions.query}%,url.ilike.%${searchOptions.query}%,notes.ilike.%${searchOptions.query}%`
        );
      }

      // Status filter
      if (searchOptions.statuses && searchOptions.statuses.length > 0) {
        query = query.in('status', searchOptions.statuses);
      }

      // Tags filter
      if (searchOptions.tags && searchOptions.tags.length > 0) {
        query = query.overlaps('tags', searchOptions.tags);
      }

      // Date filters
      if (searchOptions.dateFrom) {
        query = query.gte('created_at', searchOptions.dateFrom.toISOString());
      }
      if (searchOptions.dateTo) {
        query = query.lte('created_at', searchOptions.dateTo.toISOString());
      }

      // Sorting
      const sortBy = searchOptions.sortBy || 'created_at';
      const ascending = searchOptions.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Pagination
      const page = searchOptions.page || 1;
      const pageSize = Math.min(
        searchOptions.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
        PAGINATION.MAX_PAGE_SIZE
      );
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error } = await query;

      if (error) {
        console.error('BookmarkService: Search query failed:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      console.log('BookmarkService: Search completed, found', data.length, 'bookmarks');
      return data;
    } catch (error) {
      console.error('BookmarkService: Search query failed:', error);
      this.handleAndThrow(error, 'BookmarkService.executeSearchQuery');
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

      // Get all bookmarks for statistics using Supabase client
      const { data: bookmarks, error } = await this.supabaseClient
        .from('bookmarks')
        .select('status,tags,created_at')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to fetch bookmarks for stats: ${error.message}`);
      }

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

      // Type safety: validate jsonData
      if (jsonData === null || jsonData === undefined) {
        throw new Error('JSON data cannot be null or undefined');
      }

      if (typeof jsonData !== 'string') {
        throw new Error('JSON data must be a string');
      }

      if (jsonData.trim() === '') {
        throw new Error('JSON data cannot be empty');
      }

      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }

      // Type safety: validate parsed data structure
      if (data === null || data === undefined) {
        throw new Error('Parsed data cannot be null or undefined');
      }

      if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Import data must be an object');
      }

      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid import data format: missing bookmarks array');
      }

      if (data.bookmarks.length === 0) {
        throw new Error('No bookmarks found in import data');
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: []
      };

      for (const bookmark of data.bookmarks) {
        try {
          // Type safety: validate each bookmark
          if (bookmark === null || bookmark === undefined) {
            throw new Error('Bookmark cannot be null or undefined');
          }

          if (typeof bookmark !== 'object' || Array.isArray(bookmark)) {
            throw new Error('Each bookmark must be an object');
          }

          // Remove id to create new bookmark
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
          // Safe property access with null checks
          const bookmarkId = (bookmark && (bookmark.title || bookmark.url)) || 'Unknown bookmark';
          results.errors.push({
            bookmark: bookmarkId,
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

      const { data, error } = await this.supabaseClient
        .from('bookmarks')
        .select('*')
        .eq('url', normalizedUrl)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - bookmark not found
          return null;
        }
        // Log other errors but don't throw
        this.errorService.handle(error, 'BookmarkService.findBookmarkByUrl');
        return null;
      }

      return data;
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
    try {
      const user = this.authService.getCurrentUser();
      const isUpdate = Boolean(bookmark.id);

      let result;
      
      if (isUpdate) {
        // Update existing bookmark
        result = await this.supabaseClient
          .from('bookmarks')
          .update(bookmark)
          .eq('id', bookmark.id)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new bookmark - remove id field if present
        const { id: _id, ...bookmarkData } = bookmark;
        result = await this.supabaseClient
          .from('bookmarks')
          .insert(bookmarkData)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        throw new Error(`Failed to save bookmark: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.handleAndThrow(error, 'BookmarkService.saveToDatabase');
    }
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
      console.log('BookmarkService: Getting total count for search options:', options);

      let query = this.supabaseClient
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Apply the same filters as in search (must match executeSearchQuery filters exactly)
      // SECURITY NOTE: Same as above - Supabase client handles parameterization automatically
      if (options.query) {
        query = query.or(
          `title.ilike.%${options.query}%,url.ilike.%${options.query}%,notes.ilike.%${options.query}%`
        );
      }

      if (options.statuses && options.statuses.length > 0) {
        query = query.in('status', options.statuses);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom.toISOString());
      }
      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        console.error('BookmarkService: Count query failed:', error);
        return 0;
      }

      console.log('BookmarkService: Total count retrieved:', count);
      return count || 0;
    } catch (error) {
      console.error('BookmarkService: Count query error:', error);
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
