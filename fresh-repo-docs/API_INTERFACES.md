# ForgetfulMe Extension - API Interface Definitions (JSDoc)

## Overview

This document defines all interface contracts for the ForgetfulMe extension services using JSDoc annotations. These serve as type documentation for implementation and enable VS Code IntelliSense and error checking without requiring a build step.

## Core Data Types

### Base Types

```javascript
/**
 * @fileoverview Shared type definitions for ForgetfulMe extension
 */

/**
 * UUID string type
 * @typedef {string} UUID
 */

/**
 * ISO DateTime string type  
 * @typedef {string} ISODateTime
 */

/**
 * URL string type
 * @typedef {string} URL
 */

/**
 * Email address string type
 * @typedef {string} EmailAddress
 */

/**
 * Result wrapper for operations that can fail
 * @template T, E
 * @typedef {Object} Result
 * @property {boolean} success
 * @property {T} [data]
 * @property {E} [error]
 */

/**
 * Validation result with detailed error information
 * @template T
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {T} [data]
 */

/**
 * Paginated results for large datasets
 * @template T
 * @typedef {Object} PaginatedResult
 * @property {T[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {boolean} hasNext
 * @property {boolean} hasPrevious
 */
```

### Domain Models

```javascript
/**
 * Core bookmark entity
 * @typedef {Object} Bookmark
 * @property {UUID} id
 * @property {UUID} userId
 * @property {URL} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} status
 * @property {string[]} tags
 * @property {ISODateTime} createdAt
 * @property {ISODateTime} updatedAt
 * @property {ISODateTime} [lastAccessed]
 * @property {number} accessCount
 */

/**
 * New bookmark creation (before ID assignment)
 * @typedef {Object} NewBookmark
 * @property {URL} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} status
 * @property {string[]} [tags]
 */

/**
 * Bookmark update (partial fields)
 * @typedef {Object} BookmarkUpdate
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [status]
 * @property {string[]} [tags]
 */

/**
 * Search and filtering parameters
 * @typedef {Object} SearchQuery
 * @property {string} [text]
 * @property {string} [status]
 * @property {string[]} [tags]
 * @property {ISODateTime} [dateFrom]
 * @property {ISODateTime} [dateTo]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * Bookmark filtering options
 * @typedef {Object} BookmarkFilter
 * @property {string[]} [status]
 * @property {string[]} [tags]
 * @property {ISODateTime} [dateFrom]
 * @property {ISODateTime} [dateTo]
 * @property {boolean} [hasDescription]
 */

/**
 * Statistics and analytics data
 * @typedef {Object} BookmarkStats
 * @property {number} total
 * @property {Object<string, number>} byStatus
 * @property {Object} recentActivity
 * @property {number} recentActivity.last7Days
 * @property {number} recentActivity.last30Days
 * @property {number} recentActivity.thisMonth
 * @property {Array<{tag: string, count: number}>} topTags
 */

/**
 * User entity
 * @typedef {Object} User
 * @property {UUID} id
 * @property {EmailAddress} email
 * @property {ISODateTime} createdAt
 * @property {ISODateTime} [lastLoginAt]
 */

/**
 * User session data
 * @typedef {Object} Session
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {ISODateTime} expiresAt
 * @property {User} user
 */

/**
 * Authentication result
 * @typedef {Object} AuthResult
 * @property {boolean} success
 * @property {Session} [session]
 * @property {string} [error]
 */

/**
 * Supabase configuration
 * @typedef {Object} SupabaseConfig
 * @property {URL} url
 * @property {string} anonKey
 */

/**
 * Custom status type definition
 * @typedef {Object} StatusType
 * @property {UUID} id
 * @property {UUID} userId
 * @property {string} name
 * @property {string} [color]
 * @property {boolean} isDefault
 * @property {number} sortOrder
 * @property {ISODateTime} createdAt
 */

/**
 * New status type creation
 * @typedef {Object} NewStatusType
 * @property {string} name
 * @property {string} [color]
 * @property {boolean} [isDefault]
 */

/**
 * User preferences
 * @typedef {Object} UserPreferences
 * @property {string} defaultStatus
 * @property {boolean} autoTagging
 * @property {Object<string, string>} keyboardShortcuts
 * @property {'light'|'dark'|'auto'} theme
 * @property {number} pageSize
 * @property {boolean} showDescriptions
 */

/**
 * Bookmark export data
 * @typedef {Object} BookmarkExport
 * @property {string} version
 * @property {ISODateTime} exportedAt
 * @property {Bookmark[]} bookmarks
 * @property {StatusType[]} statusTypes
 */

/**
 * Bookmark import data
 * @typedef {Object} BookmarkImport
 * @property {Array<{url: URL, title: string, description?: string, status: string, tags?: string[], createdAt?: ISODateTime}>} bookmarks
 * @property {Array<{name: string, color?: string}>} [statusTypes]
 */

/**
 * Import operation result
 * @typedef {Object} ImportResult
 * @property {number} imported
 * @property {number} skipped
 * @property {Array<{line: number, error: string}>} errors
 */
```

## Service Interface Definitions

### IBookmarkService

