/**
 * @fileoverview Configurable logging service for the ForgetfulMe extension
 */

import { TIME_CALCULATIONS } from '../utils/constants.js';

/**
 * Log levels in order of severity (higher number = more severe)
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

/**
 * Default logging configuration
 */
export const DEFAULT_LOG_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStoredLogs: 500,
  includeTimestamp: true,
  includeContext: true,
  includeStackTrace: false, // Only for ERROR and CRITICAL by default
  contextFilters: [], // Array of context patterns to include/exclude
  rateLimitMs: 0, // Minimum time between identical log messages (0 = disabled)
  persistDebounceMs: 1000 // Debounce time for storage persistence
};

/**
 * Configurable logging service with multiple output targets and filtering
 */
export class LoggingService {
  /**
   * @param {StorageService} [storageService] - Optional storage service for log persistence
   * @param {ErrorService} [errorService] - Optional error service for integration
   */
  constructor(storageService = null, errorService = null) {
    this.storageService = storageService;
    this.errorService = errorService;
    this.config = { ...DEFAULT_LOG_CONFIG };
    this.logBuffer = [];
    this.rateLimitCache = new Map();
    this.lastCacheCleanup = 0;
    this.persistTimeout = null;
    this.initialized = false;

    // Pre-processed filter arrays for performance
    this.processedIncludeFilters = [];
    this.processedExcludeFilters = [];

    // Rate-limited warning for invalid contexts
    this.lastInvalidContextWarning = 0;
    this.invalidContextWarningInterval = 5000; // 5 seconds
  }

  /**
   * Initialize logging service with configuration
   * @param {Object} [customConfig] - Custom logging configuration
   * @returns {Promise<void>}
   */
  async initialize(customConfig = {}) {
    try {
      // Load persisted configuration first
      let storedConfig = {};
      if (this.storageService) {
        const stored = await this.storageService.get('logConfig');
        if (stored) {
          storedConfig = stored;
        }
      }

      // Merge with priority: defaults → storedConfig → customConfig (runtime takes precedence)
      this.config = { ...DEFAULT_LOG_CONFIG, ...storedConfig, ...customConfig };

      // Load persisted logs if storage is available
      if (this.storageService && this.config.enableStorage) {
        const storedLogs = await this.storageService.get('logBuffer');
        if (Array.isArray(storedLogs)) {
          this.logBuffer = storedLogs.slice(-this.config.maxStoredLogs);
        }
      }

      this.initialized = true;
      this.processContextFilters(); // Process filters after config is set
      this.info('LoggingService', 'Logging service initialized', { config: this.config });
    } catch (error) {
      // Fallback to console if initialization fails
      console.error('[LoggingService] Failed to initialize:', error);
      this.initialized = true; // Allow operation with defaults
    }
  }

  /**
   * Update logging configuration
   * @param {Object} newConfig - New configuration options
   * @returns {Promise<void>}
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (this.storageService) {
      try {
        await this.storageService.set('logConfig', this.config);
      } catch (error) {
        console.error('[LoggingService] Failed to save config:', error);
      }
    }

    this.processContextFilters(); // Reprocess filters when config changes
    this.info('LoggingService', 'Configuration updated', { config: this.config });
  }

  /**
   * Log a debug message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  debug(context, message, data = null) {
    this.log(LOG_LEVELS.DEBUG, context, message, data);
  }

  /**
   * Log an info message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  info(context, message, data = null) {
    this.log(LOG_LEVELS.INFO, context, message, data);
  }

  /**
   * Log a warning message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  warn(context, message, data = null) {
    this.log(LOG_LEVELS.WARN, context, message, data);
  }

  /**
   * Log an error message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional data
   */
  error(context, message, error = null) {
    this.log(LOG_LEVELS.ERROR, context, message, error, true);
  }

  /**
   * Log a critical message
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional data
   */
  critical(context, message, error = null) {
    this.log(LOG_LEVELS.CRITICAL, context, message, error, true);
  }

  /**
   * Core logging method
   * @param {number} level - Log level
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   * @param {boolean} [includeStack] - Force include stack trace
   */
  log(level, context, message, data = null, includeStack = false) {
    if (!this.initialized) {
      // Fallback logging before initialization
      console.log(`[${context}] ${message}`, data);
      return;
    }

    // Check if this log level should be processed
    if (level < this.config.level) {
      return;
    }

    // Check context filters
    if (!this.shouldLogContext(context)) {
      return;
    }

    // Rate limiting check
    if (this.config.rateLimitMs > 0 && this.isRateLimited(context, message)) {
      return;
    }

    // Create log entry
    const logEntry = this.createLogEntry(level, context, message, data, includeStack);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // Store in buffer if enabled
    if (this.config.enableStorage) {
      this.storeLogEntry(logEntry);
    }

    // Integrate with ErrorService for ERROR and CRITICAL levels
    if (level >= LOG_LEVELS.ERROR && this.errorService && data instanceof Error) {
      try {
        this.errorService.handle(data, context);
      } catch (error) {
        console.error('[LoggingService] Failed to integrate with ErrorService:', error);
      }
    }
  }

