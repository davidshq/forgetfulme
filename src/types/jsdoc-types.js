/**
 * @fileoverview JSDoc type definitions for the ForgetfulMe extension
 */

/**
 * @typedef {Object} Bookmark
 * @property {string} id - Unique identifier
 * @property {string} url - Website URL
 * @property {string} title - Page title
 * @property {string} status - Current status (read, unread, etc.)
 * @property {string[]} tags - Associated tags
 * @property {string} notes - User notes
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 * @property {string} user_id - Owner user ID
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {Object} preferences - User preferences
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} StatusType
 * @property {string} id - Status ID
 * @property {string} name - Display name
 * @property {string} color - Color code
 * @property {string} icon - Icon identifier
 * @property {boolean} is_default - Whether this is the default status
 */

/**
 * @template T
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {T|null} data - Validated data if successful
 * @property {string[]} errors - Validation error messages
 */

/**
 * @template T
 * @typedef {Object} PaginatedResult
 * @property {T[]} items - Result items
 * @property {number} total - Total count
 * @property {number} page - Current page
 * @property {number} pageSize - Items per page
 * @property {boolean} hasMore - Whether more pages exist
 */

/**
 * @typedef {Object} BookmarkStats
 * @property {number} total - Total bookmarks
 * @property {Object<string, number>} byStatus - Count by status
 * @property {Object<string, number>} byTag - Count by tag
 * @property {number} thisWeek - Bookmarks added this week
 * @property {number} thisMonth - Bookmarks added this month
 */

/**
 * @typedef {Object} ErrorInfo
 * @property {'NETWORK'|'AUTH'|'VALIDATION'|'DATABASE'|'CONFIG'|'STORAGE'|'PERMISSION'|'UNKNOWN'} category - Error category
 * @property {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} severity - Error severity
 * @property {string} message - User-friendly message
 * @property {string} code - Error code
 * @property {boolean} retryable - Whether error can be retried
 * @property {string[]} actions - Suggested recovery actions
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string} query - Search query
 * @property {string[]} tags - Filter by tags
 * @property {string[]} statuses - Filter by statuses
 * @property {Date} dateFrom - Filter from date
 * @property {Date} dateTo - Filter to date
 * @property {string} sortBy - Sort field
 * @property {'asc'|'desc'} sortOrder - Sort direction
 * @property {number} page - Page number
 * @property {number} pageSize - Items per page
 */

export {};
