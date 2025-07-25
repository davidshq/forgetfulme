import { describe, it, expect } from 'vitest';
import { formatStatus, formatTime } from '../../utils/formatters.js';

/**
 * @fileoverview Unit tests for shared formatters module
 * @module formatters.test
 * @description Tests for the centralized formatting utilities used across the extension
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

describe('Formatters', () => {
  describe('formatStatus', () => {
    it('should format status strings correctly', () => {
      expect(formatStatus('good-reference')).toBe('Good Reference');
      expect(formatStatus('low-value')).toBe('Low Value');
      expect(formatStatus('revisit-later')).toBe('Revisit Later');
      expect(formatStatus('read')).toBe('Read');
      expect(formatStatus('unread')).toBe('Unread');
    });

    it('should handle single word statuses', () => {
      expect(formatStatus('read')).toBe('Read');
      expect(formatStatus('unread')).toBe('Unread');
      expect(formatStatus('archived')).toBe('Archived');
    });

    it('should handle statuses with multiple hyphens', () => {
      expect(formatStatus('to-read-later')).toBe('To Read Later');
      expect(formatStatus('high-priority-item')).toBe('High Priority Item');
    });

    it('should handle edge cases', () => {
      expect(formatStatus('')).toBe('');
      expect(formatStatus('a')).toBe('A');
      expect(formatStatus('test-status')).toBe('Test Status');
    });
  });

  describe('formatTime', () => {
    it('should format recent times correctly', () => {
      const now = Date.now();

      // Just now (less than 1 minute)
      expect(formatTime(now)).toBe('Just now');
      expect(formatTime(now - 30000)).toBe('Just now'); // 30 seconds ago

      // Minutes ago
      expect(formatTime(now - 60000)).toBe('1m ago'); // 1 minute ago
      expect(formatTime(now - 120000)).toBe('2m ago'); // 2 minutes ago
      expect(formatTime(now - 300000)).toBe('5m ago'); // 5 minutes ago
    });

    it('should format hours correctly', () => {
      const now = Date.now();

      // Hours ago
      expect(formatTime(now - 3600000)).toBe('1h ago'); // 1 hour ago
      expect(formatTime(now - 7200000)).toBe('2h ago'); // 2 hours ago
      expect(formatTime(now - 18000000)).toBe('5h ago'); // 5 hours ago
    });

    it('should format days correctly', () => {
      const now = Date.now();

      // Days ago (less than 7 days)
      expect(formatTime(now - 86400000)).toBe('1d ago'); // 1 day ago
      expect(formatTime(now - 172800000)).toBe('2d ago'); // 2 days ago
      expect(formatTime(now - 518400000)).toBe('6d ago'); // 6 days ago

      // 7 days or older should return date string
      const sevenDaysAgo = now - 604800000; // 7 days ago
      const result = formatTime(sevenDaysAgo);
      expect(typeof result).toBe('string');
      expect(result).not.toBe('7d ago');
      expect(result).not.toMatch(/^\d+d ago$/);
    });

    it('should format older dates with locale date string', () => {
      const oldDate = new Date('2024-01-01').getTime();
      const result = formatTime(oldDate);

      // Should return a localized date string
      expect(typeof result).toBe('string');
      expect(result).not.toBe('Just now');
      expect(result).not.toMatch(/^\d+[mhd] ago$/);
    });

    it('should handle edge cases', () => {
      // Future timestamps
      const future = Date.now() + 60000;
      expect(formatTime(future)).toBe('Just now');

      // Very old timestamps
      const veryOld = new Date('2020-01-01').getTime();
      const result = formatTime(veryOld);
      expect(typeof result).toBe('string');
      expect(result).not.toBe('Just now');
    });
  });

  describe('Integration', () => {
    it('should work together consistently', () => {
      const now = Date.now();
      const bookmark = {
        status: 'good-reference',
        created_at: now - 3600000, // 1 hour ago
      };

      const formattedStatus = formatStatus(bookmark.status);
      const formattedTime = formatTime(bookmark.created_at);

      expect(formattedStatus).toBe('Good Reference');
      expect(formattedTime).toBe('1h ago');
    });

    it('should handle various status and time combinations', () => {
      const testCases = [
        { status: 'low-value', time: Date.now() - 120000 }, // 2 minutes ago
        { status: 'revisit-later', time: Date.now() - 7200000 }, // 2 hours ago
        { status: 'read', time: Date.now() - 172800000 }, // 2 days ago
      ];

      testCases.forEach(({ status, time }) => {
        const formattedStatus = formatStatus(status);
        const formattedTime = formatTime(time);

        expect(formattedStatus).toMatch(/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/);
        expect(formattedTime).toMatch(
          /^(Just now|\d+[mhd] ago|\d+\/\d+\/\d+)$/
        );
      });
    });
  });
});