  /**
   * Create a structured log entry
   * @param {number} level - Log level
   * @param {string} context - Context/component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {boolean} includeStack - Include stack trace
   * @returns {Object} Structured log entry
   */
  createLogEntry(level, context, message, data, includeStack) {
    const entry = {
      level,
      levelName: this.getLevelName(level),
      message
    };

    if (this.config.includeTimestamp) {
      entry.timestamp = new Date().toISOString();
    }

    if (this.config.includeContext) {
      entry.context = context;
    }

    if (data !== null) {
      if (data instanceof Error) {
        entry.error = {
          name: data.name,
          message: data.message
        };

        if (includeStack || this.config.includeStackTrace || level >= LOG_LEVELS.ERROR) {
          entry.error.stack = data.stack;
        }
      } else {
        entry.data = data;
      }
    }

    // Add stack trace for high severity logs
    if (
      (includeStack || this.config.includeStackTrace || level >= LOG_LEVELS.ERROR) &&
      !entry.error
    ) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  /**
   * Output log entry to console
   * @param {Object} logEntry - Log entry to output
   */
  outputToConsole(logEntry) {
    const { level, context, message, data, error } = logEntry;
    const prefix = context ? `[${context}]` : '';
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(fullMessage, data || error || '');
        break;
      case LOG_LEVELS.INFO:
        console.log(fullMessage, data || error || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(fullMessage, data || error || '');
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.CRITICAL:
        console.error(fullMessage, data || error || '');
        break;
      default:
        console.log(fullMessage, data || error || '');
    }
  }

  /**
   * Store log entry in buffer and optionally persist
   * @param {Object} logEntry - Log entry to store
   */
  storeLogEntry(logEntry) {
    this.logBuffer.push(logEntry);

    // Trim buffer if it exceeds max size
    if (this.logBuffer.length > this.config.maxStoredLogs) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxStoredLogs);
    }