```javascript
/**
 * Bookmark service interface for all bookmark-related operations
 * @interface IBookmarkService
 */
class IBookmarkService {
  /**
   * Save a new bookmark
   * @param {NewBookmark} bookmark
   * @returns {Promise<Bookmark>}
   */
  async save(bookmark) {
    throw new Error('Method must be implemented');
  }

  /**
   * Update an existing bookmark
   * @param {UUID} id
   * @param {BookmarkUpdate} changes
   * @returns {Promise<Bookmark>}
   */
  async update(id, changes) {
    throw new Error('Method must be implemented');
  }

  /**
   * Delete a bookmark
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get bookmark by ID
   * @param {UUID} id
   * @returns {Promise<Bookmark|null>}
   */
  async getById(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if bookmark exists by URL
   * @param {URL} url
   * @returns {Promise<boolean>}
   */
  async exists(url) {
    throw new Error('Method must be implemented');
  }

  /**
   * Search bookmarks with query
   * @param {SearchQuery} query
   * @returns {Promise<PaginatedResult<Bookmark>>}
   */
  async search(query) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get recent bookmarks
   * @param {number} [limit=10]
   * @returns {Promise<Bookmark[]>}
   */
  async getRecent(limit = 10) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get all bookmarks with optional filter
   * @param {BookmarkFilter} [filter]
   * @returns {Promise<Bookmark[]>}
   */
  async getAll(filter) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get bookmarks by status
   * @param {string} status
   * @returns {Promise<Bookmark[]>}
   */
  async getByStatus(status) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get bookmarks by tags
   * @param {string[]} tags
   * @returns {Promise<Bookmark[]>}
   */
  async getByTags(tags) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get bookmarks by date range
   * @param {ISODateTime} from
   * @param {ISODateTime} to
   * @returns {Promise<Bookmark[]>}
   */
  async getByDateRange(from, to) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get bookmark statistics
   * @returns {Promise<BookmarkStats>}
   */
  async getStats() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get tag cloud data
   * @returns {Promise<Array<{tag: string, count: number, size: number}>>}
   */
  async getTagCloud() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get activity timeline
   * @returns {Promise<Array<{date: string, count: number}>>}
   */
  async getActivityTimeline() {
    throw new Error('Method must be implemented');
  }

  /**
   * Bulk delete bookmarks
   * @param {UUID[]} ids
   * @returns {Promise<{deleted: number, errors: string[]}>}
   */
  async bulkDelete(ids) {
    throw new Error('Method must be implemented');
  }

  /**
   * Bulk update status
   * @param {UUID[]} ids
   * @param {string} status
   * @returns {Promise<{updated: number, errors: string[]}>}
   */
  async bulkUpdateStatus(ids, status) {
    throw new Error('Method must be implemented');
  }

  /**
   * Bulk add tags
   * @param {UUID[]} ids
   * @param {string[]} tags
   * @returns {Promise<{updated: number, errors: string[]}>}
   */
  async bulkAddTags(ids, tags) {
    throw new Error('Method must be implemented');
  }

  /**
   * Bulk remove tags
   * @param {UUID[]} ids
   * @param {string[]} tags
   * @returns {Promise<{updated: number, errors: string[]}>}
   */
  async bulkRemoveTags(ids, tags) {
    throw new Error('Method must be implemented');
  }

  /**
   * Export bookmarks
   * @param {BookmarkFilter} [filter]
   * @returns {Promise<BookmarkExport>}
   */
  async export(filter) {
    throw new Error('Method must be implemented');
  }

  /**
   * Import bookmarks
   * @param {BookmarkImport} data
   * @returns {Promise<ImportResult>}
   */
  async import(data) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get all unique tags
   * @returns {Promise<string[]>}
   */
  async getAllTags() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get popular tags
   * @param {number} [limit=10]
   * @returns {Promise<Array<{tag: string, count: number}>>}
   */
  async getPopularTags(limit = 10) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate bookmark data
   * @param {NewBookmark} bookmark
   * @returns {Promise<ValidationResult<NewBookmark>>}
   */
  async validateBookmark(bookmark) {
    throw new Error('Method must be implemented');
  }
}
```

### IAuthService

```javascript
/**
 * Authentication service interface
 * @interface IAuthService
 */
class IAuthService {
  /**
   * Sign in user with email and password
   * @param {EmailAddress} email
   * @param {string} password
   * @returns {Promise<AuthResult>}
   */
  async signIn(email, password) {
    throw new Error('Method must be implemented');
  }

  /**
   * Sign up new user
   * @param {EmailAddress} email
   * @param {string} password
   * @returns {Promise<AuthResult>}
   */
  async signUp(email, password) {
    throw new Error('Method must be implemented');
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    throw new Error('Method must be implemented');
  }

  /**
   * Reset user password
   * @param {EmailAddress} email
   * @returns {Promise<Result<void>>}
   */
  async resetPassword(email) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get current session
   * @returns {Promise<Session|null>}
   */
  async getSession() {
    throw new Error('Method must be implemented');
  }

  /**
   * Refresh current session
   * @returns {Promise<Session>}
   */
  async refreshSession() {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get current user
   * @returns {Promise<User|null>}
   */
  async getCurrentUser() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get current user ID
   * @returns {Promise<UUID>}
   */
  async getUserId() {
    throw new Error('Method must be implemented');
  }

  /**
   * Listen for auth state changes
   * @param {function(Session|null): void} callback
   * @returns {function(): void} Unsubscribe function
   */
  onAuthStateChange(callback) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {ValidationResult<EmailAddress>}
   */
  validateEmail(email) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate password strength
   * @param {string} password
   * @returns {ValidationResult<string>}
   */
  validatePassword(password) {
    throw new Error('Method must be implemented');
  }
}
```

### IConfigService

