/**
 * @fileoverview Input validation and data sanitization service
 */

import { VALIDATION_RULES } from '../utils/constants.js';

/**
 * Service for validating and sanitizing user input
 */
export class ValidationService {
  /**
   * Validate URL format and accessibility
   * @param {string} url - URL to validate
   * @param {Object} [options] - Validation options
   * @param {boolean} [options.autoProtocol] - Auto-prepend https:// if missing
   * @param {string[]} [options.allowedProtocols] - List of allowed protocols
   * @returns {ValidationResult<string>} Validation result with normalized URL
   */
  validateUrl(url, options = {}) {
    const errors = [];

    if (!url || typeof url !== 'string') {
      errors.push('Please enter a valid URL');
      return { isValid: false, data: null, errors };
    }

    const trimmed = url.trim();
    if (!trimmed) {
      errors.push('Please enter a valid URL');
      return { isValid: false, data: null, errors };
    }

    if (trimmed.length > VALIDATION_RULES.URL_MAX_LENGTH) {
      errors.push(`URL cannot exceed ${VALIDATION_RULES.URL_MAX_LENGTH} characters`);
      return { isValid: false, data: null, errors };
    }

    try {
      // Add protocol if missing and autoProtocol is true
      let normalizedUrl = trimmed;
      if (options.autoProtocol && !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(normalizedUrl)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const urlObj = new URL(normalizedUrl);

      // Check for allowed protocols if specified
      if (options.allowedProtocols) {
        if (!options.allowedProtocols.includes(urlObj.protocol)) {
          errors.push(`URL protocol must be one of: ${options.allowedProtocols.join(', ')}`);
          return { isValid: false, data: null, errors };
        }
      } else {
        // Default protocol check
        if (!['http:', 'https:', 'ftp:'].includes(urlObj.protocol)) {
          errors.push('Please enter a valid URL');
          return { isValid: false, data: null, errors };
        }
      }

      // Check for valid hostname
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        errors.push('Please enter a valid URL');
        return { isValid: false, data: null, errors };
      }

      return { isValid: true, data: normalizedUrl, errors: [] };
    } catch (error) {
      errors.push('Please enter a valid URL');
      return { isValid: false, data: null, errors };
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {ValidationResult<string>} Validation result with normalized email
   */
  validateEmail(email) {
    const errors = [];

    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.push('Please enter a valid email address');
      return { isValid: false, data: null, errors };
    }

    const trimmed = email.trim().toLowerCase();

    if (!VALIDATION_RULES.EMAIL_REGEX.test(trimmed) || trimmed.includes('..')) {
      errors.push('Please enter a valid email address');
      return { isValid: false, data: null, errors };
    }

    return { isValid: true, data: trimmed, errors: [] };
  }

  /**
   * Validate bookmark title
   * @param {string} title - Title to validate
   * @returns {ValidationResult<string>} Validation result with sanitized title
   */
  validateTitle(title) {
    const errors = [];

    if (!title || typeof title !== 'string') {
      return { isValid: true, data: '', errors: [] }; // Title is optional
    }

    const sanitized = this.sanitizeString(title);

    if (sanitized.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
      errors.push(`Title cannot exceed ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`);
      return { isValid: false, data: null, errors };
    }

    return { isValid: true, data: sanitized, errors: [] };
  }

  /**
   * Validate bookmark notes
   * @param {string} notes - Notes to validate
   * @returns {ValidationResult<string>} Validation result with sanitized notes
   */
  validateNotes(notes) {
    const errors = [];

    if (!notes || typeof notes !== 'string') {
      return { isValid: true, data: '', errors: [] }; // Notes are optional
    }

    const sanitized = this.sanitizeString(notes);

    if (sanitized.length > VALIDATION_RULES.NOTES_MAX_LENGTH) {
      errors.push(`Notes cannot exceed ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`);
      return { isValid: false, data: null, errors };
    }

    return { isValid: true, data: sanitized, errors: [] };
  }

  /**
   * Validate and normalize tags array
   * @param {string|string[]} tags - Tags to validate
   * @returns {ValidationResult<string[]>} Validation result with normalized tags
   */
  validateTags(tags) {
    const errors = [];

    if (!tags) {
      return { isValid: true, data: [], errors: [] };
    }

    let tagArray;
    if (typeof tags === 'string') {
      // Split string by comma, semicolon, or space
      tagArray = tags.split(/[,;\s]+/).filter(tag => tag.trim().length > 0);
    } else if (Array.isArray(tags)) {
      tagArray = tags.filter(tag => tag && typeof tag === 'string');
    } else {
      errors.push('Tags must be a string or array');
      return { isValid: false, data: null, errors };
    }

    if (tagArray.length > VALIDATION_RULES.MAX_TAGS_PER_BOOKMARK) {
      errors.push(`Cannot have more than ${VALIDATION_RULES.MAX_TAGS_PER_BOOKMARK} tags`);
      return { isValid: false, data: null, errors };
    }

    const normalizedTags = [];
    const seenTags = new Set();

    for (const tag of tagArray) {
      const sanitized = this.sanitizeString(tag).toLowerCase();

      if (!sanitized) continue;

      if (sanitized.length > VALIDATION_RULES.TAG_MAX_LENGTH) {
        errors.push(`Tag "${sanitized}" exceeds ${VALIDATION_RULES.TAG_MAX_LENGTH} characters`);
        continue;
      }

      // Validate tag format
      if (!this.isValidTag(sanitized)) {
        errors.push(
          `Tag "${tag}" contains invalid characters. Use only letters, numbers, and hyphens.`
        );
        continue;
      }

      // Remove duplicates (case-insensitive)
      if (!seenTags.has(sanitized)) {
        seenTags.add(sanitized);
        normalizedTags.push(sanitized);
      }
    }

    return { isValid: errors.length === 0, data: normalizedTags, errors };
  }

  /**
   * Validate bookmark status
   * @param {string} status - Status to validate
   * @param {string[]} validStatuses - Array of valid status values
   * @returns {ValidationResult<string>} Validation result
   */
  validateStatus(status, validStatuses = ['read', 'unread', 'reading', 'important']) {
    const errors = [];

    if (!status || typeof status !== 'string') {
      errors.push('Status is required');
      return { isValid: false, data: null, errors };
    }

    const normalized = status.trim().toLowerCase();

    if (!validStatuses.includes(normalized)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      return { isValid: false, data: null, errors };
    }

    return { isValid: true, data: normalized, errors: [] };
  }

  /**
   * Validate complete bookmark data
   * @param {Object} bookmarkData - Bookmark data to validate
   * @param {string[]} [validStatuses] - Valid status values
   * @returns {ValidationResult<Object>} Validation result with sanitized data
   */
  validateBookmark(bookmarkData, validStatuses) {
    const errors = [];
    const validatedData = {};

    if (!bookmarkData || typeof bookmarkData !== 'object') {
      errors.push('Invalid bookmark data');
      return { isValid: false, data: null, errors };
    }

    // Validate required and optional fields
    this.validateBookmarkUrl(bookmarkData, validatedData, errors);
    this.validateBookmarkTitle(bookmarkData, validatedData, errors);
    this.validateBookmarkDescription(bookmarkData, validatedData, errors);
    this.validateBookmarkTags(bookmarkData, validatedData, errors);
    this.validateBookmarkStatus(bookmarkData, validatedData, errors, validStatuses);

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedData : null,
      errors
    };
  }