    // Persist to storage (debounced to avoid excessive writes)
    if (this.storageService) {
      this.debouncedPersist();
    }
  }

  /**
   * Debounced persist function to avoid excessive storage writes
   */
  debouncedPersist() {
    clearTimeout(this.persistTimeout);
    this.persistTimeout = setTimeout(async () => {
      try {
        await this.storageService.set('logBuffer', this.logBuffer);
      } catch (error) {
        console.error('[LoggingService] Failed to persist logs:', error);
      }
    }, this.config.persistDebounceMs);
  }

  /**
   * Process and validate context filters for performance
   * Called during initialization and config updates
   */
  processContextFilters() {
    this.processedIncludeFilters = [];
    this.processedExcludeFilters = [];

    if (!this.config.contextFilters || this.config.contextFilters.length === 0) {
      return;
    }

    this.config.contextFilters.forEach(filter => {
      // Skip invalid filter values
      if (filter === null || filter === undefined || filter === '') {
        return;
      }

      if (typeof filter === 'string') {
        if (filter.startsWith('!') && filter.length > 1) {
          // Exclude pattern: "!pattern"
          this.processedExcludeFilters.push({
            type: 'string',
            pattern: filter.slice(1)
          });
        } else if (!filter.startsWith('!')) {
          // Include pattern: "pattern"
          this.processedIncludeFilters.push({
            type: 'string',
            pattern: filter
          });
        }
        // Skip "!" (just exclamation) and other invalid cases
      } else if (typeof filter === 'object' && filter.pattern !== undefined) {
        // Object pattern: { pattern: "...", exclude: true/false }
        let processedFilter = null;

        if (typeof filter.pattern === 'string' && filter.pattern.length > 0) {
          processedFilter = {
            type: 'string',
            pattern: filter.pattern
          };
        } else if (filter.pattern instanceof RegExp) {
          processedFilter = {
            type: 'regexp',
            pattern: filter.pattern
          };
        }
        // Skip invalid pattern types (null, numbers, objects, arrays, empty strings)

        if (processedFilter) {
          if (filter.exclude === true) {
            // Only boolean true triggers exclude
            this.processedExcludeFilters.push(processedFilter);
          } else {
            this.processedIncludeFilters.push(processedFilter);
          }
        }
      }
      // Skip objects without pattern property and other invalid types
    });
  }

  /**
   * Check if context should be logged based on pre-processed filters
   * @param {string} context - Context to check
   * @returns {boolean} Whether to log this context
   */
  shouldLogContext(context) {
    // Fast path: skip validation if context is string (99.99% of cases)
    if (typeof context === 'string') {
      // No filters means allow all
      if (this.processedIncludeFilters.length === 0 && this.processedExcludeFilters.length === 0) {
        return true;
      }
    } else {
      // Slow path: handle invalid context with rate-limited warning
      const now = Date.now();
      if (now - this.lastInvalidContextWarning > this.invalidContextWarningInterval) {
        console.warn(
          '[LoggingService] Context must be a string, received:',
          typeof context,
          '(further warnings suppressed for 5s)'
        );
        this.lastInvalidContextWarning = now;
      }
      return false; // Reject non-string contexts
    }

    // Check exclude filters first (if any match, exclude)
    const isExcluded = this.processedExcludeFilters.some(filter => {
      if (filter.type === 'string') {
        return context.includes(filter.pattern);
      } else if (filter.type === 'regexp') {
        try {
          return filter.pattern.test(context);
        } catch (error) {
          // Handle edge cases with malformed RegExp
          console.warn('[LoggingService] RegExp test failed:', filter.pattern, error);
          return false;
        }
      }
      return false;
    });

    if (isExcluded) return false;

    // If no include filters, allow all (except excluded)
    if (this.processedIncludeFilters.length === 0) return true;

    // Check include filters (at least one must match)
    return this.processedIncludeFilters.some(filter => {
      if (filter.type === 'string') {
        return context.includes(filter.pattern);
      } else if (filter.type === 'regexp') {
        try {
          return filter.pattern.test(context);
        } catch (error) {
          // Handle edge cases with malformed RegExp
          console.warn('[LoggingService] RegExp test failed:', filter.pattern, error);
          return false;
        }
      }
      return false;
    });
  }

  /**
   * Check if a log message is rate limited
   * @param {string} context - Context
   * @param {string} message - Message
   * @returns {boolean} Whether the message is rate limited
   */
  isRateLimited(context, message) {
    // Skip rate limiting entirely if disabled
    if (this.config.rateLimitMs <= 0) {
      return false;
    }

    const key = `${context}:${message}`;
    const now = Date.now();
    const lastLog = this.rateLimitCache.get(key);

    if (!lastLog || now - lastLog >= this.config.rateLimitMs) {
      this.rateLimitCache.set(key, now);

      // Clean up old entries to prevent memory leak
      this.cleanupRateLimitCache(now);
      return false;
    }

    return true;
  }

  /**
   * Clean up old rate limit cache entries to prevent memory leaks
   * @param {number} now - Current timestamp
   */
  cleanupRateLimitCache(now) {
    // Skip cleanup if rate limiting is disabled
    if (this.config.rateLimitMs <= 0) {
      return;
    }

    // Only cleanup occasionally to avoid performance impact
    if (!this.lastCacheCleanup || now - this.lastCacheCleanup > 60000) {
      // 1 minute
      const cutoff = now - Math.max(this.config.rateLimitMs * 2, 60000); // Keep entries for at least 1 minute
      for (const [key, timestamp] of this.rateLimitCache.entries()) {
        if (timestamp < cutoff) {
          this.rateLimitCache.delete(key);
        }
      }
      this.lastCacheCleanup = now;
    }
  }

  /**
   * Get human-readable level name
   * @param {number} level - Log level
   * @returns {string} Level name
   */
  getLevelName(level) {
    const levelNames = Object.keys(LOG_LEVELS);
    return levelNames.find(name => LOG_LEVELS[name] === level) || 'UNKNOWN';
  }

  /**
   * Get recent log entries
   * @param {number} [limit=50] - Number of entries to return
   * @param {number} [minLevel] - Minimum log level to include
   * @returns {Array} Recent log entries
   */
  getRecentLogs(limit = 50, minLevel = null) {
    let logs = this.logBuffer;

    if (minLevel !== null) {
      logs = logs.filter(entry => entry.level >= minLevel);
    }

    return logs.slice(-limit);
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getLogStats() {
    const stats = {
      total: this.logBuffer.length,
      byLevel: {},
      byContext: {},
      recent24h: 0
    };

    const oneDayAgo = new Date(Date.now() - TIME_CALCULATIONS.MILLISECONDS_PER_DAY);

    this.logBuffer.forEach(entry => {
      // Count by level
      const levelName = entry.levelName || this.getLevelName(entry.level);
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

      // Count by context
      if (entry.context) {
        stats.byContext[entry.context] = (stats.byContext[entry.context] || 0) + 1;
      }

      // Count recent logs
      if (entry.timestamp && new Date(entry.timestamp) > oneDayAgo) {
        stats.recent24h++;
      }
    });

    return stats;
  }

  /**
   * Clear log buffer
   * @returns {Promise<void>}
   */
  async clearLogs() {
    this.logBuffer = [];

    if (this.storageService) {
      try {
        await this.storageService.remove('logBuffer');
      } catch (error) {
        console.error('[LoggingService] Failed to clear persisted logs:', error);
      }
    }

    this.info('LoggingService', 'Log buffer cleared');
  }

  /**
   * Export logs as JSON
   * @param {Object} [options] - Export options
   * @returns {string} JSON string of logs
   */
  exportLogs(options = {}) {
    const { minLevel = null, maxEntries = null, includeConfig = false } = options;

    let logs = this.logBuffer;

    if (minLevel !== null) {
      logs = logs.filter(entry => entry.level >= minLevel);
    }

    if (maxEntries !== null) {
      logs = logs.slice(-maxEntries);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
      logs
    };

    if (includeConfig) {
      exportData.config = this.config;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clean up resources when service is destroyed
   */
  destroy() {
    // Clear any pending persist timeout
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
      this.persistTimeout = null;
    }

    // Clear rate limit cache
    this.rateLimitCache.clear();

    // Clear log buffer
    this.logBuffer = [];

    this.initialized = false;
  }
}