```javascript
/**
 * Configuration service interface
 * @interface IConfigService
 */
class IConfigService {
  /**
   * Get Supabase configuration
   * @returns {Promise<SupabaseConfig|null>}
   */
  async getSupabaseConfig() {
    throw new Error('Method must be implemented');
  }

  /**
   * Set Supabase configuration
   * @param {SupabaseConfig} config
   * @returns {Promise<void>}
   */
  async setSupabaseConfig(config) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate Supabase configuration
   * @param {SupabaseConfig} config
   * @returns {Promise<ValidationResult<SupabaseConfig>>}
   */
  async validateSupabaseConfig(config) {
    throw new Error('Method must be implemented');
  }

  /**
   * Test connection with config
   * @param {SupabaseConfig} [config]
   * @returns {Promise<Result<{connected: boolean, latency: number}>>}
   */
  async testConnection(config) {
    throw new Error('Method must be implemented');
  }

  /**
   * Clear Supabase configuration
   * @returns {Promise<void>}
   */
  async clearSupabaseConfig() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get user preferences
   * @returns {Promise<UserPreferences>}
   */
  async getUserPreferences() {
    throw new Error('Method must be implemented');
  }

  /**
   * Set user preferences
   * @param {Partial<UserPreferences>} prefs
   * @returns {Promise<void>}
   */
  async setUserPreferences(prefs) {
    throw new Error('Method must be implemented');
  }

  /**
   * Reset user preferences to defaults
   * @returns {Promise<void>}
   */
  async resetUserPreferences() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get status types
   * @returns {Promise<StatusType[]>}
   */
  async getStatusTypes() {
    throw new Error('Method must be implemented');
  }

  /**
   * Add new status type
   * @param {NewStatusType} statusType
   * @returns {Promise<StatusType>}
   */
  async addStatusType(statusType) {
    throw new Error('Method must be implemented');
  }

  /**
   * Update status type
   * @param {UUID} id
   * @param {Partial<StatusType>} changes
   * @returns {Promise<StatusType>}
   */
  async updateStatusType(id, changes) {
    throw new Error('Method must be implemented');
  }

  /**
   * Delete status type
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async deleteStatusType(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get default status type
   * @returns {Promise<StatusType|null>}
   */
  async getDefaultStatusType() {
    throw new Error('Method must be implemented');
  }

  /**
   * Set default status type
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async setDefaultStatusType(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get application setting
   * @template T
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async getSetting(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Set application setting
   * @template T
   * @param {string} key
   * @param {T} value
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove application setting
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeSetting(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get all application settings
   * @returns {Promise<Object<string, any>>}
   */
  async getAllSettings() {
    throw new Error('Method must be implemented');
  }

  /**
   * Initialize default configuration
   * @returns {Promise<void>}
   */
  async initializeDefaults() {
    throw new Error('Method must be implemented');
  }

  /**
   * Migrate configuration between versions
   * @param {string} fromVersion
   * @param {string} toVersion
   * @returns {Promise<void>}
   */
  async migrateConfiguration(fromVersion, toVersion) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate entire configuration
   * @returns {Promise<ValidationResult<void>>}
   */
  async validateConfiguration() {
    throw new Error('Method must be implemented');
  }
}
```

### IStorageService

```javascript
/**
 * Storage service interface
 * @interface IStorageService
 */
class IStorageService {
  /**
   * Get value from storage
   * @template T
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async get(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Set value in storage
   * @template T
   * @param {string} key
   * @param {T} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove value from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get all storage keys
   * @returns {Promise<string[]>}
   */
  async keys() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get multiple values
   * @template T
   * @param {string[]} keys
   * @returns {Promise<Object<string, T>>}
   */
  async getMultiple(keys) {
    throw new Error('Method must be implemented');
  }

  /**
   * Set multiple values
   * @template T
   * @param {Object<string, T>} items
   * @returns {Promise<void>}
   */
  async setMultiple(items) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove multiple keys
   * @param {string[]} keys
   * @returns {Promise<void>}
   */
  async removeMultiple(keys) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get current session
   * @returns {Promise<Session|null>}
   */
  async getSession() {
    throw new Error('Method must be implemented');
  }

  /**
   * Set session data
   * @param {Session} session
   * @returns {Promise<void>}
   */
  async setSession(session) {
    throw new Error('Method must be implemented');
  }

  /**
   * Clear session data
   * @returns {Promise<void>}
   */
  async clearSession() {
    throw new Error('Method must be implemented');
  }

  /**
   * Cache bookmark data
   * @param {Bookmark} bookmark
   * @returns {Promise<void>}
   */
  async cacheBookmark(bookmark) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get cached bookmark
   * @param {UUID} id
   * @returns {Promise<Bookmark|null>}
   */
  async getCachedBookmark(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get cached bookmarks
   * @param {UUID[]} [ids]
   * @returns {Promise<Bookmark[]>}
   */
  async getCachedBookmarks(ids) {
    throw new Error('Method must be implemented');
  }

  /**
   * Clear bookmark cache
   * @returns {Promise<void>}
   */
  async clearBookmarkCache() {
    throw new Error('Method must be implemented');
  }

  /**
   * Invalidate cached bookmark
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async invalidateBookmarkCache(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get configuration value
   * @template T
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async getConfig(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Set configuration value
   * @template T
   * @param {string} key
   * @param {T} value
   * @returns {Promise<void>}
   */
  async setConfig(key, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove configuration value
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeConfig(key) {
    throw new Error('Method must be implemented');
  }

  /**
   * Listen for storage changes
   * @param {function(Object<string, any>): void} callback
   * @returns {function(): void} Unsubscribe function
   */
  onStorageChange(callback) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<{used: number, available: number}>}
   */
  async getStorageUsage() {
    throw new Error('Method must be implemented');
  }

  /**
   * Compress storage data
   * @returns {Promise<void>}
   */
  async compress() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create storage backup
   * @returns {Promise<Object<string, any>>}
   */
  async backup() {
    throw new Error('Method must be implemented');
  }

  /**
   * Restore from backup
   * @param {Object<string, any>} backup
   * @returns {Promise<void>}
   */
  async restore(backup) {
    throw new Error('Method must be implemented');
  }
}
```

### IErrorService