  /**
   * Validate bookmark URL field
   * @param {Object} bookmarkData - Source data
   * @param {Object} validatedData - Target validated data
   * @param {string[]} errors - Errors array
   */
  validateBookmarkUrl(bookmarkData, validatedData, errors) {
    if (!bookmarkData.url) {
      errors.push('URL is required');
    } else {
      const urlResult = this.validateUrl(bookmarkData.url);
      if (!urlResult.isValid) {
        errors.push(...urlResult.errors);
      } else {
        validatedData.url = urlResult.data;
      }
    }
  }

  /**
   * Validate bookmark title field
   * @param {Object} bookmarkData - Source data
   * @param {Object} validatedData - Target validated data
   * @param {string[]} errors - Errors array
   */
  validateBookmarkTitle(bookmarkData, validatedData, errors) {
    const titleResult = this.validateTitle(bookmarkData.title);
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors);
    } else {
      validatedData.title = titleResult.data || 'Untitled';
    }
  }

  /**
   * Validate bookmark description field
   * @param {Object} bookmarkData - Source data
   * @param {Object} validatedData - Target validated data
   * @param {string[]} errors - Errors array
   */
  validateBookmarkDescription(bookmarkData, validatedData, errors) {
    const descriptionResult = this.validateNotes(bookmarkData.description || bookmarkData.notes);
    if (!descriptionResult.isValid) {
      errors.push(...descriptionResult.errors);
    } else {
      validatedData.description = descriptionResult.data;
    }
  }

  /**
   * Validate bookmark tags field
   * @param {Object} bookmarkData - Source data
   * @param {Object} validatedData - Target validated data
   * @param {string[]} errors - Errors array
   */
  validateBookmarkTags(bookmarkData, validatedData, errors) {
    if (bookmarkData.tags !== undefined) {
      if (!Array.isArray(bookmarkData.tags)) {
        errors.push('Tags must be an array');
      } else {
        const tagsResult = this.validateTags(bookmarkData.tags);
        if (!tagsResult.isValid) {
          errors.push(...tagsResult.errors);
        } else {
          validatedData.tags = tagsResult.data;
        }
      }
    } else {
      validatedData.tags = [];
    }
  }

  /**
   * Validate bookmark status field
   * @param {Object} bookmarkData - Source data
   * @param {Object} validatedData - Target validated data
   * @param {string[]} errors - Errors array
   * @param {string[]} [validStatuses] - Valid status values
   */
  validateBookmarkStatus(bookmarkData, validatedData, errors, validStatuses) {
    if (bookmarkData.status) {
      const statusResult = this.validateStatus(
        bookmarkData.status,
        validStatuses || ['unread', 'reading', 'read', 'archived']
      );
      if (!statusResult.isValid) {
        errors.push(...statusResult.errors);
      } else {
        validatedData.status = statusResult.data;
      }
    } else {
      validatedData.status = 'unread';
    }
  }

  /**
   * Validate search options
   * @param {Object} searchOptions - Search options to validate
   * @returns {ValidationResult<Object>} Validation result
   */
  validateSearchOptions(searchOptions) {
    const errors = [];
    const validatedOptions = {};

    if (!searchOptions || typeof searchOptions !== 'object') {
      return { isValid: true, data: {}, errors: [] };
    }

    // Validate individual search option groups
    this.validateSearchQuery(searchOptions, validatedOptions, errors);
    this.validateSearchFilters(searchOptions, validatedOptions, errors);
    this.validateSearchDates(searchOptions, validatedOptions, errors);
    this.validateSearchPagination(searchOptions, validatedOptions, errors);
    this.validateSearchSorting(searchOptions, validatedOptions, errors);

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedOptions : null,
      errors
    };
  }

  /**
   * Validate search query
   * @param {Object} searchOptions - Search options
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateSearchQuery(searchOptions, validatedOptions, errors) {
    if (searchOptions.query !== undefined) {
      if (typeof searchOptions.query !== 'string') {
        errors.push('Search query must be a string');
      } else {
        validatedOptions.query = this.sanitizeString(searchOptions.query);
      }
    }
  }

  /**
   * Validate search filters (tags and statuses)
   * @param {Object} searchOptions - Search options
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateSearchFilters(searchOptions, validatedOptions, errors) {
    // Validate tags filter
    if (searchOptions.tags !== undefined) {
      const tagsResult = this.validateTags(searchOptions.tags);
      if (!tagsResult.isValid) {
        errors.push(...tagsResult.errors.map(error => `Tags filter: ${error}`));
      } else {
        validatedOptions.tags = tagsResult.data;
      }
    }

    // Validate statuses filter
    if (searchOptions.statuses !== undefined) {
      this.validateStatusesFilter(searchOptions.statuses, validatedOptions, errors);
    }
  }

  /**
   * Validate statuses filter
   * @param {any} statuses - Statuses to validate
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateStatusesFilter(statuses, validatedOptions, errors) {
    if (!Array.isArray(statuses)) {
      errors.push('Statuses filter must be an array');
    } else {
      const validStatuses = [];
      const allowedStatuses = ['unread', 'reading', 'read', 'archived'];
      for (const status of statuses) {
        if (typeof status === 'string') {
          const normalized = status.trim().toLowerCase();
          if (!allowedStatuses.includes(normalized)) {
            errors.push(`Invalid status: ${status}`);
          } else {
            validStatuses.push(normalized);
          }
        }
      }
      validatedOptions.statuses = validStatuses;
    }
  }

  /**
   * Validate search date filters
   * @param {Object} searchOptions - Search options
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateSearchDates(searchOptions, validatedOptions, errors) {
    // Validate individual date fields
    ['dateFrom', 'dateTo'].forEach(dateField => {
      if (searchOptions[dateField] !== undefined) {
        const date = new Date(searchOptions[dateField]);
        if (isNaN(date.getTime())) {
          errors.push(`${dateField} must be a valid date`);
        } else {
          validatedOptions[dateField] = date;
        }
      }
    });

    // Validate date range logic
    if (
      validatedOptions.dateFrom &&
      validatedOptions.dateTo &&
      validatedOptions.dateFrom > validatedOptions.dateTo
    ) {
      errors.push('Date from cannot be after date to');
    }
  }

  /**
   * Validate search pagination
   * @param {Object} searchOptions - Search options
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateSearchPagination(searchOptions, validatedOptions, errors) {
    if (searchOptions.page !== undefined) {
      const page = parseInt(searchOptions.page, 10);
      if (isNaN(page) || page < 1) {
        errors.push('Page must be at least 1');
      } else {
        validatedOptions.page = page;
      }
    }

    if (searchOptions.pageSize !== undefined) {
      const pageSize = parseInt(searchOptions.pageSize, 10);
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        errors.push('Page size cannot exceed 100');
      } else {
        validatedOptions.pageSize = pageSize;
      }
    }
  }

  /**
   * Validate search sorting options
   * @param {Object} searchOptions - Search options
   * @param {Object} validatedOptions - Target validated options
   * @param {string[]} errors - Errors array
   */
  validateSearchSorting(searchOptions, validatedOptions, errors) {
    if (searchOptions.sortBy !== undefined) {
      const validSortFields = ['created_at', 'updated_at', 'title', 'url'];
      if (!validSortFields.includes(searchOptions.sortBy)) {
        errors.push(`Sort field must be one of: ${validSortFields.join(', ')}`);
      } else {
        validatedOptions.sortBy = searchOptions.sortBy;
      }
    }

    if (searchOptions.sortOrder !== undefined) {
      if (!['asc', 'desc'].includes(searchOptions.sortOrder)) {
        errors.push('Sort order must be "asc" or "desc"');
      } else {
        validatedOptions.sortOrder = searchOptions.sortOrder;
      }
    }
  }

  /**
   * Sanitize string input to prevent XSS and normalize whitespace
   * @param {string} input - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .replace(/url\s*\(/gi, '') // Remove CSS url() references
      .replace(/&lt;|&gt;|&quot;|&#x27;|&#x2F;/g, match => {
        // Decode common HTML entities that could be used to bypass filtering
        const entityMap = {
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#x27;': "'",
          '&#x2F;': '/'
        };
        return entityMap[match] || match;
      })
      .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags after entity decoding
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @returns {ValidationResult<Object>} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const validatedConfig = {};

    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { isValid: false, data: null, errors };
    }

    // Validate Supabase URL (required)
    if (!config.supabaseUrl) {
      errors.push('Supabase URL is required');
    } else {
      const urlResult = this.validateUrl(config.supabaseUrl);
      if (!urlResult.isValid) {
        errors.push('Invalid Supabase URL');
      } else {
        validatedConfig.supabaseUrl = urlResult.data;
      }
    }

    // Validate API key (required)
    if (!config.supabaseAnonKey) {
      errors.push('Supabase API key is required');
    } else {
      if (typeof config.supabaseAnonKey !== 'string' || config.supabaseAnonKey.length < 20) {
        errors.push('Invalid Supabase API key format');
      } else {
        validatedConfig.supabaseAnonKey = config.supabaseAnonKey.trim();
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedConfig : null,
      errors
    };
  }

  /**
   * Validate status type object
   * @param {Object} statusType - Status type to validate
   * @returns {ValidationResult<Object>} Validation result
   */
  validateStatusType(statusType) {
    const errors = [];
    const validatedType = {};

    if (!statusType || typeof statusType !== 'object') {
      errors.push('Status type must be an object');
      return { isValid: false, data: null, errors };
    }

    // Validate ID
    if (!statusType.id || typeof statusType.id !== 'string' || !statusType.id.trim()) {
      errors.push('Status type ID is required');
    } else {
      validatedType.id = statusType.id.trim().toLowerCase();
    }

    // Validate name
    if (!statusType.name || typeof statusType.name !== 'string' || !statusType.name.trim()) {
      errors.push('Status type name is required');
    } else {
      validatedType.name = this.sanitizeString(statusType.name);
    }

    // Validate color
    if (!statusType.color || typeof statusType.color !== 'string') {
      errors.push('Status type color is required');
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(statusType.color)) {
      errors.push('Status type color must be a valid hex color');
    } else {
      validatedType.color = statusType.color.toLowerCase();
    }

    // Validate icon (optional)
    if (statusType.icon && typeof statusType.icon !== 'string') {
      errors.push('Status type icon must be a string');
    } else if (!statusType.icon) {
      errors.push('Status type icon is required');
    } else {
      validatedType.icon = statusType.icon.trim();
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedType : null,
      errors
    };
  }

  /**
   * Add alias method for backward compatibility
   * @param {Object} bookmarkData - Bookmark data to validate
   * @param {string[]} [validStatuses] - Valid status values
   * @returns {ValidationResult<Object>} Validation result with sanitized data
   */
  validateBookmarkData(bookmarkData, validStatuses) {
    return this.validateBookmark(bookmarkData, validStatuses);
  }

  /**
   * Check if a tag format is valid
   * @param {string} tag - Tag to validate
   * @returns {boolean} True if valid
   */
  isValidTag(tag) {
    if (!tag || typeof tag !== 'string') {
      return false;
    }
    // Tags must be lowercase, alphanumeric with hyphens only
    return /^[a-z0-9-]+$/.test(tag);
  }
}
