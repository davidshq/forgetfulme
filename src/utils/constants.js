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
  NOTES_MAX_LENGTH: 5000,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_BOOKMARK: 10,
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
};

export const CACHE_DURATION = {
  BOOKMARKS: 5 * 60 * 1000, // 5 minutes
  STATUS_TYPES: 60 * 60 * 1000, // 1 hour
  USER_PROFILE: 30 * 60 * 1000 // 30 minutes
};

export const TIMEOUTS = {
  MESSAGE_DEFAULT: 5000, // 5 seconds
  MESSAGE_SUCCESS: 3000, // 3 seconds
  MESSAGE_WARNING: 5000, // 5 seconds
  MESSAGE_INFO: 5000, // 5 seconds
  BACKGROUND_BADGE_UPDATE: 5000, // 5 seconds
  AUTH_TOKEN_REFRESH: 10000, // 10 seconds
  TEST_TIMEOUT: 10000, // 10 seconds
  PERFORMANCE_RENDER_MAX: 1000, // 1 second
  PERFORMANCE_SEARCH_MAX: 500, // 500ms
  PERFORMANCE_BULK_MAX: 3000, // 3 seconds
  ERROR_RETRY_DELAY: 2500 // 2.5 seconds
};

export const TIME_CALCULATIONS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_HOUR: 3600,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_MONTH: 30 * 24 * 60 * 60 * 1000
};

export const SERVER_CONFIG = {
  DEV_PORT: 3000
};

export const HTTP_STATUS = {
  INTERNAL_SERVER_ERROR: 500
};
