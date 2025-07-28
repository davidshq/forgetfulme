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
   * @returns {ValidationResult<string>} Validation result with normalized URL
   */
  validateUrl(url) {
    const errors = [];

    if (!url || typeof url !== 'string') {
      errors.push('URL is required');
      return { isValid: false, data: null, errors };
    }

    const trimmed = url.trim();
    if (!trimmed) {
      errors.push('URL cannot be empty');
      return { isValid: false, data: null, errors };
    }

    if (trimmed.length > VALIDATION_RULES.URL_MAX_LENGTH) {
      errors.push(`URL cannot exceed ${VALIDATION_RULES.URL_MAX_LENGTH} characters`);
      return { isValid: false, data: null, errors };
    }

    try {
      // Add protocol if missing
      let normalizedUrl = trimmed;
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const urlObj = new URL(normalizedUrl);

      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are supported');
        return { isValid: false, data: null, errors };
      }

      // Check for valid hostname
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        errors.push('Invalid URL format');
        return { isValid: false, data: null, errors };
      }

      return { isValid: true, data: normalizedUrl, errors: [] };
    } catch (error) {
      errors.push('Invalid URL format');
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

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { isValid: false, data: null, errors };
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      errors.push('Email cannot be empty');
      return { isValid: false, data: null, errors };
    }

    if (!VALIDATION_RULES.EMAIL_REGEX.test(trimmed)) {
      errors.push('Invalid email format');
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

    // Validate URL (required)
    const urlResult = this.validateUrl(bookmarkData.url);
    if (!urlResult.isValid) {
      errors.push(...urlResult.errors);
    } else {
      validatedData.url = urlResult.data;
    }

    // Validate title (optional)
    const titleResult = this.validateTitle(bookmarkData.title);
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors);
    } else {
      validatedData.title = titleResult.data;
    }

    // Validate notes (optional)
    const notesResult = this.validateNotes(bookmarkData.notes);
    if (!notesResult.isValid) {
      errors.push(...notesResult.errors);
    } else {
      validatedData.notes = notesResult.data;
    }

    // Validate tags (optional)
    const tagsResult = this.validateTags(bookmarkData.tags);
    if (!tagsResult.isValid) {
      errors.push(...tagsResult.errors);
    } else {
      validatedData.tags = tagsResult.data;
    }

    // Validate status (optional, defaults to 'unread')
    if (bookmarkData.status) {
      const statusResult = this.validateStatus(bookmarkData.status, validStatuses);
      if (!statusResult.isValid) {
        errors.push(...statusResult.errors);
      } else {
        validatedData.status = statusResult.data;
      }
    } else {
      validatedData.status = 'unread';
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedData : null,
      errors
    };
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

    // Validate query
    if (searchOptions.query !== undefined) {
      if (typeof searchOptions.query !== 'string') {
        errors.push('Search query must be a string');
      } else {
        validatedOptions.query = this.sanitizeString(searchOptions.query);
      }
    }

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
      if (!Array.isArray(searchOptions.statuses)) {
        errors.push('Statuses filter must be an array');
      } else {
        const validStatuses = [];
        for (const status of searchOptions.statuses) {
          if (typeof status === 'string') {
            validStatuses.push(status.trim().toLowerCase());
          }
        }
        validatedOptions.statuses = validStatuses;
      }
    }

    // Validate date filters
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

    // Validate pagination
    if (searchOptions.page !== undefined) {
      const page = parseInt(searchOptions.page, 10);
      if (isNaN(page) || page < 1) {
        errors.push('Page must be a positive integer');
      } else {
        validatedOptions.page = page;
      }
    }

    if (searchOptions.pageSize !== undefined) {
      const pageSize = parseInt(searchOptions.pageSize, 10);
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        errors.push('Page size must be between 1 and 100');
      } else {
        validatedOptions.pageSize = pageSize;
      }
    }

    // Validate sort options
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

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? validatedOptions : null,
      errors
    };
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
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
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

    // Validate Supabase URL
    if (config.supabaseUrl) {
      const urlResult = this.validateUrl(config.supabaseUrl);
      if (!urlResult.isValid) {
        errors.push('Invalid Supabase URL');
      } else {
        validatedConfig.supabaseUrl = urlResult.data;
      }
    }

    // Validate API key (basic format check)
    if (config.supabaseAnonKey) {
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
}