```javascript
/**
 * Error types for categorization
 * @enum {string}
 */
const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  CONFIG: 'CONFIG',
  STORAGE: 'STORAGE',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 * @enum {string}
 */
const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Service error object
 * @typedef {Object} ServiceError
 * @property {UUID} id
 * @property {Error} original
 * @property {string} type
 * @property {string} severity
 * @property {string} context
 * @property {string} userMessage
 * @property {Date} timestamp
 * @property {boolean} retryable
 * @property {number} [retryCount]
 * @property {string} [stackTrace]
 * @property {Object<string, any>} [metadata]
 */

/**
 * Error service interface
 * @interface IErrorService
 */
class IErrorService {
  /**
   * Handle an error and return structured error info
   * @param {Error} error
   * @param {string} context
   * @param {Object<string, any>} [metadata]
   * @returns {ServiceError}
   */
  handle(error, context, metadata) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create a custom error
   * @param {string} message
   * @param {string} type
   * @param {string} context
   * @returns {ServiceError}
   */
  createError(message, type, context) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get user-friendly error message
   * @param {ServiceError} error
   * @returns {string}
   */
  getUserMessage(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get detailed error message
   * @param {ServiceError} error
   * @returns {string}
   */
  getDetailedMessage(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if error should be retried
   * @param {ServiceError} error
   * @returns {boolean}
   */
  shouldRetry(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if error can be retried
   * @param {ServiceError} error
   * @returns {boolean}
   */
  canRetry(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Increment retry count for error
   * @param {ServiceError} error
   * @returns {ServiceError}
   */
  incrementRetryCount(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Log error information
   * @param {ServiceError} error
   * @returns {void}
   */
  log(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Log multiple errors
   * @param {ServiceError[]} errors
   * @returns {void}
   */
  logBatch(errors) {
    throw new Error('Method must be implemented');
  }

  /**
   * Categorize error by type
   * @param {Error} error
   * @returns {string}
   */
  categorizeError(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Calculate error severity
   * @param {Error} error
   * @param {string} context
   * @returns {string}
   */
  calculateSeverity(error, context) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get recovery actions for error
   * @param {ServiceError} error
   * @returns {Array<{action: string, description: string, handler: function(): Promise<void>}>}
   */
  getRecoveryActions(error) {
    throw new Error('Method must be implemented');
  }

  /**
   * Listen for error events
   * @param {function(ServiceError): void} callback
   * @returns {function(): void} Unsubscribe function
   */
  onError(callback) {
    throw new Error('Method must be implemented');
  }

  /**
   * Listen for critical error events
   * @param {function(ServiceError): void} callback
   * @returns {function(): void} Unsubscribe function
   */
  onCriticalError(callback) {
    throw new Error('Method must be implemented');
  }
}
```

### IValidationService

```javascript
/**
 * Validation service interface
 * @interface IValidationService
 */
class IValidationService {
  /**
   * Validate bookmark data
   * @param {NewBookmark} bookmark
   * @returns {Promise<ValidationResult<NewBookmark>>}
   */
  async validateBookmark(bookmark) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate bookmark update data
   * @param {UUID} id
   * @param {BookmarkUpdate} update
   * @returns {Promise<ValidationResult<BookmarkUpdate>>}
   */
  async validateBookmarkUpdate(id, update) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate URL format
   * @param {string} url
   * @returns {ValidationResult<URL>}
   */
  validateUrl(url) {
    throw new Error('Method must be implemented');
  }

  /**
   * Normalize URL format
   * @param {string} url
   * @returns {URL}
   */
  normalizeUrl(url) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if domain is valid
   * @param {string} domain
   * @returns {boolean}
   */
  isValidDomain(domain) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {ValidationResult<EmailAddress>}
   */
  validateEmail(email) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate password strength
   * @param {string} password
   * @returns {ValidationResult<string>}
   */
  validatePassword(password) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate tag format
   * @param {string} tag
   * @returns {ValidationResult<string>}
   */
  validateTag(tag) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate status type data
   * @param {NewStatusType} statusType
   * @returns {ValidationResult<StatusType>}
   */
  validateStatusType(statusType) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate Supabase configuration
   * @param {SupabaseConfig} config
   * @returns {ValidationResult<SupabaseConfig>}
   */
  validateSupabaseConfig(config) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate user preferences
   * @param {UserPreferences} prefs
   * @returns {ValidationResult<UserPreferences>}
   */
  validateUserPreferences(prefs) {
    throw new Error('Method must be implemented');
  }

  /**
   * Sanitize user input
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput(input) {
    throw new Error('Method must be implemented');
  }

  /**
   * Sanitize HTML content
   * @param {string} html
   * @returns {string}
   */
  sanitizeHtml(html) {
    throw new Error('Method must be implemented');
  }

  /**
   * Sanitize URL
   * @param {string} url
   * @returns {URL}
   */
  sanitizeUrl(url) {
    throw new Error('Method must be implemented');
  }

  /**
   * Validate against business rules
   * @param {any} data
   * @param {string[]} rules
   * @returns {ValidationResult<any>}
   */
  validateBusinessRules(data, rules) {
    throw new Error('Method must be implemented');
  }

  /**
   * Add custom validator
   * @param {string} name
   * @param {function(any): ValidationResult<any>} validator
   * @returns {void}
   */
  addValidator(name, validator) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove custom validator
   * @param {string} name
   * @returns {void}
   */
  removeValidator(name) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if value is required (not null/undefined/empty)
   * @param {any} value
   * @returns {boolean}
   */
  isRequired(value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if string is valid email
   * @param {string} value
   * @returns {boolean}
   */
  isEmail(value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if string is valid URL
   * @param {string} value
   * @returns {boolean}
   */
  isUrl(value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if string is valid UUID
   * @param {string} value
   * @returns {boolean}
   */
  isUuid(value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if string length is within bounds
   * @param {string} value
   * @param {number} min
   * @param {number} max
   * @returns {boolean}
   */
  isWithinLength(value, min, max) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if string matches pattern
   * @param {string} value
   * @param {RegExp} pattern
   * @returns {boolean}
   */
  matchesPattern(value, pattern) {
    throw new Error('Method must be implemented');
  }
}
```

## External Interface Definitions

### Database Client Interface

