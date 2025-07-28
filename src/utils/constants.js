/**
 * @fileoverview Application constants for the ForgetfulMe extension
 */

export const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  USER_PREFERENCES: 'user_preferences',
  SUPABASE_CONFIG: 'supabase_config',
  BOOKMARK_CACHE: 'bookmark_cache',
  STATUS_TYPES: 'status_types',
  LAST_SYNC: 'last_sync'
};

export const ERROR_CATEGORIES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  CONFIG: 'CONFIG',
  STORAGE: 'STORAGE',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN'
};

export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const DEFAULT_STATUS_TYPES = [
  {
    id: 'read',
    name: 'Read',
    color: '#22c55e',
    icon: 'check',
    is_default: true
  },
  {
    id: 'unread',
    name: 'Unread',
    color: '#6b7280',
    icon: 'circle',
    is_default: false
  },
  {
    id: 'reading',
    name: 'Reading',
    color: '#f59e0b',
    icon: 'book-open',
    is_default: false
  },
  {
    id: 'important',
    name: 'Important',
    color: '#ef4444',
    icon: 'star',
    is_default: false
  }
];

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100
};

export const VALIDATION_RULES = {
  URL_MAX_LENGTH: 2048,
  TITLE_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 2000,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_BOOKMARK: 10,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

export const CACHE_DURATION = {
  BOOKMARKS: 5 * 60 * 1000, // 5 minutes
  STATUS_TYPES: 60 * 60 * 1000, // 1 hour
  USER_PROFILE: 30 * 60 * 1000 // 30 minutes
};

export const SYNC_INTERVALS = {
  FAST: 30 * 1000, // 30 seconds
  NORMAL: 5 * 60 * 1000, // 5 minutes
  SLOW: 30 * 60 * 1000 // 30 minutes
};

export const MESSAGES = {
  BOOKMARK_SAVED: 'Bookmark saved successfully',
  BOOKMARK_UPDATED: 'Bookmark updated successfully',
  BOOKMARK_DELETED: 'Bookmark deleted successfully',
  SYNC_COMPLETE: 'Sync completed',
  AUTH_REQUIRED: 'Please sign in to continue',
  CONNECTION_ERROR: 'Connection error - please try again',
  VALIDATION_ERROR: 'Please check your input and try again'
};
