/**
 * @fileoverview Unit tests for ValidationService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../../src/services/ValidationService.js';

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.com',
        'email@subdomain.example.com',
        '123456789@example.com'
      ];

      validEmails.forEach(email => {
        const result = validationService.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(email.toLowerCase());
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@com',
        'test space@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validationService.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please enter a valid email address');
      });
    });

    it('should normalize email addresses to lowercase', () => {
      const result = validationService.validateEmail('Test.Email@EXAMPLE.COM');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('test.email@example.com');
    });
  });


  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path?query=value#fragment',
        'https://subdomain.example.co.uk',
        'https://example.com:8080/path',
        'ftp://files.example.com/file.txt'
      ];

      validUrls.forEach(url => {
        const result = validationService.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(url);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'http://',
        'https://',
        'example.com',
        'www.example.com',
        'javascript:alert("xss")'
      ];

      invalidUrls.forEach(url => {
        const result = validationService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Please enter a valid URL');
      });
    });

    it('should auto-prepend https:// to URLs without protocol', () => {
      const result = validationService.validateUrl('example.com', { autoProtocol: true });
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('https://example.com');
    });

    it('should validate against allowed protocols', () => {
      const result = validationService.validateUrl('ftp://example.com', { 
        allowedProtocols: ['http:', 'https:'] 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL protocol must be one of: http:, https:');
    });
  });

  describe('validateBookmarkData', () => {
    it('should validate complete bookmark data', () => {
      const bookmarkData = {
        url: 'https://example.com',
        title: 'Example Website',
        status: 'unread',
        tags: ['web', 'example'],
        notes: 'This is a test bookmark'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        url: 'https://example.com',
        title: 'Example Website',
        status: 'unread',
        tags: ['web', 'example'],
        description: 'This is a test bookmark'
      });
    });

    it('should require URL', () => {
      const bookmarkData = {
        title: 'Example Website'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    it('should validate URL format', () => {
      const bookmarkData = {
        url: 'invalid-url',
        title: 'Example Website'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid URL');
    });

    it('should set default title if not provided', () => {
      const bookmarkData = {
        url: 'https://example.com'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(true);
      expect(result.data.title).toBe('Untitled');
    });

    it('should set default status if not provided', () => {
      const bookmarkData = {
        url: 'https://example.com'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(true);
      expect(result.data.status).toBe('unread');
    });

    it('should validate status against allowed values', () => {
      const bookmarkData = {
        url: 'https://example.com',
        status: 'invalid-status'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Status must be one of: unread, reading, read, archived');
    });

    it('should validate tags array', () => {
      const bookmarkData = {
        url: 'https://example.com',
        tags: 'not-an-array'
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    it('should sanitize and filter tags', () => {
      const bookmarkData = {
        url: 'https://example.com',
        tags: ['  valid-tag  ', '', '   ', 'another-tag']
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(true);
      expect(result.data.tags).toEqual(['valid-tag', 'another-tag']);
    });

    it('should validate individual tag format', () => {
      const bookmarkData = {
        url: 'https://example.com',
        tags: ['valid-tag', 'invalid tag with spaces', 'valid123']
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tag "invalid tag with spaces" contains invalid characters. Use only letters, numbers, and hyphens.');
    });

    it('should limit notes length', () => {
      const longNotes = 'a'.repeat(5001);
      const bookmarkData = {
        url: 'https://example.com',
        notes: longNotes
      };

      const result = validationService.validateBookmarkData(bookmarkData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notes cannot exceed 5000 characters');
    });
  });

  describe('validateSearchOptions', () => {
    it('should validate basic search options', () => {
      const searchOptions = {
        query: 'example',
        statuses: ['read', 'unread'],
        tags: ['web'],
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31')
      };

      const result = validationService.validateSearchOptions(searchOptions);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(searchOptions);
    });

    it('should handle empty search options', () => {
      const result = validationService.validateSearchOptions({});
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate statuses array', () => {
      const searchOptions = {
        statuses: ['invalid-status']
      };

      const result = validationService.validateSearchOptions(searchOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status: "invalid-status". Must be one of: unread, reading, read, archived');
    });

    it('should validate date range', () => {
      const searchOptions = {
        dateFrom: new Date('2023-12-31'),
        dateTo: new Date('2023-01-01')
      };

      const result = validationService.validateSearchOptions(searchOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date from cannot be after date to');
    });

    it('should validate pagination options', () => {
      const searchOptions = {
        page: 0,
        pageSize: 500
      };

      const result = validationService.validateSearchOptions(searchOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page must be at least 1');
      expect(result.errors).toContain('Page size cannot exceed 100');
    });
  });


  describe('isValidTag', () => {
    it('should validate correct tag formats', () => {
      const validTags = ['web', 'example-site', 'tech123', 'a', 'very-long-tag-name'];
      
      validTags.forEach(tag => {
        expect(validationService.isValidTag(tag)).toBe(true);
      });
    });

    it('should reject invalid tag formats', () => {
      const invalidTags = ['', 'tag with spaces', 'tag@symbol', 'tag.dot', 'TAG', 'tag_underscore'];
      
      invalidTags.forEach(tag => {
        expect(validationService.isValidTag(tag)).toBe(false);
      });
    });
  });

});