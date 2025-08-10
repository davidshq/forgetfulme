/**
 * @fileoverview Unit tests for formatting utilities
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { formatDate, formatUrl } from '../../../src/utils/formatting.js';

describe('utils/formatting', () => {
  const fixedNow = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should return empty string for invalid input', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('not-a-date')).toBe('');
    });

    it('should format relative times within minutes/hours/days', () => {
      expect(formatDate(new Date(fixedNow.getTime() - 30 * 1000), 'relative')).toBe('Just now');
      expect(formatDate(new Date(fixedNow.getTime() - 5 * 60 * 1000), 'relative')).toBe('5m ago');
      expect(formatDate(new Date(fixedNow.getTime() - 3 * 60 * 60 * 1000), 'relative')).toBe('3h ago');
      expect(formatDate(new Date(fixedNow.getTime() - 7 * 24 * 60 * 60 * 1000), 'relative')).toBe('7d ago');
    });

    it('should handle short and long formats without throwing', () => {
      const d = new Date('2023-12-25T10:00:00Z');
      expect(typeof formatDate(d, 'short')).toBe('string');
      expect(typeof formatDate(d, 'long')).toBe('string');
    });
  });

  describe('formatUrl', () => {
    it('should format URL by stripping protocol and www', () => {
      const u = 'https://www.example.com/path/to/page';
      expect(formatUrl(u)).toBe('example.com/path/to/page');
    });

    it('should truncate long URLs', () => {
      const u = 'https://www.example.com/very/long/path/that/should/be/truncated';
      const result = formatUrl(u, 20);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBe(20);
    });

    it('should handle invalid URLs gracefully', () => {
      const result = formatUrl('not a url', 10);
      // For invalid URLs, function truncates input when longer than maxLength; here length is 9 so no truncation
      expect(result).toBe('not a url');
    });
  });
});