```javascript
/**
 * Database client interface for Supabase operations
 * @interface IDatabaseClient
 */
class IDatabaseClient {
  constructor() {
    /**
     * Authentication operations
     * @type {Object}
     */
    this.auth = {
      /**
       * Sign in with password
       * @param {{email: string, password: string}} credentials
       * @returns {Promise<{data: {session: Session|null, user: User|null}, error: any}>}
       */
      signInWithPassword: (credentials) => { throw new Error('Method must be implemented'); },

      /**
       * Sign up new user
       * @param {{email: string, password: string}} credentials
       * @returns {Promise<{data: {session: Session|null, user: User|null}, error: any}>}
       */
      signUp: (credentials) => { throw new Error('Method must be implemented'); },

      /**
       * Sign out current user
       * @returns {Promise<{error: any}>}
       */
      signOut: () => { throw new Error('Method must be implemented'); },

      /**
       * Get current session
       * @returns {Promise<{data: {session: Session|null}, error: any}>}
       */
      getSession: () => { throw new Error('Method must be implemented'); },

      /**
       * Refresh session
       * @returns {Promise<{data: {session: Session}, error: any}>}
       */
      refreshSession: () => { throw new Error('Method must be implemented'); },

      /**
       * Listen for auth state changes
       * @param {function(string, Session|null): void} callback
       * @returns {{data: {subscription: any}}}
       */
      onAuthStateChange: (callback) => { throw new Error('Method must be implemented'); }
    };

    /**
     * Bookmarks table operations
     * @type {Object}
     */
    this.bookmarks = {
      /**
       * Select bookmarks
       * @param {string} [columns]
       * @returns {DatabaseQuery<Bookmark>}
       */
      select: (columns) => { throw new Error('Method must be implemented'); },

      /**
       * Insert bookmark
       * @param {Partial<Bookmark>} data
       * @returns {Promise<Bookmark>}
       */
      insert: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Update bookmarks
       * @param {Partial<Bookmark>} data
       * @returns {DatabaseQuery<Bookmark>}
       */
      update: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Delete bookmarks  
       * @returns {DatabaseQuery<void>}
       */
      delete: () => { throw new Error('Method must be implemented'); }
    };

    /**
     * Status types table operations
     * @type {Object}
     */  
    this.statusTypes = {
      /**
       * Select status types
       * @param {string} [columns]
       * @returns {DatabaseQuery<StatusType>}
       */
      select: (columns) => { throw new Error('Method must be implemented'); },

      /**
       * Insert status type
       * @param {Partial<StatusType>} data
       * @returns {Promise<StatusType>}
       */
      insert: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Update status types
       * @param {Partial<StatusType>} data
       * @returns {DatabaseQuery<StatusType>}
       */
      update: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Delete status types
       * @returns {DatabaseQuery<void>}
       */
      delete: () => { throw new Error('Method must be implemented'); }
    };

    /**
     * User profiles table operations  
     * @type {Object}
     */
    this.userProfiles = {
      /**
       * Select user profiles
       * @param {string} [columns]
       * @returns {DatabaseQuery<User>}
       */
      select: (columns) => { throw new Error('Method must be implemented'); },

      /**
       * Insert user profile
       * @param {Partial<User>} data
       * @returns {Promise<User>}
       */
      insert: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Update user profiles
       * @param {Partial<User>} data
       * @returns {DatabaseQuery<User>}
       */
      update: (data) => { throw new Error('Method must be implemented'); },

      /**
       * Delete user profiles
       * @returns {DatabaseQuery<void>}
       */
      delete: () => { throw new Error('Method must be implemented'); }
    };
  }
}

/**
 * Database query builder interface
 * @template T
 * @interface DatabaseQuery
 */
class DatabaseQuery {
  /**
   * Equal condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  eq(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Not equal condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  neq(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Greater than condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  gt(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Greater than or equal condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  gte(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Less than condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  lt(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Less than or equal condition
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  lte(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Like pattern condition
   * @param {string} column
   * @param {string} pattern
   * @returns {DatabaseQuery<T>}
   */
  like(column, pattern) {
    throw new Error('Method must be implemented');
  }

  /**
   * Case-insensitive like pattern
   * @param {string} column
   * @param {string} pattern
   * @returns {DatabaseQuery<T>}
   */
  ilike(column, pattern) {
    throw new Error('Method must be implemented');
  }

  /**
   * In array condition
   * @param {string} column
   * @param {any[]} values
   * @returns {DatabaseQuery<T>}
   */
  in(column, values) {
    throw new Error('Method must be implemented');
  }

  /**
   * Contains condition (for arrays/JSON)
   * @param {string} column
   * @param {any} value
   * @returns {DatabaseQuery<T>}
   */
  contains(column, value) {
    throw new Error('Method must be implemented');
  }

  /**
   * Order results
   * @param {string} column
   * @param {{ascending?: boolean}} [options]
   * @returns {DatabaseQuery<T>}
   */
  order(column, options) {
    throw new Error('Method must be implemented');
  }

  /**
   * Limit results
   * @param {number} count
   * @returns {DatabaseQuery<T>}
   */
  limit(count) {
    throw new Error('Method must be implemented');
  }

  /**
   * Range of results
   * @param {number} from
   * @param {number} to
   * @returns {DatabaseQuery<T>}  
   */
  range(from, to) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get single result
   * @returns {Promise<T>}
   */
  single() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get single result or null
   * @returns {Promise<T|null>}
   */
  maybeSingle() {
    throw new Error('Method must be implemented');
  }

  /**
   * Execute query and get results
   * @template U
   * @param {function(T[]): U} [callback]
   * @returns {Promise<U>}
   */
  then(callback) {
    throw new Error('Method must be implemented');
  }
}
```

### Chrome Extension Interfaces

