import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from '../../utils/retry-utils.js';
import { RETRY_CONFIG } from '../../utils/constants.js';

/**
 * @fileoverview Unit tests for retry-utils
 * @module retry-utils.test
 * @description Tests for retry logic with exponential backoff
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

describe('retry-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    it('should return result immediately on first successful attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryWithBackoff(mockFn, 3, 1000);

      // Advance time for first retry delay (1000ms * 2^0 = 1000ms)
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry with exponential backoff delays', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryWithBackoff(mockFn, 3, 1000);

      // First retry delay: 1000ms * 2^0 = 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry delay: 1000ms * 2^1 = 2000ms
      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use default retry config when not provided', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw error after exhausting all retries', async () => {
      const error = new Error('All attempts failed');
      const mockFn = vi.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(mockFn, 3, 1000);

      // Advance time for all retry delays
      await vi.advanceTimersByTimeAsync(1000); // First retry delay
      await vi.advanceTimersByTimeAsync(2000); // Second retry delay

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e.message).toBe('All attempts failed');
      }
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use custom maxRetries', async () => {
      const error = new Error('All attempts failed');
      const mockFn = vi.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(mockFn, 5, 1000);

      // Advance time for all retry delays (4 retries after initial attempt)
      await vi.advanceTimersByTimeAsync(1000); // Retry 1: 1000ms * 2^0
      await vi.advanceTimersByTimeAsync(2000); // Retry 2: 1000ms * 2^1
      await vi.advanceTimersByTimeAsync(4000); // Retry 3: 1000ms * 2^2
      await vi.advanceTimersByTimeAsync(8000); // Retry 4: 1000ms * 2^3

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e.message).toBe('All attempts failed');
      }
      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    it('should use custom baseDelay', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryWithBackoff(mockFn, 3, 500);

      // First retry delay: 500ms * 2^0 = 500ms
      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should calculate exponential backoff correctly', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockRejectedValueOnce(new Error('Attempt 3'))
        .mockResolvedValueOnce('success');

      const baseDelay = 1000;
      const resultPromise = retryWithBackoff(mockFn, 4, baseDelay);

      // Verify delays: 1000ms, 2000ms, 4000ms
      await vi.advanceTimersByTimeAsync(1000); // First retry: 1000 * 2^0
      expect(mockFn).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(2000); // Second retry: 1000 * 2^1
      expect(mockFn).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(4000); // Third retry: 1000 * 2^2
      expect(mockFn).toHaveBeenCalledTimes(4);

      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should handle async functions that return promises', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValue(Promise.resolve('async success'));

      const resultPromise = retryWithBackoff(mockFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('async success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle different error types', async () => {
      const networkError = new Error('Network error');
      const mockFn = vi.fn().mockRejectedValue(networkError);

      const resultPromise = retryWithBackoff(mockFn, 2, 1000);

      await vi.advanceTimersByTimeAsync(1000);

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e.message).toBe('Network error');
      }
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should work with RETRY_CONFIG defaults', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      // Verify it uses RETRY_CONFIG defaults
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(3);
      expect(RETRY_CONFIG.BASE_DELAY).toBe(1000);
    });

    it('should not delay before first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn, 3, 1000);
      // Don't advance time - first attempt should be immediate
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle zero maxRetries by not calling function', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const resultPromise = retryWithBackoff(mockFn, 0, 1000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      // When maxRetries is 0, the loop doesn't run, so function is never called
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should handle single retry attempt', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryWithBackoff(mockFn, 2, 1000);

      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