```javascript
/**
 * Chrome storage interface
 * @typedef {Object} ChromeStorage
 */

/**
 * Chrome extension APIs interface
 * @interface ChromeStorage
 */
class ChromeStorage {
  constructor() {
    /**
     * Storage APIs
     * @type {Object}
     */
    this.storage = {
      /**
       * Sync storage (synced across devices)
       * @type {Object}
       */
      sync: {
        /**
         * Get values from sync storage
         * @param {string|string[]|Object<string, any>} keys
         * @returns {Promise<Object<string, any>>}
         */
        get: (keys) => { throw new Error('Method must be implemented'); },

        /**
         * Set values in sync storage
         * @param {Object<string, any>} items
         * @returns {Promise<void>}
         */
        set: (items) => { throw new Error('Method must be implemented'); },

        /**
         * Remove values from sync storage
         * @param {string|string[]} keys
         * @returns {Promise<void>}
         */
        remove: (keys) => { throw new Error('Method must be implemented'); },

        /**
         * Clear sync storage
         * @returns {Promise<void>}
         */
        clear: () => { throw new Error('Method must be implemented'); },

        /**
         * Get bytes in use
         * @param {string|string[]} [keys]
         * @returns {Promise<number>}
         */
        getBytesInUse: (keys) => { throw new Error('Method must be implemented'); },

        /**
         * Storage change events
         * @type {Object}
         */
        onChanged: {
          /**
           * Add change listener
           * @param {function(Object<string, any>, string): void} callback
           * @returns {void}
           */
          addListener: (callback) => { throw new Error('Method must be implemented'); },

          /**
           * Remove change listener
           * @param {Function} callback
           * @returns {void}
           */
          removeListener: (callback) => { throw new Error('Method must be implemented'); }
        }
      },

      /**
       * Local storage (device-specific)
       * @type {Object}
       */
      local: {
        /**
         * Get values from local storage
         * @param {string|string[]|Object<string, any>} keys
         * @returns {Promise<Object<string, any>>}
         */
        get: (keys) => { throw new Error('Method must be implemented'); },

        /**
         * Set values in local storage
         * @param {Object<string, any>} items
         * @returns {Promise<void>}
         */
        set: (items) => { throw new Error('Method must be implemented'); },

        /**
         * Remove values from local storage
         * @param {string|string[]} keys
         * @returns {Promise<void>}
         */
        remove: (keys) => { throw new Error('Method must be implemented'); },

        /**
         * Clear local storage
         * @returns {Promise<void>}
         */
        clear: () => { throw new Error('Method must be implemented'); },

        /**
         * Get bytes in use in local storage
         * @param {string|string[]} [keys]
         * @returns {Promise<number>}
         */
        getBytesInUse: (keys) => { throw new Error('Method must be implemented'); }
      }
    };

    /**
     * Tabs API
     * @type {Object}
     */
    this.tabs = {
      /**
       * Query tabs
       * @param {any} queryInfo
       * @returns {Promise<any[]>}
       */
      query: (queryInfo) => { throw new Error('Method must be implemented'); },

      /**
       * Get tab by ID
       * @param {number} tabId
       * @returns {Promise<any>}
       */
      get: (tabId) => { throw new Error('Method must be implemented'); },

      /**
       * Get current tab
       * @returns {Promise<any>}
       */
      getCurrent: () => { throw new Error('Method must be implemented'); }
    };

    /**
     * Runtime API
     * @type {Object}
     */
    this.runtime = {
      /**
       * Send message
       * @param {any} message
       * @returns {Promise<any>}
       */
      sendMessage: (message) => { throw new Error('Method must be implemented'); },

      /**
       * Message events
       * @type {Object}
       */
      onMessage: {
        /**
         * Add message listener
         * @param {function(any, any, Function): void} callback
         * @returns {void}
         */
        addListener: (callback) => { throw new Error('Method must be implemented'); },

        /**
         * Remove message listener
         * @param {Function} callback
         * @returns {void}
         */
        removeListener: (callback) => { throw new Error('Method must be implemented'); }
      }
    };

    /**
     * Commands API
     * @type {Object}
     */
    this.commands = {
      /**
       * Command events
       * @type {Object}
       */
      onCommand: {
        /**
         * Add command listener
         * @param {function(string): void} callback
         * @returns {void}
         */
        addListener: (callback) => { throw new Error('Method must be implemented'); },

        /**
         * Remove command listener
         * @param {Function} callback
         * @returns {void}
         */
        removeListener: (callback) => { throw new Error('Method must be implemented'); }
      }
    };

    /**
     * Notifications API
     * @type {Object}
     */
    this.notifications = {
      /**
       * Create notification
       * @param {string} id
       * @param {any} options
       * @returns {Promise<string>}
       */
      create: (id, options) => { throw new Error('Method must be implemented'); },

      /**
       * Clear notification
       * @param {string} id
       * @returns {Promise<boolean>}
       */
      clear: (id) => { throw new Error('Method must be implemented'); },

      /**
       * Notification click events
       * @type {Object}
       */
      onClicked: {
        /**
         * Add click listener
         * @param {function(string): void} callback
         * @returns {void}
         */
        addListener: (callback) => { throw new Error('Method must be implemented'); },

        /**
         * Remove click listener
         * @param {Function} callback
         * @returns {void}
         */
        removeListener: (callback) => { throw new Error('Method must be implemented'); }
      }
    };
  }
}
```

## Controller Interfaces

### Base Controller

```javascript
/**
 * Base controller interface
 * @interface IBaseController
 */
class IBaseController {
  /**
   * Initialize the controller
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method must be implemented');
  }

  /**
   * Destroy/cleanup the controller
   * @returns {Promise<void>}
   */
  async destroy() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle error with user-friendly message
   * @param {Error} error
   * @param {string} context
   * @returns {Promise<void>}
   */
  async handleError(error, context) {
    throw new Error('Method must be implemented');
  }
}
```

### UI Controllers

```javascript
/**
 * Popup controller interface
 * @interface IPopupController
 * @extends IBaseController
 */
class IPopupController extends IBaseController {
  /**
   * Load current page information
   * @returns {Promise<void>}
   */
  async loadCurrentPageInfo() {
    throw new Error('Method must be implemented');
  }

  /**
   * Load recent bookmarks
   * @returns {Promise<void>}
   */
  async loadRecentBookmarks() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle bookmark save
   * @param {NewBookmark} formData
   * @returns {Promise<void>}
   */
  async handleBookmarkSave(formData) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle status change
   * @param {UUID} bookmarkId
   * @param {string} newStatus
   * @returns {Promise<void>}
   */
  async handleStatusChange(bookmarkId, newStatus) {
    throw new Error('Method must be implemented');
  }

  /**
   * Show authentication interface
   * @returns {void}
   */
  showAuthInterface() {
    throw new Error('Method must be implemented');
  }

  /**
   * Show main interface
   * @returns {void}
   */
  showMainInterface() {
    throw new Error('Method must be implemented');
  }
}

/**
 * Options controller interface
 * @interface IOptionsController
 * @extends IBaseController
 */
class IOptionsController extends IBaseController {
  /**
   * Load configuration
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle configuration save
   * @param {SupabaseConfig} config
   * @returns {Promise<void>}
   */
  async handleConfigSave(config) {
    throw new Error('Method must be implemented');
  }

  /**
   * Load status types
   * @returns {Promise<void>}
   */
  async loadStatusTypes() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle status type addition
   * @param {NewStatusType} statusType
   * @returns {Promise<void>}
   */
  async handleStatusTypeAdd(statusType) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle status type update
   * @param {UUID} id
   * @param {Partial<StatusType>} changes
   * @returns {Promise<void>}
   */
  async handleStatusTypeUpdate(id, changes) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle status type deletion
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async handleStatusTypeDelete(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Load user preferences
   * @returns {Promise<void>}
   */
  async loadUserPreferences() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle preferences save
   * @param {Partial<UserPreferences>} prefs
   * @returns {Promise<void>}
   */
  async handlePreferencesSave(prefs) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Bookmark manager controller interface
 * @interface IBookmarkManagerController
 * @extends IBaseController
 */
class IBookmarkManagerController extends IBaseController {
  /**
   * Load bookmarks with filter
   * @param {BookmarkFilter} [filter]
   * @returns {Promise<void>}
   */
  async loadBookmarks(filter) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle search
   * @param {SearchQuery} query
   * @returns {Promise<void>}
   */
  async handleSearch(query) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle bookmark edit
   * @param {UUID} id
   * @param {BookmarkUpdate} changes
   * @returns {Promise<void>}
   */
  async handleBookmarkEdit(id, changes) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle bookmark deletion
   * @param {UUID} id
   * @returns {Promise<void>}
   */
  async handleBookmarkDelete(id) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle bulk deletion
   * @param {UUID[]} ids
   * @returns {Promise<void>}
   */
  async handleBulkDelete(ids) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle bulk status update
   * @param {UUID[]} ids
   * @param {string} status
   * @returns {Promise<void>}
   */
  async handleBulkStatusUpdate(ids, status) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle export
   * @param {BookmarkFilter} [filter]
   * @returns {Promise<void>}
   */
  async handleExport(filter) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle import
   * @param {BookmarkImport} data
   * @returns {Promise<void>}
   */
  async handleImport(data) {
    throw new Error('Method must be implemented');
  }
}
```

## Background Service Interfaces

```javascript
/**
 * Background service interface
 * @interface IBackgroundService
 * @extends IBaseController
 */
class IBackgroundService extends IBaseController {
  /**
   * Handle keyboard shortcut
   * @param {string} command
   * @returns {Promise<void>}
   */
  async handleKeyboardShortcut(command) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle sync operation
   * @returns {Promise<void>}
   */
  async handleSync() {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle extension message
   * @param {any} message
   * @param {any} sender
   * @returns {Promise<any>}
   */
  async handleMessage(message, sender) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Sync manager interface
 * @interface ISyncManager
 */
class ISyncManager {
  /**
   * Start sync process
   * @returns {Promise<void>}
   */
  async startSync() {
    throw new Error('Method must be implemented');
  }

  /**
   * Stop sync process
   * @returns {Promise<void>}
   */
  async stopSync() {
    throw new Error('Method must be implemented');
  }

  /**
   * Force immediate sync
   * @returns {Promise<void>}
   */
  async forceSync() {
    throw new Error('Method must be implemented');
  }

  /**
   * Get sync status
   * @returns {Promise<{lastSync: ISODateTime, nextSync: ISODateTime, inProgress: boolean, errors: string[]}>}
   */
  async getSyncStatus() {
    throw new Error('Method must be implemented');
  }
}

/**
 * Shortcut manager interface
 * @interface IShortcutManager
 */
class IShortcutManager {
  /**
   * Register keyboard shortcut
   * @param {string} command
   * @param {function(): Promise<void>} handler
   * @returns {void}
   */
  registerShortcut(command, handler) {
    throw new Error('Method must be implemented');
  }

  /**
   * Unregister keyboard shortcut
   * @param {string} command
   * @returns {void}
   */
  unregisterShortcut(command) {
    throw new Error('Method must be implemented');
  }

  /**
   * Handle shortcut execution
   * @param {string} command
   * @returns {Promise<void>}
   */
  async handleShortcut(command) {
    throw new Error('Method must be implemented');
  }
}
```

## Utility Interfaces

### Service Container

```javascript
/**
 * Service container interface
 * @interface IServiceContainer
 */
class IServiceContainer {
  /**
   * Register service factory
   * @template T
   * @param {string} name
   * @param {function(): T} factory
   * @returns {void}
   */
  register(name, factory) {
    throw new Error('Method must be implemented');
  }

  /**
   * Register singleton service
   * @template T
   * @param {string} name
   * @param {function(): T} factory
   * @returns {void}
   */
  registerSingleton(name, factory) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get service instance
   * @template T
   * @param {string} name
   * @returns {T}
   */
  get(name) {
    throw new Error('Method must be implemented');
  }

  /**
   * Check if service exists
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove service
   * @param {string} name
   * @returns {void}
   */
  remove(name) {
    throw new Error('Method must be implemented');
  }

  /**
   * Clear all services
   * @returns {void}
   */
  clear() {
    throw new Error('Method must be implemented');
  }
}
```

### Event System

```javascript
/**
 * Event emitter interface
 * @interface IEventEmitter
 */
class IEventEmitter {
  /**
   * Add event listener
   * @param {string} event
   * @param {Function} handler
   * @returns {function(): void} Unsubscribe function
   */
  on(event, handler) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} handler
   * @returns {void}
   */
  off(event, handler) {
    throw new Error('Method must be implemented');
  }

  /**
   * Emit event
   * @param {string} event
   * @param {...any} args
   * @returns {void}
   */
  emit(event, ...args) {
    throw new Error('Method must be implemented');
  }

  /**
   * Add one-time event listener
   * @param {string} event
   * @param {Function} handler
   * @returns {function(): void} Unsubscribe function
   */
  once(event, handler) {
    throw new Error('Method must be implemented');
  }

  /**
   * Remove all listeners for event
   * @param {string} [event]
   * @returns {void}
   */
  removeAllListeners(event) {
    throw new Error('Method must be implemented');
  }
}
```

## Testing Interfaces

```javascript
/**
 * Mock factory interface
 * @interface IMockFactory
 */
class IMockFactory {
  /**
   * Create mock bookmark service
   * @returns {import('vitest').MockedObject<IBookmarkService>}
   */
  createMockBookmarkService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock auth service
   * @returns {import('vitest').MockedObject<IAuthService>}
   */
  createMockAuthService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock config service
   * @returns {import('vitest').MockedObject<IConfigService>}
   */
  createMockConfigService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock storage service
   * @returns {import('vitest').MockedObject<IStorageService>}
   */
  createMockStorageService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock error service
   * @returns {import('vitest').MockedObject<IErrorService>}
   */
  createMockErrorService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock validation service
   * @returns {import('vitest').MockedObject<IValidationService>}
   */
  createMockValidationService() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock database client
   * @returns {import('vitest').MockedObject<IDatabaseClient>}
   */
  createMockDatabaseClient() {
    throw new Error('Method must be implemented');
  }

  /**
   * Create mock Chrome storage
   * @returns {import('vitest').MockedObject<ChromeStorage>}
   */
  createMockChromeStorage() {
    throw new Error('Method must be implemented');
  }
}

/**
 * Test data factory interface
 * @interface ITestDataFactory
 */
class ITestDataFactory {
  /**
   * Create test bookmark
   * @param {Partial<Bookmark>} [overrides]
   * @returns {Bookmark}
   */
  createBookmark(overrides) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create test new bookmark
   * @param {Partial<NewBookmark>} [overrides]
   * @returns {NewBookmark}
   */
  createNewBookmark(overrides) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create test user
   * @param {Partial<User>} [overrides]
   * @returns {User}
   */
  createUser(overrides) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create test session
   * @param {Partial<Session>} [overrides]
   * @returns {Session}
   */
  createSession(overrides) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create test status type
   * @param {Partial<StatusType>} [overrides]
   * @returns {StatusType}
   */
  createStatusType(overrides) {
    throw new Error('Method must be implemented');
  }

  /**
   * Create test Supabase config
   * @param {Partial<SupabaseConfig>} [overrides]
   * @returns {SupabaseConfig}
   */
  createSupabaseConfig(overrides) {
    throw new Error('Method must be implemented');
  }
}
```

## Implementation Examples

### Service Implementation

```javascript
import { IBookmarkService } from './interfaces/IBookmarkService.js';

/**
 * Concrete implementation of bookmark service
 * @implements {IBookmarkService}
 */
class BookmarkService extends IBookmarkService {
  /**
   * @param {IDatabaseClient} database
   * @param {IStorageService} storage
   * @param {IAuthService} auth
   * @param {IErrorService} error
   */
  constructor(database, storage, auth, error) {
    super();
    this.database = database;
    this.storage = storage;
    this.auth = auth;
    this.error = error;
  }
  
  /**
   * @param {NewBookmark} bookmark
   * @returns {Promise<Bookmark>}
   */
  async save(bookmark) {
    // Implementation following interface contract
    try {
      const userId = await this.auth.getUserId();
      const saved = await this.database.bookmarks.insert({
        ...bookmark,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      
      await this.storage.cacheBookmark(saved);
      return saved;
    } catch (error) {
      throw this.error.handle(error, 'BookmarkService.save');
    }
  }
  
  // ... other methods
}
```

### Controller Implementation

```javascript
import { IPopupController } from './interfaces/IPopupController.js';
import { BaseController } from './BaseController.js';

/**
 * Concrete implementation of popup controller
 * @extends BaseController
 * @implements {IPopupController}
 */
class PopupController extends BaseController {
  /**
   * @param {IBookmarkService} bookmarkService
   * @param {IAuthService} authService
   * @param {IErrorService} errorService
   */
  constructor(bookmarkService, authService, errorService) {
    super(errorService, null);
    this.bookmarkService = bookmarkService;
    this.authService = authService;
  }
  
  /**
   * @returns {Promise<void>}
   */
  async initialize() {
    // Implementation following interface contract
    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.showAuthInterface();
      return;
    }
    
    await this.loadCurrentPageInfo();
    await this.loadRecentBookmarks();
  }
  
  // ... other methods
}
```

### Testing Usage

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookmarkService } from '../services/BookmarkService.js';
import { MockFactory } from './MockFactory.js';

describe('BookmarkService', () => {
  /** @type {BookmarkService} */
  let service;
  /** @type {import('vitest').MockedObject<IDatabaseClient>} */
  let mockDatabase;
  /** @type {import('vitest').MockedObject<IStorageService>} */
  let mockStorage;
  
  beforeEach(() => {
    const mockFactory = new MockFactory();
    mockDatabase = mockFactory.createMockDatabaseClient();
    mockStorage = mockFactory.createMockStorageService();
    
    service = new BookmarkService(mockDatabase, mockStorage, /* ... */);
  });
  
  // Tests follow interface contracts
  it('should save bookmark successfully', async () => {
    /** @type {NewBookmark} */
    const newBookmark = {
      url: 'https://example.com',
      title: 'Test Page',
      status: 'read'
    };
    
    const result = await service.save(newBookmark);
    
    expect(result).toEqual(expect.objectContaining({
      url: 'https://example.com',
      title: 'Test Page'
    }));
  });
});
```

These JSDoc-based interfaces provide the same level of type safety and documentation as TypeScript interfaces while working directly with vanilla JavaScript and providing excellent VS Code IntelliSense support.